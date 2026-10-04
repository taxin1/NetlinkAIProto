import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/app_filter_chip.dart';
import '../../../core/widgets/app_toast.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/tour/tour_controller.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/analytics_provider.dart';
import '../services/analytics_service.dart';
import '../../../core/localization/app_localizations.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  final ScrollController _scrollController = ScrollController();

  final GlobalKey _overviewKey = GlobalKey();
  final GlobalKey _funnelKey = GlobalKey();
  final GlobalKey _breakdownKey = GlobalKey();
  final GlobalKey _insightsKey = GlobalKey();

  String _activeTab = 'Overview';
  bool _isAutoScrolling = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  /// Updates the active navbar tab by finding which section is most centred on screen.
  void _onScroll() {
    if (_isAutoScrolling || !mounted || !_scrollController.hasClients) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentPixels = _scrollController.position.pixels;
    if (maxScroll > 0 && currentPixels >= maxScroll - 80) {
      if (_activeTab != 'AI Insights') setState(() => _activeTab = 'AI Insights');
      return;
    }

    final keys = [
      (_overviewKey,  'Overview'),
      (_funnelKey,    'Funnel'),
      (_breakdownKey, 'Events ROI'),
      (_insightsKey,  'AI Insights'),
    ];
    final screenH = MediaQuery.of(context).size.height;
    final mid = screenH / 2;

    String best = _activeTab;
    double bestDist = double.infinity;
    for (final (key, label) in keys) {
      final ctx = key.currentContext;
      if (ctx == null) continue;
      final box = ctx.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) continue;
      final y = box.localToGlobal(Offset.zero).dy;
      final dist = (y - mid).abs();
      if (y <= mid + 80 && dist < bestDist) {
        bestDist = dist;
        best = label;
      }
    }
    if (best != _activeTab) setState(() => _activeTab = best);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollTo(GlobalKey key, String tabLabel) {
    setState(() => _activeTab = tabLabel);
    final context = key.currentContext;
    if (context != null) {
      _isAutoScrolling = true;
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      ).then((_) {
        Future.delayed(const Duration(milliseconds: 150), () {
          if (mounted) _isAutoScrolling = false;
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? true;
    final analyticsState = ref.watch(analyticsProvider);
    final analyticsData = analyticsState.data;

    return Stack(
      children: [
        SingleChildScrollView(
          controller: _scrollController,
          padding: EdgeInsets.only(
            top: Responsive.topPadding(context),
            left: Responsive.pagePadding(context),
            right: Responsive.pagePadding(context),
            bottom: 120,
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
                          context.tr('analyticsAndIntelligence'),
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

                  // ── Timeframe Filter Chips Bar ──
                  PopInItem(
                    index: isGuest ? 2 : 1,
                    child: _buildTimeframeBar(context, analyticsState.timeframe),
                  ),
                  const SizedBox(height: 28),

                  // ── Section 1: Executive KPI Metrics Grid ──
                  _buildSectionHeader(
                    context,
                    icon: Icons.analytics_rounded,
                    label: context.tr('overview'),
                    color: context.colors.primary,
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _overviewKey,
                    index: isGuest ? 3 : 2,
                    child: _buildExecutiveKpiGrid(context, analyticsData, isGuest),
                  ),
                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 28)),

                  // ── Section 2: Activity Breakdown & Engagement Summary (Web App Parity) ──
                  _buildSectionHeader(
                    context,
                    icon: Icons.pie_chart_rounded,
                    label: context.tr('activityAndEngagement'),
                    color: const Color(0xFF06B6D4),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    index: isGuest ? 4 : 3,
                    child: _buildActivityAndEngagementSummary(context, analyticsData, isGuest),
                  ),
                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 28)),

                  // ── Section 3: Network Growth & Outreach Funnel ──
                  _buildSectionHeader(
                    context,
                    icon: Icons.filter_alt_rounded,
                    label: context.tr('funnel'),
                    color: const Color(0xFF8B5CF6),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _funnelKey,
                    index: isGuest ? 5 : 4,
                    child: _buildGrowthAndFunnelSection(context, analyticsData),
                  ),
                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 28)),

                  // ── Section 4: Event ROI & Breakdown ──
                  _buildSectionHeader(
                    context,
                    icon: Icons.leaderboard_rounded,
                    label: context.tr('eventsRoi'),
                    color: const Color(0xFF10B981),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _breakdownKey,
                    index: isGuest ? 6 : 5,
                    child: _buildEventRoiSection(context, analyticsData),
                  ),
                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 28)),

                  // ── Section 5: Strategic AI Insights ──
                  _buildSectionHeader(
                    context,
                    icon: Icons.auto_awesome_rounded,
                    label: context.tr('aiInsights'),
                    color: context.colors.primary,
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _insightsKey,
                    index: isGuest ? 7 : 6,
                    child: _buildStrategicAiInsights(context, analyticsData, isGuest),
                  ),
                ],
              ),
            ),
          ),
        ),

        // ── Floating Liquid Glass Bottom Navigation Bar ──
        FloatingLiquidGlassNavBar(
          activeTabLabel: _activeTab == 'Overview'
              ? context.tr('overview')
              : _activeTab == 'Funnel'
                  ? context.tr('funnel')
                  : _activeTab == 'Events ROI'
                      ? context.tr('eventsRoi')
                      : context.tr('aiInsights'),
          items: [
            FloatingNavItem(
              label: context.tr('overview'),
              icon: Icons.analytics_outlined,
              activeIcon: Icons.analytics_rounded,
              onTap: () => _scrollTo(_overviewKey, 'Overview'),
            ),
            FloatingNavItem(
              label: context.tr('funnel'),
              icon: Icons.filter_alt_outlined,
              activeIcon: Icons.filter_alt_rounded,
              onTap: () => _scrollTo(_funnelKey, 'Funnel'),
            ),
            FloatingNavItem(
              label: context.tr('eventsRoi'),
              icon: Icons.leaderboard_outlined,
              activeIcon: Icons.leaderboard_rounded,
              onTap: () => _scrollTo(_breakdownKey, 'Events ROI'),
            ),
            FloatingNavItem(
              label: context.tr('aiInsights'),
              icon: Icons.auto_awesome_rounded,
              activeIcon: Icons.auto_awesome,
              onTap: () => _scrollTo(_insightsKey, 'AI Insights'),
            ),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMEFRAME SELECTOR BAR
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildTimeframeBar(BuildContext context, String currentPeriod) {
    return GlassCard(
      borderRadius: BorderRadius.circular(18),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, size: 16, color: context.colors.primary),
              const SizedBox(width: 8),
              Text(
                context.tr('reportingPeriod'),
                style: AppTypography.bodySm.copyWith(
                  fontWeight: FontWeight.bold,
                  color: context.colors.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              AppFilterChip(
                label: context.tr('period7d'),
                selected: currentPeriod == '7d',
                onSelected: (_) => ref.read(analyticsProvider.notifier).setTimeframe('7d'),
              ),
              AppFilterChip(
                label: context.tr('period30d'),
                selected: currentPeriod == '30d',
                onSelected: (_) => ref.read(analyticsProvider.notifier).setTimeframe('30d'),
              ),
              AppFilterChip(
                label: context.tr('period90d'),
                selected: currentPeriod == '90d',
                onSelected: (_) => ref.read(analyticsProvider.notifier).setTimeframe('90d'),
              ),
              AppFilterChip(
                label: context.tr('periodAll'),
                selected: currentPeriod == 'all',
                onSelected: (_) => ref.read(analyticsProvider.notifier).setTimeframe('all'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: EXECUTIVE KPI GRID
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildExecutiveKpiGrid(BuildContext context, AnalyticsData data, bool isGuest) {
    final impressions = data.totalImpressions;
    final connections = data.activeConnections;
    final responseRate = data.emailsSent > 0
        ? '${((data.meetingsScheduled / data.emailsSent) * 100).clamp(0, 100).toStringAsFixed(1)}%'
        : (isGuest ? '46.8%' : '0.0%');
    final meetings = data.meetingsScheduled;

    final impressionsGrowth = data.impressionsGrowth;
    final connectionsGrowth = data.connectionsGrowth;
    final responseGrowth = data.responseGrowth;
    final meetingsGrowth = data.meetingsGrowth;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth > 750;
        final cardWidth = isDesktop ? (constraints.maxWidth - 42) / 4 : (constraints.maxWidth - 14) / 2;

        return Wrap(
          spacing: 14,
          runSpacing: 14,
          children: [
            _buildKpiCard(
              context,
              width: cardWidth,
              title: context.tr('profileImpressions'),
              value: '$impressions',
              growth: impressionsGrowth,
              icon: Icons.visibility_outlined,
            ),
            _buildKpiCard(
              context,
              width: cardWidth,
              title: context.tr('activeConnections'),
              value: '$connections',
              growth: connectionsGrowth,
              icon: Icons.hub_rounded,
            ),
            _buildKpiCard(
              context,
              width: cardWidth,
              title: context.tr('coldOutreachResponse'),
              value: responseRate,
              growth: responseGrowth,
              icon: Icons.mark_email_read_outlined,
            ),
            _buildKpiCard(
              context,
              width: cardWidth,
              title: context.tr('meetingsScheduled'),
              value: '$meetings',
              growth: meetingsGrowth,
              icon: Icons.calendar_month_rounded,
            ),
          ],
        );
      },
    );
  }

  Widget _buildKpiCard(
    BuildContext context, {
    required double width,
    required String title,
    required String value,
    required String? growth,
    required IconData icon,
  }) {
    final hasPill = growth != null && growth.trim().isNotEmpty;
    final isUp = growth?.startsWith('+') ?? false;
    final isDown = growth?.startsWith('-') ?? false;

    return SizedBox(
      width: width,
      child: GlassCard(
        tintColor: null, // Neutral glass: no colored gradient tint
        glowColor: null,
        borderRadius: BorderRadius.circular(18),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: context.colors.glassBorder, width: 0.8),
                  ),
                  child: Icon(icon, color: context.colors.onSurfaceVariant, size: 18),
                ),
                if (hasPill)
                  Flexible(
                    child: Container(
                      margin: const EdgeInsets.only(left: 6),
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: context.colors.glassBorder,
                          width: 0.8,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isUp) ...[
                            Icon(
                              Icons.arrow_upward_rounded,
                              size: 10,
                              color: context.colors.onSurfaceVariant,
                            ),
                            const SizedBox(width: 2.5),
                          ] else if (isDown) ...[
                            Icon(
                              Icons.arrow_downward_rounded,
                              size: 10,
                              color: context.colors.onSurfaceVariant,
                            ),
                            const SizedBox(width: 2.5),
                          ],
                          Flexible(
                            child: Text(
                              growth,
                              style: AppTypography.labelSm.copyWith(
                                color: context.colors.onSurface,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: AppTypography.headlineMd.copyWith(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: context.colors.onSurface,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant.withValues(alpha: 0.8),
                fontSize: 11.5,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              softWrap: true,
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: ACTIVITY BREAKDOWN & ENGAGEMENT SUMMARY (NEXT.JS PARITY)
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildActivityAndEngagementSummary(BuildContext context, AnalyticsData data, bool isGuest) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth > 800;

        final activityCard = GlassCard(
          borderRadius: BorderRadius.circular(20),
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tr('activityBreakdown'),
                style: AppTypography.headlineSm.copyWith(fontSize: 17),
              ),
              const SizedBox(height: 16),
              if (!isGuest && data.totalInteractions == 0) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      context.tr('noActivityDataYet'),
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                      ),
                    ),
                  ),
                ),
              ] else if (isGuest && data.totalInteractions == 0) ...[
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: Text(
                      context.tr('noActivityDataTrial'),
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                      ),
                    ),
                  ),
                ),
              ] else ...[
                _buildActivityRow(context, context.tr('emailsSent'), data.eventCounts['email_sent'] ?? data.emailsSent, data.totalInteractions, context.colors.primary),
                const SizedBox(height: 10),
                _buildActivityRow(context, context.tr('newConnections'), data.eventCounts['connection'] ?? data.activeConnections, data.totalInteractions, const Color(0xFF10B981)),
                const SizedBox(height: 10),
                _buildActivityRow(context, context.tr('meetings'), data.eventCounts['meeting'] ?? data.meetingsScheduled, data.totalInteractions, const Color(0xFFF59E0B)),
                const SizedBox(height: 10),
                _buildActivityRow(context, context.tr('calls'), data.eventCounts['call'] ?? 0, data.totalInteractions, const Color(0xFF8B5CF6)),
                const SizedBox(height: 10),
                _buildActivityRow(context, context.tr('notes'), data.eventCounts['note'] ?? 0, data.totalInteractions, const Color(0xFF06B6D4)),
              ],
            ],
          ),
        );

        final summaryCard = GlassCard(
          borderRadius: BorderRadius.circular(20),
          padding: const EdgeInsets.all(22),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tr('engagementSummary'),
                style: AppTypography.headlineSm.copyWith(fontSize: 17),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.colors.surface.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: context.colors.glassBorder),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        context.tr('totalInteractions'),
                        style: AppTypography.bodySm.copyWith(
                          fontWeight: FontWeight.w600,
                          color: context.colors.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${data.totalInteractions}',
                      style: AppTypography.headlineSm.copyWith(
                        fontWeight: FontWeight.bold,
                        color: context.colors.primary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.colors.surface.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: context.colors.glassBorder),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Text(
                        context.tr('mostActiveType'),
                        style: AppTypography.bodySm.copyWith(
                          fontWeight: FontWeight.w600,
                          color: context.colors.onSurface,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      data.mostActiveType,
                      style: AppTypography.bodySm.copyWith(
                        fontWeight: FontWeight.bold,
                        color: context.colors.onSurface,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );

        if (isDesktop) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: activityCard),
              const SizedBox(width: 20),
              Expanded(child: summaryCard),
            ],
          );
        }

        return Column(
          children: [
            activityCard,
            const SizedBox(height: 20),
            summaryCard,
          ],
        );
      },
    );
  }

  Widget _buildActivityRow(BuildContext context, String label, int count, int total, Color color) {
    final pct = total > 0 ? ((count / total) * 100).clamp(0.0, 100.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                style: AppTypography.bodySm.copyWith(fontWeight: FontWeight.w500),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Text('$count (${pct.toStringAsFixed(0)}%)', style: AppTypography.labelSm.copyWith(color: context.colors.onSurfaceVariant)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: total > 0 ? (count / total).clamp(0.0, 1.0) : 0.0,
            minHeight: 6,
            backgroundColor: context.colors.surface.withValues(alpha: 0.4),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: GROWTH CHART & OUTREACH FUNNEL
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildGrowthAndFunnelSection(BuildContext context, AnalyticsData data) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isDesktop = constraints.maxWidth > 800;

        if (isDesktop) {
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(flex: 6, child: _buildWeeklyActivityChart(context, data)),
              const SizedBox(width: 24),
              Expanded(flex: 5, child: _buildOutreachFunnel(context, data)),
            ],
          );
        }

        return Column(
          children: [
            _buildWeeklyActivityChart(context, data),
            const SizedBox(height: 24),
            _buildOutreachFunnel(context, data),
          ],
        );
      },
    );
  }

  Widget _buildWeeklyActivityChart(BuildContext context, AnalyticsData data) {
    final bars = data.weeklyVelocity;
    final totalActions = bars.fold<int>(0, (sum, b) => sum + b.count);

    return GlassCard(
      key: TourTargetKeys.analyticsFeature,
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  context.tr('weeklyInteractionVelocity'),
                  style: AppTypography.headlineSm.copyWith(fontSize: 17),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '$totalActions ${context.tr('actions')}',
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            context.tr('weeklyVelocityDesc'),
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 24),

          // Visual Bar Graph
          SizedBox(
            height: 160,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: bars.map((b) {
                final ratio = b.heightRatio;
                final isPeak = ratio >= 0.85 && b.count > 0;

                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      '${b.count}',
                      style: AppTypography.labelSm.copyWith(
                        fontSize: 10,
                        color: isPeak ? context.colors.primary : context.colors.onSurfaceVariant,
                        fontWeight: isPeak ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      width: 28,
                      height: (110 * ratio).clamp(6.0, 110.0),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            context.colors.primary.withValues(alpha: 0.3),
                            isPeak ? const Color(0xFF8B5CF6) : context.colors.primary,
                          ],
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      b.day,
                      style: AppTypography.labelSm.copyWith(
                        fontSize: 11,
                        color: context.colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOutreachFunnel(BuildContext context, AnalyticsData data) {
    const stageColors = [
      Color(0xFF06B6D4),
      Color(0xFF8B5CF6),
      Color(0xFF10B981),
      Color(0xFFF59E0B),
    ];

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('outreachConversionFunnel'),
            style: AppTypography.headlineSm.copyWith(fontSize: 17),
          ),
          const SizedBox(height: 6),
          Text(
            context.tr('outreachFunnelDesc'),
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 20),

          for (int i = 0; i < data.funnelStages.length; i++) ...[
            if (i > 0) const SizedBox(height: 12),
            _buildFunnelStage(
              context,
              data.funnelStages[i].name,
              data.funnelStages[i].countText,
              data.funnelStages[i].progress,
              stageColors[i % stageColors.length],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFunnelStage(
    BuildContext context,
    String stageName,
    String countText,
    double progress,
    Color accentColor,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                stageName,
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurface,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              countText,
              style: AppTypography.bodySm.copyWith(
                color: accentColor,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 8,
            backgroundColor: context.colors.surface.withValues(alpha: 0.4),
            valueColor: AlwaysStoppedAnimation<Color>(accentColor),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: EVENT ROI & INTERACTION BREAKDOWN
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildEventRoiSection(BuildContext context, AnalyticsData data) {
    final hasEvents = data.eventRois.isNotEmpty;

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('eventNetworkingRoi'),
            style: AppTypography.headlineSm.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 18),

          if (!hasEvents) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
              decoration: BoxDecoration(
                color: context.colors.surface.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: context.colors.glassBorder),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.leaderboard_outlined,
                    size: 40,
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.4),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    context.tr('noEventRecordsYet'),
                    style: AppTypography.bodyMd.copyWith(
                      fontWeight: FontWeight.bold,
                      color: context.colors.onSurface,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    context.tr('noEventRecordsDesc'),
                    style: AppTypography.bodySm.copyWith(
                      color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ] else ...[
            for (final item in data.eventRois) ...[
              _buildEventRoiItem(
                context,
                eventName: item.eventName,
                location: item.location,
                matches: item.matches,
                meetings: item.meetings,
                roiScore: item.roiScore,
                roiColor: Colors.green,
              ),
              const SizedBox(height: 12),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildEventRoiItem(
    BuildContext context, {
    required String eventName,
    required String location,
    required String matches,
    required String meetings,
    required String roiScore,
    required Color roiColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.surface.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.glassBorder),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isNarrow = constraints.maxWidth < 340;

          if (isNarrow) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: roiColor.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.event_available_rounded, color: roiColor, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            eventName,
                            style: AppTypography.bodyMd.copyWith(
                              fontWeight: FontWeight.bold,
                              color: context.colors.onSurface,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            location,
                            style: AppTypography.bodySm.copyWith(
                              color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                              fontSize: 11,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: roiColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: roiColor.withValues(alpha: 0.3)),
                      ),
                      child: Text(
                        roiScore,
                        style: AppTypography.labelSm.copyWith(
                          color: roiColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 10.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '$matches • $meetings',
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                    fontSize: 11,
                  ),
                ),
              ],
            );
          }

          return Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: roiColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.event_available_rounded, color: roiColor, size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      eventName,
                      style: AppTypography.bodyMd.copyWith(
                        fontWeight: FontWeight.bold,
                        color: context.colors.onSurface,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      location,
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                        fontSize: 11,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
                    decoration: BoxDecoration(
                      color: roiColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: roiColor.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      roiScore,
                      style: AppTypography.labelSm.copyWith(
                        color: roiColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$matches • $meetings',
                    style: AppTypography.bodySm.copyWith(
                      color: context.colors.onSurfaceVariant,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: STRATEGIC AI INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildStrategicAiInsights(BuildContext context, AnalyticsData data, bool isGuest) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      glowColor: null,
      tintColor: null,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            context.tr('strategicAiRecommendations'),
            style: AppTypography.headlineSm.copyWith(fontSize: 18),
          ),
          const SizedBox(height: 18),

          if (!isGuest && !data.hasData) ...[
            _buildInsightCard(
              context,
              tag: context.tr('tagQuickStart'),
              text: context.tr('insightQuickStartText'),
            ),
            const SizedBox(height: 12),
          ] else ...[
            _buildInsightCard(
              context,
              tag: context.tr('tagHighSynergy'),
              text: context.tr('insightHighSynergyText'),
            ),
            const SizedBox(height: 12),
            _buildInsightCard(
              context,
              tag: context.tr('tagTimeWindow'),
              text: context.tr('insightTimeWindowText'),
            ),
            const SizedBox(height: 12),
            _buildInsightCard(
              context,
              tag: context.tr('tagNetworkDiversity'),
              text: context.tr('insightNetworkDiversityText'),
            ),
          ],
          const SizedBox(height: 24),

          // Export & Share CTA
          Row(
            children: [
              Expanded(
                child: LiquidGlassButton(
                  label: context.tr('exportAnalyticsReport'),
                  icon: Icons.file_download_outlined,
                  height: 46,
                  width: double.infinity,
                  maxWidth: double.infinity,
                  onPressed: () {
                    AppToast.show(context, context.tr('reportExportedToast'), type: ToastType.success);
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: LiquidGlassButton(
                  label: context.tr('shareSummary'),
                  icon: Icons.share_outlined,
                  height: 46,
                  width: double.infinity,
                  maxWidth: double.infinity,
                  onPressed: () {
                    Clipboard.setData(ClipboardData(
                      text:
                          'Netlink AI Analytics Snapshot: ${data.totalImpressions} ${context.tr('profileImpressions')} • ${data.activeConnections} ${context.tr('activeConnections')} • ${data.meetingsScheduled} ${context.tr('meetingsScheduled')}.',
                    ));
                    AppToast.show(context, context.tr('analyticsSnapshotCopied'));
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Section header row (icon + label + gradient divider) ──────────────────
  Widget _buildSectionHeader(
    BuildContext context, {
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return SectionHeader(
      icon: icon,
      label: label,
      color: color,
    );
  }

  Widget _buildInsightCard(
    BuildContext context, {
    required String tag,
    required String text,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: context.colors.glassBorder, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  tag,
                  style: AppTypography.labelSm.copyWith(
                    color: context.colors.onSurface,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            text,
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurface,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}
