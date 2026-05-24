"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, Mail, BarChart3, LogOut, Bot, Settings, Calendar, Menu, X, Share2, CheckCircle2, CalendarDays, Briefcase, Home, Info, Sparkles, Wand2, Crown, CreditCard, BookOpen, LucideIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useMobile } from "@/lib/hooks/use-mobile"
import { useTranslations } from "@/lib/hooks/use-translations"
import { isGuest, GUEST_COOKIE_NAME } from "@/lib/guest-trial"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Subscription } from "@/types/subscription"
import { FileText } from "lucide-react"

interface SidebarProps {
  user: {
    id?: string
    email?: string
    isGuest?: boolean
  }
}

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

export function Sidebar({ user }: SidebarProps) {
  const { t } = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile } = useMobile()
  
  // 1. All useState hooks
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  // 2. Constants and derived state
  const isGuestMode = user.isGuest || (user.id ? isGuest(user.id) : false)

  const navigation: NavItem[] = [
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { name: t("networkProfile"), href: "/dashboard/profile", icon: Share2 },
    { name: t("portfolio"), href: "/dashboard/portfolio", icon: Briefcase },
    { name: t("contacts"), href: "/dashboard/contacts", icon: Users },
    ...(!isGuestMode ? [
      { name: t("networkingMode"), href: "/dashboard/networking", icon: Sparkles },
      { name: t("calendar"), href: "/dashboard/calendar", icon: CalendarDays },
      { name: t("events"), href: "/dashboard/events", icon: Calendar },
    ] : []),
    { name: t("emails"), href: "/dashboard/emails", icon: Mail },
    ...(!isGuestMode ? [
      { name: t("aiCampaigns"), href: "/dashboard/campaigns", icon: Wand2 },
    ] : []),
    { name: "Quotation Form", href: "/dashboard/quotation", icon: FileText },
    { name: t("analytics"), href: "/dashboard/analytics", icon: BarChart3 },
    { name: t("aiAssistant"), href: "/dashboard/ai-assistant", icon: Bot },
    { name: t("settings"), href: "/dashboard/settings", icon: Settings },
  ]

  const publicNavigation: NavItem[] = [
    { name: t("home"), href: "/", icon: Home },
    { name: t("about"), href: "/public/about", icon: Info },
  ]

  const resourcesNavigation: NavItem[] = [
    { name: t("resources"), href: "/resources", icon: BookOpen },
    { name: t("gettingStarted"), href: "/resources/getting-started", icon: Sparkles },
    { name: t("setupGuide"), href: "/resources/setup-guide", icon: Settings },
    { name: t("pricing"), href: "/resources/pricing", icon: Crown },
    { name: t("faq"), href: "/resources/faq", icon: Info },
  ]

  // 3. Callbacks
  const handleSignOut = useCallback(async () => {
    if (isGuestMode) {
      document.cookie = `${GUEST_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
      router.push("/")
      router.refresh()
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
    setMobileMenuOpen(false)
  }, [isGuestMode, router])

  // 4. All useEffect hooks - ensuring stable order and dependency arrays
  
  // Effect 1: Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Effect 2: Check Google Calendar
  useEffect(() => {
    const checkGoogleCalendar = async () => {
      if (isGuestMode || !user.id) {
        setGoogleCalendarConnected(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: connection } = await supabase
          .from('google_calendar_connections')
          .select('sync_enabled')
          .eq('user_id', user.id)
          .eq('sync_enabled', true)
          .single()

        setGoogleCalendarConnected(!!connection)
      } catch (error) {
        setGoogleCalendarConnected(false)
      }
    }

    checkGoogleCalendar()
  }, [user.id, isGuestMode])

  // Effect 3: Fetch subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      if (isGuestMode || !user.id) {
        setSubscription(null)
        return
      }

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single()

        if (error) {
          // Handle missing table gracefully (PGRST205 = table not found)
          if (error.code === 'PGRST116' || error.code === '22P02' || error.code === 'PGRST205') {
            setSubscription(null)
            return
          }
          // Only log non-critical errors
          if (error.code !== 'PGRST205') {
            console.error("Error fetching subscription:", JSON.stringify(error, null, 2))
          }
          return
        }

        setSubscription(data || null)
      } catch (error) {
        console.error("Error fetching subscription (catch):", error)
      }
    }

    fetchSubscription()
  }, [user.id, isGuestMode])

  // 5. Internal components
  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className={cn(
        "flex shrink-0 items-center justify-center border-b border-slate-800/50 px-4",
        isMobile ? "h-20" : "h-48"
      )}>
        <Link href="/dashboard" className="flex items-center group w-full" onClick={onItemClick}>
          <div className={cn(
            "relative w-full overflow-hidden transition-all duration-700 transform group-hover:scale-110 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]",
            isMobile ? "h-16" : "h-40"
          )}>
            <Image 
              src="/Logo1.png" 
              alt="Netlink AI Logo" 
              fill 
              className="object-contain"
            />
          </div>
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="text-white hover:bg-slate-800/50"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <nav
        data-scroll-container="true"
        className="flex-1 min-h-0 space-y-1 overflow-y-auto overscroll-contain p-4 touch-pan-y touch-scroll"
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
          const showGoogleBadge = (item.name === "Calendar" || item.name === "Events") && googleCalendarConnected

          // Map navigation items to tour selectors based on href
          const getTourSelector = (href: string): string | undefined => {
            const hrefToTourMap: Record<string, string> = {
              "/dashboard/contacts": "contacts-nav",
              "/dashboard/events": "events-nav",
              "/dashboard/emails": "emails-nav",
              "/dashboard/ai-assistant": "ai-assistant-nav",
              "/dashboard/portfolio": "portfolio-nav",
              "/dashboard/profile": "profile-nav",
              "/dashboard/campaigns": "campaigns-nav",
              "/dashboard/analytics": "analytics-nav",
            }
            return hrefToTourMap[href]
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              data-tour={getTourSelector(item.href)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {showGoogleBadge && (
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 bg-green-500/20 text-green-400 border-green-500/30"
                  >
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    Synced
                  </Badge>
                </div>
              )}
              {item.name === "Events" && !googleCalendarConnected && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 bg-blue-500/10 text-blue-400 border-blue-500/30"
                >
                  NEW
                </Badge>
              )}
            </Link>
          )
        })}

        <div className="my-4 border-t border-slate-800/50"></div>

        <div className="mb-2 px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t("resources")}</p>
        </div>
        {resourcesNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
              pathname === item.href || pathname?.startsWith(item.href)
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.name}</span>
          </Link>
        ))}

        <div className="my-4 border-t border-slate-800/50"></div>

        <div className="mb-2 px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t("publicPages")}</p>
        </div>
        {publicNavigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
              pathname === item.href || pathname?.startsWith(item.href)
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex-1">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-800/50 p-4">
        <div className="mb-3 px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{t("account")}</p>
          <p className="text-sm font-medium text-slate-300 truncate mb-2">{user.email}</p>
          {isGuestMode ? (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
              Trial Mode
            </Badge>
          ) : (
            <Badge variant={!subscription || subscription.plan_name === 'free' ? 'secondary' : 'default'} className="text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit">
              {subscription && (subscription.plan_name === 'professional' || subscription.plan_name === 'enterprise') && <Crown className="h-2.5 w-2.5" />}
              {!subscription || subscription.plan_name === 'free' ? 'Free' : subscription.plan_name === 'professional' ? 'Pro' : 'Enterprise'}
            </Badge>
          )}
        </div>
        
        {!isGuestMode && (
          <Link
            href="/dashboard/settings#subscription-management"
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 mb-2",
              pathname === "/dashboard/settings" ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-white hover:bg-slate-800/50",
            )}
          >
            <CreditCard className="h-4 w-4" />
            <span className="flex-1">{t("manageSubscription")}</span>
          </Link>
        )}

        <button
          className="w-full flex items-center justify-start px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium transition-all rounded-lg"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {isGuestMode ? "End Trial" : t("signOut")}
        </button>

        {isGuestMode && (
          <div className="mt-4 px-2">
            <Link href="/auth/signup">
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20">
                <Sparkles className="mr-2 h-4 w-4" />
                Sign Up Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {isMobile && (
        <div className="fixed top-4 left-4 z-50 lg:hidden">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="bg-slate-900/80 backdrop-blur-xl border-slate-800/50 text-white hover:bg-slate-800/50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {isMobile && (
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogContent
            showCloseButton={false}
            className="fixed left-0 top-0 flex h-full max-h-dvh w-[280px] max-w-[85vw] translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-r border-slate-800/50 bg-slate-900/95 p-0 backdrop-blur-xl"
          >
            <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
            <div className="relative z-20 flex h-full min-h-0 w-full flex-col overflow-hidden">
              <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {!isMobile && (
        <div className="relative z-20 flex h-screen min-h-0 w-64 flex-col overflow-hidden border-r border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
          <SidebarContent />
        </div>
      )}
    </>
  )
}
