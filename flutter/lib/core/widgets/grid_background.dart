import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Subtle dot grid background painter (matches bg-grid-pattern CSS)
class GridBackgroundPainter extends CustomPainter {
  final Color lineColor;
  final double gridSize;

  const GridBackgroundPainter({
    this.lineColor = const Color(0x08FFFFFF),
    this.gridSize = 40,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = lineColor
      ..strokeWidth = 1;

    // Vertical lines
    for (double x = 0; x <= size.width; x += gridSize) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    // Horizontal lines
    for (double y = 0; y <= size.height; y += gridSize) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(GridBackgroundPainter oldDelegate) => false;
}

/// Animated background with grid + pulsing ambient glows
class GridBackground extends StatefulWidget {
  final Widget child;
  final List<Color>? gradientColors;

  const GridBackground({
    super.key,
    required this.child,
    this.gradientColors,
  });

  @override
  State<GridBackground> createState() => _GridBackgroundState();
}

class _GridBackgroundState extends State<GridBackground>
    with TickerProviderStateMixin {
  late AnimationController _ctrl1;
  late AnimationController _ctrl2;

  @override
  void initState() {
    super.initState();
    _ctrl1 = AnimationController(vsync: this, duration: const Duration(seconds: 9))
      ..repeat(reverse: true);
    _ctrl2 = AnimationController(vsync: this, duration: const Duration(seconds: 13))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl1.dispose();
    _ctrl2.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final gridLineColor = isDark ? const Color(0x08FFFFFF) : const Color(0x08000000);

    return Stack(
      children: [
        // Base midnight gradient
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: widget.gradientColors ?? context.colors.midnightGradient,
              ),
            ),
          ),
        ),
        // Grid pattern
        Positioned.fill(
          child: CustomPaint(
            painter: GridBackgroundPainter(lineColor: gridLineColor),
          ),
        ),
        // Ambient glows & grid wrapped in RepaintBoundary
        RepaintBoundary(
          child: Stack(
            children: [
              AnimatedBuilder(
                animation: _ctrl1,
                builder: (context, _) => Positioned(
                  top: -80 + _ctrl1.value * 40,
                  left: -120 + _ctrl1.value * 60,
                  child: Container(
                    width: 380 + _ctrl1.value * 40,
                    height: 380 + _ctrl1.value * 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          context.colors.glowPrimary,
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              AnimatedBuilder(
                animation: _ctrl2,
                builder: (context, _) => Positioned(
                  bottom: -80 + _ctrl2.value * 50,
                  right: -120 + _ctrl2.value * 60,
                  child: Container(
                    width: 380 + _ctrl2.value * 60,
                    height: 380 + _ctrl2.value * 60,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          context.colors.glowSecondary,
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        // Screen Content (isolated from background repaints)
        RepaintBoundary(
          child: widget.child,
        ),
      ],
    );
  }
}
