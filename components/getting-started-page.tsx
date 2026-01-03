"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublicNavigation } from "@/components/public-navigation"
import { 
  Rocket, 
  CheckCircle2, 
  ArrowRight,
  BookOpen,
  Settings,
  Zap,
  Users,
  Mail,
  Calendar,
  Briefcase,
  BarChart3,
  Bot,
  Scan,
  Sparkles,
  ArrowLeft
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
      ease: "easeOut",
    },
  },
}

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up for Netlink using your email address. No credit card required to get started.",
    icon: Users,
    color: "from-blue-500 to-cyan-500"
  },
  {
    number: "02",
    title: "Complete Your Profile",
    description: "Add your professional information, social links, and upload a profile picture to make your network profile stand out.",
    icon: Briefcase,
    color: "from-purple-500 to-pink-500"
  },
  {
    number: "03",
    title: "Scan Your First Business Card",
    description: "Use our AI-powered scanner to extract contact information from business cards. Just upload a photo and let AI do the work.",
    icon: Scan,
    color: "from-green-500 to-emerald-500"
  },
  {
    number: "04",
    title: "Connect Your Calendar",
    description: "Sync with Google Calendar to automatically track events, meetings, and networking opportunities.",
    icon: Calendar,
    color: "from-orange-500 to-red-500"
  },
  {
    number: "05",
    title: "Send Your First Email",
    description: "Use AI to draft and send personalized emails to your contacts. Build meaningful professional relationships.",
    icon: Mail,
    color: "from-indigo-500 to-purple-500"
  },
  {
    number: "06",
    title: "Explore Analytics",
    description: "Track your networking activities, email performance, and relationship metrics to grow your network effectively.",
    icon: BarChart3,
    color: "from-teal-500 to-cyan-500"
  },
]

const features = [
  {
    title: "AI-Powered Business Card Scanner",
    description: "Instantly extract contact information from business cards using advanced OCR and AI technology.",
    icon: Scan
  },
  {
    title: "Intelligent Email Generation",
    description: "Automatically draft, personalize, and send professional emails with AI assistance.",
    icon: Mail
  },
  {
    title: "Smart Calendar Integration",
    description: "Sync with Google Calendar, create events from emails, and get intelligent meeting reminders.",
    icon: Calendar
  },
  {
    title: "AI Portfolio Builder",
    description: "Generate stunning professional portfolios with AI assistance from your CV.",
    icon: Briefcase
  },
  {
    title: "Global Network Directory",
    description: "Discover and connect with professionals worldwide through public profiles.",
    icon: Users
  },
  {
    title: "Analytics & Insights",
    description: "Track your networking activities, email performance, and relationship metrics.",
    icon: BarChart3
  },
]

export function GettingStartedPage() {
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
                <Rocket className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Getting Started</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Welcome to Netlink
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Your complete guide to getting started with Netlink. Follow these simple steps to begin your networking journey.
              </p>
            </motion.div>
          </motion.div>

          {/* Quick Start Steps */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Zap className="h-8 w-8 text-primary" />
              Quick Start Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <motion.div key={step.number} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg bg-gradient-to-br ${step.color} opacity-90`}>
                          <step.icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge variant="outline" className="text-lg font-bold">
                          {step.number}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-2">{step.title}</CardTitle>
                      <CardDescription className="text-base">
                        {step.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Key Features */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-16"
          >
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <BookOpen className="h-6 w-6 text-primary" />
                  Next Steps
                </CardTitle>
                <CardDescription className="text-base">
                  Ready to dive deeper? Check out these resources to get the most out of Netlink.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/resources/setup-guide">
                    <Button variant="outline" className="w-full justify-start h-auto py-4">
                      <Settings className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Setup Guide</div>
                        <div className="text-xs text-muted-foreground">Complete setup instructions</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                  <Link href="/resources/pricing">
                    <Button variant="outline" className="w-full justify-start h-auto py-4">
                      <Zap className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">Pricing</div>
                        <div className="text-xs text-muted-foreground">View plans & features</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                  <Link href="/resources/faq">
                    <Button variant="outline" className="w-full justify-start h-auto py-4">
                      <Bot className="h-5 w-5 mr-2" />
                      <div className="text-left">
                        <div className="font-semibold">FAQ</div>
                        <div className="text-xs text-muted-foreground">Get answers</div>
                      </div>
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
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
                  Join thousands of professionals who are already using Netlink to grow their network and build meaningful connections.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup">
                    <Button size="lg" className="w-full sm:w-auto">
                      Create Free Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/resources/setup-guide">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      View Setup Guide
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
