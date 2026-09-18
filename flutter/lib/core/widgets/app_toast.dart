import 'dart:ui';
import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Toast type — controls icon and accent color
enum ToastType { success, error, info, warning }

/// Compact glassmorphic toast overlay that auto-dismisses.
/// Shows centered, floating just above bottom nav area, with an X to close early.
class AppToast {
  AppToast._();

  static OverlayEntry? _current;
  static Timer? _timer;

  /// Show a toast. Replaces any currently visible toast.
  static void show(
    BuildContext context,
    String message, {
    ToastType type = ToastType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    _dismiss();

    final overlay = Overlay.of(context, rootOverlay: true);

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (ctx) => _AppToastWidget(
        message: message,
        type: type,
        onDismiss: _dismiss,
      ),
    );

    _current = entry;
    overlay.insert(entry);

    _timer = Timer(duration, _dismiss);
  }

  static void _dismiss() {
    _timer?.cancel();
    _timer = null;
    _current?.remove();
    _current = null;
  }
}

class _AppToastWidget extends StatefulWidget {
  final String message;
  final ToastType type;
  final VoidCallback onDismiss;

  const _AppToastWidget({
    required this.message,
    required this.type,
    required this.onDismiss,
  });

  @override
  State<_AppToastWidget> createState() => _AppToastWidgetState();
}

class _AppToastWidgetState extends State<_AppToastWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _opacity;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 280),
    );
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _slide = Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutCubic));
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _close() async {
    if (!mounted) return;
    await _ctrl.reverse();
    widget.onDismiss();
  }

  (Color accent, IconData icon) _typeStyle(BuildContext context) {
    switch (widget.type) {
      case ToastType.success:
        return (const Color(0xFF00C853), Icons.check_circle_rounded);
      case ToastType.error:
        return (const Color(0xFFEF4444), Icons.error_rounded);
      case ToastType.warning:
        return (const Color(0xFFF59E0B), Icons.warning_rounded);
      case ToastType.info:
        return (context.colors.primary, Icons.info_rounded);
    }
  }

  @override
  Widget build(BuildContext context) {
    final (accent, icon) = _typeStyle(context);

    return Positioned(
      bottom: 96,
      left: 0,
      right: 0,
      child: FadeTransition(
        opacity: _opacity,
        child: SlideTransition(
          position: _slide,
          child: Center(
            child: Material(
              type: MaterialType.transparency,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 360, minWidth: 220),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                      child: Container(
                        decoration: BoxDecoration(
                          color: context.colors.surface.withValues(alpha: 0.88),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: accent.withValues(alpha: 0.35),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: accent.withValues(alpha: 0.18),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.40),
                              blurRadius: 16,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(icon, color: accent, size: 20),
                              const SizedBox(width: 10),
                              Flexible(
                                child: Text(
                                  widget.message,
                                  style: AppTypography.bodySm.copyWith(
                                    color: context.colors.onSurface,
                                    fontWeight: FontWeight.w500,
                                    decoration: TextDecoration.none,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: _close,
                                child: Icon(
                                  Icons.close_rounded,
                                  size: 16,
                                  color: context.colors.onSurfaceVariant,
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
        ),
      ),
    );
  }
}
