import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../router/app_router.dart';
import '../services/supabase_service.dart';
import '../../features/auth/providers/auth_provider.dart';
import 'app_modal_dialog.dart';
import '../localization/app_localizations.dart';

import '../tour/tour_controller.dart';

// ─────────────────────────────────────────────────────────────────────────────
// PostLoginDialogsController
//
// Orchestrates what happens after a user lands on the authenticated shell:
//   1. Profile-incomplete reminder popup (once per login session)
//   2. Product-tour overlay (11-step interactive feature showcase)
// ─────────────────────────────────────────────────────────────────────────────

class PostLoginDialogs extends ConsumerStatefulWidget {
  const PostLoginDialogs({super.key});

  // Session flags: ensure the post-login sequence runs only once per session
  static bool _sessionTourStarted = false;
  static bool _sessionProfileChecked = false;
  static String? _currentSessionUserId;

  /// Opens the 11-step feature showcase tour from anywhere in the app
  static void openTour(BuildContext context, {VoidCallback? onComplete}) {
    try {
      ProviderScope.containerOf(context, listen: false)
          .read(tourControllerProvider.notifier)
          .startTour(0, true);
    } catch (_) {}
  }

  /// Resets session state when a user signs out
  static void resetSession() {
    _sessionTourStarted = false;
    _sessionProfileChecked = false;
    _currentSessionUserId = null;
  }

  @override
  ConsumerState<PostLoginDialogs> createState() => _PostLoginDialogsState();
}

class _PostLoginDialogsState extends ConsumerState<PostLoginDialogs> {
  static const _profileShownKey = 'post_login_profile_shown_';

  bool _isCheckingProfile = false;

  @override
  void initState() {
    super.initState();
    _scheduleInitialSequence(500);
  }

  void _scheduleInitialSequence([int delayMs = 500]) {
    Future.delayed(Duration(milliseconds: delayMs), () {
      if (mounted && !PostLoginDialogs._sessionTourStarted) {
        _startInitialTour();
      }
    });
  }

  Future<void> _startInitialTour() async {
    if (!mounted || PostLoginDialogs._sessionTourStarted) return;
    final authState = ref.read(authProvider);
    final user = authState.user;
    if (user == null || user.isGuest) return;

    PostLoginDialogs._sessionTourStarted = true;
    PostLoginDialogs._currentSessionUserId = user.id;

    // Only show setup guide if this is a newly created account (manual or Google signup)
    try {
      final prefs = await SharedPreferences.getInstance();
      final setupKey = 'show_setup_guide_${user.id}';
      final isNewAccount = prefs.getBool(setupKey) ?? false;

      if (isNewAccount) {
        // Clear flag immediately so refreshing the browser or re-logging in won't show it again
        await prefs.setBool(setupKey, false);
        await prefs.setBool('netlink-tour-completed', true);

        if (!mounted) return;
        final tourState = ref.read(tourControllerProvider);
        if (!tourState.isActive) {
          ref.read(tourControllerProvider.notifier).startTour(0, true);
          return;
        }
      }
    } catch (_) {}

    // Existing account / browser refresh: do not show setup guide, check profile directly
    _maybeShowProfileDialog();
  }

  Future<void> _maybeShowProfileDialog() async {
    if (!mounted || PostLoginDialogs._sessionProfileChecked || _isCheckingProfile) return;
    final authState = ref.read(authProvider);
    final user = authState.user;

    // Guests do not have a network profile completion window
    if (user == null || user.isGuest) {
      PostLoginDialogs._sessionProfileChecked = true;
      return;
    }

    _isCheckingProfile = true;

    try {
      final prefs = await SharedPreferences.getInstance();
      if (!mounted) return;

      final profileShownKey = '$_profileShownKey${user.id}';
      final profileAlreadyShown = prefs.getBool(profileShownKey) ?? false;
      if (profileAlreadyShown) {
        PostLoginDialogs._sessionProfileChecked = true;
        return;
      }

      bool profileComplete = user.hasCompletedProfile;
      if (!profileComplete) {
        // Double check against Supabase
        profileComplete = await SupabaseService.hasCompletedProfile(user.id);
      }

      if (!profileComplete && mounted) {
        PostLoginDialogs._sessionProfileChecked = true;
        await prefs.setBool(profileShownKey, true);

        // Allow any preceding tour exit animation to settle completely
        await Future.delayed(const Duration(milliseconds: 350));
        if (!mounted) return;

        // Sequence Step 2: Trigger the network profile completion window
        await _showProfileIncompleteDialog();
      } else {
        PostLoginDialogs._sessionProfileChecked = true;
      }
    } finally {
      _isCheckingProfile = false;
    }
  }

  // ── Profile-incomplete dialog ──────────────────────────────────────────────
  Future<String?> _showProfileIncompleteDialog() async {
    return AppModalDialog.show<String>(
      context: context,
      barrierDismissible: false,
      title: context.tr('profileIncompleteTitle'),
      message: context.tr('profileIncompleteMessage'),
      secondaryMessage: context.tr('profileIncompleteSecondary'),
      icon: Icons.person_outline_rounded,
      iconColor: const Color(0xFFF59E0B),
      secondaryLabel: context.tr('skipForNow'),
      onSecondary: () => Navigator.of(context, rootNavigator: true).pop('skip'),
      primaryLabel: context.tr('completeProfile'),
      primaryIcon: Icons.arrow_forward_rounded,
      onPrimary: () {
        Navigator.of(context, rootNavigator: true).pop('complete');
        context.go(AppRoutes.profile);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // 1. Listen for user change (e.g. logging in as a new user or signing out)
    ref.listen(authProvider, (prev, next) {
      final user = next.user;
      if (user != null && user.id != PostLoginDialogs._currentSessionUserId) {
        PostLoginDialogs._sessionTourStarted = false;
        PostLoginDialogs._sessionProfileChecked = false;
        PostLoginDialogs._currentSessionUserId = user.id;
      }
      if (user != null && !PostLoginDialogs._sessionTourStarted) {
        _scheduleInitialSequence(400);
      }
    });

    // 2. Listen for Tour state changes:
    // When the tour finishes (was active, now inactive, i.e., followed, skipped, or crossed):
    ref.listen<TourState>(tourControllerProvider, (prev, next) {
      if (prev != null && prev.isActive && !next.isActive) {
        // Tour just finished or was skipped/crossed -> trigger profile completion window
        _maybeShowProfileDialog();
      }
    });

    return const SizedBox.shrink();
  }
}
