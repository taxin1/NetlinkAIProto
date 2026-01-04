import { Metadata } from 'next'
import { LandingPage } from "@/components/landing-page"

export const metadata: Metadata = {
  title: 'Home | Netlink AI - Networking Reinvented with AI',
  description: 'Welcome to Netlink AI. Transform your professional networking with AI-powered business card scanning, personalized email campaigns, and intelligent contact management.',
}

export default function HomePage() {
  return <LandingPage />
}
