import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/auth_provider.dart';

/// Handles the OAuth redirect back from Google / Supabase (PKCE flow).
///
/// On web with [LaunchMode.platformDefault] the browser navigates away for
/// OAuth and comes back here with `?code=` in the URL.
/// supabase_flutter automatically exchanges the PKCE code on startup and
/// fires an [AuthChangeEvent.signedIn] event. We listen for that event,
/// then do the post-OAuth checks and route accordingly.
class AuthCallbackScreen extends ConsumerStatefulWidget {
  const AuthCallbackScreen({super.key});

  @override
  ConsumerState<AuthCallbackScreen> createState() => _AuthCallbackScreenState();
}

class _AuthCallbackScreenState extends ConsumerState<AuthCallbackScreen> {
  String? _status;
  // ignore: cancel_subscriptions
  StreamSubscription<dynamic>? _authSub;
  bool _handled = false;

  @override
  void initState() {
    super.initState();
    _startListening();
    // Fallback: if the session was already exchanged before this screen mounted
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkExisting());
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }

  void _startListening() {
    // Listen for the signedIn event that supabase fires after PKCE exchange
    _authSub = Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (!mounted || _handled) return;
      if (data.event == AuthChangeEvent.signedIn && data.session != null) {
        _handled = true;
        _proceed();
      }
    });
  }

  Future<void> _checkExisting() async {
    if (!mounted || _handled) return;

    final uri = Uri.base;
    if (uri.queryParameters.containsKey('error')) {
      if (mounted) context.go(AppRoutes.signIn);
      return;
    }

    // Check if session is already active, polling every 350ms for up to 6 seconds
    for (int i = 0; i < 16; i++) {
      if (!mounted || _handled) return;
      final session = Supabase.instance.client.auth.currentSession;
      if (session != null) {
        _handled = true;
        await _proceed();
        return;
      }
      await Future.delayed(const Duration(milliseconds: 350));
    }

    // Timed out — go back to sign-in
    if (mounted && !_handled) {
      context.go(AppRoutes.signIn);
    }
  }

  Future<void> _proceed() async {
    if (!mounted) return;
    setState(() => _status = context.tr('settingUpWorkspace'));

    try {
      await ref.read(authProvider.notifier).handleOAuthCallback();
      if (!mounted) return;

      final authState = ref.read(authProvider);
      if (!authState.isAuthenticated) {
        // Sign-in guard rejected the attempt (no existing account)
        context.go(AppRoutes.signIn);
        return;
      }

      // Always land on dashboard where PostLoginDialogs displays profile reminder popup + tour
      context.go(AppRoutes.dashboard);
    } catch (_) {
      if (mounted) context.go(AppRoutes.signIn);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              context.colors.background,
              context.colors.primary.withValues(alpha: 0.08),
              context.colors.background,
            ],
          ),
        ),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 32),
            constraints: const BoxConstraints(maxWidth: 360),
            decoration: BoxDecoration(
              color: context.colors.surfaceCard,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: context.colors.glassBorder,
              ),
              boxShadow: [
                BoxShadow(
                  color: context.colors.primary.withValues(alpha: 0.12),
                  blurRadius: 40,
                  spreadRadius: 4,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [

                SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      context.colors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  _status ?? context.tr('completingSignIn'),
                  style: AppTypography.bodyMd.copyWith(
                    color: context.colors.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),
                Text(
                  context.tr('pleaseWait'),
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
