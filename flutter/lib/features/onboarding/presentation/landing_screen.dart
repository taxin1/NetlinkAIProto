import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/animated_glass_icon_button.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/netlink_logo.dart';
import '../../../core/widgets/pop_in_item.dart';

import '../../auth/providers/auth_provider.dart';
import '../../../core/theme/theme_provider.dart';
import '../../../core/localization/locale_provider.dart';
import '../../../core/localization/app_localizations.dart';

/// Zentra-inspired canonical Landing Screen for Network Link AI.
/// Features a rich liquid ambient gradient background, high-contrast typography,
/// pill indicators, primary gradient capsule CTA, and an 'Explore' button
/// that launches a frosted glass card list with platform quick links.
class LandingScreen extends ConsumerStatefulWidget {
  const LandingScreen({super.key});

  @override
  ConsumerState<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends ConsumerState<LandingScreen>
    with TickerProviderStateMixin {
  late AnimationController _orb1;
  late AnimationController _orb2;

  @override
  void initState() {
    super.initState();
    _orb1 =
        AnimationController(vsync: this, duration: const Duration(seconds: 10))
          ..repeat(reverse: true);
    _orb2 =
        AnimationController(vsync: this, duration: const Duration(seconds: 14))
          ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _orb1.dispose();
    _orb2.dispose();
    super.dispose();
  }

  void _showQuickLinksSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) {
        final maxHeight = MediaQuery.of(context).size.height * 0.85;

        return ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxHeight),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(
              color: context.colors.surfaceContainer.withValues(alpha: 0.98),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(32)),
              border: Border(
                top:
                    BorderSide(color: context.colors.glassBorder, width: 1.5),
                left: BorderSide(color: context.colors.glassBorder, width: 1),
                right:
                    BorderSide(color: context.colors.glassBorder, width: 1),
              ),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x66000000),
                  blurRadius: 24,
                  offset: Offset(0, -6),
                ),
              ],
            ),
            child: SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Sheet Handle Bar
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: context.colors.onSurfaceVariant
                              .withValues(alpha: 0.4),
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Sheet Title
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.explore_outlined,
                                  color: context.colors.primary, size: 22),
                              const SizedBox(width: 8),
                              Text(
                                context.tr('explorePlatform'),
                                style: AppTypography.headlineSm
                                    .copyWith(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          IconButton(
                            icon: Icon(Icons.close,
                                color: context.colors.onSurfaceVariant),
                            onPressed: () => Navigator.pop(context),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Scrollable Quick Link Action Cards
                      Flexible(
                        child: SingleChildScrollView(
                          physics: const BouncingScrollPhysics(),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _QuickLinkTile(
                                title: context.tr('howItWorks'),
                                description:
                                    context.tr('landingHowItWorksDesc'),
                                icon: Icons.lightbulb_outlined,
                                color: Colors.blue,
                                onTap: () {
                                  Navigator.pop(context);
                                  context.push(AppRoutes.howItWorks);
                                },
                              ),
                              const SizedBox(height: 12),
                              _QuickLinkTile(
                                title: context.tr('globalDirectory'),
                                description:
                                    context.tr('landingGlobalDirectoryDesc'),
                                icon: Icons.public_outlined,
                                color: Colors.purple,
                                onTap: () {
                                  Navigator.pop(context);
                                  context.push(AppRoutes.directory);
                                },
                              ),
                              const SizedBox(height: 12),
                              _QuickLinkTile(
                                title: context.tr('pricing'),
                                description:
                                    context.tr('landingPricingDesc'),
                                icon: Icons.payments_outlined,
                                color: Colors.cyan,
                                onTap: () {
                                  Navigator.pop(context);
                                  context.push(AppRoutes.pricing);
                                },
                              ),
                              const SizedBox(height: 12),
                              _QuickLinkTile(
                                title: context.tr('resources'),
                                description:
                                    context.tr('landingResourcesDesc'),
                                icon: Icons.menu_book_outlined,
                                color: Colors.amber,
                                onTap: () {
                                  Navigator.pop(context);
                                  context.push(AppRoutes.resources);
                                },
                              ),
                              const SizedBox(height: 16),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // ── Ambient Background Mesh ─────────────────────────────────────────
          Positioned.fill(
            child: CustomPaint(
              painter: _GridPainter(
                Theme.of(context).brightness == Brightness.light
                    ? const Color(0x0A000000)
                    : const Color(0x08FFFFFF),
              ),
            ),
          ),

          // ── Animated ambient orbs ───────────────────────────────────────────────────
          RepaintBoundary(
            child: AnimatedBuilder(
              animation: Listenable.merge([_orb1, _orb2]),
              builder: (context, _) {
                final isLight = Theme.of(context).brightness == Brightness.light;
                final size = MediaQuery.of(context).size;
                return Stack(
                  children: [
                    // Top orb — blue, drifts right
                    Positioned(
                      top: size.height * (0.05 + _orb1.value * 0.08),
                      left: size.width * (0.05 + _orb1.value * 0.10),
                      right: size.width * (0.05 + _orb1.value * 0.05),
                      child: Container(
                        height: 360 + _orb1.value * 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              isLight
                                  ? const Color(0x600066FF)
                                  : const Color(0x480055FF),
                              isLight
                                  ? const Color(0x3800E5FF)
                                  : const Color(0x2800E5FF),
                              Colors.transparent,
                            ],
                            stops: const [0.0, 0.55, 1.0],
                          ),
                        ),
                      ),
                    ),
                    // Bottom orb — violet, drifts left
                    Positioned(
                      bottom: -size.height * (0.10 + _orb2.value * 0.05),
                      left: -size.width * (0.10 + _orb2.value * 0.08),
                      right: size.width * 0.1,
                      child: Container(
                        height: 300 + _orb2.value * 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              isLight
                                  ? const Color(0x426C22D6)
                                  : const Color(0x306C22D6),
                              Colors.transparent,
                            ],
                            stops: const [0.0, 1.0],
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // ── Main Responsive Content Container ──────────────────────────────
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isLandscape =
                    constraints.maxWidth > constraints.maxHeight &&
                        constraints.maxWidth > 600;
                final isCompactHeight = constraints.maxHeight < 820;

                if (isLandscape) {
                  // ── Landscape / Expanded Widescreen: Side-by-Side Layout ─────
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(
                        24, kToolbarHeight + 8, 24, 16),
                    child: Row(
                      children: [
                        // Left: Logo
                        Expanded(
                          flex: 4,
                          child: PopInItem(
                            index: 1,
                            delay: const Duration(milliseconds: 100),
                            duration: const Duration(milliseconds: 480),
                            slideOffset: 0.0,
                            initialScale: 0.45,
                            curve: Curves.easeOutBack,
                            child: Center(
                              child:
                                  const NetlinkLogo(size: 200, showText: true),
                            ),
                          ),
                        ),
                        const SizedBox(width: 32),
                        // Right: Slogan, Description, Buttons
                        Expanded(
                          flex: 5,
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                PopInItem(
                                  index: 2,
                                  delay: const Duration(milliseconds: 220),
                                  duration: const Duration(milliseconds: 420),
                                  slideOffset: 20.0,
                                  initialScale: 0.88,
                                  curve: Curves.easeOutBack,
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        context.tr('heroTitlePart1'),
                                        style: AppTypography.displayLgMobile
                                            .copyWith(
                                          color: context.colors.onSurface,
                                          height: 1.15,
                                          fontSize: 26,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      ShaderMask(
                                        shaderCallback: (bounds) =>
                                            LinearGradient(
                                          begin: Alignment.centerLeft,
                                          end: Alignment.centerRight,
                                          colors:
                                              AppColors.primaryButtonGradient,
                                        ).createShader(bounds),
                                        blendMode: BlendMode.srcIn,
                                        child: Padding(
                                          padding:
                                              const EdgeInsets.only(bottom: 4),
                                          child: Text(
                                            context.tr('heroTitlePart2'),
                                            style: AppTypography.displayLgMobile
                                                .copyWith(
                                              color: Colors.white,
                                              height: 1.25,
                                              fontSize: 26,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 12),
                                PopInItem(
                                  index: 3,
                                  delay: const Duration(milliseconds: 300),
                                  duration: const Duration(milliseconds: 400),
                                  slideOffset: 16.0,
                                  initialScale: 0.92,
                                  child: Text(
                                    context.tr('heroSubtitle'),
                                    style: AppTypography.bodyLg.copyWith(
                                      color: context.colors.onSurfaceVariant,
                                      height: 1.45,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),
                                Wrap(
                                  spacing: 16,
                                  runSpacing: 12,
                                  children: [
                                    SizedBox(
                                      width: 170,
                                      child: PopInItem(
                                        index: 4,
                                        delay: const Duration(milliseconds: 380),
                                        duration:
                                            const Duration(milliseconds: 450),
                                        slideOffset: 24.0,
                                        initialScale: 0.85,
                                        curve: Curves.easeOutBack,
                                        child: GradientButton(
                                          label: context.l10n.getStarted,
                                          icon: Icons.arrow_forward_rounded,
                                          height: 48,
                                          onPressed: () => context
                                              .push(AppRoutes.createAccount),
                                        ),
                                      ),
                                    ),
                                    SizedBox(
                                      width: 170,
                                      child: PopInItem(
                                        index: 5,
                                        delay: const Duration(milliseconds: 460),
                                        duration:
                                            const Duration(milliseconds: 450),
                                        slideOffset: 20.0,
                                        initialScale: 0.88,
                                        curve: Curves.easeOutBack,
                                        child: LiquidGlassButton(
                                          label: context.l10n.tryDemo,
                                          icon: Icons.play_circle_outline,
                                          height: 48,
                                          onPressed: () async {
                                            await ref
                                                .read(authProvider.notifier)
                                                .signInAsGuest();
                                            if (context.mounted) {
                                              context.go(AppRoutes.dashboard);
                                            }
                                          },
                                        ),
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
                  );
                }

                // ── Portrait Layout (Pins elements towards bottom like Zentra reference) ─────
                final logoSize = isCompactHeight ? 180.0 : 220.0;

                return Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 540),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: CustomScrollView(
                        physics: const BouncingScrollPhysics(),
                        slivers: [
                          SliverFillRemaining(
                            hasScrollBody: false,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                SizedBox(
                                    height: kToolbarHeight +
                                        MediaQuery.of(context).padding.top +
                                        16),

                                // Logo
                                PopInItem(
                                  index: 1,
                                  delay: const Duration(milliseconds: 100),
                                  duration: const Duration(milliseconds: 480),
                                  slideOffset: 0.0,
                                  initialScale: 0.45,
                                  curve: Curves.easeOutBack,
                                  child: Center(
                                    child: NetlinkLogo(
                                        size: logoSize, showText: true),
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Slogan
                                PopInItem(
                                  index: 2,
                                  delay: const Duration(milliseconds: 220),
                                  duration: const Duration(milliseconds: 420),
                                  slideOffset: 20.0,
                                  initialScale: 0.88,
                                  curve: Curves.easeOutBack,
                                  child: Column(
                                    children: [
                                      Text(
                                        context.tr('heroTitlePart1'),
                                        textAlign: TextAlign.center,
                                        style: AppTypography.displayLgMobile
                                            .copyWith(
                                          color: context.colors.onSurface,
                                          height: 1.15,
                                          fontSize: isCompactHeight ? 22 : 26,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      ShaderMask(
                                        shaderCallback: (bounds) =>
                                            LinearGradient(
                                          begin: Alignment.centerLeft,
                                          end: Alignment.centerRight,
                                          colors:
                                              AppColors.primaryButtonGradient,
                                        ).createShader(bounds),
                                        blendMode: BlendMode.srcIn,
                                        child: Padding(
                                          padding: const EdgeInsets.only(
                                              bottom: 4),
                                          child: Text(
                                            context.tr('heroTitlePart2'),
                                            textAlign: TextAlign.center,
                                            style: AppTypography
                                                .displayLgMobile
                                                .copyWith(
                                              color: Colors.white,
                                              height: 1.25,
                                              fontSize:
                                                  isCompactHeight ? 22 : 26,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),

                                // Shortened Description
                                PopInItem(
                                  index: 3,
                                  delay: const Duration(milliseconds: 300),
                                  duration: const Duration(milliseconds: 400),
                                  slideOffset: 16.0,
                                  initialScale: 0.92,
                                  child: Center(
                                    child: Text(
                                      context.tr('heroSubtitle'),
                                      textAlign: TextAlign.center,
                                      style: AppTypography.bodyLg.copyWith(
                                        color:
                                            context.colors.onSurfaceVariant,
                                        height: 1.4,
                                        fontSize: isCompactHeight ? 13 : 14.5,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 18),

                                // Primary CTA
                                PopInItem(
                                  index: 4,
                                  delay: const Duration(milliseconds: 380),
                                  duration: const Duration(milliseconds: 450),
                                  slideOffset: 24.0,
                                  initialScale: 0.85,
                                  curve: Curves.easeOutBack,
                                  child: GradientButton(
                                    label: context.l10n.getStarted,
                                    icon: Icons.arrow_forward_rounded,
                                    height: isCompactHeight ? 46 : 50,
                                    onPressed: () =>
                                        context.push(AppRoutes.createAccount),
                                  ),
                                ),
                                const SizedBox(height: 8),

                                // Secondary CTA
                                PopInItem(
                                  index: 5,
                                  delay: const Duration(milliseconds: 460),
                                  duration: const Duration(milliseconds: 450),
                                  slideOffset: 20.0,
                                  initialScale: 0.88,
                                  curve: Curves.easeOutBack,
                                  child: LiquidGlassButton(
                                    label: context.l10n.tryDemo,
                                    icon: Icons.play_circle_outline,
                                    height: isCompactHeight ? 44 : 46,
                                    onPressed: () async {
                                      await ref
                                          .read(authProvider.notifier)
                                          .signInAsGuest();
                                      if (context.mounted) {
                                        context.go(AppRoutes.dashboard);
                                      }
                                    },
                                  ),
                                ),
                                const SizedBox(height: 14),

                                // Footer
                                PopInItem(
                                  index: 6,
                                  delay: const Duration(milliseconds: 540),
                                  duration: const Duration(milliseconds: 380),
                                  slideOffset: 10.0,
                                  initialScale: 0.95,
                                  child: Center(
                                    child: InkWell(
                                      onTap: () async {
                                        final url = Uri.parse(
                                            'https://www.networklinkai.com/privacy');
                                        try {
                                          await launchUrl(url,
                                              mode: LaunchMode
                                                  .externalApplication);
                                        } catch (e) {
                                          debugPrint(
                                              'Could not launch $url: $e');
                                        }
                                      },
                                      borderRadius: BorderRadius.circular(4),
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                            vertical: 4, horizontal: 8),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(Icons.shield_outlined,
                                                size: 14,
                                                color:
                                                    context.colors.outline),
                                            const SizedBox(width: 4),
                                            Text(
                                              context.tr('privacyPolicy'),
                                              style: AppTypography.labelCaps
                                                  .copyWith(
                                                color: context.colors.outline,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(
                                    height: isCompactHeight ? 32 : 64),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // ── Fixed Top Left Bar Buttons (Top layer in Stack so clicks work) ───
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 20,
            child: PopInItem(
              index: 0,
              delay: const Duration(milliseconds: 50),
              duration: const Duration(milliseconds: 350),
              slideOffset: -12.0,
              initialScale: 0.96,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const _LandingSettingsMenu(),
                  const SizedBox(width: 8),
                  AnimatedGlassIconButton(
                    icon: Icons.grid_view_rounded,
                    label: context.tr('more'),
                    tooltip: context.tr('explorePlatform'),
                    onPressed: () => _showQuickLinksSheet(context),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Quick Link Tile for Card List Bottom Sheet ─────────────────────────────────
class _QuickLinkTile extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickLinkTile({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(16),
      glowColor: color.withValues(alpha: 0.2),
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  color.withValues(alpha: 0.3),
                  color.withValues(alpha: 0.1),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: color.withValues(alpha: 0.4)),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: AppTypography.bodyLg.copyWith(
                    fontWeight: FontWeight.bold,
                    color: context.colors.onSurface,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: AppTypography.bodySm.copyWith(
                    color: context.colors.onSurfaceVariant,
                    fontSize: 12,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Icon(Icons.arrow_forward_ios_rounded,
              color: context.colors.outline, size: 16),
        ],
      ),
    );
  }
}

// ── Settings Menu Component ──────────────────────────────────────────────────
class _LandingSettingsMenu extends ConsumerStatefulWidget {
  const _LandingSettingsMenu();

  @override
  ConsumerState<_LandingSettingsMenu> createState() =>
      _LandingSettingsMenuState();
}

class _LandingSettingsMenuState extends ConsumerState<_LandingSettingsMenu> {
  void _openMenu(BuildContext context) async {
    final RenderBox button = context.findRenderObject() as RenderBox;
    final RenderBox overlay =
        Overlay.of(context).context.findRenderObject() as RenderBox;
    final position = RelativeRect.fromRect(
      Rect.fromPoints(
        button.localToGlobal(Offset(0, button.size.height + 8),
            ancestor: overlay),
        button.localToGlobal(button.size.bottomRight(Offset.zero),
            ancestor: overlay),
      ),
      Offset.zero & overlay.size,
    );

    await showMenu<String>(
      context: context,
      position: position,
      color: Colors.transparent,
      elevation: 0,
      items: [
        PopupMenuItem<String>(
          padding: EdgeInsets.zero,
          enabled: false,
          child: Consumer(
            builder: (context, ref, child) {
              final isDark = ref.watch(themeModeProvider) == ThemeMode.dark;
              final currentLocale = ref.watch(localeProvider);
              final isJp = currentLocale.languageCode == 'ja';
              final bgColor =
                  isDark ? const Color(0xFF1D2026) : const Color(0xFFEAECF4);
              final borderColor =
                  isDark ? const Color(0x1FFFFFFF) : const Color(0x1A000000);
              final textColor = isDark ? Colors.white : Colors.black;

              return Container(
                width: 250,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: borderColor),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${context.tr('language')} (EN/JA)',
                              style: AppTypography.bodyMd
                                  .copyWith(color: textColor),
                            ),
                          ),
                          Switch(
                            value: isJp,
                            onChanged: (val) {
                              ref
                                  .read(localeProvider.notifier)
                                  .setLocale(val ? const Locale('ja') : const Locale('en'));
                            },
                            activeThumbColor: context.colors.primary,
                          ),
                        ],
                      ),
                    ),
                    Divider(color: borderColor, height: 1),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              context.tr('darkMode'),
                              style: AppTypography.bodyMd
                                  .copyWith(color: textColor),
                            ),
                          ),
                          Switch(
                            value: isDark,
                            onChanged: (_) {
                              ref.read(themeModeProvider.notifier).toggle();
                            },
                            activeThumbColor: context.colors.primary,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedGlassIconButton(
      icon: Icons.settings_outlined,
      tooltip: context.tr('settings'),
      onPressed: () => _openMenu(context),
    );
  }
}

// ── Subtle dot-grid background painter ───────────────────────────────────────
class _GridPainter extends CustomPainter {
  final Color gridColor;
  _GridPainter(this.gridColor);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = gridColor
      ..strokeWidth = 1;

    const step = 40.0;
    for (double x = 0; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(_GridPainter old) => old.gridColor != gridColor;
}
