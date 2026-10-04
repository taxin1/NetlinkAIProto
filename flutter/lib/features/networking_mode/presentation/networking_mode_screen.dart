import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/localization/app_localizations.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/animated_glass_icon_button.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/router/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../events/models/events_models.dart';
import '../../events/providers/events_provider.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/widgets/scanned_card_review_dialog.dart';
import '../models/networking_mode_state.dart';
import '../providers/networking_mode_provider.dart';

class NetworkingModeScreen extends ConsumerStatefulWidget {
  const NetworkingModeScreen({super.key});

  @override
  ConsumerState<NetworkingModeScreen> createState() => _NetworkingModeScreenState();
}

class _NetworkingModeScreenState extends ConsumerState<NetworkingModeScreen> {
  late final ScrollController _scrollController;
  late final TextEditingController _contextController;
  late final TextEditingController _templateController;

  final GlobalKey _modeKey = GlobalKey();
  final GlobalKey _templateKey = GlobalKey();
  final GlobalKey _scannerKey = GlobalKey();
  final GlobalKey _statsKey = GlobalKey();

  String _activeTab = 'Mode';
  bool _isAutoScrolling = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(_onScroll);

    final state = ref.read(networkingModeProvider);
    _contextController = TextEditingController(text: state.contextMessage);
    _templateController = TextEditingController(text: state.emailTemplate ?? '');

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        ref.read(networkingModeProvider.notifier).refresh();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _contextController.dispose();
    _templateController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isAutoScrolling || !mounted || !_scrollController.hasClients) return;

    double getY(GlobalKey key) {
      if (key.currentContext == null) return double.infinity;
      final RenderBox? box = key.currentContext!.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) return double.infinity;
      return box.localToGlobal(Offset.zero).dy;
    }

    final screenH = MediaQuery.of(context).size.height;
    final triggerLine = kToolbarHeight + MediaQuery.of(context).padding.top + 72 + 50;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentPixels = _scrollController.position.pixels;

    String newActive = _activeTab;

    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) || getY(_statsKey) <= screenH * 0.65) {
      newActive = 'Stats';
    } else if (getY(_scannerKey) <= triggerLine) {
      newActive = 'Scanner';
    } else if (getY(_templateKey) <= triggerLine) {
      newActive = 'Template';
    } else {
      newActive = 'Mode';
    }

    if (newActive != _activeTab) {
      setState(() => _activeTab = newActive);
    }
  }

  void _scrollTo(GlobalKey key, [String? targetTab]) {
    if (targetTab != null && _activeTab != targetTab) {
      setState(() => _activeTab = targetTab);
    }
    if (key.currentContext == null) return;
    final RenderBox? box = key.currentContext!.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return;
    final position = box.localToGlobal(Offset.zero, ancestor: context.findRenderObject());

    final target = _scrollController.offset +
        position.dy -
        (kToolbarHeight + MediaQuery.of(context).padding.top + 16);

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

  Future<void> _handleScanCard(ImageSource source) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: source);
    if (image == null || !mounted) return;

    AppToast.show(context, context.tr('scanningCardAi'), type: ToastType.info);

    try {
      final bytes = await image.readAsBytes();
      final user = ref.read(authProvider).user;
      final cardData = await BusinessCardScannerService.scanCard(
        imageBytes: bytes,
        userId: user?.id ?? 'guest',
        fallbackNameHint: image.name.replaceAll(RegExp(r'\.[^.]+$'), '').replaceAll('_', ' '),
      );

      if (!mounted) return;

      await ScannedCardReviewDialog.show(
        context: context,
        data: cardData,
        onSave: ({
          required String name,
          required String company,
          required String title,
          required String email,
          required String phone,
          String? linkedin,
        }) async {
          await ref.read(networkingModeProvider.notifier).processScannedCard(
                name: name,
                company: company,
                title: title,
                email: email,
                phone: phone,
              );

          if (mounted) {
            AppToast.show(context, '${context.tr('cardScannedToast')} $name ($company)', type: ToastType.success);
          }
        },
      );
    } catch (e) {
      if (mounted) {
        AppToast.show(context, '${context.tr('failedToScanCardToast')} $e', type: ToastType.error);
      }
    }
  }

  void _showManualAddDialog() {
    final nameCtrl = TextEditingController();
    final companyCtrl = TextEditingController();
    final titleCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    Widget buildFormField({required String label, required Widget field}) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: AppTypography.bodySm.copyWith(
                fontWeight: FontWeight.w600,
                color: context.colors.onSurface,
              ),
            ),
            const SizedBox(height: 6),
            field,
          ],
        ),
      );
    }

    final isLight = Theme.of(context).brightness == Brightness.light;

    InputDecoration inputDecoration({required String hintText}) {
      return InputDecoration(
        hintText: hintText,
        hintStyle: AppTypography.bodySm.copyWith(
          color: context.colors.onSurfaceVariant.withValues(alpha: 0.45),
        ),
        filled: true,
        fillColor: isLight ? const Color(0xFFF8FAFC) : context.colors.surface.withValues(alpha: 0.25),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: isLight ? const Color(0xFFCBD5E1) : context.colors.glassBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: isLight ? const Color(0xFFCBD5E1) : context.colors.glassBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: context.colors.primary, width: 1.5),
        ),
      );
    }

    showDialog(
      context: context,
      builder: (ctx) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Container(
            width: 520,
            decoration: BoxDecoration(
              color: isLight ? Colors.white : const Color(0xFF0D101C),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: context.colors.glassBorder),
              boxShadow: [
                BoxShadow(
                  color: isLight
                      ? Colors.black.withValues(alpha: 0.08)
                      : Colors.black.withValues(alpha: 0.6),
                  blurRadius: isLight ? 20 : 32,
                  spreadRadius: isLight ? 0 : 4,
                  offset: isLight ? const Offset(0, 8) : Offset.zero,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header with Title, Subtitle, and Close X button
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 16, 14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.tr('quickAddContact'),
                              style: AppTypography.headlineSm.copyWith(
                                fontWeight: FontWeight.bold,
                                color: context.colors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              context.tr('quickAddContactDesc'),
                              style: AppTypography.bodySm.copyWith(
                                color: context.colors.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 20),
                        color: context.colors.onSurfaceVariant,
                        onPressed: () => Navigator.pop(ctx),
                        splashRadius: 20,
                      ),
                    ],
                  ),
                ),
                Divider(height: 1, color: context.colors.glassBorder),

                // Form content
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 18, 24, 12),
                    child: Form(
                      key: formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          buildFormField(
                            label: context.tr('fullNameRequired'),
                            field: TextFormField(
                              controller: nameCtrl,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: context.tr('contactNameHint')),
                              validator: (v) =>
                                  (v == null || v.trim().isEmpty) ? context.tr('nameIsRequired') : null,
                            ),
                          ),
                          buildFormField(
                            label: context.tr('emailAddressRequired'),
                            field: TextFormField(
                              controller: emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: context.tr('companyEmailHint')),
                              validator: (v) =>
                                  (v == null || v.trim().isEmpty) ? context.tr('emailIsRequired') : null,
                            ),
                          ),
                          buildFormField(
                            label: context.tr('phoneNumberLabel'),
                            field: TextFormField(
                              controller: phoneCtrl,
                              keyboardType: TextInputType.phone,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: '+1 (555) 000-0000'),
                            ),
                          ),
                          buildFormField(
                            label: context.tr('companyLabel'),
                            field: TextFormField(
                              controller: companyCtrl,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: context.tr('companyOrOrgHint')),
                            ),
                          ),
                          buildFormField(
                            label: context.tr('jobTitleLabel'),
                            field: TextFormField(
                              controller: titleCtrl,
                              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                              decoration: inputDecoration(hintText: context.tr('contactRoleHint')),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Divider(height: 1, color: context.colors.glassBorder),

                // Action Buttons matching contacts screen layout
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      LiquidGlassButton(
                        label: context.tr('cancel'),
                        height: 44,
                        width: 110,
                        onPressed: () => Navigator.pop(ctx),
                      ),
                      const SizedBox(width: 12),
                      GradientButton(
                        label: context.tr('saveAndSend'),
                        icon: Icons.check_rounded,
                        height: 44,
                        width: 145,
                        onPressed: () async {
                          if (!formKey.currentState!.validate()) return;
                          Navigator.pop(ctx);
                          await ref.read(networkingModeProvider.notifier).processScannedCard(
                                name: nameCtrl.text.trim(),
                                company: companyCtrl.text.trim().isEmpty
                                    ? 'Independent'
                                    : companyCtrl.text.trim(),
                                title: titleCtrl.text.trim().isEmpty
                                    ? 'Contact'
                                    : titleCtrl.text.trim(),
                                email: emailCtrl.text.trim(),
                                phone: phoneCtrl.text.trim(),
                              );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(networkingModeProvider);
    final eventsState = ref.watch(eventsNotifierProvider);
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? true;

    final isWide = Responsive.isWide(context);
    final hPad = Responsive.pagePadding(context);

    // Sync template text controller if not currently editing
    if (!state.isEditingTemplate && state.emailTemplate != null && _templateController.text != state.emailTemplate) {
      _templateController.text = state.emailTemplate!;
    }

    return Stack(
      children: [
        // ── Scrollable content ──
        SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.only(
            top: Responsive.topPadding(context),
            left: hPad,
            right: hPad,
            bottom: (isWide ? 24 : 84) + MediaQuery.of(context).padding.bottom + 24,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Page Heading (Standardized with Dashboard & Profile) ──
                  if (!Responsive.hasShellTopBar(context)) ...[
                    PopInItem(
                      index: 0,
                      child: Center(
                        child: Text(
                          context.tr('networkingMode'),
                          style: AppTypography.headlineMd,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Trial Banner (Shows when not signed in) ──
                  if (isGuest) ...[
                    const PopInItem(
                      index: 1,
                      child: TrialBannerCard(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Section 1: Mode Controls & Automation ──
                  SectionHeader(
                    icon: Icons.tune_rounded,
                    label: context.tr('modeAndAutomation'),
                    color: context.colors.primary,
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 2 : 1,
                    child: Container(
                      key: _modeKey,
                      child: _buildModeCard(context, state, eventsState.events),
                    ),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 2: Email Template ──
                  SectionHeader(
                    icon: Icons.mark_email_read_rounded,
                    label: context.tr('emailTemplateTitle'),
                    color: const Color(0xFF8B5CF6),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 3 : 2,
                    child: Container(
                      key: _templateKey,
                      child: _buildTemplateCard(context, state),
                    ),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 3: Card Scanner & Quick Add ──
                  SectionHeader(
                    icon: Icons.document_scanner_rounded,
                    label: context.tr('cardScannerTitle'),
                    color: const Color(0xFF38BDF8),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 4 : 3,
                    child: Container(
                      key: _scannerKey,
                      child: _buildScannerCard(context, state),
                    ),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 4: Session Queue & Stats ──
                  SectionHeader(
                    icon: Icons.stacked_line_chart_rounded,
                    label: context.tr('sessionQueueTitle'),
                    color: const Color(0xFF10B981),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 5 : 4,
                    child: Container(
                      key: _statsKey,
                      child: _buildStatsCard(context, state),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // ── Bottom Floating Liquid Glass Navbar ──
        FloatingLiquidGlassNavBar(
          activeTabLabel: _activeTab,
          items: [
            FloatingNavItem(
              id: 'Mode',
              label: context.tr('navMode'),
              icon: Icons.tune_outlined,
              activeIcon: Icons.tune_rounded,
              onTap: () => _scrollTo(_modeKey, 'Mode'),
            ),
            FloatingNavItem(
              id: 'Template',
              label: context.tr('navTemplate'),
              icon: Icons.edit_note_outlined,
              activeIcon: Icons.edit_note_rounded,
              onTap: () => _scrollTo(_templateKey, 'Template'),
            ),
            FloatingNavItem(
              id: 'Scanner',
              label: context.tr('navScanner'),
              icon: Icons.document_scanner_outlined,
              activeIcon: Icons.document_scanner_rounded,
              onTap: () => _scrollTo(_scannerKey, 'Scanner'),
            ),
            FloatingNavItem(
              id: 'Stats',
              label: context.tr('navStats'),
              icon: Icons.bar_chart_outlined,
              activeIcon: Icons.bar_chart_rounded,
              onTap: () => _scrollTo(_statsKey, 'Stats'),
            ),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: MODE CONTROLS & AUTOMATION
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildModeCard(
    BuildContext context,
    NetworkingModeState state,
    List<SmartEventItem> availableEvents,
  ) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Free Trial Limit Reached Banner
          if (state.isLimitReached) ...[
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orangeAccent.withValues(alpha: 0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.warning_amber_rounded, size: 20, color: Colors.orangeAccent),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          context.tr('freeTrialLimitReached'),
                          style: AppTypography.bodyMd.copyWith(
                            fontWeight: FontWeight.w700,
                            color: Colors.orangeAccent,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    context.tr('freeTrialLimitReachedDesc'),
                    style: AppTypography.bodySm.copyWith(
                      color: context.colors.onSurfaceVariant,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton.icon(
                    onPressed: () => context.push(AppRoutes.pricing),
                    icon: const Icon(Icons.workspace_premium_rounded, size: 16),
                    label: Text(context.tr('upgradeToPro')),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: context.colors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            ),
          ],
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.tr('autoFollowUpAutomation'),
                      style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      context.tr('autoFollowUpAutomationDesc'),
                      style: AppTypography.labelCaps.copyWith(
                        color: context.colors.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    state.isEnabled ? context.tr('activeStatus') : context.tr('disabledStatus'),
                    style: AppTypography.bodySm.copyWith(
                      fontWeight: FontWeight.w600,
                      color: state.isEnabled ? context.colors.primary : context.colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Switch(
                    value: state.isEnabled,
                    activeThumbColor: context.colors.primary,
                    onChanged: (val) {
                      if (val && state.isLimitReached) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(context.tr('freeTrialLimitReachedDesc')),
                            action: SnackBarAction(
                              label: context.tr('upgradeToPro'),
                              textColor: context.colors.primary,
                              onPressed: () => context.push(AppRoutes.pricing),
                            ),
                          ),
                        );
                        return;
                      }
                      ref.read(networkingModeProvider.notifier).toggleEnabled(val);
                    },
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),

          // Active Event Association Selector
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.colors.surface.withValues(alpha: 0.25),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.colors.glassBorder),
            ),
            child: Row(
              children: [
                Icon(Icons.event_outlined, size: 18, color: context.colors.primary),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        context.tr('targetEvent'),
                        style: AppTypography.labelSm.copyWith(color: context.colors.onSurfaceVariant),
                      ),
                      Text(
                        state.activeEventTitle ?? context.tr('selectEventToAssociate'),
                        style: AppTypography.bodySm.copyWith(
                          color: context.colors.onSurface,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  icon: Icon(Icons.arrow_drop_down_rounded, color: context.colors.primary),
                  color: context.colors.surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: context.colors.glassBorder),
                  ),
                  onSelected: (val) {
                    ref.read(networkingModeProvider.notifier).setActiveEvent(val);
                  },
                  itemBuilder: (ctx) {
                    if (availableEvents.isEmpty) {
                      return [
                        PopupMenuItem(
                          value: 'General Networking',
                          child: Text(context.tr('generalNetworking')),
                        ),
                      ];
                    }
                    return [
                      ...availableEvents.map((evt) => PopupMenuItem<String>(
                            value: evt.title,
                            child: Text(evt.title),
                          )),
                      PopupMenuItem(
                        value: 'General Networking',
                        child: Text(context.tr('generalNetworking')),
                      ),
                    ];
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Usage & Plan Status Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: context.colors.surface.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.colors.glassBorder),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      state.isPro ? Icons.workspace_premium_rounded : Icons.speed_rounded,
                      size: 16,
                      color: context.colors.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      state.isPro
                          ? context.tr('proPlanUnlimitedUsage')
                          : '${context.tr('freeTrialUsagePrefix')} ${state.usageCount} / ${state.usageLimit} ${context.tr('usesCount')}',
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.onSurface,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                if (!state.isPro)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: state.remainingUses > 10
                          ? context.colors.primary.withValues(alpha: 0.2)
                          : Colors.redAccent.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: state.remainingUses > 10
                            ? context.colors.primary
                            : Colors.redAccent,
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      '${state.remainingUses} ${context.tr('remainingPill')}',
                      style: AppTypography.labelSm.copyWith(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: state.remainingUses > 10
                            ? context.colors.primary
                            : Colors.redAccent,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: EMAIL TEMPLATE
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildTemplateCard(BuildContext context, NetworkingModeState state) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
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
                      context.tr('followUpEmailTemplate'),
                      style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      context.tr('aiCustomizedMessageDesc'),
                      style: AppTypography.labelCaps.copyWith(
                        color: context.colors.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              if (state.isTemplatePrepared)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF34D399)),
                      const SizedBox(width: 4),
                      Text(
                        context.tr('preparedStatus'),
                        style: AppTypography.labelSm.copyWith(
                          color: const Color(0xFF34D399),
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 18),

          Text(
            context.tr('eventContextPrompt'),
            style: AppTypography.labelSm.copyWith(
              color: context.colors.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _contextController,
            maxLines: 3,
            style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
            decoration: InputDecoration(
              hintText: context.tr('eventContextPlaceholder'),
              filled: true,
              fillColor: context.colors.surface.withValues(alpha: 0.25),
              contentPadding: const EdgeInsets.all(14),
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
            ),
            onChanged: (val) =>
                ref.read(networkingModeProvider.notifier).updateContextMessage(val),
          ),
          const SizedBox(height: 14),

          Center(
            child: GradientButton(
              label: context.tr('generateTemplateAi'),
              icon: Icons.auto_awesome_rounded,
              isLoading: state.isGeneratingTemplate,
              height: 48,
              maxWidth: 260,
              onPressed: () =>
                  ref.read(networkingModeProvider.notifier).generateTemplate(),
            ),
          ),

          if (state.emailTemplate != null) ...[
            const SizedBox(height: 18),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  context.tr('templatePreview'),
                  style: AppTypography.labelSm.copyWith(
                    color: context.colors.onSurfaceVariant,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (!state.isEditingTemplate)
                  AnimatedGlassIconButton(
                    label: context.tr('editTemplate'),
                    icon: Icons.edit_rounded,
                    size: 30,
                    iconSize: 14,
                    fontSize: 12,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    iconColor: context.colors.primary,
                    onPressed: () {
                      _templateController.text = state.emailTemplate!;
                      ref.read(networkingModeProvider.notifier).setEditingTemplate(true);
                    },
                  )
                else
                  Row(
                    children: [
                      TextButton(
                        onPressed: () => ref
                            .read(networkingModeProvider.notifier)
                            .setEditingTemplate(false),
                        style: TextButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        ),
                        child: Text(
                          context.tr('cancel'),
                          style: TextStyle(color: context.colors.onSurfaceVariant, fontSize: 12),
                        ),
                      ),
                      const SizedBox(width: 6),
                      AnimatedGlassIconButton(
                        label: context.tr('save'),
                        icon: Icons.check_rounded,
                        size: 30,
                        iconSize: 14,
                        fontSize: 12,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        iconColor: Colors.greenAccent,
                        onPressed: () {
                          ref
                              .read(networkingModeProvider.notifier)
                              .updateTemplateContent(_templateController.text.trim());
                          ref
                              .read(networkingModeProvider.notifier)
                              .setEditingTemplate(false);
                        },
                      ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 8),

            if (state.isEditingTemplate)
              TextField(
                controller: _templateController,
                maxLines: 7,
                style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                decoration: InputDecoration(
                  filled: true,
                  fillColor: context.colors.surface.withValues(alpha: 0.35),
                  contentPadding: const EdgeInsets.all(14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: context.colors.primary),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: context.colors.glassBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: context.colors.primary),
                  ),
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: context.colors.surface.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.colors.glassBorder),
                ),
                child: Text(
                  state.emailTemplate!,
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurface,
                    height: 1.5,
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: BUSINESS CARD SCANNER
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildScannerCard(BuildContext context, NetworkingModeState state) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
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
                      context.tr('businessCardScanner'),
                      style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      context.tr('businessCardScannerDesc'),
                      style: AppTypography.labelCaps.copyWith(
                        color: context.colors.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          Center(
            child: GradientButton(
              label: context.tr('uploadBusinessCard'),
              icon: Icons.upload_file_rounded,
              height: 48,
              maxWidth: 260,
              onPressed: () => _handleScanCard(ImageSource.gallery),
            ),
          ),
          const SizedBox(height: 10),
          Center(
            child: LiquidGlassButton(
              label: context.tr('captureWithCamera'),
              icon: Icons.photo_camera_rounded,
              height: 48,
              maxWidth: 260,
              onPressed: () => _handleScanCard(ImageSource.camera),
            ),
          ),
          const SizedBox(height: 10),
          Center(
            child: LiquidGlassButton(
              label: context.tr('quickAddContact'),
              icon: Icons.person_add_rounded,
              height: 48,
              maxWidth: 260,
              onPressed: _showManualAddDialog,
            ),
          ),

          if (state.lastScannedMessage != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF34D399).withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Color(0xFF34D399), size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      state.lastScannedMessage!,
                      style: AppTypography.bodySm.copyWith(
                        color: const Color(0xFF34D399),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: SESSION QUEUE & STATS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildStatsCard(BuildContext context, NetworkingModeState state) {
    final scannedCount = state.sessionScannedContacts.length;
    final sentCount = state.sessionScannedContacts.where((c) => c.emailSent).length;

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(20),
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
                      context.tr('sessionQueueStats'),
                      style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      context.tr('sessionQueueStatsDesc'),
                      style: AppTypography.labelCaps.copyWith(
                        color: context.colors.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              if (state.sessionScannedContacts.isNotEmpty)
                TextButton.icon(
                  onPressed: () => context.go(AppRoutes.contacts),
                  icon: Icon(Icons.arrow_forward_rounded, size: 14, color: context.colors.primary),
                  label: Text(context.tr('contacts'), style: AppTypography.labelSm.copyWith(color: context.colors.primary)),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // Mini Stats Row
          Row(
            children: [
              _MiniStatChip(
                label: context.tr('scannedStat'),
                value: '$scannedCount',
                color: context.colors.primary,
                icon: Icons.document_scanner_outlined,
              ),
              const SizedBox(width: 8),
              _MiniStatChip(
                label: context.tr('sentStat'),
                value: '$sentCount',
                color: const Color(0xFF10B981),
                icon: Icons.mark_email_read_outlined,
              ),
              const SizedBox(width: 8),
              _MiniStatChip(
                label: context.tr('rateStat'),
                value: '${state.responseRate}%',
                color: context.colors.secondary,
                icon: Icons.trending_up_rounded,
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (state.sessionScannedContacts.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(
                  context.tr('noBusinessCardsScanned'),
                  textAlign: TextAlign.center,
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                  ),
                ),
              ),
            )
          else
            ...state.sessionScannedContacts.map((contact) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: context.colors.surface.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: context.colors.glassBorder),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: context.colors.primary.withValues(alpha: 0.15),
                      child: Text(
                        contact.name.isNotEmpty ? contact.name[0].toUpperCase() : '?',
                        style: AppTypography.bodyMd.copyWith(
                          color: context.colors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            contact.name,
                            style: AppTypography.bodyMd.copyWith(
                              fontWeight: FontWeight.bold,
                              color: context.colors.onSurface,
                            ),
                          ),
                          Text(
                            '${contact.title} • ${contact.company}',
                            style: AppTypography.bodySm.copyWith(
                              color: context.colors.onSurfaceVariant,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: contact.emailSent
                            ? const Color(0xFF10B981).withValues(alpha: 0.15)
                            : context.colors.primary.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: contact.emailSent
                                ? const Color(0xFF34D399).withValues(alpha: 0.4)
                              : context.colors.primary.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        contact.emailSent ? context.tr('sentStatus') : context.tr('savedStatus'),
                        style: AppTypography.labelSm.copyWith(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: contact.emailSent ? const Color(0xFF34D399) : context.colors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

class _MiniStatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;

  const _MiniStatChip({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        decoration: BoxDecoration(
          color: context.colors.surface.withValues(alpha: 0.3),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: context.colors.glassBorder),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: AppTypography.labelCaps.copyWith(
                fontSize: 10,
                color: context.colors.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: AppTypography.headlineSm.copyWith(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
