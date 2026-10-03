import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:crypto/crypto.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import '../../../core/services/supabase_service.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/widgets/post_login_dialogs.dart';
import '../../../core/theme/theme_provider.dart';
import '../models/auth_models.dart';

class AuthNotifier extends StateNotifier<AuthState> {
  final SharedPreferences? _prefs;

  AuthNotifier([this._prefs]) : super(_initialAuthState(_prefs)) {
    _initAuthListener();
  }

  static AuthState _initialAuthState(SharedPreferences? prefs) {
    try {
      final session = SupabaseService.currentSession;
      if (session != null) {
        final user = session.user;
        final name = user.userMetadata?['full_name'] as String? ??
            user.email?.split('@').first ??
            'User';
        return AuthState(
          user: AppUser(
            id: user.id,
            name: name,
            email: user.email ?? '',
            avatarUrl: _extractAvatarUrl(user),
            isPro: false,
            hasCompletedProfile: true,
          ),
        );
      }
      if (prefs?.getBool('is_guest_mode') == true) {
        return AuthState(user: AppUser.guest());
      }
    } catch (_) {}
    return const AuthState();
  }

  /// Tracks whether the in-flight OAuth was triggered from the Sign-Up page.
  /// Set before calling signInWithOAuth; read in [handleOAuthCallback].
  bool _pendingOAuthIsSignUp = false;

  String get _oauthRedirectUrl {
    if (kIsWeb) {
      final origin = Uri.base.origin;
      return '$origin/auth/callback';
    }
    return 'io.supabase.netlink://login-callback';
  }

  static String? _extractAvatarUrl(User user) {
    final meta = user.userMetadata;
    if (meta != null) {
      for (final key in ['avatar_url', 'picture', 'photo_url', 'photoUrl', 'image', 'avatar']) {
        final val = meta[key];
        if (val != null && val.toString().trim().isNotEmpty) {
          return val.toString().trim();
        }
      }
    }
    if (user.identities != null) {
      for (final identity in user.identities!) {
        final idData = identity.identityData;
        if (idData != null) {
          for (final key in ['avatar_url', 'picture', 'photo_url', 'photoUrl', 'image', 'avatar']) {
            final val = idData[key];
            if (val != null && val.toString().trim().isNotEmpty) {
              return val.toString().trim();
            }
          }
        }
      }
    }
    final email = user.email?.trim().toLowerCase();
    if (email != null && email.isNotEmpty) {
      final hash = md5.convert(utf8.encode(email)).toString();
      return 'https://www.gravatar.com/avatar/$hash?s=400&d=identicon';
    }
    return null;
  }

  /// Called by [AuthCallbackScreen] after Supabase has exchanged the OAuth code.
  /// Applies the same sign-in vs sign-up enforcement and returns whether the
  /// user already has a completed profile (true → go to dashboard).
  Future<bool> handleOAuthCallback() async {
    _handlingOAuthCallback = true;
    state = state.copyWith(isLoading: true, errorMessage: null);
    final isSignUp = _pendingOAuthIsSignUp;
    _pendingOAuthIsSignUp = false;

    try {
      final user = SupabaseService.auth.currentUser;
      if (user == null) {
        state = state.copyWith(isLoading: false);
        _handlingOAuthCallback = false;
        return false;
      }

      // Enforce: Sign In cannot create a brand-new account
      if (!isSignUp) {
        final createdUtc = DateTime.tryParse(user.createdAt)?.toUtc();
        final isNewlyCreated = createdUtc != null &&
            DateTime.now().toUtc().difference(createdUtc).inSeconds.abs() < 30;

        if (isNewlyCreated) {
          final existsInDb = await SupabaseService.userProfileExists(user.id);
          if (!existsInDb) {
            await SupabaseService.auth.signOut();
            state = const AuthState().copyWith(
              errorMessage:
                  'No account found linked to this Google ID. Please create an account on the sign up page first.',
            );
            _handlingOAuthCallback = false;
            return false;
          }
        }
      }

      final hasProfile = await SupabaseService.hasCompletedProfile(user.id);
      // Clear per-session profile-shown key so the reminder fires fresh
      final prefs = _prefs ?? await SharedPreferences.getInstance();
      await prefs.remove('is_guest_mode');
      await prefs.remove('post_login_profile_shown_${user.id}');

      // Flag newly created Google account to show setup guide on first login
      final createdUtc = DateTime.tryParse(user.createdAt)?.toUtc();
      final isNewlyCreated = createdUtc != null &&
          DateTime.now().toUtc().difference(createdUtc).inSeconds.abs() < 60;
      if (isSignUp || isNewlyCreated) {
        await prefs.setBool('show_setup_guide_${user.id}', true);
      }
      final appUser = await _buildAppUser(user, hasProfile: hasProfile);
      state = AuthState(
        user: appUser,
        isLoading: false,
      );
      _syncGmailConnection(user, SupabaseService.auth.currentSession);
      _handlingOAuthCallback = false;
      return hasProfile;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      _handlingOAuthCallback = false;
      return false;
    }
  }

