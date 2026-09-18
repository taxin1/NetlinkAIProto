import 'package:flutter/material.dart';

/// Responsive breakpoints — industry standard (Material 3 / Google)
/// Mobile:  < 600
/// Tablet:  600 – 1199
/// Desktop: ≥ 1200
class Responsive {
  static const double mobileMax = 600;
  static const double tabletMax = 1200;

  static bool isMobile(BuildContext context) =>
      MediaQuery.of(context).size.width < mobileMax;

  static bool isTablet(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    return w >= mobileMax && w < tabletMax;
  }

  static bool isDesktop(BuildContext context) =>
      MediaQuery.of(context).size.width >= tabletMax;

  static bool isWide(BuildContext context) =>
      MediaQuery.of(context).size.width >= mobileMax;

  /// Column count helper — 1 on mobile, 2 on tablet, n on desktop
  static int gridColumns(BuildContext context, {int desktopColumns = 3}) {
    if (isDesktop(context)) return desktopColumns;
    if (isTablet(context)) return 2;
    return 1;
  }

  /// Max content width for centered desktop layouts (constant across all app pages)
  static const double maxContentWidth = 840;

  /// Horizontal page padding — grows with screen width
  static double pagePadding(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    if (w >= tabletMax) return 40;
    if (w >= mobileMax) return 24;
    return 16;
  }

  /// Top page padding — accounts for top bar on mobile/tablet vs direct top edge on desktop
  static double topPadding(BuildContext context, {double extra = 24}) {
    final top = MediaQuery.of(context).padding.top;
    if (isDesktop(context)) return top + extra;
    return kToolbarHeight + top + 16;
  }

  /// Sidebar / rail width
  static const double sidebarWidth = 280;
  static const double railWidth = 80;
}

/// Switch between 3 layout modes with a single widget
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;

  const ResponsiveLayout({
    super.key,
    required this.mobile,
    this.tablet,
    this.desktop,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= Responsive.tabletMax && desktop != null) {
          return desktop!;
        }
        if (constraints.maxWidth >= Responsive.mobileMax && tablet != null) {
          return tablet ?? mobile;
        }
        return mobile;
      },
    );
  }
}

/// Responsive grid that switches column count automatically
class ResponsiveGrid extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final int desktopColumns;
  final int tabletColumns;
  final int mobileColumns;
  final double childAspectRatio;
  final double? runSpacing;

  const ResponsiveGrid({
    super.key,
    required this.children,
    this.spacing = 16,
    this.desktopColumns = 3,
    this.tabletColumns = 2,
    this.mobileColumns = 1,
    this.childAspectRatio = 1.0,
    this.runSpacing,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        int columns;
        if (constraints.maxWidth >= Responsive.tabletMax) {
          columns = desktopColumns;
        } else if (constraints.maxWidth >= Responsive.mobileMax) {
          columns = tabletColumns;
        } else {
          columns = mobileColumns;
        }

        if (columns == 1) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (int i = 0; i < children.length; i++) ...[
                children[i],
                if (i < children.length - 1) SizedBox(height: runSpacing ?? spacing),
              ],
            ],
          );
        }

        return GridView.count(
          crossAxisCount: columns,
          crossAxisSpacing: spacing,
          mainAxisSpacing: runSpacing ?? spacing,
          childAspectRatio: childAspectRatio,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: children,
        );
      },
    );
  }
}

/// Centered max-width content container for desktop
class MaxWidthBox extends StatelessWidget {
  final Widget child;
  final double maxWidth;
  final EdgeInsetsGeometry? padding;

  const MaxWidthBox({
    super.key,
    required this.child,
    this.maxWidth = 960,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: padding != null
            ? Padding(padding: padding!, child: child)
            : child,
      ),
    );
  }
}
