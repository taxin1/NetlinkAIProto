"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  CheckCircle2, 
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function GmailSettings() {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [emailAddress, setEmailAddress] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('gmail_connections')
        .select('*')
        .single()

      if (data && !error) {
        setIsConnected(true)
        setEmailAddress(data.email_address)
      } else {
        setIsConnected(false)
        setEmailAddress(null)
      }
    } catch (error) {
      console.error('Error checking Gmail connection:', error)
      setIsConnected(false)
    } finally {
      setIsLoading(false)
    }
  }

  const connectGmail = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/gmail/auth')
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to connect Gmail')
        setIsConnecting(false)
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error)
      alert('Failed to connect Gmail')
      setIsConnecting(false)
    }
  }

  const disconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account?')) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('gmail_connections')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

      if (error) throw error

      setIsConnected(false)
      setEmailAddress(null)
      alert('Gmail disconnected successfully')
    } catch (error) {
      console.error('Error disconnecting Gmail:', error)
      alert('Failed to disconnect Gmail')
    }
  }

  // Check for success/error messages in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success === 'gmail_connected') {
      checkConnection()
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (error) {
      let errorMessage = 'Failed to connect Gmail'
      switch (error) {
        case 'no_code':
          errorMessage = 'No authorization code received'
          break
        case 'token_exchange_failed':
          errorMessage = 'Failed to exchange authorization code'
          break
        case 'connection_timeout':
          errorMessage = 'Connection timed out. Please try again.'
          break
        case 'invalid_authorization_code':
          errorMessage = 'Invalid authorization code. Please try again.'
          break
        case 'oauth_not_configured':
          errorMessage = 'Gmail OAuth is not configured on the server'
          break
      }
      alert(errorMessage)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  if (isLoading) {
    return (
      <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                Gmail Integration
              </CardTitle>
              <CardDescription className="mt-1">
                Connect Gmail to view replies and manage emails
              </CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Connected
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2">
              <XCircle className="h-4 w-4 mr-2" />
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50/50 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Gmail Connected
                </p>
              </div>
              {emailAddress && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  Connected as: <span className="font-medium">{emailAddress}</span>
                </p>
              )}
              <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                You can now view replies to your networking emails and manage them directly from the app.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={disconnectGmail}
                className="flex-1 border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
              <Button
                variant="outline"
                onClick={checkConnection}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50/50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Gmail Not Connected
                </p>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Connect your Gmail account to:
              </p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-disc list-inside">
                <li>View replies to your networking emails</li>
                <li>Manage emails directly from the app</li>
                <li>Get notified about new replies</li>
                <li>Use AI to respond to emails faster</li>
              </ul>
            </div>

            <Button
              onClick={connectGmail}
              disabled={isConnecting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Connect Gmail
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

