import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/supabase_service.dart';
import '../models/dashboard_models.dart';

export '../models/dashboard_models.dart';

class DashboardService {
  DashboardService._();

  /// Fetches comprehensive dashboard data for [userId]
  static Future<DashboardData> fetchDashboardData(
    String userId, {
    String? userEmail,
  }) async {
    try {
      final client = SupabaseService.client;

      // 1. Total Contacts Count
      int totalContacts = 0;
      try {
        final contactsRes = await client
            .from('contacts')
            .select('id')
            .eq('user_id', userId);
        totalContacts = (contactsRes as List<dynamic>).length;
      } catch (_) {}

      // 2. Network Growth (Contacts added in last 7 days)
      int networkGrowth = 0;
      try {
        final sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7)).toIso8601String();
        final recentContactsRes = await client
            .from('contacts')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', sevenDaysAgo);
        networkGrowth = (recentContactsRes as List<dynamic>).length;
      } catch (_) {}

      // 3. Emails Sent Count (All time)
      int emailsSent = 0;
      try {
        final emailsRes = await client
            .from('emails')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'sent');
        emailsSent = (emailsRes as List<dynamic>).length;
      } catch (_) {}

      // 4. Upcoming Events (from calendar_events)
      int upcomingEventsCount = 0;
      List<DashboardEventItem> upcomingEventsList = [];
      try {
        final nowIso = DateTime.now().toIso8601String();
        final eventsRes = await client
            .from('calendar_events')
            .select('id, title, description, start_time, end_time, location, contacts(name)')
            .eq('user_id', userId)
            .gte('start_time', nowIso)
            .order('start_time', ascending: true)
            .limit(5);

        final events = eventsRes as List<dynamic>;
        upcomingEventsList = events
            .map((e) => DashboardEventItem.fromMap(e as Map<String, dynamic>))
            .toList();
        upcomingEventsCount = upcomingEventsList.length;
      } catch (_) {
        // Fallback query without relation if foreign key is not named contacts
        try {
          final nowIso = DateTime.now().toIso8601String();
          final fallbackRes = await client
              .from('calendar_events')
              .select('*')
              .eq('user_id', userId)
              .gte('start_time', nowIso)
              .order('start_time', ascending: true)
              .limit(5);
          final events = fallbackRes as List<dynamic>;
          upcomingEventsList = events
              .map((e) => DashboardEventItem.fromMap(e as Map<String, dynamic>))
              .toList();
          upcomingEventsCount = upcomingEventsList.length;
        } catch (_) {}
      }

      // 5. Networking Events Summary (from events table, last 30 days)
      NetworkingSummaryData networkingSummary = const NetworkingSummaryData();
      try {
        final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30)).toIso8601String();
        final netEventsRes = await client
            .from('events')
            .select('id, event_type, description, created_at, contacts(name)')
            .eq('user_id', userId)
            .inFilter('event_type', ['email_sent', 'meeting', 'call', 'connection'])
            .gte('created_at', thirtyDaysAgo)
            .order('created_at', ascending: false)
            .limit(20);

        final netList = (netEventsRes as List<dynamic>)
            .map((e) => e as Map<String, dynamic>)
            .toList();

        final recentNetItems = netList
            .take(5)
            .map((e) => NetworkingEventItem.fromMap(e))
            .toList();

        final emailsCount = netList.where((e) => e['event_type'] == 'email_sent').length;
        final meetingsCount = netList.where((e) => e['event_type'] == 'meeting').length;
        final callsCount = netList.where((e) => e['event_type'] == 'call').length;
        final connectionsCount = netList.where((e) => e['event_type'] == 'connection').length;

        networkingSummary = NetworkingSummaryData(
          totalEvents: netList.length,
          emailsCount: emailsCount,
          meetingsCount: meetingsCount,
          callsCount: callsCount,
          connectionsCount: connectionsCount,
          recentEvents: recentNetItems,
        );
      } catch (_) {
        // Fallback without contacts relation
        try {
          final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30)).toIso8601String();
          final fallbackNetRes = await client
              .from('events')
              .select('*')
              .eq('user_id', userId)
              .inFilter('event_type', ['email_sent', 'meeting', 'call', 'connection'])
              .gte('created_at', thirtyDaysAgo)
              .order('created_at', ascending: false)
              .limit(20);

          final netList = (fallbackNetRes as List<dynamic>)
              .map((e) => e as Map<String, dynamic>)
              .toList();

          final recentNetItems = netList
              .take(5)
              .map((e) => NetworkingEventItem.fromMap(e))
              .toList();

          networkingSummary = NetworkingSummaryData(
            totalEvents: netList.length,
            emailsCount: netList.where((e) => e['event_type'] == 'email_sent').length,
            meetingsCount: netList.where((e) => e['event_type'] == 'meeting').length,
            callsCount: netList.where((e) => e['event_type'] == 'call').length,
            connectionsCount: netList.where((e) => e['event_type'] == 'connection').length,
            recentEvents: recentNetItems,
          );
        } catch (_) {}
      }

      // 6. Email & Calendar Highlights (real data from Gmail connection, emails, replies & events)
      final emailHighlights = await _fetchEmailHighlights(
        client,
        userId,
        userEmail: userEmail,
      );

      return DashboardData(
        totalContacts: totalContacts,
        emailsSent: emailsSent,
        upcomingEvents: upcomingEventsCount,
        networkGrowth: networkGrowth,
        upcomingEventsList: upcomingEventsList,
        networkingSummary: networkingSummary,
        emailHighlights: emailHighlights,
        isLoading: false,
      );
    } catch (e) {
      return DashboardData.empty.copyWith(error: e.toString());
    }
  }

  /// Fetches real email connection status, replies, emails, and calendar events
  /// to synthesize structured AI highlights matching the web app.
  static Future<EmailHighlightsData> _fetchEmailHighlights(
    SupabaseClient client,
    String userId, {
    String? userEmail,
  }) async {
    bool isEmailConnected = false;
    String? connectedEmailAddress;
    bool isCalendarConnected = false;

    // 1. Check Gmail connection
    try {
      final gmailRes = await client
          .from('gmail_connections')
          .select('email_address, updated_at')
          .eq('user_id', userId)
          .maybeSingle();

      if (gmailRes != null) {
        isEmailConnected = true;
        connectedEmailAddress = gmailRes['email_address'] as String?;
      }
    } catch (_) {}

    // 2. Auto-detect Google sign-in: if user signed in with Google OAuth or has a @gmail.com account,
    // they are automatically connected to Gmail without needing a manual connect step.
    final currentUser = client.auth.currentUser;
    final effectiveEmail = userEmail ?? currentUser?.email;
    final isGoogleUser = (currentUser != null &&
            (currentUser.appMetadata['provider'] == 'google' ||
                currentUser.identities?.any((i) => i.provider == 'google') == true)) ||
        (effectiveEmail != null && effectiveEmail.toLowerCase().endsWith('@gmail.com'));

    if (isGoogleUser) {
      isEmailConnected = true;
      connectedEmailAddress ??= effectiveEmail;

      // Auto-heal / sync into gmail_connections so backend & realtime are updated
      final session = client.auth.currentSession;
      try {
        await client.from('gmail_connections').upsert({
          'user_id': userId,
          'access_token': session?.providerToken ?? session?.accessToken ?? 'oauth_google',
          'refresh_token': session?.providerRefreshToken,
          'email_address': connectedEmailAddress,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }, onConflict: 'user_id');
      } catch (_) {}
    }

    // 3. Fallback to network_profiles or auth email if connectedEmailAddress is still null
    if (connectedEmailAddress == null || connectedEmailAddress.isEmpty) {
      try {
        final profileRes = await client
            .from('network_profiles')
            .select('email')
            .eq('user_id', userId)
            .maybeSingle();
        final profileEmail = profileRes?['email'] as String?;
        if (profileEmail != null && profileEmail.isNotEmpty) {
          if (profileEmail.toLowerCase().endsWith('@gmail.com')) {
            isEmailConnected = true;
          }
          if (isEmailConnected) {
            connectedEmailAddress = profileEmail;
          }
        }
      } catch (_) {}
    }

    // 4. Check Google Calendar connection
    try {
      final calConnRes = await client
          .from('google_calendar_connections')
          .select('calendar_id, sync_enabled')
          .eq('user_id', userId)
          .maybeSingle();

      if (calConnRes != null) {
        isCalendarConnected = true;
      }
    } catch (_) {}

    // 5. Fallback to auth email if connectedEmailAddress is still null
    if (isEmailConnected &&
        (connectedEmailAddress == null || connectedEmailAddress.isEmpty)) {
      try {
        final authEmail = effectiveEmail ?? client.auth.currentUser?.email;
        if (authEmail != null && authEmail.isNotEmpty) {
          connectedEmailAddress = authEmail;
        }
      } catch (_) {}
    }

    // 4. Fetch real emails, replies, calendar events, and activity
    List<Map<String, dynamic>> emailRows = [];
    try {
      final res = await client
          .from('emails')
          .select('id, subject, body, status, sent_at, created_at')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(10);
      emailRows = (res as List<dynamic>)
          .map((e) => e as Map<String, dynamic>)
          .where((e) =>
              e['subject'] != null && (e['subject'] as String).trim().isNotEmpty)
          .toList();
    } catch (_) {}

    List<Map<String, dynamic>> replyRows = [];
    try {
      final res = await client
          .from('email_replies')
          .select(
              'id, subject, snippet, body, from_email, received_at, is_read')
          .eq('user_id', userId)
          .order('received_at', ascending: false)
          .limit(10);
      replyRows = (res as List<dynamic>)
          .map((e) => e as Map<String, dynamic>)
          .where((e) =>
              e['subject'] != null && (e['subject'] as String).trim().isNotEmpty)
          .toList();
    } catch (_) {}

    List<Map<String, dynamic>> calEventRows = [];
    try {
      final res = await client
          .from('calendar_events')
          .select('id, title, description, start_time, end_time, location')
          .eq('user_id', userId)
          .order('start_time', ascending: true)
          .limit(10);
      calEventRows = (res as List<dynamic>)
          .map((e) => e as Map<String, dynamic>)
          .where((e) =>
              e['title'] != null && (e['title'] as String).trim().isNotEmpty)
          .toList();
    } catch (_) {}

    List<Map<String, dynamic>> interactionRows = [];
    try {
      final res = await client
          .from('events')
          .select('id, event_type, description, created_at')
          .eq('user_id', userId)
          .inFilter('event_type', ['meeting', 'calendar', 'email_sent'])
          .order('created_at', ascending: false)
          .limit(10);
      interactionRows = (res as List<dynamic>)
          .map((e) => e as Map<String, dynamic>)
          .where((e) =>
              e['description'] != null &&
              (e['description'] as String).trim().isNotEmpty)
          .toList();
    } catch (_) {}

    // 5. Synthesize sections matching web app:
    // Key Updates, Action Items, Dates & Schedule
    final List<HighlightSectionItem> sections = [];
    final List<String> keyUpdates = [];
    final List<String> actionItems = [];
    final List<String> datesItems = [];

    // Process replies
    for (final reply in replyRows) {
      final from = (reply['from_email'] as String? ?? 'Contact').trim();
      final subject = (reply['subject'] as String? ?? 'No subject').trim();
      final snippet = (reply['snippet'] as String? ?? '').trim();
      final isRead = reply['is_read'] == true;

      if (keyUpdates.length < 3) {
        if (snippet.isNotEmpty) {
          keyUpdates.add(
              'Received reply from $from on "$subject" - "${_truncate(snippet, 80)}"');
        } else {
          keyUpdates.add('Received reply from $from regarding "$subject"');
        }
      }

      if (!isRead && actionItems.length < 3) {
        actionItems.add('Follow up on unread message from $from ("$subject")');
      }
    }

    // Process sent emails
    for (final email in emailRows) {
      final subject = (email['subject'] as String? ?? '').trim();
      final status = (email['status'] as String? ?? 'sent').trim();
      if (subject.isEmpty) continue;

      if (status == 'draft' && actionItems.length < 3) {
        actionItems.add('Complete and send draft email: "$subject"');
      } else if (keyUpdates.length < 4) {
        keyUpdates.add('Sent email to contact: "$subject"');
      }
    }

    // Process calendar events
    final now = DateTime.now();
    for (final cal in calEventRows) {
      final title = (cal['title'] as String? ?? 'Calendar Event').trim();
      final startTimeStr = cal['start_time'] as String?;
      final location = (cal['location'] as String? ?? '').trim();
      DateTime? startTime;
      if (startTimeStr != null) {
        startTime = DateTime.tryParse(startTimeStr);
      }

      if (startTime != null) {
        final formattedDate = _formatEventDate(startTime);
        final locText = location.isNotEmpty ? ' ($location)' : '';
        datesItems.add('$title - $formattedDate$locText');

        final hoursDiff = startTime.difference(now).inHours;
        if (hoursDiff >= 0 && hoursDiff <= 48 && actionItems.length < 3) {
          actionItems
              .add('Prepare agenda & notes for "$title" ($formattedDate)');
        }
      } else {
        datesItems.add(title);
      }
    }

    // Process interaction events
    for (final ev in interactionRows) {
      final type = (ev['event_type'] as String? ?? '').trim();
      final desc = (ev['description'] as String? ?? '').trim();
      if (desc.isEmpty) continue;

      if (type == 'meeting' && keyUpdates.length < 4) {
        keyUpdates.add('Meeting logged: $desc');
      } else if (type == 'email_sent' && keyUpdates.length < 4) {
        keyUpdates.add('Email interaction: $desc');
      }
    }

    // Always provide the 3 categories matching the web app:
    // Key updates, Action items, Dates
    sections.add(HighlightSectionItem(
      title: 'Key updates',
      items: keyUpdates.isNotEmpty ? keyUpdates : const ['No key updates found.'],
    ));
    sections.add(HighlightSectionItem(
      title: 'Action items',
      items: actionItems.isNotEmpty ? actionItems : const ['No action items found.'],
    ));
    sections.add(HighlightSectionItem(
      title: 'Dates',
      items: datesItems.isNotEmpty ? datesItems : const ['No upcoming dates found.'],
    ));

    return EmailHighlightsData(
      isEmailConnected: isEmailConnected,
      connectedEmailAddress: connectedEmailAddress,
      isCalendarConnected: isCalendarConnected,
      sections: sections,
    );
  }

  static String _formatEventDate(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final eventDay = DateTime(dt.year, dt.month, dt.day);
    final daysDiff = eventDay.difference(today).inDays;

    final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final minute = dt.minute.toString().padLeft(2, '0');
    final ampm = dt.hour >= 12 ? 'PM' : 'AM';
    final timeStr = '$hour:$minute $ampm';

    if (daysDiff == 0) return 'Today at $timeStr';
    if (daysDiff == 1) return 'Tomorrow at $timeStr';
    if (daysDiff == -1) return 'Yesterday at $timeStr';

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[dt.month - 1]} ${dt.day} at $timeStr';
  }

  static String _truncate(String str, int maxLen) {
    if (str.length <= maxLen) return str;
    return '${str.substring(0, maxLen)}...';
  }
}
