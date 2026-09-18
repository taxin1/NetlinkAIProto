import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cobe_flutter/cobe_flutter.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../../../core/widgets/netlink_logo.dart';
import '../../../core/services/supabase_service.dart';
import '../../auth/providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late CobeController _globeController;

  // Earth smooth entrance
  late AnimationController _earthController;
  late Animation<double> _earthOpacity;

  // Logo smooth sequential entrance
  late AnimationController _logoController;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;

  // Ambient pulse ring
  late AnimationController _pulseController;

  // Curated static network markers on the globe
  final List<CobeLocation> _nodes = const [
    CobeLocation(40.7128, -74.0060),   // New York
    CobeLocation(51.5074, -0.1278),    // London
    CobeLocation(48.8566, 2.3522),     // Paris
    CobeLocation(35.6762, 139.6503),   // Tokyo
    CobeLocation(-33.8688, 151.2093),  // Sydney
    CobeLocation(1.3521, 103.8198),    // Singapore
    CobeLocation(19.0760, 72.8777),    // Mumbai
    CobeLocation(-23.5505, -46.6333),  // São Paulo
    CobeLocation(37.7749, -122.4194),  // San Francisco
  ];

  @override
  void initState() {
    super.initState();

    final staticMarkers = _nodes
        .map((n) => CobeMarker(location: n, size: 0.035))
        .toList();

    _globeController = CobeController(
      CobeOptions(
        width: 550,
        height: 550,
        phi: 0.5,
        theta: 0.25,
        mapSamples: 16000,
        mapBrightness: 6.0,
        baseColor: const Color(0xFF070D1C),
        markerColor: AppColorsLight.primaryFixed,
        glowColor: AppColorsLight.primaryFixed,
        arcColor: Colors.transparent,
        diffuse: 1.2,
        dark: 1.0,
        scale: 0.55,
        markers: staticMarkers,
      ),
    );

    // ── Earth smooth fade entrance
    _earthController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _earthOpacity = CurvedAnimation(
      parent: _earthController,
      curve: Curves.easeInCubic,
    );
    _earthController.forward();

    // ── Logo entrance (fades in gracefully after earth begins loading)
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 850),
    );
    _logoScale = Tween<double>(begin: 0.90, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: Curves.easeOutBack,
      ),
    );
    _logoOpacity = CurvedAnimation(
      parent: _logoController,
      curve: Curves.easeOutCubic,
    );

    Future.delayed(const Duration(milliseconds: 650), () {
      if (mounted) _logoController.forward();
    });

    // ── Ambient ring pulse
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();

    // Navigate after sequential reveal settles
    Future.delayed(const Duration(milliseconds: 2700), () {
      if (!mounted) return;
      final authState = ref.read(authProvider);
      final hasSession = SupabaseService.currentSession != null;
      if (authState.isAuthenticated || hasSession) {
        context.go(AppRoutes.dashboard);
      } else {
        context.go(AppRoutes.landing);
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final isLight = Theme.of(context).brightness == Brightness.light;
    _globeController.update(CobeOptionsPatch(
      baseColor: isLight ? const Color(0x00FFFFFF) : const Color(0xFF070D1C),
      markerColor: isLight ? const Color(0xFF0F172A) : AppColorsLight.primaryFixed,
      glowColor: isLight ? const Color(0xFF1E3A8A) : AppColorsLight.primaryFixed,
      dark: isLight ? 0.0 : 1.0,
      mapBrightness: isLight ? 10.0 : 6.0,
    ));
  }

  @override
  void dispose() {
    _globeController.dispose();
    _earthController.dispose();
    _logoController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isLight = Theme.of(context).brightness == Brightness.light;

    return Scaffold(
      backgroundColor: isLight ? const Color(0xFFF0F4FF) : const Color(0xFF070D1C),
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Background gradient ──────────────────────────────────────────────
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(0.0, 0.15),
                  radius: 1.2,
                  colors: isLight
                      ? const [
                          Color(0xFFDDE8FF),
                          Color(0xFFECF1FF),
                          Color(0xFFF5F7FF),
                        ]
                      : const [
                          Color(0xFF0B1530),
                          Color(0xFF060C1A),
                          Color(0xFF020408),
                        ],
                  stops: const [0.0, 0.5, 1.0],
                ),
              ),
            ),
          ),

          // ── Ambient top-right glow ─────────────────────────────────────────
          Positioned(
            top: -size.height * 0.25,
            right: -size.width * 0.3,
            child: _AnimatedGlowOrb(
              controller: _pulseController,
              baseRadius: size.width * 0.7,
              color: isLight ? const Color(0x203B6EFF) : const Color(0x143B6EFF),
            ),
          ),

          // ── Ambient bottom-left glow ──────────────────────────────────────
          Positioned(
            bottom: -size.height * 0.2,
            left: -size.width * 0.3,
            child: _AnimatedGlowOrb(
              controller: _pulseController,
              baseRadius: size.width * 0.6,
              color: isLight ? const Color(0x126A20D0) : const Color(0x0E6A20D0),
              phaseOffset: 0.5,
            ),
          ),

          // ── 3D Globe with smooth fade entrance ──────────────────────────────
          Positioned.fill(
            child: Center(
              child: FadeTransition(
                opacity: _earthOpacity,
                child: CobeGlobe(
                  controller: _globeController,
                  autoRotateSpeed: 0.5,
                ),
              ),
            ),
          ),

          // ── Radial glow behind logo (fades in with logo) ───────────────────
          Center(
            child: FadeTransition(
              opacity: _logoOpacity,
              child: Container(
                width: 320,
                height: 320,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      isLight
                          ? const Color(0x280066FF)
                          : const Color(0x330055FF),
                      isLight
                          ? const Color(0x1500E5FF)
                          : const Color(0x1C00E5FF),
                      Colors.transparent,
                    ],
                    stops: const [0.0, 0.5, 1.0],
                  ),
                ),
              ),
            ),
          ),

          // ── Pulse ring ─────────────────────────────────────────────────────
          Center(
            child: FadeTransition(
              opacity: _earthOpacity,
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, _) {
                  final pulse = math.sin(_pulseController.value * math.pi * 2);
                  final rimAlpha = 0.10 + 0.07 * (pulse + 1) / 2;
                  return Container(
                    width: 210 + pulse * 14,
                    height: 210 + pulse * 14,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF2B5EFF).withValues(alpha: rimAlpha),
                        width: 1.2,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // ── Logo fade-in ───────────────────────────────────────────────────
          Center(
            child: FadeTransition(
              opacity: _logoOpacity,
              child: ScaleTransition(
                scale: _logoScale,
                child: const NetlinkLogo(size: 220, showText: true),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Ambient glowing orb that subtly breathes in and out
class _AnimatedGlowOrb extends StatelessWidget {
  final AnimationController controller;
  final double baseRadius;
  final Color color;
  final double phaseOffset;

  const _AnimatedGlowOrb({
    required this.controller,
    required this.baseRadius,
    required this.color,
    this.phaseOffset = 0.0,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (_, __) {
        final phase = (controller.value + phaseOffset) % 1.0;
        final pulse = math.sin(phase * math.pi * 2);
        final r = baseRadius + pulse * baseRadius * 0.06;
        return Container(
          width: r * 2,
          height: r * 2,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [color, Colors.transparent],
            ),
          ),
        );
      },
    );
  }
}
