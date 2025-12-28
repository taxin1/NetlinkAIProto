"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  Clock,
  User,
  MessageSquare,
  Loader2,
  ExternalLink,
  Reply
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface GmailReply {
  id: string
  threadId: string
  snippet: string
  from: string
  to: string
  subject: string
  date: string
  body: string
  isReply: boolean
  emailId?: string
  contactId?: string
  contact?: {
    name: string
    email: string | null
  }
}

interface GmailRepliesProps {
  userId: string
}

export function GmailReplies({ userId }: GmailRepliesProps) {
  const [replies, setReplies] = useState<GmailReply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    checkConnection()
    loadReplies()
  }, [userId])

  const checkConnection = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('gmail_connections')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      setIsConnected(!!data)
    } catch (error) {
      console.error('Error checking Gmail connection:', error)
      setIsConnected(false)
    }
  }

  const loadReplies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/gmail/replies?maxResults=20')
      if (response.ok) {
        const data = await response.json()
        setReplies(data.replies || [])
        
        // Count unread replies from database
        const supabase = createClient()
        const { count } = await supabase
          .from('email_replies')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false)
        
        setUnreadCount(count || 0)
      }
    } catch (error) {
      console.error('Error loading replies:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const syncReplies = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        await loadReplies()
        alert(`Synced ${data.new} new replies!`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to sync replies')
      }
    } catch (error) {
      console.error('Error syncing replies:', error)
      alert('Failed to sync replies')
    } finally {
      setIsSyncing(false)
    }
  }

  const markAsRead = async (replyId: string) => {
    const supabase = createClient()
    await supabase
      .from('email_replies')
      .update({ is_read: true })
      .eq('gmail_message_id', replyId)
      .eq('user_id', userId)
    
    await loadReplies()
  }

  const connectGmail = async () => {
    try {
      const response = await fetch('/api/gmail/auth')
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        alert('Failed to connect Gmail. Please try again.')
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      alert('Failed to connect Gmail')
    }
  }

  if (!isConnected) {
    return (
      <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5 text-cyan-400" />
            Gmail Replies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-slate-400">
              Connect your Gmail account to view replies to your networking emails
            </p>
            <Button
              onClick={connectGmail}
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              <Mail className="mr-2 h-4 w-4" />
              Connect Gmail
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5 text-cyan-400" />
            Gmail Replies
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-cyan-500 text-white">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={syncReplies}
              disabled={isSyncing}
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No replies found</p>
            <p className="text-sm mt-2">Click sync to check for new replies</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => {
              const fromEmail = reply.from.match(/<(.+)>/) 
                ? reply.from.match(/<(.+)>/)?.[1] 
                : reply.from
              const fromName = reply.from.match(/^(.+?)\s*</)?.[1] || fromEmail

              return (
                <div
                  key={reply.id}
                  className="border border-slate-800/50 bg-slate-800/30 rounded-lg p-4 space-y-3 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-white">
                          {reply.contact?.name || fromName}
                        </span>
                        {reply.contact && (
                          <Badge variant="outline" className="text-xs">
                            Contact
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mb-1">
                        {fromEmail}
                      </p>
                      <p className="font-medium text-white mb-2">
                        {reply.subject}
                      </p>
                      <p className="text-sm text-slate-300 line-clamp-2">
                        {reply.snippet || reply.body.substring(0, 150)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(reply.date), { addSuffix: true })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(reply.id)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Open reply dialog or navigate to email
                        window.location.href = `/dashboard/emails?reply=${reply.id}`
                      }}
                      className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(`https://mail.google.com/mail/u/0/#inbox/${reply.threadId}`, '_blank')
                      }}
                      className="text-slate-400 hover:text-slate-300"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Gmail
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
