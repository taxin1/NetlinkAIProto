import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Primary CTA -- vivid 3D gradient pill button with liquid glass spring scale & drop shadow elevation
class GradientButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final double height;
  final IconData? icon;
  final double? width;
  final double maxWidth;
  final double? fontSize;
  final double? iconSize;
  final bool expand;

  const GradientButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.height = 48,
    this.icon,
    this.width,
    this.maxWidth = 260,
    this.fontSize,
    this.iconSize,
    this.expand = true,
  });

  @override
  State<GradientButton> createState() => _GradientButtonState();
}

class _GradientButtonState extends State<GradientButton> {
  bool _isPressed = false;
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final effectiveMaxWidth = widget.width ?? widget.maxWidth;
    final defaultMinWidth = widget.height <= 34 ? 80.0 : (widget.height <= 40 ? 100.0 : 140.0);
    final effectiveMinWidth = widget.width != null
        ? widget.width!
        : (defaultMinWidth > effectiveMaxWidth ? effectiveMaxWidth : defaultMinWidth);

    final effectiveFontSize = widget.fontSize ??
        (widget.height <= 34 ? 12.0 : (widget.height <= 40 ? 13.0 : 15.0));
    final effectiveIconSize = widget.iconSize ??
        (widget.height <= 34 ? 14.0 : (widget.height <= 40 ? 16.0 : 19.0));
    final gapWidth = widget.height <= 34 ? 5.0 : 8.0;

    final shouldExpand = widget.expand && widget.width == null;

    final buttonContent = ConstrainedBox(
      constraints: BoxConstraints(
        maxWidth: effectiveMaxWidth,
        minWidth: effectiveMinWidth,
      ),
      child: MouseRegion(
        onEnter: (_) => setState(() => _isHovered = true),
        onExit: (_) => setState(() => _isHovered = false),
        child: GestureDetector(
          onTapDown: (_) => setState(() => _isPressed = true),
          onTapUp: (_) {
            setState(() => _isPressed = false);
            if (!widget.isLoading && widget.onPressed != null) {
              widget.onPressed!();
            }
          },
          onTapCancel: () => setState(() => _isPressed = false),
          child: AnimatedScale(
            scale: _isPressed ? 0.94 : (_isHovered ? 1.03 : 1.0),
            duration: const Duration(milliseconds: 120),
            curve: Curves.easeOutCubic,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: widget.width ?? double.infinity,
              height: widget.height,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: colors.primaryButtonGradient,
                ),
                borderRadius: BorderRadius.circular(99),
                border: Border.all(
                  color: _isHovered || _isPressed
                      ? Colors.white.withValues(alpha: 0.60)
                      : Colors.white.withValues(alpha: 0.30),
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: colors.glowBlue.withValues(alpha: _isPressed ? 0.25 : (_isHovered ? 0.55 : 0.40)),
                    blurRadius: _isPressed ? 10 : (_isHovered ? 32 : 24),
                    spreadRadius: _isPressed ? -4 : (_isHovered ? 0 : -2),
                    offset: Offset(0, _isPressed ? 2 : (_isHovered ? 8 : 6)),
                  ),
                  BoxShadow(
                    color: colors.primaryButtonGradient.first.withValues(alpha: isDark ? 0.30 : 0.20),
                    blurRadius: _isPressed ? 6 : (_isHovered ? 16 : 10),
                    offset: Offset(0, _isPressed ? 1 : (_isHovered ? 4 : 2)),
                  ),
                ],
              ),
              child: Center(
                child: widget.isLoading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2.5,
                        ),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (widget.icon != null) ...[
                            Icon(widget.icon, color: Colors.white, size: effectiveIconSize),
                            SizedBox(width: gapWidth),
                          ],
                          Flexible(
                            child: Text(
                              widget.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTypography.bodyMd.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: effectiveFontSize,
                                letterSpacing: -0.2,
                              ),
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ),
      ),
    );

    return shouldExpand ? Center(child: buttonContent) : buttonContent;
  }
}

