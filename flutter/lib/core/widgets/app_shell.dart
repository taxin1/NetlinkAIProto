import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../router/app_router.dart';
import '../widgets/netlink_logo.dart';
import '../widgets/animated_glass_icon_button.dart';
import '../utils/responsive.dart';
import '../../features/auth/providers/auth_provider.dart';
import 'post_login_dialogs.dart';
import 'app_modal_dialog.dart';
import '../tour/tour_controller.dart';
import '../tour/feature_showcase_tour.dart';


import '../localization/app_localizations.dart';

/// Primary nav items — mirrors the web app sidebar
const _navItems = [
  (icon: Icons.dashboard_outlined,     activeIcon: Icons.dashboard_rounded,      label: 'Dashboard',        labelKey: 'dashboard',        route: AppRoutes.dashboard),
  (icon: Icons.person_search_outlined, activeIcon: Icons.person_search_rounded,  label: 'Network Profile',  labelKey: 'networkProfile',  route: AppRoutes.profile),
  (icon: Icons.folder_shared_outlined, activeIcon: Icons.folder_shared_rounded,  label: 'Portfolio',        labelKey: 'portfolio',        route: AppRoutes.portfolio),
  (icon: Icons.group_outlined,         activeIcon: Icons.group_rounded,          label: 'Contacts',         labelKey: 'contacts',         route: AppRoutes.contacts),
  (icon: Icons.wifi_tethering_rounded, activeIcon: Icons.wifi_tethering_rounded, label: 'Networking Mode',  labelKey: 'networkingMode',  route: AppRoutes.networkingMode),
  (icon: Icons.calendar_month_outlined,activeIcon: Icons.calendar_month_rounded, label: 'Calendar',         labelKey: 'calendar',         route: AppRoutes.calendar),
  (icon: Icons.event_outlined,         activeIcon: Icons.event_rounded,          label: 'Events',           labelKey: 'events',           route: AppRoutes.events),
  (icon: Icons.handshake_outlined,     activeIcon: Icons.handshake_rounded,      label: 'AI Matchmaking',   labelKey: 'eventMatchmaking',route: AppRoutes.eventMatchmaking),
  (icon: Icons.mail_outline_rounded,   activeIcon: Icons.mail_rounded,           label: 'Emails',           labelKey: 'emails',           route: AppRoutes.emails),
  (icon: Icons.campaign_outlined,      activeIcon: Icons.campaign_rounded,       label: 'AI Campaigns',     labelKey: 'aiCampaigns',     route: AppRoutes.aiCampaigns),
  (icon: Icons.description_outlined,   activeIcon: Icons.description_rounded,    label: 'Quotation Form',   labelKey: 'quotation',       route: AppRoutes.quotation),
  (icon: Icons.analytics_outlined,     activeIcon: Icons.analytics_rounded,      label: 'Analytics',        labelKey: 'analytics',        route: AppRoutes.analytics),
  (icon: Icons.smart_toy_outlined,     activeIcon: Icons.smart_toy_rounded,      label: 'AI Assistant',     labelKey: 'aiAssistant',     route: AppRoutes.aiAssistant),
  (icon: Icons.settings_outlined,      activeIcon: Icons.settings_rounded,       label: 'Settings',         labelKey: 'settings',         route: AppRoutes.settings),
];

