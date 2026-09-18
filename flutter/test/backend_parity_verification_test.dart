import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/features/auth/models/auth_models.dart';
import 'package:networklink_ai/features/auth/providers/auth_provider.dart';
import 'package:networklink_ai/features/matchmaking/providers/matchmaking_provider.dart';

void main() {
  group('Backend Parity & Alignment Tests', () {
    test('generateIcebreaker dynamically reflects authenticated user name', () {
      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) => _MockAuthNotifier(
                user: const AppUser(
                  id: 'user_123',
                  name: 'Dr. Jane Watson',
                  email: 'jane.watson@biotech.ai',
                  isPro: true,
                ),
              )),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(matchmakingNotifierProvider.notifier);
      final icebreaker = notifier.generateIcebreaker('match-1');

      expect(icebreaker, contains('Dr. Jane Watson'));
      expect(icebreaker, isNot(contains('Alex Mercer')));
      expect(icebreaker, contains('Elena'));
    });

    test('generateIcebreaker falls back gracefully for guest without name', () {
      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) => _MockAuthNotifier(
                user: const AppUser(
                  id: 'guest',
                  name: '',
                  email: '',
                  isGuest: true,
                ),
              )),
        ],
      );
      addTearDown(container.dispose);

      final notifier = container.read(matchmakingNotifierProvider.notifier);
      final icebreaker = notifier.generateIcebreaker('match-1');

      expect(icebreaker, contains('Alex Mercer'));
      expect(icebreaker, contains('Elena'));
    });
  });
}

class _MockAuthNotifier extends AuthNotifier {
  final AppUser? user;
  _MockAuthNotifier({this.user}) : super() {
    state = AuthState(user: user, isLoading: false);
  }
}
