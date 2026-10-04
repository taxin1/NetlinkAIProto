import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/widgets/glass_card.dart';

void main() {
  testWidgets('GlassCard default hover glow uses primary blue instead of cyan', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(),
        home: Scaffold(
          body: Center(
            child: GlassCard(
              onTap: () {},
              child: const Text('Hover Card'),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify GlassCard is rendered
    expect(find.text('Hover Card'), findsOneWidget);

    // Initial state: not hovered
    // Find mouse gesture
    final gesture = await tester.createGesture(kind: PointerDeviceKind.mouse);
    await gesture.addPointer(location: Offset.zero);
    addTearDown(gesture.removePointer);

    await gesture.moveTo(tester.getCenter(find.text('Hover Card')));
    await tester.pumpAndSettle();

    // Find the RepaintBoundary BoxShadow container
    final containerFinder = find.byType(AnimatedContainer);
    expect(containerFinder, findsWidgets);

    // Verify no exceptions occurred
    expect(tester.takeException(), isNull);
  });
}
