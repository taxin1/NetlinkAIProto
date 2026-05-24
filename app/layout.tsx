import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { PayPalErrorHandler } from '@/components/paypal-error-handler'
import { ClientLoadingWrapper } from '@/components/client-loading-wrapper'
import { GoogleTranslate } from '@/components/google-translate'
import { MobileTouchFix } from '@/components/mobile-touch-fix'
import { AuthSessionRefresh } from '@/components/auth-session-refresh'
import { generateMetadata } from '@/lib/seo/metadata'
import { generateOrganizationSchema, generateWebsiteSchema, generateSoftwareApplicationSchema } from '@/lib/seo/structured-data'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = generateMetadata({})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const organizationSchema = generateOrganizationSchema()
  const websiteSchema = generateWebsiteSchema()
  const softwareSchema = generateSoftwareApplicationSchema()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <MobileTouchFix />
        <AuthSessionRefresh />
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
