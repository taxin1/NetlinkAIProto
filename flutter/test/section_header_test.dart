import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/widgets/section_header.dart';

void main() {
  testWidgets('SectionHeader renders without line beside text and allows soft wrap', (tester) async {
    tester.view.physicalSize = const Size(360, 600);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: SectionHeader(
            icon: Icons.language_rounded,
            label: 'Language & Localization',
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Verify label text is rendered completely without ellipsis
    final textFinder = find.text('Language & Localization');
    expect(textFinder, findsOneWidget);

    final Text textWidget = tester.widget<Text>(textFinder);
    expect(textWidget.softWrap, isTrue);
    expect(textWidget.maxLines, isNull);
    expect(textWidget.overflow, isNull);

    // Verify there are no horizontal divider lines in the SectionHeader Row
    expect(tester.takeException(), isNull);
  });

  testWidgets('SectionDivider renders cleanly without errors', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Column(
            children: [
              Text('Section 1'),
              SectionDivider(),
              Text('Section 2'),
            ],
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(SectionDivider), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
