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
          // Background decorative elements
          Positioned(
            top: MediaQuery.of(context).size.height * 0.1,
            left: MediaQuery.of(context).size.width * 0.05,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.blue.withValues(alpha: 0.1),
              ),
            ),
          ),
          Positioned(
            top: MediaQuery.of(context).size.height * 0.4,
            right: MediaQuery.of(context).size.width * 0.1,
            child: Container(
              width: 400,
              height: 400,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.indigo.withValues(alpha: 0.1),
              ),
            ),
          ),

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

                                  // Tablet/Desktop: grid with fixed 320px card height to prevent overflow
                                  int crossAxisCount = isTablet ? 2 : 3;
                                  return GridView.builder(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    gridDelegate:
                                        SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: crossAxisCount,
                                      mainAxisSpacing: 16,
                                      crossAxisSpacing: 16,
                                      mainAxisExtent: 320,
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
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      glowColor: context.colors.primary.withValues(alpha: 0.15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  context.colors.primary.withValues(alpha: 0.25),
                  context.colors.primary.withValues(alpha: 0.08),
                ],
              ),
              border: Border.all(
                  color: context.colors.primary.withValues(alpha: 0.3)),
              boxShadow: [
                BoxShadow(
                  color: context.colors.primary.withValues(alpha: 0.2),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(Icons.person, size: 32, color: context.colors.primary),
          ),
          const SizedBox(height: 12),
          Text(
            name,
            style: AppTypography.headlineSm.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 17,
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.green,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  context.tr('publicBadge'),
                  style: AppTypography.labelSm.copyWith(
                    color: Colors.green,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Text(email,
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(top: 20),
            decoration: BoxDecoration(
                border:
                    Border(top: BorderSide(color: context.colors.glassBorder))),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.mail_outline,
                        size: 16,
                        color: context.colors.onSurfaceVariant
                            .withValues(alpha: 0.7)),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(email,
                          style: AppTypography.bodySm.copyWith(
                              color: context.colors.onSurfaceVariant
                                  .withValues(alpha: 0.7)),
                          overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  context.tr('portfolioComingSoon'),
                  style: AppTypography.labelSm.copyWith(
                      color: context.colors.primary,
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.w600,
                      fontSize: 10),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailedMemberCard(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(24),
      padding: const EdgeInsets.all(20),
      glowColor: context.colors.primary.withValues(alpha: 0.3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  context.colors.primary.withValues(alpha: 0.35),
                  context.colors.primary.withValues(alpha: 0.12),
                ],
              ),
              border: Border.all(
                  color: context.colors.primary.withValues(alpha: 0.5)),
              boxShadow: [
                BoxShadow(
                  color: context.colors.primary.withValues(alpha: 0.35),
                  blurRadius: 24,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Icon(Icons.person, size: 34, color: context.colors.primary),
          ),
          const SizedBox(height: 12),
          Text(
            'Mir Farhan Morshed',
            style: AppTypography.headlineSm
                .copyWith(fontWeight: FontWeight.bold, fontSize: 18),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.green.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.green,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  context.tr('publicBadge'),
                  style: AppTypography.labelSm.copyWith(
                    color: Colors.green,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(context.tr('founderAndCeo'),
              style: AppTypography.bodySm.copyWith(
                  color: context.colors.onSurfaceVariant,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.domain, size: 16, color: context.colors.primary),
              const SizedBox(width: 4),
              Text('Ujjibon',
                  style: AppTypography.bodySm.copyWith(
                      color: context.colors.primary,
                      fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(top: 10),
            decoration: BoxDecoration(
                border:
                    Border(top: BorderSide(color: context.colors.glassBorder))),
            child: GradientButton(
              label: context.tr('previewPortfolio'),
              icon: Icons.arrow_forward_rounded,
              height: 38,
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }
}
