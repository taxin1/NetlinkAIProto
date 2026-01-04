import type { Metadata } from 'next'
import Link from 'next/link'
import { Network, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Privacy Policy | Netlink AI - Network Link AI',
  description: 'Privacy Policy for Netlink AI (Network Link AI) - AI-Powered Business Networking Platform',
}

const lastUpdated = 'January 1, 2025'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <Network className="h-7 w-7 text-white group-hover:text-cyan-400 transition-colors" />
              </div>
              <span className="text-xl font-semibold text-white tracking-tight">
                Netlink AI
              </span>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
        <div className="prose prose-invert prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400 mb-8">Last updated: {lastUpdated}</p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p>
                Welcome to Netlink AI ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered business networking platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email address, password)</li>
                <li>Contact information (business cards, contact details)</li>
                <li>Email content and communications</li>
                <li>Calendar events and scheduling information</li>
                <li>Profile information and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Usage data and analytics</li>
                <li>Device information and IP addresses</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Log files and error reports</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">2.3 Third-Party Integrations</h3>
              <p>
                When you connect third-party services (such as Gmail, Google Calendar), we may access and store information from those services in accordance with their terms and your permissions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and manage your contacts and communications</li>
                <li>Enable AI-powered features and personalization</li>
                <li>Send you service-related notifications and updates</li>
                <li>Analyze usage patterns and improve user experience</li>
                <li>Detect, prevent, and address technical issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist us in operating our platform</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights and Choices</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of certain data collection and processing</li>
                <li>Request a copy of your data</li>
                <li>Disconnect third-party integrations at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. You can control cookie preferences through your browser settings, though this may affect some functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="mt-4">
                <strong>Email:</strong> privacy@netlink.com<br />
                <strong>Address:</strong> [Your Company Address]
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800/50 bg-slate-950/50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Network className="h-6 w-6 text-cyan-400" />
            <span className="text-xl font-bold text-white">Netlink AI</span>
          </div>
          <p className="text-slate-400 mb-4">
            © 2025 Netlink AI. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/privacy" className="text-slate-400 hover:text-cyan-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 hover:text-cyan-400 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
