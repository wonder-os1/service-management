export interface FeatureFlags {
  onlineBooking: boolean
  loyaltyProgram: boolean
  smsNotifications: boolean
  whatsappAutomation: boolean
  aiChatbot: boolean
  advancedAnalytics: boolean
  multiLocation: boolean
  inventoryManagement: boolean
}

export const defaultFeatures: FeatureFlags = {
  onlineBooking: true,
  loyaltyProgram: true,
  smsNotifications: true,
  whatsappAutomation: false,
  aiChatbot: false,
  advancedAnalytics: false,
  multiLocation: false,
  inventoryManagement: false,
}

export function getFeatureFlags(): FeatureFlags {
  if (typeof window === "undefined") return defaultFeatures

  const stored = localStorage.getItem("featureFlags")
  if (stored) {
    try {
      return { ...defaultFeatures, ...JSON.parse(stored) }
    } catch {
      return defaultFeatures
    }
  }
  return defaultFeatures
}

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags()
  return flags[feature]
}
