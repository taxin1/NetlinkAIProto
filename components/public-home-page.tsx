"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PublicNavigation } from "@/components/public-navigation"
import {
  Users,
  Network,
  Globe,
  ArrowRight,
  Sparkles,
  Briefcase,
  Mail,
  Calendar,
  Search
} from "lucide-react"

export function PublicHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Navigation */}
      <PublicNavigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            Connect with Global Networkers
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Discover professionals from around the world. Share your portfolio, connect through social networks, and build meaningful relationships.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-10 relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-sm">
                <Search className="h-4 w-4 text-white" />
              </div>
            </div>
            <input
              type="text"
              placeholder="Search for Netlink AI professionals, portfolios..."
              className="w-full bg-background/50 backdrop-blur-sm border border-muted py-5 pl-16 pr-6 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-xl text-lg"
            />
            <div className="absolute right-3 inset-y-0 flex items-center">
              <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-xl px-6">
                Search
              </Button>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/public/networkers">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                Explore Networkers
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline">
                Join Now
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Why Join Our Network?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with professionals worldwide and accelerate your networking journey
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Global Reach</h3>
                <p className="text-muted-foreground">
                  Connect with professionals from around the world. Share your portfolio and social profiles for faster global communication.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Network className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Networking</h3>
                <p className="text-muted-foreground">
                  AI-powered networking tools help you discover relevant connections and build meaningful professional relationships.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Public Profiles</h3>
                <p className="text-muted-foreground">
                  Showcase your professional profile publicly. Share your portfolio, social IDs, and connect with like-minded professionals.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0">
            <CardContent className="p-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Ready to Expand Your Network?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of professionals already connecting on Netlink AI
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary">
                    Create Your Profile
                  </Button>
                </Link>
                <Link href="/public/networkers">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Browse Networkers
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Netlink AI - Network Link AI. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="/public/about" className="text-sm text-muted-foreground hover:text-foreground">
                About
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
