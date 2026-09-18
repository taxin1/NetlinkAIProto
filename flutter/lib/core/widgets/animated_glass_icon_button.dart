import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Reusable liquid glass icon button with press & hover animations, glass border, cyan glow, and 12px squircle shape
class AnimatedGlassIconButton extends StatefulWidget {
  final IconData? icon;
  final String? label;
  final VoidCallback? onPressed;
  final double size;
  final double iconSize;
  final String? tooltip;
  final Color? iconColor;
  final Color? textColor;
  final Color? borderColor;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? padding;
  final double? fontSize;
  final bool isLoading;

  const AnimatedGlassIconButton({
    super.key,
    this.icon,
    this.label,
    this.onPressed,
    this.size = 40,
    this.iconSize = 20,
    this.tooltip,
    this.iconColor,
    this.textColor,
    this.borderColor,
    this.borderRadius,
    this.padding,
    this.fontSize,
    this.isLoading = false,
  });

  @override
  State<AnimatedGlassIconButton> createState() => _AnimatedGlassIconButtonState();
}

class _AnimatedGlassIconButtonState extends State<AnimatedGlassIconButton> {
  bool _isPressed = false;
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isDisabled = widget.isLoading || widget.onPressed == null;
    final activeColor = widget.iconColor ?? context.colors.primary;

    Widget child = MouseRegion(
      onEnter: (_) => setState(() => _isHovered = !isDisabled),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTapDown: isDisabled ? null : (_) => setState(() => _isPressed = true),
        onTapUp: isDisabled
            ? null
            : (_) {
                setState(() => _isPressed = false);
                widget.onPressed?.call();
              },
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedScale(
          scale: _isPressed ? 0.90 : (_isHovered ? 1.05 : 1.0),
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOutCubic,
          child: AnimatedOpacity(
            duration: const Duration(milliseconds: 150),
            opacity: isDisabled ? 0.6 : 1.0,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: widget.label != null ? null : widget.size,
              height: widget.size,
              padding: widget.padding ??
                  (widget.label != null
                      ? const EdgeInsets.symmetric(horizontal: 14)
                      : EdgeInsets.zero),
              decoration: BoxDecoration(
                color: _isPressed
                    ? activeColor.withValues(alpha: 0.25)
                    : (_isHovered
                        ? (widget.iconColor != null
                            ? widget.iconColor!.withValues(alpha: 0.12)
                            : context.colors.onSurface.withValues(alpha: 0.15))
                        : context.colors.onSurface.withValues(alpha: 0.08)),
                borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
                border: Border.all(
                  color: _isHovered || _isPressed
                      ? (widget.borderColor?.withValues(alpha: 0.8) ?? activeColor.withValues(alpha: 0.5))
                      : (widget.borderColor ?? context.colors.glassBorder),
                  width: 1.2,
                ),
                boxShadow: [
                  if (_isPressed || _isHovered)
                    BoxShadow(
                      color: activeColor.withValues(alpha: isDark ? 0.3 : 0.15),
                      blurRadius: 10,
                      spreadRadius: 1,
                    ),
                ],
              ),
              child: widget.label != null
                  ? Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (widget.isLoading)
                          Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: SizedBox(
                              width: widget.iconSize,
                              height: widget.iconSize,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: widget.iconColor ?? activeColor,
                              ),
                            ),
                          )
                        else if (widget.icon != null) ...[
                          Icon(
                            widget.icon!,
                            color: widget.iconColor ??
                                (_isHovered || _isPressed
                                    ? activeColor
                                    : context.colors.onSurface),
                            size: widget.iconSize,
                          ),
                          const SizedBox(width: 6),
                        ],
                        Text(
                          widget.label!,
                          style: TextStyle(
                            color: widget.textColor ??
                                (_isHovered || _isPressed
                                    ? activeColor
                                    : context.colors.onSurface),
                            fontSize: widget.fontSize ?? 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    )
                  : (widget.isLoading
                      ? Center(
                          child: SizedBox(
                            width: widget.iconSize,
                            height: widget.iconSize,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: widget.iconColor ?? activeColor,
                            ),
                          ),
                        )
                      : (widget.icon != null
                          ? Icon(
                              widget.icon!,
                              color: widget.iconColor ??
                                  (_isHovered || _isPressed
                                      ? activeColor
                                      : context.colors.onSurface),
                              size: widget.iconSize,
                            )
                          : const SizedBox.shrink())),
            ),
          ),
        ),
      ),
    );

    if (widget.tooltip != null) {
      return Tooltip(message: widget.tooltip!, child: child);
    }
    return child;
  }
}
