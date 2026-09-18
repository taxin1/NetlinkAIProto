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




class FaqScreen extends StatefulWidget {
  const FaqScreen({super.key});

  @override
  State<FaqScreen> createState() => _FaqScreenState();
}

class _FaqScreenState extends State<FaqScreen> {
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _gettingStartedKey = GlobalKey();
  final GlobalKey _setupKey = GlobalKey();
  final GlobalKey _featuresKey = GlobalKey();
  final GlobalKey _pricingKey = GlobalKey();
  final GlobalKey _troubleshootingKey = GlobalKey();

  String _activeTab = 'Started';
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

    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) || getY(_troubleshootingKey) <= screenH * 0.65) {
      newActive = 'Issues';
    } else if (getY(_pricingKey) <= triggerLine) {
      newActive = 'Pricing';
    } else if (getY(_featuresKey) <= triggerLine) {
      newActive = 'Features';
    } else if (getY(_setupKey) <= triggerLine) {
      newActive = 'Setup';
    } else {
      newActive = 'Started';
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
    final target = _scrollController.offset + position.dy - (kToolbarHeight + MediaQuery.of(context).padding.top + 16);
    
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
          // Ambient backgrounds
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
                    Color(0x260055FF),
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
                    Color(0x1FB655FF),
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
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                const SizedBox(height: 16),

                Text(
                  context.tr('frequentlyAskedQuestions'),
                  style: AppTypography.displayLgMobile.copyWith(height: 1.1),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),


                  // FAQ Categories
                  _FaqCategory(
                    key: _gettingStartedKey,
                    title: context.tr('faqCategoryGettingStarted'),
                    icon: Icons.bolt,
                    iconColor: Colors.blue,
                    faqs: [
                      _FaqItem(
                        question: context.tr('faqQ1'),
                        answer: context.tr('faqA1'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ2'),
                        answer: context.tr('faqA2'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ3'),
                        answer: context.tr('faqA3'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ4'),
                        answer: context.tr('faqA4'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  _FaqCategory(
                    key: _setupKey,
                    title: context.tr('faqCategorySetup'),
                    icon: Icons.settings,
                    iconColor: Colors.purple,
                    faqs: [
                      _FaqItem(
                        question: context.tr('faqQ5'),
                        answer: context.tr('faqA5'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ6'),
                        answer: context.tr('faqA6'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ7'),
                        answer: context.tr('faqA7'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ8'),
                        answer: context.tr('faqA8'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ9'),
                        answer: context.tr('faqA9'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  _FaqCategory(
                    key: _featuresKey,
                    title: context.tr('faqCategoryFeatures'),
                    icon: Icons.description_outlined,
                    iconColor: Colors.blueAccent,
                    faqs: [
                      _FaqItem(
                        question: context.tr('faqQ10'),
                        answer: context.tr('faqA10'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ11'),
                        answer: context.tr('faqA11'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ12'),
                        answer: context.tr('faqA12'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ13'),
                        answer: context.tr('faqA13'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ14'),
                        answer: context.tr('faqA14'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ15'),
                        answer: context.tr('faqA15'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  _FaqCategory(
                    key: _pricingKey,
                    title: context.tr('faqCategoryPricing'),
                    icon: Icons.attach_money,
                    iconColor: Colors.green,
                    faqs: [
                      _FaqItem(
                        question: context.tr('faqQ16'),
                        answer: context.tr('faqA16'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ17'),
                        answer: context.tr('faqA17'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ18'),
                        answer: context.tr('faqA18'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ19'),
                        answer: context.tr('faqA19'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ20'),
                        answer: context.tr('faqA20'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ21'),
                        answer: context.tr('faqA21'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  _FaqCategory(
                    key: _troubleshootingKey,
                    title: context.tr('faqCategoryTroubleshooting'),
                    icon: Icons.help_outline,
                    iconColor: Colors.deepOrange,
                    faqs: [
                      _FaqItem(
                        question: context.tr('faqQ22'),
                        answer: context.tr('faqA22'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ23'),
                        answer: context.tr('faqA23'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ24'),
                        answer: context.tr('faqA24'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ25'),
                        answer: context.tr('faqA25'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ26'),
                        answer: context.tr('faqA26'),
                      ),
                      _FaqItem(
                        question: context.tr('faqQ27'),
                        answer: context.tr('faqA27'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 64),

                  // Footer CTA
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
                        Text(context.tr('stillHaveQuestions'), style: AppTypography.headlineSm),
                        const SizedBox(height: 16),
                        Text(
                          context.tr('stillHaveQuestionsDesc'),
                          textAlign: TextAlign.center,
                          style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                        ),
                        const SizedBox(height: 24),
                        Column(
                          children: [
                            GradientButton(
                              label: context.tr('contactUs'),
                              onPressed: () {},
                              icon: Icons.mail_outline,
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
            activeTabLabel: _activeTab == 'Started'
                ? context.tr('faqNavStarted')
                : _activeTab == 'Setup'
                    ? context.tr('faqNavSetup')
                    : _activeTab == 'Features'
                        ? context.tr('faqNavFeatures')
                        : _activeTab == 'Pricing'
                            ? context.tr('faqNavPricing')
                            : context.tr('faqNavIssues'),
            items: [
              FloatingNavItem(
                label: context.tr('faqNavStarted'),
                icon: Icons.bolt_outlined,
                activeIcon: Icons.bolt,
                onTap: () => _scrollTo(_gettingStartedKey, 'Started'),
              ),
              FloatingNavItem(
                label: context.tr('faqNavSetup'),
                icon: Icons.settings_outlined,
                activeIcon: Icons.settings,
                onTap: () => _scrollTo(_setupKey, 'Setup'),
              ),
              FloatingNavItem(
                label: context.tr('faqNavFeatures'),
                icon: Icons.description_outlined,
                activeIcon: Icons.description,
                onTap: () => _scrollTo(_featuresKey, 'Features'),
              ),
              FloatingNavItem(
                label: context.tr('faqNavPricing'),
                icon: Icons.attach_money_outlined,
                activeIcon: Icons.attach_money,
                onTap: () => _scrollTo(_pricingKey, 'Pricing'),
              ),
              FloatingNavItem(
                label: context.tr('faqNavIssues'),
                icon: Icons.help_outline,
                activeIcon: Icons.help,
                onTap: () => _scrollTo(_troubleshootingKey, 'Issues'),
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
}






class _FaqItem {
  final String question;
  final String answer;

  _FaqItem({required this.question, required this.answer});
}

class _FaqCategory extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final List<_FaqItem> faqs;

  const _FaqCategory({
    super.key,
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.faqs,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: EdgeInsets.zero,
      glowColor: iconColor.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: SectionHeader(
              icon: icon,
              label: title,
              color: iconColor,
            ),
          ),
          Divider(height: 1, color: context.colors.glassBorder),
          ...faqs.map((faq) => _buildAccordion(context, faq)),
        ],
      ),
    );
  }

  Widget _buildAccordion(BuildContext context, _FaqItem faq) {
    return Theme(
      data: Theme.of(context).copyWith(
        dividerColor: Colors.transparent,
      ),
      child: Container(
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(color: context.colors.glassBorder),
          ),
        ),
        child: ExpansionTile(
          textColor: context.colors.primary,
          collapsedTextColor: context.colors.onSurface,
          iconColor: context.colors.primary,
          collapsedIconColor: context.colors.onSurfaceVariant,
          title: Text(
            faq.question,
            style: AppTypography.bodyMd.copyWith(
              fontWeight: FontWeight.w600,
              color: context.colors.onSurface,
            ),
          ),

          childrenPadding: const EdgeInsets.only(left: 16, right: 16, bottom: 24),
          expandedCrossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              faq.answer,
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


