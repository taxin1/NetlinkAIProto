import { createClient } from '@/lib/supabase/client'

export interface AuthError {
  message: string
  status?: number
}

export class AuthService {
  private supabase = createClient()

  async signInWithPassword(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(this.getErrorMessage(error.message))
      }

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  async signUp(email: string, password: string, redirectPath?: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectPath || '/onboarding'}`,
        },
      })

      if (error) {
        throw new Error(this.getErrorMessage(error.message))
      }

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  async signInWithOAuth(provider: 'google' | 'github' | 'discord', redirectPath?: string) {
    console.log('[OAuth] signInWithOAuth method called with provider:', provider)
    try {
      // Get the current origin - this ensures we use localhost when on localhost,
      // and production domain when on production, regardless of Supabase Site URL setting
      console.log('[OAuth] Getting current origin...')
      const currentOrigin = window.location.origin
      const redirectTo = new URL(`${currentOrigin}/auth/callback`)



      // Store the expected origin in sessionStorage so the callback can verify it
      // This helps us detect if Supabase redirected to the wrong domain
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('oauth_expected_origin', currentOrigin)
        sessionStorage.setItem('oauth_redirect_path', redirectPath || '/dashboard')
      }

      // Explicitly set the redirectTo to force Supabase to use our URL
      // The redirectTo must match one of the allowed redirect URLs in Supabase dashboard
      const redirectToUrl = redirectTo.toString()

      console.log('[OAuth] Initiating OAuth with redirectTo:', redirectToUrl)
      console.log('[OAuth] Current origin:', currentOrigin)
      console.log('[OAuth] Provider:', provider)

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectToUrl,
          skipBrowserRedirect: true
        }
      })

      if (error) {
        console.error('[OAuth] Error initiating OAuth:', error)
        // Clean up sessionStorage on error
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('oauth_expected_origin')
          sessionStorage.removeItem('oauth_redirect_path')
        }
        throw new Error(this.getErrorMessage(error.message))
      }

      console.log('[OAuth] Generated OAuth URL:', data.url)

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        throw new Error(this.getErrorMessage(error.message))
      }

      return { error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw new Error(this.getErrorMessage(error.message))
      }

      return { error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    }
  }

  private getErrorMessage(error: string): string {
    // Map Supabase error messages to user-friendly messages
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please check your email and click the confirmation link',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long',
      'Unable to validate email address: invalid format': 'Please enter a valid email address',
      'Signup is disabled': 'Account creation is currently disabled',
      'Email rate limit exceeded': 'Too many attempts. Please try again later',
    }

    return errorMap[error] || error
  }

  getCurrentUser() {
    return this.supabase.auth.getUser()
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
