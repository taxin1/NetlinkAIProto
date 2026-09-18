import 'package:flutter/material.dart';

/// Animated Pop-In wrapper that pops elements into view with scaling and sliding up.
class PopInItem extends StatefulWidget {
  final Widget child;
  final int index;
  final Duration delay;
  final Duration duration;
  final double slideOffset;
  final double initialScale;
  final Curve curve;

  const PopInItem({
    super.key,
    required this.child,
    this.index = 0,
    this.delay = Duration.zero,
    this.duration = const Duration(milliseconds: 200),
    this.slideOffset = 12.0,
    this.initialScale = 0.96,
    this.curve = Curves.easeOutCubic,
  });

  @override
  State<PopInItem> createState() => _PopInItemState();
}

class _PopInItemState extends State<PopInItem> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnim;
  late Animation<double> _slideAnim;
  late Animation<double> _opacityAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    );

    _scaleAnim = Tween<double>(begin: widget.initialScale, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: widget.curve),
    );

    _slideAnim = Tween<double>(begin: widget.slideOffset, end: 0.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );

    _opacityAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );

    final staggerMs = (widget.index.clamp(0, 4) * 25);
    final totalDelay = widget.delay + Duration(milliseconds: staggerMs);
    if (totalDelay == Duration.zero) {
      _controller.forward();
    } else {
      Future.delayed(totalDelay, () {
        if (mounted) _controller.forward();
      });
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller.isCompleted) {
      return widget.child;
    }

    return RepaintBoundary(
      child: AnimatedBuilder(
        animation: _controller,
        child: widget.child,
        builder: (context, child) {
          if (_controller.isCompleted) {
            return child!;
          }
          return Transform.translate(
            offset: Offset(0, _slideAnim.value),
            child: Transform.scale(
              scale: _scaleAnim.value,
              child: Opacity(
                opacity: _opacityAnim.value.clamp(0.0, 1.0),
                child: child,
              ),
            ),
          );
        },
      ),
    );
  }
}
