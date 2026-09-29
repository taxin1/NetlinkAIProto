import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
import '../../../core/router/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../calendar/providers/calendar_provider.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/localization/app_localizations.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> with WidgetsBindingObserver {
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
  bool _isGmailConnected = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    final user = ref.read(authProvider).user;
    final userEmail = (user != null && !user.isGuest && user.email.isNotEmpty)
        ? user.email
        : 'user@example.com';
    final userName = (user != null && !user.isGuest && user.name.isNotEmpty)
        ? user.name
        : 'Alex Rivera';

    _emailController = TextEditingController(text: userEmail);
    _passwordController = TextEditingController();
    _fromNameController = TextEditingController(text: userName);
    _smtpHostController = TextEditingController(text: 'smtp.gmail.com');
    _smtpPortController = TextEditingController(text: '587');
    _aiTrainerController = TextEditingController(
      text: 'Tone: Professional yet conversational. Emphasize tech partnerships and B2B SaaS deal-flow.',
    );
    _loadSavedSettings();
  }

  Future<void> _loadSavedSettings() async {
    final user = ref.read(authProvider).user;
    if (user == null || user.isGuest) return;
    try {
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
      }

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

      // Check real Gmail connection
      final gmailRes = await SupabaseService.client
          .from('gmail_connections')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
      if (mounted) {
        setState(() {
          _isGmailConnected = gmailRes != null;
        });
      }
    } catch (_) {}
  }

  Future<void> _deleteEmailConfig() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.colors.surfaceCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(context.tr('deleteEmailSettingsTitle')),
        content: Text(
          context.tr('deleteEmailSettingsConfirm'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: Text(context.tr('cancel'), style: TextStyle(color: context.colors.onSurfaceVariant)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: Text(context.tr('delete'), style: const TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
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
      ).timeout(const Duration(seconds: 8));

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
      AppToast.show(context, context.tr('emailConfigRemoved'));
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _fromNameController.dispose();
    _smtpHostController.dispose();
    _smtpPortController.dispose();
    _aiTrainerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final isGuest = user?.isGuest ?? false;
    final calendarState = ref.watch(calendarNotifierProvider);
    final isDark = ref.watch(themeModeProvider) == ThemeMode.dark;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.only(
            top: Responsive.topPadding(context),
            left: Responsive.pagePadding(context),
            right: Responsive.pagePadding(context),
            bottom: 48,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Page Heading ──
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

                  // ── Trial Banner ──
                  if (isGuest) ...[
                    const PopInItem(
                      index: 1,
                      child: TrialBannerCard(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Section 1: Profile & Account ──
                  SectionHeader(
                    icon: Icons.person_rounded,
                    label: context.tr('profileAndAccount'),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 2 : 1,
                    child: _buildProfileCard(context, user, isGuest),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 2: Appearance & Theme ──
                  SectionHeader(
                    icon: Icons.palette_outlined,
                    label: context.tr('appearanceAndTheme'),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 3 : 2,
                    child: _buildAppearanceCard(context, isDark),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 3: Language & Localization ──
                  SectionHeader(
                    icon: Icons.language_rounded,
                    label: context.tr('languageAndLocalization'),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 4 : 3,
                    child: _buildLanguageCard(context),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 4: Subscription & Usage ──
                  SectionHeader(
                    icon: Icons.workspace_premium_rounded,
                    label: context.tr('subscriptionAndUsage'),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 5 : 4,
                    child: _buildSubscriptionCard(context, isGuest, user),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 5: Email Configuration ──
                  SectionHeader(
                    icon: Icons.mail_rounded,
                    label: context.tr('emailConfig'),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 6 : 5,
                    child: isGuest
                        ? _buildGuestLockCard(context, context.tr('configureEmailAccount'))
                        : _buildEmailConfigCard(context),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 6: AI Assistant Trainer ──
                  SectionHeader(
                    icon: Icons.psychology_rounded,
                    label: context.tr('aiTrainer'),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 7 : 6,
                    child: isGuest
                        ? _buildGuestLockCard(context, context.tr('trainCustomAiKnowledge'))
                        : _buildAiTrainerCard(context),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 7: Connected Integrations ──
                  SectionHeader(
                    icon: Icons.integration_instructions_rounded,
                    label: context.tr('connectedIntegrations'),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 8 : 7,
                    child: _buildIntegrationsCard(context, calendarState, isGuest),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 8: Session & Security ──
                  SectionHeader(
                    icon: Icons.shield_rounded,
                    label: context.tr('sessionAndSecurity'),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 9 : 8,
                    child: _buildDangerZoneCard(context),
                  ),
                  const SizedBox(height: 48),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: PROFILE CARD
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildProfileCard(BuildContext context, dynamic user, bool isGuest) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          ClipOval(
            child: Container(
              width: 56,
              height: 56,
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
              child: (user?.avatarUrl?.trim().isNotEmpty == true)
                  ? Image.network(
                      user!.avatarUrl!.trim(),
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
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.name ?? (isGuest ? context.tr('guestExplorer') : context.tr('authorizedUser')),
                  style: AppTypography.headlineSm.copyWith(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  isGuest ? context.tr('trialSessionActive') : (user?.email ?? 'user@netlink.ai'),
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 8),
                Builder(
                  builder: (_) {
                    final isPro = user?.isPro == true;
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
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: context.colors.glassBorder),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            ),
            icon: const Icon(Icons.edit_outlined, size: 16),
            label: Text(context.tr('editProfile')),
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
            Text(
              title,
              style: AppTypography.bodySm.copyWith(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                color: isSelected ? context.colors.primary : context.colors.onSurface,
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
  // SECTION 2: LANGUAGE SELECTOR
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
  // SECTION 3: SUBSCRIPTION & USAGE
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildSubscriptionCard(BuildContext context, bool isGuest, dynamic user) {
    final isPro = user?.isPro == true;

    final planTitle = isGuest
        ? context.tr('trialTier')
        : (isPro ? context.tr('professionalPlan') : context.tr('freeStarterPlan'));

    final planDesc = isGuest
        ? context.tr('trialTierDesc')
        : (isPro
            ? context.tr('proPlanDesc')
            : context.tr('freeStarterDesc'));

    final buttonLabel = (isGuest || !isPro) ? context.tr('upgradeToPro') : context.tr('managePlan');

    final aiGenerationsQuota = isGuest
        ? context.tr('threeTrialQuota')
        : (isPro ? context.tr('unlimitedQuota') : '10');

    final cardScansQuota = isGuest
        ? context.tr('fiveScansQuota')
        : (isPro ? context.tr('unlimitedQuota') : '15');

    final emailSyncQuota = isGuest
        ? context.tr('previewQuota')
        : (isPro ? context.tr('dailyAutoSync') : context.tr('manualSync'));

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
                      planTitle,
                      style: AppTypography.headlineSm.copyWith(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      planDesc,
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              GradientButton(
                label: buttonLabel,
                icon: Icons.bolt_rounded,
                onPressed: () => context.push(AppRoutes.pricing),
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
              _buildQuotaPill(context, context.tr('cardScansQuotaLabel'), cardScansQuota, const Color(0xFF38BDF8)),
              const SizedBox(width: 12),
              _buildQuotaPill(context, context.tr('emailSyncQuotaLabel'), emailSyncQuota, const Color(0xFF8B5CF6)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuotaPill(BuildContext context, String title, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
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
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: AppTypography.bodySm.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: EMAIL CONFIGURATION
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
              Text(
                context.tr('outboundProvider'),
                style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
              ),
              const Spacer(),
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
              _buildProviderTab('gmail', '📧 Gmail'),
              const SizedBox(width: 8),
              _buildProviderTab('outlook', '📨 Outlook'),
              const SizedBox(width: 8),
              _buildProviderTab('smtp', '⚙️ ${context.tr('customSmtp')}'),
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
            hint: '••••••••••••••••',
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

                          setState(() {
                            _isSavingEmail = false;
                            _hasSavedEmailSettings = true;
                          });
                          if (context.mounted) {
                            AppToast.show(context, context.tr('emailSettingsSaved'));
                          }
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
                          setState(() => _isTestingEmail = true);
                          try {
                            final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/test-email');
                            final session = SupabaseService.auth.currentSession;
                            await http.post(
                              uri,
                              headers: {
                                'Content-Type': 'application/json',
                                if (session?.accessToken != null)
                                  'Authorization': 'Bearer ${session!.accessToken}',
                              },
                            ).timeout(const Duration(seconds: 10));
                          } catch (_) {}
                          setState(() => _isTestingEmail = false);
                          if (context.mounted) {
                            AppToast.show(context, context.tr('testEmailDispatched'));
                          }
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
  // SECTION 5: AI TRAINER CARD
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildAiTrainerCard(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('customAiInstructionsTitle'),
            style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 4),
          Text(
            context.tr('customAiInstructionsDesc'),
            style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _aiTrainerController,
            maxLines: 4,
            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
            decoration: InputDecoration(
              hintText: context.tr('aiPreferencesHint'),
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
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerRight,
            child: GradientButton(
              label: _isSavingAiTrainer ? context.tr('savingPersona') : context.tr('updateAiKnowledge'),
              icon: Icons.psychology_rounded,
              onPressed: _isSavingAiTrainer
                  ? null
                  : () async {
                      setState(() => _isSavingAiTrainer = true);
                      try {
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
                            'memory_type': 'tone_preference',
                            'memory_key': 'custom_persona',
                            'memory_value': _aiTrainerController.text.trim(),
                            'importance_score': 8,
                          }),
                        ).timeout(const Duration(seconds: 8));

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

                      setState(() => _isSavingAiTrainer = false);
                      if (context.mounted) {
                        AppToast.show(context, context.tr('aiPersonaUpdated'));
                      }
                    },
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: CONNECTED INTEGRATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  Future<void> _toggleGmailIntegration() async {
    final user = ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      AppToast.show(context, context.tr('pleaseSignInToConnectGmail'));
      return;
    }

    if (_isGmailConnected) {
      try {
        await SupabaseService.client
            .from('gmail_connections')
            .delete()
            .eq('user_id', user.id);
        if (mounted) {
          setState(() => _isGmailConnected = false);
          AppToast.show(context, context.tr('gmailDisconnected'));
        }
      } catch (_) {}
    } else {
      try {
        final authUri = Uri.parse(
            '${BusinessCardScannerService.apiBaseUrl}/api/gmail/auth?redirect=true');
        if (await canLaunchUrl(authUri)) {
          await launchUrl(authUri, mode: LaunchMode.externalApplication);
        } else {
          await ref.read(authProvider.notifier).signInWithGoogle();
        }
      } catch (_) {
        if (mounted) {
          AppToast.show(context, context.tr('unableToLaunchOAuth'));
        }
      }
    }
  }

  Widget _buildIntegrationsCard(BuildContext context, dynamic calendarState, bool isGuest) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          _buildIntegrationTile(
            context,
            icon: Icons.mail_lock_rounded,
            title: context.tr('gmailDirectOAuthTitle'),
            subtitle: context.tr('gmailDirectOAuthDesc'),
            isConnected: _isGmailConnected,
            color: const Color(0xFFEA4335),
            onToggle: _toggleGmailIntegration,
          ),
          const SizedBox(height: 16),
          Divider(color: context.colors.glassBorder, height: 1),
          const SizedBox(height: 16),
          _buildIntegrationTile(
            context,
            icon: Icons.calendar_month_rounded,
            title: context.tr('googleCalendarSyncTitle'),
            subtitle: context.tr('googleCalendarSyncDesc'),
            isConnected: calendarState.isGoogleCalendarConnected,
            color: const Color(0xFF4285F4),
            onToggle: () {
              ref.read(calendarNotifierProvider.notifier).connectGoogleCalendar();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildIntegrationTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isConnected,
    required Color color,
    required VoidCallback onToggle,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Icon(icon, color: color, size: 22),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        AnimatedGlassIconButton(
          label: isConnected ? context.tr('connectedStatus') : context.tr('setupNavTabConnect'),
          icon: isConnected ? Icons.check_rounded : Icons.link_rounded,
          size: 32,
          iconSize: 15,
          fontSize: 12,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          iconColor: isConnected ? const Color(0xFF10B981) : context.colors.primary,
          textColor: isConnected ? const Color(0xFF10B981) : context.colors.primary,
          borderColor: isConnected
              ? const Color(0xFF10B981).withValues(alpha: 0.5)
              : context.colors.primary.withValues(alpha: 0.35),
          onPressed: onToggle,
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: DANGER ZONE
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
              borderSide: BorderSide(color: context.colors.primary),
            ),
            filled: true,
            fillColor: context.colors.surfaceCard.withValues(alpha: 0.3),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }
}
