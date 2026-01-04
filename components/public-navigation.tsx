"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { BookOpen, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function PublicNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center group transition-all">
            <div className="relative h-32 w-[400px] overflow-hidden transform group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]">
              <Image 
                src="/Logo1.png" 
                alt="Netlink AI Logo" 
                fill 
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link href="/public/about">
              <Button variant="ghost">About</Button>
            </Link>
            {/* <Link href="/public/networkers">
              <Button variant="ghost">Networkers</Button>
            </Link> */}
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/resources">
              <Button variant="ghost">
                <BookOpen className="h-4 w-4 mr-2" />
                Resources
              </Button>
            </Link>

            <Link href="/waitlist">
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                Join Waitlist
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden border-t bg-background/95 backdrop-blur overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 space-y-4 flex flex-col">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg">
                  Home
                </Button>
              </Link>
              <Link href="/public/about" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg">
                  About
                </Button>
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg">
                  Pricing
                </Button>
              </Link>
              <Link href="/resources" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg">
                  <BookOpen className="h-5 w-5 mr-3" />
                  Resources
                </Button>
              </Link>
              <div className="pt-4 border-t">
                <Link href="/waitlist" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium shadow-md py-6 text-lg">
                    Join Waitlist
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
