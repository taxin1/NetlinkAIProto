import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/localization/app_localizations.dart';

/// Aggregated dashboard data state
class DashboardData {
  final int totalContacts;
  final int emailsSent;
  final int upcomingEvents;
  final int networkGrowth;
  final List<double> weeklyGrowthPoints;
  final List<DashboardEventItem> upcomingEventsList;
  final NetworkingSummaryData networkingSummary;
  final EmailHighlightsData emailHighlights;
  final bool isLoading;
  final String? error;

  const DashboardData({
    this.totalContacts = 0,
    this.emailsSent = 0,
    this.upcomingEvents = 0,
    this.networkGrowth = 0,
    this.weeklyGrowthPoints = const [0, 0, 0, 0, 0, 0, 0],
    this.upcomingEventsList = const [],
    this.networkingSummary = const NetworkingSummaryData(),
    this.emailHighlights = const EmailHighlightsData(),
    this.isLoading = false,
    this.error,
  });

  static const DashboardData empty = DashboardData();

  DashboardData copyWith({
    int? totalContacts,
    int? emailsSent,
    int? upcomingEvents,
    int? networkGrowth,
    List<double>? weeklyGrowthPoints,
    List<DashboardEventItem>? upcomingEventsList,
    NetworkingSummaryData? networkingSummary,
    EmailHighlightsData? emailHighlights,
    bool? isLoading,
    String? error,
  }) {
    return DashboardData(
      totalContacts: totalContacts ?? this.totalContacts,
      emailsSent: emailsSent ?? this.emailsSent,
      upcomingEvents: upcomingEvents ?? this.upcomingEvents,
      networkGrowth: networkGrowth ?? this.networkGrowth,
      weeklyGrowthPoints: weeklyGrowthPoints ?? this.weeklyGrowthPoints,
      upcomingEventsList: upcomingEventsList ?? this.upcomingEventsList,
      networkingSummary: networkingSummary ?? this.networkingSummary,
      emailHighlights: emailHighlights ?? this.emailHighlights,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

/// Represents an upcoming calendar event on the dashboard
class DashboardEventItem {
  final String id;
  final String title;
  final String? description;
  final DateTime startTime;
  final DateTime? endTime;
  final String? location;
  final String? contactName;

  const DashboardEventItem({
    required this.id,
    required this.title,
    this.description,
    required this.startTime,
    this.endTime,
    this.location,
    this.contactName,
  });

  factory DashboardEventItem.fromMap(Map<String, dynamic> map) {
    String? contactName;
    if (map['contacts'] is Map) {
      contactName = map['contacts']['name'] as String?;
    } else if (map['contact'] is Map) {
      contactName = map['contact']['name'] as String?;
    }

    final parsedStart = DateTime.tryParse(map['start_time']?.toString() ?? '') ?? DateTime.now();
    final parsedEnd = map['end_time'] != null ? DateTime.tryParse(map['end_time'].toString()) : null;

    return DashboardEventItem(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? 'Event',
      description: map['description']?.toString(),
      startTime: parsedStart,
      endTime: parsedEnd,
      location: map['location']?.toString(),
      contactName: contactName,
    );
  }

  String get dayString => '${startTime.day}';

  String get monthString {
    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    return months[(startTime.month - 1).clamp(0, 11)];
  }

  String get timeFormatted {
    final hour = startTime.hour;
    final minute = startTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final standardHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return '$standardHour:$minute $period';
  }

  String get timeLabel {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final eventDay = DateTime(startTime.year, startTime.month, startTime.day);
    final difference = eventDay.difference(today).inDays;

    if (difference == 0) return 'Today';
    if (difference == 1) return 'Tomorrow';
    if (difference > 1 && difference <= 7) return 'This Week';
    if (difference > 7 && difference <= 30) return 'This Month';
    return 'Later';
  }

  String localizedMonthString(BuildContext context) {
    if (!context.isJapanese) return monthString;
    return '${startTime.month}月';
  }

  String localizedTimeLabel(BuildContext context) {
    if (!context.isJapanese) return timeLabel;
    switch (timeLabel) {
      case 'Today':
        return '今日';
      case 'Tomorrow':
        return '明日';
      case 'This Week':
        return context.tr('thisWeek');
      case 'This Month':
        return '今月';
      default:
        return '以降';
    }
  }

  Color badgeColor(BuildContext context) {
    switch (timeLabel) {
      case 'Today':
        return context.colors.successGlow;
      case 'Tomorrow':
        return context.colors.primary;
      case 'This Week':
        return context.colors.secondary;
      case 'This Month':
        return context.colors.warningAmber;
      default:
        return context.colors.onSurfaceVariant;
    }
  }
}

/// Networking events summary data (last 30 days)
class NetworkingSummaryData {
  final int totalEvents;
  final int emailsCount;
  final int meetingsCount;
  final int callsCount;
  final int connectionsCount;
  final List<NetworkingEventItem> recentEvents;

  const NetworkingSummaryData({
    this.totalEvents = 0,
    this.emailsCount = 0,
    this.meetingsCount = 0,
    this.callsCount = 0,
    this.connectionsCount = 0,
    this.recentEvents = const [],
  });
}

/// Individual networking event item
class NetworkingEventItem {
  final String id;
  final String eventType; // 'email_sent', 'meeting', 'call', 'connection'
  final String? description;
  final String? contactName;
  final DateTime createdAt;

  const NetworkingEventItem({
    required this.id,
    required this.eventType,
    this.description,
    this.contactName,
    required this.createdAt,
  });

  factory NetworkingEventItem.fromMap(Map<String, dynamic> map) {
    String? contactName;
    if (map['contact'] is Map) {
      contactName = map['contact']['name'] as String?;
    } else if (map['contacts'] is Map) {
      contactName = map['contacts']['name'] as String?;
    }

    return NetworkingEventItem(
      id: map['id']?.toString() ?? '',
      eventType: map['event_type']?.toString() ?? 'connection',
      description: map['description']?.toString(),
      contactName: contactName,
      createdAt: DateTime.tryParse(map['created_at']?.toString() ?? '') ?? DateTime.now(),
    );
  }

  String get label {
    switch (eventType) {
      case 'email_sent':
        return 'Email';
      case 'meeting':
        return 'Meeting';
      case 'call':
        return 'Call';
      case 'connection':
        return 'Connection';
      default:
        return 'Activity';
    }
  }

  IconData get icon {
    switch (eventType) {
      case 'email_sent':
        return Icons.mail_outline_rounded;
      case 'meeting':
        return Icons.groups_outlined;
      case 'call':
        return Icons.phone_outlined;
      case 'connection':
        return Icons.handshake_outlined;
      default:
        return Icons.hub_outlined;
    }
  }

  Color color(BuildContext context) {
    switch (eventType) {
      case 'email_sent':
        return context.colors.primary;
      case 'meeting':
        return context.colors.secondary;
      case 'call':
        return context.colors.successGlow;
      case 'connection':
        return context.colors.warningAmber;
      default:
        return context.colors.onSurfaceVariant;
    }
  }

  String get relativeTime {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}w ago';
    return '${(diff.inDays / 30).floor()}mo ago';
  }

  String localizedLabel(BuildContext context) {
    if (!context.isJapanese) return label;
    switch (eventType) {
      case 'email_sent':
        return 'メール送信';
      case 'meeting':
        return context.tr('meetings');
      case 'call':
        return context.tr('calls');
      case 'connection':
        return context.tr('connects');
      default:
        return 'アクティビティ';
    }
  }

  String localizedRelativeTime(BuildContext context) {
    final diff = DateTime.now().difference(createdAt);
    if (!context.isJapanese) {
      return relativeTime;
    }
    if (diff.inSeconds < 60) return 'たった今';
    if (diff.inMinutes < 60) return '${diff.inMinutes}分前';
    if (diff.inHours < 24) return '${diff.inHours}時間前';
    if (diff.inDays == 1) return '昨日';
    if (diff.inDays < 7) return '${diff.inDays}日前';
    if (diff.inDays < 30) return '${(diff.inDays / 7).floor()}週間前';
    return '${(diff.inDays / 30).floor()}ヶ月前';
  }
}

/// Email highlights data
class EmailHighlightsData {
  final bool isEmailConnected;
  final String? connectedEmailAddress;
  final bool isCalendarConnected;
  final List<HighlightSectionItem> sections;
  final String? error;

  const EmailHighlightsData({
    this.isEmailConnected = false,
    this.connectedEmailAddress,
    this.isCalendarConnected = false,
    this.sections = const [],
    this.error,
  });

  bool get hasData => sections.isNotEmpty;

  EmailHighlightsData copyWith({
    bool? isEmailConnected,
    String? connectedEmailAddress,
    bool? isCalendarConnected,
    List<HighlightSectionItem>? sections,
    String? error,
  }) {
    return EmailHighlightsData(
      isEmailConnected: isEmailConnected ?? this.isEmailConnected,
      connectedEmailAddress:
          connectedEmailAddress ?? this.connectedEmailAddress,
      isCalendarConnected: isCalendarConnected ?? this.isCalendarConnected,
      sections: sections ?? this.sections,
      error: error ?? this.error,
    );
  }
}

class HighlightSectionItem {
  final String title;
  final List<String> items;

  const HighlightSectionItem({
    required this.title,
    required this.items,
  });
}
