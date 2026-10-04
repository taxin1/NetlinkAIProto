import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/supabase_service.dart';

class AnalyticsData {
  final int totalImpressions;
  final int activeConnections;
  final int emailsSent;
  final int meetingsScheduled;
  final int totalInteractions;
  final String mostActiveType;
  final Map<String, int> eventCounts;
  final List<WeeklyVelocityItem> weeklyVelocity;
  final List<FunnelStageItem> funnelStages;
  final List<EventRoiItemData> eventRois;
  final bool hasData;
  final String? impressionsGrowth;
  final String? connectionsGrowth;
  final String? responseGrowth;
  final String? meetingsGrowth;

  const AnalyticsData({
    required this.totalImpressions,
    required this.activeConnections,
    required this.emailsSent,
    required this.meetingsScheduled,
    required this.totalInteractions,
    required this.mostActiveType,
    required this.eventCounts,
    required this.weeklyVelocity,
    required this.funnelStages,
    required this.eventRois,
    required this.hasData,
    this.impressionsGrowth,
    this.connectionsGrowth,
    this.responseGrowth,
    this.meetingsGrowth,
  });

  factory AnalyticsData.empty() {
    return const AnalyticsData(
      totalImpressions: 0,
      activeConnections: 0,
      emailsSent: 0,
      meetingsScheduled: 0,
      totalInteractions: 0,
      mostActiveType: 'N/A',
      eventCounts: {},
      weeklyVelocity: [
        WeeklyVelocityItem(day: 'Mon', count: 0, heightRatio: 0.0),
        WeeklyVelocityItem(day: 'Tue', count: 0, heightRatio: 0.0),
        WeeklyVelocityItem(day: 'Wed', count: 0, heightRatio: 0.0),
        WeeklyVelocityItem(day: 'Thu', count: 0, heightRatio: 0.0),
        WeeklyVelocityItem(day: 'Fri', count: 0, heightRatio: 0.0),
        WeeklyVelocityItem(day: 'Sat', count: 0, heightRatio: 0.0),
        WeeklyVelocityItem(day: 'Sun', count: 0, heightRatio: 0.0),
      ],
      funnelStages: [
        FunnelStageItem(name: '1. Contacts Discovered', countText: '0', progress: 0.0),
        FunnelStageItem(name: '2. AI Intros Sent', countText: '0 (0%)', progress: 0.0),
        FunnelStageItem(name: '3. Positive Replies', countText: '0 (0%)', progress: 0.0),
        FunnelStageItem(name: '4. Meetings Booked', countText: '0 (0%)', progress: 0.0),
      ],
      eventRois: [],
      hasData: false,
      impressionsGrowth: null,
      connectionsGrowth: null,
      responseGrowth: null,
      meetingsGrowth: null,
    );
  }

  factory AnalyticsData.mockPreview({String timeframe = '30d'}) {
    final mult = timeframe == '7d'
        ? 0.3
        : timeframe == '30d'
            ? 1.0
            : timeframe == '90d'
                ? 2.8
                : 4.5;

    final impressions = (1284 * mult).round();
    final connections = (438 * mult).round();
    final emails = (184 * mult).round();
    final meetings = (19 * mult).round();

    // Dynamically calculate concise growth trends based on timeframe
    final impressionsGrowth = timeframe == '7d'
        ? '+12.4%'
        : timeframe == '90d'
            ? '+28.6%'
            : timeframe == 'all'
                ? '+44.2%'
                : '+18.4%';

    final connectionsGrowth = timeframe == '7d'
        ? '+6 new'
        : timeframe == '90d'
            ? '+68 new'
            : timeframe == 'all'
                ? '+142 new'
                : '+24 new';

    final responseGrowth = timeframe == '7d'
        ? '+2.1%'
        : timeframe == '90d'
            ? '+6.4%'
            : timeframe == 'all'
                ? '+10.8%'
                : '+4.2%';

    final meetingsGrowth = timeframe == '7d'
        ? '+2 booked'
        : timeframe == '90d'
            ? '+14 booked'
            : timeframe == 'all'
                ? '+28 booked'
                : '+6 booked';

    return AnalyticsData(
      totalImpressions: impressions,
      activeConnections: connections,
      emailsSent: emails,
      meetingsScheduled: meetings,
      totalInteractions: (connections + emails + meetings),
      mostActiveType: 'Emails Sent',
      impressionsGrowth: impressionsGrowth,
      connectionsGrowth: connectionsGrowth,
      responseGrowth: responseGrowth,
      meetingsGrowth: meetingsGrowth,
      eventCounts: {
        'email_sent': (emails * 0.6).round(),
        'connection': (connections * 0.3).round(),
        'meeting': meetings,
      },
      weeklyVelocity: const [
        WeeklyVelocityItem(day: 'Mon', count: 18, heightRatio: 0.45),
        WeeklyVelocityItem(day: 'Tue', count: 34, heightRatio: 0.85),
        WeeklyVelocityItem(day: 'Wed', count: 28, heightRatio: 0.70),
        WeeklyVelocityItem(day: 'Thu', count: 42, heightRatio: 0.95),
        WeeklyVelocityItem(day: 'Fri', count: 24, heightRatio: 0.60),
        WeeklyVelocityItem(day: 'Sat', count: 12, heightRatio: 0.30),
        WeeklyVelocityItem(day: 'Sun', count: 8, heightRatio: 0.20),
      ],
      funnelStages: const [
        FunnelStageItem(name: '1. Contacts Discovered', countText: '240', progress: 1.0),
        FunnelStageItem(name: '2. AI Intros Sent', countText: '184 (76.6%)', progress: 0.766),
        FunnelStageItem(name: '3. Positive Replies', countText: '92 (50.0%)', progress: 0.50),
        FunnelStageItem(name: '4. Meetings Booked', countText: '38 (41.3%)', progress: 0.38),
      ],
      eventRois: const [
        EventRoiItemData(
          eventName: 'TechCrunch Disrupt 2026',
          location: 'San Francisco, CA',
          matches: '14 Matches',
          meetings: '6 Booked',
          roiScore: '96% Synergy',
        ),
        EventRoiItemData(
          eventName: 'AI Summit SF 2026',
          location: 'Moscone Center, SF',
          matches: '9 Matches',
          meetings: '4 Booked',
          roiScore: '91% Synergy',
        ),
        EventRoiItemData(
          eventName: 'Global Founder Circle',
          location: 'Online Executive Session',
          matches: '11 Matches',
          meetings: '5 Booked',
          roiScore: '88% Synergy',
        ),
      ],
      hasData: true,
    );
  }
}

