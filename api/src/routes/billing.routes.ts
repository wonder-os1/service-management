import { Router, Response } from 'express'
import { prisma } from '../config/database'
import { authenticate, AuthRequest } from '../middleware/auth'
import { requireStaff } from '../middleware/rbac'
import { validate } from '../middleware/validate'
import { createInvoiceSchema, createPaymentSchema, paginationSchema } from '../validators'
import { createOrder } from '../utils/razorpay'
import { sendPaymentReceipt } from '../utils/email'
import { env } from '../config/env'
import crypto from 'crypto'

const router = Router()

function generateInvoiceNumber(): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  return `SRV-${yy}${mm}${dd}-${rand}`
}

// GET /api/billing/invoices
router.get('/invoices', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query)
    const skip = (page - 1) * limit
    const { status } = req.query as Record<string, string>

    const where: any = {}

    if (req.user!.role === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { userId: req.user!.userId } })
      if (client) where.clientId = client.id
    }

    if (status) where.status = status

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: { include: { user: { select: { name: true, email: true } } } },
          booking: { select: { id: true, date: true, startTime: true } },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ])

    res.json({
      success: true,
      data: invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/invoices
router.post('/invoices', authenticate, requireStaff, validate(createInvoiceSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { clientId, bookingId, items, discount, notes } = req.body

    const subtotal = items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0)
    const tax = Math.round((subtotal - discount) * env.GST_RATE)
    const total = subtotal - discount + tax

    const lineItems = items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.unitPrice * item.quantity,
    }))

    let invoiceNumber = generateInvoiceNumber()
    for (let attempt = 0; attempt < 3; attempt++) {
      const exists = await prisma.invoice.findUnique({ where: { invoiceNumber } })
      if (!exists) break
      invoiceNumber = generateInvoiceNumber()
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        bookingId,
        items: lineItems,
        subtotal,
        tax,
        discount,
        total,
        notes,
      },
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
      },
    })

    await prisma.auditLog.create({
      data: { userId: req.user!.userId, action: 'CREATE', entity: 'invoice', entityId: invoice.id },
    })

    res.status(201).json({ success: true, data: invoice })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/payments
router.post('/payments', authenticate, validate(createPaymentSchema), async (req: AuthRequest, res: Response, next) => {
  try {
    const { invoiceId, method } = req.body

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: { include: { user: { select: { name: true, email: true } } } } },
    })

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' })
    }

    if (invoice.status === 'PAID') {
      return res.status(400).json({ success: false, error: 'Invoice already paid' })
    }

    if (method === 'razorpay') {
      const order = await createOrder(invoice.total, 'INR', `invoice_${invoice.invoiceNumber}`)

      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          amount: invoice.total,
          method,
          razorpayOrderId: order.id,
        },
      })

      return res.json({
        success: true,
        data: {
          payment,
          razorpayOrder: order,
          key: env.RAZORPAY_KEY_ID,
        },
      })
    }

    // Cash/card/UPI — mark as paid immediately
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: invoice.total,
        method,
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
    })

    // Send receipt
    const amountStr = `₹${(invoice.total / 100).toLocaleString('en-IN')}`
    sendPaymentReceipt(invoice.client.user.email, {
      clientName: invoice.client.user.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: amountStr,
    }).catch(console.error)

    res.json({ success: true, data: payment })
  } catch (error) {
    next(error)
  }
})

// POST /api/billing/payments/verify (Razorpay callback)
router.post('/payments/verify', authenticate, async (req: AuthRequest, res: Response, next) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, paymentId } = req.body

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !paymentId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    const isValid = crypto.timingSafeEqual(
      Buffer.from(razorpaySignature),
      Buffer.from(expectedSignature)
    )

    if (!isValid) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
      })
      return res.status(400).json({ success: false, error: 'Invalid payment signature' })
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', razorpayPaymentId, paidAt: new Date() },
      include: { invoice: { include: { client: { include: { user: { select: { name: true, email: true } } } } } } },
    })

    await prisma.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'PAID' },
    })

    // Send receipt
    const amountStr = `₹${(payment.amount / 100).toLocaleString('en-IN')}`
    sendPaymentReceipt(payment.invoice.client.user.email, {
      clientName: payment.invoice.client.user.name,
      invoiceNumber: payment.invoice.invoiceNumber,
      amount: amountStr,
    }).catch(console.error)

    res.json({ success: true, data: payment })
  } catch (error) {
    next(error)
  }
})

export { router as billingRoutes }
