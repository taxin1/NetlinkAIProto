"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { BookOpen, Menu, X, Languages, Bot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "@/lib/hooks/use-translations"
import { startGuestSession } from "@/lib/guest-trial"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function PublicNavigation() {
  const { t, lang, changeLanguage } = useTranslations()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  const handleTryDemo = () => {
    startGuestSession()
    router.push("/dashboard")
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
              <Button variant="ghost">{t("home")}</Button>
            </Link>
            <Link href="/public/about">
              <Button variant="ghost">{t("about")}</Button>
            </Link>
            {/* <Link href="/public/networkers">
              <Button variant="ghost">Networkers</Button>
            </Link> */}
            <Link href="/pricing">
              <Button variant="ghost">{t("pricing")}</Button>
            </Link>
            <Link href="/resources">
              <Button variant="ghost">
                <BookOpen className="h-4 w-4 mr-2" />
                {t("resources")}
              </Button>
            </Link>

            {isMounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative group">
                    <Languages className="h-5 w-5 transition-transform group-hover:scale-110" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => changeLanguage("en")} className={lang === "en" ? "bg-accent" : ""}>
                    🇺🇸 English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => changeLanguage("ja")} className={lang === "ja" ? "bg-accent" : ""}>
                    🇯🇵 日本語
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" className="relative group">
                <Languages className="h-5 w-5" />
              </Button>
            )}

            <Link href="/auth/login">
              <Button variant="ghost">{t("signIn")}</Button>
            </Link>

            <Button 
              variant="outline" 
              onClick={handleTryDemo}
              className="border-primary/20 hover:bg-primary/10"
            >
              <Bot className="h-4 w-4 mr-2" />
              Try Demo
            </Button>

            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                {t("getStarted")}
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
                  {t("home")}
                </Button>
              </Link>
              <Link href="/public/about" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg">
                  {t("about")}
                </Button>
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg">
                  {t("pricing")}
                </Button>
              </Link>
              <Link href="/resources" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-lg">
                  <BookOpen className="h-5 w-5 mr-3" />
                  {t("resources")}
                </Button>
              </Link>
              
              <div className="flex gap-2 p-2">
                <Button 
                  variant={lang === "en" ? "default" : "outline"} 
                  className="flex-1"
                  onClick={() => {
                    changeLanguage("en")
                    setMobileMenuOpen(false)
                  }}
                >
                  🇺🇸 English
                </Button>
                <Button 
                  variant={lang === "ja" ? "default" : "outline"} 
                  className="flex-1"
                  onClick={() => {
                    changeLanguage("ja")
                    setMobileMenuOpen(false)
                  }}
                >
                  🇯🇵 日本語
                </Button>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full text-lg py-6">
                    {t("signIn")}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleTryDemo()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full text-lg py-6 border-primary/20 bg-primary/5"
                >
                  <Bot className="h-5 w-5 mr-3" />
                  Try Demo
                </Button>
                <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium shadow-md py-6 text-lg">
                    {t("getStarted")}
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
