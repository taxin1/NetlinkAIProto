import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:networklink_ai/features/analytics/services/analytics_service.dart';
import 'package:networklink_ai/features/campaigns/services/campaigns_service.dart';
import 'package:networklink_ai/features/events/providers/events_provider.dart';
import 'package:networklink_ai/features/calendar/providers/calendar_provider.dart';
import 'package:networklink_ai/features/auth/providers/auth_provider.dart';
import 'package:networklink_ai/features/auth/models/auth_models.dart';

void main() {
  group('Analytics Backend Alignment Tests', () {
    test('Guest mode returns preview analytics with hasData = true', () async {
      final analytics = await AnalyticsService.fetchAnalytics(
        userId: 'guest_user',
        isGuest: true,
        timeframe: '30d',
      );

      expect(analytics.hasData, isTrue);
      expect(analytics.totalImpressions, greaterThan(0));
      expect(analytics.activeConnections, greaterThan(0));
      expect(analytics.weeklyVelocity, isNotEmpty);
      expect(analytics.funnelStages, isNotEmpty);
    });

    test('Empty real user returns clean empty state matching Next.js Web App', () async {
      final empty = AnalyticsData.empty();

      expect(empty.hasData, isFalse);
      expect(empty.totalImpressions, equals(0));
      expect(empty.activeConnections, equals(0));
      expect(empty.totalInteractions, equals(0));
      expect(empty.mostActiveType, equals('N/A'));
      expect(empty.eventRois, isEmpty);
      expect(empty.weeklyVelocity.every((v) => v.count == 0), isTrue);
      expect(empty.funnelStages.first.countText, equals('0'));
    });

    test('CampaignsService returns empty list for real authenticated users without campaigns', () async {
      final campaigns = await CampaignsService.fetchCampaigns('real_auth_user_123');
      expect(campaigns, isEmpty);

      final contacts = await CampaignsService.fetchContacts('real_auth_user_123');
      expect(contacts, isEmpty);
    });

    test('EventsNotifier does not inject demo events for real authenticated users', () async {
      final container = ProviderContainer();
      container.read(authProvider.notifier).state = const AuthState(
        user: AppUser(
          id: 'real_user_abc',
          email: 'founder@example.com',
          name: 'Real Founder',
        ),
      );

      final notifier = container.read(eventsNotifierProvider.notifier);
      await notifier.loadEvents();

      final state = container.read(eventsNotifierProvider);
      expect(state.events, isEmpty);
    });

    test('CalendarNotifier does not inject demo meetings for real authenticated users', () async {
      final container = ProviderContainer();
      container.read(authProvider.notifier).state = const AuthState(
        user: AppUser(
          id: 'real_user_xyz',
          email: 'exec@example.com',
          name: 'Real Exec',
        ),
      );

      final notifier = container.read(calendarNotifierProvider.notifier);
      await notifier.loadEvents();

      final state = container.read(calendarNotifierProvider);
      expect(state.events, isEmpty);
    });
  });
}
