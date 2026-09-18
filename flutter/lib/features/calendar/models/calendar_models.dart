import 'package:flutter/foundation.dart';

@immutable
class CalendarEventItem {
  final String id;
  final String title;
  final String? description;
  final DateTime startTime;
  final DateTime? endTime;
  final String? location;
  final String? contactId;
  final String? contactName;
  final String? contactCompany;
  final String category; // 'Meeting', 'Networking', 'Call', 'Workshop', 'Follow-up'
  final bool isGoogleSynced;
  final bool notificationEnabled;
  final String source; // 'local' or 'google'
  final String? htmlLink;

  const CalendarEventItem({
    required this.id,
    required this.title,
    this.description,
    required this.startTime,
    this.endTime,
    this.location,
    this.contactId,
    this.contactName,
    this.contactCompany,
    this.category = 'Meeting',
    this.isGoogleSynced = false,
    this.notificationEnabled = true,
    this.source = 'local',
    this.htmlLink,
  });

  factory CalendarEventItem.fromMap(Map<String, dynamic> map) {
    String? contactName;
    String? contactCompany;

    if (map['contacts'] is Map) {
      contactName = map['contacts']['name'] as String?;
      contactCompany = map['contacts']['company'] as String?;
    } else if (map['contact'] is Map) {
      contactName = map['contact']['name'] as String?;
      contactCompany = map['contact']['company'] as String?;
    }

    final parsedStart =
        DateTime.tryParse(map['start_time']?.toString() ?? '') ?? DateTime.now();
    final parsedEnd = map['end_time'] != null
        ? DateTime.tryParse(map['end_time'].toString())
        : null;

    final loc = map['location']?.toString() ?? '';
    String cat = map['category']?.toString() ?? 'Meeting';
    if (loc.toLowerCase().contains('call') || (map['title']?.toString() ?? '').toLowerCase().contains('call')) {
      cat = 'Call';
    } else if ((map['title']?.toString() ?? '').toLowerCase().contains('network')) {
      cat = 'Networking';
    }

    return CalendarEventItem(
      id: map['id']?.toString() ?? '',
      title: map['title']?.toString() ?? 'Scheduled Event',
      description: map['description']?.toString(),
      startTime: parsedStart,
      endTime: parsedEnd,
      location: loc.isNotEmpty ? loc : null,
      contactId: map['contact_id']?.toString(),
      contactName: contactName,
      contactCompany: contactCompany,
      category: cat,
      isGoogleSynced: map['google_calendar_synced'] == true,
      notificationEnabled: map['notification_enabled'] != false,
      source: map['source']?.toString() ?? 'local',
      htmlLink: map['html_link']?.toString(),
    );
  }

  Map<String, dynamic> toMap(String userId) {
    return {
      'user_id': userId,
      'title': title,
      'description': description,
      'start_time': startTime.toUtc().toIso8601String(),
      'end_time': endTime?.toUtc().toIso8601String(),
      'location': location,
      'contact_id': contactId,
      'google_calendar_synced': isGoogleSynced,
      'notification_enabled': notificationEnabled,
    };
  }

  String get timeRangeFormatted {
    final startStr = _formatTime(startTime);
    if (endTime == null) return startStr;
    final endStr = _formatTime(endTime!);
    return '$startStr - $endStr';
  }

  static String _formatTime(DateTime dt) {
    final hour = dt.hour;
    final minute = dt.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final standardHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return '$standardHour:$minute $period';
  }

  bool isSameDay(DateTime date) {
    return startTime.year == date.year &&
        startTime.month == date.month &&
        startTime.day == date.day;
  }

  CalendarEventItem copyWith({
    String? id,
    String? title,
    String? description,
    DateTime? startTime,
    DateTime? endTime,
    String? location,
    String? contactId,
    String? contactName,
    String? contactCompany,
    String? category,
    bool? isGoogleSynced,
    bool? notificationEnabled,
    String? source,
    String? htmlLink,
  }) {
    return CalendarEventItem(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      location: location ?? this.location,
      contactId: contactId ?? this.contactId,
      contactName: contactName ?? this.contactName,
      contactCompany: contactCompany ?? this.contactCompany,
      category: category ?? this.category,
      isGoogleSynced: isGoogleSynced ?? this.isGoogleSynced,
      notificationEnabled: notificationEnabled ?? this.notificationEnabled,
      source: source ?? this.source,
      htmlLink: htmlLink ?? this.htmlLink,
    );
  }
}

@immutable
class CalendarState {
  final DateTime currentMonth;
  final DateTime selectedDate;
  final List<CalendarEventItem> events;
  final bool isLoading;
  final bool isGoogleCalendarConnected;
  final String? googleCalendarEmail;
  final String categoryFilter;
  final String? errorMessage;

  const CalendarState({
    required this.currentMonth,
    required this.selectedDate,
    this.events = const [],
    this.isLoading = false,
    this.isGoogleCalendarConnected = false,
    this.googleCalendarEmail,
    this.categoryFilter = 'All',
    this.errorMessage,
  });

  List<CalendarEventItem> get eventsForSelectedDay {
    return events.where((e) {
      final matchesDay = e.isSameDay(selectedDate);
      if (!matchesDay) return false;
      if (categoryFilter == 'All') return true;
      return e.category.toLowerCase() == categoryFilter.toLowerCase();
    }).toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));
  }

  List<CalendarEventItem> get upcomingReminders {
    final now = DateTime.now();
    final twoHoursLater = now.add(const Duration(hours: 2));
    return events.where((e) {
      return e.startTime.isAfter(now.subtract(const Duration(minutes: 10))) &&
          e.startTime.isBefore(twoHoursLater);
    }).toList();
  }

  CalendarState copyWith({
    DateTime? currentMonth,
    DateTime? selectedDate,
    List<CalendarEventItem>? events,
    bool? isLoading,
    bool? isGoogleCalendarConnected,
    String? googleCalendarEmail,
    String? categoryFilter,
    String? errorMessage,
  }) {
    return CalendarState(
      currentMonth: currentMonth ?? this.currentMonth,
      selectedDate: selectedDate ?? this.selectedDate,
      events: events ?? this.events,
      isLoading: isLoading ?? this.isLoading,
      isGoogleCalendarConnected:
          isGoogleCalendarConnected ?? this.isGoogleCalendarConnected,
      googleCalendarEmail: googleCalendarEmail ?? this.googleCalendarEmail,
      categoryFilter: categoryFilter ?? this.categoryFilter,
      errorMessage: errorMessage,
    );
  }
}
