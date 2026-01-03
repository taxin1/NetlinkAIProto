"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublicNavigation } from "@/components/public-navigation"
import {
  Check,
  X,
  Sparkles,
  Mail,
  Users,
  Zap,
  Database,
  Bot,
  Calendar,
  Briefcase,
  BarChart3,
  Wand2,
  ArrowRight,
  Crown,
  Rocket,
  Building2
} from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out AI-powered networking",
    icon: Rocket,
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/20",
    badge: null,
    features: {
      "AI Features": [
        "Basic AI Email Generation (5/month)",
        "AI Assistant (Text only, 20 messages/day)",
        "AI Business Card Scanner (500 scans/month)",
        "No AI Training/Memory",
      ],
      "Email & Communication": [
        "500 emails/day (Gmail Free)",
        "Basic Email Campaigns (50 contacts max)",
        "Standard Email Templates",
        "Gmail OAuth (read-only)",
      ],
      "Contacts & Networking": [
        "Up to 100 Contacts",
        "Basic Contact Management",
        "Event Tracking (10 events/month)",
        "Basic Networking Events",
      ],
      "Storage & Limits": [
        "500 MB Database Storage",
        "Basic Analytics (7-day history)",
        "Standard Performance",
      ],
      "Integrations": [
        "Google Calendar Sync (read-only)",
        "Gmail OAuth (read-only)",
        "Basic Portfolio Builder",
        "Public Network Profile",
      ],
    },
    limits: {
      "Daily Emails": "500 (Gmail Free)",
      "Contacts": "100 max",
      "Storage": "500 MB",
      "AI Messages": "20/day",
      "Card Scans": "500/month",
    },
    cta: "Get Started Free",
    ctaLink: "/auth/signup",
    popular: false,
  },
  {
    name: "Professional",
    price: "$6",
    originalPrice: "$15",
    period: "per month",
    description: "For professionals who need unlimited power and advanced features",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/30",
    badge: "Limited Time Offer",
    features: {
      "AI Features": [
        "Unlimited AI Email Generation",
        "AI Assistant (Text & Voice, unlimited)",
        "AI Business Card Scanner (unlimited)",
        "Advanced AI Training & Memory System",
        "Priority AI Processing",
        "Custom AI Prompts",
        "AI-Powered Contact Insights",
      ],
      "Email & Communication": [
        "2,000 emails/day (Google Workspace)",
        "Unlimited Email Campaigns",
        "Advanced Email Analytics & Reports",
        "A/B Testing for Campaigns",
        "Email Scheduling & Automation",
        "Email Templates Library",
        "Bounce & Delivery Tracking",
      ],
      "Contacts & Networking": [
        "Unlimited Contacts",
        "Advanced Contact Segmentation",
        "AI-Powered Contact Scoring",
        "Relationship Mapping & Visualization",
        "Export Contacts (CSV, JSON)",
        "Contact Merge & Deduplication",
        "Custom Contact Fields",
      ],
      "Storage & Limits": [
        "8 GB Database Storage",
        "Priority Email Support",
        "Advanced Analytics (unlimited history)",
        "Custom Reports & Dashboards",
        "Data Export & Backup",
        "High Performance",
      ],
      "Integrations": [
        "Full Google Calendar Sync (read/write)",
        "Full Gmail Integration (read/send)",
        "LinkedIn Integration",
        "CRM Export (Salesforce, HubSpot)",
        "API Access with Webhooks",
        "Zapier Integration",
        "Custom Integrations",
      ],
    },
    limits: {
      "Daily Emails": "2,000 (Google Workspace)",
      "Contacts": "Unlimited",
      "Storage": "8 GB",
      "AI Messages": "Unlimited",
      "Card Scans": "Unlimited",
    },
    cta: "Contact Us to Buy",
    ctaLink: "mailto:networklinkai@gmail.com",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For teams and organizations with custom needs",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    borderColor: "border-orange-500/20",
    badge: "Enterprise",
    features: {
      "AI Features": [
        "Everything in Professional",
        "Custom AI Models",
        "Dedicated AI Training",
        "White-label AI",
        "AI API Access",
      ],
      "Email & Communication": [
        "Unlimited emails/day",
        "Custom SMTP",
        "Email Deliverability Tools",
        "Dedicated IP",
        "Email Compliance Tools",
      ],
      "Contacts & Networking": [
        "Everything in Professional",
        "Team Collaboration",
        "Shared Contacts",
        "Role-based Access",
        "SSO Integration",
      ],
      "Storage & Limits": [
        "Unlimited Storage",
        "Unlimited API Calls",
        "Dedicated Support",
        "Custom SLA",
        "On-premise Option",
      ],
      "Integrations": [
        "Everything in Professional",
        "Custom Integrations",
        "Dedicated Integration Support",
        "API Rate Limits (Custom)",
        "Priority Webhooks",
      ],
    },
    limits: {
      "Daily Emails": "Unlimited",
      "Users": "Unlimited",
      "Storage": "Unlimited",
      "AI Tools": "All + Custom",
      "Performance": "Dedicated",
    },
    cta: "Contact Us",
    ctaLink: "mailto:networklinkai@gmail.com",
    popular: false,
  },
]

