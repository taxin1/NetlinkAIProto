"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PublicNavigation } from "@/components/public-navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Network, 
  Sparkles,
  Globe,
  Users,
  ArrowLeft,
  ArrowRight,
  Zap,
  Shield,
  Target,
  TrendingUp,
  Mail,
  Calendar,
  Briefcase,
  BarChart3,
  Scan,
  Bot,
  CheckCircle2,
  Star,
  Code,
  Cloud,
  Lock,
  Rocket,
  Lightbulb,
  Heart,
  Award,
  Clock,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Share2,
  Search,
  Filter,
  Bell,
  Settings,
  UserCircle
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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

const floatAnimation = {
  y: [0, -20, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

export function PublicAboutPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])

  const features = [
    {
      icon: Scan,
      title: "Business Card Scanner",
      description: "Instantly extract contact information from business cards using advanced OCR and AI technology. Support for multiple languages and formats.",
      color: "from-cyan-500 to-blue-500",
      delay: 0
    },
    {
      icon: Bot,
      title: "AI Email Assistant",
      description: "Automatically draft, personalize, and send professional emails. Smart follow-up reminders and conversation tracking.",
      color: "from-purple-500 to-pink-500",
      delay: 0.1
    },
    {
      icon: Calendar,
      title: "Smart Calendar Integration",
      description: "Sync with Google Calendar, create events from emails, and get intelligent meeting reminders. Never miss an important connection.",
      color: "from-green-500 to-emerald-500",
      delay: 0.2
    },
    {
      icon: Briefcase,
      title: "AI Portfolio Builder",
      description: "Generate stunning professional portfolios with AI assistance. Upload your CV, and our AI creates a beautiful, personalized portfolio.",
      color: "from-orange-500 to-red-500",
      delay: 0.3
    },
    {
      icon: Network,
      title: "Global Network Directory",
      description: "Discover and connect with professionals worldwide. Public profiles with social links for faster global communication.",
      color: "from-indigo-500 to-purple-500",
      delay: 0.4
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track your networking activities, email performance, and relationship metrics. Data-driven insights to grow your network effectively.",
      color: "from-teal-500 to-cyan-500",
      delay: 0.5
    },
    {
      icon: Mail,
      title: "Email Campaigns",
      description: "Create and manage email campaigns with AI-powered personalization. Track opens, clicks, and engagement metrics.",
      color: "from-blue-500 to-indigo-500",
      delay: 0.6
    },
    {
      icon: Users,
      title: "Contact Management",
      description: "Organize contacts with tags, notes, and custom fields. Smart search and filtering to find connections instantly.",
      color: "from-pink-500 to-rose-500",
      delay: 0.7
    },
  ]

  const stats = [
    { number: "10K+", label: "Active Users", icon: Users },
    { number: "50K+", label: "Connections Made", icon: Network },
    { number: "1M+", label: "Emails Sent", icon: Mail },
    { number: "99.9%", label: "Uptime", icon: Shield },
  ]

  const values = [
    {
      icon: Heart,
      title: "User-Centric",
      description: "Everything we build is designed with our users' needs in mind. Your success is our success.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We continuously push the boundaries of what's possible with AI and networking technology.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is yours. We use enterprise-grade security to protect your information.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Rocket,
      title: "Growth",
      description: "We're committed to helping you grow your network and achieve your professional goals.",
      color: "from-purple-500 to-indigo-500"
    },
  ]

  const howItWorks = [
    {
      step: "01",
      title: "Sign Up & Create Profile",
      description: "Join Netlink in seconds. Create your professional profile and connect your accounts.",
      icon: UserCircle,
    },
    {
      step: "02",
      title: "Build Your Network",
      description: "Scan business cards, import contacts, or discover professionals in our global directory.",
      icon: Network,
    },
    {
      step: "03",
      title: "Let AI Assist You",
      description: "Our AI helps you draft emails, schedule meetings, and maintain meaningful connections.",
      icon: Bot,
    },
    {
      step: "04",
      title: "Grow & Succeed",
      description: "Track your progress, analyze insights, and watch your professional network flourish.",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Dark Tech Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(6,182,212,0.03)_50%,transparent_100%)]"></div>
      </div>

      {/* Navigation */}
      <PublicNavigation />

      {/* Hero Section - Enhanced */}
      <motion.section 
        ref={heroRef}
        style={{ y, opacity }}
        className="relative container mx-auto px-4 py-32 md:py-40 z-10"
      >
        <div className="max-w-5xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10"
          >
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">About Us</span>
            </motion.span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-10 leading-[1.1] tracking-tight text-white"
          >
            <span className="block bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
              We're reimagining how
            </span>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
            >
              professionals build
            </motion.span>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="block mt-2 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
            >
              meaningful networks
            </motion.span>
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mb-12"
          >
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed font-light">
              Netlink combines artificial intelligence with thoughtful design to eliminate the friction 
              in professional networking. We help you connect, communicate, and grow your network—without the busywork.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex gap-4 flex-wrap"
          >
            <Link href="/auth/signup">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg px-8 py-6 shadow-lg shadow-cyan-500/25">
                  Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              </motion.div>
            </Link>
            {/* <Link href="/public/networkers">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="border-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 font-semibold text-lg px-8 py-6">
                Explore Networkers
              </Button>
              </motion.div>
            </Link> */}
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section - Enhanced */}
      <section className="relative container mx-auto px-4 py-24 z-10 border-y border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
                className="text-center group"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
            >
                  <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 200,
                    damping: 20
                  }}
                >
                  <motion.h3
                    className="text-5xl md:text-6xl font-bold mb-3 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
                  >
                    {stat.number}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.2 }}
                    className="text-sm md:text-base text-slate-400 font-medium uppercase tracking-wider"
                  >
                    {stat.label}
                  </motion.p>
                </motion.div>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section - Enhanced */}
      <section className="relative container mx-auto px-4 py-32 z-10">
        <div className="max-w-6xl mx-auto">
          {/* Editorial-style header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-24"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">Our Purpose</span>
            </motion.span>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight text-white">
              <span className="block bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
                We believe networking
              </span>
              <motion.span 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"
              >
                should be meaningful,
              </motion.span>
              <span className="block mt-2 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">not mechanical</span>
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mb-12"
            ></motion.div>
          </motion.div>

          {/* Mission - Enhanced layout */}
            <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-32"
          >
            <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-start">
                    <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex-shrink-0 mt-2"
              >
                <div className="w-1 h-24 bg-gradient-to-b from-cyan-600 to-cyan-400 dark:from-cyan-400 dark:to-cyan-300"></div>
                    </motion.div>
              <div className="flex-1">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
                >
                  Mission
                </motion.h3>
                <div className="space-y-6 text-lg md:text-xl leading-relaxed">
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="text-2xl leading-relaxed font-semibold text-white"
                  >
                    We're eliminating the busywork that stands between professionals and real relationships.
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-slate-300"
                  >
                    Traditional networking tools force you to manage spreadsheets, remember follow-ups, and manually track every interaction. 
                    We've built something different: an intelligent platform that handles the logistics so you can focus on what matters—building genuine connections.
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-slate-300"
                  >
                    Our AI doesn't replace human connection; it amplifies it. By automating routine tasks like contact extraction, 
                    email drafting, and meeting reminders, we give you time to invest in meaningful conversations and relationships 
                    that drive your career forward.
                  </motion.p>
                  </div>
              </div>
            </div>
            </motion.div>

          {/* Vision - Enhanced layout */}
            <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-24"
          >
            <div className="grid md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-start">
              <motion.div 
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex-shrink-0 mt-2"
              >
                <div className="w-1 h-24 bg-gradient-to-b from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300"></div>
              </motion.div>
              <div className="flex-1">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
                >
                  Vision
                </motion.h3>
                <div className="space-y-6 text-lg md:text-xl leading-relaxed">
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="text-2xl leading-relaxed font-semibold text-white"
                  >
                    A world where every professional has the tools to build a global network effortlessly.
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="text-slate-300"
                  >
                    We envision a future where geographic boundaries don't limit professional relationships. Where language barriers 
                    are overcome by intelligent translation. Where time zones are managed automatically. Where your network grows 
                    organically because the platform handles the friction.
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="text-slate-300"
                  >
                    This isn't about replacing human interaction—it's about creating more of it. By removing the administrative 
                    burden of networking, we enable professionals to connect more frequently, more meaningfully, and more globally 
                    than ever before.
                  </motion.p>
                </div>
              </div>
            </div>
                    </motion.div>

          {/* Key Differentiator - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-32 pt-20 border-t"
          >
            <div className="max-w-4xl">
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-400">What Makes Us Different</span>
              </motion.span>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-2xl md:text-3xl leading-relaxed font-medium text-white"
              >
                We're not building another CRM or contact manager. We're building an 
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"> AI co-pilot for networking</span>—one that learns 
                your communication style, understands context, and helps you maintain relationships at scale without losing 
                the personal touch.
              </motion.p>
                  </div>
            </motion.div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="relative container mx-auto px-4 py-32 z-10 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-20"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">Our Platform</span>
            </motion.span>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-[1.1] tracking-tight text-white">
              <span className="block bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
                Tools designed for
              </span>
              <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">modern networking</span>
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mb-8"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-slate-300 max-w-3xl"
            >
              A comprehensive suite of AI-powered features that work together to streamline your networking workflow
            </motion.p>
        </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group"
              >
                <div                 className="h-full p-8 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 transition-all duration-300 bg-slate-900/70 backdrop-blur-sm hover:shadow-xl hover:shadow-cyan-500/10">
                  <motion.div 
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/25"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <feature.icon className="h-7 w-7 text-white" />
                  </motion.div>
                  <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                  <p className="text-slate-300 leading-relaxed text-base">
                    {feature.description}
                  </p>
                </div>
            </motion.div>
          ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section className="relative container mx-auto px-4 py-32 z-10 bg-slate-900/30 backdrop-blur-sm border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-20"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">Getting Started</span>
            </motion.span>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-[1.1] tracking-tight bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
              How it works
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500"
            ></motion.div>
        </motion.div>

          <div className="space-y-8 md:space-y-12 relative">
            {/* Connecting line */}
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:block absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-purple-500"
            />
            
              {howItWorks.map((step, index) => (
                <motion.div
                  key={step.step}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                  duration: 0.7, 
                    delay: index * 0.2,
                  ease: [0.16, 1, 0.3, 1]
                  }}
                whileHover={{ x: 10, transition: { duration: 0.3 } }}
                className="flex gap-6 md:gap-8 items-start relative group"
                >
                    <motion.div 
                  className="flex-shrink-0 relative z-10"
                              initial={{ scale: 0, rotate: -180 }}
                              whileInView={{ scale: 1, rotate: 0 }}
                              viewport={{ once: true }}
                              transition={{ 
                                delay: index * 0.2 + 0.3,
                                type: "spring",
                    stiffness: 200,
                    damping: 20
                              }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                            >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/25 border-4 border-slate-900">
                    {step.step}
                  </div>
                </motion.div>
                <div className="flex-1 pt-2">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.4, duration: 0.6 }}
                    className="flex items-center gap-4 mb-4"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <step.icon className="h-7 w-7 text-cyan-400" />
                    </motion.div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">{step.title}</h3>
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.5, duration: 0.6 }}
                    className="text-lg md:text-xl text-slate-300 leading-relaxed"
                  >
                    {step.description}
                  </motion.p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      </section>

      {/* Values Section - Enhanced */}
      <section className="relative container mx-auto px-4 py-32 z-10 bg-slate-900/20">
        <div className="max-w-6xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-20"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">Our Principles</span>
            </motion.span>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-[1.1] tracking-tight bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
              What drives us
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500"
            ></motion.div>
        </motion.div>

          <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
                initial={{ opacity: 0, y: 50, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.15,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ x: index % 2 === 0 ? 5 : -5, transition: { duration: 0.3 } }}
                className="flex gap-6 items-start group"
              >
                  <motion.div
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                    <value.icon className="h-7 w-7 text-white" />
                  </div>
                </motion.div>
                <div className="flex-1 pt-1">
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.2, duration: 0.6 }}
                    className="text-2xl md:text-3xl font-bold mb-4 text-white"
                  >
                    {value.title}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                    className="text-slate-300 leading-relaxed text-lg"
                  >
                    {value.description}
                  </motion.p>
                </div>
            </motion.div>
          ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section - Enhanced */}
      <section className="relative container mx-auto px-4 py-32 z-10 border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-20"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">Technology</span>
            </motion.span>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 leading-[1.1] tracking-tight bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
              Built for scale and security
            </h2>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: 96 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mb-8"
            ></motion.div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-slate-300 max-w-3xl"
            >
              Our platform is built on modern infrastructure designed for reliability, security, and global scale
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            { icon: Brain, title: "AI & Machine Learning", description: "Advanced AI models for natural language processing and intelligent automation" },
            { icon: Cloud, title: "Cloud Infrastructure", description: "Scalable, secure cloud architecture for global accessibility" },
            { icon: Lock, title: "Enterprise Security", description: "End-to-end encryption and compliance with industry standards" },
          ].map((tech, index) => (
            <motion.div
              key={tech.title}
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="p-8 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 transition-all duration-300 bg-slate-900/70 backdrop-blur-sm hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <motion.div 
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <tech.icon className="h-7 w-7 text-white" />
                </motion.div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white">{tech.title}</h3>
                <p className="text-slate-300 leading-relaxed text-base">{tech.description}</p>
        </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="relative container mx-auto px-4 py-32 z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold mb-8 leading-[1.1] tracking-tight bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent"
          >
            Ready to get started?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed font-light"
          >
            Join professionals who are building stronger networks with AI-powered tools. 
            No credit card required.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link href="/auth/signup">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg px-8 py-6 shadow-lg shadow-cyan-500/25">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            {/* <Link href="/public/networkers">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" variant="outline" className="border-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 font-semibold text-lg px-8 py-6">
                  Explore Networkers
                </Button>
              </motion.div>
            </Link> */}
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t mt-20 z-10 bg-background/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Netlink. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link href="/public/about" className="text-sm text-muted-foreground hover:text-foreground">
                About
              </Link>
              {/* <Link href="/public/networkers" className="text-sm text-muted-foreground hover:text-foreground">
                Networkers
              </Link> */}
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
