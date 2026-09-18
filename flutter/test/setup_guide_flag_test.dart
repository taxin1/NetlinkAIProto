import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/tour/tour_controller.dart';
import 'package:networklink_ai/core/widgets/post_login_dialogs.dart';
import 'package:networklink_ai/features/auth/models/auth_models.dart';
import 'package:networklink_ai/features/auth/providers/auth_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    PostLoginDialogs.resetSession();
  });

  testWidgets('Setup guide does NOT trigger on refresh / existing account without new account flag', (tester) async {
    SharedPreferences.setMockInitialValues({
      'netlink-tour-completed': false,
    });

    final container = ProviderContainer();
    // Simulate existing signed in user
    container.read(authProvider.notifier).state = const AuthState(
      user: AppUser(
        id: 'user-123',
        name: 'Existing User',
        email: 'existing@example.com',
        hasCompletedProfile: true,
      ),
    );

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(
          home: Scaffold(
            body: PostLoginDialogs(),
          ),
        ),
      ),
    );

    // Wait for initial sequence timer
    await tester.pump(const Duration(milliseconds: 600));

    final tourState = container.read(tourControllerProvider);
    expect(tourState.isActive, isFalse, reason: 'Tour must not automatically start for existing user on refresh');
  });

  testWidgets('Setup guide triggers for very new account and clears flag', (tester) async {
    SharedPreferences.setMockInitialValues({
      'show_setup_guide_user-new': true,
      'netlink-tour-completed': false,
    });

    final container = ProviderContainer();
    container.read(authProvider.notifier).state = const AuthState(
      user: AppUser(
        id: 'user-new',
        name: 'Brand New User',
        email: 'new@example.com',
        hasCompletedProfile: true,
      ),
    );

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(
          home: Scaffold(
            body: PostLoginDialogs(),
          ),
        ),
      ),
    );

    // Wait for initial sequence timer
    await tester.pump(const Duration(milliseconds: 600));

    final tourState = container.read(tourControllerProvider);
    expect(tourState.isActive, isTrue, reason: 'Tour must automatically start for a brand new user');

    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool('show_setup_guide_user-new'), isFalse, reason: 'Flag must be cleared so refresh does not retrigger');
  });

  testWidgets('Manual openTour starts tour with force=true even if completed', (tester) async {
    SharedPreferences.setMockInitialValues({
      'netlink-tour-completed': true,
    });

    final container = ProviderContainer();

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (ctx) => ElevatedButton(
                onPressed: () => PostLoginDialogs.openTour(ctx),
                child: const Text('Open Tour'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open Tour'));
    await tester.pump();

    final tourState = container.read(tourControllerProvider);
    expect(tourState.isActive, isTrue, reason: 'Manual click must always open the tour');
  });
}