class WeeklyVelocityItem {
  final String day;
  final int count;
  final double heightRatio;

  const WeeklyVelocityItem({
    required this.day,
    required this.count,
    required this.heightRatio,
  });
}

class FunnelStageItem {
  final String name;
  final String countText;
  final double progress;

  const FunnelStageItem({
    required this.name,
    required this.countText,
    required this.progress,
  });
}

class EventRoiItemData {
  final String eventName;
  final String location;
  final String matches;
  final String meetings;
  final String roiScore;

  const EventRoiItemData({
    required this.eventName,
    required this.location,
    required this.matches,
    required this.meetings,
    required this.roiScore,
  });
}

class AnalyticsService {
  AnalyticsService._();

  static SupabaseClient? get _supabase {
    try {
      return SupabaseService.client;
    } catch (_) {
      return null;
    }
  }

  static Future<AnalyticsData> fetchAnalytics({
    required String userId,
    required bool isGuest,
    String timeframe = '30d',
  }) async {
    if (isGuest || userId.isEmpty || userId == 'guest' || userId == 'guest_user') {
      return AnalyticsData.mockPreview(timeframe: timeframe);
    }

    final client = _supabase;
    if (client == null) {
      return AnalyticsData.empty();
    }

    try {
      // 1. Fetch contacts count (connections)
      int contactsCount = 0;
      try {
        final contactsRes = await client
            .from('contacts')
            .select('id')
            .eq('user_id', userId);
        contactsCount = (contactsRes as List<dynamic>).length;
      } catch (e) {
        debugPrint('Analytics: contacts count error: $e');
      }

      // 2. Fetch emails count (sent and drafts)
      int emailsSentCount = 0;
      int emailRepliesCount = 0;
      try {
        final emailsRes = await client
            .from('emails')
            .select('id, status')
            .eq('user_id', userId);
        final emailsList = emailsRes as List<dynamic>;
        emailsSentCount = emailsList
            .where((e) => (e as Map<String, dynamic>)['status'] == 'sent')
            .length;

        final repliesRes = await client
            .from('email_replies')
            .select('id')
            .eq('user_id', userId);
        emailRepliesCount = (repliesRes as List<dynamic>).length;
      } catch (e) {
        debugPrint('Analytics: emails count error: $e');
      }

      // 3. Fetch meetings scheduled (calendar_events)
      int meetingsCount = 0;
      try {
        final calRes = await client
            .from('calendar_events')
            .select('id')
            .eq('user_id', userId);
        meetingsCount = (calRes as List<dynamic>).length;
      } catch (e) {
        debugPrint('Analytics: calendar count error: $e');
      }

      // 4. Fetch events table (interactions breakdown matching Next.js components/analytics-charts.tsx)
      final Map<String, int> eventCounts = {};
      List<dynamic> eventsList = [];
      try {
        final eventsRes = await client
            .from('events')
            .select('event_type, created_at')
            .eq('user_id', userId);
        eventsList = eventsRes as List<dynamic>;
        for (final item in eventsList) {
          final map = item as Map<String, dynamic>;
          final type = (map['event_type'] as String?) ?? 'other';
          eventCounts[type] = (eventCounts[type] ?? 0) + 1;
        }
      } catch (e) {
        debugPrint('Analytics: events breakdown error: $e');
      }

      final totalInteractions = eventsList.isNotEmpty
          ? eventsList.length
          : (contactsCount + emailsSentCount + meetingsCount);

      // Determine most active type
      String mostActiveType = 'N/A';
      if (eventCounts.isNotEmpty) {
        String topType = eventCounts.keys.first;
        int maxVal = -1;
        eventCounts.forEach((k, v) {
          if (v > maxVal) {
            maxVal = v;
            topType = k;
          }
        });
        mostActiveType = _formatEventType(topType);
      } else if (totalInteractions > 0) {
        if (contactsCount >= emailsSentCount && contactsCount >= meetingsCount) {
          mostActiveType = 'New Connections';
        } else if (emailsSentCount >= meetingsCount) {
          mostActiveType = 'Emails Sent';
        } else {
          mostActiveType = 'Meetings';
        }
      }

      final hasData = totalInteractions > 0 ||
          contactsCount > 0 ||
          emailsSentCount > 0 ||
          meetingsCount > 0;

      if (!hasData) {
        return AnalyticsData.empty();
      }

      // 5. Weekly velocity calculation
      final weeklyVelocity = _computeWeeklyVelocity(eventsList);

      // 6. Funnel calculation
      final funnelStages = _computeFunnel(
        contactsCount: contactsCount,
        emailsSent: emailsSentCount,
        replies: emailRepliesCount,
        meetings: meetingsCount,
      );

      // 7. Dynamic growth metrics computation
      final growthMetrics = _computeDynamicGrowth(
        eventsList: eventsList,
        timeframe: timeframe,
        contactsCount: contactsCount,
        emailsSentCount: emailsSentCount,
        meetingsCount: meetingsCount,
      );

      return AnalyticsData(
        totalImpressions: contactsCount * 3 + emailsSentCount * 2,
        activeConnections: contactsCount,
        emailsSent: emailsSentCount,
        meetingsScheduled: meetingsCount,
        totalInteractions: totalInteractions,
        mostActiveType: mostActiveType,
        eventCounts: eventCounts,
        weeklyVelocity: weeklyVelocity,
        funnelStages: funnelStages,
        eventRois: const [],
        hasData: true,
        impressionsGrowth: growthMetrics['impressionsGrowth'],
        connectionsGrowth: growthMetrics['connectionsGrowth'],
        responseGrowth: growthMetrics['responseGrowth'],
        meetingsGrowth: growthMetrics['meetingsGrowth'],
      );
    } catch (e) {
      debugPrint('Analytics fetch exception: $e');
      return AnalyticsData.empty();
    }
  }

