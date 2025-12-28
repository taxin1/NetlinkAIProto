"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  Send, 
  Users, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  Settings,
  Play,
  Pause,
  StopCircle,
  Sparkles,
  Wand2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Contact {
  id: string
  name: string
  email: string | null
  company: string | null
  position: string | null
}

interface EmailCampaign {
  id: string
  name: string
  purpose: string
  subject: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  contacts: Contact[]
  sent_count: number
  total_count: number
  created_at: string
}

interface AIEmailAgentProps {
  userId: string
}

export function AIEmailAgent({ userId }: AIEmailAgentProps) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  
  // Campaign creation form
  const [campaignName, setCampaignName] = useState("")
  const [campaignPurpose, setCampaignPurpose] = useState("")
  const [campaignSubject, setCampaignSubject] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  
  // AI generation states
  const [isGeneratingPurpose, setIsGeneratingPurpose] = useState(false)
  const [isGeneratingSubject, setIsGeneratingSubject] = useState(false)
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  
  // Current running campaign
  const [currentCampaign, setCurrentCampaign] = useState<EmailCampaign | null>(null)
  const [sendingProgress, setSendingProgress] = useState(0)

  useEffect(() => {
    loadData()
    
    // Check for pre-filled campaign data from event creation
    const savedCampaignData = sessionStorage.getItem('campaignData')
    if (savedCampaignData) {
      try {
        const data = JSON.parse(savedCampaignData)
        setCampaignName(data.name || "")
        setCampaignPurpose(data.purpose || "")
        setCampaignSubject(data.subject || "")
        sessionStorage.removeItem('campaignData') // Clear after loading
        
        // Scroll to AI agent section
        setTimeout(() => {
          const aiAgentSection = document.getElementById('ai-agent')
          if (aiAgentSection) {
            aiAgentSection.scrollIntoView({ behavior: 'smooth' })
          }
        }, 500)
      } catch (error) {
        console.error('Error loading campaign data:', error)
      }
    }
  }, [userId])

  const loadData = async () => {
    const supabase = createClient()
    
    try {
      // Load contacts
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("id, name, email, company, position")
        .eq("user_id", userId)
        .not("email", "is", null)
      
      setContacts(contactsData || [])
      
      // Load campaigns
      const { data: campaignsData } = await supabase
        .from("email_campaigns")
        .select(`
          *,
          campaign_contacts (
            contact_id,
            contacts (id, name, email, company, position)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      
      const formattedCampaigns = campaignsData?.map(campaign => ({
        ...campaign,
        contacts: campaign.campaign_contacts?.map((cc: any) => cc.contacts).filter(Boolean) || [],
        sent_count: campaign.sent_count || 0,
        total_count: campaign.campaign_contacts?.length || 0
      })) || []
      
      setCampaigns(formattedCampaigns)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createCampaign = async () => {
    if (!campaignName.trim() || !campaignPurpose.trim() || !campaignSubject.trim() || selectedContacts.length === 0) {
      alert("Please fill in all fields and select at least one contact")
      return
    }

    setIsCreating(true)
    const supabase = createClient()

    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          user_id: userId,
          name: campaignName,
          purpose: campaignPurpose,
          subject: campaignSubject,
          status: "draft"
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      // Add contacts to campaign
      const campaignContacts = selectedContacts.map(contactId => ({
        campaign_id: campaign.id,
        contact_id: contactId
      }))

      const { error: contactsError } = await supabase
        .from("campaign_contacts")
        .insert(campaignContacts)

      if (contactsError) throw contactsError

      // Reset form
      setCampaignName("")
      setCampaignPurpose("")
      setCampaignSubject("")
      setSelectedContacts([])

      // Reload data
      await loadData()
    } catch (error) {
      console.error("Error creating campaign:", error)
      alert("Failed to create campaign. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const rerunCampaign = async (campaign: EmailCampaign) => {
    // Reset campaign for re-run
    const supabase = createClient()
    await supabase
      .from("email_campaigns")
      .update({ 
        status: "draft",
        sent_count: 0
      })
      .eq("id", campaign.id)
    
    // Reload to get fresh data
    await loadData()
    
    // Run the campaign
    const updatedCampaign = { ...campaign, status: 'draft' as const, sent_count: 0 }
    await runCampaign(updatedCampaign)
  }

  const runCampaign = async (campaign: EmailCampaign, skipAlreadySent: boolean = false) => {
    if (!campaign.contacts.length) return

    setIsRunning(true)
    setCurrentCampaign(campaign)
    setSendingProgress(0)

    const supabase = createClient()
    let sentCount = 0
    let totalToProcess = campaign.contacts.length

    try {
      // Update campaign status
      await supabase
        .from("email_campaigns")
        .update({ status: "running" })
        .eq("id", campaign.id)

      // Filter contacts based on skipAlreadySent option
      let contactsToProcess = campaign.contacts
      if (skipAlreadySent && campaign.status === 'completed') {
        // Check which contacts already received emails in this campaign
        const { data: existingEmails } = await supabase
          .from("emails")
          .select("contact_id")
          .eq("campaign_id", campaign.id)
          .eq("status", "sent")
        
        const sentContactIds = new Set(existingEmails?.map(e => e.contact_id) || [])
        contactsToProcess = campaign.contacts.filter(c => !sentContactIds.has(c.id))
        totalToProcess = contactsToProcess.length
        
        if (contactsToProcess.length === 0) {
          alert("All contacts in this campaign have already received emails. Use 'Re-run All' to send to everyone again.")
          return
        }
      }

      for (const contact of contactsToProcess) {
        if (!contact.email) {
          console.warn(`Skipping ${contact.name} - no email address`)
          continue
        }

        try {
          // Add delay before generating email to avoid overwhelming the API
          // Wait longer for each subsequent email to avoid rate limits
          const delayMs = 2000 + (sentCount * 500) // 2s base + 0.5s per email sent
          if (sentCount > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }

          // Generate personalized email via API with full context
          let emailBody: string | null = null
          let retries = 3
          let lastError: Error | null = null

          // Retry logic for email generation
          while (retries > 0 && !emailBody) {
            try {
              const response = await fetch("/api/generate-email", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  contactName: contact.name,
                  contactCompany: contact.company || "",
                  purpose: campaign.purpose,
                  contactId: contact.id,
                  userId: userId,
                }),
              })

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                const errorMessage = errorData.error || `Failed to generate email (${response.status})`
                
                // Check if it's a 503/429 error that should be retried
                if ((response.status === 503 || response.status === 429) && retries > 1) {
                  console.warn(`API overloaded for ${contact.name}, retrying in ${delayMs * 2}ms... (${4 - retries}/3)`)
                  await new Promise(resolve => setTimeout(resolve, delayMs * 2))
                  retries--
                  continue
                }
                
                throw new Error(errorMessage)
              }

              const result = await response.json()
              if (result.emailBody) {
                emailBody = result.emailBody
                break // Success, exit retry loop
              } else {
                throw new Error("No email body in response")
              }
            } catch (error) {
              lastError = error instanceof Error ? error : new Error(String(error))
              retries--
              
              if (retries > 0) {
                console.warn(`Error generating email for ${contact.name}, retrying... (${3 - retries}/3)`)
                await new Promise(resolve => setTimeout(resolve, delayMs * (4 - retries)))
              }
            }
          }

          // If we still don't have an email body after retries, skip this contact
          if (!emailBody) {
            console.error(`Failed to generate email for ${contact.name} after retries:`, lastError?.message)
            continue
          }

          // Actually send the email via Gmail SMTP
          let emailSentSuccessfully = false
          let emailId: string | null = null
          try {
            // Validate email exists
            if (!contact.email || !contact.email.trim()) {
              throw new Error(`No email address for ${contact.name}`)
            }

            // Save email to database first (before sending)
            const { data: savedEmail, error: saveError } = await supabase
              .from("emails")
              .insert({
                user_id: userId,
                contact_id: contact.id,
                subject: campaign.subject,
                body: emailBody,
                status: "draft", // Will update to "sent" or "failed" after sending attempt
                campaign_id: campaign.id
              })
              .select("id")
              .single()

            if (saveError) {
              console.error(`Error saving email for ${contact.name}:`, saveError)
              throw new Error(`Failed to save email: ${saveError.message}`)
            }

            emailId = savedEmail?.id || null

            const sendResponse = await fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                emailId: emailId, // Pass emailId so API can update status
                contactEmail: contact.email.trim(),
                subject: campaign.subject,
                body: emailBody,
              }),
            })

            if (sendResponse.ok) {
              emailSentSuccessfully = true
              console.log(`Email sent successfully to ${contact.name}`)
            } else {
              const errorData = await sendResponse.json().catch(() => ({ error: "Unknown error" }))
              const errorMessage = errorData.error || `Failed to send email (${sendResponse.status})`
              console.error(`Failed to send email to ${contact.name}:`, errorMessage)
              
              // Update email status to failed if we have emailId
              if (emailId) {
                await supabase
                  .from("emails")
                  .update({ status: "failed" })
                  .eq("id", emailId)
              }
              
              // If email configuration is missing, show user-friendly message
              if (errorData.needsConfiguration) {
                alert(`Email not configured for ${contact.name}. Please configure your email settings in Settings → Email Configuration.`)
              }
            }
          } catch (sendError) {
            console.error(`Error sending email to ${contact.name}:`, sendError)
            const errorMessage = sendError instanceof Error ? sendError.message : String(sendError)
            
            // Update email status to failed if we have emailId
            if (emailId) {
              await supabase
                .from("emails")
                .update({ status: "failed" })
                .eq("id", emailId)
            }
            
            // Show user-friendly error for configuration issues
            if (errorMessage.includes("not configured") || errorMessage.includes("needsConfiguration")) {
              alert(`Email configuration required. Please set up your email account in Settings → Email Configuration.`)
            }
          }

          // Email was already saved before sending attempt above
          // Only count as sent if email was actually sent successfully
          if (!emailSentSuccessfully) {
            console.warn(`Email to ${contact.name} was not sent (status should be 'failed' in database)`)
            continue
          }

          // Log event
          await supabase.from("events").insert({
            user_id: userId,
            contact_id: contact.id,
            event_type: "email_sent",
            description: `Sent campaign email: ${campaign.name}`
          })

          sentCount++
          setSendingProgress(Math.round((sentCount / totalToProcess) * 100))

          // Add delay between emails to avoid rate limiting
          // Longer delay if API was overloaded to prevent further issues
          const finalDelay = lastError?.message?.includes("503") || lastError?.message?.includes("overloaded") 
            ? 3000 
            : 2000
          await new Promise(resolve => setTimeout(resolve, finalDelay))
        } catch (error) {
          console.error(`Error processing email for ${contact.name}:`, error)
          const errorMessage = error instanceof Error ? error.message : String(error)
          
          // If it's an API overload error, wait longer before continuing
          if (errorMessage.includes("503") || errorMessage.includes("overloaded") || errorMessage.includes("UNAVAILABLE")) {
            console.warn("API is overloaded, waiting 5 seconds before continuing campaign...")
            await new Promise(resolve => setTimeout(resolve, 5000))
          }
        }
      }

      // Update campaign status
      await supabase
        .from("email_campaigns")
        .update({ 
          status: "completed",
          sent_count: sentCount
        })
        .eq("id", campaign.id)

      // Reload data
      await loadData()
    } catch (error) {
      console.error("Error running campaign:", error)
      alert("Failed to run campaign. Please try again.")
    } finally {
      setIsRunning(false)
      setCurrentCampaign(null)
      setSendingProgress(0)
    }
  }

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const generatePurpose = async () => {
    if (!campaignName.trim()) {
      alert("Please enter a campaign name first")
      return
    }

    setIsGeneratingPurpose(true)
    try {
      const response = await fetch("/api/generate-campaign-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignName: campaignName,
          generatePurpose: true,
          userId: userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate purpose")
      }

      const result = await response.json()
      if (result.purpose) {
        setCampaignPurpose(result.purpose)
      }
    } catch (error) {
      console.error("Error generating purpose:", error)
      alert(error instanceof Error ? error.message : "Failed to generate purpose. Please try again.")
    } finally {
      setIsGeneratingPurpose(false)
    }
  }

  const generateSubject = async () => {
    if (!campaignName.trim()) {
      alert("Please enter a campaign name first")
      return
    }

    setIsGeneratingSubject(true)
    try {
      const response = await fetch("/api/generate-campaign-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignName: campaignName,
          generateSubject: true,
          campaignPurpose: campaignPurpose, // Pass existing purpose if available for better context
          userId: userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate subject")
      }

      const result = await response.json()
      if (result.subject) {
        setCampaignSubject(result.subject)
      }
    } catch (error) {
      console.error("Error generating subject:", error)
      alert(error instanceof Error ? error.message : "Failed to generate subject. Please try again.")
    } finally {
      setIsGeneratingSubject(false)
    }
  }

  const generateAll = async () => {
    if (!campaignName.trim()) {
      alert("Please enter a campaign name first")
      return
    }

    setIsGeneratingAll(true)
    try {
      const response = await fetch("/api/generate-campaign-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignName: campaignName,
          generatePurpose: true,
          generateSubject: true,
          userId: userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate content")
      }

      const result = await response.json()
      if (result.purpose) {
        setCampaignPurpose(result.purpose)
      }
      if (result.subject) {
        setCampaignSubject(result.subject)
      }
    } catch (error) {
      console.error("Error generating content:", error)
      alert(error instanceof Error ? error.message : "Failed to generate content. Please try again.")
    } finally {
      setIsGeneratingAll(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'paused': return <Pause className="h-4 w-4 text-orange-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-cyan-400" />
            <span className="text-slate-300">Loading AI Email Agent...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div id="ai-agent" className="space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-400" />
            AI Email Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <p className="text-slate-400 text-sm sm:text-base">
            Automatically send personalized cold emails to multiple contacts using AI
          </p>
        </CardContent>
      </Card>

      {/* Create Campaign */}
      <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
            Create Email Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          {/* AI Generate All Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={generateAll}
              disabled={isGeneratingAll || !campaignName.trim()}
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 text-xs sm:text-sm px-2 sm:px-4"
            >
              {isGeneratingAll ? (
                <>
                  <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">Gen...</span>
                </>
              ) : (
                <>
                  <Wand2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Generate All with AI</span>
                  <span className="sm:hidden">Generate All</span>
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name" className="text-slate-300 text-sm sm:text-base">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Q1 Outreach Campaign"
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label htmlFor="campaign-purpose" className="text-slate-300 text-sm sm:text-base">Email Purpose</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePurpose}
                  disabled={isGeneratingPurpose || !campaignName.trim()}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 sm:h-8 px-2 text-xs sm:text-sm"
                >
                  {isGeneratingPurpose ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Generate</span>
                      <span className="sm:hidden">Gen</span>
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="campaign-purpose"
                value={campaignPurpose}
                onChange={(e) => setCampaignPurpose(e.target.value)}
                placeholder="e.g., Schedule a product demo, Invite to event..."
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 text-sm sm:text-base"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <Label htmlFor="campaign-subject" className="text-slate-300 text-sm sm:text-base">Email Subject</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateSubject}
                  disabled={isGeneratingSubject || !campaignName.trim()}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 sm:h-8 px-2 text-xs sm:text-sm"
                >
                  {isGeneratingSubject ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Generate</span>
                      <span className="sm:hidden">Gen</span>
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="campaign-subject"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                placeholder="e.g., Quick question about your business"
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 text-sm sm:text-base h-9 sm:h-10"
              />
            </div>
          </div>

          {/* Contact Selection */}
          <div className="space-y-3">
            <Label className="text-slate-300 text-sm sm:text-base">Select Contacts ({selectedContacts.length} selected)</Label>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center justify-between p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedContacts.includes(contact.id)
                      ? 'bg-cyan-500/10 border-cyan-500/50'
                      : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                  }`}
                  onClick={() => toggleContactSelection(contact.id)}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium text-white text-sm sm:text-base truncate">{contact.name}</p>
                    <p className="text-xs sm:text-sm text-slate-400 truncate">
                      {contact.company && contact.email ? `${contact.company} • ${contact.email}` : contact.company || contact.email || ''}
                    </p>
                  </div>
                  {selectedContacts.includes(contact.id) && (
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={createCampaign} 
            disabled={isCreating}
            className="w-full bg-white text-slate-900 hover:bg-slate-100 text-sm sm:text-base h-9 sm:h-10"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">Creating Campaign...</span>
                <span className="sm:hidden">Creating...</span>
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Create Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
            Email Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {campaigns.length === 0 ? (
            <p className="text-slate-400 text-center py-4 text-sm sm:text-base">
              No campaigns created yet. Create your first campaign above.
            </p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-slate-800/50 bg-slate-800/30 rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm sm:text-base truncate">{campaign.name}</h3>
                      <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{campaign.purpose}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${getStatusColor(campaign.status)} text-xs`}>
                        {getStatusIcon(campaign.status)}
                        <span className="ml-1 capitalize">{campaign.status}</span>
                      </Badge>
                      {campaign.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => runCampaign(campaign)}
                          disabled={isRunning || currentCampaign?.id === campaign.id}
                          className="bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
                        >
                          <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Run</span>
                          <span className="sm:hidden">Run</span>
                        </Button>
                      )}
                      {campaign.status === 'completed' && (
                        <div className="flex gap-1 sm:gap-2 flex-wrap">
                          <Button
                            size="sm"
                            onClick={() => runCampaign(campaign, true)}
                            disabled={isRunning || currentCampaign?.id === campaign.id}
                            variant="outline"
                            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
                          >
                            <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Re-run Unsent</span>
                            <span className="sm:hidden">Unsent</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => rerunCampaign(campaign)}
                            disabled={isRunning || currentCampaign?.id === campaign.id}
                            className="bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm px-2 sm:px-3 h-7 sm:h-8"
                          >
                            <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Re-run All</span>
                            <span className="sm:hidden">All</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
                    <span>{campaign.contacts.length} contacts</span>
                    <span>{campaign.sent_count}/{campaign.total_count} sent</span>
                  </div>

                  {currentCampaign?.id === campaign.id && isRunning && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm text-white">
                        <span>Sending emails...</span>
                        <span>{sendingProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 sm:h-2">
                        <div 
                          className="bg-cyan-400 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                          style={{ width: `${sendingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
