"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, Mail, BarChart3, LogOut, Network, Bot, Settings, Calendar, Menu, X, Share2, Phone, CheckCircle2, CalendarDays, Briefcase, Home, Info, UserCircle, Sparkles, Wand2, Crown, CreditCard, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { useMobile } from "@/lib/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Subscription } from "@/types/subscription"

interface SidebarProps {
  user: {
    id?: string
    email?: string
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Network Profile", href: "/dashboard/profile", icon: Share2 },
  { name: "Portfolio", href: "/dashboard/portfolio", icon: Briefcase },
  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
  { name: "Networking Mode", href: "/dashboard/networking", icon: Sparkles },
  { name: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Emails", href: "/dashboard/emails", icon: Mail },
  { name: "AI Campaigns", href: "/dashboard/campaigns", icon: Wand2 },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const publicNavigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "About", href: "/public/about", icon: Info },
  // { name: "Networkers", href: "/public/networkers", icon: UserCircle }, // Hidden for now
]

const resourcesNavigation = [
  { name: "Resources Home", href: "/resources", icon: BookOpen },
  { name: "Getting Started", href: "/resources/getting-started", icon: Sparkles },
  { name: "Setup Guide", href: "/resources/setup-guide", icon: Settings },
  { name: "Pricing", href: "/resources/pricing", icon: Crown },
  { name: "FAQ", href: "/resources/faq", icon: Info },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile } = useMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)
  const [subscription, setSubscription] = useState<Subscription | null>(null)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
    setMobileMenuOpen(false)
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Check if Google Calendar is connected
  useEffect(() => {
    const checkGoogleCalendar = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: connection } = await supabase
          .from('google_calendar_connections')
          .select('sync_enabled')
          .eq('user_id', user.id)
          .eq('sync_enabled', true)
          .single()

        setGoogleCalendarConnected(!!connection)
      } catch (error) {
        // Connection doesn't exist, which is fine
        setGoogleCalendarConnected(false)
      }
    }

    checkGoogleCalendar()
  }, [])

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user.id) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching subscription:", error)
          return
        }

        setSubscription(data || null)
      } catch (error) {
        console.error("Error fetching subscription:", error)
      }
    }

    fetchSubscription()
  }, [user.id])

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="flex h-20 items-center justify-between border-b border-slate-800/50 px-6">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onItemClick}>
          <Network className="h-6 w-6 text-white group-hover:text-cyan-400 transition-colors" />
          <span className="text-lg font-semibold text-white tracking-tight">
            Network Link AI
          </span>
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

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
          const showGoogleCalendarBadge = (item.name === "Calendar" || item.name === "Events") && googleCalendarConnected

          // Map navigation items to tour data attributes
          const tourDataAttr: Record<string, string> = {
            "Dashboard": "dashboard-nav",
            "Network Profile": "profile-nav",
            "Portfolio": "portfolio-nav",
            "Contacts": "contacts-nav",
            "Networking Mode": "networking-nav",
            "Calendar": "calendar-nav",
            "Events": "events-nav",
            "Emails": "emails-nav",
            "AI Campaigns": "campaigns-nav",
            "Analytics": "analytics-nav",
            "AI Assistant": "ai-assistant-nav",
            "Settings": "settings-nav",
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              data-tour={tourDataAttr[item.name]}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 relative",
                isActive
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {showGoogleCalendarBadge && (
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 bg-green-500/20 text-green-400 border-green-500/30"
                    title="Google Calendar connected"
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

        {/* Divider */}
        <div className="my-4 border-t border-slate-800/50"></div>

        {/* Resources Section */}
        <div className="mb-2 px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resources</p>
        </div>
        {resourcesNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
            </Link>
          )
        })}

        {/* Divider */}
        <div className="my-4 border-t border-slate-800/50"></div>

        {/* Public Pages Section */}
        <div className="mb-2 px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Public Pages</p>
        </div>
        {publicNavigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800/50 p-4">
        <div className="mb-3 px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Account</p>
          <p className="text-sm font-medium text-slate-300 truncate mb-2">{user.email}</p>
          {subscription ? (
            <Badge
              variant={subscription.plan_name === 'free' ? 'secondary' : 'default'}
              className="text-[10px] px-2 py-0.5 flex items-center gap-1 w-fit"
            >
              {subscription.plan_name === 'professional' || subscription.plan_name === 'enterprise' ? (
                <Crown className="h-2.5 w-2.5" />
              ) : null}
              {subscription.plan_name === 'free' ? 'Free' : subscription.plan_name === 'professional' ? 'Pro' : 'Enterprise'}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 w-fit"
            >
              Free
            </Badge>
          )}
        </div>
        <Link
          href="/dashboard/settings#subscription-management"
          onClick={(e) => {
            onItemClick?.()
            // Small delay to ensure page loads before scrolling
            setTimeout(() => {
              const element = document.getElementById('subscription-management')
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }, 100)
          }}
          className={cn(
            "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 mb-2",
            pathname === "/dashboard/settings"
              ? "bg-white text-slate-900 shadow-md"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50",
          )}
        >
          <CreditCard className="h-4 w-4" />
          <span className="flex-1">Manage Subscription</span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/50 font-medium"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
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

      {/* Mobile Menu Dialog */}
      {isMobile && (
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogContent className="fixed left-0 top-0 h-full w-[280px] max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-r border-slate-800/50 bg-slate-900/95 backdrop-blur-xl p-0 data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left">
            <DialogTitle className="sr-only">Navigation Menu</DialogTitle>
            <div className="relative z-20 flex h-full w-full flex-col">
              <SidebarContent onItemClick={() => setMobileMenuOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Desktop Sidebar - Only visible on desktop */}
      {!isMobile && (
        <div className="relative z-20 flex h-screen w-64 flex-col border-r border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
          <SidebarContent />
        </div>
      )}
    </>
  )
}