  static String _formatEventType(String type) {
    switch (type) {
      case 'email_sent':
        return 'Emails Sent';
      case 'connection':
        return 'New Connections';
      case 'meeting':
        return 'Meetings';
      case 'call':
        return 'Calls';
      case 'note':
        return 'Notes';
      default:
        return type;
    }
  }

  static List<WeeklyVelocityItem> _computeWeeklyVelocity(List<dynamic> eventsList) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final counts = <String, int>{for (var d in days) d: 0};

    final now = DateTime.now();
    final sevenDaysAgo = now.subtract(const Duration(days: 7));

    for (final item in eventsList) {
      final map = item as Map<String, dynamic>;
      final createdAtStr = map['created_at'] as String?;
      if (createdAtStr == null) continue;
      final dt = DateTime.tryParse(createdAtStr);
      if (dt == null || dt.isBefore(sevenDaysAgo)) continue;

      final weekdayIndex = dt.weekday - 1; // 1 = Mon -> 0
      if (weekdayIndex >= 0 && weekdayIndex < 7) {
        final dayName = days[weekdayIndex];
        counts[dayName] = (counts[dayName] ?? 0) + 1;
      }
    }

    int maxCount = counts.values.fold(0, (max, val) => val > max ? val : max);
    if (maxCount == 0) maxCount = 1;

