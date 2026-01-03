"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Scan,
  Zap,
  Users,
  Calendar,
  BarChart3,
  Brain,
  Network,
  Sparkles,
  CheckCircle2,
  Mail,
  Crown,
  Sparkle,
  ArrowRight,
  Loader2,
  Bot,
  Radio,
  TrendingUp,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const features = [
  {
    icon: Scan,
    title: "AI Business Card Scanner",
    description: "Instantly scan and extract contact information from business cards using advanced AI",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI Email Assistant",
    description: "Generate personalized emails with AI that understands your communication style",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Smart Contact Management",
    description: "Organize and manage your network with intelligent tagging and search",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "Track networking events, meetings, and important dates automatically",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: BarChart3,
    title: "Network Analytics",
    description: "Get insights into your network growth and engagement metrics",
    color: "from-indigo-500 to-purple-500",
  },
  {
    icon: Bot,
    title: "Voice Agent",
    description: "Interact with your network using voice commands and AI-powered assistance",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Network,
    title: "Global Networker",
    description: "Connect with professionals worldwide and expand your network",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Sparkles,
    title: "Email Campaigns",
    description: "Run targeted email campaigns with AI-generated personalized content",
    color: "from-cyan-500 to-blue-500",
  },
]

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

export default function WaitlistPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [position, setPosition] = useState<number | null>(null)
  const [earlyBird, setEarlyBird] = useState(false)
  const router = useRouter()

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Simulate API call
    setTimeout(() => {
      setPosition(Math.floor(Math.random() * 500) + 100) // Mock position
      setEarlyBird(true) // Mock early bird
      setIsSuccess(true)
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float blur-sm" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-primary/20 rounded-full animate-float animation-delay-2000 blur-sm" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-primary/40 rounded-full animate-float animation-delay-4000 blur-sm" />
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/2 -right-20 w-[600px] h-[600px] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Netlink
          </Link>
          <div className="flex gap-4">

            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-12"
        >
          <motion.div variants={itemVariants}>
            <Badge className="mb-4 px-4 py-1 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <Sparkle className="w-3 h-3 mr-2" />
              Product Launch Coming Soon
            </Badge>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight"
          >
            <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Join the Waitlist
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Get Early Access
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Be among the first to experience the future of professional networking.
            AI-powered contact management, intelligent email campaigns, and more.
          </motion.p>

          {/* Early Bird Badge */}
          <motion.div
            variants={itemVariants}
            className="mb-8"
          >
            <Card className="inline-block border-2 border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent backdrop-blur-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-bold text-lg md:text-xl">First 100 Users Get FREE Pro!</p>
                    <p className="text-sm md:text-base text-muted-foreground">
                      6 months of Pro features completely free
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Waitlist Form */}
          <motion.div variants={itemVariants} className="max-w-md mx-auto mb-16">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onSubmit={handleJoinWaitlist}
                  className="space-y-4"
                >
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 h-12 text-base bg-background/50 backdrop-blur-sm border-border"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isLoading || !email.trim()}
                      className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          Join Waitlist
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold">You're on the list! 🎉</h3>
                  <div className="space-y-2">
                    <p className="text-lg">
                      Your position: <span className="font-bold text-primary">#{position}</span>
                    </p>
                    {earlyBird && (
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Crown className="w-5 h-5 text-primary" />
                          <p className="font-bold text-primary">Early Bird Bonus!</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You'll receive 6 months of FREE Pro access when we launch!
                        </p>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Check your email for confirmation. We'll notify you when we're live!
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-16"
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl md:text-4xl font-bold text-center mb-4"
          >
            What You'll Get
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto"
          >
            Powerful features to revolutionize how you network and manage professional relationships
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group"
                >
                  <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
                    <CardContent className="p-6">
                      <motion.div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Live Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Live Preview</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  See what's coming - a sneak peek of the powerful dashboard you'll have access to
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-8 border border-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Dashboard Preview Cards */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-border/50"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Scan className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Card Scanner</h4>
                        <p className="text-xs text-muted-foreground">AI-Powered</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="h-2 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-border/50"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Email Campaigns</h4>
                        <p className="text-xs text-muted-foreground">Automated</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded w-4/5 animate-pulse" />
                      <div className="h-2 bg-muted rounded w-2/3 animate-pulse" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-border/50"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Analytics</h4>
                        <p className="text-xs text-muted-foreground">Real-time</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-muted rounded w-5/6 animate-pulse" />
                      <div className="h-2 bg-muted rounded w-3/4 animate-pulse" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pro Features Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
            <CardContent className="p-8 md:p-12">
              <Crown className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Pro Features (First 100 Users FREE for 6 Months)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
                {[
                  "Unlimited AI email generation",
                  "Advanced analytics dashboard",
                  "Priority customer support",
                  "Custom email templates",
                  "Bulk contact import/export",
                  "API access",
                  "Advanced reporting",
                  "Team collaboration tools",
                  "Custom branding",
                ].map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-left"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm md:text-base">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
