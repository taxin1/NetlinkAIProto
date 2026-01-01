export type PlanName = 'free' | 'professional' | 'enterprise'

export interface PlanLimits {
  // AI Features
  aiEmailGenerationPerMonth: number | null // null = unlimited
  aiAssistantMessagesPerDay: number | null
  businessCardScansPerMonth: number | null
  aiTrainingEnabled: boolean
  
  // Email & Communication
  dailyEmailLimit: number | null
  monthlyEmailLimit: number | null
  emailCampaignsMaxContacts: number | null
  emailSchedulingEnabled: boolean
  abTestingEnabled: boolean
  
  // Contacts & Networking
  maxContacts: number | null
  eventsPerMonth: number | null
  contactScoringEnabled: boolean
  
  // Networking Mode & AI Campaigns
  networkingModeFreeTrial: number // Free trial uses (100)
  aiCampaignFreeTrial: number // Free trial uses (100)
  
  // Storage & Limits
  databaseStorageGB: number | null
  analyticsHistoryDays: number | null
  
  // Integrations
  voiceAssistantEnabled: boolean
  advancedIntegrationsEnabled: boolean
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    // AI Features
    aiEmailGenerationPerMonth: 5,
    aiAssistantMessagesPerDay: 20,
    businessCardScansPerMonth: 500,
    aiTrainingEnabled: false,
    
    // Email & Communication
    dailyEmailLimit: 500, // Gmail Free limit
    monthlyEmailLimit: 15000,
    emailCampaignsMaxContacts: 50,
    emailSchedulingEnabled: false,
    abTestingEnabled: false,
    
    // Contacts & Networking
    maxContacts: 100,
    eventsPerMonth: 10,
    contactScoringEnabled: false,
    
    // Networking Mode & AI Campaigns
    networkingModeFreeTrial: 100, // 100 free uses
    aiCampaignFreeTrial: 100, // 100 free uses
    
    // Storage & Limits
    databaseStorageGB: 0.5,
    analyticsHistoryDays: 7,
    
    // Integrations
    voiceAssistantEnabled: false,
    advancedIntegrationsEnabled: false,
  },
  professional: {
    // AI Features
    aiEmailGenerationPerMonth: null, // unlimited
    aiAssistantMessagesPerDay: null, // unlimited
    businessCardScansPerMonth: null, // unlimited
    aiTrainingEnabled: true,
    
    // Email & Communication
    dailyEmailLimit: 2000, // Google Workspace limit
    monthlyEmailLimit: 60000,
    emailCampaignsMaxContacts: null, // unlimited
    emailSchedulingEnabled: true,
    abTestingEnabled: true,
    
    // Contacts & Networking
    maxContacts: null, // unlimited
    eventsPerMonth: null, // unlimited
    contactScoringEnabled: true,
    
    // Networking Mode & AI Campaigns
    networkingModeFreeTrial: null, // unlimited for Pro
    aiCampaignFreeTrial: null, // unlimited for Pro
    
    // Storage & Limits
    databaseStorageGB: 8,
    analyticsHistoryDays: null, // unlimited
    
    // Integrations
    voiceAssistantEnabled: true,
    advancedIntegrationsEnabled: true,
  },
  enterprise: {
    // AI Features
    aiEmailGenerationPerMonth: null, // unlimited
    aiAssistantMessagesPerDay: null, // unlimited
    businessCardScansPerMonth: null, // unlimited
    aiTrainingEnabled: true,
    
    // Email & Communication
    dailyEmailLimit: null, // unlimited
    monthlyEmailLimit: null, // unlimited
    emailCampaignsMaxContacts: null, // unlimited
    emailSchedulingEnabled: true,
    abTestingEnabled: true,
    
    // Contacts & Networking
    maxContacts: null, // unlimited
    eventsPerMonth: null, // unlimited
    contactScoringEnabled: true,
    
    // Networking Mode & AI Campaigns
    networkingModeFreeTrial: null, // unlimited for Enterprise
    aiCampaignFreeTrial: null, // unlimited for Enterprise
    
    // Storage & Limits
    databaseStorageGB: null, // unlimited
    analyticsHistoryDays: null, // unlimited
    
    // Integrations
    voiceAssistantEnabled: true,
    advancedIntegrationsEnabled: true,
  },
}

export const FREE_TRIAL_LIMIT = 100
