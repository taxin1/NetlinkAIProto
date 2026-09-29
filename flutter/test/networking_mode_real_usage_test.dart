import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:networklink_ai/features/networking_mode/models/networking_mode_state.dart';
import 'package:networklink_ai/features/networking_mode/providers/networking_mode_provider.dart';
import 'package:networklink_ai/features/auth/providers/auth_provider.dart';
import 'package:networklink_ai/features/auth/models/auth_models.dart';

void main() {
  group('Networking Mode Real Usage & Plan Logic Tests', () {
    test('Initial NetworkingModeState defaults to 0 uses instead of hardcoded 12', () {
      const state = NetworkingModeState();

      expect(state.usageCount, equals(0),
          reason: 'Initial state must not hardcode 12; real counts start at 0');
      expect(state.usageLimit, equals(100));
      expect(state.remainingUses, equals(100));
      expect(state.isLimitReached, isFalse);
      expect(state.isPro, isFalse);
    });

    test('Free trial limit behaves correctly at boundaries', () {
      final stateUnder = const NetworkingModeState().copyWith(usageCount: 99);
      expect(stateUnder.remainingUses, equals(1));
      expect(stateUnder.isLimitReached, isFalse);

      final stateLimit = const NetworkingModeState().copyWith(usageCount: 100);
      expect(stateLimit.remainingUses, equals(0));
      expect(stateLimit.isLimitReached, isTrue);

      final stateOver = const NetworkingModeState().copyWith(usageCount: 105);
      expect(stateOver.remainingUses, equals(0));
      expect(stateOver.isLimitReached, isTrue);
    });

    test('Pro plan users have unlimited networking mode usage (no limit reached)', () {
      final proState = const NetworkingModeState().copyWith(
        isPro: true,
        usageCount: 250,
      );

      expect(proState.isPro, isTrue);
      expect(proState.isLimitReached, isFalse);
      expect(proState.remainingUses, equals(-1),
          reason: '-1 indicates unlimited access');
    });

    test('toggleEnabled prevents activation when limit is reached', () {
      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) => AuthNotifier()),
        ],
      );

      // Force state to limit reached
      final notifier = container.read(networkingModeProvider.notifier);
      notifier.state = notifier.state.copyWith(usageCount: 100);

      final activated = notifier.toggleEnabled(true);
      expect(activated, isFalse);
      expect(notifier.state.isEnabled, isFalse);

      // Reset below limit
      notifier.state = notifier.state.copyWith(usageCount: 50);
      final allowed = notifier.toggleEnabled(true);
      expect(allowed, isTrue);
      expect(notifier.state.isEnabled, isTrue);
    });

    test('Guest mode initializes with real 0 usage and default template', () {
      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) {
            final auth = AuthNotifier();
            auth.state = const AuthState(
              user: AppUser(
                id: 'guest_123',
                email: 'guest@netlink.ai',
                name: 'Guest Explorer',
                isGuest: true,
              ),
            );
            return auth;
          }),
        ],
      );

      final state = container.read(networkingModeProvider);
      expect(state.usageCount, equals(0));
      expect(state.isPro, isFalse);
      expect(state.remainingUses, equals(100));
    });
  });
}
