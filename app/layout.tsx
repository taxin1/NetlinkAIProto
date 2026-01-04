import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { PayPalErrorHandler } from '@/components/paypal-error-handler'
import { ClientLoadingWrapper } from '@/components/client-loading-wrapper'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Netlink AI - Network Link AI | AI-Powered Business Networking',
  description: 'Netlink AI (Network Link AI) is an enterprise-grade AI platform for intelligent contact management, automated networking, and business intelligence. Transform your professional network with cutting-edge technology.',
  keywords: ['Netlink AI', 'Network Link AI', 'AI Networking', 'Business Networking', 'Contact Management', 'AI Email Automation', 'Professional Networking', 'Networking AI'],
  authors: [{ name: 'Netlink AI Team' }],
  creator: 'Netlink AI',
  publisher: 'Netlink AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://netlink-ai.vercel.app'), // Replace with actual domain if known
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Netlink AI - Network Link AI',
    description: 'AI-Powered Business Networking Platform',
    url: 'https://netlink-ai.vercel.app',
    siteName: 'Netlink AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/Logo1.png',
        width: 1200,
        height: 630,
        alt: 'Netlink AI Logo',
      },
      {
        url: '/favicon.png',
        width: 512,
        height: 512,
        alt: 'Netlink AI Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Netlink AI - Network Link AI',
    description: 'AI-Powered Business Networking Platform',
    images: ['/Logo1.png'],
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
  icons: {
    icon: [
      {
        url: '/favicon.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon.png',
    apple: [
      {
        url: '/favicon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        url: '/favicon.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/favicon.png',
      },
    ],
  },
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
          </ThemeProvider>
          <Analytics />
        </ClientLoadingWrapper>
      </body>
    </html>
  )
}
