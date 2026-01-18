"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublicNavigation } from "@/components/public-navigation"
import {
  DollarSign,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crown,
  Rocket,
  Building2,
  Zap,
  Mail,
  Users,
  Database,
  Bot,
  Calendar,
  Briefcase,
  BarChart3,
  Wand2
} from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out AI-powered networking",
    icon: Rocket,
    color: "from-blue-500 to-cyan-500",
    features: [
      "Basic AI Email Generation (5/month)",
      "AI Assistant (Text only, 20 messages/day)",
      "AI Business Card Scanner (500 scans/month)",
      "Up to 100 Contacts",
      "500 emails/day (Gmail Free)",
      "Basic Email Campaigns (50 contacts max)",
      "Google Calendar Sync (read-only)",
      "Basic Portfolio Builder",
      "500 MB Database Storage",
      "Basic Analytics (7-day history)"
    ],
    cta: "Get Started Free",
    ctaLink: "/auth/signup"
  },
  {
    name: "Professional",
    price: "$6",
    originalPrice: "$15",
    period: "per month",
    description: "For professionals who need unlimited power and advanced features",
    icon: Crown,
    color: "from-purple-500 to-pink-500",
    badge: "Limited Time Offer",
    features: [
      "Unlimited AI Email Generation",
      "AI Assistant (Text & Voice, unlimited)",
      "AI Business Card Scanner (unlimited)",
      "Advanced AI Training & Memory System",
      "Unlimited Contacts",
      "2,000 emails/day (Google Workspace)",
      "Advanced Email Campaigns (unlimited contacts)",
      "Full Google Calendar Integration",
      "AI-Powered Portfolio Builder",
      "10 GB Database Storage",
      "Advanced Analytics (unlimited history)",
      "Priority Support"
    ],
    cta: "Buy Professional",
    ctaLink: "/checkout?plan=professional"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    description: "For teams and organizations with advanced requirements",
    icon: Building2,
    color: "from-orange-500 to-red-500",
    features: [
      "Everything in Professional",
      "Team Collaboration Features",
      "Custom AI Models & Training",
      "Dedicated Account Manager",
      "Custom Integrations",
      "Advanced Security & Compliance",
      "SLA Guarantees",
      "On-premise Deployment Options",
      "Custom Billing & Invoicing",
      "Training & Onboarding Support"
    ],
    cta: "Contact Us",
    ctaLink: "mailto:networklinkai@gmail.com"
  },
]

export function ResourcesPricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <PublicNavigation />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-12"
          >
            <Link href="/resources" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Resources</span>
            </Link>

            <motion.div variants={itemVariants} className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Pricing</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that's right for you. All plans include core features with varying limits and capabilities.
              </p>
            </motion.div>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            {plans.map((plan, index) => (
              <motion.div key={plan.name} variants={itemVariants}>
                <Card className={`h-full hover:shadow-lg transition-all duration-300 border-2 ${plan.badge ? 'border-primary/50 relative' : ''
                  }`}>
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      {plan.badge}
                    </Badge>
                  )}
                  <CardHeader>
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${plan.color} opacity-90 w-fit mb-4`}>
                      <plan.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="flex flex-col mb-2">
                      {plan.originalPrice && (
                        <span className="text-muted-foreground line-through text-lg mb-0.5">{plan.originalPrice}</span>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.period !== "forever" && (
                          <span className="text-muted-foreground">/{plan.period}</span>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-base">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.ctaLink}>
                      <Button className="w-full h-auto py-2.5" variant={plan.badge ? "default" : "outline"}>
                        <div className="flex flex-col items-center leading-tight">
                          <span>{plan.cta}</span>
                        </div>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Feature Comparison */}
          <motion.div variants={itemVariants} className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Feature Comparison</CardTitle>
                <CardDescription>
                  Detailed comparison of features across all plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Feature</th>
                        <th className="text-center p-4">Free</th>
                        <th className="text-center p-4">Professional</th>
                        <th className="text-center p-4">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-4 font-medium">AI Email Generation</td>
                        <td className="text-center p-4">5/month</td>
                        <td className="text-center p-4">Unlimited</td>
                        <td className="text-center p-4">Unlimited</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4 font-medium">AI Assistant</td>
                        <td className="text-center p-4">20/day (Text)</td>
                        <td className="text-center p-4">Unlimited (Text & Voice)</td>
                        <td className="text-center p-4">Unlimited + Custom</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4 font-medium">Business Card Scans</td>
                        <td className="text-center p-4">500/month</td>
                        <td className="text-center p-4">Unlimited</td>
                        <td className="text-center p-4">Unlimited</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4 font-medium">Contacts</td>
                        <td className="text-center p-4">100 max</td>
                        <td className="text-center p-4">Unlimited</td>
                        <td className="text-center p-4">Unlimited</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4 font-medium">Daily Emails</td>
                        <td className="text-center p-4">500</td>
                        <td className="text-center p-4">2,000</td>
                        <td className="text-center p-4">Custom</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-4 font-medium">Storage</td>
                        <td className="text-center p-4">500 MB</td>
                        <td className="text-center p-4">10 GB</td>
                        <td className="text-center p-4">Custom</td>
                      </tr>
                      <tr>
                        <td className="p-4 font-medium">Support</td>
                        <td className="text-center p-4">Community</td>
                        <td className="text-center p-4">Priority</td>
                        <td className="text-center p-4">Dedicated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Billing Information */}
          <motion.div variants={itemVariants} className="mb-12">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Payment Methods</h3>
                  <p className="text-muted-foreground">
                    We accept all major credit cards and PayPal. All payments are processed securely through our payment partners.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Cancellation</h3>
                  <p className="text-muted-foreground">
                    You can cancel your subscription at any time. No cancellation fees or penalties. Your subscription will remain active until the end of the current billing period.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Refunds</h3>
                  <p className="text-muted-foreground">
                    We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Upgrades & Downgrades</h3>
                  <p className="text-muted-foreground">
                    You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing is prorated.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Start with our free plan and upgrade when you need more features. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup">
                    <Button size="lg">
                      Create Free Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/pricing">
                    <Button size="lg" variant="outline">
                      View Full Pricing Page
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
