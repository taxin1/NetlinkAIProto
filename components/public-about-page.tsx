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
      description: "Join Netlink Cogni in seconds. Create your professional profile and connect your accounts.",
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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <motion.div
          className="absolute top-0 -left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute -bottom-20 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Navigation */}
      <PublicNavigation />

      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ y, opacity }}
        className="relative container mx-auto px-4 py-20 md:py-32 z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-6"
          >
            <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              AI-Powered Networking Platform
            </Badge>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight"
          >
            About Netlink Cogni
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Revolutionizing professional networking with AI-powered tools that help you build meaningful connections, 
            automate follow-ups, and grow your network globally.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/public/networkers">
              <Button size="lg" variant="outline">
                Explore Networkers
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <section className="relative container mx-auto px-4 py-16 z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="text-center"
            >
              <Card className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <motion.div
                    animate={floatAnimation}
                    style={{ animationDelay: `${index * 0.2}s` }}
                    className="flex justify-center mb-4"
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${stat.icon === Users ? 'from-cyan-500 to-blue-500' : stat.icon === Network ? 'from-purple-500 to-pink-500' : stat.icon === Mail ? 'from-green-500 to-emerald-500' : 'from-orange-500 to-red-500'} flex items-center justify-center`}>
                      <stat.icon className="h-8 w-8 text-white" />
                    </div>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent"
                  >
                    {stat.number}
                  </motion.h3>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Mission & Vision Section */}
      <section className="relative container mx-auto px-4 py-20 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Our Mission & Vision
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Building the future of professional networking, one connection at a time
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      animate={pulseAnimation}
                      className="w-16 h-16 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center"
                    >
                      <Target className="h-8 w-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-2xl">Our Mission</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                    To revolutionize professional networking by combining cutting-edge AI technology with a global community 
                    of professionals. We believe that meaningful connections should be effortless, and that's why we've built 
                    a platform that helps you discover, connect, and engage with professionals worldwide.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Our mission is to eliminate the friction in networking, making it easier than ever to build and maintain 
                    professional relationships that drive career growth and business success.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <motion.div
                      animate={pulseAnimation}
                      style={{ animationDelay: "0.5s" }}
                      className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                    >
                      <Lightbulb className="h-8 w-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-2xl">Our Vision</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                    To become the world's leading AI-powered networking platform, connecting millions of professionals 
                    across industries and borders. We envision a future where networking is seamless, intelligent, and 
                    accessible to everyone.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    We're building a global ecosystem where professionals can discover opportunities, share knowledge, 
                    and grow together, powered by AI that understands context, intent, and the art of meaningful connection.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container mx-auto px-4 py-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400">
            Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Everything You Need to Network Smarter
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive tools powered by AI to help you build, manage, and grow your professional network
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: feature.delay }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                <CardContent className="p-6">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}
                  >
                    <feature.icon className="h-7 w-7 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative container mx-auto px-4 py-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get started in minutes and begin building your professional network today
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Animated Vertical Connection Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 transform -translate-x-1/2 z-0">
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full w-full bg-gradient-to-b from-cyan-500 via-blue-500 to-purple-500 origin-top"
              />
            </div>
            
            {/* Animated Dots on the Line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-full h-full z-10">
              {howItWorks.map((_, index) => {
                const positions = [0, 0.33, 0.66, 1]
                return (
                  <motion.div
                    key={`dot-${index}`}
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      delay: index * 0.3 + 0.5,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200
                    }}
                    className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{ top: `${positions[index] * 100}%` }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(6, 182, 212, 0.7)",
                          "0 0 0 10px rgba(6, 182, 212, 0)",
                          "0 0 0 0 rgba(6, 182, 212, 0)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 border-2 border-white shadow-lg"
                    />
                  </motion.div>
                )
              })}
            </div>
            
            <div className="space-y-16 md:space-y-20 relative z-20">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.2,
                    type: "spring",
                    stiffness: 100
                  }}
                  className="relative"
                >
                  <div className={`flex flex-col md:flex-row items-center gap-6 md:gap-8 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}>
                    {/* Card Section */}
                    <motion.div 
                      className="flex-1 w-full md:w-auto"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl bg-background/50 backdrop-blur-sm">
                        <CardContent className="p-6 md:p-8">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              whileInView={{ scale: 1, rotate: 0 }}
                              viewport={{ once: true }}
                              transition={{ 
                                delay: index * 0.2 + 0.3,
                                type: "spring",
                                stiffness: 200
                              }}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0"
                            >
                              {step.step}
                            </motion.div>
                            <div className="flex-1">
                              <h3 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                                {step.title}
                              </h3>
                              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Icon Circle - Always centered on line */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ 
                        delay: index * 0.2 + 0.5,
                        type: "spring",
                        stiffness: 200
                      }}
                      whileHover={{ 
                        scale: 1.15, 
                        rotate: [0, -10, 10, -10, 0],
                        transition: { duration: 0.5 }
                      }}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-500 flex items-center justify-center shadow-2xl relative z-20 border-4 border-background flex-shrink-0"
                    >
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 20,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      >
                        <step.icon className="h-10 w-10 md:h-12 md:w-12 text-white" />
                      </motion.div>
                      {/* Glow effect */}
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0.8, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 blur-xl -z-10"
                      />
                    </motion.div>

                    {/* Spacer for alignment on opposite side */}
                    <div className="flex-1 hidden md:block"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative container mx-auto px-4 py-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Our Core Values
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The principles that guide everything we do
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-all duration-300 text-center">
                <CardContent className="p-6">
                  <motion.div
                    animate={floatAnimation}
                    style={{ animationDelay: `${index * 0.2}s` }}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${value.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                  >
                    <value.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="relative container mx-auto px-4 py-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Built with Modern Technology
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Powered by cutting-edge AI and cloud infrastructure
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            { icon: Brain, title: "AI & Machine Learning", description: "Advanced AI models for natural language processing and intelligent automation" },
            { icon: Cloud, title: "Cloud Infrastructure", description: "Scalable, secure cloud architecture for global accessibility" },
            { icon: Lock, title: "Enterprise Security", description: "End-to-end encryption and compliance with industry standards" },
          ].map((tech, index) => (
            <motion.div
              key={tech.title}
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Card className="h-full border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
                    <tech.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{tech.title}</h3>
                  <p className="text-muted-foreground">{tech.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative container mx-auto px-4 py-20 z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white border-0 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]"></div>
            <CardContent className="p-12 md:p-16 text-center relative z-10">
              <motion.div
                animate={pulseAnimation}
                className="inline-block mb-6"
              >
                <Rocket className="h-16 w-16 mx-auto text-white" />
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to Transform Your Networking?</h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of professionals who are already building stronger networks with AI-powered tools
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="bg-white text-cyan-600 hover:bg-cyan-50">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/public/networkers">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Explore Networkers
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-sm opacity-75">
                No credit card required • 14-day free trial • Cancel anytime
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t mt-20 z-10 bg-background/50 backdrop-blur">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Netlink Cogni. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                Home
              </Link>
              <Link href="/public/about" className="text-sm text-muted-foreground hover:text-foreground">
                About
              </Link>
              <Link href="/public/networkers" className="text-sm text-muted-foreground hover:text-foreground">
                Networkers
              </Link>
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