/// Main app shell — adapts between mobile drawer / tablet rail / desktop sidebar
class AppShell extends ConsumerStatefulWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  final GlobalKey<ScaffoldState> _mobileScaffoldKey = GlobalKey<ScaffoldState>();
  bool _wasNonMobile = false;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isDesktop = width >= Responsive.tabletMax;
    final isTablet  = width >= Responsive.mobileMax && width < Responsive.tabletMax;
    final isNonMobile = isDesktop || isTablet;

    if (isNonMobile && !_wasNonMobile) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_mobileScaffoldKey.currentState?.isDrawerOpen ?? false) {
          if (Navigator.of(context).canPop()) {
            Navigator.of(context).pop();
          }
        }
      });
    }
    _wasNonMobile = isNonMobile;

    Widget shellContent;

    if (isDesktop) {
      // ── Desktop: persistent full sidebar + full content height (no top bar) ──
      shellContent = Scaffold(
        key: const ValueKey('desktop_shell_scaffold'),
        backgroundColor: context.colors.background,
        body: Row(
          children: [
            const _PersistentSidebar(),
            Expanded(
              child: Stack(
                children: [
                  const _OrbBackground(),
                  RepaintBoundary(child: widget.child),
                ],
              ),
            ),
          ],
        ),
      );
    } else if (isTablet) {
      // ── Tablet: navigation rail pinned left ──
      shellContent = Scaffold(
        key: const ValueKey('tablet_shell_scaffold'),
        backgroundColor: context.colors.background,
        body: Row(
          children: [
            const _NavigationRail(),
            Expanded(
              child: Stack(
                children: [
                  const _OrbBackground(),
                  RepaintBoundary(child: widget.child),
                  const Positioned(
                    top: 0, left: 0, right: 0,
                    child: _AppTopBar(showHamburger: false),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    } else {
      // ── Mobile: overlay drawer with hamburger ──
      shellContent = Scaffold(
        key: _mobileScaffoldKey,
        backgroundColor: context.colors.background,
        drawer: const _AppDrawer(),
        body: Stack(
          children: [
            const _OrbBackground(),
            RepaintBoundary(child: widget.child),
            const Positioned(
              top: 0, left: 0, right: 0,
              child: _AppTopBar(showHamburger: true),
            ),
          ],
        ),
      );
    }

    return Stack(
      children: [
        shellContent,
        // Post-login dialogs (profile reminder after tour)
        const PostLoginDialogs(),
        // Top-level 11-step interactive feature showcase tour
        const FeatureShowcaseTourOverlay(),
      ],
    );
  }
}

// ── Ambient glowing orbs (GPU-cached static ambient gradients) ───────────────
class _OrbBackground extends StatelessWidget {
  const _OrbBackground();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return RepaintBoundary(
      child: SizedBox(
        width: size.width,
        height: size.height,
        child: CustomPaint(
          painter: _OrbPainter(isDark: isDark),
        ),
      ),
    );
  }
}

class _OrbPainter extends CustomPainter {
  final bool isDark;

  const _OrbPainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final maxR = size.width.clamp(0.0, 600.0);
    if (isDark) {
      // Top-right: primary blue
      _drawOrb(canvas,
          center: Offset(size.width * 0.78, size.height * 0.08),
          radius: maxR * 0.55, color: const Color(0x332B5EFF));
      // Bottom-left: deep violet
      _drawOrb(canvas,
          center: Offset(size.width * 0.08, size.height * 0.64),
          radius: maxR * 0.60, color: const Color(0x2A6C22D6));
    } else {
      // Light mode
      _drawOrb(canvas,
          center: Offset(size.width * 0.78, size.height * 0.08),
          radius: maxR * 0.55, color: const Color(0x402B5EFF));
      _drawOrb(canvas,
          center: Offset(size.width * 0.08, size.height * 0.64),
          radius: maxR * 0.55, color: const Color(0x336C22D6));
    }
  }

  void _drawOrb(Canvas canvas, {required Offset center, required double radius, required Color color}) {
    final paint = Paint()
      ..shader = RadialGradient(
        colors: [color, color.withValues(alpha: 0.0)],
        stops: const [0.0, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: radius));
    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(_OrbPainter old) => old.isDark != isDark;
}

// ── Lightweight glass top bar ────────────────────────────────────────────────
class _AppTopBar extends ConsumerWidget {
  final bool showHamburger;
  const _AppTopBar({this.showHamburger = true});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return RepaintBoundary(
      child: Container(
        height: kToolbarHeight + MediaQuery.of(context).padding.top,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              context.colors.background.withValues(alpha: 0.98),
              context.colors.background.withValues(alpha: 0.82),
              context.colors.background.withValues(alpha: 0.0),
            ],
            stops: const [0.0, 0.75, 1.0],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                if (showHamburger)
                  Builder(
                    builder: (context) => AnimatedGlassIconButton(
                      icon: Icons.menu_rounded,
                      tooltip: context.tr('menu'),
                      onPressed: () => Scaffold.of(context).openDrawer(),
                    ),
                  )
                else
                  const SizedBox(width: 40),

                const Expanded(
                  child: Center(
                    child: OverflowBox(
                      maxHeight: 180,
                      child: NetlinkLogo(size: 180, showText: true),
                    ),
                  ),
                ),
                const SizedBox(width: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Persistent sidebar — Desktop ─────────────────────────────────────────────
class _PersistentSidebar extends ConsumerWidget {
  const _PersistentSidebar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final location = GoRouterState.of(context).matchedLocation;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: Responsive.sidebarWidth,
      decoration: BoxDecoration(
        color: isDark
            ? context.colors.background.withValues(alpha: 0.96)
            : context.colors.background.withValues(alpha: 0.98),
        border: Border(
          right: BorderSide(color: context.colors.glassBorder),
        ),
      ),
      child: Column(
            children: [
              // Logo header
              Container(
                padding: EdgeInsets.only(
                  top: MediaQuery.of(context).padding.top + 16,
                  left: 24,
                  right: 24,
                  bottom: 20,
                ),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: context.colors.glassBorder)),
                ),
                child: SizedBox(
                  height: 60,
                  child: OverflowBox(
                    maxHeight: 140,
                    child: NetlinkLogo(size: 140, showText: true),
                  ),
                ),
              ),

              // Nav items
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  child: Column(
                    children: _navItems.map((item) => _SidebarNavItem(
                      key: ValueKey(item.route),
                      icon: item.icon,
                      activeIcon: item.activeIcon,
                      label: context.tr(item.labelKey),
                      route: item.route,
                      currentLocation: location,
                    )).toList(),
                  ),
                ),
              ),

              // Tour Guide button in Sidebar (matching Hamburger Menu)
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                child: _AppTourButton(),
              ),
              const SizedBox(height: 6),

              // User profile card
              _UserProfileCard(user: user, showLogout: true),
              SizedBox(height: MediaQuery.of(context).padding.bottom + 12),
            ],
          ),
        );
  }
}

