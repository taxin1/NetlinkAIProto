import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import '../utils/responsive.dart';

class FloatingNavItem {
  final String? id;
  final String label;
  final IconData icon;
  final IconData? activeIcon;
  final VoidCallback onTap;

  const FloatingNavItem({
    this.id,
    required this.label,
    required this.icon,
    this.activeIcon,
    required this.onTap,
  });
}

class FloatingLiquidGlassNavBar extends StatelessWidget {
  final String activeTabLabel;
  final List<FloatingNavItem> items;
  final Widget? topAction;

  const FloatingLiquidGlassNavBar({
    super.key,
    required this.activeTabLabel,
    required this.items,
    this.topAction,
  });

  @override
  Widget build(BuildContext context) {
    // Hide on tablet and desktop — sidebar/rail handles navigation
    if (Responsive.isWide(context)) return const SizedBox.shrink();

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    // Calculate a compact max width based on item count
    final double maxNavWidth = items.length <= 2
        ? 260.0
        : (items.length <= 3 ? 340.0 : 380.0);

    return Positioned(
      bottom: bottomPadding + 14,
      left: 0,
      right: 0,
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Container(
          constraints: BoxConstraints(maxWidth: maxNavWidth),
          margin: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (topAction != null) ...[
                topAction!,
                const SizedBox(height: 10),
              ],
              RepaintBoundary(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xF2121622)
                        : const Color(0xF8FFFFFF),
                    borderRadius: BorderRadius.circular(32),
                    border: Border.all(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.18)
                          : Colors.black.withValues(alpha: 0.08),
                      width: 1.2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.12),
                        blurRadius: 16,
                        spreadRadius: -2,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      for (int i = 0; i < items.length; i++) ...[
                        if (i > 0) const SizedBox(width: 6),
                        Expanded(
                          child: _FloatingNavItemWidget(
                            item: items[i],
                            isActive: items[i].id != null
                                ? items[i].id == activeTabLabel
                                : items[i].label == activeTabLabel,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FloatingNavItemWidget extends StatefulWidget {
  final FloatingNavItem item;
  final bool isActive;

  const _FloatingNavItemWidget({
    required this.item,
    required this.isActive,
  });

  @override
  State<_FloatingNavItemWidget> createState() => _FloatingNavItemWidgetState();
}

class _FloatingNavItemWidgetState extends State<_FloatingNavItemWidget> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) {
          if (mounted) setState(() => _isPressed = false);
          widget.item.onTap();
        },
        onTapCancel: () {
          if (mounted) setState(() => _isPressed = false);
        },
        child: AnimatedScale(
          scale: _isPressed ? 0.94 : 1.0,
          duration: const Duration(milliseconds: 120),
          curve: Curves.easeOutCubic,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOutCubic,
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
            decoration: BoxDecoration(
              color: widget.isActive
                  ? (isDark
                      ? context.colors.primary.withValues(alpha: 0.22)
                      : context.colors.primary.withValues(alpha: 0.14))
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: widget.isActive
                    ? context.colors.primary.withValues(alpha: 0.55)
                    : Colors.transparent,
                width: 1.2,
              ),
              boxShadow: widget.isActive
                  ? [
                      BoxShadow(
                        color: context.colors.primary.withValues(alpha: 0.22),
                        blurRadius: 12,
                        spreadRadius: 0,
                      ),
                    ]
                  : const [],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  widget.isActive
                      ? (widget.item.activeIcon ?? widget.item.icon)
                      : widget.item.icon,
                  color: widget.isActive
                      ? context.colors.primary
                      : context.colors.onSurfaceVariant,
                  size: 20,
                ),
                const SizedBox(height: 3),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 180),
                  style: AppTypography.labelSm.copyWith(
                    color: widget.isActive
                        ? context.colors.primary
                        : context.colors.onSurfaceVariant,
                    fontWeight: widget.isActive ? FontWeight.bold : FontWeight.w500,
                    fontSize: 10.5,
                  ),
                  child: Text(
                    widget.item.label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
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