const featureCategories = [
  {
    name: "AI Features",
    icon: Sparkles,
    description: "Advanced AI capabilities for networking",
  },
  {
    name: "Email & Communication",
    icon: Mail,
    description: "Email sending and campaign management",
  },
  {
    name: "Contacts & Networking",
    icon: Users,
    description: "Contact management and networking tools",
  },
  {
    name: "Storage & Limits",
    icon: Database,
    description: "Storage and usage limits",
  },
  {
    name: "Integrations",
    icon: Zap,
    description: "Third-party integrations and APIs",
  },
]

export function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <PublicNavigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 sm:py-28 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Badge className="mb-6 px-4 py-1.5 text-sm font-semibold bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 mr-2" />
              Simple, Transparent Pricing
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent">
              Choose Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl sm:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            All plans include our core AI-powered networking features. Upgrade for more capacity, advanced features, and priority support.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-6 justify-center items-center text-sm"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-green-300">No credit card required</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Check className="h-4 w-4 text-blue-400" />
              <span className="text-blue-300">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Check className="h-4 w-4 text-purple-400" />
              <span className="text-purple-300">14-day free trial</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto mb-24">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg shadow-purple-500/50">
                      <Crown className="h-3 w-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <Card
                  className={`h-full relative overflow-hidden transition-all duration-500 border-2 ${plan.popular
                    ? `${plan.borderColor} shadow-2xl shadow-purple-500/20 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl`
                    : "border-slate-800/50 bg-slate-900/50 backdrop-blur-xl hover:border-slate-700/50 hover:shadow-xl"
                    }`}
                >
                  {/* Gradient Overlay for Popular Plan */}
                  {plan.popular && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5 pointer-events-none`} />
                  )}

                  {/* Animated Border Glow for Popular Plan */}
                  {plan.popular && (
                    <div className={`absolute inset-0 bg-gradient-to-r ${plan.color} opacity-20 blur-xl -z-10 animate-pulse`} />
                  )}

                  {plan.badge && !plan.popular && (
                    <div className="absolute top-6 right-6 z-10">
                      <Badge variant="outline" className={`${plan.borderColor} bg-slate-800/50`}>
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-6 pt-8">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-3xl font-bold mb-3 text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-slate-400 text-base mb-6 leading-relaxed">{plan.description}</CardDescription>
                    <div className="flex flex-col mb-2">
                      {plan.originalPrice && (
                        <span className="text-slate-500 line-through text-xl mb-1">{plan.originalPrice}</span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{plan.price}</span>
                        {plan.period !== "forever" && (
                          <span className="text-slate-400 text-lg">/{plan.period}</span>
                        )}
                      </div>
                    </div>
                    {plan.period === "forever" && (
                      <p className="text-sm text-slate-500">No credit card required</p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-6 pb-8">
                    {/* Limits Section */}
                    <div className="space-y-3 pb-6 border-b border-slate-800">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">
                        Key Limits
                      </h4>
                      <div className="space-y-3">
                        {Object.entries(plan.limits).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">{key}:</span>
                            <span className="font-semibold text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Features by Category */}
                    <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(plan.features).map(([category, items]) => {
                        const CategoryIcon = featureCategories.find(c => c.name === category)?.icon
                        return (
                          <div key={category} className="space-y-3">
                            <h4 className="font-bold text-sm flex items-center gap-2 text-slate-300 uppercase tracking-wide">
                              {CategoryIcon && (
                                <CategoryIcon className="h-4 w-4 text-cyan-400" />
                              )}
                              {category}
                            </h4>
                            <ul className="space-y-2.5">
                              {items.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm">
                                  <div className="mt-0.5 flex-shrink-0">
                                    {feature.startsWith("❌") ? (
                                      <X className="h-4 w-4 text-red-400" />
                                    ) : (
                                      <Check className="h-4 w-4 text-green-400" />
                                    )}
                                  </div>
                                  <span className={`${feature.startsWith("❌") ? "text-slate-500 line-through" : "text-slate-300"}`}>
                                    {feature.replace("❌", "").trim()}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>

                    <Link href={plan.ctaLink} className="block pt-4">
                      <Button
                        className={`w-full h-12 text-base font-semibold transition-all duration-300 ${plan.popular
                          ? "bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                          : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105"
                          }`}
                        size="lg"
                      >
                        {plan.name === "Professional" ? (
                          <div className="flex flex-col items-center leading-none">
                            <span className="mb-1">{plan.cta}</span>
                            <span className="text-[10px] opacity-80 font-normal">Payment Link Coming Soon</span>
                          </div>
                        ) : plan.cta}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Detailed Limits Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-6xl mx-auto mb-24"
        >
          <Card className="border-2 border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-3xl font-bold mb-3 text-white">Detailed Limits & Features</CardTitle>
              <CardDescription className="text-slate-400 text-lg">
                Comprehensive breakdown of what's included in each plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50">
                      <th className="text-left p-5 font-bold text-slate-300">Feature</th>
                      <th className="text-center p-5 font-bold text-blue-400">Free</th>
                      <th className="text-center p-5 font-bold text-purple-400">Professional</th>
                      <th className="text-center p-5 font-bold text-orange-400">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Daily Email Limit</td>
                      <td className="p-5 text-center text-slate-400">500 (Gmail Free)</td>
                      <td className="p-5 text-center text-slate-300 font-medium">2,000 (Workspace)</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Monthly Email Limit</td>
                      <td className="p-5 text-center text-slate-400">15,000</td>
                      <td className="p-5 text-center text-slate-300 font-medium">60,000</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">AI Email Generation</td>
                      <td className="p-5 text-center text-slate-400">5/month</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">AI Assistant Messages</td>
                      <td className="p-5 text-center text-slate-400">20/day</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Business Card Scans</td>
                      <td className="p-5 text-center text-slate-400">500/month</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Performance</td>
                      <td className="p-5 text-center text-slate-400">Standard</td>
                      <td className="p-5 text-center text-slate-300 font-medium">High</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Dedicated</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">AI Training & Memory</td>
                      <td className="p-5 text-center text-red-400">❌ Not Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Unlimited</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Unlimited + Custom</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Contacts</td>
                      <td className="p-5 text-center text-slate-400">100 max</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Email Campaigns</td>
                      <td className="p-5 text-center text-slate-400">50 contacts max</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Events Tracking</td>
                      <td className="p-5 text-center text-slate-400">10/month</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Database Storage</td>
                      <td className="p-5 text-center text-slate-400">500 MB</td>
                      <td className="p-5 text-center text-slate-300 font-medium">8 GB</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Analytics History</td>
                      <td className="p-5 text-center text-slate-400">7 days</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Advanced Integrations</td>
                      <td className="p-5 text-center text-red-400">❌ Basic only</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ All Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Custom</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Voice Assistant</td>
                      <td className="p-5 text-center text-red-400">❌ Not Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Available</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">A/B Testing</td>
                      <td className="p-5 text-center text-red-400">❌ Not Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Available</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Email Scheduling</td>
                      <td className="p-5 text-center text-red-400">❌ Not Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Available</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Contact Scoring</td>
                      <td className="p-5 text-center text-red-400">❌ Not Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Available</td>
                      <td className="p-5 text-center text-green-400 font-medium">✅ Available</td>
                    </tr>
                    <tr className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-semibold text-slate-300">Users/Accounts</td>
                      <td className="p-5 text-center text-slate-400">1 user</td>
                      <td className="p-5 text-center text-slate-300 font-medium">1 user</td>
                      <td className="p-5 text-center text-slate-300 font-medium">Unlimited</td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">Support</td>
                      <td className="p-4 text-center">Community</td>
                      <td className="p-4 text-center">Priority Email</td>
                      <td className="p-4 text-center">Dedicated</td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="p-4 font-medium">SLA</td>
                      <td className="p-4 text-center">-</td>
                      <td className="p-4 text-center">99.9%</td>
                      <td className="p-4 text-center">99.99%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-slate-500 mt-6 text-center">
                Free plan includes basic features to get started. Upgrade to Professional for unlimited usage and advanced AI capabilities.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mb-24"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-lg">Everything you need to know about our pricing</p>
          </motion.div>
          <div className="space-y-4">
            {[
              {
                q: "What happens if I exceed my email limit?",
                a: "If you exceed your daily email limit, Gmail will temporarily block sending. The limit resets after 24 hours. We recommend upgrading to Professional for higher limits (2,000/day with Google Workspace).",
              },
              {
                q: "What's the difference between Free and Professional?",
                a: "Free plan is perfect for trying out the platform with limited usage (100 contacts, 5 AI emails/month, 20 AI messages/day, 500 card scans/month). Professional removes all limits and adds advanced features like AI training, voice assistant, A/B testing, contact scoring, and unlimited everything.",
              },
              {
                q: "Can I upgrade from Free to Professional?",
                a: "Yes! You can upgrade anytime. Your data will be preserved, and you'll immediately get access to all Professional features. You can also downgrade at any time.",
              },
              {
                q: "Can I use my own email account?",
                a: "Yes! All plans allow you to configure your own email account (Gmail, Outlook, custom SMTP) in Settings → Email Configuration. Your email limits depend on your email provider's plan.",
              },
              {
                q: "What's the difference between Free and Professional?",
                a: "Free includes all core features with 500 emails/day (Gmail Free). Professional adds 2,000 emails/day (Google Workspace), advanced analytics, priority support, and 8GB storage.",
              },
              {
                q: "Can I upgrade or downgrade anytime?",
                a: "Yes, you can change your plan at any time. Upgrades take effect immediately. Downgrades take effect at the end of your billing period.",
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, we offer a 14-day money-back guarantee on Professional plans. Contact support for assistance.",
              },
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
              >
                <Card className="border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl hover:border-slate-700/50 hover:bg-slate-900/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-3 text-white flex items-start gap-3">
                      <span className="text-cyan-400 mt-1">Q{idx + 1}.</span>
                      <span>{faq.q}</span>
                    </h3>
                    <p className="text-slate-400 leading-relaxed pl-8">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <Card className="border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 animate-pulse" />
            <CardContent className="p-12 relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent"
              >
                Ready to Get Started?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-slate-300 mb-10 text-lg leading-relaxed"
              >
                Join thousands of professionals using AI-powered networking to grow their business connections.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex gap-4 justify-center flex-wrap"
              >
                <Link href="/auth/signup">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/public/about">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600">
                    Contact Sales
                  </Button>
                </Link>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  )
}
