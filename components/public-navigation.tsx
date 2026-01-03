"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

export function PublicNavigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Netlink
          </Link>
          <div className="flex items-center gap-4">
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
        </div>
      </div>
    </nav>
  )
}
