import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const checks = {
      environment: {
        hasClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
        clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 30) || 'NOT SET',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
      },
      authentication: {
        isAuthenticated: !!user,
        userId: user?.id || 'NOT AUTHENTICATED',
        authError: authError?.message || null,
      },
      database: {
        tableExists: null as boolean | null,
        connectionError: null as string | null,
        canRead: null as boolean | null,
        canWrite: null as boolean | null,
      },
    }

    // Test database connection and table
    if (user) {
      try {
        // Test read
        const { data, error: readError } = await supabase
          .from('google_calendar_connections')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        checks.database.tableExists = true
        checks.database.canRead = !readError
        checks.database.connectionError = readError?.message || null

        // Test write (upsert with minimal data)
        if (!readError) {
          const { error: writeError } = await supabase
            .from('google_calendar_connections')
            .upsert({
              user_id: user.id,
              access_token: 'test_token_for_write_check',
            }, {
              onConflict: 'user_id',
            })
            .select()

          checks.database.canWrite = !writeError
          if (writeError) {
            checks.database.connectionError = writeError.message
          }

          // Clean up test data
          if (!writeError) {
            await supabase
              .from('google_calendar_connections')
              .delete()
              .eq('user_id', user.id)
              .eq('access_token', 'test_token_for_write_check')
          }
        }
      } catch (dbError: any) {
        checks.database.tableExists = false
        checks.database.connectionError = dbError.message || 'Unknown database error'
      }
    }

    const allChecksPass = 
      checks.environment.hasClientId &&
      checks.environment.hasClientSecret &&
      checks.environment.hasRedirectUri &&
      checks.authentication.isAuthenticated &&
      checks.database.tableExists &&
      checks.database.canRead &&
      checks.database.canWrite

    return NextResponse.json({
      status: allChecksPass ? 'ok' : 'error',
      checks,
      summary: {
        environment: checks.environment.hasClientId && checks.environment.hasClientSecret && checks.environment.hasRedirectUri ? '✅' : '❌',
        authentication: checks.authentication.isAuthenticated ? '✅' : '❌',
        database: checks.database.tableExists && checks.database.canRead && checks.database.canWrite ? '✅' : '❌',
      },
      recommendations: [
        !checks.environment.hasClientId && 'Set GOOGLE_CLIENT_ID in .env.local',
        !checks.environment.hasClientSecret && 'Set GOOGLE_CLIENT_SECRET in .env.local',
        !checks.environment.hasRedirectUri && 'Set GOOGLE_REDIRECT_URI in .env.local',
        !checks.authentication.isAuthenticated && 'You must be logged in to test',
        !checks.database.tableExists && 'Run the database migration: scripts/009_add_google_calendar_integration.sql',
        checks.database.tableExists && !checks.database.canRead && 'Check RLS policies for google_calendar_connections table',
        checks.database.tableExists && !checks.database.canWrite && 'Check RLS policies allow INSERT/UPDATE for google_calendar_connections table',
      ].filter(Boolean),
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Unknown error',
      stack: error.stack,
    }, { status: 500 })
  }
}


