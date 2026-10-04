import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Style variants for the Netlink brand background
enum NetlinkBackgroundVariant {
  /// Hero composition for Landing screen with dual watermarks, constellation rings & grid
  landing,

  /// Clean, restrained watermark and ambient soft aura for AppShell & internal pages
  app,

  /// Focused watermark and aura for Auth screens (Sign In, Create Account)
  auth,
}

/// A high-performance, branded background widget that utilizes the Netlink logo
/// and network connectivity geometry as core design elements.
class NetlinkBackground extends StatelessWidget {
  final Widget? child;
  final NetlinkBackgroundVariant variant;
  final bool showGrid;
  final double? watermarkOpacityOverride;

  const NetlinkBackground({
    super.key,
    this.child,
    this.variant = NetlinkBackgroundVariant.app,
    this.showGrid = true,
    this.watermarkOpacityOverride,
  });

  /// Shorthand constructor for Landing screen background
  const NetlinkBackground.landing({
    super.key,
    this.child,
    this.showGrid = true,
    this.watermarkOpacityOverride,
  }) : variant = NetlinkBackgroundVariant.landing;

  /// Shorthand constructor for AppShell & global internal screens
  const NetlinkBackground.app({
    super.key,
    this.child,
    this.showGrid = false,
    this.watermarkOpacityOverride,
  }) : variant = NetlinkBackgroundVariant.app;

  /// Shorthand constructor for Auth screens
  const NetlinkBackground.auth({
    super.key,
    this.child,
    this.showGrid = true,
    this.watermarkOpacityOverride,
  }) : variant = NetlinkBackgroundVariant.auth;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = context.colors.background;

    final backgroundStack = RepaintBoundary(
      child: IgnorePointer(
        ignoring: true,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            final height = constraints.maxHeight;
            final isMobile = width < 768;
            final isTablet = width >= 768 && width < 1200;

            return Stack(
              clipBehavior: Clip.hardEdge,
              fit: StackFit.expand,
              children: [
                // ── 1. Base Midnight / Sunlight Canvas ───────────────────────
                ColoredBox(color: bgColor),

                // ── 2. Ambient Aura Field (Deep Cobalt & Violet) ────────────
                CustomPaint(
                  size: Size(width, height),
                  painter: _AmbientAuraPainter(
                    isDark: isDark,
                    variant: variant,
                  ),
                ),

                // ── 3. Subtle Dot Matrix & Constellation Links ──────────────
                if (showGrid)
                  CustomPaint(
                    size: Size(width, height),
                    painter: _ConstellationGridPainter(
                      isDark: isDark,
                      variant: variant,
                      width: width,
                      height: height,
                    ),
                  ),

                // ── 4. Primary Netlink Logo Watermark (Top Right) ───────────
                _buildPrimaryWatermark(
                  isDark: isDark,
                  isMobile: isMobile,
                  isTablet: isTablet,
                  width: width,
                  height: height,
                ),

                // ── 5. Secondary Counter-Balance Logo (Landing Variant) ─────
                if (variant == NetlinkBackgroundVariant.landing)
                  _buildSecondaryWatermark(
                    isDark: isDark,
                    isMobile: isMobile,
                    isTablet: isTablet,
                    width: width,
                    height: height,
                  ),
              ],
            );
          },
        ),
      ),
    );

    if (child == null) {
      return backgroundStack;
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        backgroundStack,
        RepaintBoundary(child: child!),
      ],
    );
  }

  Widget _buildPrimaryWatermark({
    required bool isDark,
    required bool isMobile,
    required bool isTablet,
    required double width,
    required double height,
  }) {
    final double logoSize;
    final double top;
    final double right;
    final double angle;
    final double defaultOpacity;

    switch (variant) {
      case NetlinkBackgroundVariant.landing:
        logoSize = isMobile ? 360.0 : (isTablet ? 480.0 : 620.0);
        top = isMobile ? -50.0 : (isTablet ? -60.0 : -80.0);
        right = isMobile ? -70.0 : (isTablet ? -90.0 : -110.0);
        angle = -12.0 * (math.pi / 180.0);
        defaultOpacity = isDark ? 0.065 : 0.045;
        break;

      case NetlinkBackgroundVariant.app:
        logoSize = isMobile ? 290.0 : (isTablet ? 380.0 : 490.0);
        top = isMobile ? -45.0 : (isTablet ? -55.0 : -70.0);
        right = isMobile ? -65.0 : (isTablet ? -80.0 : -95.0);
        angle = -10.0 * (math.pi / 180.0);
        defaultOpacity = isDark ? 0.042 : 0.028;
        break;

      case NetlinkBackgroundVariant.auth:
        logoSize = isMobile ? 320.0 : (isTablet ? 420.0 : 540.0);
        top = isMobile ? 20.0 : (isTablet ? 30.0 : 40.0);
        right = isMobile ? -70.0 : (isTablet ? -80.0 : -90.0);
        angle = -8.0 * (math.pi / 180.0);
        defaultOpacity = isDark ? 0.055 : 0.038;
        break;
    }

    final opacity = watermarkOpacityOverride ?? defaultOpacity;
    final assetPath = isDark
        ? 'assets/images/logo_icon.png'
        : 'assets/images/logo_icon_light.png';

    return Positioned(
      top: top,
      right: right,
      child: Transform.rotate(
        angle: angle,
        child: Opacity(
          opacity: opacity,
          child: Image.asset(
            assetPath,
            width: logoSize,
            height: logoSize,
            fit: BoxFit.contain,
            gaplessPlayback: true,
            errorBuilder: (_, __, ___) => const SizedBox.shrink(),
          ),
        ),
      ),
    );
  }

  Widget _buildSecondaryWatermark({
    required bool isDark,
    required bool isMobile,
    required bool isTablet,
    required double width,
    required double height,
  }) {
    final double logoSize = isMobile ? 210.0 : (isTablet ? 280.0 : 360.0);
    final double bottom = isMobile ? 60.0 : (isTablet ? 80.0 : 100.0);
    final double left = isMobile ? -60.0 : (isTablet ? -75.0 : -90.0);
    final double angle = 18.0 * (math.pi / 180.0);
    final double defaultOpacity = isDark ? 0.038 : 0.026;
    final opacity = watermarkOpacityOverride ?? defaultOpacity;
    final assetPath = isDark
        ? 'assets/images/logo_icon.png'
        : 'assets/images/logo_icon_light.png';

    return Positioned(
      bottom: bottom,
      left: left,
      child: Transform.rotate(
        angle: angle,
        child: Opacity(
          opacity: opacity,
          child: Image.asset(
            assetPath,
            width: logoSize,
            height: logoSize,
            fit: BoxFit.contain,
            gaplessPlayback: true,
            errorBuilder: (_, __, ___) => const SizedBox.shrink(),
          ),
        ),
      ),
    );
  }
}

