"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Mail, BarChart3, LogOut, Network, Bot, Settings, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ThemeToggle } from "@/components/theme-toggle"

interface SidebarProps {
  user: {
    email?: string
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contacts", href: "/dashboard/contacts", icon: Users },
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Emails", href: "/dashboard/emails", icon: Mail },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="relative z-20 flex h-screen w-64 flex-col border-r border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between border-b border-slate-800/50 px-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <Network className="h-6 w-6 text-white group-hover:text-cyan-400 transition-colors" />
          <span className="text-lg font-semibold text-white tracking-tight">
            Netlink<span className="text-cyan-400">-Cogni</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
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
    </div>
  )
}