// ── Navigation Rail — Tablet ─────────────────────────────────────────────────
class _NavigationRail extends ConsumerWidget {
  const _NavigationRail();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      width: Responsive.railWidth,
      decoration: BoxDecoration(
        color: isDark
            ? context.colors.background.withValues(alpha: 0.96)
            : context.colors.background.withValues(alpha: 0.98),
        border: Border(right: BorderSide(color: context.colors.glassBorder)),
      ),
      child: Column(
        children: [
          SizedBox(height: MediaQuery.of(context).padding.top + kToolbarHeight + 8),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Column(
                children: [
                  ..._navItems.map((item) => _RailNavItem(
                    key: ValueKey(item.route),
                    icon: item.icon,
                    activeIcon: item.activeIcon,
                    label: context.tr(item.labelKey),
                    labelKey: item.labelKey,
                    route: item.route,
                    currentLocation: location,
                  )),
                  const SizedBox(height: 16),
                  Padding(
                    padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom + 12),
                    child: Column(
                      children: [
                        Tooltip(
                          message: context.tr('appTour'),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(10),
                            onTap: () => ref.read(tourControllerProvider.notifier).startTour(0, true),
                            child: Container(
                              width: 36,
                              height: 36,
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                color: context.colors.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: context.colors.primary.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Icon(Icons.auto_awesome_rounded, color: context.colors.primary, size: 18),
                            ),
                          ),
                        ),
                        Tooltip(
                          message: '${user?.name ?? context.tr("guest")}\n${user?.isGuest == true ? context.tr("limitedTrial") : (user?.isPro == true ? context.tr("proMember") : context.tr("freePlan"))}',
                          child: ClipOval(
                            child: Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: context.colors.primaryButtonGradient,
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: (user?.avatarUrl?.trim().isNotEmpty == true)
                                  ? Image.network(
                                      user!.avatarUrl!.trim(),
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) =>
                                          const Icon(Icons.person_rounded, color: Colors.white, size: 18),
                                    )
                                  : const Icon(Icons.person_rounded, color: Colors.white, size: 18),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Tooltip(
                          message: context.tr('signOut'),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(10),
                            onTap: () {
                              AppModalDialog.showSignOutConfirmation(
                                context,
                                onConfirm: () {
                                  ref.read(authProvider.notifier).signOut();
                                  context.go(AppRoutes.landing);
                                },
                              );
                            },
                            child: Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: context.colors.errorRuby.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: context.colors.errorRuby.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Icon(Icons.logout_rounded, color: context.colors.errorRuby, size: 18),
                            ),
                          ),
                        ),
                      ],
                    ),
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

// ── Sidebar nav item (full label) ────────────────────────────────────────────
class _SidebarNavItem extends StatefulWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String route;
  final String currentLocation;

  const _SidebarNavItem({
    super.key,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.route,
    required this.currentLocation,
  });

  @override
  State<_SidebarNavItem> createState() => _SidebarNavItemState();
}

class _SidebarNavItemState extends State<_SidebarNavItem> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isActive = widget.currentLocation == widget.route ||
        (widget.route != AppRoutes.dashboard && widget.currentLocation.startsWith('${widget.route}/'));

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOutCubic,
        margin: const EdgeInsets.only(bottom: 4),
        decoration: isActive
            ? BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    context.colors.primary.withValues(alpha: 0.22),
                    context.colors.primary.withValues(alpha: 0.08),
                  ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: context.colors.primary.withValues(alpha: 0.35)),
              )
            : (_isHovered
                ? BoxDecoration(
                    color: context.colors.onSurface.withValues(alpha: 0.07),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.transparent),
                  )
                : BoxDecoration(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.transparent),
                  )),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            hoverColor: Colors.transparent,
            splashColor: context.colors.primary.withValues(alpha: 0.12),
            highlightColor: Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            onTap: () {
              if (mounted) setState(() => _isHovered = false);
              context.go(widget.route);
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Row(
                children: [
                  AnimatedScale(
                    scale: isActive ? 1.1 : 1.0,
                    duration: const Duration(milliseconds: 160),
                    child: Icon(
                      isActive ? widget.activeIcon : widget.icon,
                      color: isActive ? context.colors.primary : context.colors.onSurfaceVariant,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    widget.label,
                    style: AppTypography.bodyMd.copyWith(
                      color: isActive ? context.colors.primary : context.colors.onSurfaceVariant,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Rail nav item (icon + label stacked) ─────────────────────────────────────
class _RailNavItem extends StatefulWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String labelKey;
  final String route;
  final String currentLocation;

  const _RailNavItem({
    super.key,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.labelKey,
    required this.route,
    required this.currentLocation,
  });

  @override
  State<_RailNavItem> createState() => _RailNavItemState();
}

class _RailNavItemState extends State<_RailNavItem> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isActive = widget.currentLocation == widget.route ||
        (widget.route != AppRoutes.dashboard && widget.currentLocation.startsWith('${widget.route}/'));

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: Tooltip(
        message: widget.label,
        preferBelow: false,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          curve: Curves.easeOutCubic,
          width: double.infinity,
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: isActive
              ? BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      context.colors.primary.withValues(alpha: 0.22),
                      context.colors.primary.withValues(alpha: 0.08),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: context.colors.primary.withValues(alpha: 0.35)),
                )
              : (_isHovered
                  ? BoxDecoration(
                      color: context.colors.onSurface.withValues(alpha: 0.07),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.transparent),
                    )
                  : BoxDecoration(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.transparent),
                    )),
          child: InkWell(
            hoverColor: Colors.transparent,
            splashColor: context.colors.primary.withValues(alpha: 0.12),
            highlightColor: Colors.transparent,
            borderRadius: BorderRadius.circular(14),
            onTap: () {
              if (mounted) setState(() => _isHovered = false);
              context.go(widget.route);
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedScale(
                    scale: isActive ? 1.12 : 1.0,
                    duration: const Duration(milliseconds: 160),
                    child: Icon(
                      isActive ? widget.activeIcon : widget.icon,
                      color: isActive ? context.colors.primary : context.colors.onSurfaceVariant,
                      size: 22,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _railLabel(context, widget.labelKey, widget.label),
                    style: AppTypography.labelSm.copyWith(
                      color: isActive ? context.colors.primary : context.colors.onSurfaceVariant,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                      fontSize: 9.0,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _railLabel(BuildContext context, String labelKey, String fullLabel) {
    switch (labelKey) {
      case 'eventMatchmaking':
        return context.tr('navRailMatch');
      case 'aiCampaigns':
        return context.tr('navRailCampaigns');
      case 'aiAssistant':
        return context.tr('navRailAssistant');
      case 'networkProfile':
        return context.tr('navRailProfile');
      case 'networkingMode':
        return context.tr('navRailConnect');
      case 'quotation':
        return context.tr('navRailQuotes');
      default:
        return fullLabel.contains(' ') ? fullLabel.split(' ').first : fullLabel;
    }
  }
}

// ── User profile card ─────────────────────────────────────────────────────────
class _UserProfileCard extends ConsumerWidget {
  final dynamic user;
  final bool showLogout;
  const _UserProfileCard({required this.user, this.showLogout = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.colors.onSurface.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: context.colors.glassBorder),
      ),
      child: Row(
        children: [
          ClipOval(
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: context.colors.primaryButtonGradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: (user?.avatarUrl != null && (user!.avatarUrl as String).trim().isNotEmpty)
                  ? Image.network(
                      (user!.avatarUrl as String).trim(),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          const Icon(Icons.person_rounded, color: Colors.white, size: 18),
                    )
                  : const Icon(Icons.person_rounded, color: Colors.white, size: 18),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.name ?? context.tr('guest'),
                  style: AppTypography.bodySm.copyWith(
                    fontWeight: FontWeight.w600,
                    color: context.colors.onSurface,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  user?.isGuest == true
                      ? context.tr('limitedTrial')
                      : (user?.isPro == true ? context.tr('proMember') : context.tr('freePlan')),
                  style: AppTypography.labelCaps.copyWith(
                    color: context.colors.primary,
                    fontSize: 9,
                  ),
                ),
              ],
            ),
          ),
          if (showLogout)
            GestureDetector(
              onTap: () {
                AppModalDialog.showSignOutConfirmation(
                  context,
                  onConfirm: () {
                    ref.read(authProvider.notifier).signOut();
                    context.go(AppRoutes.landing);
                  },
                );
              },
              child: Container(
                width: 30,
                height: 30,
                decoration: BoxDecoration(
                  color: context.colors.errorRuby.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.logout_rounded, color: context.colors.errorRuby, size: 15),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Overlay Drawer — Mobile ───────────────────────────────────────────────────
class _AppDrawer extends ConsumerWidget {
  const _AppDrawer();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final location = GoRouterState.of(context).matchedLocation;

    return Drawer(
      width: 280,
      backgroundColor: context.colors.background.withValues(alpha: 0.98),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          // Drawer Header
          Container(
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16,
              left: 24,
              right: 16,
              bottom: 16,
            ),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: context.colors.glassBorder)),
            ),
            child: Row(
              children: [
                Text(
                  context.tr('menu'),
                  style: AppTypography.headlineSm.copyWith(
                    color: context.colors.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                AnimatedGlassIconButton(
                  icon: Icons.close_rounded,
                  size: 36,
                  iconSize: 18,
                  tooltip: context.tr('close'),
                  onPressed: () {
                    final scaffold = Scaffold.maybeOf(context);
                    if (scaffold != null && scaffold.isDrawerOpen) {
                      Navigator.of(context).pop();
                    }
                  },
                ),
              ],
            ),
          ),

          // Nav items
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              child: Column(
                children: _navItems.map((item) => _DrawerNavItem(
                  icon: item.icon,
                  activeIcon: item.activeIcon,
                  label: context.tr(item.labelKey),
                  route: item.route,
                  currentLocation: location,
                )).toList(),
              ),
            ),
          ),

          // Tour Guide button in Hamburger Menu
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: _AppTourButton(),
          ),
          const SizedBox(height: 6),

          // User profile card
          _UserProfileCard(user: user, showLogout: true),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 12),
        ],
      ),
    );
  }
}