    return days.map((d) {
      final c = counts[d] ?? 0;
      return WeeklyVelocityItem(
        day: d,
        count: c,
        heightRatio: c == 0 ? 0.05 : (c / maxCount).clamp(0.1, 1.0),
      );
    }).toList();
  }

  static List<FunnelStageItem> _computeFunnel({
    required int contactsCount,
    required int emailsSent,
    required int replies,
    required int meetings,
  }) {
    final base = contactsCount > 0 ? contactsCount : (emailsSent > 0 ? emailsSent : 1);

    final sentPercent = base > 0 ? ((emailsSent / base) * 100).clamp(0, 100).toStringAsFixed(1) : '0';
    final replyBase = emailsSent > 0 ? emailsSent : 1;
    final replyPercent = ((replies / replyBase) * 100).clamp(0, 100).toStringAsFixed(1);
    final meetBase = replies > 0 ? replies : (emailsSent > 0 ? emailsSent : 1);
    final meetPercent = ((meetings / meetBase) * 100).clamp(0, 100).toStringAsFixed(1);

    return [
      FunnelStageItem(
        name: '1. Contacts Discovered',
        countText: '$contactsCount',
        progress: contactsCount > 0 ? 1.0 : 0.0,
      ),
      FunnelStageItem(
        name: '2. AI Intros Sent',
        countText: '$emailsSent ($sentPercent%)',
        progress: contactsCount > 0 ? (emailsSent / contactsCount).clamp(0.0, 1.0) : 0.0,
      ),
      FunnelStageItem(
        name: '3. Positive Replies',
        countText: '$replies ($replyPercent%)',
        progress: emailsSent > 0 ? (replies / emailsSent).clamp(0.0, 1.0) : 0.0,
      ),
      FunnelStageItem(
        name: '4. Meetings Booked',
        countText: '$meetings ($meetPercent%)',
        progress: replies > 0 ? (meetings / replies).clamp(0.0, 1.0) : (emailsSent > 0 ? (meetings / emailsSent).clamp(0.0, 1.0) : 0.0),
      ),
    ];
  }

  static Map<String, String?> _computeDynamicGrowth({
    required List<dynamic> eventsList,
    required String timeframe,
    required int contactsCount,
    required int emailsSentCount,
    required int meetingsCount,
  }) {
    if (eventsList.isEmpty && contactsCount == 0 && emailsSentCount == 0 && meetingsCount == 0) {
      return {
        'impressionsGrowth': null,
        'connectionsGrowth': null,
        'responseGrowth': null,
        'meetingsGrowth': null,
      };
    }

    final int days = timeframe == '7d'
        ? 7
        : timeframe == '90d'
            ? 90
            : timeframe == 'all'
                ? 365
                : 30;

    final now = DateTime.now();
    final windowStart = now.subtract(Duration(days: days));
    final prevWindowStart = now.subtract(Duration(days: days * 2));

    int currentPeriodImpressions = 0;
    int prevPeriodImpressions = 0;
    int currentPeriodConnections = 0;
    int prevPeriodConnections = 0;
    int currentPeriodMeetings = 0;
    int prevPeriodMeetings = 0;
    int currentPeriodEmails = 0;
    int prevPeriodEmails = 0;

    for (final item in eventsList) {
      if (item is! Map<String, dynamic>) continue;
      final createdAtStr = item['created_at'] as String?;
      if (createdAtStr == null) continue;
      final dt = DateTime.tryParse(createdAtStr);
      if (dt == null) continue;

      final type = (item['event_type'] as String?) ?? '';

      if (dt.isAfter(windowStart)) {
        if (type == 'connection') currentPeriodConnections++;
        if (type == 'email_sent') currentPeriodEmails++;
        if (type == 'meeting') currentPeriodMeetings++;
        currentPeriodImpressions++;
      } else if (dt.isAfter(prevWindowStart)) {
        if (type == 'connection') prevPeriodConnections++;
        if (type == 'email_sent') prevPeriodEmails++;
        if (type == 'meeting') prevPeriodMeetings++;
        prevPeriodImpressions++;
      }
    }

    String? calcPercent(int current, int prev) {
      if (current == 0 && prev == 0) return null;
      if (prev == 0) return '+$current new';
      final change = ((current - prev) / prev) * 100;
      final sign = change >= 0 ? '+' : '';
      return '$sign${change.toStringAsFixed(1)}%';
    }

    String? calcCountGrowth(int current, String label) {
      if (current <= 0) return null;
      return '+$current $label';
    }

    final impressionsGrowth = calcPercent(currentPeriodImpressions, prevPeriodImpressions);
    final connectionsGrowth = prevPeriodConnections > 0
        ? calcPercent(currentPeriodConnections, prevPeriodConnections)
        : (currentPeriodConnections > 0
            ? calcCountGrowth(currentPeriodConnections, 'new')
            : null);
    final responseGrowth = calcPercent(currentPeriodEmails, prevPeriodEmails);
    final meetingsGrowth = prevPeriodMeetings > 0
        ? calcPercent(currentPeriodMeetings, prevPeriodMeetings)
        : (currentPeriodMeetings > 0
            ? calcCountGrowth(currentPeriodMeetings, 'booked')
            : null);

    return {
      'impressionsGrowth': impressionsGrowth,
      'connectionsGrowth': connectionsGrowth,
      'responseGrowth': responseGrowth,
      'meetingsGrowth': meetingsGrowth,
    };
  }
}
