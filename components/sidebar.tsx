"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutDashboard, Users, Mail, BarChart3, LogOut, Network, Bot, Settings, Calendar, Menu, X, Share2, Mic, Phone, CheckCircle2, CalendarDays } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { useMobile } from "@/lib/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface SidebarProps {
  user: {
    email?: string
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Network Profile", href: "/dashboard/profile", icon: Share2 },
  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
  { name: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Emails", href: "/dashboard/emails", icon: Mail },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Voice Agent", href: "/dashboard/voice-agent", icon: Mic },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile } = useMobile()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false)

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

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <>
      <div className="flex h-20 items-center justify-between border-b border-slate-800/50 px-6">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onItemClick}>
          <Network className="h-6 w-6 text-white group-hover:text-cyan-400 transition-colors" />
          <span className="text-lg font-semibold text-white tracking-tight">
            Netlink<span className="text-cyan-400">-Cogni</span>
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

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
          const showGoogleCalendarBadge = (item.name === "Calendar" || item.name === "Events") && googleCalendarConnected
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onItemClick}
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
      </nav>

      <div className="border-t border-slate-800/50 p-4">
        <div className="mb-3 px-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Account</p>
          <p className="text-sm font-medium text-slate-300 truncate">{user.email}</p>
        </div>
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