/// Liquid Glass pill button -- frosted glass with 3D sheen & dynamic specular highlight
class LiquidGlassButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final double height;
  final double blurSigma;
  final double? width;
  final double maxWidth;
  final double? minWidth;
  final EdgeInsetsGeometry? padding;
  final bool expand;
  final double? fontSize;
  final double? iconSize;

  const LiquidGlassButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.height = 48,
    this.blurSigma = 20,
    this.width,
    this.maxWidth = 260,
    this.minWidth,
    this.padding,
    this.expand = true,
    this.fontSize,
    this.iconSize,
  });

  @override
  State<LiquidGlassButton> createState() => _LiquidGlassButtonState();
}

class _LiquidGlassButtonState extends State<LiquidGlassButton> {
  bool _isPressed = false;
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = context.colors;
    final isEnabled = widget.onPressed != null && !widget.isLoading;

    final effectiveMaxWidth = widget.width ?? widget.maxWidth;
    final defaultMinWidth = widget.height <= 34 ? 80.0 : (widget.height <= 40 ? 100.0 : 140.0);
    final effectiveMinWidth = widget.width != null
        ? widget.width!
        : (widget.minWidth ??
            (widget.expand
                ? (defaultMinWidth > effectiveMaxWidth ? effectiveMaxWidth : defaultMinWidth)
                : 0.0));

    final effectiveFontSize = widget.fontSize ??
        (widget.height <= 34 ? 12.0 : (widget.height <= 40 ? 13.0 : 15.0));
    final effectiveIconSize = widget.iconSize ??
        (widget.height <= 34 ? 14.0 : (widget.height <= 40 ? 16.0 : 19.0));
    final gapWidth = widget.height <= 34 ? 5.0 : 8.0;

    final buttonContent = MouseRegion(
      cursor: isEnabled ? SystemMouseCursors.click : SystemMouseCursors.basic,
      onEnter: (_) {
        if (isEnabled) setState(() => _isHovered = true);
      },
      onExit: (_) {
        if (isEnabled) setState(() => _isHovered = false);
      },
      child: GestureDetector(
        onTapDown: (_) {
          if (isEnabled) setState(() => _isPressed = true);
        },
        onTapUp: (_) {
          if (isEnabled) {
            setState(() => _isPressed = false);
            widget.onPressed!();
          }
        },
        onTapCancel: () {
          if (isEnabled) setState(() => _isPressed = false);
        },
        child: AnimatedScale(
          scale: isEnabled ? (_isPressed ? 0.94 : (_isHovered ? 1.03 : 1.0)) : 1.0,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOutCubic,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 150),
            opacity: isEnabled ? 1.0 : 0.45,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: widget.expand ? (widget.width ?? double.infinity) : widget.width,
              height: widget.height,
              padding: widget.padding ?? (widget.expand ? null : const EdgeInsets.symmetric(horizontal: 14)),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(99),
                boxShadow: isEnabled
                    ? [
                        BoxShadow(
                          color: isDark
                              ? Colors.black.withValues(alpha: _isPressed ? 0.20 : (_isHovered ? 0.50 : 0.35))
                              : const Color(0x180B1A3A),
                          blurRadius: _isPressed ? 8 : (_isHovered ? 24 : 16),
                          spreadRadius: 0,
                          offset: Offset(0, _isPressed ? 2 : (_isHovered ? 8 : 6)),
                        ),
                        if (isDark || _isHovered)
                          BoxShadow(
                            color: colors.primary.withValues(alpha: _isPressed ? 0.15 : (_isHovered ? 0.35 : 0.20)),
                            blurRadius: _isHovered ? 28 : 20,
                            spreadRadius: _isHovered ? -2 : -4,
                            offset: Offset(0, _isHovered ? 4 : 2),
                          ),
                      ]
                    : null,
              ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(99),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(
                      sigmaX: widget.blurSigma,
                      sigmaY: widget.blurSigma,
                    ),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          stops: const [0.0, 0.4, 1.0],
                          colors: isDark
                              ? [
                                  Color(_isHovered ? 0x50FFFFFF : 0x38FFFFFF),
                                  Color(_isHovered ? 0x20FFFFFF : 0x12FFFFFF),
                                  Color(_isHovered ? 0x207EB0FF : 0x0A1C3A80),
                                ]
                              : [
                                  Color(_isHovered ? 0xFFFFFFFF : 0xF4FFFFFF),
                                  Color(_isHovered ? 0xE8F0F5FF : 0xD0F0F5FF),
                                  Color(_isHovered ? 0xB0AACCFF : 0x90AACCFF),
                                ],
                        ),
                        borderRadius: BorderRadius.circular(99),
                        border: Border.all(
                          color: _isHovered || _isPressed
                              ? colors.primary.withValues(alpha: 0.60)
                              : (isDark ? const Color(0x4DFFFFFF) : const Color(0xE0FFFFFF)),
                          width: 1.2,
                        ),
                      ),
                      child: Center(
                        widthFactor: widget.expand ? null : 1.0,
                        child: widget.isLoading
                            ? SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  color: colors.onSurface,
                                  strokeWidth: 2.5,
                                ),
                              )
                            : Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (widget.icon != null) ...[
                                    Icon(
                                      widget.icon,
                                      color: _isHovered || _isPressed ? colors.primary : colors.onSurface,
                                      size: effectiveIconSize,
                                    ),
                                    SizedBox(width: gapWidth),
                                  ],
                                  Flexible(
                                    child: Text(
                                      widget.label,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: AppTypography.bodyMd.copyWith(
                                        color: _isHovered || _isPressed ? colors.primary : colors.onSurface,
                                        fontWeight: FontWeight.w600,
                                        fontSize: effectiveFontSize,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ),
    );

    final shouldExpand = widget.expand && widget.width == null;
    return shouldExpand
        ? Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(
                maxWidth: effectiveMaxWidth,
                minWidth: effectiveMinWidth,
              ),
              child: buttonContent,
            ),
          )
        : ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: effectiveMaxWidth,
              minWidth: effectiveMinWidth,
            ),
            child: buttonContent,
          );
  }
}