/// Paints atmospheric deep ambient aura gradients behind the brand watermark
class _AmbientAuraPainter extends CustomPainter {
  final bool isDark;
  final NetlinkBackgroundVariant variant;

  const _AmbientAuraPainter({
    required this.isDark,
    required this.variant,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    if (w <= 0 || h <= 0) return;

    final maxDim = math.max(w, h);

    if (isDark) {
      // 1. Top-Right: Deep Cobalt Blue Aura
      final primaryAuraRadius = (maxDim * (variant == NetlinkBackgroundVariant.landing ? 0.45 : 0.38)).clamp(220.0, 750.0);
      final primaryPaint = Paint()
        ..shader = RadialGradient(
          colors: [
            const Color(0x351E40AF), // Deep rich blue
            const Color(0x181D4ED8),
            Colors.transparent,
          ],
          stops: const [0.0, 0.45, 1.0],
        ).createShader(Rect.fromCircle(
          center: Offset(w * 0.85, h * 0.12),
          radius: primaryAuraRadius,
        ));
      canvas.drawCircle(Offset(w * 0.85, h * 0.12), primaryAuraRadius, primaryPaint);

      // 2. Bottom-Left: Subtle Violet/Indigo Aura
      final secondaryAuraRadius = (maxDim * (variant == NetlinkBackgroundVariant.landing ? 0.42 : 0.35)).clamp(200.0, 680.0);
      final secondaryPaint = Paint()
        ..shader = RadialGradient(
          colors: [
            const Color(0x284C1D95), // Deep rich violet
            const Color(0x125B21B6),
            Colors.transparent,
          ],
          stops: const [0.0, 0.50, 1.0],
        ).createShader(Rect.fromCircle(
          center: Offset(w * 0.12, h * 0.78),
          radius: secondaryAuraRadius,
        ));
      canvas.drawCircle(Offset(w * 0.12, h * 0.78), secondaryAuraRadius, secondaryPaint);

      // 3. Center Subtle Network Tint for Landing
      if (variant == NetlinkBackgroundVariant.landing) {
        final centerRadius = (maxDim * 0.30).clamp(180.0, 480.0);
        final centerPaint = Paint()
          ..shader = RadialGradient(
            colors: [
              const Color(0x140284C7), // Sky/Cyan AI glow
              Colors.transparent,
            ],
          ).createShader(Rect.fromCircle(
            center: Offset(w * 0.50, h * 0.40),
            radius: centerRadius,
          ));
        canvas.drawCircle(Offset(w * 0.50, h * 0.40), centerRadius, centerPaint);
      }
    } else {
      // Light Mode: Clean, airy porcelain with soft pastel tints
      final primaryAuraRadius = (maxDim * 0.40).clamp(240.0, 680.0);
      final primaryPaint = Paint()
        ..shader = RadialGradient(
          colors: [
            const Color(0x38BFDBFE), // Soft blue tint
            const Color(0x18DBEAFE),
            Colors.transparent,
          ],
          stops: const [0.0, 0.45, 1.0],
        ).createShader(Rect.fromCircle(
          center: Offset(w * 0.85, h * 0.12),
          radius: primaryAuraRadius,
        ));
      canvas.drawCircle(Offset(w * 0.85, h * 0.12), primaryAuraRadius, primaryPaint);

      final secondaryAuraRadius = (maxDim * 0.35).clamp(200.0, 600.0);
      final secondaryPaint = Paint()
        ..shader = RadialGradient(
          colors: [
            const Color(0x25DDD6FE), // Soft violet tint
            const Color(0x10EDE9FE),
            Colors.transparent,
          ],
          stops: const [0.0, 0.50, 1.0],
        ).createShader(Rect.fromCircle(
          center: Offset(w * 0.12, h * 0.78),
          radius: secondaryAuraRadius,
        ));
      canvas.drawCircle(Offset(w * 0.12, h * 0.78), secondaryAuraRadius, secondaryPaint);
    }
  }

  @override
  bool shouldRepaint(_AmbientAuraPainter oldDelegate) =>
      oldDelegate.isDark != isDark || oldDelegate.variant != variant;
}

/// Paints subtle architectural grid lines, concentric watermark orbital rings,
/// and delicate constellation network nodes
class _ConstellationGridPainter extends CustomPainter {
  final bool isDark;
  final NetlinkBackgroundVariant variant;
  final double width;
  final double height;

