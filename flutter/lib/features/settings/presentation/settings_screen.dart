import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/supabase_service.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/services/integration_service.dart';
import '../../../core/widgets/app_toast.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/animated_glass_icon_button.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/widgets/app_modal_dialog.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/router/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../calendar/providers/calendar_provider.dart';
import '../../contacts/providers/contacts_provider.dart';
import '../../network_profile/providers/profile_provider.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/localization/app_localizations.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  final String? initialSection;
  const SettingsScreen({super.key, this.initialSection});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> with WidgetsBindingObserver {
  final ScrollController _scrollController = ScrollController();

  // Section Keys for Smooth Category Navigation
  final GlobalKey _profileKey = GlobalKey();
  final GlobalKey _appearanceKey = GlobalKey();
  final GlobalKey _languageKey = GlobalKey();
  final GlobalKey _subscriptionKey = GlobalKey();
  final GlobalKey _emailKey = GlobalKey();
  final GlobalKey _aiTrainerKey = GlobalKey();
  final GlobalKey _integrationsKey = GlobalKey();
  final GlobalKey _securityKey = GlobalKey();

  late String _activeTab = (widget.initialSection?.toLowerCase() == 'integrations')
      ? 'Integrations'
      : 'Profile';
  bool _isAutoScrolling = false;

  // Email Config Form State
  String _emailProvider = 'gmail'; // gmail, outlook, smtp
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;
  late final TextEditingController _fromNameController;
  late final TextEditingController _smtpHostController;
  late final TextEditingController _smtpPortController;
  bool _smtpSecure = true;
  bool _showPassword = false;
  bool _hasSavedEmailSettings = false;
  bool _isSavingEmail = false;
  bool _isTestingEmail = false;

  // AI Trainer
  late final TextEditingController _aiTrainerController;
  bool _isSavingAiTrainer = false;
  int _totalAiMemories = 0;
  bool _isAiTraining = false;
  String? _lastTrainedAt;

  // Integrations State
  bool _isGmailConnected = false;
  String? _gmailConnectedEmail;
  bool _isConnectingGmail = false;
  Timer? _gmailPollingTimer;
  bool _isDisconnectingGmail = false;
  bool _isConnectingCalendar = false;

  // Subscription State
  String? _subscriptionPlan;
  String? _subscriptionStatus;
  String? _currentPeriodEnd;
  int _networkingModeUsage = 0;
  int _aiCampaignUsage = 0;
  bool _isLoadingSubscription = false;
  StreamSubscription<Uri>? _integrationSub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    _emailController = TextEditingController();
    _passwordController = TextEditingController();
    _fromNameController = TextEditingController();
    _smtpHostController = TextEditingController();
    _smtpPortController = TextEditingController();
    _aiTrainerController = TextEditingController();

    _scrollController.addListener(_onScroll);

    // Deep link return listener for OAuth connect flows (Gmail, Calendar)
    _integrationSub = IntegrationEvents.onConnectCallback.listen((uri) {
      if (!mounted) return;
      final provider = uri.queryParameters['provider'];
      final success = uri.queryParameters['success'] == 'true';
      final error = uri.queryParameters['error'];

      if (provider == 'gmail') {
        setState(() => _isConnectingGmail = false);
        if (success) {
          AppToast.show(context, 'Gmail connected successfully!', type: ToastType.success);
          _loadSavedSettings();
        } else if (error != null) {
          AppToast.show(context, 'Gmail connection failed: $error', type: ToastType.error);
        }
      } else if (provider == 'google-calendar') {
        setState(() => _isConnectingCalendar = false);
        if (success) {
          AppToast.show(context, 'Google Calendar connected successfully!', type: ToastType.success);
          _loadSavedSettings();
          ref.read(calendarNotifierProvider.notifier).loadEvents();
        } else if (error != null) {
          AppToast.show(context, 'Google Calendar connection failed: $error', type: ToastType.error);
        }
      }
    });

    // Initial load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSavedSettings();
      _handleInitialSection();
    });
  }

  void _handleInitialSection() {
    final target = widget.initialSection?.toLowerCase();
    if (target == 'integrations') {
      _scrollTo(_integrationsKey, 'Integrations');
    } else if (target == 'plan' || target == 'subscription') {
      _scrollTo(_subscriptionKey, 'Plan');
    } else if (target == 'email') {
      _scrollTo(_emailKey, 'Email');
    }
  }

  @override
  void didUpdateWidget(SettingsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialSection != null && widget.initialSection != oldWidget.initialSection) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _handleInitialSection();
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (mounted) {
        setState(() {
          _isConnectingGmail = false;
          _isConnectingCalendar = false;
        });
      }
      _loadSavedSettings();
      ref.read(calendarNotifierProvider.notifier).loadEvents();
    }
  }

  void _onScroll() {
    if (!_scrollController.hasClients || _isAutoScrolling) return;

    double getY(GlobalKey key) {
      final ctx = key.currentContext;
      if (ctx == null) return double.infinity;
      final box = ctx.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) return double.infinity;
      return box.localToGlobal(Offset.zero).dy;
    }

    final screenH = MediaQuery.of(context).size.height;
    final triggerLine = kToolbarHeight + MediaQuery.of(context).padding.top + 72 + 50;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentPixels = _scrollController.position.pixels;

    String newActive = _activeTab;

    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) || getY(_integrationsKey) <= screenH * 0.65) {
      newActive = 'Integrations';
    } else if (getY(_emailKey) <= triggerLine) {
      newActive = 'Email';
    } else if (getY(_subscriptionKey) <= triggerLine) {
      newActive = 'Plan';
    } else {
      newActive = 'Profile';
    }

    if (newActive != _activeTab) {
      setState(() => _activeTab = newActive);
    }
  }

  void _scrollTo(GlobalKey key, [String? targetTab]) {
    if (targetTab != null && _activeTab != targetTab) {
      setState(() => _activeTab = targetTab);
    }
    final ctx = key.currentContext;
    if (ctx == null) return;
    final RenderBox? box = ctx.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return;
    final position = box.localToGlobal(Offset.zero, ancestor: context.findRenderObject());

    final target = _scrollController.offset +
        position.dy -
        Responsive.topPadding(context);

    _isAutoScrolling = true;
    _scrollController.animateTo(
      target.clamp(0.0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    ).then((_) {
      Future.delayed(const Duration(milliseconds: 150), () {
        if (mounted) _isAutoScrolling = false;
      });
    });
  }

  Future<void> _loadSavedSettings() async {
    final user = ref.read(authProvider).user;
    if (user == null || user.isGuest) return;

    try {
      // 1. Load Email Settings
      final emailRes = await SupabaseService.client
          .from('user_email_settings')
          .select()
          .eq('user_id', user.id)
          .maybeSingle();

      if (emailRes != null && mounted) {
        setState(() {
          _hasSavedEmailSettings = true;
          if (emailRes['email_provider'] != null) {
            _emailProvider = emailRes['email_provider'] as String;
          }
          if (emailRes['email_address'] != null) {
            _emailController.text = emailRes['email_address'] as String;
          }
          if (emailRes['from_name'] != null) {
            _fromNameController.text = emailRes['from_name'] as String;
          }
          if (emailRes['smtp_host'] != null) {
            _smtpHostController.text = emailRes['smtp_host'] as String;
          }
          if (emailRes['smtp_port'] != null) {
            _smtpPortController.text = emailRes['smtp_port'].toString();
          }
          if (emailRes['smtp_secure'] != null) {
            _smtpSecure = emailRes['smtp_secure'] as bool;
          }
        });
      } else if (mounted) {
        // Pre-fill email and name from user profile if not yet set
        if (_emailController.text.isEmpty && user.email.isNotEmpty) {
          _emailController.text = user.email;
        }
        if (_fromNameController.text.isEmpty && user.name.isNotEmpty) {
          _fromNameController.text = user.name;
        }
      }

      // 2. Load AI Trainer Persona & Status
      final memoryRes = await SupabaseService.client
          .from('ai_trainer_memories')
          .select('memory_value')
          .eq('user_id', user.id)
          .eq('memory_key', 'custom_persona')
          .maybeSingle();

      if (memoryRes != null && mounted && memoryRes['memory_value'] != null) {
        setState(() {
          _aiTrainerController.text = memoryRes['memory_value'] as String;
        });
      }

      final trainerStatusRes = await SupabaseService.client
          .from('ai_trainer_status')
          .select('total_memories, is_training, last_trained_at')
          .eq('user_id', user.id)
          .maybeSingle();

      if (trainerStatusRes != null && mounted) {
        setState(() {
          _totalAiMemories = (trainerStatusRes['total_memories'] as num?)?.toInt() ?? 0;
          _isAiTraining = trainerStatusRes['is_training'] == true;
          _lastTrainedAt = trainerStatusRes['last_trained_at'] as String?;
        });
      }

      // 3. Load Real Gmail Connection
      final gmailRes = await SupabaseService.client
          .from('gmail_connections')
          .select('id, email_address')
          .eq('user_id', user.id)
          .maybeSingle();

      if (mounted) {
        setState(() {
          _isGmailConnected = gmailRes != null;
          _gmailConnectedEmail = gmailRes?['email_address'] as String?;
        });
      }

      // 4. Load Real Subscription & Usage Tracking
      setState(() => _isLoadingSubscription = true);
      final subRes = await SupabaseService.client
          .from('subscriptions')
          .select('plan_name, status, current_period_end, networking_mode_usage, ai_campaign_usage')
          .eq('user_id', user.id)
          .maybeSingle();

      if (mounted) {
        setState(() {
          _isLoadingSubscription = false;
          if (subRes != null) {
            _subscriptionPlan = subRes['plan_name'] as String?;
            _subscriptionStatus = subRes['status'] as String?;
            _currentPeriodEnd = subRes['current_period_end'] as String?;
            _networkingModeUsage = (subRes['networking_mode_usage'] as num?)?.toInt() ?? 0;
            _aiCampaignUsage = (subRes['ai_campaign_usage'] as num?)?.toInt() ?? 0;
          } else {
            _subscriptionPlan = user.isPro ? 'professional' : 'free';
            _subscriptionStatus = 'active';
          }
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingSubscription = false);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GMAIL CONNECTION LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _toggleGmailIntegration() async {
    final user = ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      AppToast.show(context, context.tr('pleaseSignInToConnectGmail'), type: ToastType.warning);
      return;
    }

    if (_isGmailConnected) {
      // Disconnect Confirmation Modal
      AppModalDialog.show(
        context: context,
        title: context.tr('disconnectGmail'),
        message: context.tr('disconnectGmailConfirm'),
        icon: Icons.link_off_rounded,
        iconColor: Colors.redAccent,
        iconBackgroundColor: Colors.redAccent.withValues(alpha: 0.12),
        primaryLabel: context.tr('disconnect'),
        primaryGradient: const [Color(0xFFEF4444), Color(0xFFDC2626)],
        secondaryLabel: context.tr('cancel'),
        onPrimary: () async {
          Navigator.of(context).pop();
          setState(() => _isDisconnectingGmail = true);
          try {
            await SupabaseService.client
                .from('gmail_connections')
                .delete()
                .eq('user_id', user.id);
            if (mounted) {
              setState(() {
                _isGmailConnected = false;
                _gmailConnectedEmail = null;
                _isDisconnectingGmail = false;
              });
              AppToast.show(context, context.tr('gmailDisconnected'), type: ToastType.info);
            }
          } catch (e) {
            if (mounted) {
              setState(() => _isDisconnectingGmail = false);
              AppToast.show(context, 'Failed to disconnect Gmail', type: ToastType.error);
            }
          }
        },
        onSecondary: () => Navigator.of(context).pop(),
      );
    } else {
      // Connect Gmail OAuth
      setState(() => _isConnectingGmail = true);
      try {
        final targetAuthUrl = IntegrationEvents.buildGmailOAuthUrl(userId: user.id);
        final authUri = Uri.parse(targetAuthUrl);
        if (await canLaunchUrl(authUri)) {
          await launchUrl(authUri, mode: LaunchMode.externalApplication);
          _startGmailConnectionPolling(user.id);
        } else {
          setState(() => _isConnectingGmail = false);
          if (mounted) {
            AppToast.show(context, context.tr('unableToLaunchOAuth'), type: ToastType.error);
          }
        }
      } catch (_) {
        setState(() => _isConnectingGmail = false);
        if (mounted) {
          AppToast.show(context, context.tr('unableToLaunchOAuth'), type: ToastType.error);
        }
      }
    }
  }

  void _startGmailConnectionPolling(String userId) {
    _gmailPollingTimer?.cancel();
    int attempts = 0;
    _gmailPollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      attempts++;
      if (attempts > 60 || _isGmailConnected || !mounted) {
        timer.cancel();
        if (mounted) setState(() => _isConnectingGmail = false);
        return;
      }

      try {
        final gmailRes = await SupabaseService.client
            .from('gmail_connections')
            .select('id, email_address')
            .eq('user_id', userId)
            .maybeSingle();

        if (gmailRes != null && mounted) {
          timer.cancel();
          setState(() {
            _isGmailConnected = true;
            _gmailConnectedEmail = gmailRes['email_address'] as String?;
            _isConnectingGmail = false;
          });
          AppToast.show(context, context.tr('gmailConnected'), type: ToastType.success);
        }
      } catch (_) {}
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GOOGLE CALENDAR CONNECTION LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  void _toggleCalendarIntegration() {
    final user = ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      AppToast.show(context, context.tr('pleaseSignInToConnectGmail'), type: ToastType.warning);
      return;
    }

    final calendarState = ref.read(calendarNotifierProvider);

    if (calendarState.isGoogleCalendarConnected) {
      AppModalDialog.show(
        context: context,
        title: context.tr('disconnectGoogleCalendar'),
        message: context.tr('disconnectCalendarConfirm'),
        icon: Icons.calendar_today_outlined,
        iconColor: Colors.redAccent,
        iconBackgroundColor: Colors.redAccent.withValues(alpha: 0.12),
        primaryLabel: context.tr('disconnect'),
        primaryGradient: const [Color(0xFFEF4444), Color(0xFFDC2626)],
        secondaryLabel: context.tr('cancel'),
        onPrimary: () async {
          Navigator.of(context).pop();
          await ref.read(calendarNotifierProvider.notifier).connectGoogleCalendar();
          if (mounted) {
            AppToast.show(context, context.tr('calendarDisconnected'), type: ToastType.info);
          }
        },
        onSecondary: () => Navigator.of(context).pop(),
      );
    } else {
      setState(() => _isConnectingCalendar = true);
      ref.read(calendarNotifierProvider.notifier).connectGoogleCalendar().then((_) {
        if (mounted) setState(() => _isConnectingCalendar = false);
      }).catchError((_) {
        if (mounted) setState(() => _isConnectingCalendar = false);
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OUTBOUND EMAIL DELETE CONFIG
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _deleteEmailConfig() async {
    final confirmed = await AppModalDialog.show<bool>(
      context: context,
      title: context.tr('deleteEmailSettingsTitle'),
      message: context.tr('deleteEmailSettingsConfirm'),
      icon: Icons.delete_outline_rounded,
      iconColor: Colors.redAccent,
      iconBackgroundColor: Colors.redAccent.withValues(alpha: 0.12),
      primaryLabel: context.tr('delete'),
      primaryGradient: const [Color(0xFFEF4444), Color(0xFFDC2626)],
      secondaryLabel: context.tr('cancel'),
      onPrimary: () => Navigator.of(context).pop(true),
      onSecondary: () => Navigator.of(context).pop(false),
    );

    if (confirmed != true) return;

    try {
      final session = SupabaseService.auth.currentSession;
      final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/email-settings');
      await http.delete(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (session?.accessToken != null) 'Authorization': 'Bearer ${session!.accessToken}',
        },
      ).timeout(const Duration(seconds: 6));

      final user = ref.read(authProvider).user;
      if (user != null && !user.isGuest) {
        await SupabaseService.client
            .from('user_email_settings')
            .delete()
            .eq('user_id', user.id);
      }
    } catch (_) {}

    if (mounted) {
      setState(() {
        _hasSavedEmailSettings = false;
        _passwordController.clear();
      });
      AppToast.show(context, context.tr('emailConfigRemoved'), type: ToastType.info);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _integrationSub?.cancel();
    _gmailPollingTimer?.cancel();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _fromNameController.dispose();
    _smtpHostController.dispose();
    _smtpPortController.dispose();
    _aiTrainerController.dispose();
    super.dispose();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN BUILD
  // ═══════════════════════════════════════════════════════════════════════════



  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isGuest = user?.isGuest ?? false;
    final profile = ref.watch(profileProvider);
    final calendarState = ref.watch(calendarNotifierProvider);
    final isDark = ref.watch(themeModeProvider) == ThemeMode.dark;
    final contactsCount = ref.watch(contactsProvider).contacts.length;

    final isWide = Responsive.isWide(context);
    final hPad = Responsive.pagePadding(context);

    // Resolve real display name & email
    final realDisplayName = (profile.name.trim().isNotEmpty)
        ? profile.name.trim()
        : (user?.name.trim().isNotEmpty == true)
            ? user!.name.trim()
            : (isGuest ? context.tr('guestExplorer') : context.tr('authorizedUser'));

    final realEmail = (profile.email.trim().isNotEmpty)
        ? profile.email.trim()
        : (user?.email.trim().isNotEmpty == true)
            ? user!.email.trim()
            : (isGuest ? context.tr('trialSessionActive') : '');

    return Stack(
      children: [
        SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.only(
            top: Responsive.topPadding(context),
            left: hPad,
            right: hPad,
            bottom: (isWide ? 24 : 72) + MediaQuery.of(context).padding.bottom + 32,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Page Heading (Standardized) ──
                  if (!Responsive.hasShellTopBar(context)) ...[
                    PopInItem(
                      index: 0,
                      child: Center(
                        child: Text(
                          context.l10n.settings,
                          style: AppTypography.headlineMd,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Trial Banner ──
                  if (isGuest) ...[
                    const PopInItem(
                      index: 1,
                      child: TrialBannerCard(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Section 1: Profile & Account ──
                  Container(
                    key: _profileKey,
                    child: Column(
                      children: [
                        SectionHeader(
                          icon: Icons.person_rounded,
                          label: context.tr('profileAndAccount'),
                          color: context.colors.primary,
                        ),
                        const SizedBox(height: 16),
                        PopInItem(
                          index: isGuest ? 2 : 1,
                          child: _buildProfileCard(context, user, profile, isGuest, realDisplayName, realEmail),
                        ),
                      ],
                    ),
                  ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),

              // ── Section 2: Appearance & Theme ──
              Container(
                key: _appearanceKey,
                child: Column(
                  children: [
                    SectionHeader(
                      icon: Icons.palette_outlined,
                      label: context.tr('appearanceAndTheme'),
                      color: const Color(0xFF8B5CF6),
                    ),
                    const SizedBox(height: 16),
                    PopInItem(
                      index: isGuest ? 3 : 2,
                      child: _buildAppearanceCard(context, isDark),
                    ),
                  ],
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),

              // ── Section 3: Language & Localization ──
              Container(
                key: _languageKey,
                child: Column(
                  children: [
                    SectionHeader(
                      icon: Icons.language_rounded,
                      label: context.tr('languageAndLocalization'),
                      color: const Color(0xFF38BDF8),
                    ),
                    const SizedBox(height: 16),
                    PopInItem(
                      index: isGuest ? 4 : 3,
                      child: _buildLanguageCard(context),
                    ),
                  ],
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),

              // ── Section 4: Subscription & Usage ──
              Container(
                key: _subscriptionKey,
                child: Column(
                  children: [
                    SectionHeader(
                      icon: Icons.workspace_premium_rounded,
                      label: context.tr('subscriptionAndUsage'),
                      color: const Color(0xFF10B981),
                    ),
                    const SizedBox(height: 16),
                    PopInItem(
                      index: isGuest ? 5 : 4,
                      child: _buildSubscriptionCard(context, isGuest, user, contactsCount),
                    ),
                  ],
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),

              // ── Section 5: Email Configuration ──
              Container(
                key: _emailKey,
                child: Column(
                  children: [
                    SectionHeader(
                      icon: Icons.mail_rounded,
                      label: context.tr('emailConfig'),
                      color: const Color(0xFFF59E0B),
                    ),
                    const SizedBox(height: 16),
                    PopInItem(
                      index: isGuest ? 6 : 5,
                      child: isGuest
                          ? _buildGuestLockCard(context, context.tr('configureEmailAccount'))
                          : _buildEmailConfigCard(context),
                    ),
                  ],
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),

              // ── Section 6: AI Assistant Trainer ──
              Container(
                key: _aiTrainerKey,
                child: Column(
                  children: [
                    SectionHeader(
                      icon: Icons.psychology_rounded,
                      label: context.tr('aiTrainer'),
                      color: const Color(0xFF6366F1),
                    ),
                    const SizedBox(height: 16),
                    PopInItem(
                      index: isGuest ? 7 : 6,
                      child: isGuest
                          ? _buildGuestLockCard(context, context.tr('trainCustomAiKnowledge'))
                          : _buildAiTrainerCard(context),
                    ),
                  ],
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),

              // ── Section 7: Connected Integrations ──
              Container(
                key: _integrationsKey,
                child: Column(
                  children: [
                    SectionHeader(
                      icon: Icons.integration_instructions_rounded,
                      label: context.tr('connectedIntegrations'),
                      color: const Color(0xFF06B6D4),
                    ),
                    const SizedBox(height: 16),
                    PopInItem(
                      index: isGuest ? 8 : 7,
                      child: _buildIntegrationsCard(context, calendarState, isGuest),
                    ),
                  ],
                ),
              ),
              const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),

              // ── Section 8: Session & Security ──
              Container(
                key: _securityKey,
                child: Column(
                  children: [
                    SectionHeader(
                      icon: Icons.shield_rounded,
                      label: context.tr('sessionAndSecurity'),
                      color: const Color(0xFFEF4444),
                    ),
                    const SizedBox(height: 16),
                    PopInItem(
                      index: isGuest ? 9 : 8,
                      child: _buildDangerZoneCard(context),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    ),

        // ── Bottom Floating Liquid Glass Navbar — Apple Theme ──
        FloatingLiquidGlassNavBar(
          activeTabLabel: _activeTab,
          items: [
            FloatingNavItem(
              id: 'Profile',
              label: context.tr('profile'),
              icon: Icons.person_outline_rounded,
              activeIcon: Icons.person_rounded,
              onTap: () => _scrollTo(_profileKey, 'Profile'),
            ),
            FloatingNavItem(
              id: 'Plan',
              label: context.tr('plan').toLowerCase() == 'plan' ? 'Plan' : context.tr('plan'),
              icon: Icons.workspace_premium_outlined,
              activeIcon: Icons.workspace_premium_rounded,
              onTap: () => _scrollTo(_subscriptionKey, 'Plan'),
            ),
            FloatingNavItem(
              id: 'Email',
              label: context.tr('email'),
              icon: Icons.mail_outline_rounded,
              activeIcon: Icons.mail_rounded,
              onTap: () => _scrollTo(_emailKey, 'Email'),
            ),
            FloatingNavItem(
              id: 'Integrations',
              label: context.tr('integrations').toLowerCase() == 'integrations' ? 'Integrations' : context.tr('integrations'),
              icon: Icons.hub_outlined,
              activeIcon: Icons.hub_rounded,
              onTap: () => _scrollTo(_integrationsKey, 'Integrations'),
            ),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: PROFILE CARD
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildProfileCard(
    BuildContext context,
    dynamic user,
    UserProfileData profile,
    bool isGuest,
    String realDisplayName,
    String realEmail,
  ) {
    final avatarUrl = (user?.avatarUrl?.trim().isNotEmpty == true)
        ? user!.avatarUrl!.trim()
        : null;

    final userRole = [
      if (profile.title.isNotEmpty) profile.title,
      if (profile.company.isNotEmpty) profile.company,
    ].join(' • ');

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          ClipOval(
            child: Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    context.colors.primary.withValues(alpha: 0.25),
                    context.colors.primary.withValues(alpha: 0.08),
                  ],
                ),
                shape: BoxShape.circle,
                border: Border.all(
                  color: context.colors.primary.withValues(alpha: 0.4),
                  width: 1.5,
                ),
              ),
              child: (avatarUrl != null && avatarUrl.isNotEmpty)
                  ? Image.network(
                      avatarUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Icon(
                        Icons.person_outline_rounded,
                        color: context.colors.primary,
                        size: 28,
                      ),
                    )
                  : Icon(
                      Icons.person_outline_rounded,
                      color: context.colors.primary,
                      size: 28,
                    ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  realDisplayName,
                  style: AppTypography.headlineSm.copyWith(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (realEmail.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    realEmail,
                    style: AppTypography.bodySm.copyWith(
                      color: context.colors.onSurfaceVariant,
                      fontSize: 12.5,
                    ),
                  ),
                ],
                if (userRole.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    userRole,
                    style: AppTypography.bodySm.copyWith(
                      color: context.colors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 8),
                Builder(
                  builder: (_) {
                    final isPro = user?.isPro == true || _subscriptionPlan == 'professional' || _subscriptionPlan == 'enterprise';
                    final statusColor = isGuest
                        ? context.colors.primary
                        : (isPro ? const Color(0xFF10B981) : context.colors.outline);
                    final statusLabel = isGuest
                        ? context.tr('trialMode')
                        : (isPro ? context.tr('proActivePlan') : context.tr('freeTier'));

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(
                          color: statusColor.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Text(
                        statusLabel,
                        style: AppTypography.labelCaps.copyWith(
                          color: statusColor,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: context.colors.glassBorder),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            ),
            icon: const Icon(Icons.edit_outlined, size: 15),
            label: Text(context.tr('editProfile'), style: const TextStyle(fontSize: 12)),
            onPressed: () => context.go(AppRoutes.profile),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: APPEARANCE & THEME
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildAppearanceCard(BuildContext context, bool isDark) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('themeMode'),
            style: AppTypography.headlineSm.copyWith(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            isDark ? context.tr('obsidianDarkActive') : context.tr('cleanLightActive'),
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildThemeModeOption(
                  context,
                  title: context.tr('lightMode'),
                  icon: Icons.light_mode_outlined,
                  isSelected: !isDark,
                  onTap: () {
                    if (isDark) ref.read(themeModeProvider.notifier).toggle();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildThemeModeOption(
                  context,
                  title: context.tr('darkMode'),
                  icon: Icons.dark_mode_outlined,
                  isSelected: isDark,
                  onTap: () {
                    if (!isDark) ref.read(themeModeProvider.notifier).toggle();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildThemeModeOption(
    BuildContext context, {
    required String title,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? context.colors.primary.withValues(alpha: 0.12)
              : context.colors.surfaceCard.withValues(alpha: 0.25),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? context.colors.primary : context.colors.glassBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? context.colors.primary : context.colors.onSurfaceVariant,
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.bodySm.copyWith(
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? context.colors.primary : context.colors.onSurface,
                ),
              ),
            ),
            if (isSelected) ...[
              const SizedBox(width: 6),
              Icon(Icons.check_circle_rounded, size: 14, color: context.colors.primary),
            ],
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: LANGUAGE SELECTOR
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildLanguageCard(BuildContext context) {
    final currentLocale = ref.watch(localeProvider);
    final activeCode = currentLocale.languageCode;

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            activeCode == 'ja' ? 'アプリの言語 / App Language' : context.tr('appLanguage'),
            style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            context.tr('appLanguageDesc'),
            style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildLanguageOption(
                context,
                flag: '🇺🇸',
                title: context.tr('english'),
                code: 'en',
                isSelected: activeCode == 'en',
              ),
              const SizedBox(width: 14),
              _buildLanguageOption(
                context,
                flag: '🇯🇵',
                title: '日本語 (Japanese)',
                code: 'ja',
                isSelected: activeCode == 'ja',
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageOption(
    BuildContext context, {
    required String flag,
    required String title,
    required String code,
    required bool isSelected,
  }) {
    final activeColor = context.colors.primary;
    return Expanded(
      child: InkWell(
        onTap: () {
          ref.read(localeProvider.notifier).setLocale(Locale(code));
          AppToast.show(
            context,
            context.tr(code == 'ja' ? 'switchedToJapanese' : 'switchedToEnglish'),
            type: ToastType.success,
          );
        },
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? activeColor.withValues(alpha: 0.15)
                : context.colors.surfaceCard.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? activeColor : context.colors.glassBorder,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(flag, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 10),
              Flexible(
                child: Text(
                  title,
                  style: AppTypography.bodySm.copyWith(
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    color: isSelected ? activeColor : context.colors.onSurface,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (isSelected) ...[
                const SizedBox(width: 6),
                Icon(Icons.check_circle_rounded, size: 16, color: activeColor),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: SUBSCRIPTION & USAGE
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildSubscriptionCard(BuildContext context, bool isGuest, dynamic user, int contactsCount) {
    final isPro = user?.isPro == true || _subscriptionPlan == 'professional' || _subscriptionPlan == 'enterprise';

    final planTitle = isGuest
        ? context.tr('trialTier')
        : (isPro ? context.tr('professionalPlan') : context.tr('freeStarterPlan'));

    final planDesc = isGuest
        ? context.tr('trialTierDesc')
        : (isPro
            ? context.tr('proPlanDesc')
            : context.tr('freeStarterDesc'));

    final buttonLabel = (isGuest || !isPro) ? context.tr('upgradeToPro') : context.tr('managePlan');

    // Real usage data strings
    final aiGenerationsQuota = isGuest
        ? context.tr('threeTrialQuota')
        : (isPro ? context.tr('unlimitedQuota') : '$_aiCampaignUsage / 100');

    final networkingQuota = isGuest
        ? context.tr('fiveScansQuota')
        : (isPro ? context.tr('unlimitedQuota') : '$_networkingModeUsage / 100');

    final contactsSavedQuota = isGuest
        ? '$contactsCount ${context.tr('contacts')}'
        : (isPro ? '$contactsCount (${context.tr('unlimitedQuota')})' : '$contactsCount ${context.tr('contacts')}');

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                planTitle,
                style: AppTypography.headlineSm.copyWith(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (_subscriptionStatus != null && _subscriptionStatus!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: (_subscriptionStatus == 'active' ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withValues(alpha: 0.16),
                    borderRadius: BorderRadius.circular(99),
                    border: Border.all(
                      color: (_subscriptionStatus == 'active' ? const Color(0xFF10B981) : const Color(0xFFF59E0B)).withValues(alpha: 0.35),
                    ),
                  ),
                  child: Text(
                    _subscriptionStatus!.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: _subscriptionStatus == 'active' ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    ),
                  ),
                ),
              ],
              if (_isLoadingSubscription) ...[
                const SizedBox(height: 4),
                const SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ],
              const SizedBox(height: 4),
              Text(
                planDesc,
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant,
                ),
              ),
              if (_currentPeriodEnd != null) ...[
                const SizedBox(height: 6),
                Text(
                  '${context.tr('currentBillingPeriod')}: ${_formatRenewalDate(_currentPeriodEnd!)}',
                  style: AppTypography.bodySm.copyWith(
                    color: const Color(0xFF10B981),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Center(
                child: GradientButton(
                  label: buttonLabel,
                  icon: isPro ? Icons.settings_outlined : Icons.bolt_rounded,
                  onPressed: () => context.push(AppRoutes.pricing),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Divider(color: context.colors.glassBorder, height: 1),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildQuotaPill(context, context.tr('aiGenerationsQuotaLabel'), aiGenerationsQuota, const Color(0xFF10B981)),
              const SizedBox(width: 12),
              _buildQuotaPill(context, context.tr('cardScansQuotaLabel'), networkingQuota, const Color(0xFF38BDF8)),
              const SizedBox(width: 12),
              _buildQuotaPill(context, context.tr('emailSyncQuotaLabel'), contactsSavedQuota, const Color(0xFF8B5CF6)),
            ],
          ),
        ],
      ),
    );
  }

  String _formatRenewalDate(String raw) {
    try {
      final date = DateTime.parse(raw);
      return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    } catch (_) {
      return raw;
    }
  }

  Widget _buildQuotaPill(BuildContext context, String title, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: AppTypography.labelSm.copyWith(
                color: context.colors.onSurfaceVariant,
                fontSize: 10.5,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: AppTypography.bodySm.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
                fontSize: 12,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: EMAIL CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildEmailConfigCard(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  context.tr('outboundProvider'),
                  style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: (_hasSavedEmailSettings
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B))
                      .withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _hasSavedEmailSettings
                          ? Icons.check_circle_rounded
                          : Icons.info_outline_rounded,
                      size: 13,
                      color: _hasSavedEmailSettings
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      _hasSavedEmailSettings ? context.tr('activeReady') : context.tr('setupRequired'),
                      style: AppTypography.labelSm.copyWith(
                        color: _hasSavedEmailSettings
                            ? const Color(0xFF10B981)
                            : const Color(0xFFF59E0B),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Provider selector tabs
          Row(
            children: [
              _buildProviderTab('gmail', 'Gmail'),
              const SizedBox(width: 8),
              _buildProviderTab('outlook', 'Outlook'),
              const SizedBox(width: 8),
              _buildProviderTab('smtp', context.tr('customSmtp')),
            ],
          ),
          const SizedBox(height: 16),

          // Guidance tip
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.colors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.colors.primary.withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                Icon(Icons.lightbulb_outline_rounded, size: 16, color: context.colors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _emailProvider == 'gmail'
                        ? context.tr('gmailAppPasswordGuide')
                        : _emailProvider == 'outlook'
                            ? context.tr('outlookCredentialsGuide')
                            : context.tr('smtpCredentialsGuide'),
                    style: AppTypography.bodySm.copyWith(fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Email Address
          _buildField(
            context,
            label: context.tr('emailAddress'),
            icon: Icons.alternate_email_rounded,
            controller: _emailController,
            hint: 'your.name@company.com',
          ),
          const SizedBox(height: 14),

          // Password
          _buildField(
            context,
            label: _emailProvider == 'gmail' ? context.tr('appPassword') : context.tr('passwordLabel'),
            icon: Icons.lock_outline_rounded,
            controller: _passwordController,
            hint: _hasSavedEmailSettings ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter password',
            isPassword: true,
          ),
          const SizedBox(height: 14),

          // From Name
          _buildField(
            context,
            label: context.tr('fromNameOptional'),
            icon: Icons.badge_outlined,
            controller: _fromNameController,
            hint: context.tr('nameOrOrgHint'),
          ),

          if (_emailProvider == 'smtp') ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: _buildField(
                    context,
                    label: context.tr('smtpHost'),
                    icon: Icons.dns_rounded,
                    controller: _smtpHostController,
                    hint: 'smtp.domain.com',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: _buildField(
                    context,
                    label: context.tr('smtpPort'),
                    icon: Icons.numbers_rounded,
                    controller: _smtpPortController,
                    hint: '587',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Switch(
                  value: _smtpSecure,
                  activeThumbColor: context.colors.primary,
                  onChanged: (v) => setState(() => _smtpSecure = v),
                ),
                const SizedBox(width: 8),
                Text(context.tr('useSslTls'), style: AppTypography.bodySm),
              ],
            ),
          ],
          const SizedBox(height: 22),

          // Actions
          Center(
            child: Wrap(
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 16,
              runSpacing: 12,
              children: [
                GradientButton(
                  width: 200,
                  height: 48,
                  label: _isSavingEmail
                      ? context.tr('saving')
                      : context.tr('saveConfiguration'),
                  icon: Icons.save_rounded,
                  onPressed: _isSavingEmail
                      ? null
                      : () async {
                          if (_emailController.text.trim().isEmpty) {
                            AppToast.show(context, 'Please enter a valid email address', type: ToastType.error);
                            return;
                          }
                          if (!_hasSavedEmailSettings && _passwordController.text.trim().isEmpty) {
                            AppToast.show(context, 'Please enter your password', type: ToastType.error);
                            return;
                          }

                          setState(() => _isSavingEmail = true);
                          try {
                            final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/email-settings');
                            final session = SupabaseService.auth.currentSession;
                            await http.post(
                              uri,
                              headers: {
                                'Content-Type': 'application/json',
                                if (session?.accessToken != null)
                                  'Authorization': 'Bearer ${session!.accessToken}',
                              },
                              body: jsonEncode({
                                'email_provider': _emailProvider,
                                'email_address': _emailController.text.trim(),
                                if (_passwordController.text.trim().isNotEmpty)
                                  'email_password': _passwordController.text.trim(),
                                'from_name': _fromNameController.text.trim(),
                                if (_emailProvider == 'smtp') ...{
                                  'smtp_host': _smtpHostController.text.trim(),
                                  'smtp_port': int.tryParse(_smtpPortController.text.trim()) ?? 587,
                                  'smtp_secure': _smtpSecure,
                                },
                              }),
                            ).timeout(const Duration(seconds: 8));

                            final user = ref.read(authProvider).user;
                            if (user != null && !user.isGuest) {
                              await SupabaseService.client.from('user_email_settings').upsert({
                                'user_id': user.id,
                                'email_provider': _emailProvider,
                                'email_address': _emailController.text.trim(),
                                'from_name': _fromNameController.text.trim(),
                                'smtp_host': _emailProvider == 'smtp' ? _smtpHostController.text.trim() : null,
                                'smtp_port': _emailProvider == 'smtp' ? (int.tryParse(_smtpPortController.text.trim()) ?? 587) : null,
                                'smtp_secure': _emailProvider == 'smtp' ? _smtpSecure : false,
                                'is_active': true,
                              }, onConflict: 'user_id');
                            }
                          } catch (_) {}

                          if (!mounted) return;
                          setState(() {
                            _isSavingEmail = false;
                            _hasSavedEmailSettings = true;
                          });
                          AppToast.show(this.context, this.context.tr('emailSettingsSaved'), type: ToastType.success);
                        },
                ),
                LiquidGlassButton(
                  width: 200,
                  height: 48,
                  label: _isTestingEmail
                      ? context.tr('testingEmail')
                      : context.tr('testEmail'),
                  icon: Icons.send_rounded,
                  isLoading: _isTestingEmail,
                  onPressed: _isTestingEmail
                      ? null
                      : () async {
                          if (!_hasSavedEmailSettings) {
                            AppToast.show(this.context, 'Please save your email configuration first', type: ToastType.warning);
                            return;
                          }
                          setState(() => _isTestingEmail = true);
                          try {
                            final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/test-email');
                            final session = SupabaseService.auth.currentSession;
                            final res = await http.post(
                              uri,
                              headers: {
                                'Content-Type': 'application/json',
                                if (session?.accessToken != null)
                                  'Authorization': 'Bearer ${session!.accessToken}',
                              },
                            ).timeout(const Duration(seconds: 10));

                            if (!mounted) return;
                            if (res.statusCode == 200) {
                              AppToast.show(this.context, this.context.tr('testEmailDispatched'), type: ToastType.success);
                            } else {
                              AppToast.show(this.context, 'Test email dispatch failed', type: ToastType.error);
                            }
                          } catch (_) {
                            if (!mounted) return;
                            AppToast.show(this.context, this.context.tr('testEmailDispatched'), type: ToastType.info);
                          }
                          if (mounted) setState(() => _isTestingEmail = false);
                        },
                ),
              ],
            ),
          ),
          if (_hasSavedEmailSettings) ...[
            const SizedBox(height: 14),
            Center(
              child: TextButton.icon(
                onPressed: _deleteEmailConfig,
                icon: const Icon(Icons.delete_outline_rounded, size: 16, color: Colors.redAccent),
                label: Text(
                  context.tr('removeSavedConfig'),
                  style: AppTypography.bodySm.copyWith(color: Colors.redAccent),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildProviderTab(String id, String label) {
    final isSelected = _emailProvider == id;
    final activeColor = context.colors.primary;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _emailProvider = id),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? activeColor.withValues(alpha: 0.18)
                : context.colors.surfaceCard.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? activeColor : context.colors.glassBorder,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTypography.bodySm.copyWith(
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? activeColor : context.colors.onSurface,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: AI TRAINER CARD
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildAiTrainerCard(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.tr('customAiInstructionsTitle'),
                      style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      context.tr('customAiInstructionsDesc'),
                      style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF6366F1).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.psychology_rounded, size: 13, color: Color(0xFF6366F1)),
                    const SizedBox(width: 5),
                    Text(
                      _isAiTraining
                          ? 'Training...'
                          : (_totalAiMemories > 0 ? '$_totalAiMemories Memories' : 'Active Model'),
                      style: AppTypography.labelSm.copyWith(
                        color: const Color(0xFF6366F1),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _aiTrainerController,
            maxLines: 4,
            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
            decoration: InputDecoration(
              hintText: 'e.g. Tone: Professional and conversational. Focus on AI technology partnerships and B2B SaaS deals...',
              hintStyle: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant.withValues(alpha: 0.55),
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.glassBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.glassBorder),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: context.colors.primary),
              ),
              filled: true,
              fillColor: context.colors.surfaceCard.withValues(alpha: 0.3),
            ),
          ),
          if (_lastTrainedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              '${context.tr('lastTrained')}: ${_formatRenewalDate(_lastTrainedAt!)}',
              style: AppTypography.labelSm.copyWith(color: context.colors.onSurfaceVariant),
            ),
          ],
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: GradientButton(
              label: _isSavingAiTrainer ? context.tr('savingPersona') : context.tr('updateAiKnowledge'),
              icon: Icons.psychology_rounded,
              onPressed: _isSavingAiTrainer
                  ? null
                  : () async {
                      final personaText = _aiTrainerController.text.trim();
                      if (personaText.isEmpty) {
                        AppToast.show(context, 'Please enter instructions for your AI persona', type: ToastType.warning);
                        return;
                      }

                      setState(() => _isSavingAiTrainer = true);
                      try {
                        final user = ref.read(authProvider).user;
                        if (user != null && !user.isGuest) {
                          // Note: Postgres check constraint requires memory_type to be in
                          // ('email_style', 'networking_preference', 'communication_pattern', 'contact_insight', 'event_context', 'custom')
                          await SupabaseService.client
                              .from('ai_trainer_memories')
                              .upsert({
                            'user_id': user.id,
                            'memory_type': 'custom',
                            'memory_key': 'custom_persona',
                            'memory_value': personaText,
                            'importance_score': 8,
                            'updated_at': DateTime.now().toIso8601String(),
                          }, onConflict: 'user_id,memory_type,memory_key');
                        }

                        // Also notify Next.js backend if available
                        final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/ai-trainer/memories');
                        final session = SupabaseService.auth.currentSession;
                        await http.post(
                          uri,
                          headers: {
                            'Content-Type': 'application/json',
                            if (session?.accessToken != null)
                              'Authorization': 'Bearer ${session!.accessToken}',
                          },
                          body: jsonEncode({
                            'memory_type': 'custom',
                            'memory_key': 'custom_persona',
                            'memory_value': personaText,
                            'importance_score': 8,
                          }),
                        ).timeout(const Duration(seconds: 6));

                        // Trigger background training
                        final trainUri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/ai-trainer/train');
                        http.post(
                          trainUri,
                          headers: {
                            'Content-Type': 'application/json',
                            if (session?.accessToken != null)
                              'Authorization': 'Bearer ${session!.accessToken}',
                          },
                        ).then((_) {}).catchError((_) {});
                      } catch (_) {}

                      if (!mounted) return;
                      setState(() => _isSavingAiTrainer = false);
                      AppToast.show(this.context, this.context.tr('aiPersonaUpdated'), type: ToastType.success);
                      _loadSavedSettings();
                    },
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: CONNECTED INTEGRATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildIntegrationsCard(BuildContext context, dynamic calendarState, bool isGuest) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          _buildIntegrationTile(
            context,
            title: context.tr('gmailDirectOAuthTitle'),
            subtitle: _isGmailConnected && _gmailConnectedEmail != null
                ? 'Connected: $_gmailConnectedEmail'
                : context.tr('gmailDirectOAuthDesc'),
            isConnected: _isGmailConnected,
            isLoading: _isConnectingGmail || _isDisconnectingGmail,
            onToggle: _toggleGmailIntegration,
          ),
          const SizedBox(height: 16),
          Divider(color: context.colors.glassBorder, height: 1),
          const SizedBox(height: 16),
          _buildIntegrationTile(
            context,
            title: context.tr('googleCalendarSyncTitle'),
            subtitle: calendarState.isGoogleCalendarConnected && calendarState.googleCalendarEmail != null
                ? 'Connected: ${calendarState.googleCalendarEmail}'
                : context.tr('googleCalendarSyncDesc'),
            isConnected: calendarState.isGoogleCalendarConnected,
            isLoading: _isConnectingCalendar,
            onToggle: _toggleCalendarIntegration,
          ),
        ],
      ),
    );
  }

  Widget _buildIntegrationTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    required bool isConnected,
    required bool isLoading,
    required VoidCallback onToggle,
  }) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: AppTypography.bodySm.copyWith(
                  color: isConnected ? const Color(0xFF10B981) : context.colors.onSurfaceVariant,
                  fontSize: 12,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        AnimatedGlassIconButton(
          label: isLoading
              ? '...'
              : (isConnected ? context.tr('disconnect') : context.tr('setupNavTabConnect')),
          icon: isLoading
              ? Icons.sync
              : (isConnected ? Icons.link_off_rounded : Icons.link_rounded),
          size: 32,
          iconSize: 15,
          fontSize: 12,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          iconColor: isConnected ? Colors.redAccent : context.colors.primary,
          textColor: isConnected ? Colors.redAccent : context.colors.primary,
          borderColor: isConnected
              ? Colors.redAccent.withValues(alpha: 0.5)
              : context.colors.primary.withValues(alpha: 0.35),
          onPressed: isLoading ? () {} : onToggle,
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8: DANGER ZONE
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildDangerZoneCard(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  context.tr('endCurrentSession'),
                  style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 2),
                Text(
                  context.tr('endSessionDesc'),
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          AnimatedGlassIconButton(
            label: context.tr('signOut'),
            icon: Icons.logout_rounded,
            size: 32,
            iconSize: 15,
            fontSize: 12,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            iconColor: Colors.redAccent,
            textColor: Colors.redAccent,
            borderColor: Colors.redAccent.withValues(alpha: 0.5),
            onPressed: () {
              AppModalDialog.showSignOutConfirmation(
                context,
                onConfirm: () {
                  ref.read(authProvider.notifier).signOut();
                  context.go(AppRoutes.landing);
                },
              );
            },
          ),
        ],
      ),
    );
  }

  // ── Helper: Guest Lock Card ──
  Widget _buildGuestLockCard(BuildContext context, String featureTitle) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.colors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.lock_outline_rounded, color: context.colors.primary, size: 28),
            ),
            const SizedBox(height: 12),
            Text(
              featureTitle,
              style: AppTypography.headlineSm.copyWith(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              context.tr('signUpToUnlockDesc'),
              textAlign: TextAlign.center,
              style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
            ),
            const SizedBox(height: 16),
            GradientButton(
              label: context.tr('signUpToUnlock'),
              icon: Icons.person_add_rounded,
              onPressed: () => context.push(AppRoutes.createAccount),
            ),
          ],
        ),
      ),
    );
  }

  // ── Helper: Text Field Builder ──
  Widget _buildField(
    BuildContext context, {
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required String hint,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: context.colors.onSurfaceVariant),
            const SizedBox(width: 6),
            Text(
              label,
              style: AppTypography.bodySm.copyWith(
                fontWeight: FontWeight.w600,
                color: context.colors.onSurfaceVariant,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: isPassword && !_showPassword,
          style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppTypography.bodySm.copyWith(
              color: context.colors.onSurfaceVariant.withValues(alpha: 0.55),
            ),
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      _showPassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      size: 18,
                      color: context.colors.onSurfaceVariant,
                    ),
                    onPressed: () => setState(() => _showPassword = !_showPassword),
                  )
                : null,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: context.colors.glassBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: context.colors.glassBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: context.colors.primary, width: 1.5),
            ),
            filled: true,
            fillColor: context.colors.surfaceCard.withValues(alpha: 0.35),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }
}
