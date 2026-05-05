import { Request, Response, NextFunction } from 'express'
import { isFeatureEnabled } from '../config/features'

type FeatureName = 'onlineBooking' | 'loyaltyProgram' | 'smsNotifications' | 'whatsappAutomation' | 'aiChatbot' | 'advancedAnalytics' | 'multiLocation' | 'inventoryManagement'

export function requireFeature(feature: FeatureName) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (!isFeatureEnabled(feature)) {
      return res.status(403).json({
        success: false,
        error: `Feature "${feature}" is not enabled for this deployment`,
      })
    }
    next()
  }
}
