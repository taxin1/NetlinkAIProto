import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class NetlinkLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final bool iconOnly;

  const NetlinkLogo({
    super.key,
    this.size = 32.0,
    this.showText = true,
    this.iconOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    final isLight = Theme.of(context).brightness == Brightness.light;
    final String assetPath;
    if (iconOnly || !showText) {
      assetPath = isLight ? 'assets/images/logo_icon_light.png' : 'assets/images/logo_icon.png';
    } else {
      assetPath = isLight ? 'assets/images/logo_light.png' : 'assets/images/logo.png';
    }

    return Image.asset(
      assetPath,
      height: size,
      fit: BoxFit.contain,
      errorBuilder: (context, error, stackTrace) => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.broken_image_outlined, color: context.colors.primary, size: size),
          if (showText && !iconOnly) ...[
            const SizedBox(width: 8),
            Text('Netlink AI', style: TextStyle(color: context.colors.onSurface, fontSize: size * 0.6, fontWeight: FontWeight.bold)),
          ],
        ],
      ),
    );
  }
}
