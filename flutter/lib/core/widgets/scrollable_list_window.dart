import 'package:flutter/material.dart';
import '../utils/responsive.dart';

/// A self-contained, scrollable window container for lists within a page.
///
/// Features:
/// - Invisible container (no separate outer box/border) allowing cards to expand
///   to the full outer width of the section.
/// - Bounded compact maxHeight to reduce overall page length while preserving
///   responsive viewing on both mobile and wide screens.
/// - Smooth top and bottom gradient fades (via [ShaderMask]) that visually indicate
///   when list content extends beyond the visible window edges.
/// - Scrollbars are disabled for a clean, minimalist aesthetic.
class ScrollableListWindow extends StatefulWidget {
  final Widget child;
  final ScrollController? controller;
  final bool showScrollbar;
  final double? maxHeight;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;
  final bool showFade;

  const ScrollableListWindow({
    super.key,
    required this.child,
    this.controller,
    this.showScrollbar = false,
    this.maxHeight,
    this.margin,
    this.padding,
    this.showFade = true,
  });

  @override
  State<ScrollableListWindow> createState() => _ScrollableListWindowState();
}

class _ScrollableListWindowState extends State<ScrollableListWindow> {
  bool _canScrollDown = true;
  bool _canScrollUp = false;

  @override
  void initState() {
    super.initState();
    widget.controller?.addListener(_onControllerScroll);
  }

  @override
  void didUpdateWidget(ScrollableListWindow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.controller != oldWidget.controller) {
      oldWidget.controller?.removeListener(_onControllerScroll);
      widget.controller?.addListener(_onControllerScroll);
    }
  }

  @override
  void dispose() {
    widget.controller?.removeListener(_onControllerScroll);
    super.dispose();
  }

  void _onControllerScroll() {
    final ctrl = widget.controller;
    if (ctrl != null && ctrl.hasClients) {
      final pos = ctrl.position;
      _evaluateMetrics(pos.pixels, pos.maxScrollExtent);
    }
  }

  void _evaluateMetrics(double pixels, double maxScrollExtent) {
    final canDown = maxScrollExtent > 4 && pixels < maxScrollExtent - 4;
    final canUp = pixels > 4;

    if (_canScrollDown != canDown || _canScrollUp != canUp) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && (_canScrollDown != canDown || _canScrollUp != canUp)) {
          setState(() {
            _canScrollDown = canDown;
            _canScrollUp = canUp;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = Responsive.isMobile(context);
    final defaultMaxHeight = isMobile ? 340.0 : 460.0;
    final effectiveMaxHeight = widget.maxHeight ?? defaultMaxHeight;

    Widget content = Padding(
      padding: widget.padding ?? EdgeInsets.zero,
      child: widget.child,
    );

    if (widget.showFade && (_canScrollDown || _canScrollUp)) {
      content = ShaderMask(
        shaderCallback: (Rect bounds) {
          if (bounds.height <= 0) {
            return const LinearGradient(
              colors: [Colors.white, Colors.white],
            ).createShader(bounds);
          }

          final double topStop = _canScrollUp
              ? (28.0 / bounds.height).clamp(0.01, 0.15)
              : 0.0;
          final double bottomStop = _canScrollDown
              ? (1.0 - (48.0 / bounds.height).clamp(0.04, 0.22))
              : 1.0;

          final colors = <Color>[];
          final stops = <double>[];

          if (_canScrollUp) {
            colors.add(Colors.transparent);
            stops.add(0.0);
            colors.add(Colors.white);
            stops.add(topStop);
          } else {
            colors.add(Colors.white);
            stops.add(0.0);
          }

          if (_canScrollDown) {
            colors.add(Colors.white);
            stops.add(bottomStop);
            colors.add(Colors.transparent);
            stops.add(1.0);
          } else {
            colors.add(Colors.white);
            stops.add(1.0);
          }

          return LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: colors,
            stops: stops,
          ).createShader(bounds);
        },
        blendMode: BlendMode.dstIn,
        child: content,
      );
    }

    return Container(
      margin: widget.margin ?? EdgeInsets.zero,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: effectiveMaxHeight,
        ),
        child: ClipRect(
          child: ScrollConfiguration(
            behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
            child: NotificationListener<ScrollNotification>(
              onNotification: (notification) {
                if (notification.depth == 0) {
                  final m = notification.metrics;
                  _evaluateMetrics(m.pixels, m.maxScrollExtent);
                }
                return false;
              },
              child: NotificationListener<ScrollMetricsNotification>(
                onNotification: (notification) {
                  if (notification.depth == 0) {
                    final m = notification.metrics;
                    _evaluateMetrics(m.pixels, m.maxScrollExtent);
                  }
                  return false;
                },
                child: content,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

