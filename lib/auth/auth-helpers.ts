import { createClient } from '@/lib/supabase/client'
import { isFirebaseAuthEnabled } from '@/lib/firebase/config'
import {
  firebaseSignInWithEmail,
  firebaseSignUpWithEmail,
  firebaseSignInWithGoogle,
  firebaseSignOutUser,
  firebaseResetPassword,
} from '@/lib/firebase/client'
import { bridgeFirebaseToSupabaseSession } from '@/lib/auth/firebase-supabase-bridge'

export interface AuthError {
  message: string
  status?: number
}

export class AuthService {
  private _supabase: ReturnType<typeof createClient> | null = null

  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient()
    }
    return this._supabase
  }

  private get useFirebase(): boolean {
    return isFirebaseAuthEnabled()
  }

  async signInWithPassword(email: string, password: string, redirectPath = '/dashboard') {
    if (this.useFirebase) {
      try {
        await firebaseSignInWithEmail(email, password)
        const bridge = await bridgeFirebaseToSupabaseSession(redirectPath, { forceRefresh: true })
        if (!bridge.success) {
          throw new Error(bridge.error || 'Could not complete sign in.')
        }
        const { data: { session } } = await this.supabase.auth.getSession()
        return {
          data: {
            session,
            user: session?.user ?? null,
            redirectTo: bridge.redirectTo,
          },
          error: null,
        }
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        }
      }
    }

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
    const next = redirectPath || '/onboarding'

    if (this.useFirebase) {
      try {
        await firebaseSignUpWithEmail(email, password)
        const bridge = await bridgeFirebaseToSupabaseSession(next, { forceRefresh: true })
        if (!bridge.success) {
          throw new Error(bridge.error || 'Account created but sign in failed. Try logging in.')
        }
        const { data: { session, user } } = await this.supabase.auth.getSession()
        return {
          data: { session, user, redirectTo: bridge.redirectTo },
          error: null,
        }
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? this.getErrorMessage(error.message) : 'An unexpected error occurred',
        }
      }
    }

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${next}`,
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
    const next = redirectPath || '/dashboard'

    if (this.useFirebase && provider === 'google') {
      try {
        await firebaseSignInWithGoogle()
        const bridge = await bridgeFirebaseToSupabaseSession(next, { forceRefresh: true })
        if (!bridge.success) {
          throw new Error(bridge.error || 'Could not complete Google sign in.')
        }
        const { data: { session } } = await this.supabase.auth.getSession()
        return {
          data: {
            session,
            user: session?.user ?? null,
            url: null,
            redirectTo: bridge.redirectTo,
          },
          error: null,
        }
      } catch (error) {
        return {
          data: null,
          error: error instanceof Error ? error.message : 'An unexpected error occurred',
        }
      }
    }

    console.log('[OAuth] signInWithOAuth method called with provider:', provider)
    try {
      const currentOrigin = window.location.origin
      const redirectTo = new URL(`${currentOrigin}/auth/callback`)

      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('oauth_expected_origin', currentOrigin)
        sessionStorage.setItem('oauth_redirect_path', next)
      }

      const redirectToUrl = redirectTo.toString()

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectToUrl,
          skipBrowserRedirect: true
        }
      })

      if (error) {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.removeItem('oauth_expected_origin')
          sessionStorage.removeItem('oauth_redirect_path')
        }
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

  async signOut() {
    try {
      if (this.useFirebase) {
        await firebaseSignOutUser()
      }
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
    if (this.useFirebase) {
      try {
        await firebaseResetPassword(email)
        return { error: null }
      } catch (error) {
        return {
          error: error instanceof Error ? this.getErrorMessage(error.message) : 'An unexpected error occurred',
        }
      }
    }

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
    const errorMap: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'INVALID_LOGIN_CREDENTIALS': 'Invalid email or password',
      'auth/invalid-credential': 'Invalid email or password',
      'auth/user-not-found': 'Invalid email or password',
      'auth/wrong-password': 'Invalid email or password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'Email not confirmed': 'Please check your email and click the confirmation link',
      'User already registered': 'An account with this email already exists',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long',
      'auth/weak-password': 'Password must be at least 6 characters long',
      'Unable to validate email address: invalid format': 'Please enter a valid email address',
      'auth/invalid-email': 'Please enter a valid email address',
      'Signup is disabled': 'Account creation is currently disabled',
      'Email rate limit exceeded': 'Too many attempts. Please try again later',
      'auth/popup-closed-by-user': 'Sign in was cancelled',
      'auth/popup-blocked': 'Pop-up was blocked. Allow pop-ups and try again.',
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
