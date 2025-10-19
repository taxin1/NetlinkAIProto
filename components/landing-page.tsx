"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingScreen } from "@/components/loading-screen"
import {
  Bot,
  Scan,
  Mail,
  TrendingUp,
  Clock,
  Zap,
  Users,
  Calendar,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  Brain,
  Send,
  Upload,
  Network,
  ChevronRight,
  Cpu,
  Shield,
  Workflow,
} from "lucide-react"

export function LandingPage() {
  const [activeDemo, setActiveDemo] = useState<"scan" | "ai" | "analytics">("scan")
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Show loading screen
    const loadingTimer = setTimeout(() => {
      setIsLoading(false)
      setTimeout(() => setIsVisible(true), 100)
    }, 3000)

    return () => clearTimeout(loadingTimer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated tech background */}
      <div className="fixed inset-0 z-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 tech-grid opacity-30" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
        
        {/* Scan line effect */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400 to-transparent h-40 animate-scan-line" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Network className="h-7 w-7 text-white group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="text-xl font-semibold text-white tracking-tight">
                Netlink<span className="text-cyan-400">-Cogni</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button 
                  variant="ghost" 
                  className="text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-white text-slate-900 hover:bg-slate-100 font-medium shadow-md">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium tracking-wide text-slate-300">
                ENTERPRISE AI PLATFORM
              </span>
            </div>
            
            <h1 className="text-[3.5rem] sm:text-7xl lg:text-8xl font-bold mb-8 leading-[1.05] tracking-tight">
              <span className="block text-white mb-2">
                Intelligent Networking
              </span>
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Automated Growth
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Enterprise-grade AI platform that transforms your business networking. 
              Automate contact management, deploy intelligent outreach campaigns, and scale your professional network effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <Link href="/auth/signup">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-base font-medium bg-white text-slate-900 hover:bg-slate-100 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button 
                  size="lg" 
                  variant="ghost"
                  className="h-14 px-8 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600"
                >
                  Sign In
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-400 font-light">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <span>14-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-slate-500" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Time Saved Section */}
      <section className="relative py-24 px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group p-10 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-2xl hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  <Clock className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-5xl font-bold text-white mb-2 tracking-tight">10+</div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Hours Saved</div>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed font-light">
                Automated data processing and contact management per week
              </p>
            </div>

            <div className="group p-10 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-2xl hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  <TrendingUp className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-5xl font-bold text-white mb-2 tracking-tight">5x</div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Faster Growth</div>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed font-light">
                Network expansion and outreach campaign deployment speed
              </p>
            </div>

            <div className="group p-10 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-2xl hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-300">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                  <Target className="h-6 w-6 text-slate-400 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <div className="text-5xl font-bold text-white mb-2 tracking-tight">99.8%</div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">AI Accuracy</div>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed font-light">
                Precision rate on intelligent data extraction and processing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Preview */}
      <section className="relative py-24 px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-white tracking-tight">
              See it in action
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
              Experience how our AI platform transforms your networking workflow
            </p>
          </div>

          {/* Demo Tabs */}
          <div className="flex justify-center gap-3 mb-12 flex-wrap">
            <Button
              variant={activeDemo === "scan" ? "default" : "outline"}
              onClick={() => setActiveDemo("scan")}
              className={`gap-2 h-11 px-6 font-medium ${
                activeDemo === "scan"
                  ? "bg-white text-slate-900 hover:bg-slate-100"
                  : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <Scan className="h-4 w-4" />
              Card Scanning
            </Button>
            <Button
              variant={activeDemo === "ai" ? "default" : "outline"}
              onClick={() => setActiveDemo("ai")}
              className={`gap-2 h-11 px-6 font-medium ${
                activeDemo === "ai"
                  ? "bg-white text-slate-900 hover:bg-slate-100"
                  : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <Bot className="h-4 w-4" />
              AI Agent
            </Button>
            <Button
              variant={activeDemo === "analytics" ? "default" : "outline"}
              onClick={() => setActiveDemo("analytics")}
              className={`gap-2 h-11 px-6 font-medium ${
                activeDemo === "analytics"
                  ? "bg-white text-slate-900 hover:bg-slate-100"
                  : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 hover:border-slate-600"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </div>

          {/* Demo Content */}
          <Card className="overflow-hidden border border-slate-800/50 shadow-2xl bg-slate-900/40 backdrop-blur-sm">
            <CardContent className="p-0">
              {activeDemo === "scan" && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-blue-900 p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <Badge className="mb-4 bg-blue-600">Step 1: Upload</Badge>
                      <h3 className="text-3xl font-bold mb-4">Instant Business Card Scanning</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            1
                          </div>
                          <div>
                            <p className="font-semibold">Take a photo</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Snap a picture of any business card
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            2
                          </div>
                          <div>
                            <p className="font-semibold">AI extracts info</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Name, email, phone, company—all captured instantly
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                            3
                          </div>
                          <div>
                            <p className="font-semibold">Auto-saved to contacts</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Contact added to your database in 3 seconds
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <p className="text-green-800 dark:text-green-300 font-semibold">
                          ⏱️ Time saved: 2 minutes per card → 3 seconds
                        </p>
                      </div>
                    </div>
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
              )}

              {activeDemo === "ai" && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-purple-900 p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <Badge className="mb-4 bg-purple-600">Step 2: Automate</Badge>
                      <h3 className="text-3xl font-bold mb-4">AI-Powered Cold Emails</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                            1
                          </div>
                          <div>
                            <p className="font-semibold">Create campaign</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Set your purpose and select contacts
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                            2
                          </div>
                          <div>
                            <p className="font-semibold">AI personalizes each email</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Unique, contextual emails for every contact
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                            3
                          </div>
                          <div>
                            <p className="font-semibold">Send automatically</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Reach 100+ contacts with one click
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <p className="text-green-800 dark:text-green-300 font-semibold">
                          ⏱️ Time saved: 5 hours per campaign → 5 minutes
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Bot className="h-5 w-5 text-purple-600" />
                          <span className="font-semibold">AI Email Agent</span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium">Campaign Name</label>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                              Q1 Product Launch
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Selected Contacts</label>
                            <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                              25 contacts selected
                            </div>
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
              )}

              {activeDemo === "analytics" && (
                <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-gray-800 dark:to-green-900 p-12">
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <Badge className="mb-4 bg-green-600">Step 3: Track</Badge>
                      <h3 className="text-3xl font-bold mb-4">Powerful Analytics</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                            1
                          </div>
                          <div>
                            <p className="font-semibold">Track network growth</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              See your contacts and connections expand
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                            2
                          </div>
                          <div>
                            <p className="font-semibold">Monitor engagement</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Email opens, responses, and follow-ups
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0">
                            3
                          </div>
                          <div>
                            <p className="font-semibold">Optimize your strategy</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Data-driven insights for better results
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <p className="text-green-800 dark:text-green-300 font-semibold">
                          ⏱️ Time saved: 3 hours weekly reporting → Real-time insights
                        </p>
                      </div>
                    </div>
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
                              <div
                                key={i}
                                className="bg-white/80 rounded-t flex-1"
                                style={{ height: `${height}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-purple-900 dark:from-white dark:to-purple-100 bg-clip-text text-transparent">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful features that make networking effortless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                  <Scan className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Business Card Scanner</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Instantly digitize business cards with 99% accuracy. Extract all contact info in seconds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Email Agent</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Send personalized cold emails at scale. AI crafts unique messages for each contact.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Contact Management</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Organize, search, and manage all your contacts in one intelligent dashboard.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Event Management</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Schedule follow-ups and track networking events with smart reminders.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Analytics & Insights</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track network growth, email performance, and engagement metrics in real-time.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI-Powered Insights</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Get smart suggestions on who to follow up with and when to reach out.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 shadow-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white overflow-hidden">
            <CardContent className="p-12 text-center relative">
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative z-10">
                <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                  Ready to Transform Your Networking?
                </h2>
                <p className="text-xl mb-8 text-blue-100">
                  Join thousands of professionals saving 10+ hours per week
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup">
                    <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                      Start Free Trial
                      <Zap className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white/10">
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
                <p className="mt-6 text-sm text-blue-100">
                  No credit card required • 14-day free trial • Cancel anytime
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Network className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Netlink-Cogni</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            © 2025 Netlink-Cogni. All rights reserved. Making networking effortless with AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
