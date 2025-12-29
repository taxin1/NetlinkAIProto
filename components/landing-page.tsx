"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Scan,
  Zap,
  Users,
  Calendar,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Brain,
  Upload,
  Network,
  Sparkles,
  TrendingUp,
  Loader2,
  Radio,
  Briefcase,
  Mail,
  Sparkle,
  Waves,
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

const fadeInUp = {
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

export function LandingPage() {
  const [activeDemo, setActiveDemo] = useState<"scan" | "ai" | "analytics">("scan")
  const [cardScanStep, setCardScanStep] = useState(0)
  const [emailStep, setEmailStep] = useState(0)
  const [nfcStep, setNfcStep] = useState(0)
  const [portfolioStep, setPortfolioStep] = useState(0)
  
  // Show preview first, then details
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [showEmailDetails, setShowEmailDetails] = useState(false)
  const [showNfcDetails, setShowNfcDetails] = useState(false)
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false)

  // Store random particle positions to avoid hydration mismatch
  const [particleConfigs, setParticleConfigs] = useState<Array<{ x: string; y: string; duration: number }> | null>(null)

  // Initialize particle configs only on client
  useEffect(() => {
    setParticleConfigs(
      Array.from({ length: 5 }, () => ({
        x: Math.random() * 100 + "%",
        y: Math.random() * 100 + "%",
        duration: 2 + Math.random(),
      }))
    )
  }, [])

  // Show preview for 4 seconds, then switch to details
  useEffect(() => {
    const timer = setTimeout(() => setShowCardDetails(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowEmailDetails(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowNfcDetails(true), 4500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setShowPortfolioDetails(true), 5500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-cycle through card scanning steps (only when details are shown)
  useEffect(() => {
    if (showCardDetails) {
      const interval = setInterval(() => {
        setCardScanStep((prev) => (prev + 1) % 4)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [showCardDetails])

  // Auto-cycle through email steps (only when details are shown)
  useEffect(() => {
    if (showEmailDetails) {
      const interval = setInterval(() => {
        setEmailStep((prev) => (prev + 1) % 5)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [showEmailDetails])

  // Auto-cycle through NFC steps (only when details are shown)
  useEffect(() => {
    if (showNfcDetails) {
      const interval = setInterval(() => {
        setNfcStep((prev) => (prev + 1) % 4)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [showNfcDetails])

  // Auto-cycle through portfolio steps (only when details are shown)
  useEffect(() => {
    if (showPortfolioDetails) {
      const interval = setInterval(() => {
        setPortfolioStep((prev) => (prev + 1) % 5)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [showPortfolioDetails])

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated tech background */}
      <div className="fixed inset-0 z-0">
        {/* Grid pattern */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "50px 50px"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Animated gradient orbs */}
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
          className="absolute -bottom-20 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
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
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Network className="h-7 w-7 text-white group-hover:text-cyan-400 transition-colors" />
              </motion.div>
              <span className="text-xl font-semibold text-white tracking-tight">
                Netlink<span className="text-cyan-400">-Cogni</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium">
                  Home
                </Button>
                </motion.div>
              </Link>
              <Link href="/public/about">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium">
                  About
                </Button>
                </motion.div>
              </Link>
              <Link href="/public/networkers">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium">
                  Networkers
                </Button>
                </motion.div>
              </Link>
              <Link href="/auth/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium">
                  Sign In
                </Button>
                </motion.div>
              </Link>
              <Link href="/auth/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-medium shadow-md">
                  Get Started
                </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/20 backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">AI-Powered Networking Platform</span>
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white tracking-tight leading-tight"
            >
              <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
                Transform Your Networking
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                with AI Intelligence
              </span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-xl sm:text-2xl text-slate-300 font-light max-w-3xl mx-auto mb-8 leading-relaxed"
            >
              The all-in-one platform that automates business card scanning, personalizes cold emails, and tracks your
              network growth—saving you{" "}
              <span className="text-cyan-400 font-semibold">10+ hours per week</span>
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/auth/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-lg px-8 py-6 shadow-lg shadow-cyan-500/25"
                  >
                    Start Free Trial
                    <Zap className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/auth/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 font-semibold text-lg px-8 py-6"
                  >
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
            <motion.p
              variants={itemVariants}
              className="mt-6 text-sm text-slate-400"
            >
              No credit card required • 14-day free trial • Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Live Feature Previews */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent"
            >
              See It In Action
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-300 max-w-2xl mx-auto"
            >
              Watch how our AI-powered features transform your networking workflow
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1: Business Card Scanner - 3D Card Flip with Scanning Beam */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
              className="relative group"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-500 h-full overflow-hidden relative">
                  {/* Animated background glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  />
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30"
                        animate={{
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Scan className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Card Scanner</h3>
                        <p className="text-sm text-slate-400">AI-Powered Extraction</p>
                      </div>
                    </div>

                    {/* Preview Animation or Detailed Process */}
                    <div className="relative bg-slate-900/70 rounded-xl p-4 mt-4 border border-slate-700/50 overflow-hidden min-h-[280px]">
                      <AnimatePresence mode="wait">
                        {/* Preview Animation */}
                        {!showCardDetails && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-4"
                        >
                          <div className="relative h-full flex items-center justify-center">
                            {/* 3D Card Flip Preview */}
                            <motion.div
                              className="relative"
                              style={{ perspective: "1000px" }}
                            >
                              <motion.div
                                className="relative w-32 h-48"
                                animate={{
                                  rotateY: [0, 180, 360],
                                }}
                                transition={{
                                  duration: 4,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                style={{ transformStyle: "preserve-3d" }}
                              >
                                {/* Front of Card */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 rounded-lg p-3 shadow-xl"
                                  style={{ backfaceVisibility: "hidden" }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">JS</span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="h-2 bg-blue-300 dark:bg-blue-600 rounded mb-1" />
                                      <div className="h-1.5 bg-blue-200 dark:bg-blue-700 rounded w-2/3" />
                                    </div>
                                  </div>
                                  <div className="space-y-1 mt-2">
                                    <div className="h-1 bg-slate-300 dark:bg-slate-600 rounded" />
                                    <div className="h-1 bg-slate-300 dark:bg-slate-600 rounded w-3/4" />
                                  </div>
                                </motion.div>
                                
                                {/* Back of Card - Extracted */}
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-800 dark:to-green-900/30 rounded-lg p-3 shadow-xl"
                                  style={{
                                    backfaceVisibility: "hidden",
                                    transform: "rotateY(180deg)",
                                  }}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">Extracted!</span>
                                  </div>
                                  <div className="space-y-1 text-xs">
                                    <p className="font-semibold text-slate-900 dark:text-white">John Smith</p>
                                    <p className="text-slate-600 dark:text-slate-400">CEO at TechCorp</p>
                                  </div>
                                </motion.div>
                              </motion.div>
                            </motion.div>
                            
                            {/* Scanning Beam Effect */}
                            <motion.div
                              className="absolute inset-0 opacity-20"
                              style={{
                                background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.4), transparent)",
                              }}
                              animate={{
                                x: ["-100%", "200%"],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            />
                            
                            {/* Floating Particles */}
                            {particleConfigs?.map((config, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-blue-400 rounded-full"
                                initial={{
                                  x: config.x,
                                  y: config.y,
                                  opacity: 0,
                                }}
                                animate={{
                                  y: [null, "-100%"],
                                  opacity: [0, 1, 0],
                                }}
                                transition={{
                                  duration: config.duration,
                                  repeat: Infinity,
                                  delay: i * 0.4,
                                }}
                              />
                            ))}
                          </div>
                        </motion.div>
                        )}

                        {/* Detailed Process Steps */}
                        {showCardDetails && (
                        <>
                        {/* Step 1: Upload Interface */}
                        {cardScanStep === 0 && (
                        <motion.div
                          key="upload"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="border-2 border-dashed border-blue-500/40 rounded-lg p-6 h-full flex flex-col items-center justify-center bg-blue-500/5">
                            <motion.div
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Upload className="h-10 w-10 text-blue-400 mb-3" />
                            </motion.div>
                            <p className="text-sm text-blue-300 font-medium mb-1">Upload Business Card</p>
                            <p className="text-xs text-slate-400">Click or drag to upload</p>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 2: Card Image Appears */}
                        {cardScanStep === 1 && (
                        <motion.div
                          key="card-image"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 h-full shadow-xl">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">JS</span>
                              </div>
                              <div className="flex-1">
                                <div className="h-3 bg-blue-200 dark:bg-blue-900 rounded mb-1.5 w-32" />
                                <div className="h-2 bg-blue-100 dark:bg-blue-800 rounded w-24" />
                              </div>
                            </div>
                            <div className="space-y-2 mt-4">
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Processing image...</span>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 3: AI Scanning Progress */}
                        {cardScanStep === 2 && (
                        <motion.div
                          key="scanning"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-4">
                              <Scan className="h-5 w-5 text-blue-400" />
                              <span className="text-sm font-semibold text-white">AI Scanning...</span>
                            </div>
                            
                            {/* Scanning Progress Steps */}
                            <div className="space-y-3">
                              {[
                                { label: "Detecting text regions", progress: 100 },
                                { label: "Extracting name", progress: 100 },
                                { label: "Extracting contact info", progress: 85 },
                                { label: "Validating data", progress: 60 },
                              ].map((step, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-300">{step.label}</span>
                                    <span className="text-blue-400 font-semibold">{step.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full"
                                      initial={{ width: "0%" }}
                                      animate={{ width: `${step.progress}%` }}
                                      transition={{ duration: 1, delay: i * 0.3 }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 4: Extracted Contact Card */}
                        {cardScanStep === 3 && (
                        <motion.div
                          key="extracted"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 h-full border-2 border-green-500/30">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                              <span className="text-sm font-bold text-green-400">Contact Extracted!</span>
                            </div>
                            
                            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">JS</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-white">John Smith</p>
                                  <p className="text-xs text-slate-400">CEO at TechCorp</p>
                                </div>
                              </div>
                              
                              <div className="space-y-1.5 pt-2 border-t border-slate-700">
                                <div className="flex items-center gap-2 text-xs">
                                  <Mail className="h-3 w-3 text-green-400" />
                                  <span className="text-slate-300">john@techcorp.com</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-green-400">📱</span>
                                  <span className="text-slate-300">+1 (555) 123-4567</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-green-400">🏢</span>
                                  <span className="text-slate-300">123 Business St, San Francisco</span>
                                </div>
                              </div>
                              
                              <motion.div
                                className="mt-3 bg-green-500/20 rounded px-2 py-1 text-xs text-green-400 text-center"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              >
                                ✓ Saved to contacts
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                        )}
                        </>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Feature 2: AI Email Agent - Flying Emails with Network Connections */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
              className="relative group"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-500 h-full overflow-hidden relative">
                  {/* Animated background glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  />
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 10, -10, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Bot className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Email Agent</h3>
                        <p className="text-sm text-slate-400">AI-Powered Campaigns</p>
                      </div>
                    </div>

                    {/* Preview Animation or Detailed Process */}
                    <div className="relative bg-slate-900/70 rounded-xl p-4 mt-4 border border-slate-700/50 overflow-hidden min-h-[280px]">
                      <AnimatePresence mode="wait">
                        {/* Preview Animation */}
                        {!showEmailDetails && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-4"
                        >
                          <div className="relative h-full">
                            {/* Flying Email Icons */}
                            {[...Array(4)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute"
                                initial={{
                                  x: -20,
                                  y: 20 + i * 35,
                                  opacity: 0,
                                  scale: 0.8,
                                }}
                                animate={{
                                  x: ["-20", "100%"],
                                  y: [20 + i * 35, 20 + i * 35 + Math.sin(i) * 10],
                                  opacity: [0, 1, 1, 0],
                                  scale: [0.8, 1, 1, 0.8],
                                  rotate: [0, 5, -5, 0],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  delay: i * 0.6,
                                  ease: "easeInOut",
                                }}
                              >
                                <Mail className="h-5 w-5 text-purple-400" />
                              </motion.div>
                            ))}

                            {/* AI Processing Indicator */}
                            <motion.div
                              className="absolute bottom-4 left-4 right-4"
                              animate={{ opacity: [0.5, 1, 0.5], y: [0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <div className="flex items-center gap-2 bg-purple-500/20 rounded-lg p-2 border border-purple-500/30">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                  <Sparkle className="h-4 w-4 text-purple-400" />
                                </motion.div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-purple-300">Personalizing...</span>
                                    <span className="text-xs font-semibold text-purple-400">15/25</span>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                      className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 h-1.5 rounded-full"
                                      animate={{ width: ["0%", "60%", "100%"] }}
                                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                        )}

                        {/* Detailed Process Steps */}
                        {showEmailDetails && (
                        <>
                        {/* Step 1: Campaign Setup */}
                        {emailStep === 0 && (
                        <motion.div
                          key="setup"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-4">
                              <Bot className="h-5 w-5 text-purple-400" />
                              <span className="text-sm font-semibold text-white">Create Campaign</span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Campaign Name</label>
                                <div className="bg-slate-700 rounded px-3 py-2 text-sm text-white">Q1 Product Launch</div>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Purpose</label>
                                <div className="bg-slate-700 rounded px-3 py-2 text-sm text-white">Introduce new features</div>
                              </div>
                              <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-slate-400">Selected Contacts</span>
                                <Badge className="bg-purple-600 text-xs">25 contacts</Badge>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 2: AI Writing Emails */}
                        {emailStep === 1 && (
                        <motion.div
                          key="writing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-4">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                <Sparkle className="h-5 w-5 text-purple-400" />
                              </motion.div>
                              <span className="text-sm font-semibold text-white">AI Personalizing Emails...</span>
                            </div>
                            <div className="space-y-3">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-slate-700/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-purple-300">Email {i}/25</span>
                                    <motion.span
                                      className="text-xs text-purple-400"
                                      animate={{ opacity: [0.5, 1, 0.5] }}
                                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                    >
                                      Writing...
                                    </motion.span>
                                  </div>
                                  <div className="space-y-1.5">
                                    <motion.div
                                      className="h-1.5 bg-purple-500/30 rounded"
                                      initial={{ width: "0%" }}
                                      animate={{ width: ["0%", "100%"] }}
                                      transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity }}
                                    />
                                    <motion.div
                                      className="h-1.5 bg-purple-500/30 rounded"
                                      initial={{ width: "0%" }}
                                      animate={{ width: ["0%", "85%"] }}
                                      transition={{ duration: 1.5, delay: i * 0.3 + 0.2, repeat: Infinity }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 3: Sending Progress */}
                        {emailStep === 2 && (
                        <motion.div
                          key="sending"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-4">
                              <Mail className="h-5 w-5 text-purple-400" />
                              <span className="text-sm font-semibold text-white">Sending Campaign</span>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-purple-300">Progress</span>
                                  <motion.span
                                    className="text-xs font-semibold text-purple-400"
                                    animate={{ opacity: [0.7, 1, 0.7] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  >
                                    18/25
                                  </motion.span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 h-2 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: ["0%", "72%"] }}
                                    transition={{ duration: 2 }}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-green-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>18 emails sent successfully</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-yellow-400">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>7 emails queued</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 4: Email Preview */}
                        {emailStep === 3 && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full overflow-y-auto">
                            <div className="flex items-center gap-2 mb-3">
                              <Mail className="h-4 w-4 text-purple-400" />
                              <span className="text-xs font-semibold text-white">Email Preview</span>
                            </div>
                            <div className="bg-slate-900 rounded-lg p-3 border border-purple-500/30">
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-slate-400">To: </span>
                                  <span className="text-white">sarah@startup.com</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Subject: </span>
                                  <span className="text-white">Exciting updates from TechCorp</span>
                                </div>
                                <div className="pt-2 border-t border-slate-700">
                                  <p className="text-slate-300 leading-relaxed">
                                    Hi Sarah,<br />
                                    I noticed your startup is in the fintech space. We just launched new features that could help...
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 pt-2">
                                  <Sparkle className="h-3 w-3 text-purple-400" />
                                  <span className="text-xs text-purple-400">AI Personalized</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 5: Campaign Complete */}
                        {emailStep === 4 && (
                        <motion.div
                          key="complete"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 h-full border-2 border-green-500/30 flex flex-col items-center justify-center">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
                            </motion.div>
                            <p className="text-lg font-bold text-green-400 mb-1">Campaign Complete!</p>
                            <p className="text-sm text-slate-300 mb-4">25 emails sent</p>
                            <div className="grid grid-cols-2 gap-2 w-full">
                              <div className="bg-slate-800/50 rounded p-2 text-center">
                                <p className="text-lg font-bold text-green-400">67%</p>
                                <p className="text-xs text-slate-400">Open Rate</p>
                              </div>
                              <div className="bg-slate-800/50 rounded p-2 text-center">
                                <p className="text-lg font-bold text-blue-400">12</p>
                                <p className="text-xs text-slate-400">Responses</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        )}
                        </>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Feature 3: NFC - Radio Waves with Connection Animation */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
              className="relative group"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl hover:border-cyan-500/50 transition-all duration-500 h-full overflow-hidden relative">
                  {/* Animated background glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  />
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 180, 360],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Radio className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-white">NFC Share</h3>
                        <p className="text-sm text-slate-400">Instant Contact Exchange</p>
                      </div>
                    </div>

                    {/* Preview Animation or Detailed Process */}
                    <div className="relative bg-slate-900/70 rounded-xl p-4 mt-4 border border-slate-700/50 overflow-hidden min-h-[280px]">
                      <AnimatePresence mode="wait">
                        {/* Preview Animation */}
                        {!showNfcDetails && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-4 flex items-center justify-center"
                        >
                          <div className="relative">
                            {/* Concentric Radio Waves */}
                            {[1, 2, 3, 4].map((ring, i) => (
                              <motion.div
                                key={ring}
                                className="absolute rounded-full border-2 border-cyan-400/40"
                                style={{
                                  width: `${30 + ring * 25}px`,
                                  height: `${30 + ring * 25}px`,
                                }}
                                animate={{
                                  scale: [1, 2.5, 1],
                                  opacity: [0.8, 0, 0.8],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  delay: i * 0.3,
                                  ease: "easeOut",
                                }}
                              />
                            ))}

                            {/* Center Device */}
                            <motion.div
                              className="relative z-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg p-3 shadow-xl"
                              animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 5, -5, 0],
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                            >
                              <Radio className="h-6 w-6 text-white" />
                            </motion.div>

                            {/* Data Transfer Particles */}
                            {[...Array(8)].map((_, i) => {
                              const angle = (i * 360) / 8
                              const radius = 50
                              return (
                                <motion.div
                                  key={i}
                                  className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full"
                                  initial={{
                                    x: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 15}px)`,
                                    y: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 15}px)`,
                                  }}
                                  animate={{
                                    x: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * radius}px)`,
                                    y: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * radius}px)`,
                                    opacity: [0, 1, 1, 0],
                                    scale: [0.5, 1, 1, 0.5],
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "easeOut",
                                  }}
                                />
                              )
                            })}
                          </div>
                        </motion.div>
                        )}

                        {/* Detailed Process Steps */}
                        {showNfcDetails && (
                        <>
                        {/* Step 1: Device Detection */}
                        {nfcStep === 0 && (
                        <motion.div
                          key="detect"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full flex flex-col items-center justify-center">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Radio className="h-12 w-12 text-cyan-400 mb-4" />
                            </motion.div>
                            <p className="text-sm font-semibold text-white mb-2">NFC Enabled</p>
                            <p className="text-xs text-slate-400 text-center">Waiting for device...</p>
                            <div className="mt-4 flex gap-1">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-2 h-2 rounded-full bg-cyan-400"
                                  animate={{
                                    opacity: [0.3, 1, 0.3],
                                    scale: [1, 1.2, 1],
                                  }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 2: Connection Established */}
                        {nfcStep === 1 && (
                        <motion.div
                          key="connect"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full flex flex-col items-center justify-center">
                            {/* Two Devices */}
                            <div className="flex items-center gap-8 mb-6">
                              <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg p-4 shadow-xl">
                                <Radio className="h-8 w-8 text-white" />
                              </div>
                              <motion.div
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5],
                                }}
                                transition={{ duration: 1, repeat: Infinity }}
                              >
                                <ArrowRight className="h-6 w-6 text-cyan-400" />
                              </motion.div>
                              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg p-4 shadow-xl">
                                <Radio className="h-8 w-8 text-white" />
                              </div>
                            </div>
                            
                            {/* Connection Waves */}
                            <div className="relative w-full h-16 flex items-center justify-center">
                              {[1, 2, 3].map((ring) => (
                                <motion.div
                                  key={ring}
                                  className="absolute rounded-full border-2 border-cyan-400/50"
                                  style={{
                                    width: `${20 + ring * 15}px`,
                                    height: `${20 + ring * 15}px`,
                                  }}
                                  animate={{
                                    scale: [1, 3, 1],
                                    opacity: [0.8, 0, 0.8],
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: ring * 0.2,
                                  }}
                                />
                              ))}
                            </div>
                            
                            <div className="mt-4 flex items-center gap-2 bg-cyan-500/20 rounded-lg px-3 py-2 border border-cyan-500/30">
                              <motion.div
                                className="w-2 h-2 rounded-full bg-cyan-400"
                                animate={{
                                  scale: [1, 1.5, 1],
                                  opacity: [0.5, 1, 0.5],
                                }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                              <span className="text-xs text-cyan-300 font-semibold">Connected</span>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 3: Data Transfer */}
                        {nfcStep === 2 && (
                        <motion.div
                          key="transfer"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-4">
                              <Waves className="h-5 w-5 text-cyan-400" />
                              <span className="text-sm font-semibold text-white">Transferring Data...</span>
                            </div>
                            
                            <div className="space-y-3">
                              {[
                                { label: "Contact Information", progress: 100 },
                                { label: "Social Profiles", progress: 85 },
                                { label: "Portfolio Link", progress: 60 },
                              ].map((item, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-300">{item.label}</span>
                                    <span className="text-cyan-400 font-semibold">{item.progress}%</span>
                                  </div>
                                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <motion.div
                                      className="bg-gradient-to-r from-cyan-500 to-teal-500 h-1.5 rounded-full"
                                      initial={{ width: "0%" }}
                                      animate={{ width: `${item.progress}%` }}
                                      transition={{ duration: 1, delay: i * 0.3 }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Transferring 2.3 KB...</span>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 4: Success */}
                        {nfcStep === 3 && (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 h-full border-2 border-green-500/30 flex flex-col items-center justify-center">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
                            </motion.div>
                            <p className="text-lg font-bold text-green-400 mb-2">Contact Shared!</p>
                            <div className="bg-slate-800/50 rounded-lg p-3 w-full mt-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">JS</span>
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-white">John Smith</p>
                                  <p className="text-xs text-slate-400">Saved to contacts</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        )}
                        </>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            {/* Feature 4: Portfolio Builder - Building Blocks Animation */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={itemVariants}
              className="relative group"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl hover:border-orange-500/50 transition-all duration-500 h-full overflow-hidden relative">
                  {/* Animated background glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    animate={{
                      backgroundPosition: ["0% 0%", "100% 100%"],
                    }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  />
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
                        animate={{
                          rotate: [0, 10, -10, 0],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Briefcase className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Portfolio Builder</h3>
                        <p className="text-sm text-slate-400">Create & Share</p>
                      </div>
                    </div>

                    {/* Preview Animation or Detailed Process */}
                    <div className="relative bg-slate-900/70 rounded-xl p-4 mt-4 border border-slate-700/50 overflow-hidden min-h-[280px]">
                      <AnimatePresence mode="wait">
                        {/* Preview Animation */}
                        {!showPortfolioDetails && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-4"
                        >
                          <div className="relative h-full flex flex-col gap-2">
                            {/* Building Blocks Animation */}
                            <motion.div
                              className="bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-lg p-2 border border-orange-500/40"
                              initial={{ width: "0%", opacity: 0 }}
                              animate={{ width: "100%", opacity: 1 }}
                              transition={{ duration: 1, delay: 0.5 }}
                            >
                              <div className="h-2 bg-orange-400/50 rounded w-3/4" />
                            </motion.div>

                            <div className="flex gap-2 flex-1">
                              <motion.div
                                className="flex-1 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-lg p-2 border border-orange-500/30 flex flex-col gap-1"
                                initial={{ height: "0%", opacity: 0 }}
                                animate={{ height: "100%", opacity: 1 }}
                                transition={{ duration: 1, delay: 1 }}
                              >
                                <div className="h-1.5 bg-orange-400/40 rounded w-full" />
                                <div className="h-1.5 bg-orange-400/40 rounded w-5/6" />
                                <div className="h-1.5 bg-orange-400/40 rounded w-4/6" />
                              </motion.div>
                              <motion.div
                                className="flex-1 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-2 border border-amber-500/30"
                                initial={{ height: "0%", opacity: 0 }}
                                animate={{ height: "100%", opacity: 1 }}
                                transition={{ duration: 1, delay: 1.3 }}
                              >
                                <div className="h-full bg-gradient-to-br from-orange-400/20 to-amber-400/20 rounded" />
                              </motion.div>
                            </div>

                            <motion.div
                              className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-lg p-2 border border-amber-500/40 flex items-center gap-2"
                              initial={{ width: "0%", opacity: 0 }}
                              animate={{ width: "100%", opacity: 1 }}
                              transition={{ duration: 1, delay: 1.5 }}
                            >
                              <div className="w-4 h-4 rounded bg-orange-400/50" />
                              <div className="h-1.5 bg-amber-400/50 rounded flex-1" />
                            </motion.div>

                            {/* Floating Icons */}
                            {[Sparkles, Waves, Zap].map((Icon, i) => (
                              <motion.div
                                key={i}
                                className="absolute"
                                initial={{
                                  x: "50%",
                                  y: "50%",
                                  opacity: 0,
                                  scale: 0,
                                }}
                                animate={{
                                  x: `${30 + i * 20}%`,
                                  y: `${20 + i * 15}%`,
                                  opacity: [0, 1, 1, 0],
                                  scale: [0, 1, 1, 0],
                                  rotate: [0, 360],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  delay: 2 + i * 0.5,
                                }}
                              >
                                <Icon className="h-4 w-4 text-orange-400/60" />
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                        )}

                        {/* Detailed Process Steps */}
                        {showPortfolioDetails && (
                        <>
                        {/* Step 1: Template Selection */}
                        {portfolioStep === 0 && (
                        <motion.div
                          key="template"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-4">
                              <Briefcase className="h-5 w-5 text-orange-400" />
                              <span className="text-sm font-semibold text-white">Choose Template</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {[1, 2, 3, 4].map((i) => (
                                <motion.div
                                  key={i}
                                  className="bg-slate-700/50 rounded-lg p-2 border border-slate-600"
                                  whileHover={{ scale: 1.05, borderColor: "rgba(249, 115, 22, 0.5)" }}
                                >
                                  <div className="h-16 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded mb-1" />
                                  <div className="h-1.5 bg-slate-600 rounded w-3/4" />
                                </motion.div>
                              ))}
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-orange-400">
                              <Sparkles className="h-3 w-3" />
                              <span>Template {portfolioStep + 1} selected</span>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 2: Adding Sections */}
                        {portfolioStep === 1 && (
                        <motion.div
                          key="sections"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full">
                            <div className="flex items-center gap-2 mb-4">
                              <Zap className="h-5 w-5 text-orange-400" />
                              <span className="text-sm font-semibold text-white">Adding Sections</span>
                            </div>
                            <div className="space-y-2">
                              {[
                                { label: "Header", added: true },
                                { label: "About", added: true },
                                { label: "Projects", added: true },
                                { label: "Contact", added: false },
                              ].map((section, i) => (
                                <motion.div
                                  key={i}
                                  className="flex items-center justify-between bg-slate-700/50 rounded-lg p-2"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.2 }}
                                >
                                  <span className="text-xs text-slate-300">{section.label}</span>
                                  {section.added ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                                  ) : (
                                    <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 3: Content Editing */}
                        {portfolioStep === 2 && (
                        <motion.div
                          key="editing"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full overflow-y-auto">
                            <div className="flex items-center gap-2 mb-4">
                              <Sparkles className="h-5 w-5 text-orange-400" />
                              <span className="text-sm font-semibold text-white">Editing Content</span>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Name</label>
                                <div className="bg-slate-700 rounded px-2 py-1.5 text-sm text-white">John Smith</div>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Title</label>
                                <div className="bg-slate-700 rounded px-2 py-1.5 text-sm text-white">Senior Developer</div>
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Bio</label>
                                <div className="bg-slate-700 rounded px-2 py-1.5 text-sm text-white h-16">
                                  <motion.div
                                    className="h-1.5 bg-orange-400/30 rounded mb-1"
                                    animate={{ width: ["0%", "100%"] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                  />
                                  <motion.div
                                    className="h-1.5 bg-orange-400/30 rounded mb-1"
                                    animate={{ width: ["0%", "85%"] }}
                                    transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 4: Preview */}
                        {portfolioStep === 3 && (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-slate-800 rounded-lg p-4 h-full overflow-y-auto">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-white">Portfolio Preview</span>
                              <Badge className="bg-orange-600 text-xs">Live</Badge>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-lg p-3 border border-orange-500/30">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">JS</span>
                                </div>
                                <div>
                                  <div className="h-2.5 bg-orange-400/50 rounded w-24 mb-1" />
                                  <div className="h-2 bg-orange-400/30 rounded w-20" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-1.5 bg-slate-700 rounded" />
                                <div className="h-1.5 bg-slate-700 rounded w-5/6" />
                                <div className="h-16 bg-slate-700/50 rounded mt-2" />
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-orange-400">
                              <Network className="h-3 w-3" />
                              <span>portfolio.netlink-cogni.com/john-smith</span>
                            </div>
                          </div>
                        </motion.div>
                        )}

                        {/* Step 5: Published */}
                        {portfolioStep === 4 && (
                        <motion.div
                          key="published"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-4"
                        >
                          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-4 h-full border-2 border-green-500/30 flex flex-col items-center justify-center">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
                            </motion.div>
                            <p className="text-lg font-bold text-green-400 mb-2">Portfolio Published!</p>
                            <div className="bg-slate-800/50 rounded-lg p-3 w-full mt-4">
                              <div className="flex items-center gap-2 text-xs text-green-400 mb-2">
                                <Network className="h-3 w-3" />
                                <span>Shareable link ready</span>
                              </div>
                              <div className="text-xs text-slate-400 text-center">
                                portfolio.netlink-cogni.com/john-smith
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        )}
                        </>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          {/* Demo Tabs */}
          <motion.div
            className="flex justify-center gap-3 mb-12 flex-wrap"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
            <Button
              variant={activeDemo === "scan" ? "default" : "outline"}
              onClick={() => setActiveDemo("scan")}
                className={`gap-2 h-11 px-6 font-medium transition-all ${
                activeDemo === "scan"
                    ? "bg-white text-slate-900 hover:bg-slate-100 shadow-lg"
                  : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <Scan className="h-4 w-4" />
              Card Scanning
            </Button>
            </motion.div>
            <motion.div variants={itemVariants}>
            <Button
              variant={activeDemo === "ai" ? "default" : "outline"}
              onClick={() => setActiveDemo("ai")}
                className={`gap-2 h-11 px-6 font-medium transition-all ${
                activeDemo === "ai"
                    ? "bg-white text-slate-900 hover:bg-slate-100 shadow-lg"
                  : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <Bot className="h-4 w-4" />
              AI Agent
            </Button>
            </motion.div>
            <motion.div variants={itemVariants}>
            <Button
              variant={activeDemo === "analytics" ? "default" : "outline"}
              onClick={() => setActiveDemo("analytics")}
                className={`gap-2 h-11 px-6 font-medium transition-all ${
                activeDemo === "analytics"
                    ? "bg-white text-slate-900 hover:bg-slate-100 shadow-lg"
                  : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            </motion.div>
          </motion.div>

          {/* Demo Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
          <Card className="overflow-hidden border border-slate-800/50 shadow-2xl bg-slate-900/40 backdrop-blur-sm">
            <CardContent className="p-0">
                <AnimatePresence mode="wait">
              {activeDemo === "scan" && (
                    <motion.div
                      key="scan"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900 p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                    >
                      <motion.div variants={itemVariants}>
                      <Badge className="mb-4 bg-blue-600">Step 1: Upload</Badge>
                      </motion.div>
                      <motion.h3
                        variants={itemVariants}
                        className="text-3xl font-bold mb-4 text-gray-900 dark:text-white"
                      >
                        Instant Business Card Scanning
                      </motion.h3>
                      <div className="space-y-4">
                        {[
                          {
                            num: 1,
                            title: "Take a photo",
                            desc: "Snap a picture of any business card",
                          },
                          {
                            num: 2,
                            title: "AI extracts info",
                            desc: "Name, email, phone, company—all captured instantly",
                          },
                          {
                            num: 3,
                            title: "Auto-saved to contacts",
                            desc: "Contact added to your database in 3 seconds",
                          },
                        ].map((step, idx) => (
                          <motion.div
                            key={step.num}
                            variants={itemVariants}
                            className="flex items-start gap-3"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <motion.div
                              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0"
                              whileHover={{ scale: 1.1, rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              {step.num}
                            </motion.div>
                          <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{step.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
                          </div>
                          </motion.div>
                        ))}
                      </div>
                      <motion.div
                        variants={itemVariants}
                        className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-green-800 dark:text-green-300 font-semibold">
                          ⏱️ Time saved: 2 minutes per card → 3 seconds
                        </p>
                      </motion.div>
                    </motion.div>
                    <div className="relative">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Upload className="h-5 w-5 text-blue-600" />
                          <span className="font-semibold">Business Card Scanner</span>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-4">
                          <Scan className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">Upload business card</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span>✓ AI Extraction Complete</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            <p className="font-semibold">John Smith</p>
                            <p className="text-gray-600 dark:text-gray-400">CEO at TechCorp</p>
                            <p className="text-gray-600 dark:text-gray-400">john@techcorp.com</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                    </motion.div>
              )}

              {activeDemo === "ai" && (
                    <motion.div
                      key="ai"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-purple-900 p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                    >
                      <motion.div variants={itemVariants}>
                      <Badge className="mb-4 bg-purple-600">Step 2: Automate</Badge>
                      </motion.div>
                      <motion.h3
                        variants={itemVariants}
                        className="text-3xl font-bold mb-4 text-gray-900 dark:text-white"
                      >
                        AI-Powered Cold Emails
                      </motion.h3>
                      <div className="space-y-4">
                        {[
                          {
                            num: 1,
                            title: "Create campaign",
                            desc: "Set your purpose and select contacts",
                          },
                          {
                            num: 2,
                            title: "AI personalizes each email",
                            desc: "Unique, contextual emails for every contact",
                          },
                          {
                            num: 3,
                            title: "Send automatically",
                            desc: "Reach 100+ contacts with one click",
                          },
                        ].map((step, idx) => (
                          <motion.div
                            key={step.num}
                            variants={itemVariants}
                            className="flex items-start gap-3"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <motion.div
                              className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0"
                              whileHover={{ scale: 1.1, rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              {step.num}
                            </motion.div>
                          <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{step.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
                          </div>
                          </motion.div>
                        ))}
                      </div>
                      <motion.div
                        variants={itemVariants}
                        className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-green-800 dark:text-green-300 font-semibold">
                          ⏱️ Time saved: 5 hours per campaign → 5 minutes
                        </p>
                      </motion.div>
                    </motion.div>
                    <div className="relative">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Bot className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold">AI Email Agent</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Campaign Name</label>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">Q1 Product Launch</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Selected Contacts</label>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">25 contacts selected</div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Sending emails...</span>
                              <span className="text-sm">60%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-600 h-2 rounded-full" style={{ width: "60%" }} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>15 emails sent successfully</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                    </motion.div>
              )}

              {activeDemo === "analytics" && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-green-900 p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                    >
                      <motion.div variants={itemVariants}>
                      <Badge className="mb-4 bg-green-600">Step 3: Track</Badge>
                      </motion.div>
                      <motion.h3
                        variants={itemVariants}
                        className="text-3xl font-bold mb-4 text-gray-900 dark:text-white"
                      >
                        Powerful Analytics
                      </motion.h3>
                      <div className="space-y-4">
                        {[
                          {
                            num: 1,
                            title: "Track network growth",
                            desc: "See your contacts and connections expand",
                          },
                          {
                            num: 2,
                            title: "Monitor engagement",
                            desc: "Email opens, responses, and follow-ups",
                          },
                          {
                            num: 3,
                            title: "Optimize your strategy",
                            desc: "Data-driven insights for better results",
                          },
                        ].map((step, idx) => (
                          <motion.div
                            key={step.num}
                            variants={itemVariants}
                            className="flex items-start gap-3"
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <motion.div
                              className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0"
                              whileHover={{ scale: 1.1, rotate: 360 }}
                              transition={{ duration: 0.5 }}
                            >
                              {step.num}
                            </motion.div>
                          <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{step.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
                          </div>
                          </motion.div>
                        ))}
                      </div>
                      <motion.div
                        variants={itemVariants}
                        className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg"
                        whileHover={{ scale: 1.02 }}
                      >
                        <p className="text-green-800 dark:text-green-300 font-semibold">
                          ⏱️ Time saved: 3 hours weekly reporting → Real-time insights
                        </p>
                      </motion.div>
                    </motion.div>
                    <div className="relative">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <BarChart3 className="h-5 w-5 text-green-600" />
                          <span className="font-semibold">Analytics Dashboard</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                            <p className="text-2xl font-bold text-blue-600">248</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Total Contacts</p>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                            <p className="text-2xl font-bold text-purple-600">89</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Emails Sent</p>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                            <p className="text-2xl font-bold text-green-600">67%</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Open Rate</p>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                            <p className="text-2xl font-bold text-orange-600">42</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Responses</p>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-32 rounded-lg flex items-end p-2">
                          <div className="flex items-end gap-1 w-full h-full">
                            {[40, 65, 45, 80, 60, 85, 70].map((height, i) => (
                              <div key={i} className="bg-white/80 rounded-t flex-1" style={{ height: `${height}%` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                    </motion.div>
              )}
                </AnimatePresence>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30 backdrop-blur-sm relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-cyan-200 to-blue-300 bg-clip-text text-transparent"
            >
              Everything You Need
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-300"
            >
              Powerful features that make networking effortless
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={containerVariants}
          >
            {[
              {
                icon: Scan,
                title: "AI Business Card Scanner",
                description: "Instantly digitize business cards with 99% accuracy. Extract all contact info in seconds.",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                icon: Bot,
                title: "AI Email Agent",
                description: "Send personalized cold emails at scale. AI crafts unique messages for each contact.",
                gradient: "from-purple-500 to-purple-600",
              },
              {
                icon: Users,
                title: "Smart Contact Management",
                description: "Organize, search, and manage all your contacts in one intelligent dashboard.",
                gradient: "from-green-500 to-green-600",
              },
              {
                icon: Calendar,
                title: "Event Management",
                description: "Schedule follow-ups and track networking events with smart reminders.",
                gradient: "from-orange-500 to-orange-600",
              },
              {
                icon: BarChart3,
                title: "Analytics & Insights",
                description: "Track network growth, email performance, and engagement metrics in real-time.",
                gradient: "from-pink-500 to-pink-600",
              },
              {
                icon: Brain,
                title: "AI-Powered Insights",
                description: "Get smart suggestions on who to follow up with and when to reach out.",
                gradient: "from-teal-500 to-teal-600",
              },
            ].map((feature, index) => (
              <motion.div key={feature.title} variants={itemVariants}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="border-2 border-slate-700/50 hover:border-cyan-500/50 bg-slate-800/40 backdrop-blur-sm hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 h-full">
              <CardContent className="p-6">
                      <motion.div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <feature.icon className="h-6 w-6 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                      <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.div
              variants={scaleIn}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-2 border-cyan-500/30 shadow-2xl bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 text-white overflow-hidden relative">
                <motion.div
                  className="absolute inset-0 opacity-20"
                  animate={{
                    backgroundPosition: ["0% 0%", "100% 100%"],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                  }}
                />
                <CardContent className="p-12 text-center relative z-10">
                  <motion.div
                    variants={itemVariants}
                    className="mb-6"
                  >
                    <TrendingUp className="h-12 w-12 text-white/80 mx-auto mb-4" />
                  </motion.div>
                  <motion.h2
                    variants={itemVariants}
                    className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
                  >
                    Ready to Transform Your Networking?
                  </motion.h2>
                  <motion.p
                    variants={itemVariants}
                    className="text-xl mb-8 text-cyan-100"
                  >
                    Join thousands of professionals saving 10+ hours per week
                  </motion.p>
                  <motion.div
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                  >
                  <Link href="/auth/signup">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          size="lg"
                          variant="secondary"
                          className="text-lg px-8 py-6 bg-white text-cyan-600 hover:bg-cyan-50 font-semibold shadow-lg"
                        >
                      Start Free Trial
                      <Zap className="ml-2 h-5 w-5" />
                    </Button>
                      </motion.div>
                  </Link>
                  <Link href="/auth/login">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      variant="outline"
                          className="text-lg px-8 py-6 border-2 border-white/30 text-white hover:bg-white/10 bg-transparent font-semibold"
                    >
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                      </motion.div>
                  </Link>
                  </motion.div>
                  <motion.p
                    variants={itemVariants}
                    className="mt-6 text-sm text-cyan-100"
                  >
                  No credit card required • 14-day free trial • Cancel anytime
                  </motion.p>
            </CardContent>
          </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Network className="h-6 w-6 text-cyan-400" />
            </motion.div>
            <span className="text-xl font-bold text-white">
              Netlink<span className="text-cyan-400">-Cogni</span>
            </span>
          </motion.div>
          <motion.p
            variants={itemVariants}
            className="text-slate-400 mb-4"
          >
            © 2025 Netlink-Cogni. All rights reserved. Making networking effortless with AI.
          </motion.p>
          <motion.div
            variants={itemVariants}
            className="flex justify-center gap-6 text-sm flex-wrap"
          >
            <Link href="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Home
              </motion.div>
            </Link>
            <Link href="/public/about">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              About
              </motion.div>
            </Link>
            <Link href="/public/networkers">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Networkers
              </motion.div>
            </Link>
            <Link href="/privacy">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Privacy Policy
              </motion.div>
            </Link>
            <Link href="/terms">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
            >
              Terms & Conditions
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}
