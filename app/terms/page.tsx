import type { Metadata } from 'next'
import Link from 'next/link'
import { Network, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Terms and Conditions | Netlink',
  description: 'Terms and Conditions for Netlink - AI-Powered Business Networking Platform',
}

const lastUpdated = 'January 1, 2025'

export default function TermsPage() {
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
                Netlink
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
          <h1 className="text-4xl font-bold text-white mb-4">Terms and Conditions</h1>
          <p className="text-slate-400 mb-8">Last updated: {lastUpdated}</p>

          <div className="space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Netlink ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p>
                Netlink is an AI-powered business networking platform that provides contact management, automated email campaigns, calendar integration, and analytics services. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.1 Account Creation</h3>
              <p>
                You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.2 Account Security</h3>
              <p>
                You are responsible for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account or any other breach of security.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">3.3 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason we deem necessary.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Transmit any harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Violate any intellectual property rights</li>
                <li>Send spam, unsolicited emails, or engage in any form of harassment</li>
                <li>Use the Service to collect or harvest personal information about others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. User Content</h2>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">5.1 Ownership</h3>
              <p>
                You retain ownership of all content you upload, create, or provide through the Service ("User Content"). By using the Service, you grant us a license to use, store, and process your User Content as necessary to provide the Service.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">5.2 Responsibility</h3>
              <p>
                You are solely responsible for your User Content. You represent and warrant that you have all necessary rights to your User Content and that it does not violate any third-party rights.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">5.3 Content Removal</h3>
              <p>
                We reserve the right to remove any User Content that violates these Terms or that we determine is harmful, offensive, or inappropriate.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Third-Party Services</h2>
              <p>
                The Service may integrate with third-party services (such as Gmail, Google Calendar). Your use of these third-party services is subject to their respective terms and conditions. We are not responsible for the availability, accuracy, or content of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Subscription and Payment</h2>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">7.1 Subscription Plans</h3>
              <p>
                We offer various subscription plans with different features and pricing. Subscription fees are billed in advance on a recurring basis.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">7.2 Free Trial</h3>
              <p>
                We may offer a free trial period. At the end of the trial period, you will be automatically charged unless you cancel before the trial ends.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">7.3 Cancellation and Refunds</h3>
              <p>
                You may cancel your subscription at any time. Cancellation will take effect at the end of the current billing period. Refunds are provided at our discretion and in accordance with our refund policy.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">7.4 Price Changes</h3>
              <p>
                We reserve the right to modify subscription prices. We will provide notice of any price changes, and you may cancel your subscription if you do not agree to the new pricing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
              <p>
                The Service, including its original content, features, and functionality, is owned by Netlink and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of the Service without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimers and Limitations of Liability</h2>
              <h3 className="text-xl font-semibold text-white mb-3 mt-6">9.1 Service Availability</h3>
              <p>
                The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, error-free, or secure.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">9.2 Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, Netlink shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3 mt-6">9.3 AI-Generated Content</h3>
              <p>
                The Service uses AI to generate content. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. You are responsible for reviewing and verifying all AI-generated content before use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Netlink and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, your User Content, or your violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand how we collect, use, and protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Modifications to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after such changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="mt-4">
                <strong>Email:</strong> legal@netlink.com<br />
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
            <span className="text-xl font-bold text-white">Netlink</span>
          </div>
          <p className="text-slate-400 mb-4">
            © 2025 Netlink. All rights reserved.
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
