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
  StopCircle
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

  const runCampaign = async (campaign: EmailCampaign) => {
    if (!campaign.contacts.length) return

    setIsRunning(true)
    setCurrentCampaign(campaign)
    setSendingProgress(0)

    const supabase = createClient()
    let sentCount = 0

    try {
      // Update campaign status
      await supabase
        .from("email_campaigns")
        .update({ status: "running" })
        .eq("id", campaign.id)

      for (const contact of campaign.contacts) {
        if (!contact.email) continue

        try {
          // Generate personalized email via API
          const response = await fetch("/api/generate-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contactName: contact.name,
              contactCompany: contact.company || "",
              purpose: campaign.purpose,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || "Failed to generate email")
          }

          const result = await response.json()
          const emailBody = result.emailBody

          // Actually send the email via Gmail SMTP
          let emailSentSuccessfully = false
          try {
            const sendResponse = await fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: contact.email,
                subject: campaign.subject,
                body: emailBody,
                fromName: "Netlink Cogni",
              }),
            })

            if (sendResponse.ok) {
              emailSentSuccessfully = true
              console.log(`Email sent successfully to ${contact.name}`)
            } else {
              const errorData = await sendResponse.json()
              console.error(`Failed to send email to ${contact.name}:`, errorData.error)
            }
          } catch (sendError) {
            console.error(`Error sending email to ${contact.name}:`, sendError)
          }

          // Save email to database
          const { error: emailError } = await supabase
            .from("emails")
            .insert({
              user_id: userId,
              contact_id: contact.id,
              subject: campaign.subject,
              body: emailBody,
              status: emailSentSuccessfully ? "sent" : "failed",
              campaign_id: campaign.id
            })

          if (emailError) {
            console.error(`Error saving email for ${contact.name}:`, emailError)
            continue
          }

          // Only count as sent if email was actually sent
          if (!emailSentSuccessfully) {
            console.warn(`Email to ${contact.name} was not sent, but saved as draft`)
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
          setSendingProgress(Math.round((sentCount / campaign.contacts.length) * 100))

          // Add delay between emails to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          console.error(`Error sending email to ${contact.name}:`, error)
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
    <div id="ai-agent" className="space-y-6">
      {/* Header */}
      <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bot className="h-6 w-6 text-cyan-400" />
            AI Email Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400">
            Automatically send personalized cold emails to multiple contacts using AI
          </p>
        </CardContent>
      </Card>

      {/* Create Campaign */}
      <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="h-5 w-5 text-cyan-400" />
            Create Email Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name" className="text-slate-300">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Q1 Outreach Campaign"
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="campaign-purpose" className="text-slate-300">Email Purpose</Label>
              <Textarea
                id="campaign-purpose"
                value={campaignPurpose}
                onChange={(e) => setCampaignPurpose(e.target.value)}
                placeholder="e.g., Schedule a product demo, Invite to event..."
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="campaign-subject" className="text-slate-300">Email Subject</Label>
              <Input
                id="campaign-subject"
                value={campaignSubject}
                onChange={(e) => setCampaignSubject(e.target.value)}
                placeholder="e.g., Quick question about your business"
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Contact Selection */}
          <div className="space-y-3">
            <Label className="text-slate-300">Select Contacts ({selectedContacts.length} selected)</Label>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedContacts.includes(contact.id)
                      ? 'bg-cyan-500/10 border-cyan-500/50'
                      : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                  }`}
                  onClick={() => toggleContactSelection(contact.id)}
                >
                  <div>
                    <p className="font-medium text-white">{contact.name}</p>
                    <p className="text-sm text-slate-400">
                      {contact.company} • {contact.email}
                    </p>
                  </div>
                  {selectedContacts.includes(contact.id) && (
                    <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={createCampaign} 
            disabled={isCreating}
            className="w-full bg-white text-slate-900 hover:bg-slate-100"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Campaign...
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-cyan-400" />
            Email Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-slate-400 text-center py-4">
              No campaigns created yet. Create your first campaign above.
            </p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-slate-800/50 bg-slate-800/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{campaign.name}</h3>
                      <p className="text-sm text-slate-400">{campaign.purpose}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusIcon(campaign.status)}
                        <span className="ml-1 capitalize">{campaign.status}</span>
                      </Badge>
                      {campaign.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => runCampaign(campaign)}
                          disabled={isRunning}
                          className="bg-white text-slate-900 hover:bg-slate-100"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Run
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{campaign.contacts.length} contacts</span>
                    <span>{campaign.sent_count}/{campaign.total_count} sent</span>
                  </div>

                  {currentCampaign?.id === campaign.id && isRunning && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-white">
                        <span>Sending emails...</span>
                        <span>{sendingProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
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
