import { Metadata } from 'next'
import { PublicAboutPage } from "@/components/public-about-page"

export const metadata: Metadata = {
  title: 'About Us | Our Mission to Reinvent Networking',
  description: 'Learn about Netlink AI and our mission to combine human connections with AI intelligence. Discover how we are reimagining the future of professional networking.',
}

export default function PublicAboutPageRoute() {
  return <PublicAboutPage />
}
