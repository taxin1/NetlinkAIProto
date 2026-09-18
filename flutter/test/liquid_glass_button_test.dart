import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/theme/app_theme.dart';
import 'package:networklink_ai/core/widgets/gradient_button.dart';

void main() {
  testWidgets('LiquidGlassButton compact side-by-side layout test', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 450,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    LiquidGlassButton(
                      label: 'Upload new',
                      icon: Icons.upload_rounded,
                      height: 36,
                      fontSize: 12,
                      iconSize: 15,
                      expand: false,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      onPressed: () {},
                    ),
                    const SizedBox(width: 8),
                    LiquidGlassButton(
                      label: 'Sync Google',
                      icon: Icons.sync_rounded,
                      height: 36,
                      fontSize: 12,
                      iconSize: 15,
                      expand: false,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      onPressed: () {},
                    ),
                    const SizedBox(width: 8),
                    LiquidGlassButton(
                      label: 'Remove',
                      icon: Icons.delete_outline_rounded,
                      height: 36,
                      fontSize: 12,
                      iconSize: 15,
                      expand: false,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      onPressed: null,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify all 3 buttons are rendered
    expect(find.text('Upload new'), findsOneWidget);
    expect(find.text('Sync Google'), findsOneWidget);
    expect(find.text('Remove'), findsOneWidget);

    // Verify that all 3 buttons have the same Y position (i.e. side by side on one horizontal line)
    final uploadPos = tester.getTopLeft(find.text('Upload new'));
    final syncPos = tester.getTopLeft(find.text('Sync Google'));
    final removePos = tester.getTopLeft(find.text('Remove'));

    expect(uploadPos.dy, equals(syncPos.dy));
    expect(syncPos.dy, equals(removePos.dy));

    // Verify horizontal ordering (left to right)
    expect(uploadPos.dx < syncPos.dx, isTrue);
    expect(syncPos.dx < removePos.dx, isTrue);
  });
}