  const _ConstellationGridPainter({
    required this.isDark,
    required this.variant,
    required this.width,
    required this.height,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    if (w <= 0 || h <= 0) return;

    // ── 1. Fine Architectural Grid ──────────────────────────────────────────
    final gridLineColor = isDark
        ? (variant == NetlinkBackgroundVariant.landing ? const Color(0x0AFFFFFF) : const Color(0x06FFFFFF))
        : const Color(0x08000000);

    final gridPaint = Paint()
      ..color = gridLineColor
      ..strokeWidth = 1.0;

    const step = 42.0;
    for (double x = 0; x <= w; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, h), gridPaint);
    }
    for (double y = 0; y <= h; y += step) {
      canvas.drawLine(Offset(0, y), Offset(w, y), gridPaint);
    }

    // ── 2. Concentric Orbital Rings centered on top-right logo watermark ────
    final logoCenter = Offset(w * 0.92, h * 0.08);
    final ringColor = isDark
        ? const Color(0x1260A5FA) // Faint blue line
        : const Color(0x0E2563EB);

    final ringPaint = Paint()
      ..color = ringColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final ringRadii = variant == NetlinkBackgroundVariant.landing
        ? [180.0, 320.0, 480.0, 680.0]
        : [220.0, 400.0];

    for (final r in ringRadii) {
      canvas.drawCircle(logoCenter, r, ringPaint);
    }

    // ── 3. Constellation Network Link Nodes & Arcs (Landing / Auth) ────────
    if (variant == NetlinkBackgroundVariant.landing) {
      final nodePaint = Paint()
        ..color = isDark ? const Color(0x3593C5FD) : const Color(0x253B82F6)
        ..style = PaintingStyle.fill;

      final linkPaint = Paint()
        ..color = isDark ? const Color(0x1860A5FA) : const Color(0x123B82F6)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;

      // Deterministic constellation nodes calculated along grid & orbital intersections
      final nodes = [
        Offset(logoCenter.dx - 180 * math.cos(0.4), logoCenter.dy + 180 * math.sin(0.4)),
        Offset(logoCenter.dx - 320 * math.cos(0.8), logoCenter.dy + 320 * math.sin(0.8)),
        Offset(logoCenter.dx - 320 * math.cos(0.25), logoCenter.dy + 320 * math.sin(0.25)),
        Offset(logoCenter.dx - 480 * math.cos(0.6), logoCenter.dy + 480 * math.sin(0.6)),
        Offset(logoCenter.dx - 480 * math.cos(1.05), logoCenter.dy + 480 * math.sin(1.05)),
      ];

      for (int i = 0; i < nodes.length - 1; i++) {
        canvas.drawLine(nodes[i], nodes[i + 1], linkPaint);
      }

      for (final n in nodes) {
        canvas.drawCircle(n, 2.5, nodePaint);
      }
    }
  }

  @override
  bool shouldRepaint(_ConstellationGridPainter oldDelegate) =>
      oldDelegate.isDark != isDark ||
      oldDelegate.variant != variant ||
      oldDelegate.width != width ||
      oldDelegate.height != height;
}
