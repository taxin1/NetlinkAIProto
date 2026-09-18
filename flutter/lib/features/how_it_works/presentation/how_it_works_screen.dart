import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/sub_page_top_bar.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/localization/app_localizations.dart';

class HowItWorksScreen extends StatelessWidget {
  const HowItWorksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // ── Ambient Background Glows ─────────────────────────────────────
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 340,
              height: 340,
              decoration: const BoxDecoration(
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
            top: 400,
            left: -100,
            child: Container(
              width: 340,
              height: 340,
              decoration: const BoxDecoration(
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

          // ── Main Scrollable Content ──────────────────────────────────────
          SingleChildScrollView(
            padding: EdgeInsets.only(
              // This page always displays a fixed top bar, including on
              // desktop. Reserve its full height so the heading cannot sit
              // underneath the oversized logo.
              top: kToolbarHeight + MediaQuery.of(context).padding.top + 16,
              left: Responsive.pagePadding(context),
              right: Responsive.pagePadding(context),
              bottom: 48,
            ),
            child: Center(
              child: Container(
                constraints:
                    const BoxConstraints(maxWidth: Responsive.maxContentWidth),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    const SizedBox(height: 16),

                    // ── Header Title (No sub-description) ─────────
                    Text(
                      context.tr('howItWorksMainTitle'),
                      style:
                          AppTypography.displayLgMobile.copyWith(height: 1.1),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),

                    // ── Mission & Vision (2-column compact grid) ─────────────────
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isWide = constraints.maxWidth > 520;
                        if (isWide) {
                          return IntrinsicHeight(
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                Expanded(
                                  child: _buildMissionVisionCard(
                                    context,
                                    title: context.tr('missionHeader'),
                                    icon: Icons.flag_rounded,
                                    color: Colors.blue,
                                    subtitle:
                                        context.tr('missionSubtitle'),
                                    description:
                                        context.tr('missionDesc'),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: _buildMissionVisionCard(
                                    context,
                                    title: context.tr('visionHeader'),
                                    icon: Icons.visibility_rounded,
                                    color: Colors.purple,
                                    subtitle:
                                        context.tr('visionSubtitle'),
                                    description:
                                        context.tr('visionDesc'),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }
                        return Column(
                          children: [
                            _buildMissionVisionCard(
                              context,
                              title: context.tr('missionHeader'),
                              icon: Icons.flag_rounded,
                              color: Colors.blue,
                              subtitle:
                                  context.tr('missionSubtitle'),
                              description:
                                  context.tr('missionDesc'),
                            ),
                            const SizedBox(height: 12),
                            _buildMissionVisionCard(
                              context,
                              title: context.tr('visionHeader'),
                              icon: Icons.visibility_rounded,
                              color: Colors.purple,
                              subtitle: context.tr('visionSubtitle'),
                              description:
                                  context.tr('visionDesc'),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 40),

                    // ── Step-by-Step Guide (Zentra dark glass list) ────────────
                    SectionHeader(
                      icon: Icons.format_list_numbered_rounded,
                      label: context.tr('stepByStepHeader'),
                      color: context.colors.primary,
                    ),
                    const SizedBox(height: 20),

                    GlassCard(
                      borderRadius: BorderRadius.circular(20),
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          _buildZentraListItem(
                            context,
                            title: context.tr('hiwStep1Title'),
                            description:
                                context.tr('hiwStep1Desc'),
                            trailingIcon: Icons.check_circle_rounded,
                          ),
                          Divider(
                              height: 1,
                              thickness: 1,
                              color: context.colors.glassBorder
                                  .withValues(alpha: 0.5)),
                          _buildZentraListItem(
                            context,
                            title: context.tr('hiwStep2Title'),
                            description:
                                context.tr('hiwStep2Desc'),
                            trailingIcon: Icons.check_circle_rounded,
                          ),
                          Divider(
                              height: 1,
                              thickness: 1,
                              color: context.colors.glassBorder
                                  .withValues(alpha: 0.5)),
                          _buildZentraListItem(
                            context,
                            title: context.tr('hiwStep3Title'),
                            description:
                                context.tr('hiwStep3Desc'),
                            trailingIcon: Icons.check_circle_rounded,
                          ),
                          Divider(
                              height: 1,
                              thickness: 1,
                              color: context.colors.glassBorder
                                  .withValues(alpha: 0.5)),
                          _buildZentraListItem(
                            context,
                            title: context.tr('hiwStep4Title'),
                            description:
                                context.tr('hiwStep4Desc'),
                            trailingIcon: Icons.check_circle_rounded,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 48),

                    // ── Core Values (2x2 Grid or 4-col) ───────────────────────────
                    SectionHeader(
                      icon: Icons.diamond_outlined,
                      label: context.tr('whatDrivesUsHeader'),
                      color: const Color(0xFF8B5CF6),
                    ),
                    const SizedBox(height: 20),

                    LayoutBuilder(
                      builder: (context, constraints) {
                        final isDesktop = constraints.maxWidth >= 720;
                        final cols = isDesktop ? 4 : 2;
                        final ratio = isDesktop ? 1.35 : 1.45;

                        return GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: cols,
                          mainAxisSpacing: 14,
                          crossAxisSpacing: 14,
                          childAspectRatio: ratio,
                          children: [
                            _buildValueCard(
                              context,
                              context.tr('valUserCentricTitle'),
                              context.tr('valUserCentricDesc'),
                              Icons.favorite_rounded,
                              Colors.blue,
                            ),
                            _buildValueCard(
                              context,
                              context.tr('valInnovationTitle'),
                              context.tr('valInnovationDesc'),
                              Icons.lightbulb_rounded,
                              Colors.amber,
                            ),
                            _buildValueCard(
                              context,
                              context.tr('valPrivacyFirstTitle'),
                              context.tr('valPrivacyFirstDesc'),
                              Icons.shield_rounded,
                              Colors.cyan,
                            ),
                            _buildValueCard(
                              context,
                              context.tr('valGrowthTitle'),
                              context.tr('valGrowthDesc'),
                              Icons.rocket_launch_rounded,
                              Colors.purple,
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 40),

                    // ── Call To Action Banner ────────────────────────────────────
                    GlassCard(
                      borderRadius: BorderRadius.circular(20),
                      padding: const EdgeInsets.all(24),
                      glowColor: context.colors.primary.withValues(alpha: 0.2),
                      child: Column(
                        children: [
                          Icon(
                            Icons.auto_awesome,
                            size: 32,
                            color: context.colors.primary,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            context.tr('readyToExperienceNetlink'),
                            textAlign: TextAlign.center,
                            style: AppTypography.headlineSm
                                .copyWith(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 18),
                          GradientButton(
                            label: context.tr('exploreGlobalDirectoryBtn'),
                            icon: Icons.arrow_forward,
                            onPressed: () => context.push(AppRoutes.directory),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),
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

  Widget _buildZentraListItem(
    BuildContext context, {
    required String title,
    required String description,
    required IconData trailingIcon,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.bodyMd.copyWith(
                    fontWeight: FontWeight.bold,
                    color: context.colors.onSurface,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Icon(
            trailingIcon,
            color: context.colors.onSurface,
            size: 22,
          ),
        ],
      ),
    );
  }

  Widget _buildMissionVisionCard(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required String subtitle,
    required String description,
  }) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(18),
      glowColor: color.withValues(alpha: 0.18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      color.withValues(alpha: 0.3),
                      color.withValues(alpha: 0.1),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: color.withValues(alpha: 0.4)),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                title,
                style: AppTypography.headlineSm
                    .copyWith(fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            subtitle,
            style: AppTypography.bodySm.copyWith(
              fontWeight: FontWeight.w600,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurfaceVariant,
              height: 1.45,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildValueCard(
    BuildContext context,
    String title,
    String description,
    IconData icon,
    Color color,
  ) {
    return GlassCard(
      borderRadius: BorderRadius.circular(16),
      padding: const EdgeInsets.all(12),
      glowColor: color.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: color.withValues(alpha: 0.3)),
                ),
                child: Icon(icon, color: color, size: 16),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.bodySm.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: AppTypography.bodySm.copyWith(
              color: context.colors.onSurfaceVariant,
              height: 1.3,
              fontSize: 11,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
