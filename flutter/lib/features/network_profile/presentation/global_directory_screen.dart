import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/trial_banner_card.dart';
import '../../../core/widgets/sub_page_top_bar.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/router/app_router.dart';
import '../../../core/localization/app_localizations.dart';
import '../../auth/providers/auth_provider.dart';
import '../services/profile_service.dart';

class GlobalDirectoryScreen extends StatelessWidget {
  const GlobalDirectoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.surface,
      body: Stack(
        children: [
          Column(
            children: [
              // Top Bar (Fixed)
              SubPageTopBar(
                onBack: () {
                  if (context.canPop()) {
                    context.pop();
                  } else {
                    context.go(AppRoutes.landing);
                  }
                },
              ),

              // Content

              Expanded(
                child: SingleChildScrollView(
                  // The logo intentionally extends below the fixed bar.
                  // Match the public-page header inset so this title clears
                  // it at all viewport widths.
                  padding: EdgeInsets.only(
                    top: 36,
                    left: Responsive.pagePadding(context),
                    right: Responsive.pagePadding(context),
                    bottom: 48,
                  ),
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(
                          maxWidth: Responsive.maxContentWidth),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Center(
                            child: Text(
                              context.tr('globalNetworkers'),
                              style: AppTypography.headlineMd,
                              textAlign: TextAlign.center,
                              softWrap: true,
                            ),
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

                          // Grid
                          FutureBuilder<List<Map<String, dynamic>>>(
                            future: ProfileService.fetchPublicProfiles(),
                            builder: (context, snapshot) {
                              return LayoutBuilder(
                                builder: (context, constraints) {
                                  final isDesktop = constraints.maxWidth > 700;
                                  final isTablet =
                                      constraints.maxWidth > 500 && !isDesktop;

                                  final profiles = snapshot.data ?? [];
                                  List<Widget> children;
                                  if (profiles.isNotEmpty) {
                                    children = profiles.map((p) {
                                      final name = (p['name'] as String?)?.trim() ??
                                          (p['full_name'] as String?)?.trim() ??
                                          (p['email'] as String?)?.split('@').first ??
                                          'Member';
                                      final email = (p['email'] as String?)?.trim() ??
                                          'networker@netlink.ai';
                                      return _buildMemberCard(context, name, email);
                                    }).toList();
                                  } else {
                                    children = [
                                      _buildMemberCard(context, 'arrafihasan7530',
                                          'arrafihasan7530@gmail.com'),
                                      _buildMemberCard(context, 'farhanmorshed07',
                                          'farhanmorshed07@gmail.com'),
                                      _buildMemberCard(context, 'cognisor.ai',
                                          'cognisor.ai@gmail.com'),
                                      _buildMemberCard(context, 'gashinshoutan9',
                                          'gashinshoutan9@gmail.com'),
                                      _buildDetailedMemberCard(context),
                                    ];
                                  }

                                  if (!isDesktop && !isTablet) {
                                    // Mobile: vertical list without fixed aspect ratio
                                    return Column(
                                      children: children
                                          .map((e) => Padding(
                                              padding:
                                                  const EdgeInsets.only(bottom: 16),
                                              child: e))
                                          .toList(),
                                    );
                                  }

                                  // Tablet/Desktop: grid with compact card height
                                  int crossAxisCount = isTablet ? 2 : 3;
                                  double cardExtent = isTablet ? 190 : 250;
                                  return GridView.builder(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    gridDelegate:
                                        SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: crossAxisCount,
                                      mainAxisSpacing: 16,
                                      crossAxisSpacing: 16,
                                      mainAxisExtent: cardExtent,
                                    ),
                                    itemCount: children.length,
                                    itemBuilder: (context, index) =>
                                        children[index],
                                  );
                                },
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMemberCard(BuildContext context, String name, String email) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      glowColor: null,
      tintColor: null,
      child: LayoutBuilder(
        builder: (context, constraints) {
          // Fit side-by-side if available card width is at least 280px
          final bool canFitHorizontal = constraints.maxWidth >= 280;

          final topPart = Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                  border: Border.all(
                    color: context.colors.glassBorder,
                    width: 0.8,
                  ),
                ),
                child: Icon(
                  Icons.person,
                  size: 26,
                  color: context.colors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                name,
                style: AppTypography.headlineSm.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: context.colors.onSurface,
                ),
                textAlign: TextAlign.center,
                softWrap: true,
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                decoration: BoxDecoration(
                  color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: context.colors.glassBorder, width: 0.8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: context.colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      context.tr('publicBadge'),
                      style: AppTypography.labelSm.copyWith(
                        color: context.colors.onSurfaceVariant,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                      softWrap: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 5),
              Text(
                email,
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
                softWrap: true,
              ),
            ],
          );

          final portfolioPart = Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Text(
                context.tr('portfolioComingSoon'),
                style: AppTypography.labelSm.copyWith(
                  color: context.colors.onSurfaceVariant,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w600,
                  fontSize: 10,
                ),
                textAlign: TextAlign.center,
                softWrap: true,
              ),
            ),
          );

          if (canFitHorizontal) {
            return IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    flex: 11,
                    child: topPart,
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: Container(
                      width: 0.8,
                      color: context.colors.glassBorder,
                    ),
                  ),
                  Expanded(
                    flex: 9,
                    child: portfolioPart,
                  ),
                ],
              ),
            );
          } else {
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                topPart,
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  height: 0.8,
                  color: context.colors.glassBorder,
                ),
                const SizedBox(height: 12),
                portfolioPart,
              ],
            );
          }
        },
      ),
    );
  }

  Widget _buildDetailedMemberCard(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      glowColor: null,
      tintColor: null,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final bool canFitHorizontal = constraints.maxWidth >= 280;

          final topPart = Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                  border: Border.all(
                    color: context.colors.glassBorder,
                    width: 0.8,
                  ),
                ),
                child: Icon(
                  Icons.person,
                  size: 26,
                  color: context.colors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Mir Farhan Morshed',
                style: AppTypography.headlineSm.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: context.colors.onSurface,
                ),
                textAlign: TextAlign.center,
                softWrap: true,
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                decoration: BoxDecoration(
                  color: context.colors.surfaceContainerHighest.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: context.colors.glassBorder, width: 0.8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 5,
                      height: 5,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: context.colors.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      context.tr('publicBadge'),
                      style: AppTypography.labelSm.copyWith(
                        color: context.colors.onSurfaceVariant,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                      softWrap: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 5),
              Text(
                context.tr('founderAndCeo'),
                style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
                softWrap: true,
              ),
              const SizedBox(height: 3),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.domain, size: 14, color: context.colors.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      'Ujjibon',
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.onSurface,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                      softWrap: true,
                    ),
                  ),
                ],
              ),
            ],
          );

          final portfolioPart = Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: LiquidGlassButton(
                label: context.tr('previewPortfolio'),
                icon: Icons.arrow_forward_rounded,
                height: 36,
                fontSize: 12,
                iconSize: 16,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                expand: !canFitHorizontal,
                onPressed: () {},
              ),
            ),
          );

          if (canFitHorizontal) {
            return IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    flex: 11,
                    child: topPart,
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    child: Container(
                      width: 0.8,
                      color: context.colors.glassBorder,
                    ),
                  ),
                  Expanded(
                    flex: 9,
                    child: portfolioPart,
                  ),
                ],
              ),
            );
          } else {
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                topPart,
                const SizedBox(height: 12),
                Container(
                  width: double.infinity,
                  height: 0.8,
                  color: context.colors.glassBorder,
                ),
                const SizedBox(height: 12),
                portfolioPart,
              ],
            );
          }
        },
      ),
    );
  }
}
