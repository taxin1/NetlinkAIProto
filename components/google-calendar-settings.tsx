"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Calendar, Loader2, CheckCircle2, AlertCircle, Link as LinkIcon, Trash2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function GoogleCalendarSettings() {
  const router = useRouter()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        // Optimized: use single query with timeout
        const connectionPromise = supabase
          .from('google_calendar_connections')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 3000)
        )

        const result = await Promise.race([
          connectionPromise,
          timeoutPromise
        ]) as { data: any, error: any }

        const { data: connection, error: connError } = result

        if (connection && !connError) {
          setIsConnected(true)
          setSyncEnabled(connection.sync_enabled)
          setLastSync(connection.last_sync_at)
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Error checking connection:', error)
        setIsConnected(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Check URL params first for immediate feedback
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const success = urlParams.get('success')
      const error = urlParams.get('error')

      if (success === 'google_calendar_connected') {
        // Immediately show success state
        setIsConnected(true)
        setSyncEnabled(true)
        setIsLoading(false)
        // Clean up URL without waiting
        setTimeout(() => router.replace('/dashboard/settings'), 100)
        return // Skip database check since we know it's connected
      } else if (error) {
        // Show error message based on error type
        let message = 'Failed to connect Google Calendar'
        switch (error) {
          case 'connection_timeout':
            message = 'Connection timed out. Please try again.'
            break
          case 'invalid_authorization_code':
            message = 'Authorization code expired. Please try connecting again.'
            break
          case 'token_exchange_failed':
            message = 'Failed to exchange authorization code. Please check your credentials and try again.'
            break
          case 'oauth_not_configured':
            message = 'Google OAuth is not configured. Please check your environment variables.'
            break
          case 'database_error':
            message = 'Database error occurred. Please check your database connection and run the migration script.'
            break
          case 'no_code':
            message = 'No authorization code received. Please try connecting again.'
            break
          case 'insufficient_scopes':
            message = 'The authorization did not grant the required calendar permissions. Please disconnect and reconnect your Google Calendar, making sure to grant all requested permissions.'
            break
          default:
            message = `Connection error: ${error}. Please check the console for details.`
        }
        setErrorMessage(message)
        setIsLoading(false)
        // Clean up URL
        setTimeout(() => router.replace('/dashboard/settings'), 100)
        return
      }
    }

    checkConnection()
  }, [router])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/google-calendar/auth')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to get authorization URL')
      }

      const { authUrl } = await response.json()
      // Redirect to Google OAuth
      window.location.href = authUrl
      // Note: setIsConnecting(false) won't run because page will redirect
    } catch (error) {
      console.error('Error connecting Google Calendar:', error)
      alert(error instanceof Error ? error.message : 'Failed to connect Google Calendar. Please try again.')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar? Events will no longer sync.')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('google_calendar_connections')
        .delete()
        .eq('user_id', userId)

      if (error) throw error

      setIsConnected(false)
      setSyncEnabled(false)
      setLastSync(null)
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error)
      alert('Failed to disconnect Google Calendar. Please try again.')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleToggleSync = async (enabled: boolean) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('google_calendar_connections')
        .update({ sync_enabled: enabled })
        .eq('user_id', userId)

      if (error) throw error

      setSyncEnabled(enabled)
    } catch (error) {
      console.error('Error toggling sync:', error)
      alert('Failed to update sync settings. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl">
      <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Google Calendar Integration
            </CardTitle>
            <CardDescription className="mt-1">
              Sync your networking events with Google Calendar
            </CardDescription>
          </div>
          {isConnected && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-red-50/50 dark:bg-red-950/30 rounded-lg border border-red-200/50 dark:border-red-800/50">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  Connection Failed
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {errorMessage}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => {
                    setErrorMessage(null)
                    window.open('/api/google-calendar/test', '_blank')
                  }}
                >
                  Run Diagnostic Test
                </Button>
              </div>
            </div>
          </div>
        )}
        {!isConnected ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
              <p className="text-sm text-muted-foreground mb-4">
                Connect your Google Calendar to automatically sync all networking events. When you create or update events in the app, they'll appear in your Google Calendar too.
              </p>
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-5 w-5" />
                    Connect Google Calendar
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
              <div className="space-y-0.5">
                <Label htmlFor="sync-enabled" className="text-base font-semibold">
                  Enable Sync
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically sync events with Google Calendar
                </p>
              </div>
              <Switch
                id="sync-enabled"
                checked={syncEnabled}
                onCheckedChange={handleToggleSync}
              />
            </div>

            {lastSync && (
              <div className="p-4 bg-green-50/50 dark:bg-green-950/30 rounded-lg border border-green-200/50 dark:border-green-800/50">
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-muted-foreground">
                    Last synced: {new Date(lastSync).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 bg-yellow-50/50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>New events created in the app will be added to Google Calendar</li>
                    <li>Updates to events will sync to Google Calendar</li>
                    <li>You'll receive reminders from both the app and Google Calendar</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="w-full"
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-5 w-5" />
                  Disconnect Google Calendar
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

