import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Elevated liquid frosted glass card using GPU gradients & optional BackdropFilter blur
class GlassCard extends StatefulWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius? borderRadius;
  final Color? glowColor;
  final Color? tintColor;
  final double blurSigma;
  final bool useBlur;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(20),
    this.borderRadius,
    this.glowColor,
    this.tintColor,
    this.blurSigma = 12,
    this.useBlur = false,
    this.onTap,
  });

  @override
  State<GlassCard> createState() => _GlassCardState();
}

class _GlassCardState extends State<GlassCard> {
  bool _isPressed = false;
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final radius = widget.borderRadius ?? BorderRadius.circular(24);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final accent = widget.tintColor ?? widget.glowColor;
    final isInteractive = widget.onTap != null;
    final defaultGlow = context.colors.primary;
    final effectiveGlowColor = widget.glowColor ?? defaultGlow;

    Widget cardContent = AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      decoration: BoxDecoration(
        borderRadius: radius,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          stops: const [0.0, 0.5, 1.0],
          colors: isDark
              ? [
                  Color(_isHovered ? 0x331E2A3C : 0x28172130),
                  accent != null
                      ? accent.withValues(alpha: _isHovered ? 0.22 : 0.16)
                      : Color(_isHovered ? 0x24172130 : 0x1C111A26),
                  accent != null
                      ? accent.withValues(alpha: _isHovered ? 0.32 : 0.24)
                      : Color(_isHovered ? 0x1A111A26 : 0x140B121C),
                ]
              : [
                  Color(_isHovered ? 0xFFFFFFFF : 0xF6FFFFFF),
                  accent != null
                      ? accent.withValues(alpha: _isHovered ? 0.18 : 0.12)
                      : Color(_isHovered ? 0xEFF7FAFF : 0xE8F5F8FC),
                  accent != null
                      ? accent.withValues(alpha: _isHovered ? 0.24 : 0.18)
                      : Color(_isHovered ? 0xD8EEF4FC : 0xD0ECF2FA),
                ],
        ),
        border: Border.all(
          color: isDark
              ? (accent != null
                  ? accent.withValues(alpha: _isHovered || _isPressed ? 0.55 : 0.35)
                  : (_isHovered || _isPressed
                      ? (isInteractive ? defaultGlow.withValues(alpha: 0.50) : const Color(0x55FFFFFF))
                      : const Color(0x2BFFFFFF)))
              : (accent != null
                  ? accent.withValues(alpha: _isHovered || _isPressed ? 0.60 : 0.40)
                  : (_isHovered || _isPressed
                      ? (isInteractive ? defaultGlow.withValues(alpha: 0.55) : const Color(0xF0FFFFFF))
                      : const Color(0xD0FFFFFF))),
          width: _isHovered || _isPressed ? 1.5 : 1.2,
        ),
      ),
      child: Padding(
        padding: widget.padding,
        child: widget.child,
      ),
    );

    Widget cardBody = RepaintBoundary(
      child: Container(
        decoration: BoxDecoration(
          borderRadius: radius,
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withValues(alpha: _isPressed ? 0.25 : (_isHovered ? 0.45 : 0.35))
                  : const Color(0x140B1A3A),
              blurRadius: _isPressed ? 8 : (_isHovered ? 20 : 14),
              spreadRadius: 0,
              offset: Offset(0, _isPressed ? 2 : (_isHovered ? 8 : 5)),
            ),
            if (widget.glowColor != null || _isHovered)
              BoxShadow(
                color: effectiveGlowColor.withValues(
                  alpha: isDark
                      ? (_isPressed ? 0.08 : (_isHovered ? 0.22 : 0.10))
                      : (_isHovered ? 0.16 : 0.06),
                ),
                blurRadius: _isHovered ? 18 : 10,
                spreadRadius: _isHovered ? -2 : -4,
                offset: const Offset(0, 3),
              ),
          ],
        ),
        child: ClipRRect(
          borderRadius: radius,
          child: widget.useBlur
              ? BackdropFilter(
                  filter: ImageFilter.blur(
                    sigmaX: widget.blurSigma.clamp(4, 12),
                    sigmaY: widget.blurSigma.clamp(4, 12),
                  ),
                  child: cardContent,
                )
              : cardContent,
        ),
      ),
    );

    if (!isInteractive) {
      return cardBody;
    }

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) {
          setState(() => _isPressed = false);
          widget.onTap!();
        },
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedScale(
          scale: _isPressed ? 0.985 : 1.0,
          duration: const Duration(milliseconds: 140),
          curve: Curves.easeOutCubic,
          child: cardBody,
        ),
      ),
    );
  }
}
