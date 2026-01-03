"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PublicNavigation } from "@/components/public-navigation"
import {
  Settings,
  ArrowLeft,
  CheckCircle2,
  User,
  Mail,
  Calendar,
  Phone,
  Briefcase,
  Network,
  Bot,
  Scan,
  BarChart3,
  Sparkles,
  Wand2,
  Shield,
  Bell,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  ArrowRight
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
      ease: "easeOut" as const,
    },
  },
}

export function SetupGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <PublicNavigation />
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mb-8 sm:mb-12"
          >
            <Link href="/resources" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-sm sm:text-base">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Resources</span>
            </Link>

            <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="text-xs sm:text-sm font-semibold text-primary">Complete Setup Guide</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent leading-tight">
                Your Complete Setup Guide
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl">
                Step-by-step instructions to set up your Netlink account and configure all features. Follow these guides to get the most out of your networking platform.
              </p>
            </motion.div>
          </motion.div>

          {/* Setup Tabs */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8 h-auto p-1">
                <TabsTrigger value="profile" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Profile</span>
                  <span className="xs:hidden">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
                  <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Integrations</span>
                  <span className="xs:hidden">Connect</span>
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Features</span>
                  <span className="xs:hidden">Tools</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-2.5">
                  <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Settings</span>
                  <span className="xs:hidden">Config</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Setup */}
              <TabsContent value="profile" className="space-y-6">
                <Card id="profile-setup">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Complete Your Profile
                    </CardTitle>
                    <CardDescription>
                      Set up your professional profile to maximize your networking potential.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-start sm:items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 sm:mt-0 flex-shrink-0" />
                        <span>Step 1: Access Your Profile</span>
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-muted-foreground ml-2">
                        <li>Navigate to <strong>Dashboard</strong> → <strong>Network Profile</strong> from the sidebar</li>
                        <li>Or click on your profile icon in the top navigation</li>
                        <li>You'll see your profile editing interface</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-start sm:items-center gap-2">
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 sm:mt-0 flex-shrink-0" />
                        <span>Step 2: Upload Profile Picture</span>
                      </h3>
                      <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-muted-foreground ml-2">
                        <li>Click on the profile picture placeholder</li>
                        <li>Select a professional photo from your device</li>
                        <li>Recommended size: 400x400 pixels or larger</li>
                        <li>Supported formats: JPG, PNG, or WebP</li>
                        <li>Your image will be automatically optimized and cropped</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-start sm:items-center gap-2">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 sm:mt-0 flex-shrink-0" />
                        <span>Step 3: Add Professional Information</span>
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">Basic Information:</h4>
                          <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground ml-3 sm:ml-4">
                            <li><strong>Full Name:</strong> Your complete professional name</li>
                            <li><strong>Job Title:</strong> Your current position or role</li>
                            <li><strong>Company:</strong> Your current company or organization</li>
                            <li><strong>Bio:</strong> A brief professional summary (2-3 sentences recommended)</li>
                            <li><strong>Location:</strong> Your city and country</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">Contact Information:</h4>
                          <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground ml-3 sm:ml-4">
                            <li><strong>Email:</strong> Your professional email address</li>
                            <li><strong>Phone:</strong> Your business phone number (optional)</li>
                            <li><strong>Website:</strong> Your personal or company website</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-start sm:items-center gap-2">
                        <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 sm:mt-0 flex-shrink-0" />
                        <span>Step 4: Add Social Links</span>
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                        Connect your social media profiles to make it easier for others to find and connect with you:
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground ml-3 sm:ml-4">
                        <li><strong>LinkedIn:</strong> Your LinkedIn profile URL</li>
                        <li><strong>Twitter/X:</strong> Your Twitter handle or profile URL</li>
                        <li><strong>GitHub:</strong> Your GitHub profile (for developers)</li>
                        <li><strong>Instagram:</strong> Your Instagram profile (optional)</li>
                        <li><strong>Other Links:</strong> Any other professional profiles or websites</li>
                      </ul>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                        <strong>Tip:</strong> These links will appear on your public network profile, making it easy for others to connect with you on different platforms.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-start sm:items-center gap-2">
                        <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1 sm:mt-0 flex-shrink-0" />
                        <span>Step 5: Privacy Settings</span>
                      </h3>
                      <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-muted-foreground">
                        <p>Configure who can see your profile:</p>
                        <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 ml-3 sm:ml-4">
                          <li><strong>Public Profile:</strong> Make your profile visible to all Netlink users</li>
                          <li><strong>Contact Information:</strong> Choose what contact details are visible</li>
                          <li><strong>Social Links:</strong> Control which social links are public</li>
                          <li><strong>Portfolio Visibility:</strong> Set who can view your portfolio</li>
                        </ul>
                        <p className="text-xs sm:text-sm mt-3 sm:mt-4">
                          <strong>Note:</strong> A public profile helps you connect with more professionals, but you can always keep certain information private.
                        </p>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                        Profile Completion Checklist
                      </h4>
                      <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Profile picture uploaded</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Full name and job title added</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Professional bio written</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>At least one social link added</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>Privacy settings configured</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Integrations Setup */}
              <TabsContent value="integrations" className="space-y-6">
                <div id="integrations" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Google Calendar Integration
                      </CardTitle>
                      <CardDescription>
                        Connect your Google Calendar to sync events, meetings, and networking opportunities.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Why Connect Google Calendar?</h3>
                        <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground ml-2">
                          <li>Automatically sync your calendar events with Netlink</li>
                          <li>Get intelligent meeting reminders</li>
                          <li>Create events directly from emails</li>
                          <li>Track networking activities and meetings</li>
                          <li>Never miss an important connection</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">How to Connect:</h3>
                        <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-muted-foreground ml-2">
                          <li>Go to <strong>Dashboard</strong> → <strong>Settings</strong> → <strong>Integrations</strong></li>
                          <li>Find the <strong>Google Calendar</strong> section</li>
                          <li>Click the <strong>"Connect Google Calendar"</strong> button</li>
                          <li>You'll be redirected to Google to authorize Netlink</li>
                          <li>Select the Google account you want to connect</li>
                          <li>Review and approve the permissions requested</li>
                          <li>You'll be redirected back to Netlink</li>
                          <li>You should see a confirmation message that Calendar is connected</li>
                        </ol>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">What Happens After Connection:</h3>
                        <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground ml-2">
                          <li>Your calendar events will sync automatically</li>
                          <li>You'll see a "Synced" badge on the Calendar and Events pages</li>
                          <li>New events created in Netlink will appear in your Google Calendar</li>
                          <li>You can enable/disable sync anytime from Settings</li>
                        </ul>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-400 text-sm sm:text-base">
                          <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                          Security Note
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Netlink only requests read and write access to your calendar events. We never access your emails, contacts, or other Google data. You can revoke access at any time from your Google Account settings.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        Gmail Integration
                      </CardTitle>
                      <CardDescription>
                        Connect your Gmail account to send emails, track conversations, and manage your networking communications.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Why Connect Gmail?</h3>
                        <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground ml-2">
                          <li>Send emails directly from Netlink</li>
                          <li>Track email conversations with contacts</li>
                          <li>Use AI to draft and personalize emails</li>
                          <li>Manage email campaigns</li>
                          <li>Get email highlights and summaries</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">How to Connect:</h3>
                        <ol className="list-decimal list-inside space-y-2 sm:space-y-3 text-sm sm:text-base text-muted-foreground ml-2">
                          <li>Go to <strong>Dashboard</strong> → <strong>Settings</strong> → <strong>Integrations</strong></li>
                          <li>Find the <strong>Gmail</strong> section</li>
                          <li>Click the <strong>"Connect Gmail"</strong> button</li>
                          <li>Sign in with your Google account</li>
                          <li>Review and approve the permissions</li>
                          <li>You'll see a confirmation when Gmail is connected</li>
                        </ol>
                      </div>

                      <div>
                        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Using Gmail Features:</h3>
                        <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground ml-2">
                          <li><strong>Send Emails:</strong> Go to Emails page and click "Compose"</li>
                          <li><strong>AI Draft:</strong> Use the AI assistant to draft professional emails</li>
                          <li><strong>Track Conversations:</strong> View all email threads with each contact</li>
                          <li><strong>Email Campaigns:</strong> Create and manage bulk email campaigns</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Features Setup */}
              <TabsContent value="features" className="space-y-4 sm:space-y-6">
                <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Scan className="h-5 w-5 text-primary" />
                        Business Card Scanner
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-4">
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Use AI to instantly extract contact information from business card photos.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">How to Use:</h4>
                        <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                          <li>Go to <strong>Dashboard</strong> → <strong>Business Card Scanner</strong></li>
                          <li>Click <strong>"Upload Image"</strong> or drag and drop a photo</li>
                          <li>Wait for AI to extract information (usually 2-5 seconds)</li>
                          <li>Review the extracted data</li>
                          <li>Edit any fields if needed</li>
                          <li>Click <strong>"Save Contact"</strong> to add to your contacts</li>
                        </ol>
                      </div>
                      <div className="bg-primary/5 rounded-lg p-2.5 sm:p-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <strong>Tip:</strong> Take clear, well-lit photos of business cards for best results. The AI can extract name, email, phone, company, and more.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-primary" />
                        AI Assistant
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-4">
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Get help with emails, contacts, and networking tasks using AI.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">How to Use:</h4>
                        <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                          <li>Go to <strong>Dashboard</strong> → <strong>AI Assistant</strong></li>
                          <li>Type your question or request in the chat</li>
                          <li>Use voice input by clicking the microphone icon</li>
                          <li>The AI can help with:
                            <ul className="list-disc list-inside ml-3 sm:ml-4 mt-1 space-y-1">
                              <li>Drafting emails</li>
                              <li>Managing contacts</li>
                              <li>Networking advice</li>
                              <li>Answering questions</li>
                            </ul>
                          </li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        AI Email Generation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-4">
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Let AI draft professional, personalized emails for you.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">How to Use:</h4>
                        <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                          <li>Go to <strong>Dashboard</strong> → <strong>Emails</strong></li>
                          <li>Click <strong>"Compose"</strong> or select a contact</li>
                          <li>Click <strong>"Generate with AI"</strong> button</li>
                          <li>Describe what you want to say</li>
                          <li>AI will draft the email for you</li>
                          <li>Review and edit as needed</li>
                          <li>Send or save as draft</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Portfolio Builder
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-4">
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Create a stunning professional portfolio with AI assistance.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">How to Use:</h4>
                        <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                          <li>Go to <strong>Dashboard</strong> → <strong>Portfolio</strong></li>
                          <li>Upload your CV or resume</li>
                          <li>Click <strong>"Generate Portfolio"</strong></li>
                          <li>AI will create a beautiful portfolio from your CV</li>
                          <li>Customize colors, layout, and content</li>
                          <li>Add projects, skills, and achievements</li>
                          <li>Share your portfolio link</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Network className="h-5 w-5 text-primary" />
                        Networking Mode
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-4">
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Discover and connect with professionals in your network.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">How to Use:</h4>
                        <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                          <li>Go to <strong>Dashboard</strong> → <strong>Networking Mode</strong></li>
                          <li>Browse professionals in your network</li>
                          <li>Filter by industry, location, or skills</li>
                          <li>View public profiles</li>
                          <li>Connect with professionals</li>
                          <li>Add them to your contacts</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-4">
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Track your networking activities and measure your success.
                      </p>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm sm:text-base">What You Can Track:</h4>
                        <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                          <li>Total contacts and growth</li>
                          <li>Email performance metrics</li>
                          <li>Networking events attended</li>
                          <li>Campaign success rates</li>
                          <li>Most active connections</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings" className="space-y-6">
                <Card id="settings">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-primary" />
                      Account Settings
                    </CardTitle>
                    <CardDescription>
                      Configure your account preferences and notification settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">General Settings</h3>
                      <div className="space-y-3 sm:space-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">Email Notifications</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            Control what email notifications you receive:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground ml-3 sm:ml-4">
                            <li>New connection requests</li>
                            <li>Email campaign updates</li>
                            <li>Meeting reminders</li>
                            <li>System updates and announcements</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">App Notifications</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            Manage in-app notifications:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground ml-3 sm:ml-4">
                            <li>Real-time notifications for new activities</li>
                            <li>Meeting reminders</li>
                            <li>Email highlights</li>
                            <li>Connection updates</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Privacy & Security</h3>
                      <div className="space-y-3 sm:space-4">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">Profile Visibility</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Control who can see your profile and contact information. You can make your profile public to connect with more professionals, or keep it private.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm sm:text-base">Data Management</h4>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            Manage your data:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground ml-3 sm:ml-4">
                            <li>Export your data</li>
                            <li>Delete your account</li>
                            <li>Manage connected integrations</li>
                            <li>View data usage</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Subscription Management</h3>
                      <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                        Manage your subscription, view billing history, and upgrade or downgrade your plan.
                      </p>
                      <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-sm sm:text-base text-muted-foreground ml-3 sm:ml-4">
                        <li>View current plan and features</li>
                        <li>Upgrade to Professional or Enterprise</li>
                        <li>View billing history</li>
                        <li>Update payment method</li>
                        <li>Cancel subscription (if applicable)</li>
                      </ul>
                      <Link href="/dashboard/settings#subscription-management">
                        <Button className="mt-3 sm:mt-4 w-full sm:w-auto">
                          Go to Subscription Settings
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="mt-12"
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Pro Tips for Success
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold flex items-start sm:items-center gap-2 text-sm sm:text-base">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                      <span>Complete Your Profile</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground ml-5 sm:ml-6">
                      A complete profile with photo and bio increases your connection rate by 40%.
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold flex items-start sm:items-center gap-2 text-sm sm:text-base">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                      <span>Connect Integrations</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground ml-5 sm:ml-6">
                      Connect Google Calendar and Gmail to unlock the full power of Netlink.
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold flex items-start sm:items-center gap-2 text-sm sm:text-base">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                      <span>Use AI Features</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground ml-5 sm:ml-6">
                      Let AI help you draft emails and manage contacts to save time.
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="font-semibold flex items-start sm:items-center gap-2 text-sm sm:text-base">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                      <span>Regular Engagement</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground ml-5 sm:ml-6">
                      Regularly scan business cards and send follow-up emails to grow your network.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Next Steps */}
          <motion.div variants={itemVariants} className="mt-12 text-center">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardContent className="pt-4 sm:pt-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Get Started?</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-2xl mx-auto">
                  Follow the steps above to set up your account. If you need help, check out our FAQ or contact support.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Link href="/dashboard/profile" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto">
                      Go to Profile Setup
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/resources/faq" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      View FAQ
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
