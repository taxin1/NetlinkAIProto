import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_colors.dart';
import '../utils/responsive.dart';
import 'netlink_logo.dart';
import 'animated_glass_icon_button.dart';
import '../localization/app_localizations.dart';

/// Fixed frosted glass top bar with Animated Back button and centered NetlinkLogo
class SubPageTopBar extends StatelessWidget {
  final VoidCallback? onBack;

  const SubPageTopBar({
    super.key,
    this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    final barHeight = kToolbarHeight + topPadding;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: barHeight,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                context.colors.background.withValues(alpha: 0.95),
                context.colors.background.withValues(alpha: 0.60),
                context.colors.background.withValues(alpha: 0.0),
              ],
              stops: const [0.0, 0.70, 1.0],
            ),
          ),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: Responsive.pagePadding(context)),
              child: Row(
                children: [
                  // Animated Glass back button
                  AnimatedGlassIconButton(
                    icon: Icons.arrow_back_rounded,
                    tooltip: context.tr('back'),
                    onPressed: () {
                      if (onBack != null) {
                        onBack!();
                      } else if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/');
                      }
                    },
                  ),

                  // Centered Logo
                  const Expanded(
                    child: Center(
                      child: OverflowBox(
                        maxHeight: 140,
                        child: NetlinkLogo(size: 140, showText: true),
                      ),
                    ),
                  ),

                  // Spacer balancing back button width
                  const SizedBox(width: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

typedef AnimatedGlassBackButton = AnimatedGlassIconButton;
