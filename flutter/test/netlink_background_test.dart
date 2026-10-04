import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/widgets/netlink_background.dart';

void main() {
  group('NetlinkBackground Widget Tests', () {
    testWidgets('renders landing variant with child', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: NetlinkBackground.landing(
              child: Center(
                child: Text('Landing Content'),
              ),
            ),
          ),
        ),
      );

      expect(find.text('Landing Content'), findsOneWidget);
      expect(find.byType(NetlinkBackground), findsOneWidget);
    });

    testWidgets('renders app variant in dark mode and light mode', (tester) async {
      for (final brightness in [Brightness.dark, Brightness.light]) {
        await tester.pumpWidget(
          MaterialApp(
            theme: ThemeData(brightness: brightness),
            home: const Scaffold(
              body: NetlinkBackground.app(
                child: Text('Dashboard Content'),
              ),
            ),
          ),
        );

        expect(find.text('Dashboard Content'), findsOneWidget);
      }
    });

    testWidgets('renders auth variant across different screen sizes without overflows', (tester) async {
      final sizes = [
        const Size(360, 640),  // Mobile
        const Size(768, 1024), // Tablet
        const Size(1920, 1080), // Desktop
      ];

      for (final size in sizes) {
        tester.view.physicalSize = size;
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        await tester.pumpWidget(
          const MaterialApp(
            home: Scaffold(
              body: NetlinkBackground.auth(
                child: Text('Auth Content'),
              ),
            ),
          ),
        );

        expect(find.text('Auth Content'), findsOneWidget);
      }
    });
  });
}
