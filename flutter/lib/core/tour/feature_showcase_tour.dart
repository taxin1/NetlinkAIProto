import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../router/app_router.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../widgets/app_modal_dialog.dart';
import '../localization/app_localizations.dart';
import 'tour_controller.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Feature Showcase Tour Overlay
//
// Optimized for low-end phones and web:
// 1. Lightweight cross-fade transitions between steps (zero 60fps timer overhead).
// 2. Exact bounding box measurements for each feature (no stale rect bleeding).
// 3. Crisp, non-blur card surfaces with clean drop shadows (zero GPU shader lag).
// 4. Directional pointer notch pointing right at the active feature.
// ─────────────────────────────────────────────────────────────────────────────

class FeatureShowcaseTourOverlay extends ConsumerStatefulWidget {
  const FeatureShowcaseTourOverlay({super.key});

  @override
  ConsumerState<FeatureShowcaseTourOverlay> createState() =>
      _FeatureShowcaseTourOverlayState();
}

class _FeatureShowcaseTourOverlayState
    extends ConsumerState<FeatureShowcaseTourOverlay>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  final FocusNode _focusNode = FocusNode();
  int _lastHandledStep = -1;
  bool _isFading = false;
  Rect? _targetRect;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeOutCubic,
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _fadeController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  void didChangeMetrics() {
    super.didChangeMetrics();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final step = ref.read(tourControllerProvider).currentStepItem;
      if (step.preferredPosition != TourPosition.center) {
        setState(() {
          _targetRect = _measureRect(step.targetKey);
        });
      } else {
        setState(() {});
      }
    });
  }

  Rect? _measureRect(GlobalKey? key) {
    if (key == null) return null;
    final ctx = key.currentContext;
    if (ctx == null) return null;
    final renderBox = ctx.findRenderObject() as RenderBox?;
    if (renderBox == null || !renderBox.hasSize) return null;
    final offset = renderBox.localToGlobal(Offset.zero);
    return offset & renderBox.size;
  }

  void _transitionToStep(int targetIdx) {
    if (_isFading) return;
    if (targetIdx < 0 || targetIdx >= appTourSteps.length) return;

    final targetStep = appTourSteps[targetIdx];
    String? curRoute;
    try {
      curRoute = GoRouterState.of(context).matchedLocation;
    } catch (_) {}

    final bool isCrossRoute = curRoute != null && curRoute != targetStep.targetRoute;

    // Smooth, gentle fade out (220ms) - keep _targetRect so window fades out in-place without shifting
    setState(() {
      _isFading = true;
    });

    if (isCrossRoute) {
      try {
        context.go(targetStep.targetRoute);
      } catch (_) {}

      // Wait for the smooth out-animation and new route to mount
      Future.delayed(const Duration(milliseconds: 250), () {
        if (!mounted) return;
        ref.read(tourControllerProvider.notifier).goToStep(targetIdx);

        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _locateTargetAndFadeIn(targetStep);
        });
      });
    } else {
      Future.delayed(const Duration(milliseconds: 220), () {
        if (!mounted) return;
        ref.read(tourControllerProvider.notifier).goToStep(targetIdx);

        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _locateTargetAndFadeIn(targetStep);
        });
      });
    }
  }

  void _locateTargetAndFadeIn(TourStepItem step) {
    final key = step.targetKey;
    if (key != null && key.currentContext != null) {
      Scrollable.ensureVisible(
        key.currentContext!,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        alignment: 0.35,
      );

      // Measure after ensureVisible settles
      Future.delayed(const Duration(milliseconds: 240), () {
        if (!mounted) return;
        setState(() {
          _targetRect = _measureRect(key);
          _isFading = false;
        });
      });
    } else {
      setState(() {
        _targetRect = (step.preferredPosition == TourPosition.center)
            ? null
            : _measureRect(key);
        _isFading = false;
      });
    }
  }

  void _checkInitialAutoNavigate(TourState tourState) {
    if (!tourState.isActive) return;

    if (_lastHandledStep != tourState.currentStep) {
      _lastHandledStep = tourState.currentStep;
      final step = tourState.currentStepItem;

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        try {
          final currentLocation = GoRouterState.of(context).matchedLocation;
          if (currentLocation != step.targetRoute) {
            context.go(step.targetRoute);
          }
        } catch (_) {}

        Future.delayed(const Duration(milliseconds: 180), () {
          if (!mounted) return;
          final key = step.targetKey;
          if (key != null && key.currentContext != null) {
            Scrollable.ensureVisible(
              key.currentContext!,
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              alignment: 0.35,
            );
          }
          setState(() {
            _targetRect = _measureRect(key);
            _isFading = false;
          });
        });
      });
    }
  }

  void _onNext() {
    if (_isFading) return;
    final tourState = ref.read(tourControllerProvider);
    if (tourState.currentStep < appTourSteps.length - 1) {
      _transitionToStep(tourState.currentStep + 1);
    } else {
      ref.read(tourControllerProvider.notifier).completeTour();
      try {
        context.go(AppRoutes.dashboard);
      } catch (_) {}
    }
  }

  void _onPrev() {
    if (_isFading) return;
    final tourState = ref.read(tourControllerProvider);
    if (tourState.currentStep > 0) {
      _transitionToStep(tourState.currentStep - 1);
    }
  }

  void _onGoToStep(int stepIdx) {
    if (_isFading) return;
    _transitionToStep(stepIdx);
  }

  @override
  Widget build(BuildContext context) {
    final tourState = ref.watch(tourControllerProvider);

    if (!tourState.isActive) {
      if (_fadeController.isCompleted) {
        _fadeController.reverse();
      }
      _lastHandledStep = -1;
      _targetRect = null;
      return const SizedBox.shrink();
    }

    _checkInitialAutoNavigate(tourState);

    if (!_fadeController.isCompleted && !_fadeController.isAnimating) {
      _fadeController.forward();
    }

    final step = tourState.currentStepItem;
    final bool isCenter = step.preferredPosition == TourPosition.center;
    if (!isCenter && !_isFading) {
      final dynamicRect = _measureRect(step.targetKey);
      if (dynamicRect != null) {
        _targetRect = dynamicRect;
      }
    }
    final activeRect = isCenter ? null : _targetRect;

    return Material(
      type: MaterialType.transparency,
      child: Focus(
        focusNode: _focusNode,
        autofocus: true,
        onKeyEvent: (node, event) {
          if (event is KeyDownEvent) {
            if (event.logicalKey == LogicalKeyboardKey.arrowRight ||
                event.logicalKey == LogicalKeyboardKey.space) {
              _onNext();
              return KeyEventResult.handled;
            } else if (event.logicalKey == LogicalKeyboardKey.arrowLeft) {
              _onPrev();
              return KeyEventResult.handled;
            } else if (event.logicalKey == LogicalKeyboardKey.escape) {
              ref.read(tourControllerProvider.notifier).skipTour();
              return KeyEventResult.handled;
            }
          }
          return KeyEventResult.ignored;
        },
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final screenSize = Size(constraints.maxWidth, constraints.maxHeight);

              return Stack(
                children: [
                  // ── 1. Spotlight Cutout Overlay Scrim ───────────────────
                  // Always stays dark & dull throughout the guide (no blinding flash!)
                  Positioned.fill(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: _onNext,
                      child: CustomPaint(
                        painter: _SpotlightPainter(
                          targetRect: _isFading ? null : activeRect,
                        ),
                      ),
                    ),
                  ),

                  // ── 2. Compact Tooltip Window Right Near the Feature ────
                  _buildCompactTooltip(
                    context,
                    screenSize: screenSize,
                    targetRect: activeRect,
                    step: step,
                    tourState: tourState,
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildCompactTooltip(
    BuildContext context, {
    required Size screenSize,
    required Rect? targetRect,
    required TourStepItem step,
    required TourState tourState,
  }) {
    const double tooltipHeightEst = 220;
    final bool isCenter = step.preferredPosition == TourPosition.center || targetRect == null;

    final double actualTooltipWidth = 350.0.clamp(280.0, (screenSize.width - 32.0).clamp(280.0, double.infinity));
    double maxLeft = screenSize.width - actualTooltipWidth - 16.0;
    if (maxLeft < 16.0) maxLeft = 16.0;

    double left;
    double top;
    bool placeAbove = false;

    if (isCenter) {
      left = ((screenSize.width - actualTooltipWidth) / 2).clamp(16.0, maxLeft);
      top = ((screenSize.height - tooltipHeightEst) / 2).clamp(16.0, screenSize.height - tooltipHeightEst - 16.0);
    } else {
      left = (targetRect.center.dx - (actualTooltipWidth / 2)).clamp(16.0, maxLeft);

      final spaceBelow = screenSize.height - targetRect.bottom;
      final spaceAbove = targetRect.top;
      placeAbove = (step.preferredPosition == TourPosition.top) ||
          (spaceBelow < tooltipHeightEst + 24 && spaceAbove > spaceBelow);

      double maxTop = screenSize.height - tooltipHeightEst - 16.0;
      if (maxTop < 16.0) maxTop = 16.0;

      top = placeAbove
          ? (targetRect.top - tooltipHeightEst - 14).clamp(16.0, maxTop)
          : (targetRect.bottom + 14).clamp(16.0, maxTop);
    }

    return Positioned(
      left: left,
      top: top,
      width: actualTooltipWidth,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeInOutCubic,
        opacity: _isFading ? 0.0 : 1.0,
        child: AnimatedScale(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeInOutCubic,
          scale: _isFading ? 0.95 : 1.0,
          child: _CompactTooltipCard(
            step: step,
            tourState: tourState,
            notchDirection: isCenter
                ? null
                : (placeAbove ? _NotchDirection.bottom : _NotchDirection.top),
            targetCenterX: isCenter ? null : targetRect.center.dx - left,
            onNext: _onNext,
            onPrev: _onPrev,
            onGoToStep: _onGoToStep,
            onSkip: () => ref.read(tourControllerProvider.notifier).skipTour(),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Spotlight Scrim Painter (Smooth difference cutout)
// ─────────────────────────────────────────────────────────────────────────────

class _SpotlightPainter extends CustomPainter {
  final Rect? targetRect;

  const _SpotlightPainter({
    required this.targetRect,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = targetRect;

    if (rect == null || rect.width <= 1.0 || rect.height <= 1.0) {
      // General clean backdrop dimming if target is not measured or in center mode
      canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height),
        Paint()..color = Colors.black.withValues(alpha: 0.72),
      );
      return;
    }

    // 1. Dark scrim layer with transparent cutout around target card
    final scrimPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.72)
      ..style = PaintingStyle.fill;

    final targetRRect = RRect.fromRectAndRadius(
      rect.inflate(6),
      const Radius.circular(16),
    );

    final path = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(targetRRect);

    canvas.drawPath(path, scrimPaint);

    // 2. Static subtle outline around the cutout (neutral, non-distracting)
    final borderPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawRRect(targetRRect, borderPaint);
  }

  @override
  bool shouldRepaint(_SpotlightPainter old) => old.targetRect != targetRect;
}

// ─────────────────────────────────────────────────────────────────────────────
// Directional Notch Pointer
// ─────────────────────────────────────────────────────────────────────────────

enum _NotchDirection { top, bottom }

// ─────────────────────────────────────────────────────────────────────────────
// Compact Intuitive Tooltip Card (Zero-Blur, High-Performance)
// ─────────────────────────────────────────────────────────────────────────────

class _CompactTooltipCard extends StatelessWidget {
  final TourStepItem step;
  final TourState tourState;
  final _NotchDirection? notchDirection;
  final double? targetCenterX;
  final VoidCallback onNext;
  final VoidCallback onPrev;
  final ValueChanged<int> onGoToStep;
  final VoidCallback onSkip;

  const _CompactTooltipCard({
    required this.step,
    required this.tourState,
    this.notchDirection,
    this.targetCenterX,
    required this.onNext,
    required this.onPrev,
    required this.onGoToStep,
    required this.onSkip,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardBgColor = isDark ? const Color(0xFF1B2436) : Colors.white;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Top Pointer Notch
        if (notchDirection == _NotchDirection.top)
          Padding(
            padding: EdgeInsets.only(left: (targetCenterX ?? 40).clamp(24.0, 310.0) - 8),
            child: CustomPaint(
              size: const Size(16, 9),
              painter: _TriangleNotchPainter(
                color: cardBgColor,
                borderColor: colors.outline.withValues(alpha: 0.20),
                isPointingUp: true,
              ),
            ),
          ),

        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              decoration: BoxDecoration(
                color: cardBgColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: colors.outline.withValues(alpha: 0.20),
                  width: 1.0,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.15),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Header Row: Title & Close Button ──────────────────────
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Text(
                          context.tr('tour_${step.id.replaceAll('-', '_')}_title'),
                          style: AppTypography.bodyMd.copyWith(
                            color: colors.onSurface,
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: onSkip,
                        child: Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(
                            color: colors.onSurface.withValues(alpha: 0.08),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.close_rounded,
                            size: 14,
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // ── Description ───────────────────────────────────────────
                  Text(
                    context.tr('tour_${step.id.replaceAll('-', '_')}_desc'),
                    style: AppTypography.bodySm.copyWith(
                      color: colors.onSurfaceVariant,
                      height: 1.45,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // ── Progress Dots ─────────────────────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(tourState.totalSteps, (idx) {
                      final isCur = idx == tourState.currentStep;
                      return InkWell(
                        borderRadius: BorderRadius.circular(99),
                        onTap: () => onGoToStep(idx),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          curve: Curves.easeOutCubic,
                          margin: const EdgeInsets.symmetric(horizontal: 2.5),
                          height: 4,
                          width: isCur ? 16 : 4,
                          decoration: BoxDecoration(
                            color: isCur ? colors.primary : colors.onSurface.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 14),

                  // ── Action Buttons ────────────────────────────────────────
                  Row(
                    children: [
                      Expanded(
                        child: ModalSecondaryButton(
                          label: tourState.isFirstStep ? context.tr('tourSkip') : context.tr('tourPrev'),
                          icon: tourState.isFirstStep ? null : Icons.chevron_left_rounded,
                          height: 38,
                          fontSize: 13,
                          onPressed: tourState.isFirstStep ? onSkip : onPrev,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ModalPrimaryButton(
                          label: tourState.isLastStep ? context.tr('tourFinish') : context.tr('tourNext'),
                          icon: tourState.isLastStep ? null : Icons.chevron_right_rounded,
                          height: 38,
                          fontSize: 13,
                          onPressed: onNext,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),

        // Bottom Pointer Notch
        if (notchDirection == _NotchDirection.bottom)
          Padding(
            padding: EdgeInsets.only(left: (targetCenterX ?? 40).clamp(24.0, 310.0) - 8),
            child: CustomPaint(
              size: const Size(16, 9),
              painter: _TriangleNotchPainter(
                color: cardBgColor,
                borderColor: colors.outline.withValues(alpha: 0.20),
                isPointingUp: false,
              ),
            ),
          ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Triangle Notch Painter
// ─────────────────────────────────────────────────────────────────────────────

class _TriangleNotchPainter extends CustomPainter {
  final Color color;
  final Color borderColor;
  final bool isPointingUp;

  const _TriangleNotchPainter({
    required this.color,
    required this.borderColor,
    required this.isPointingUp,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path();
    if (isPointingUp) {
      path.moveTo(0, size.height);
      path.lineTo(size.width / 2, 0);
      path.lineTo(size.width, size.height);
      path.close();
    } else {
      path.moveTo(0, 0);
      path.lineTo(size.width / 2, size.height);
      path.lineTo(size.width, 0);
      path.close();
    }

    final fillPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final strokePaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    canvas.drawPath(path, fillPaint);
    canvas.drawPath(path, strokePaint);
  }

  @override
  bool shouldRepaint(_TriangleNotchPainter old) =>
      old.color != color || old.borderColor != borderColor;
}
