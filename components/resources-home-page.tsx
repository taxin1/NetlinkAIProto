"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicNavigation } from "@/components/public-navigation"
import {
  BookOpen,
  Rocket,
  Settings,
  DollarSign,
  HelpCircle,
  ArrowRight,
  FileText,
  CheckCircle2,
  Sparkles
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

const resourceSections = [
  {
    title: "Getting Started",
    description: "New to Network Link AI? Start here to learn the basics and get up and running quickly.",
    href: "/resources/getting-started",
    icon: Rocket,
    color: "from-blue-500 to-cyan-500",
    features: ["Quick setup guide", "First steps", "Basic features overview"]
  },
  {
    title: "Setup Guide",
    description: "Complete step-by-step setup instructions for all features and integrations.",
    href: "/resources/setup-guide",
    icon: Settings,
    color: "from-purple-500 to-pink-500",
    features: ["Profile setup", "Connect integrations", "Feature guides"]
  },
  {
    title: "Pricing",
    description: "Learn about our pricing plans, features, and subscription options.",
    href: "/resources/pricing",
    icon: DollarSign,
    color: "from-green-500 to-emerald-500",
    features: ["Plan comparison", "Feature breakdown", "Billing information"]
  },
  {
    title: "FAQ",
    description: "Find answers to frequently asked questions about Network Link AI and its features.",
    href: "/resources/faq",
    icon: HelpCircle,
    color: "from-orange-500 to-red-500",
    features: ["Common questions", "Troubleshooting", "Best practices"]
  },
]

export function ResourcesHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <PublicNavigation />
      {/* Hero Section */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Resources & Documentation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Everything You Need to Know
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive guides, setup instructions, and documentation to help you get the most out of Network Link AI.
            </p>
          </motion.div>

          {/* Resource Cards Grid */}
          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12"
          >
            {resourceSections.map((section, index) => (
              <motion.div key={section.href} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50 group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${section.color} opacity-90 group-hover:opacity-100 transition-opacity`}>
                        <section.icon className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{section.title}</CardTitle>
                    <CardDescription className="text-base">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {section.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={section.href}>
                      <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Explore {section.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="mt-16">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Quick Links
                </CardTitle>
                <CardDescription>
                  Popular documentation and guides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/resources/setup-guide#profile-setup" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Profile Setup</span>
                  </Link>
                  <Link href="/resources/setup-guide#integrations" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Connect Integrations</span>
                  </Link>
                  <Link href="/resources/setup-guide#features" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Using Features</span>
                  </Link>
                  <Link href="/resources/faq#troubleshooting" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Troubleshooting</span>
                  </Link>
                  <Link href="/resources/pricing" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Pricing Plans</span>
                  </Link>
                  <Link href="/resources/getting-started" className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/10 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm">Getting Started</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