/// Compact Neon Gradient Button
class NeonGradientButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final double height;

  const NeonGradientButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.height = 44,
  });

  @override
  Widget build(BuildContext context) {
    return GradientButton(
      label: label,
      onPressed: onPressed,
      isLoading: isLoading,
      height: height,
      icon: icon,
      maxWidth: 240,
    );
  }
}

/// GhostButton -- liquid glass outlined pill
class GhostButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final double height;

  const GhostButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.height = 44,
  });

  @override
  Widget build(BuildContext context) {
    return LiquidGlassButton(
      label: label,
      onPressed: onPressed,
      icon: icon,
      height: height,
      blurSigma: 16,
      maxWidth: 240,
    );
  }
}

/// Plain text pill -- for Skip style actions with hover glass background
class PillTextButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final Color? color;

  const PillTextButton({
    super.key,
    required this.label,
    this.onPressed,
    this.color,
  });

  @override
  State<PillTextButton> createState() => _PillTextButtonState();
}

class _PillTextButtonState extends State<PillTextButton> {
  bool _isPressed = false;
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) {
          setState(() => _isPressed = false);
          if (widget.onPressed != null) widget.onPressed!();
        },
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedScale(
          scale: _isPressed ? 0.93 : (_isHovered ? 1.05 : 1.0),
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOutCubic,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            decoration: BoxDecoration(
              color: _isPressed
                  ? context.colors.primary.withValues(alpha: 0.20)
                  : (_isHovered
                      ? context.colors.onSurface.withValues(alpha: 0.10)
                      : Colors.transparent),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(
                color: _isHovered || _isPressed
                    ? context.colors.primary.withValues(alpha: 0.40)
                    : Colors.transparent,
                width: 1,
              ),
            ),
            child: Text(
              widget.label,
              style: AppTypography.bodyMd.copyWith(
                color: _isHovered || _isPressed
                    ? context.colors.primary
                    : (widget.color ?? context.colors.onSurfaceVariant),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