  Future<AppUser> _buildAppUser(User user, {bool? hasProfile}) async {
    final resolvedHasProfile =
        hasProfile ?? await SupabaseService.hasCompletedProfile(user.id);
    final isPro = await SupabaseService.isUserPro(user.id);

    String? avatarUrl;
    try {
      final profile = await SupabaseService.client
          .from('network_profiles')
          .select('avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
      final dbAvatar = profile?['avatar_url'] as String?;
      if (dbAvatar != null && dbAvatar.trim().isNotEmpty && dbAvatar.startsWith('http')) {
        avatarUrl = dbAvatar.trim();
      }
    } catch (_) {}
    avatarUrl ??= _extractAvatarUrl(user);

    return AppUser(
      id: user.id,
      name: user.userMetadata?['full_name'] as String? ??
          user.email?.split('@').first ??
          'User',
      email: user.email ?? '',
      avatarUrl: avatarUrl,
      isPro: isPro,
      hasCompletedProfile: resolvedHasProfile,
    );
  }

  /// Auto-syncs Google user OAuth token & email into the gmail_connections table
  /// so that email & highlights features connect automatically.
  void _syncGmailConnection(User user, Session? session) {
    final isGoogleUser = user.appMetadata['provider'] == 'google' ||
        user.identities?.any((i) => i.provider == 'google') == true ||
        (user.email != null && user.email!.toLowerCase().endsWith('@gmail.com'));
    if (!isGoogleUser) return;

    unawaited(() async {
      try {
        await SupabaseService.client.from('gmail_connections').upsert({
          'user_id': user.id,
          'access_token': session?.providerToken ?? session?.accessToken ?? 'oauth_google',
          'refresh_token': session?.providerRefreshToken,
          'email_address': user.email,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }, onConflict: 'user_id');
      } catch (_) {}
    }());
  }

  /// Set to true while [handleOAuthCallback] is running so that the
  /// background auth-state listener doesn't clobber the state mid-flow.
  bool _handlingOAuthCallback = false;

  void _initAuthListener() {
    try {
      if (!SupabaseService.isInitialized) {
        if (_prefs?.getBool('is_guest_mode') == true) {
          state = AuthState(user: AppUser.guest(), isLoading: false);
        }
        return;
      }

      // On a fresh page load after OAuth redirect, supabase exchanges the
      // PKCE code and fires onAuthStateChange. If handleOAuthCallback hasn't
      // run yet, we let the callback screen handle everything.
      // We detect this by checking whether the URL contains a PKCE code param.
      final hasOAuthCode = Uri.base.queryParameters.containsKey('code') ||
          Uri.base.toString().contains('code=');

      final session = SupabaseService.currentSession;
      if (session != null && !hasOAuthCode) {
        final user = session.user;
        _syncGmailConnection(user, session);
        _buildAppUser(user).then((appUser) {
          state = AuthState(
            user: appUser,
            isLoading: false,
          );
        });
      } else if (session == null && _prefs?.getBool('is_guest_mode') == true) {
        state = AuthState(user: AppUser.guest(), isLoading: false);
      }

      SupabaseService.auth.onAuthStateChange.listen((data) {
        // Skip auth-state updates while handleOAuthCallback is running —
        // it will update state with hasCompletedProfile etc.
        if (_handlingOAuthCallback) return;

        final session = data.session;
        if (session != null) {
          final user = session.user;
          _syncGmailConnection(user, session);
          _buildAppUser(user).then((appUser) {
            state = AuthState(
              user: appUser,
              isLoading: false,
            );
          });
        } else if (_prefs?.getBool('is_guest_mode') == true) {
          state = AuthState(user: AppUser.guest(), isLoading: false);
        } else if (state.user?.isGuest != true) {
          state = const AuthState();
        }
      });
    } catch (_) {}
  }

  /// Sign in with email and password
  /// Returns:
  /// - `true` if login succeeded AND profile is complete (navigate to `/dashboard`)
  /// - `false` if login failed OR profile is incomplete (navigate to `/onboarding`)
  Future<bool> signIn(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await SupabaseService.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );

      final user = res.user;
      if (user != null) {
        final hasProfile = await SupabaseService.hasCompletedProfile(user.id);
        // Clear per-session profile-shown key so the reminder fires fresh
        final prefs = _prefs ?? await SharedPreferences.getInstance();
        await prefs.remove('is_guest_mode');
        await prefs.remove('post_login_profile_shown_${user.id}');
        final appUser = await _buildAppUser(user, hasProfile: hasProfile);
        state = AuthState(
          user: appUser,
          isLoading: false,
        );
        return hasProfile;
      }
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Could not sign in. Please try again.',
      );
      return false;
    } on AuthException catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _formatAuthError(e.message),
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  /// Create a new account with email & password
  Future<bool> createAccount({
    required String name,
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await SupabaseService.auth.signUp(
        email: email.trim(),
        password: password,
        data: {'full_name': name.trim()},
      );

      final user = res.user;
      if (user != null) {
        // Flag newly created account to show setup guide on first login
        try {
          final prefs = _prefs ?? await SharedPreferences.getInstance();
          await prefs.remove('is_guest_mode');
          await prefs.setBool('show_setup_guide_${user.id}', true);
        } catch (_) {}

        unawaited(() async {
          try {
            await http.post(
              Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/auth/notify'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({
                'type': 'signup',
                'email': user.email ?? email.trim(),
              }),
            ).timeout(const Duration(seconds: 5));
          } catch (_) {}
        }());

        state = AuthState(
          user: AppUser(
            id: user.id,
            name: name.trim(),
            email: user.email ?? email.trim(),
            isPro: false,
          ),
          isLoading: false,
        );
        return true;
      }
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Account creation failed. Please try again.',
      );
      return false;
    } on AuthException catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: _formatAuthError(e.message),
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  /// Sign in with Google (OAuth)
  /// When [isSignUp] is false (called from Sign In page), it strictly enforces that
  /// an account must have previously existed. If a new user is created during this
  /// sign-in attempt, they are signed out immediately with an informative message.
  Future<bool> signInWithGoogle({bool isSignUp = false}) async {
    // If previous session was guest trial mode, reset it immediately so that
    // the UI doesn't momentarily treat the user as authenticated while redirecting.
    if (state.user?.isGuest == true) {
      state = const AuthState(isLoading: true);
    } else {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }
    try {
      // Store the sign-up intent so the callback screen can read it.
      _pendingOAuthIsSignUp = isSignUp;

      // On web: use LaunchMode.platformDefault → browser does an in-tab redirect
      // back to our /auth/callback route instead of opening a new tab that
      // would land on networklinkai.com.
      await SupabaseService.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: _oauthRedirectUrl,
        scopes:
            'email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
        queryParams: {
          'access_type': 'offline',
          'prompt': 'consent',
        },
        authScreenLaunchMode:
            kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication,
      );

      // On mobile the above opens the browser/in-app-web-view and then the
      // deep link brings us back. The session is detected by _initAuthListener.
      // On web the tab navigates away; the callback screen handles the rest.
      state = state.copyWith(isLoading: false);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  /// Sign in as guest (trial demo mode)
  Future<void> signInAsGuest() async {
    state = state.copyWith(isLoading: true);
    await Future.delayed(const Duration(milliseconds: 600));
    try {
      final prefs = _prefs ?? await SharedPreferences.getInstance();
      await prefs.setBool('is_guest_mode', true);
    } catch (_) {}
    state = AuthState(user: AppUser.guest(), isLoading: false);
  }

  /// Updates the current authenticated user's avatar URL across the application.
  void updateUserAvatar(String newAvatarUrl) {
    if (state.user != null) {
      state = state.copyWith(
        user: state.user!.copyWith(avatarUrl: newAvatarUrl),
      );
    }
  }

  /// Sign out — also clears the per-session profile-shown key so the
  /// reminder will fire again on the next login.
  Future<void> signOut() async {
    final userId = state.user?.id;
    try {
      await SupabaseService.auth.signOut();
    } catch (_) {}
    try {
      final prefs = _prefs ?? await SharedPreferences.getInstance();
      await prefs.remove('is_guest_mode');
    } catch (_) {}
    // Clear session key so profile popup fires again on next login
    if (userId != null && userId != 'guest') {
      try {
        final prefs = _prefs ?? await SharedPreferences.getInstance();
        await prefs.remove('post_login_profile_shown_$userId');
      } catch (_) {}
    }
    PostLoginDialogs.resetSession();
    state = const AuthState();
  }

  static String _formatAuthError(String error) {
    if (error.contains('Invalid login credentials') || error.contains('invalid_grant')) {
      return 'Invalid email or password';
    }
    if (error.contains('Email not confirmed')) {
      return 'Please check your email to confirm your account.';
    }
    if (error.contains('User already registered') || error.contains('already exists')) {
      return 'An account with this email already exists';
    }
    if (error.contains('Password should be at least')) {
      return 'Password must be at least 6 characters long';
    }
    return error;
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) {
    SharedPreferences? prefs;
    try {
      prefs = ref.watch(sharedPreferencesProvider);
    } catch (_) {}
    return AuthNotifier(prefs);
  },
);
