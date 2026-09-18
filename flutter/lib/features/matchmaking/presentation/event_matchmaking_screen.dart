import 'package:flutter/material.dart';
import '../../../core/widgets/app_toast.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/animated_glass_icon_button.dart';
import '../../../core/widgets/app_filter_chip.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/widgets/stat_card.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/router/app_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/matchmaking_models.dart';
import '../providers/matchmaking_provider.dart';
import '../../../core/localization/app_localizations.dart';

class EventMatchmakingScreen extends ConsumerStatefulWidget {
  const EventMatchmakingScreen({super.key});

  @override
  ConsumerState<EventMatchmakingScreen> createState() => _EventMatchmakingScreenState();
}

class _EventMatchmakingScreenState extends ConsumerState<EventMatchmakingScreen> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();

  final GlobalKey _pulseKey = GlobalKey();
  final GlobalKey _matchesKey = GlobalKey();
  final GlobalKey _scheduledKey = GlobalKey();

  String _activeTab = 'Matches';
  bool _isAutoScrolling = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isAutoScrolling || !mounted || !_scrollController.hasClients) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentPixels = _scrollController.position.pixels;

    final scheduledCtx = _scheduledKey.currentContext;
    double? scheduledY;

    if (scheduledCtx != null) {
      final box = scheduledCtx.findRenderObject() as RenderBox?;
      if (box != null && box.hasSize) {
        scheduledY = box.localToGlobal(Offset.zero).dy;
      }
    }

    final screenHeight = MediaQuery.of(context).size.height;

    String targetTab = 'Matches';
    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) ||
        (scheduledY != null && scheduledY <= screenHeight * 0.65)) {
      targetTab = 'Scheduled';
    } else {
      targetTab = 'Matches';
    }

    if (targetTab != _activeTab) {
      setState(() => _activeTab = targetTab);
    }
  }

  void _scrollTo(GlobalKey key, String tabLabel) {
    setState(() => _activeTab = tabLabel);
    _isAutoScrolling = true;
    final context = key.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      ).then((_) {
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted) _isAutoScrolling = false;
        });
      });
    } else {
      _isAutoScrolling = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isGuest = authState.user?.isGuest ?? true;
    final state = ref.watch(matchmakingNotifierProvider);
    final matches = state.filteredProfiles;
    final scheduled = state.scheduledMeetings;

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
                  PopInItem(
                    index: 0,
                    child: Center(
                      child: Text(
                        context.l10n.eventMatchmaking,
                        style: AppTypography.headlineMd,
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Trial Banner (Shows when not signed in) ──
                  if (isGuest) ...[
                    const PopInItem(
                      index: 1,
                      child: TrialBannerCard(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Section 1: Match Pulse & Overview ──
                  SectionHeader(
                    icon: Icons.hub_rounded,
                    label: context.tr('matchPulseTitle'),
                    color: context.colors.primary,
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _pulseKey,
                    index: isGuest ? 2 : 1,
                    child: _buildMatchPulse(context, state),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 2: AI Matches & Filters (Unified Section) ──
                  SectionHeader(
                    icon: Icons.auto_awesome_rounded,
                    label: context.tr('aiMatchesFeed'),
                    color: const Color(0xFF8B5CF6),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _matchesKey,
                    index: isGuest ? 3 : 2,
                    child: _buildMatchesFeed(context, state, matches),
                  ),
                  const SizedBox(height: 36),

                  // ── Section 3: Scheduled Meetups ──
                  SectionHeader(
                    icon: Icons.calendar_today_rounded,
                    label: context.tr('scheduledMeetups'),
                    color: const Color(0xFF10B981),
                  ),
                  const SizedBox(height: 16),
                  PopInItem(
                    key: _scheduledKey,
                    index: isGuest ? 4 : 3,
                    child: _buildScheduledSection(context, scheduled),
                  ),
                ],
              ),
            ),
          ),
        ),

        // ── Floating Liquid Glass Bottom Navigation Bar ──
        FloatingLiquidGlassNavBar(
          activeTabLabel: _activeTab,
          items: [
            FloatingNavItem(
              id: 'Matches',
              label: context.tr('matches'),
              icon: Icons.auto_awesome_outlined,
              activeIcon: Icons.auto_awesome_rounded,
              onTap: () => _scrollTo(_matchesKey, 'Matches'),
            ),
            FloatingNavItem(
              id: 'Scheduled',
              label: context.tr('scheduled'),
              icon: Icons.event_available_outlined,
              activeIcon: Icons.event_available_rounded,
              onTap: () => _scrollTo(_scheduledKey, 'Scheduled'),
            ),
          ],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: MATCH PULSE & KPI OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildMatchPulse(BuildContext context, MatchmakingState state) {
    final highMatchCount = state.profiles.where((p) => p.compatibilityScore >= 90).length;
    final scheduledCount = state.scheduledMeetings.length;
    final maxScore = state.profiles.isEmpty
        ? 0
        : state.profiles.map((p) => p.compatibilityScore).fold<int>(0, (m, s) => s > m ? s : m);
    final topCompatibilityText = maxScore > 0 ? '$maxScore%' : '0%';

    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final cols = width > 500 ? 4 : 2;
              const spacing = 10.0;
              final itemWidth = (width - (cols - 1) * spacing) / cols;
              final targetHeight = cols == 4 ? 112.0 : 108.0;
              final childAspectRatio = itemWidth / targetHeight;

              return GridView.count(
                crossAxisCount: cols,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: spacing,
                crossAxisSpacing: spacing,
                childAspectRatio: childAspectRatio,
                children: [
                  StatCard(
                    label: context.tr('analyzedProfiles'),
                    value: '${state.profiles.length}',
                    icon: Icons.people_alt_outlined,
                    iconColor: context.colors.primary,
                    trendLabel: context.tr('activePool'),
                    trendColor: context.colors.primary,
                    trendIcon: Icons.bolt,
                  ),
                  StatCard(
                    label: context.tr('highSynergy'),
                    value: '$highMatchCount',
                    icon: Icons.auto_awesome,
                    iconColor: const Color(0xFF8B5CF6),
                    trendLabel: context.tr('highPriority'),
                    trendColor: const Color(0xFF8B5CF6),
                    trendIcon: Icons.star_rounded,
                  ),
                  StatCard(
                    label: context.tr('meetingsBooked'),
                    value: '$scheduledCount',
                    icon: Icons.calendar_today_rounded,
                    iconColor: const Color(0xFF10B981),
                    trendLabel: context.tr('scheduled'),
                    trendColor: const Color(0xFF10B981),
                    trendIcon: Icons.check_circle_outline,
                  ),
                  StatCard(
                    label: context.tr('topCompatibility'),
                    value: topCompatibilityText,
                    icon: Icons.verified_outlined,
                    iconColor: const Color(0xFF06B6D4),
                    trendLabel: maxScore >= 90 ? context.tr('optimal') : context.tr('activePool'),
                    trendColor: const Color(0xFF06B6D4),
                    trendIcon: Icons.trending_up,
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: AI MATCHES FEED & FILTERS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildMatchesFeed(
      BuildContext context, MatchmakingState state, List<MatchmakingProfile> matches) {
    const eventsList = [
      'All Events',
      'TechCrunch Disrupt 2026',
      'AI Summit SF 2026',
      'Global Founder Circle',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // ── Search & Event Context Controls ──
        LayoutBuilder(
          builder: (context, constraints) {
            final isNarrow = constraints.maxWidth < 600;
            final dropdown = Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: context.colors.surface.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.colors.glassBorder),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: state.selectedEvent,
                  isExpanded: true,
                  dropdownColor: context.colors.surfaceCard,
                  icon: Icon(Icons.arrow_drop_down_rounded, color: context.colors.primary),
                  items: eventsList.map((evt) {
                    final displayLabel = evt == 'All Events' ? context.tr('allEvents') : evt;
                    return DropdownMenuItem<String>(
                      value: evt,
                      child: Row(
                        children: [
                          Icon(Icons.event_outlined, size: 16, color: context.colors.primary),
                          const SizedBox(width: 10),
                          Flexible(
                            child: Text(
                              displayLabel,
                              style: AppTypography.bodyMd.copyWith(color: context.colors.onSurface),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) {
                      ref.read(matchmakingNotifierProvider.notifier).setEventFilter(val);
                    }
                  },
                ),
              ),
            );

            final searchField = TextField(
              controller: _searchController,
              style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
              decoration: InputDecoration(
                hintText: context.tr('searchAttendeesHint'),
                hintStyle: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                ),
                prefixIcon: Icon(Icons.search_rounded,
                    color: context.colors.onSurfaceVariant, size: 18),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 16),
                        onPressed: () {
                          _searchController.clear();
                          ref.read(matchmakingNotifierProvider.notifier).setSearchQuery('');
                        },
                      )
                    : null,
                filled: true,
                fillColor: context.colors.surface.withValues(alpha: 0.25),
                contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 14),
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
              onChanged: (q) =>
                  ref.read(matchmakingNotifierProvider.notifier).setSearchQuery(q),
            );

            if (isNarrow) {
              return Column(
                children: [
                  dropdown,
                  const SizedBox(height: 10),
                  searchField,
                ],
              );
            } else {
              return Row(
                children: [
                  Expanded(flex: 4, child: dropdown),
                  const SizedBox(width: 12),
                  Expanded(flex: 6, child: searchField),
                ],
              );
            }
          },
        ),
        const SizedBox(height: 12),

        // ── Standardized Filter Chips (AppFilterChip) ──
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            AppFilterChip(
              label: context.tr('allMatches'),
              selected: state.selectedCategory == 'all',
              onSelected: (_) =>
                  ref.read(matchmakingNotifierProvider.notifier).setCategoryFilter('all'),
            ),
            AppFilterChip(
              label: context.tr('highSynergy'),
              selected: state.selectedCategory == 'high_match',
              onSelected: (_) =>
                  ref.read(matchmakingNotifierProvider.notifier).setCategoryFilter('high_match'),
            ),
            AppFilterChip(
              label: context.tr('investors'),
              selected: state.selectedCategory == 'investors',
              onSelected: (_) =>
                  ref.read(matchmakingNotifierProvider.notifier).setCategoryFilter('investors'),
            ),
            AppFilterChip(
              label: context.tr('founders'),
              selected: state.selectedCategory == 'founders',
              onSelected: (_) =>
                  ref.read(matchmakingNotifierProvider.notifier).setCategoryFilter('founders'),
            ),
            AppFilterChip(
              label: context.tr('techLeads'),
              selected: state.selectedCategory == 'tech_leads',
              onSelected: (_) =>
                  ref.read(matchmakingNotifierProvider.notifier).setCategoryFilter('tech_leads'),
            ),
            AppFilterChip(
              label: context.tr('partners'),
              selected: state.selectedCategory == 'partners',
              onSelected: (_) =>
                  ref.read(matchmakingNotifierProvider.notifier).setCategoryFilter('partners'),
            ),
          ],
        ),
        const SizedBox(height: 20),

        if (matches.isEmpty) ...[
          GlassCard(
            borderRadius: BorderRadius.circular(20),
            padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
            child: Center(
              child: Column(
                children: [
                  Icon(
                    Icons.person_search_outlined,
                    size: 48,
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.4),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    state.profiles.isEmpty
                        ? context.tr('noProfilesYet')
                        : context.tr('noProfilesMatchFilter'),
                    style: AppTypography.bodyMd.copyWith(color: context.colors.onSurfaceVariant),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    state.profiles.isEmpty
                        ? context.tr('discoverAiMatchesDesc')
                        : context.tr('clearSearchFiltersDesc'),
                    style: AppTypography.bodySm.copyWith(
                      color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (state.profiles.isEmpty) ...[
                    const SizedBox(height: 20),
                    GradientButton(
                      label: state.isLoading
                          ? context.tr('discoveringMatches')
                          : context.tr('discoverAiMatches'),
                      icon: Icons.auto_awesome,
                      height: 44,
                      width: 220,
                      onPressed: state.isLoading
                          ? null
                          : () => ref.read(matchmakingNotifierProvider.notifier).findMatches(),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ] else ...[
          ...matches.map((profile) => _buildMatchCard(context, profile)),
        ],
      ],
    );
  }

  Widget _buildMatchCard(BuildContext context, MatchmakingProfile profile) {
    final isGuest = ref.watch(authProvider).user?.isGuest ?? true;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: context.colors.surface.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: profile.compatibilityScore >= 95
              ? const Color(0xFF8B5CF6).withValues(alpha: 0.4)
              : context.colors.glassBorder,
          width: profile.compatibilityScore >= 95 ? 1.5 : 1.0,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _showMatchDetailsDialog(context, profile),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── Avatar ──
                  Center(
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            context.colors.primary.withValues(alpha: 0.8),
                            const Color(0xFF8B5CF6).withValues(alpha: 0.8),
                          ],
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: context.colors.primary.withValues(alpha: 0.25),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          profile.avatarInitials,
                          style: AppTypography.bodyMd.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // ── Name, Role/Company, Event & Location ──
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          profile.name,
                          style: AppTypography.headlineSm.copyWith(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${profile.role} • ${profile.company}',
                          style: AppTypography.bodySm.copyWith(
                            color: context.colors.onSurfaceVariant,
                            fontWeight: FontWeight.w500,
                            fontSize: 12,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.event_outlined, size: 12, color: context.colors.primary),
                                const SizedBox(width: 4),
                                Text(
                                  profile.eventTitle,
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.primary,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.location_on_outlined,
                                    size: 12, color: context.colors.onSurfaceVariant),
                                const SizedBox(width: 2),
                                Text(
                                  profile.location,
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),

                  // ── Match Badge, Bookmark & Details Button ──
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                                  context.colors.primary.withValues(alpha: 0.15),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFF8B5CF6).withValues(alpha: 0.5),
                              ),
                            ),
                            child: Text(
                              '${profile.compatibilityScore}% ${context.tr('matchSuffix')}',
                              style: AppTypography.bodySm.copyWith(
                                color: const Color(0xFFA78BFA),
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          IconButton(
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
                            splashRadius: 16,
                            icon: Icon(
                              profile.isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                              size: 19,
                              color: profile.isBookmarked
                                  ? context.colors.primary
                                  : context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                            ),
                            onPressed: () {
                              ref.read(matchmakingNotifierProvider.notifier).toggleBookmark(profile.id);
                              if (isGuest) {
                                AppToast.show(context, context.tr('bookmarkedTrialToast'));
                              }
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      AnimatedGlassIconButton(
                        label: context.tr('details'),
                        icon: Icons.arrow_forward_rounded,
                        size: 28,
                        iconSize: 13,
                        fontSize: 11,
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        iconColor: context.colors.primary,
                        onPressed: () => _showMatchDetailsDialog(context, profile),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showMatchDetailsDialog(BuildContext context, MatchmakingProfile profile) {
    showDialog(
      context: context,
      builder: (dialogCtx) {
        return Consumer(
          builder: (context, ref, _) {
            final currentMatches = ref.watch(matchmakingNotifierProvider).profiles;
            final currentProfile = currentMatches.firstWhere(
              (p) => p.id == profile.id,
              orElse: () => profile,
            );
            final isConfirmed = currentProfile.meetingStatus == 'confirmed';

            return Dialog(
              backgroundColor: Colors.transparent,
              insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 560),
                decoration: BoxDecoration(
                  color: context.colors.surfaceCard,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: context.colors.glassBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.45),
                      blurRadius: 28,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 18, 14, 14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  context.colors.primary.withValues(alpha: 0.8),
                                  const Color(0xFF8B5CF6).withValues(alpha: 0.8),
                                ],
                              ),
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(
                                currentProfile.avatarInitials,
                                style: AppTypography.bodyMd.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        currentProfile.name,
                                        style: AppTypography.headlineSm.copyWith(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            const Color(0xFF8B5CF6).withValues(alpha: 0.25),
                                            context.colors.primary.withValues(alpha: 0.15),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: const Color(0xFF8B5CF6).withValues(alpha: 0.5),
                                        ),
                                      ),
                                      child: Text(
                                        '${currentProfile.compatibilityScore}% ${context.tr('matchSuffix')}',
                                        style: AppTypography.bodySm.copyWith(
                                          color: const Color(0xFFA78BFA),
                                          fontWeight: FontWeight.bold,
                                          fontSize: 11,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${currentProfile.role} • ${currentProfile.company}',
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurfaceVariant,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(Icons.event_outlined, size: 13, color: context.colors.primary),
                                    const SizedBox(width: 4),
                                    Text(
                                      currentProfile.eventTitle,
                                      style: AppTypography.bodySm.copyWith(
                                        color: context.colors.primary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Icon(Icons.location_on_outlined,
                                        size: 13, color: context.colors.onSurfaceVariant),
                                    const SizedBox(width: 2),
                                    Text(
                                      currentProfile.location,
                                      style: AppTypography.bodySm.copyWith(
                                        color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                                        fontSize: 11,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded, size: 20),
                            onPressed: () => Navigator.pop(dialogCtx),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),

                    // Scrollable content
                    Flexible(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 1. Why Matched
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: context.colors.primary.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: context.colors.primary.withValues(alpha: 0.25),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    context.tr('whyAiMatchedHeader'),
                                    style: AppTypography.labelCaps.copyWith(
                                      color: context.colors.primary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.8,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    currentProfile.whyAiMatched,
                                    style: AppTypography.bodySm.copyWith(
                                      color: context.colors.onSurface.withValues(alpha: 0.9),
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),

                            // 2. Seeking Info
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.amber.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.amber.withValues(alpha: 0.22)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.amber.withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          context.tr('seeking'),
                                          style: AppTypography.bodySm.copyWith(
                                            color: Colors.amber,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          currentProfile.seeking,
                                          style: AppTypography.bodySm.copyWith(
                                            color: context.colors.onSurface,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (currentProfile.seekingDetail != null) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      currentProfile.seekingDetail!,
                                      style: AppTypography.bodySm.copyWith(
                                        color: context.colors.onSurfaceVariant,
                                        fontSize: 11.5,
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),

                            // 3. Offering Info
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFF14B8A6).withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFF14B8A6).withValues(alpha: 0.22)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF14B8A6).withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          context.tr('offering'),
                                          style: AppTypography.bodySm.copyWith(
                                            color: const Color(0xFF14B8A6),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          currentProfile.offering,
                                          style: AppTypography.bodySm.copyWith(
                                            color: context.colors.onSurface,
                                            fontWeight: FontWeight.w600,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (currentProfile.offeringDetail != null) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      currentProfile.offeringDetail!,
                                      style: AppTypography.bodySm.copyWith(
                                        color: context.colors.onSurfaceVariant,
                                        fontSize: 11.5,
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),

                            // 4. Synergy / Mutual Interests Tags
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: currentProfile.mutualInterests.map((tag) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: context.colors.surface.withValues(alpha: 0.5),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: context.colors.glassBorder),
                                  ),
                                  child: Text(
                                    '#$tag',
                                    style: AppTypography.bodySm.copyWith(
                                      fontSize: 10,
                                      color: context.colors.onSurfaceVariant,
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 20),

                            // 5. Action Buttons
                            if (isConfirmed)
                              Container(
                                height: 44,
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: context.colors.surface.withValues(alpha: 0.35),
                                  borderRadius: BorderRadius.circular(22),
                                  border: Border.all(
                                    color: context.colors.glassBorder.withValues(alpha: 0.6),
                                  ),
                                ),
                                child: Center(
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        Icons.check_circle_rounded,
                                        size: 18,
                                        color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        context.tr('meetingScheduled'),
                                        style: AppTypography.bodySm.copyWith(
                                          color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                            else
                              GradientButton(
                                label: context.tr('scheduleMeetup'),
                                icon: Icons.calendar_month_rounded,
                                height: 44,
                                maxWidth: double.infinity,
                                onPressed: () {
                                  Navigator.pop(dialogCtx);
                                  _showScheduleDialog(context, currentProfile);
                                },
                              ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                Expanded(
                                  child: LiquidGlassButton(
                                    label: context.tr('aiIcebreaker'),
                                    icon: Icons.auto_awesome_rounded,
                                    height: 44,
                                    maxWidth: double.infinity,
                                    fontSize: 13,
                                    iconSize: 17,
                                    onPressed: () {
                                      Navigator.pop(dialogCtx);
                                      _showIcebreakerModal(context, currentProfile);
                                    },
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: LiquidGlassButton(
                                    label: context.tr('email'),
                                    icon: Icons.mail_outline_rounded,
                                    height: 44,
                                    maxWidth: double.infinity,
                                    fontSize: 13,
                                    iconSize: 17,
                                    onPressed: () {
                                      Navigator.pop(dialogCtx);
                                      context.go(AppRoutes.emails);
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: SCHEDULED MEETUPS
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildScheduledSection(BuildContext context, List<ScheduledMeeting> scheduled) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                context.tr('yourScheduledMeetups'),
                style: AppTypography.headlineSm.copyWith(fontSize: 18),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${scheduled.length} ${context.tr('activeCount')}',
                  style: AppTypography.bodySm.copyWith(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          if (scheduled.isEmpty) ...[
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  context.tr('noMeetingsBookedYet'),
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant.withValues(alpha: 0.6),
                  ),
                ),
              ),
            ),
          ] else ...[
            ...scheduled.map((meet) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: context.colors.surface.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: context.colors.glassBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${context.tr('meetWith')} ${meet.personName}',
                                style: AppTypography.headlineSm.copyWith(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${meet.personRole} • ${meet.personCompany}',
                                style: AppTypography.bodySm.copyWith(
                                  color: context.colors.onSurfaceVariant,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            meet.isConfirmed ? context.tr('confirmed') : context.tr('pending'),
                            style: AppTypography.bodySm.copyWith(
                              color: Colors.green,
                              fontWeight: FontWeight.w600,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (meet.topic.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        meet.topic,
                        style: AppTypography.bodySm.copyWith(
                          color: context.colors.onSurface.withValues(alpha: 0.9),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 16,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.schedule, size: 13, color: context.colors.primary),
                            const SizedBox(width: 5),
                            Text(
                              '${meet.scheduledTime.month}/${meet.scheduledTime.day} @ ${_formatTime(meet.scheduledTime)}',
                              style: AppTypography.bodySm.copyWith(
                                color: context.colors.primary,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.place_outlined,
                                size: 13, color: context.colors.onSurfaceVariant),
                            const SizedBox(width: 5),
                            Text(
                              meet.locationOrLink,
                              style: AppTypography.bodySm.copyWith(
                                color: context.colors.onSurfaceVariant.withValues(alpha: 0.9),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                        if (meet.eventTitle.isNotEmpty)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.event_outlined,
                                  size: 13,
                                  color: context.colors.onSurfaceVariant.withValues(alpha: 0.7)),
                              const SizedBox(width: 5),
                              Text(
                                meet.eventTitle,
                                style: AppTypography.bodySm.copyWith(
                                  color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final hr = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final min = dt.minute.toString().padLeft(2, '0');
    return '$hr:$min $ampm';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODALS & DIALOGS
  // ═══════════════════════════════════════════════════════════════════════════

  void _showScheduleDialog(BuildContext context, MatchmakingProfile profile) {
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
    TimeOfDay selectedTime = const TimeOfDay(hour: 14, minute: 30);
    final locationController =
        TextEditingController(text: '${profile.eventTitle} Lounge - Table 5');
    final topicController =
        TextEditingController(text: 'Partnership & Technology Collaboration');
    final isGuest = ref.read(authProvider).user?.isGuest ?? true;

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: context.colors.surfaceCard,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: context.colors.glassBorder),
              ),
              title: Text(context.tr('scheduleMeetup'), style: AppTypography.headlineSm.copyWith(fontSize: 18)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${context.tr('meetWith')} ${profile.name} (${profile.role} at ${profile.company})',
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Date & Time pickers
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.date_range, size: 16),
                            label: Text(
                              '${selectedDate.month}/${selectedDate.day}/${selectedDate.year}',
                              style: AppTypography.bodySm,
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: context.colors.glassBorder),
                            ),
                            onPressed: () async {
                              final d = await showDatePicker(
                                context: context,
                                initialDate: selectedDate,
                                firstDate: DateTime.now(),
                                lastDate: DateTime.now().add(const Duration(days: 90)),
                              );
                              if (d != null) {
                                setDialogState(() => selectedDate = d);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.access_time, size: 16),
                            label: Text(selectedTime.format(context), style: AppTypography.bodySm),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: context.colors.glassBorder),
                            ),
                            onPressed: () async {
                              final t = await showTimePicker(
                                context: context,
                                initialTime: selectedTime,
                              );
                              if (t != null) {
                                setDialogState(() => selectedTime = t);
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Location
                    TextField(
                      controller: locationController,
                      style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                      decoration: InputDecoration(
                        labelText: context.tr('locationOrLink'),
                        labelStyle: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                        filled: true,
                        fillColor: context.colors.surface.withValues(alpha: 0.25),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Topic
                    TextField(
                      controller: topicController,
                      style: AppTypography.bodySm.copyWith(color: context.colors.onSurface),
                      decoration: InputDecoration(
                        labelText: context.tr('meetingTopic'),
                        labelStyle: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                        filled: true,
                        fillColor: context.colors.surface.withValues(alpha: 0.25),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogCtx),
                  child: Text(context.tr('cancel'),
                      style: TextStyle(color: context.colors.onSurfaceVariant)),
                ),
                GradientButton(
                  label: context.tr('confirmMeetup'),
                  icon: Icons.check_circle_outline,
                  height: 42,
                  maxWidth: 160,
                  onPressed: () {
                    final meetTime = DateTime(
                      selectedDate.year,
                      selectedDate.month,
                      selectedDate.day,
                      selectedTime.hour,
                      selectedTime.minute,
                    );
                    ref.read(matchmakingNotifierProvider.notifier).scheduleMeeting(
                          matchId: profile.id,
                          time: meetTime,
                          location: locationController.text.trim(),
                          topic: topicController.text.trim(),
                        );
                    Navigator.pop(dialogCtx);
                    AppToast.show(
                      context,
                      isGuest
                          ? '${context.tr('meetupConfirmedTrial')} ${profile.name}!'
                          : '${context.tr('meetupConfirmed')} ${profile.name}!',
                      type: ToastType.success,
                    );
                    _scrollTo(_scheduledKey, 'Scheduled');
                  },
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showIcebreakerModal(BuildContext context, MatchmakingProfile profile) {
    final authState = ref.read(authProvider);
    final isGuest = authState.user?.isGuest ?? true;
    final icebreakerText =
        ref.read(matchmakingNotifierProvider.notifier).generateIcebreaker(profile.id);

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          backgroundColor: context.colors.surfaceCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: context.colors.glassBorder),
          ),
          actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          title: Text(
            '${context.tr('aiIcebreakerFor')} ${profile.name}',
            style: AppTypography.headlineSm.copyWith(fontSize: 17),
          ),
          content: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: context.colors.surface.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.colors.glassBorder),
            ),
            child: SelectableText(
              icebreakerText,
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurface,
                height: 1.5,
              ),
            ),
          ),
          actions: [
            Wrap(
              spacing: 12,
              runSpacing: 10,
              alignment: WrapAlignment.end,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                LiquidGlassButton(
                  label: context.tr('copyToClipboard'),
                  icon: Icons.copy_rounded,
                  height: 42,
                  maxWidth: 180,
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: icebreakerText));
                    Navigator.pop(dialogCtx);
                    AppToast.show(
                      context,
                      isGuest
                          ? context.tr('icebreakerCopiedTrialToast')
                          : context.tr('icebreakerCopiedToast'),
                      type: ToastType.success,
                    );
                  },
                ),
                GradientButton(
                  label: context.tr('openInEmails'),
                  icon: Icons.send_rounded,
                  height: 42,
                  maxWidth: 160,
                  onPressed: () {
                    Navigator.pop(dialogCtx);
                    context.go(AppRoutes.emails);
                  },
                ),
              ],
            ),
          ],
        );
      },
    );
  }
}

