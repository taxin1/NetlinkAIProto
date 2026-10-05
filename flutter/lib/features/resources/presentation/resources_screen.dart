import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/widgets/sub_page_top_bar.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/localization/app_localizations.dart';


class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});

  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // ── Ambient glow top-right (blue) ────────────────────────────────
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
          // ── Ambient glow bottom-left (purple) ────────────────────────────
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
            padding: EdgeInsets.only(
              top: kToolbarHeight + MediaQuery.of(context).padding.top + 20,
              left: Responsive.pagePadding(context),
              right: Responsive.pagePadding(context),
              bottom: 32,
            ),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 16),

                Text(
                  context.tr('everythingYouNeedToKnow'),
                  style: AppTypography.displayLgMobile.copyWith(height: 1.1),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),

                Consumer(
                  builder: (context, ref, _) {
                    final authState = ref.watch(authProvider);
                    final isGuest = authState.user?.isGuest ?? true;
                    if (!isGuest) return const SizedBox.shrink();
                    return const Padding(
                      padding: EdgeInsets.only(bottom: 24),
                      child: TrialBannerCard(),
                    );
                  },
                ),

                const SizedBox(height: 8),

                // ── Resource Cards ─────────────────────────────────────────────────
                _ResourceCard(
                  title: context.tr('gettingStarted'),
                  description: context.tr('gettingStartedDesc'),
                  icon: Icons.rocket_launch,
                  color: Colors.blue,
                  buttonText: context.tr('exploreGettingStarted'),
                  features: [
                    context.tr('quickSetupGuide'),
                    context.tr('firstSteps'),
                    context.tr('basicFeaturesOverview'),
                  ],
                  onTap: () => context.push(AppRoutes.gettingStarted),
                ),
                const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),
                _ResourceCard(
                  title: context.tr('setupGuide'),
                  description: context.tr('setupGuideDesc'),
                  icon: Icons.settings,
                  color: Colors.purple,
                  buttonText: context.tr('exploreSetupGuide'),
                  features: [
                    context.tr('profileSetup'),
                    context.tr('connectIntegrations'),
                    context.tr('featureGuides'),
                  ],
                  onTap: () => context.push(AppRoutes.setupGuide),
                ),
                const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),
                _ResourceCard(
                  title: context.tr('pricing'),
                  description: context.tr('pricingDesc'),
                  icon: Icons.attach_money,
                  color: Colors.green,
                  buttonText: context.tr('explorePricing'),
                  features: [
                    context.tr('planComparison'),
                    context.tr('featureBreakdown'),
                    context.tr('billingInformation'),
                  ],
                  onTap: () => context.push(AppRoutes.pricing),
                ),
                const SectionDivider(margin: EdgeInsets.symmetric(vertical: 24)),
                _ResourceCard(
                  title: context.tr('faq'),
                  description: context.tr('faqDesc'),
                  icon: Icons.help_outline,
                  color: Colors.deepOrange,
                  buttonText: context.tr('exploreFaq'),
                  features: [
                    context.tr('commonQuestions'),
                    context.tr('troubleshooting'),
                    context.tr('bestPractices'),
                  ],
                  onTap: () => context.push(AppRoutes.faq),
                ),
                const SizedBox(height: 64),
              ],
            ),
            ),
          ),
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
                  context.go(AppRoutes.landing);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

}

class _ResourceCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final String buttonText;
  final List<String> features;
  final VoidCallback? onTap;

  const _ResourceCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.buttonText,
    required this.features,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(24),
      glowColor: color.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  color.withValues(alpha: 0.25),
                  color.withValues(alpha: 0.08),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color.withValues(alpha: 0.3)),
            ),
            child: Center(
              child: Icon(icon, color: color, size: 22),
            ),
          ),
          const SizedBox(height: 20),
          Text(title,
              style: AppTypography.headlineSm
                  .copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(description,
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant, height: 1.4)),
          const SizedBox(height: 28),
          // Zentra-style feature list container
          Container(
            decoration: BoxDecoration(
              color: context.colors.surfaceContainer.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: context.colors.glassBorder),
            ),
            child: Column(
              children: [
                for (int i = 0; i < features.length; i++) ...[
                  if (i > 0)
                    Divider(
                      height: 1,
                      thickness: 1,
                      color: context.colors.glassBorder.withValues(alpha: 0.5),
                    ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            features[i],
                            style: AppTypography.bodySm.copyWith(
                              fontWeight: FontWeight.w600,
                              color: context.colors.onSurface,
                            ),
                          ),
                        ),
                        Icon(
                          Icons.check_circle_rounded,
                          color: color,
                          size: 18,
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 28),


          GradientButton(
            label: buttonText,
            icon: Icons.arrow_forward_rounded,
            height: 48,
            onPressed: onTap,
          ),
        ],
      ),
    );
  }
}

