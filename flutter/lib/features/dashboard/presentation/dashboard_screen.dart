import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/tour/tour_controller.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/widgets/animated_glass_icon_button.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import 'widgets/dashboard_stats_section.dart';
import '../../auth/providers/auth_provider.dart';
import '../../contacts/providers/contacts_provider.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/widgets/scanned_card_review_dialog.dart';
import '../../../core/localization/app_localizations.dart';
import '../providers/dashboard_provider.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _scannerSectionKey = GlobalKey();
  final GlobalKey _scannerCardKey = TourTargetKeys.dashboardScanner;
  final GlobalKey _eventsKey = GlobalKey();
  final GlobalKey _highlightsKey = GlobalKey();

  String _activeTab = 'Scanner';
  bool _isAutoScrolling = false;
  // ignore: unused_field
  bool _isScanningCard = false;

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final result = await picker.pickImage(source: source);
    if (result == null || !mounted) return;

    setState(() => _isScanningCard = true);
    AppToast.show(context, context.tr('scanningCardAi'), type: ToastType.info);

    try {
      final bytes = await result.readAsBytes();
      final user = ref.read(authProvider).user;
      final cardData = await BusinessCardScannerService.scanCard(
        imageBytes: bytes,
        userId: user?.id ?? 'guest',
        fallbackNameHint: result.name.replaceAll(RegExp(r'\.[^.]+$'), '').replaceAll('_', ' '),
      );

      if (!mounted) return;
      setState(() => _isScanningCard = false);

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
          await ref.read(contactsProvider.notifier).addContact(
                name: name,
                company: company.isNotEmpty ? company : null,
                position: title.isNotEmpty ? title : null,
                email: email.isNotEmpty ? email : null,
                phone: phone.isNotEmpty ? phone : null,
                whereMet: 'Scanned Business Card',
                metAt: DateTime.now().toIso8601String(),
                tags: ['Card Scanner'],
              );

          await ref.read(dashboardProvider.notifier).refresh();
          if (mounted) {
            AppToast.show(context, '${context.tr('contactSaved')} $name', type: ToastType.success);
          }
        },
      );
    } catch (e) {
      if (mounted) {
        setState(() => _isScanningCard = false);
        AppToast.show(context, '${context.tr('failedToScanCard')} $e', type: ToastType.error);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
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

    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) || getY(_highlightsKey) <= screenH * 0.65) {
      newActive = 'Highlights';
    } else if (getY(_eventsKey) <= triggerLine) {
      newActive = 'Events';
    } else {
      newActive = 'Scanner';
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
    
    // Calculate the target offset, adjusting for the top app bar height
    final target = _scrollController.offset + position.dy - Responsive.topPadding(context);
    
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

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? false;
    final dashboardData = ref.watch(dashboardProvider);

    final isWide = Responsive.isWide(context);
    final hPad = Responsive.pagePadding(context);

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
                  if (!Responsive.hasShellTopBar(context)) ...[
                    PopInItem(
                      index: 0,
                      child: Center(
                        child: Text(
                          context.l10n.dashboard,
                          style: AppTypography.headlineMd,
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  if (isGuest) ...[
                    const PopInItem(
                      index: 1,
                      child: TrialBannerCard(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  Container(
                    key: _scannerSectionKey,
                    child: Column(
                      children: [
                        PopInItem(
                          index: isGuest ? 2 : 1,
                          child: SectionHeader(
                            icon: Icons.document_scanner_rounded,
                            label: context.l10n.businessCardScanner,
                            color: context.colors.primary,
                          ),
                        ),
                        const SizedBox(height: 20),

                        PopInItem(
                          index: isGuest ? 3 : 2,
                          child: GlassCard(
                            key: _scannerCardKey,
                            borderRadius: BorderRadius.circular(20),
                            padding: const EdgeInsets.all(28),
                            child: Column(
                              children: [
                                Text(context.l10n.scanBusinessCard, style: AppTypography.headlineSm.copyWith(fontSize: 18)),
                                const SizedBox(height: 6),
                                Text(
                                  context.l10n.scanCardDesc,
                                  textAlign: TextAlign.center,
                                  style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                                ),
                                const SizedBox(height: 20),
                                GradientButton(
                                  label: context.l10n.uploadBusinessCard,
                                  icon: Icons.upload_outlined,
                                  height: 48,
                                  onPressed: () => _pickImage(ImageSource.gallery),
                                ),
                                const SizedBox(height: 10),
                                LiquidGlassButton(
                                  label: context.l10n.captureBusinessCard,
                                  icon: Icons.photo_camera_outlined,
                                  height: 48,
                                  onPressed: () => _pickImage(ImageSource.camera),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        PopInItem(
                          index: 3,
                          child: DashboardStatsSection(
                            data: dashboardData,
                            onContactsTap: () => context.go(AppRoutes.contacts),
                            onEmailsTap: () => context.go(AppRoutes.emails),
                            onEventsTap: () => _scrollTo(_eventsKey),
                            onGrowthTap: () => context.go(AppRoutes.analytics),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

                  PopInItem(
                    index: 4,
                    child: Container(
                      key: _eventsKey,
                      child: Column(
                        children: [
                          SectionHeader(
                            icon: Icons.event_rounded,
                            label: context.l10n.upcomingEvents,
                            color: const Color(0xFF10B981),
                          ),
                          const SizedBox(height: 20),
                          GlassCard(
                            borderRadius: BorderRadius.circular(20),
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(context.tr('eventsSchedule'),
                                              style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                                          Text(context.tr('scheduleAtAGlance'),
                                              style: AppTypography.labelCaps.copyWith(
                                                color: context.colors.onSurfaceVariant,
                                                fontSize: 11,
                                              )),
                                        ],
                                      ),
                                    ),
                                    AnimatedGlassIconButton(
                                      label: context.tr('addEvent'),
                                      icon: Icons.add_rounded,
                                      size: 32,
                                      iconSize: 15,
                                      fontSize: 12,
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      iconColor: context.colors.primary,
                                      onPressed: () => context.go(AppRoutes.events),
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 20),

                                if (dashboardData.upcomingEventsList.isNotEmpty) ...[
                                  ...dashboardData.upcomingEventsList.map((event) {
                                    return Padding(
                                      padding: const EdgeInsets.only(bottom: 12),
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: context.colors.surface.withValues(alpha: 0.35),
                                          borderRadius: BorderRadius.circular(22),
                                          border: Border.all(color: context.colors.glassBorder),
                                        ),
                                        child: Material(
                                          color: Colors.transparent,
                                          child: InkWell(
                                            borderRadius: BorderRadius.circular(22),
                                            onTap: () => context.go(AppRoutes.events),
                                            child: Padding(
                                              padding: const EdgeInsets.all(10),
                                              child: Row(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  // Date Block
                                                  Container(
                                                    width: 52,
                                                    height: 54,
                                                    decoration: BoxDecoration(
                                                      gradient: LinearGradient(
                                                        colors: [
                                                          context.colors.primary.withValues(alpha: 0.2),
                                                          context.colors.primary.withValues(alpha: 0.06),
                                                        ],
                                                        begin: Alignment.topLeft,
                                                        end: Alignment.bottomRight,
                                                      ),
                                                      borderRadius: BorderRadius.circular(12),
                                                      border: Border.all(
                                                        color: context.colors.primary.withValues(alpha: 0.3),
                                                        width: 0.8,
                                                      ),
                                                    ),
                                                    child: Column(
                                                      mainAxisAlignment: MainAxisAlignment.center,
                                                      children: [
                                                        Text(
                                                          event.dayString,
                                                          style: AppTypography.statsNumber.copyWith(
                                                            fontSize: 18,
                                                            color: context.colors.primary,
                                                            height: 1.1,
                                                          ),
                                                        ),
                                                        Text(
                                                          event.localizedMonthString(context),
                                                          style: AppTypography.labelCaps.copyWith(
                                                            fontSize: 10,
                                                            fontWeight: FontWeight.w700,
                                                            color: context.colors.primary.withValues(alpha: 0.8),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                  const SizedBox(width: 14),
                                                  // Event Details
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Row(
                                                          children: [
                                                            Expanded(
                                                              child: Text(
                                                                event.title,
                                                                style: AppTypography.bodyMd.copyWith(
                                                                  fontWeight: FontWeight.w600,
                                                                ),
                                                                maxLines: 1,
                                                                overflow: TextOverflow.ellipsis,
                                                              ),
                                                            ),
                                                            const SizedBox(width: 8),
                                                            Container(
                                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                              decoration: BoxDecoration(
                                                                color: event.badgeColor(context).withValues(alpha: 0.12),
                                                                borderRadius: BorderRadius.circular(8),
                                                                border: Border.all(
                                                                  color: event.badgeColor(context).withValues(alpha: 0.3),
                                                                  width: 0.8,
                                                                ),
                                                              ),
                                                              child: Text(
                                                                event.localizedTimeLabel(context),
                                                                style: AppTypography.labelSm.copyWith(
                                                                  fontSize: 10,
                                                                  color: event.badgeColor(context),
                                                                  fontWeight: FontWeight.w600,
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                        if (event.description != null && event.description!.isNotEmpty) ...[
                                                          const SizedBox(height: 4),
                                                          Text(
                                                            event.description!,
                                                            style: AppTypography.bodySm.copyWith(
                                                              color: context.colors.onSurfaceVariant,
                                                            ),
                                                            maxLines: 1,
                                                            overflow: TextOverflow.ellipsis,
                                                          ),
                                                        ],
                                                        const SizedBox(height: 8),
                                                        Wrap(
                                                          spacing: 12,
                                                          runSpacing: 4,
                                                          children: [
                                                            Row(
                                                              mainAxisSize: MainAxisSize.min,
                                                              children: [
                                                                Icon(Icons.access_time_rounded, size: 13, color: context.colors.onSurfaceVariant),
                                                                const SizedBox(width: 4),
                                                                Text(event.timeFormatted, style: AppTypography.labelCaps.copyWith(fontSize: 11, color: context.colors.onSurfaceVariant)),
                                                              ],
                                                            ),
                                                            if (event.location != null && event.location!.isNotEmpty)
                                                              Row(
                                                                mainAxisSize: MainAxisSize.min,
                                                                children: [
                                                                  Icon(Icons.location_on_outlined, size: 13, color: context.colors.onSurfaceVariant),
                                                                  const SizedBox(width: 4),
                                                                  Text(event.location!, style: AppTypography.labelCaps.copyWith(fontSize: 11, color: context.colors.onSurfaceVariant)),
                                                                ],
                                                              ),
                                                            if (event.contactName != null && event.contactName!.isNotEmpty)
                                                              Row(
                                                                mainAxisSize: MainAxisSize.min,
                                                                children: [
                                                                  Icon(Icons.person_outline_rounded, size: 13, color: context.colors.onSurfaceVariant),
                                                                  const SizedBox(width: 4),
                                                                  Text('${context.tr('withContact')} ${event.contactName}', style: AppTypography.labelCaps.copyWith(fontSize: 11, color: context.colors.onSurfaceVariant)),
                                                                ],
                                                              ),
                                                          ],
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    );
                                  }),
                                  const SizedBox(height: 6),
                                  InkWell(
                                    borderRadius: BorderRadius.circular(10),
                                    onTap: () => context.go(AppRoutes.events),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Text(
                                            context.tr('viewAllEvents'),
                                            style: AppTypography.bodySm.copyWith(
                                              color: context.colors.primary,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                          const SizedBox(width: 4),
                                          Icon(Icons.arrow_forward_rounded, size: 14, color: context.colors.primary),
                                        ],
                                      ),
                                    ),
                                  ),
                                ] else ...[
                                  // Empty state
                                  Icon(Icons.event_busy_outlined, color: context.colors.onSurfaceVariant, size: 40),
                                  const SizedBox(height: 12),
                                  Text(context.tr('noUpcomingEvents'), style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w500)),
                                  const SizedBox(height: 4),
                                  Text(
                                    context.tr('startOrganizingSchedule'),
                                    textAlign: TextAlign.center,
                                    style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                                  ),
                                  const SizedBox(height: 16),
                                  GradientButton(
                                    label: context.tr('createYourFirstEvent'),
                                    icon: Icons.add_rounded,
                                    height: 44,
                                    onPressed: () => context.go(AppRoutes.events),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

                  // â”€â”€ Highlights & Summary â”€â”€
                  PopInItem(
                    index: 5,
                    child: Container(
                      key: _highlightsKey,
                      child: Column(
                        children: [
                          SectionHeader(
                            icon: Icons.auto_awesome_rounded,
                            label: context.tr('highlightsAndSummary'),
                            color: const Color(0xFF8B5CF6),
                          ),
                          const SizedBox(height: 20),

                          // Email highlights card
                          _HighlightCard(
                            icon: Icons.auto_awesome_outlined,
                            title: context.tr('emailCalendarHighlights'),
                            onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
                            content: dashboardData.emailHighlights.hasData
                                ? Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      if (dashboardData.emailHighlights.isEmailConnected) ...[
                                        Padding(
                                          padding: const EdgeInsets.only(bottom: 12),
                                          child: Row(
                                            children: [
                                              Container(
                                                width: 7,
                                                height: 7,
                                                decoration: const BoxDecoration(
                                                  color: Color(0xFF00C853),
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                dashboardData.emailHighlights.connectedEmailAddress != null
                                                    ? '${context.tr('syncedWith')} ${dashboardData.emailHighlights.connectedEmailAddress}'
                                                    : context.tr('emailSynced'),
                                                style: AppTypography.labelSm.copyWith(
                                                  color: const Color(0xFF00C853),
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                      ...dashboardData.emailHighlights.sections.map((section) {
                                        return Container(
                                          margin: const EdgeInsets.only(bottom: 10),
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: context.colors.surface.withValues(alpha: 0.3),
                                            borderRadius: BorderRadius.circular(12),
                                            border: Border.all(color: context.colors.glassBorder),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: context.colors.primary.withValues(alpha: 0.12),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                                child: Text(
                                                  _formatSectionTitle(context, section.title),
                                                  style: AppTypography.labelSm.copyWith(
                                                    color: context.colors.primary,
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 11,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(height: 8),
                                              ...section.items.map((item) => Padding(
                                                padding: const EdgeInsets.only(bottom: 5),
                                                child: Row(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      '• ',
                                                      style: TextStyle(
                                                        color: context.colors.primary,
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 13,
                                                      ),
                                                    ),
                                                    Expanded(
                                                      child: Text(
                                                        item,
                                                        style: AppTypography.bodySm.copyWith(
                                                          color: context.colors.onSurfaceVariant,
                                                          fontSize: 12,
                                                          height: 1.4,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              )),
                                            ],
                                          ),
                                        );
                                      }),
                                    ],
                                  )
                                : Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        if (dashboardData.emailHighlights.connectedEmailAddress != null) ...[
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Container(
                                                width: 7,
                                                height: 7,
                                                decoration: const BoxDecoration(
                                                  color: Color(0xFF00C853),
                                                  shape: BoxShape.circle,
                                                ),
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                '${context.tr('syncedWith')} ${dashboardData.emailHighlights.connectedEmailAddress}',
                                                style: AppTypography.labelSm.copyWith(
                                                  color: const Color(0xFF00C853),
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                        ],
                                        Text(
                                          context.tr('noHighlightsYet'),
                                          textAlign: TextAlign.center,
                                          style: AppTypography.bodySm.copyWith(
                                            color: context.colors.onSurfaceVariant.withValues(alpha: 0.75),
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                          ),
                          const SizedBox(height: 12),

                          _HighlightCard(
                            icon: Icons.hub_outlined,
                            title: context.tr('networkingEventsSummary'),
                            onRefresh: () => ref.read(dashboardProvider.notifier).refresh(),
                            content: dashboardData.networkingSummary.totalEvents > 0
                                ? Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // 4 Mini stat chips with responsive layout
                                      LayoutBuilder(builder: (context, constraints) {
                                        if (constraints.maxWidth < 420) {
                                          return Column(
                                            children: [
                                              Row(
                                                children: [
                                                  _MiniStatChip(
                                                    label: context.tr('total'),
                                                    value: '${dashboardData.networkingSummary.totalEvents}',
                                                    color: context.colors.primary,
                                                    icon: Icons.trending_up,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  _MiniStatChip(
                                                    label: context.tr('emails'),
                                                    value: '${dashboardData.networkingSummary.emailsCount}',
                                                    color: context.colors.primary,
                                                    icon: Icons.mail_outline_rounded,
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 8),
                                              Row(
                                                children: [
                                                  _MiniStatChip(
                                                    label: context.tr('meetings'),
                                                    value: '${dashboardData.networkingSummary.meetingsCount}',
                                                    color: context.colors.secondary,
                                                    icon: Icons.groups_outlined,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  _MiniStatChip(
                                                    label: context.tr('connects'),
                                                    value: '${dashboardData.networkingSummary.connectionsCount}',
                                                    color: context.colors.warningAmber,
                                                    icon: Icons.handshake_outlined,
                                                  ),
                                                ],
                                              ),
                                            ],
                                          );
                                        }

                                        return Row(
                                          children: [
                                            _MiniStatChip(
                                              label: context.tr('total'),
                                              value: '${dashboardData.networkingSummary.totalEvents}',
                                              color: context.colors.primary,
                                              icon: Icons.trending_up,
                                            ),
                                            const SizedBox(width: 8),
                                            _MiniStatChip(
                                              label: context.tr('emails'),
                                              value: '${dashboardData.networkingSummary.emailsCount}',
                                              color: context.colors.primary,
                                              icon: Icons.mail_outline_rounded,
                                            ),
                                            const SizedBox(width: 8),
                                            _MiniStatChip(
                                              label: context.tr('meetings'),
                                              value: '${dashboardData.networkingSummary.meetingsCount}',
                                              color: context.colors.secondary,
                                              icon: Icons.groups_outlined,
                                            ),
                                            const SizedBox(width: 8),
                                            _MiniStatChip(
                                              label: context.tr('connects'),
                                              value: '${dashboardData.networkingSummary.connectionsCount}',
                                              color: context.colors.warningAmber,
                                              icon: Icons.handshake_outlined,
                                            ),
                                          ],
                                        );
                                      }),
                                      if (dashboardData.networkingSummary.recentEvents.isNotEmpty) ...[
                                        const SizedBox(height: 16),
                                        Text(
                                          context.tr('recentActivity'),
                                          style: AppTypography.labelCaps.copyWith(
                                            color: context.colors.onSurfaceVariant,
                                            fontSize: 11,
                                          ),
                                        ),
                                        const SizedBox(height: 8),
                                        ...dashboardData.networkingSummary.recentEvents.map((e) {
                                          return Padding(
                                            padding: const EdgeInsets.only(bottom: 8),
                                            child: Container(
                                              padding: const EdgeInsets.all(10),
                                              decoration: BoxDecoration(
                                                color: context.colors.surface.withValues(alpha: 0.3),
                                                borderRadius: BorderRadius.circular(12),
                                                border: Border.all(color: context.colors.glassBorder),
                                              ),
                                              child: Row(
                                                children: [
                                                  Expanded(
                                                    child: Column(
                                                      crossAxisAlignment: CrossAxisAlignment.start,
                                                      children: [
                                                        Row(
                                                          children: [
                                                            Text(
                                                              e.localizedLabel(context),
                                                              style: AppTypography.labelSm.copyWith(
                                                                color: e.color(context),
                                                                fontSize: 11,
                                                                fontWeight: FontWeight.w600,
                                                              ),
                                                            ),
                                                            if (e.contactName != null) ...[
                                                              const SizedBox(width: 6),
                                                              Expanded(
                                                                child: Text(
                                                                  '• ${e.contactName}',
                                                                  style: AppTypography.bodySm.copyWith(
                                                                    fontWeight: FontWeight.w500,
                                                                    fontSize: 12,
                                                                  ),
                                                                  maxLines: 1,
                                                                  overflow: TextOverflow.ellipsis,
                                                                ),
                                                              ),
                                                            ],
                                                          ],
                                                        ),
                                                        if (e.description != null && e.description!.isNotEmpty) ...[
                                                          const SizedBox(height: 2),
                                                          Text(
                                                            e.description!,
                                                            style: AppTypography.bodySm.copyWith(
                                                              color: context.colors.onSurfaceVariant,
                                                              fontSize: 11,
                                                            ),
                                                            maxLines: 1,
                                                            overflow: TextOverflow.ellipsis,
                                                          ),
                                                        ],
                                                      ],
                                                    ),
                                                  ),
                                                  const SizedBox(width: 8),
                                                  Text(
                                                    e.localizedRelativeTime(context),
                                                    style: AppTypography.labelCaps.copyWith(
                                                      color: context.colors.onSurfaceVariant,
                                                      fontSize: 10,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          );
                                        }),
                                      ],
                                      const SizedBox(height: 8),
                                      InkWell(
                                        borderRadius: BorderRadius.circular(8),
                                        onTap: () => context.go(AppRoutes.analytics),
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(vertical: 6),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                context.tr('viewDetailedAnalytics'),
                                                style: AppTypography.bodySm.copyWith(
                                                  color: context.colors.primary,
                                                  fontWeight: FontWeight.w500,
                                                  fontSize: 12,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              Icon(Icons.arrow_forward_rounded, size: 14, color: context.colors.primary),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  )
                                : Center(
                                    child: Text(
                                      context.tr('noEventsSummaryYet'),
                                      textAlign: TextAlign.center,
                                      style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // â”€â”€ Bottom Floating Liquid Glass Navbar â€” Apple Theme â”€â”€
        FloatingLiquidGlassNavBar(
          activeTabLabel: _activeTab == 'Scanner'
              ? context.tr('scannerTab')
              : (_activeTab == 'Events'
                  ? context.tr('eventsTab')
                  : context.tr('highlightsTab')),
          items: [
            FloatingNavItem(
              label: context.tr('scannerTab'),
              icon: Icons.document_scanner_outlined,
              activeIcon: Icons.document_scanner_rounded,
              onTap: () => _scrollTo(_scannerSectionKey, 'Scanner'),
            ),
            FloatingNavItem(
              label: context.tr('eventsTab'),
              icon: Icons.calendar_today_outlined,
              activeIcon: Icons.calendar_today_rounded,
              onTap: () => _scrollTo(_eventsKey, 'Events'),
            ),
            FloatingNavItem(
              label: context.tr('highlightsTab'),
              icon: Icons.auto_awesome_outlined,
              activeIcon: Icons.auto_awesome_rounded,
              onTap: () => _scrollTo(_highlightsKey, 'Highlights'),
            ),
          ],
        ),
      ],
    );
  }
}

class _HighlightCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final Widget content;
  final VoidCallback? onRefresh;

  const _HighlightCard({
    required this.icon,
    required this.title,
    required this.content,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(22),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.bodyMd.copyWith(
                    color: context.colors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (onRefresh != null)
                IconButton(
                  onPressed: onRefresh,
                  icon: Icon(Icons.sync_rounded, color: context.colors.onSurfaceVariant, size: 18),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  splashRadius: 16,
                  tooltip: context.tr('refresh'),
                )
              else
                Icon(Icons.sync_rounded, color: context.colors.onSurfaceVariant, size: 18),
            ],
          ),
          Divider(height: 16, color: context.colors.glassBorder),
          content,
        ],
      ),
    );
  }
}


String _formatSectionTitle(BuildContext context, String title) {
  final lower = title.toLowerCase();
  if (lower.contains('key updates')) return context.tr('keyUpdates');
  if (lower.contains('action items')) return context.tr('actionItems');
  if (lower.contains('date')) return context.tr('dates');
  return title;
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
