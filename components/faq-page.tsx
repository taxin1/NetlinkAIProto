"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PublicNavigation } from "@/components/public-navigation"
import { 
  HelpCircle, 
  ArrowLeft,
  ArrowRight,
  FileText,
  Settings,
  DollarSign,
  Zap
} from "lucide-react"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

const faqCategories = [
  {
    title: "Getting Started",
    icon: Zap,
    questions: [
      {
        question: "How do I create an account?",
        answer: "You can create a free account by clicking the 'Sign Up' button on the homepage. Simply provide your email address and create a password. No credit card is required for the free plan."
      },
      {
        question: "What features are available in the free plan?",
        answer: "The free plan includes basic AI email generation (5/month), AI assistant with text support (20 messages/day), business card scanner (500 scans/month), up to 100 contacts, basic email campaigns, and Google Calendar sync (read-only). See our pricing page for full details."
      },
      {
        question: "How long does it take to set up?",
        answer: "Setting up your account takes just a few minutes. After signing up, you can immediately start using basic features. Connecting integrations like Google Calendar and Gmail takes just a couple of clicks and is done in seconds."
      },
      {
        question: "Do I need technical knowledge to use Netlink?",
        answer: "No technical knowledge is required! Netlink is designed to be user-friendly. Simply sign up, complete your profile, and start networking. All features are accessible through the intuitive interface."
      }
    ]
  },
  {
    title: "Setup & Configuration",
    icon: Settings,
    questions: [
      {
        question: "How do I configure Google Calendar integration?",
        answer: "Go to Dashboard > Settings > Integrations > Google Calendar. Click 'Connect Google Calendar' and authorize Netlink to access your calendar. The connection is instant and secure. You can disconnect anytime from Settings."
      },
      {
        question: "How do I connect my Gmail account?",
        answer: "Go to Dashboard > Settings > Integrations > Gmail. Click 'Connect Gmail' and sign in with your Google account. Once connected, you can send emails, track conversations, and manage campaigns directly from Netlink."
      },
      {
        question: "How do I complete my profile?",
        answer: "Go to Dashboard > Network Profile. Upload a profile picture, add your professional information, job title, company, and bio. Add your social media links to make it easy for others to connect with you."
      },
      {
        question: "How do I change my account settings?",
        answer: "Go to Dashboard > Settings. Here you can manage your profile, notifications, privacy settings, connected integrations, and subscription. All settings are organized in easy-to-find sections."
      },
      {
        question: "How do I troubleshoot connection issues?",
        answer: "If you're having trouble connecting Google Calendar or Gmail, try disconnecting and reconnecting the integration. Make sure you're using the correct Google account. If issues persist, contact our support team for assistance."
      }
    ]
  },
  {
    title: "Features & Usage",
    icon: FileText,
    questions: [
      {
        question: "How does the AI business card scanner work?",
        answer: "Upload a photo of a business card, and our AI uses Google Gemini to extract contact information including name, email, phone, company, and more. The extracted data is automatically saved to your contacts."
      },
      {
        question: "Can I customize AI-generated emails?",
        answer: "Yes! You can edit AI-generated emails before sending. The AI learns from your writing style and preferences over time, especially on Professional and Enterprise plans with AI training features."
      },
      {
        question: "How does the AI assistant work?",
        answer: "The AI assistant can help you draft emails, manage contacts, schedule events, and answer questions about your network. On Professional plans, it also supports voice interactions."
      },
      {
        question: "What email providers are supported?",
        answer: "Currently, we support Gmail through OAuth integration. You can connect your Gmail account to send and receive emails directly through Netlink."
      },
      {
        question: "How do email campaigns work?",
        answer: "Create a campaign, select your target contacts, and let AI personalize each email. Track opens, clicks, and responses. Free plan supports up to 50 contacts per campaign, while paid plans offer unlimited campaigns."
      },
      {
        question: "Can I sync events with Google Calendar?",
        answer: "Yes! Once connected, Netlink can create events in your Google Calendar, sync existing events, and send you reminders. Professional plans include full two-way sync."
      }
    ]
  },
  {
    title: "Pricing & Billing",
    icon: DollarSign,
    questions: [
      {
        question: "What's included in the free plan?",
        answer: "The free plan includes basic AI features with limits: 5 AI emails/month, 20 AI assistant messages/day, 500 card scans/month, 100 contacts max, and 500 MB storage. See our Pricing page for complete details."
      },
      {
        question: "How do I upgrade my plan?",
        answer: "Go to Settings > Subscription Management and click 'Upgrade'. You can upgrade at any time, and the new plan takes effect immediately with prorated billing."
      },
      {
        question: "Can I cancel my subscription?",
        answer: "Yes, you can cancel anytime from Settings > Subscription Management. Your subscription remains active until the end of the current billing period. No cancellation fees."
      },
      {
        question: "Do you offer refunds?",
        answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact support within 30 days of your purchase for a full refund."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards and PayPal. All payments are processed securely through our payment partners."
      },
      {
        question: "What happens if I exceed my plan limits?",
        answer: "You'll receive notifications when approaching limits. For some features, you can continue using them with reduced functionality, or upgrade to a higher plan for more capacity."
      }
    ]
  },
  {
    title: "Troubleshooting",
    icon: HelpCircle,
    questions: [
      {
        question: "Why is my business card scanner not working?",
        answer: "Make sure you're uploading a clear, well-lit photo of the business card. Supported formats are JPEG and PNG. If the image is blurry or too dark, the AI may have trouble reading it. Try taking a new photo with better lighting."
      },
      {
        question: "My emails aren't sending. How do I fix this?",
        answer: "First, make sure your Gmail account is connected in Settings > Integrations. Check that you've authorized Netlink to send emails. If you're still having issues, try disconnecting and reconnecting your Gmail account. Contact support if the problem persists."
      },
      {
        question: "Google Calendar sync isn't working",
        answer: "Go to Settings > Integrations and check if Google Calendar shows as connected. If not, click 'Connect Google Calendar' again. Make sure you're using the correct Google account. Try disconnecting and reconnecting the integration if needed."
      },
      {
        question: "I can't see my contacts",
        answer: "Make sure you're logged in to your account. Check that you're on the Contacts page in the Dashboard. If you've just scanned a business card, refresh the page. If contacts still don't appear, try logging out and back in."
      },
      {
        question: "The AI assistant isn't responding",
        answer: "Check your internet connection. Make sure you haven't exceeded your daily message limit (20 messages/day on free plan). Try refreshing the page. If the issue continues, contact support for assistance."
      },
      {
        question: "Where can I get more help?",
        answer: "Check our Setup Guide for step-by-step instructions. Visit our Resources section for comprehensive guides. You can also contact our support team through the app or email - we're here to help!"
      }
    ]
  }
]

export function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <PublicNavigation />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-12"
          >
            <Link href="/resources" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Resources</span>
            </Link>
            
            <motion.div variants={itemVariants} className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Frequently Asked Questions</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Find answers to common questions about Netlink, setup, features, and troubleshooting.
              </p>
            </motion.div>
          </motion.div>

          {/* FAQ Sections */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8"
          >
            {faqCategories.map((category, categoryIndex) => (
              <motion.div key={category.title} variants={itemVariants}>
                <Card id={category.title.toLowerCase().replace(/\s+/g, '-')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <category.icon className="h-6 w-6 text-primary" />
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                          <AccordionTrigger className="text-left font-semibold">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Still Have Questions */}
          <motion.div variants={itemVariants} className="mt-12">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardContent className="pt-6 text-center">
                <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Can't find what you're looking for? Check out our comprehensive setup guide or contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/resources/setup-guide">
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      View Setup Guide
                    </Button>
                  </Link>
                  <Link href="/resources">
                    <Button>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Back to Resources
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