// ── Drawer nav item ───────────────────────────────────────────────────────────
class _DrawerNavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String route;
  final String currentLocation;

  const _DrawerNavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.route,
    required this.currentLocation,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = currentLocation == route ||
        (route != AppRoutes.dashboard && currentLocation.startsWith('$route/'));

    return AnimatedContainer(
      duration: const Duration(milliseconds: 140),
      curve: Curves.easeOutCubic,
      margin: const EdgeInsets.only(bottom: 4),
      decoration: isActive
          ? BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  context.colors.primary.withValues(alpha: 0.20),
                  context.colors.primary.withValues(alpha: 0.08),
                ],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: context.colors.primary.withValues(alpha: 0.35)),
            )
          : BoxDecoration(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.transparent),
            ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          hoverColor: Colors.transparent,
          splashColor: context.colors.primary.withValues(alpha: 0.12),
          highlightColor: Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            final scaffold = Scaffold.maybeOf(context);
            if (scaffold != null && scaffold.isDrawerOpen) {
              Navigator.of(context).pop();
            }
            context.go(route);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Icon(
                  isActive ? activeIcon : icon,
                  color: isActive ? context.colors.primary : context.colors.onSurfaceVariant,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Text(
                  label,
                  style: AppTypography.bodyMd.copyWith(
                    color: isActive ? context.colors.primary : context.colors.onSurfaceVariant,
                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── App Tour Button (Sidebar & Hamburger Menu) ──────────────────────────────
class _AppTourButton extends ConsumerStatefulWidget {
  const _AppTourButton();

  @override
  ConsumerState<_AppTourButton> createState() => _AppTourButtonState();
}

class _AppTourButtonState extends ConsumerState<_AppTourButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 140),
        decoration: BoxDecoration(
          color: _isHovered
              ? context.colors.primary.withValues(alpha: 0.16)
              : context.colors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: _isHovered
                ? context.colors.primary.withValues(alpha: 0.50)
                : context.colors.primary.withValues(alpha: 0.25),
          ),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          child: InkWell(
            borderRadius: BorderRadius.circular(14),
            onTap: () {
              final scaffold = Scaffold.maybeOf(context);
              if (scaffold != null && scaffold.isDrawerOpen) {
                Navigator.of(context).pop();
              }
              ref.read(tourControllerProvider.notifier).startTour(0, true);
            },
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Row(
                children: [
                  Icon(
                    Icons.auto_awesome_rounded,
                    color: context.colors.primary,
                    size: 18,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      context.tr('appTour'),
                      style: AppTypography.bodySm.copyWith(
                        color: context.colors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    color: context.colors.primary.withValues(alpha: 0.60),
                    size: 16,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
