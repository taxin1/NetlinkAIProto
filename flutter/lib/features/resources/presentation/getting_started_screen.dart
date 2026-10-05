import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/sub_page_top_bar.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/localization/app_localizations.dart';




class GettingStartedScreen extends StatefulWidget {
  const GettingStartedScreen({super.key});

  @override
  State<GettingStartedScreen> createState() => _GettingStartedScreenState();
}

class _GettingStartedScreenState extends State<GettingStartedScreen> {
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _guideKey = GlobalKey();
  final GlobalKey _featuresKey = GlobalKey();
  final GlobalKey _nextStepsKey = GlobalKey();

  String _activeTab = 'Guide';
  bool _isAutoScrolling = false;

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

    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) || getY(_nextStepsKey) <= screenH * 0.65) {
      newActive = 'Next Steps';
    } else if (getY(_featuresKey) <= triggerLine) {
      newActive = 'Features';
    } else {
      newActive = 'Guide';
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
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // ── Ambient glows ────────────────────────────────────────────────
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Color(0x260055FF), // blue/15%
                    Color(0x000B0E14),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -80,
            left: -120,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Color(0x1FB655FF), // purple/12%
                    Color(0x000B0E14),
                  ],
                ),
              ),
            ),
          ),

          // ── Scrollable content ──────────────────────────────────────────
          SingleChildScrollView(
            controller: _scrollController,
            padding: EdgeInsets.only(
              top: kToolbarHeight + MediaQuery.of(context).padding.top + 20,
              left: Responsive.pagePadding(context),
              right: Responsive.pagePadding(context),
              bottom: 72 + MediaQuery.of(context).padding.bottom + 32,
            ),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),

                // ── Title Section ────────────────────────────────────────
                Center(
                  child: Text(
                    context.tr('welcomeToNetworkLink'),
                    style: AppTypography.displayLgMobile.copyWith(height: 1.1),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 32),

                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

                  // ── Quick Start Guide ────────────────────────────────────
                  SectionHeader(
                    key: _guideKey,
                    icon: Icons.bolt_rounded,
                    label: context.tr('quickStartGuide'),
                    color: context.colors.primary,
                  ),
                  const SizedBox(height: 20),

                  LayoutBuilder(builder: (context, constraints) {
                    final is2Col = constraints.maxWidth >= 520;
                    final stepCards = [
                      _buildStepCard(
                        number: '01',
                        title: context.tr('step01Title'),
                        description: context.tr('step01Desc'),
                        icon: Icons.people_outline,
                        color: Colors.blue,
                      ),
                      _buildStepCard(
                        number: '02',
                        title: context.tr('step02Title'),
                        description: context.tr('step02Desc'),
                        icon: Icons.badge_outlined,
                        color: Colors.pinkAccent,
                      ),
                      _buildStepCard(
                        number: '03',
                        title: context.tr('step03Title'),
                        description: context.tr('step03Desc'),
                        icon: Icons.document_scanner_outlined,
                        color: Colors.green,
                      ),
                      _buildStepCard(
                        number: '04',
                        title: context.tr('step04Title'),
                        description: context.tr('step04Desc'),
                        icon: Icons.calendar_today_outlined,
                        color: Colors.orange,
                      ),
                      _buildStepCard(
                        number: '05',
                        title: context.tr('step05Title'),
                        description: context.tr('step05Desc'),
                        icon: Icons.mail_outline,
                        color: Colors.deepPurpleAccent,
                      ),
                      _buildStepCard(
                        number: '06',
                        title: context.tr('step06Title'),
                        description: context.tr('step06Desc'),
                        icon: Icons.bar_chart,
                        color: Colors.teal,
                      ),
                    ];

                    return _buildPairGrid(stepCards, is2Col);
                  }),
                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

                  // ── Key Features ─────────────────────────────────────────
                  Container(
                    key: _featuresKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          icon: Icons.stars_rounded,
                          label: context.tr('keyFeaturesHeader'),
                          color: const Color(0xFF8B5CF6),
                        ),
                        const SizedBox(height: 20),
                        LayoutBuilder(builder: (context, constraints) {
                          final is2Col = constraints.maxWidth >= 520;
                          final featureCards = [
                            _buildFeatureCard(
                              title: context.tr('featCardScannerTitle'),
                              description: context.tr('featCardScannerDesc'),
                              icon: Icons.document_scanner,
                            ),
                            _buildFeatureCard(
                              title: context.tr('featEmailGenTitle'),
                              description: context.tr('featEmailGenDesc'),
                              icon: Icons.mail,
                            ),
                            _buildFeatureCard(
                              title: context.tr('featCalendarTitle'),
                              description: context.tr('featCalendarDesc'),
                              icon: Icons.calendar_month,
                            ),
                            _buildFeatureCard(
                              title: context.tr('featPortfolioTitle'),
                              description: context.tr('featPortfolioDesc'),
                              icon: Icons.work_outline,
                            ),
                            _buildFeatureCard(
                              title: context.tr('featDirectoryTitle'),
                              description: context.tr('featDirectoryDesc'),
                              icon: Icons.public,
                            ),
                            _buildFeatureCard(
                              title: context.tr('featAnalyticsTitle'),
                              description: context.tr('featAnalyticsDesc'),
                              icon: Icons.insights,
                            ),
                          ];

                          return _buildPairGrid(featureCards, is2Col);
                        }),
                      ],
                    ),
                  ),
                  const SectionDivider(margin: EdgeInsets.symmetric(vertical: 36)),

                  // ── Next Steps ───────────────────────────────────────────
                  SectionHeader(
                    key: _nextStepsKey,
                    icon: Icons.arrow_forward_rounded,
                    label: context.tr('nextStepsHeader'),
                    color: const Color(0xFF10B981),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: context.colors.surfaceCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: context.colors.glassBorder),
                        boxShadow: [
                          BoxShadow(
                            color: context.colors.onSurface.withValues(alpha: 0.04),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),
                          Text(
                            context.tr('nextStepsDesc'),
                            style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                          ),
                          const SizedBox(height: 24),
                          _buildNextStepTile(
                            title: context.tr('setupGuideTileTitle'),
                            subtitle: context.tr('setupGuideTileSubtitle'),
                            icon: Icons.settings,
                            onTap: () => context.push(AppRoutes.setupGuide),
                          ),
                          const SizedBox(height: 12),
                          _buildNextStepTile(
                            title: context.tr('pricingTileTitle'),
                            subtitle: context.tr('pricingTileSubtitle'),
                            icon: Icons.payments_outlined,
                            onTap: () => context.push(AppRoutes.pricing),
                          ),
                          const SizedBox(height: 12),
                          _buildNextStepTile(
                            title: context.tr('faqTileTitle'),
                            subtitle: context.tr('faqTileSubtitle'),
                            icon: Icons.help_outline,
                            onTap: () => context.push(AppRoutes.faq),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 48),

                  // ── Footer CTA ───────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: context.colors.surfaceCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.colors.glassBorder),
                      boxShadow: [
                        BoxShadow(
                          color: context.colors.onSurface.withValues(alpha: 0.04),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(context.tr('readyToGetStartedTitle'), style: AppTypography.headlineSm),
                        const SizedBox(height: 16),
                        Text(
                          context.tr('readyToGetStartedSubtitle'),
                          textAlign: TextAlign.center,
                          style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                        ),
                        const SizedBox(height: 24),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            GradientButton(
                              label: context.tr('createFreeAccountBtn'),
                              onPressed: () => context.push(AppRoutes.createAccount),
                              icon: Icons.arrow_forward,
                              height: 48,
                            ),
                            const SizedBox(height: 14),
                            LiquidGlassButton(
                              label: context.tr('viewSetupGuideBtn'),
                              onPressed: () => context.push(AppRoutes.setupGuide),
                              icon: Icons.settings_outlined,
                              height: 48,
                            ),

                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 64),
                ],
              ),
            ),
          ),
          ),

          // ── Bottom Floating Liquid Glass Navbar — Apple Theme ──
          FloatingLiquidGlassNavBar(
            activeTabLabel: _activeTab == 'Guide'
                ? context.tr('navTabGuide')
                : _activeTab == 'Features'
                    ? context.tr('navTabFeatures')
                    : context.tr('navTabNextSteps'),
            items: [
              FloatingNavItem(
                label: context.tr('navTabGuide'),
                icon: Icons.bolt_outlined,
                activeIcon: Icons.bolt,
                onTap: () => _scrollTo(_guideKey, 'Guide'),
              ),
              FloatingNavItem(
                label: context.tr('navTabFeatures'),
                icon: Icons.star_border,
                activeIcon: Icons.star,
                onTap: () => _scrollTo(_featuresKey, 'Features'),
              ),
              FloatingNavItem(
                label: context.tr('navTabNextSteps'),
                icon: Icons.menu_book_outlined,
                activeIcon: Icons.menu_book,
                onTap: () => _scrollTo(_nextStepsKey, 'Next Steps'),
              ),
            ],
          ),

          // ── Fixed Top Bar ───────────────────────────────────────────────

          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SubPageTopBar(
              onBack: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go(AppRoutes.resources);
                }
              },
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildPairGrid(List<Widget> cards, bool is2Col) {
    if (!is2Col) {
      return Column(
        children: cards
            .map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: e))
            .toList(),
      );
    }

    final rows = <Widget>[];
    for (int i = 0; i < cards.length; i += 2) {
      final card1 = cards[i];
      final card2 = (i + 1 < cards.length) ? cards[i + 1] : null;

      rows.add(
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: card1),
              const SizedBox(width: 14),
              if (card2 != null)
                Expanded(child: card2)
              else
                const Spacer(),
            ],
          ),
        ),
      );

      if (i + 2 < cards.length) {
        rows.add(const SizedBox(height: 14));
      }
    }

    return Column(children: rows);
  }

  Widget _buildStepCard({
    required String number,
    required String title,
    required String description,
    required IconData icon,
    required Color color,
  }) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(16),
      glowColor: color.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      color.withValues(alpha: 0.25),
                      color.withValues(alpha: 0.08),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: color.withValues(alpha: 0.3)),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              Text(
                number,
                style: AppTypography.headlineSm.copyWith(
                  color: context.colors.onSurfaceVariant.withValues(alpha: 0.7),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(title, style: AppTypography.headlineSm.copyWith(fontWeight: FontWeight.bold, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 6),
          Text(
            description,
            style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant, height: 1.3, fontSize: 12),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard({
    required String title,
    required String description,
    required IconData icon,
  }) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(16),
      glowColor: context.colors.primary.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  context.colors.primary.withValues(alpha: 0.25),
                  context.colors.primary.withValues(alpha: 0.08),
                ],
              ),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: context.colors.primary.withValues(alpha: 0.3)),
            ),
            child: Icon(icon, color: context.colors.primary, size: 18),
          ),
          const SizedBox(height: 10),
          Text(title, style: AppTypography.headlineSm.copyWith(fontWeight: FontWeight.bold, fontSize: 15), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 6),
          Text(
            description,
            style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant, height: 1.3, fontSize: 12),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildNextStepTile({
    required String title,
    required String subtitle,
    required IconData icon,
    VoidCallback? onTap,
  }) {
    return GlassCard(
      borderRadius: BorderRadius.circular(16),
      padding: EdgeInsets.zero,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          splashColor: context.colors.primary.withValues(alpha: 0.15),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: context.colors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: context.colors.primary, size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: AppTypography.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                      Text(subtitle, style: AppTypography.labelSm.copyWith(color: context.colors.onSurfaceVariant)),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_rounded, color: context.colors.primary, size: 18),
              ],
            ),
          ),
        ),
      ),
    );
  }
}




