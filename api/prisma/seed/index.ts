import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Service Business Hub database...')

  // ---- Service Categories ----
  const categories = await Promise.all([
    prisma.serviceCategory.upsert({
      where: { slug: 'hair-care' },
      update: {},
      create: { name: 'Hair Care', slug: 'hair-care', description: 'Haircuts, styling, coloring & treatments', icon: 'Scissors', sortOrder: 1 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'skin-care' },
      update: {},
      create: { name: 'Skin Care', slug: 'skin-care', description: 'Facials, peels, dermatology treatments', icon: 'Sparkles', sortOrder: 2 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'spa-massage' },
      update: {},
      create: { name: 'Spa & Massage', slug: 'spa-massage', description: 'Relaxation, deep tissue, hot stone & more', icon: 'Leaf', sortOrder: 3 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'nail-care' },
      update: {},
      create: { name: 'Nail Care', slug: 'nail-care', description: 'Manicure, pedicure, nail art', icon: 'Paintbrush', sortOrder: 4 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'fitness' },
      update: {},
      create: { name: 'Fitness & Training', slug: 'fitness', description: 'Personal training, group classes, yoga', icon: 'Dumbbell', sortOrder: 5 },
    }),
    prisma.serviceCategory.upsert({
      where: { slug: 'repair-maintenance' },
      update: {},
      create: { name: 'Repair & Maintenance', slug: 'repair-maintenance', description: 'Device repair, appliance servicing, home maintenance', icon: 'Wrench', sortOrder: 6 },
    }),
  ])

  console.log(`Created ${categories.length} service categories`)

  // ---- Services ----
  const services = await Promise.all([
    // Hair Care
    prisma.service.upsert({ where: { slug: 'mens-haircut' }, update: {}, create: { name: "Men's Haircut", slug: 'mens-haircut', description: 'Classic men\'s haircut with wash and style', categoryId: categories[0].id, duration: 30, price: 50000, sortOrder: 1 } }),
    prisma.service.upsert({ where: { slug: 'womens-haircut' }, update: {}, create: { name: "Women's Haircut", slug: 'womens-haircut', description: 'Women\'s haircut with consultation and blow-dry', categoryId: categories[0].id, duration: 60, price: 100000, sortOrder: 2 } }),
    prisma.service.upsert({ where: { slug: 'hair-coloring' }, update: {}, create: { name: 'Hair Coloring', slug: 'hair-coloring', description: 'Full head color with premium products', categoryId: categories[0].id, duration: 120, price: 250000, comparePrice: 300000, sortOrder: 3 } }),
    prisma.service.upsert({ where: { slug: 'hair-spa' }, update: {}, create: { name: 'Hair Spa Treatment', slug: 'hair-spa', description: 'Deep conditioning spa treatment for damaged hair', categoryId: categories[0].id, duration: 90, price: 150000, sortOrder: 4 } }),

    // Skin Care
    prisma.service.upsert({ where: { slug: 'classic-facial' }, update: {}, create: { name: 'Classic Facial', slug: 'classic-facial', description: 'Deep cleansing facial with extraction and mask', categoryId: categories[1].id, duration: 60, price: 150000, sortOrder: 1 } }),
    prisma.service.upsert({ where: { slug: 'gold-facial' }, update: {}, create: { name: 'Gold Facial', slug: 'gold-facial', description: 'Premium gold-infused facial for radiant skin', categoryId: categories[1].id, duration: 90, price: 300000, comparePrice: 350000, sortOrder: 2 } }),
    prisma.service.upsert({ where: { slug: 'chemical-peel' }, update: {}, create: { name: 'Chemical Peel', slug: 'chemical-peel', description: 'Professional chemical peel for skin rejuvenation', categoryId: categories[1].id, duration: 45, price: 200000, sortOrder: 3 } }),

    // Spa & Massage
    prisma.service.upsert({ where: { slug: 'swedish-massage' }, update: {}, create: { name: 'Swedish Massage', slug: 'swedish-massage', description: 'Full body Swedish relaxation massage', categoryId: categories[2].id, duration: 60, price: 200000, sortOrder: 1 } }),
    prisma.service.upsert({ where: { slug: 'deep-tissue' }, update: {}, create: { name: 'Deep Tissue Massage', slug: 'deep-tissue', description: 'Intensive deep tissue work for chronic tension', categoryId: categories[2].id, duration: 90, price: 300000, sortOrder: 2 } }),
    prisma.service.upsert({ where: { slug: 'hot-stone' }, update: {}, create: { name: 'Hot Stone Therapy', slug: 'hot-stone', description: 'Heated basalt stones with massage therapy', categoryId: categories[2].id, duration: 90, price: 350000, sortOrder: 3 } }),

    // Nail Care
    prisma.service.upsert({ where: { slug: 'manicure' }, update: {}, create: { name: 'Classic Manicure', slug: 'manicure', description: 'Nail shaping, cuticle care, and polish', categoryId: categories[3].id, duration: 45, price: 80000, sortOrder: 1 } }),
    prisma.service.upsert({ where: { slug: 'pedicure' }, update: {}, create: { name: 'Classic Pedicure', slug: 'pedicure', description: 'Foot soak, scrub, nail care, and polish', categoryId: categories[3].id, duration: 60, price: 100000, sortOrder: 2 } }),
    prisma.service.upsert({ where: { slug: 'gel-nails' }, update: {}, create: { name: 'Gel Nail Extension', slug: 'gel-nails', description: 'Full set gel nail extensions with art', categoryId: categories[3].id, duration: 120, price: 250000, sortOrder: 3 } }),

    // Fitness
    prisma.service.upsert({ where: { slug: 'personal-training' }, update: {}, create: { name: 'Personal Training Session', slug: 'personal-training', description: 'One-on-one training with certified trainer', categoryId: categories[4].id, duration: 60, price: 100000, sortOrder: 1 } }),
    prisma.service.upsert({ where: { slug: 'yoga-session' }, update: {}, create: { name: 'Yoga Session', slug: 'yoga-session', description: 'Private yoga class with certified instructor', categoryId: categories[4].id, duration: 60, price: 80000, sortOrder: 2 } }),

    // Repair
    prisma.service.upsert({ where: { slug: 'phone-repair' }, update: {}, create: { name: 'Smartphone Screen Repair', slug: 'phone-repair', description: 'Screen replacement for all major brands', categoryId: categories[5].id, duration: 60, price: 200000, sortOrder: 1 } }),
    prisma.service.upsert({ where: { slug: 'laptop-service' }, update: {}, create: { name: 'Laptop Full Service', slug: 'laptop-service', description: 'Complete cleaning, thermal paste, OS optimization', categoryId: categories[5].id, duration: 120, price: 150000, sortOrder: 2 } }),
  ])

  console.log(`Created ${services.length} services`)

  // ---- Admin User ----
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@servicehub.local' },
    update: {},
    create: {
      name: 'Service Hub Admin',
      email: 'admin@servicehub.local',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91-9000000001',
    },
  })
  console.log(`Admin user: ${admin.email}`)

  // ---- Providers ----
  const providerPassword = await bcrypt.hash('Provider@123', 12)

  const provider1 = await prisma.user.upsert({
    where: { email: 'meera@servicehub.local' },
    update: {},
    create: {
      name: 'Meera Sharma',
      email: 'meera@servicehub.local',
      password: providerPassword,
      role: 'PROVIDER',
      phone: '+91-9000000010',
      provider: {
        create: {
          specialization: 'Hair Styling & Coloring',
          qualifications: ['L\'Oreal Professional Certified', 'Advanced Coloring'],
          experience: 8,
          bio: 'Expert hair stylist with 8 years of experience in premium salons.',
          categoryId: categories[0].id,
          rating: 4.8,
          totalReviews: 45,
          schedule: {
            mon: [{ start: '09:00', end: '18:00' }],
            tue: [{ start: '09:00', end: '18:00' }],
            wed: [{ start: '09:00', end: '18:00' }],
            thu: [{ start: '09:00', end: '18:00' }],
            fri: [{ start: '09:00', end: '18:00' }],
            sat: [{ start: '10:00', end: '16:00' }],
          },
        },
      },
    },
  })

  const provider2 = await prisma.user.upsert({
    where: { email: 'ravi@servicehub.local' },
    update: {},
    create: {
      name: 'Ravi Kumar',
      email: 'ravi@servicehub.local',
      password: providerPassword,
      role: 'PROVIDER',
      phone: '+91-9000000020',
      provider: {
        create: {
          specialization: 'Spa & Massage Therapy',
          qualifications: ['Certified Massage Therapist', 'Aromatherapy Specialist'],
          experience: 6,
          bio: 'Certified massage therapist specializing in deep tissue and therapeutic massage.',
          categoryId: categories[2].id,
          rating: 4.6,
          totalReviews: 32,
          schedule: {
            mon: [{ start: '10:00', end: '20:00' }],
            tue: [{ start: '10:00', end: '20:00' }],
            wed: [{ start: '10:00', end: '20:00' }],
            thu: [{ start: '10:00', end: '20:00' }],
            fri: [{ start: '10:00', end: '20:00' }],
            sat: [{ start: '10:00', end: '17:00' }],
          },
        },
      },
    },
  })

  const provider3 = await prisma.user.upsert({
    where: { email: 'priya@servicehub.local' },
    update: {},
    create: {
      name: 'Priya Patel',
      email: 'priya@servicehub.local',
      password: providerPassword,
      role: 'PROVIDER',
      phone: '+91-9000000030',
      provider: {
        create: {
          specialization: 'Skin Care & Aesthetics',
          qualifications: ['Dermatology Certificate', 'Advanced Facial Techniques'],
          experience: 5,
          bio: 'Skincare specialist focused on rejuvenation and anti-aging treatments.',
          categoryId: categories[1].id,
          rating: 4.9,
          totalReviews: 28,
          schedule: {
            mon: [{ start: '09:00', end: '17:00' }],
            tue: [{ start: '09:00', end: '17:00' }],
            wed: [{ start: '09:00', end: '17:00' }],
            thu: [{ start: '09:00', end: '17:00' }],
            fri: [{ start: '09:00', end: '17:00' }],
          },
        },
      },
    },
  })

  console.log(`Created 3 service providers`)

  // ---- Sample Clients ----
  const clientPassword = await bcrypt.hash('Client@123', 12)

  const client1 = await prisma.user.upsert({
    where: { email: 'anita@example.com' },
    update: {},
    create: {
      name: 'Anita Desai',
      email: 'anita@example.com',
      password: clientPassword,
      role: 'CLIENT',
      phone: '+91-9800000001',
      client: {
        create: {
          gender: 'Female',
          city: 'Mumbai',
          state: 'Maharashtra',
          loyaltyTier: 'GOLD',
          loyaltyPoints: 450,
          totalSpent: 1250000,
          visitCount: 12,
        },
      },
    },
  })

  const client2 = await prisma.user.upsert({
    where: { email: 'rahul@example.com' },
    update: {},
    create: {
      name: 'Rahul Verma',
      email: 'rahul@example.com',
      password: clientPassword,
      role: 'CLIENT',
      phone: '+91-9800000002',
      client: {
        create: {
          gender: 'Male',
          city: 'Delhi',
          state: 'Delhi',
          loyaltyTier: 'SILVER',
          loyaltyPoints: 180,
          totalSpent: 450000,
          visitCount: 5,
        },
      },
    },
  })

  console.log(`Created 2 sample clients`)

  // ---- Settings ----
  const defaultSettings = [
    { key: 'business.name', value: 'Service Business Hub' },
    { key: 'business.phone', value: '+91-1800-000-000' },
    { key: 'business.email', value: 'info@servicehub.local' },
    { key: 'business.address', value: 'Mumbai, Maharashtra, India' },
    { key: 'business.gst', value: '18' },
    { key: 'business.currency', value: 'INR' },
    { key: 'booking.autoConfirm', value: false },
    { key: 'booking.cancelWindow', value: 24 },
    { key: 'loyalty.pointsPerHundred', value: 10 },
    { key: 'loyalty.bronzeThreshold', value: 0 },
    { key: 'loyalty.silverThreshold', value: 200 },
    { key: 'loyalty.goldThreshold', value: 500 },
    { key: 'loyalty.platinumThreshold', value: 1000 },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    })
  }

  console.log(`Created ${defaultSettings.length} settings`)
  console.log('\nSeed completed!')
  console.log('Default credentials:')
  console.log('  Admin: admin@servicehub.local / Admin@123')
  console.log('  Provider: meera@servicehub.local / Provider@123')
  console.log('  Client: anita@example.com / Client@123')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
