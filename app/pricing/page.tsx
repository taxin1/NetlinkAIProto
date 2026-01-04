import { Metadata } from 'next'
import { PricingPage } from "@/components/pricing-page"

export const metadata: Metadata = {
  title: 'Pricing | Affordable AI Networking Plans',
  description: 'Choose the perfect plan for your professional networking needs. From free trials to enterprise solutions, Netlink AI has the right AI-powered CRM for you.',
}

export default function Pricing() {
  return <PricingPage />
}
