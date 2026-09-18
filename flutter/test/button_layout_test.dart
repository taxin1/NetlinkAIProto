import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/widgets/gradient_button.dart';

void main() {
  testWidgets('Save Configuration and Test Email buttons have identical size and center alignment', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 600,
              child: Center(
                child: Wrap(
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 16,
                  runSpacing: 12,
                  children: [
                    GradientButton(
                      width: 200,
                      height: 48,
                      label: 'Save Configuration',
                      icon: Icons.save_rounded,
                      onPressed: () {},
                    ),
                    LiquidGlassButton(
                      width: 200,
                      height: 48,
                      label: 'Test Email',
                      icon: Icons.send_rounded,
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );

    final gb = tester.getSize(find.byType(GradientButton));
    final lgb = tester.getSize(find.byType(LiquidGlassButton));

    expect(gb.width, equals(200.0));
    expect(gb.height, equals(48.0));
    expect(lgb.width, equals(200.0));
    expect(lgb.height, equals(48.0));

    // Verify both are on the same vertical baseline (side by side)
    final gbTopLeft = tester.getTopLeft(find.byType(GradientButton));
    final lgbTopLeft = tester.getTopLeft(find.byType(LiquidGlassButton));
    expect(gbTopLeft.dy, equals(lgbTopLeft.dy));

    // Verify distance between them equals spacing 16
    final gbTopRight = tester.getTopRight(find.byType(GradientButton));
    expect(lgbTopLeft.dx - gbTopRight.dx, equals(16.0));
  });
}
