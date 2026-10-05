import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/widgets/scrollable_list_window.dart';

void main() {
  testWidgets('ScrollableListWindow renders without outer box and includes edge fade', (tester) async {
    final scrollController = ScrollController();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 360,
            child: ScrollableListWindow(
              controller: scrollController,
              maxHeight: 200,
              child: ListView.builder(
                controller: scrollController,
                itemCount: 10,
                itemBuilder: (context, index) {
                  return Container(
                    height: 60,
                    margin: const EdgeInsets.only(bottom: 8),
                    color: Colors.blue,
                    child: Text('Item $index'),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify ShaderMask is present for smooth fade
    expect(find.byType(ShaderMask), findsOneWidget);

    // Verify ClipRect is present
    expect(find.byType(ClipRect), findsAtLeastNWidgets(1));

    // Verify Scrollbars are absent
    expect(find.byType(Scrollbar), findsNothing);

    // Verify the first item expands to full 360 width (no outer box margin/padding)
    final firstItem = tester.getRect(find.text('Item 0'));
    expect(firstItem.left, greaterThanOrEqualTo(0));
    final containerFinder = find.byType(Container).first;
    final containerSize = tester.getSize(containerFinder);
    expect(containerSize.width, equals(360.0));
  });
}
