import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { PayPalErrorHandler } from '@/components/paypal-error-handler'
import { ClientLoadingWrapper } from '@/components/client-loading-wrapper'
import { GoogleTranslate } from '@/components/google-translate'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Netlink AI - Intelligent Professional Networking & Relationship Management',
    template: '%s | Netlink AI'
  },
  description: 'Netlink AI is the ultimate AI-powered platform for professional networking. Automate business card scanning, personalize outreach with AI, manage contacts, and grow your network 10x faster.',
  keywords: [
    'AI Networking', 
    'Business Card Scanner', 
    'Professional Relationship Management', 
    'AI Email Automation', 
    'Contact Management AI', 
    'Networking Intelligence',
    'CRM for Professionals',
    'Personalized Outreach AI',
    'Network Link AI',
    'Netlink Cogni'
  ],
  authors: [{ name: 'Netlink AI Team' }],
  creator: 'Netlink AI',
  publisher: 'Netlink AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://netlink-ai.vercel.app'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/',
      'ja-JP': '/?lang=ja',
    },
  },
  openGraph: {
    title: 'Netlink AI - Intelligent Professional Networking',
    description: 'The all-in-one AI platform to automate your professional growth. Scan cards, generate emails, and manage relationships smarter.',
    url: 'https://netlink-ai.vercel.app',
    siteName: 'Netlink AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/Logo1.png',
        width: 1200,
        height: 630,
        alt: 'Netlink AI - Networking Reinvented',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Netlink AI - Networking Reinvented with AI',
    description: 'Automate your professional growth with AI intelligence. Scan cards, personalize emails, and manage your network.',
    images: ['/Logo1.png'],
    creator: '@NetlinkAI',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // User should replace this
    yandex: 'your-yandex-verification-code',
  },
  category: 'Technology',
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <ClientLoadingWrapper>
          <PayPalErrorHandler />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <GoogleTranslate />
          </ThemeProvider>
          <Analytics />
        </ClientLoadingWrapper>
      </body>
    </html>
  )
}
