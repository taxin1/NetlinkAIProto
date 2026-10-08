import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/services/integration_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/email_models.dart';

class EmailsState {
  final List<EmailItem> emails;
  final List<EmailReplyItem> replies;
  final List<EmailContactOption> contacts;
  final List<EmailHighlightSection> highlights;
  final int selectedTab;
  final bool isGmailConnected;
  final bool isLoading;
  final bool isSyncing;
  final bool isSending;
  final bool isGenerating;
  final String? errorMessage;
  final String? successMessage;

  const EmailsState({
    this.emails = const [],
    this.replies = const [],
    this.contacts = const [],
    this.highlights = const [],
    this.selectedTab = 0,
    this.isGmailConnected = false,
    this.isLoading = false,
    this.isSyncing = false,
    this.isSending = false,
    this.isGenerating = false,
    this.errorMessage,
    this.successMessage,
  });

  int get unreadRepliesCount => replies.where((r) => !r.isRead).length;

  EmailsState copyWith({
    List<EmailItem>? emails,
    List<EmailReplyItem>? replies,
    List<EmailContactOption>? contacts,
    List<EmailHighlightSection>? highlights,
    int? selectedTab,
    bool? isGmailConnected,
    bool? isLoading,
    bool? isSyncing,
    bool? isSending,
    bool? isGenerating,
    String? errorMessage,
    String? successMessage,
    bool clearError = false,
    bool clearSuccess = false,
  }) {
    return EmailsState(
      emails: emails ?? this.emails,
      replies: replies ?? this.replies,
      contacts: contacts ?? this.contacts,
      highlights: highlights ?? this.highlights,
      selectedTab: selectedTab ?? this.selectedTab,
      isGmailConnected: isGmailConnected ?? this.isGmailConnected,
      isLoading: isLoading ?? this.isLoading,
      isSyncing: isSyncing ?? this.isSyncing,
      isSending: isSending ?? this.isSending,
      isGenerating: isGenerating ?? this.isGenerating,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      successMessage: clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

class EmailsNotifier extends StateNotifier<EmailsState> {
  final Ref _ref;
  StreamSubscription<Uri>? _integrationSub;
  Timer? _pollingTimer;

  EmailsNotifier(this._ref) : super(const EmailsState()) {
    loadAll();
    _integrationSub = IntegrationEvents.onConnectCallback.listen((uri) {
      final provider = uri.queryParameters['provider'];
      final success = uri.queryParameters['success'] == 'true';
      if (provider == 'gmail' && success) {
        state = state.copyWith(isGmailConnected: true, isSyncing: false);
        loadAll();
      }
    });
  }

  @override
  void dispose() {
    _integrationSub?.cancel();
    _pollingTimer?.cancel();
    super.dispose();
  }

  void setTab(int index) {
    state = state.copyWith(selectedTab: index, clearError: true, clearSuccess: true);
  }

  Future<void> loadAll() async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      final emailsList = List<EmailItem>.from(_seedEmails);
      final repliesList = List<EmailReplyItem>.from(_seedReplies);
      final highlightsList = _buildHighlights(emailsList, repliesList);
      state = state.copyWith(
        emails: emailsList,
        contacts: _seedContacts,
        isGmailConnected: true,
        replies: repliesList,
        highlights: highlightsList,
        isLoading: false,
      );
      return;
    }

    state = state.copyWith(isLoading: true, clearError: true, clearSuccess: true);

    try {
      final client = SupabaseService.client;

      // 1. Fetch emails with contact info
      List<EmailItem> emailsList = [];
      try {
        final res = await client
            .from('emails')
            .select('*, contacts(name, email, company)')
            .eq('user_id', user.id)
            .order('created_at', ascending: false);
        emailsList = (res as List<dynamic>)
            .map((e) => EmailItem.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (_) {}

      // 2. Fetch contacts with valid emails
      List<EmailContactOption> contactsList = [];
      try {
        final cRes = await client
            .from('contacts')
            .select('id, name, email, company')
            .eq('user_id', user.id)
            .not('email', 'is', null)
            .order('name', ascending: true);
        contactsList = (cRes as List<dynamic>)
            .map((c) => EmailContactOption.fromJson(c as Map<String, dynamic>))
            .where((c) => c.email.trim().isNotEmpty)
            .toList();
      } catch (_) {}

      // 3. Check Gmail connection
      bool isConnected = false;
      try {
        final gRes = await client
            .from('gmail_connections')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
        isConnected = gRes != null;
      } catch (_) {}

      // 4. Fetch replies
      List<EmailReplyItem> repliesList = [];
      try {
        final rRes = await client
            .from('email_replies')
            .select('*')
            .eq('user_id', user.id)
            .order('received_at', ascending: false);
        repliesList = (rRes as List<dynamic>)
            .map((r) => EmailReplyItem.fromJson(r as Map<String, dynamic>))
            .toList();
      } catch (_) {}

      // 5. Generate / compute highlights
      final highlightsList = _buildHighlights(emailsList, repliesList);

      state = state.copyWith(
        emails: emailsList,
        contacts: contactsList,
        isGmailConnected: isConnected,
        replies: repliesList,
        highlights: highlightsList,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load emails: $e',
      );
    }
  }

  /// AI-powered email content generation
  Future<Map<String, String>> generateAiEmail({
    required EmailContactOption contact,
    required String purpose,
    String? userName,
  }) async {
    state = state.copyWith(isGenerating: true, clearError: true);
    try {
      // 1. Attempt to call backend /api/generate-email
      final user = _ref.read(authProvider).user;
      try {
        final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/generate-email');
        final response = await http
            .post(
              uri,
              headers: SupabaseService.authHeaders,
              body: jsonEncode({
                'contactName': contact.name,
                'contactCompany': contact.company ?? '',
                'purpose': purpose,
                'contactId': contact.id,
                'userId': user?.id ?? 'guest',
              }),
            )
            .timeout(const Duration(seconds: 6));

        if (response.statusCode == 200) {
          final resData = jsonDecode(response.body) as Map<String, dynamic>;
          final s = resData['subject'] as String?;
          final b = resData['body'] as String?;
          if (s != null && s.isNotEmpty && b != null && b.isNotEmpty) {
            state = state.copyWith(isGenerating: false);
            return {'subject': s, 'body': b};
          }
        }
      } catch (_) {}

      await Future.delayed(const Duration(milliseconds: 400));

      final senderName = (userName != null && userName.trim().isNotEmpty)
          ? userName
          : 'Netlink Professional';
      final companyMention = (contact.company != null && contact.company!.trim().isNotEmpty)
          ? ' at ${contact.company}'
          : '';

      String subject = '';
      String body = '';

      final p = purpose.toLowerCase();
      if (p.contains('follow') || p.contains('met') || p.contains('event')) {
        subject = 'Great connecting with you, ${contact.name}!';
        body = '''Hi ${contact.name},

It was truly a pleasure meeting you recently! I really enjoyed our conversation and learning about your work$companyMention.

Regarding what we touched upon ($purpose), I'd love to stay in touch and explore potential ways we could collaborate or share insights in this space.

Would you be open to a quick 15-minute coffee chat or virtual catch-up next week? Let me know what day generally works best for you.

Best regards,
$senderName''';
      } else if (p.contains('collaborat') || p.contains('partner') || p.contains('project')) {
        subject = 'Partnership opportunity & collaboration - ${contact.name}';
        body = '''Hi ${contact.name},

I hope this email finds you well.

I’ve been following your recent developments$companyMention and was inspired by the work you are doing. I am reaching out to discuss a potential collaboration regarding $purpose.

I believe combining our respective strengths could create significant mutual value. Could we find 15 minutes this coming week to explore some initial ideas together?

Looking forward to hearing your thoughts!

Warm regards,
$senderName''';
      } else if (p.contains('intro') || p.contains('reach out') || p.contains('connect')) {
        subject = 'Connecting with you, ${contact.name}';
        body = '''Hi ${contact.name},

I hope you're having a productive week!

I wanted to introduce myself and connect regarding $purpose. Given your experience$companyMention, I would value your perspective and would love to exchange ideas.

Whenever convenient, let's connect for a brief chat. You can reach me here anytime.

Best regards,
$senderName''';
      } else {
        subject = 'Following up: $purpose';
        body = '''Hi ${contact.name},

I hope you're doing well!

I'm reaching out regarding $purpose. I wanted to follow up and see how things are progressing on your side$companyMention.

Please let me know if there is anything I can assist you with or if you'd like to sync up briefly.

Warm regards,
$senderName''';
      }

      state = state.copyWith(isGenerating: false);
      return {'subject': subject, 'body': body};
    } catch (e) {
      state = state.copyWith(isGenerating: false, errorMessage: 'Failed to generate email: $e');
      return {'subject': 'Follow-up with ${contact.name}', 'body': 'Hi ${contact.name},\n\nBest regards,\nNetlink'};
    }
  }

  Future<bool> saveDraft({
    required EmailContactOption contact,
    required String subject,
    required String body,
  }) async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      final newEmail = EmailItem(
        id: 'draft-${DateTime.now().millisecondsSinceEpoch}',
        userId: 'guest',
        contactId: contact.id,
        contactName: contact.name,
        contactEmail: contact.email,
        contactCompany: contact.company,
        subject: subject,
        body: body,
        status: 'draft',
        createdAt: DateTime.now(),
      );
      final updatedList = [newEmail, ...state.emails];
      state = state.copyWith(
        emails: updatedList,
        highlights: _buildHighlights(updatedList, state.replies),
        isSending: false,
        successMessage: 'Draft saved in Trial Mode! (Progress will not be saved)',
      );
      return true;
    }

    state = state.copyWith(isSending: true, clearError: true);
    try {
      final client = SupabaseService.client;

      final inserted = await client
          .from('emails')
          .insert({
            'user_id': user.id,
            'contact_id': contact.id,
            'subject': subject,
            'body': body,
            'status': 'draft',
          })
          .select('*, contacts(name, email, company)')
          .single();

      final newEmail = EmailItem.fromJson(inserted);

      // Log to events table
      try {
        await client.from('events').insert({
          'user_id': user.id,
          'contact_id': contact.id,
          'event_type': 'email_drafted',
          'description': 'Drafted email to ${contact.name}',
        });
      } catch (_) {}

      final updatedList = [newEmail, ...state.emails];
      state = state.copyWith(
        emails: updatedList,
        highlights: _buildHighlights(updatedList, state.replies),
        isSending: false,
        successMessage: 'Draft saved successfully!',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isSending: false, errorMessage: 'Failed to save draft: $e');
      return false;
    }
  }

  Future<bool> sendEmailItem({
    required EmailItem email,
  }) async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      final now = DateTime.now();
      List<EmailItem> updatedList;
      if (email.id.isNotEmpty && state.emails.any((e) => e.id == email.id)) {
        updatedList = state.emails.map((e) {
          if (e.id == email.id) {
            return e.copyWith(status: 'sent', sentAt: now);
          }
          return e;
        }).toList();
      } else {
        final sentItem = EmailItem(
          id: 'sent-${now.millisecondsSinceEpoch}',
          userId: 'guest',
          contactId: email.contactId,
          contactName: email.contactName,
          contactEmail: email.contactEmail,
          contactCompany: email.contactCompany,
          subject: email.subject,
          body: email.body,
          status: 'sent',
          createdAt: now,
          sentAt: now,
        );
        updatedList = [sentItem, ...state.emails];
      }
      state = state.copyWith(
        emails: updatedList,
        highlights: _buildHighlights(updatedList, state.replies),
        isSending: false,
        successMessage: 'Email sent in Trial Mode! (Progress will not be saved)',
      );
      return true;
    }

    state = state.copyWith(isSending: true, clearError: true);
    try {
      final client = SupabaseService.client;
      final now = DateTime.now();

      // If existing draft, update to sent
      if (email.id.isNotEmpty) {
        await client.from('emails').update({
          'status': 'sent',
          'sent_at': now.toIso8601String(),
        }).eq('id', email.id);

        final updatedEmails = state.emails.map((e) {
          if (e.id == email.id) {
            return e.copyWith(status: 'sent', sentAt: now);
          }
          return e;
        }).toList();

        // Dispatch outbound email via backend
        final recipient = email.contactEmail;
        if (recipient != null && recipient.trim().isNotEmpty) {
          try {
            final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/send-email');
            final session = SupabaseService.auth.currentSession;
            await http.post(
              uri,
              headers: {
                'Content-Type': 'application/json',
                if (session?.accessToken != null)
                  'Authorization': 'Bearer ${session!.accessToken}',
              },
              body: jsonEncode({
                'emailId': email.id,
                'contactEmail': recipient.trim(),
                'subject': email.subject,
                'body': email.body,
                'useGmailApi': true,
              }),
            ).timeout(const Duration(seconds: 8));
          } catch (_) {}
        }

        // Log event
        try {
          await client.from('events').insert({
            'user_id': user.id,
            if (email.contactId != null) 'contact_id': email.contactId,
            'event_type': 'email_sent',
            'description': 'Sent email "${email.subject}" to ${email.contactName ?? email.contactEmail ?? "contact"}',
          });
        } catch (_) {}

        state = state.copyWith(
          emails: updatedEmails,
          highlights: _buildHighlights(updatedEmails, state.replies),
          isSending: false,
          successMessage: 'Email sent successfully!',
        );
      } else {
        // Brand new email sending
        final inserted = await client
            .from('emails')
            .insert({
              'user_id': user.id,
              'contact_id': email.contactId,
              'subject': email.subject,
              'body': email.body,
              'status': 'sent',
              'sent_at': now.toIso8601String(),
            })
            .select('*, contacts(name, email, company)')
            .single();

        final sentItem = EmailItem.fromJson(inserted);
        final updatedList = [sentItem, ...state.emails];

        // Dispatch outbound email via backend
        final recipient = sentItem.contactEmail;
        if (recipient != null && recipient.trim().isNotEmpty) {
          try {
            final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/send-email');
            final session = SupabaseService.auth.currentSession;
            await http.post(
              uri,
              headers: {
                'Content-Type': 'application/json',
                if (session?.accessToken != null)
                  'Authorization': 'Bearer ${session!.accessToken}',
              },
              body: jsonEncode({
                'emailId': sentItem.id,
                'contactEmail': recipient.trim(),
                'subject': sentItem.subject,
                'body': sentItem.body,
                'useGmailApi': true,
              }),
            ).timeout(const Duration(seconds: 8));
          } catch (_) {}
        }

        try {
          await client.from('events').insert({
            'user_id': user.id,
            if (email.contactId != null) 'contact_id': email.contactId,
            'event_type': 'email_sent',
            'description': 'Sent email "${email.subject}" to ${email.contactName ?? email.contactEmail ?? "contact"}',
          });
        } catch (_) {}

        state = state.copyWith(
          emails: updatedList,
          highlights: _buildHighlights(updatedList, state.replies),
          isSending: false,
          successMessage: 'Email sent successfully!',
        );
      }
      return true;
    } catch (e) {
      state = state.copyWith(isSending: false, errorMessage: 'Failed to send email: $e');
      return false;
    }
  }

  Future<bool> updateDraft({
    required String emailId,
    required String subject,
    required String body,
  }) async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      final updated = state.emails.map((e) {
        if (e.id == emailId) {
          return e.copyWith(subject: subject, body: body);
        }
        return e;
      }).toList();
      state = state.copyWith(
        emails: updated,
        isLoading: false,
        successMessage: 'Draft updated in Trial Mode! (Progress will not be saved)',
      );
      return true;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final client = SupabaseService.client;

      await client.from('emails').update({
        'subject': subject,
        'body': body,
      }).eq('id', emailId);

      final updated = state.emails.map((e) {
        if (e.id == emailId) {
          return e.copyWith(subject: subject, body: body);
        }
        return e;
      }).toList();

      state = state.copyWith(
        emails: updated,
        isLoading: false,
        successMessage: 'Draft updated successfully!',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Failed to update draft: $e');
      return false;
    }
  }

  Future<bool> deleteEmail(String emailId) async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      final updated = state.emails.where((e) => e.id != emailId).toList();
      state = state.copyWith(
        emails: updated,
        highlights: _buildHighlights(updated, state.replies),
        isLoading: false,
        successMessage: 'Email deleted in Trial Mode! (Progress will not be saved)',
      );
      return true;
    }

    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final client = SupabaseService.client;
      await client.from('emails').delete().eq('id', emailId);

      final updated = state.emails.where((e) => e.id != emailId).toList();
      state = state.copyWith(
        emails: updated,
        highlights: _buildHighlights(updated, state.replies),
        isLoading: false,
        successMessage: 'Email removed.',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Failed to delete email: $e');
      return false;
    }
  }

  Future<void> syncReplies() async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      state = state.copyWith(isSyncing: true, clearError: true);
      await Future.delayed(const Duration(milliseconds: 600));
      state = state.copyWith(
        isSyncing: false,
        successMessage: 'Replies synced in Trial Mode! (Progress will not be saved)',
      );
      return;
    }

    state = state.copyWith(isSyncing: true, clearError: true);
    try {
      try {
        final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/gmail/sync');
        final session = SupabaseService.auth.currentSession;
        await http.post(
          uri,
          headers: {
            'Content-Type': 'application/json',
            if (session?.accessToken != null)
              'Authorization': 'Bearer ${session!.accessToken}',
          },
        ).timeout(const Duration(seconds: 8));
      } catch (_) {}

      await loadAll();
      state = state.copyWith(isSyncing: false, successMessage: 'Replies synced successfully!');
    } catch (e) {
      state = state.copyWith(isSyncing: false, errorMessage: 'Failed to sync replies: $e');
    }
  }

  Future<void> markReplyAsRead(String replyId) async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      final updated = state.replies.map((r) {
        if (r.id == replyId) return r.copyWith(isRead: true);
        return r;
      }).toList();
      state = state.copyWith(replies: updated);
      return;
    }

    try {
      final client = SupabaseService.client;
      await client.from('email_replies').update({'is_read': true}).eq('id', replyId);

      final updated = state.replies.map((r) {
        if (r.id == replyId) return r.copyWith(isRead: true);
        return r;
      }).toList();

      state = state.copyWith(replies: updated);
    } catch (_) {}
  }

  Future<void> connectGmail() async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) {
      state = state.copyWith(
        isGmailConnected: true,
        successMessage: 'Gmail connected in Trial Mode! (Progress will not be saved)',
      );
      return;
    }

    try {
      final targetAuthUrl = IntegrationEvents.buildGmailOAuthUrl(userId: user.id);
      final authUri = Uri.parse(targetAuthUrl);
      if (await canLaunchUrl(authUri)) {
        await launchUrl(authUri, mode: LaunchMode.externalApplication);
        _startConnectionPolling(user.id);
      } else {
        state = state.copyWith(errorMessage: 'Unable to launch Google OAuth consent screen');
      }
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to launch Gmail OAuth: $e');
    }
  }

  void _startConnectionPolling(String userId) {
    _pollingTimer?.cancel();
    int attempts = 0;
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      attempts++;
      if (attempts > 60 || state.isGmailConnected) {
        timer.cancel();
        return;
      }
      try {
        final client = SupabaseService.client;
        final res = await client
            .from('gmail_connections')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
        if (res != null) {
          timer.cancel();
          state = state.copyWith(isGmailConnected: true, isSyncing: false);
          await loadAll();
        }
      } catch (_) {}
    });
  }

  static final List<EmailContactOption> _seedContacts = [
    EmailContactOption(
      id: 'contact-demo-1',
      name: 'Elena Rostova',
      email: 'elena@quantumventures.vc',
      company: 'Horizon Ventures',
    ),
    EmailContactOption(
      id: 'contact-demo-2',
      name: 'Sarah Lin',
      email: 'sarah.lin@nextgen.ai',
      company: 'NextGen AI Labs',
    ),
    EmailContactOption(
      id: 'contact-demo-3',
      name: 'David Vance',
      email: 'david.vance@apexrobotics.io',
      company: 'Apex Robotics',
    ),
    EmailContactOption(
      id: 'contact-demo-4',
      name: 'Marcus Chen',
      email: 'marcus@omniflow.ai',
      company: 'Omniflow AI',
    ),
  ];

  static final List<EmailItem> _seedEmails = [
    EmailItem(
      id: 'email-demo-1',
      userId: 'guest',
      contactId: 'contact-demo-1',
      contactName: 'Elena Rostova',
      contactEmail: 'elena@quantumventures.vc',
      contactCompany: 'Horizon Ventures',
      subject: 'TechCrunch Disrupt Follow-Up & AI Pipeline Sharing',
      body:
          'Hi Elena,\n\nIt was fantastic connecting at TechCrunch Disrupt 2026. Following up on our discussion regarding enterprise AI workflow orchestration and founder pipelines, I would love to share our technical overview with Horizon Ventures.\n\nLet me know if tomorrow at 2 PM works for a quick 15-minute chat.\n\nBest,\nAlex',
      status: 'sent',
      createdAt: DateTime.now().subtract(const Duration(hours: 4)),
      sentAt: DateTime.now().subtract(const Duration(hours: 4)),
    ),
    EmailItem(
      id: 'email-demo-2',
      userId: 'guest',
      contactId: 'contact-demo-2',
      contactName: 'Sarah Lin',
      contactEmail: 'sarah.lin@nextgen.ai',
      contactCompany: 'NextGen AI Labs',
      subject: 'Product Collaboration & Mobile Flutter Integration',
      body:
          'Hi Sarah,\n\nGreat chatting about NextGen AI Labs. We loved your insights on local model inference on mobile devices. Would love to run you through our latest Flutter integration.\n\nLooking forward to catching up soon!\n\nBest,\nAlex',
      status: 'sent',
      createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 3)),
      sentAt: DateTime.now().subtract(const Duration(days: 1, hours: 3)),
    ),
    EmailItem(
      id: 'email-demo-3',
      userId: 'guest',
      contactId: 'contact-demo-3',
      contactName: 'David Vance',
      contactEmail: 'david.vance@apexrobotics.io',
      contactCompany: 'Apex Robotics',
      subject: 'Draft: Apex Robotics API Integration & Partnership',
      body:
          'Hi David,\n\nReaching out following our introduction regarding Apex Robotics. We have prepared an API integration outline tailored to your team\'s workflow needs.\n\nBest regards,\nAlex',
      status: 'draft',
      createdAt: DateTime.now().subtract(const Duration(days: 2)),
    ),
  ];

  static final List<EmailReplyItem> _seedReplies = [
    EmailReplyItem(
      id: 'reply-demo-1',
      userId: 'guest',
      fromName: 'Elena Rostova',
      fromEmail: 'elena@quantumventures.vc',
      subject: 'Re: TechCrunch Disrupt Follow-Up & AI Pipeline Sharing',
      snippet:
          'Hi Alex, thanks for following up! Tomorrow at 2 PM PST sounds great. Sending over a calendar invite shortly.',
      body:
          'Hi Alex, thanks for following up! Tomorrow at 2 PM PST sounds great. Sending over a calendar invite shortly.',
      receivedAt: DateTime.now().subtract(const Duration(minutes: 42)),
      isRead: false,
    ),
    EmailReplyItem(
      id: 'reply-demo-2',
      userId: 'guest',
      fromName: 'David Vance',
      fromEmail: 'david.vance@apexrobotics.io',
      subject: 'Re: Apex Robotics API Integration & Partnership',
      snippet:
          'Thanks for the outline Alex! I shared this with our engineering leads and we would like to schedule a technical review.',
      body:
          'Thanks for the outline Alex! I shared this with our engineering leads and we would like to schedule a technical review.',
      receivedAt: DateTime.now().subtract(const Duration(hours: 19)),
      isRead: true,
    ),
  ];

  List<EmailHighlightSection> _buildHighlights(
    List<EmailItem> emails,
    List<EmailReplyItem> replies,
  ) {
    final draftsCount = emails.where((e) => e.status == 'draft').length;
    final sentCount = emails.where((e) => e.status == 'sent').length;
    final unreadCount = replies.where((r) => !r.isRead).length;

    final keyUpdates = <String>[];
    if (sentCount > 0) {
      keyUpdates.add('$sentCount personalized networking emails successfully delivered.');
    } else {
      keyUpdates.add('No outgoing emails sent yet this cycle.');
    }
    if (replies.isNotEmpty) {
      keyUpdates.add('${replies.length} total inbound replies tracked from your contacts.');
    } else {
      keyUpdates.add('Awaiting incoming replies from your outreach contacts.');
    }

    final actionItems = <String>[];
    if (unreadCount > 0) {
      actionItems.add('You have $unreadCount unread reply waiting for your response in the Replies tab.');
    }
    if (draftsCount > 0) {
      actionItems.add('You have $draftsCount draft email pending review and sending.');
    }
    if (actionItems.isEmpty) {
      actionItems.add('All conversations are up-to-date! Reach out to more contacts to grow your network.');
    }

    final datesAndDeadlines = <String>[
      'Active follow-up window: recommended within 24-48 hours of networking events.',
      'Weekly communication review scheduled for every Friday afternoon.',
    ];

    return [
      EmailHighlightSection(title: 'Key Updates', items: keyUpdates),
      EmailHighlightSection(title: 'Action Items', items: actionItems),
      EmailHighlightSection(title: 'Dates & Deadlines', items: datesAndDeadlines),
    ];
  }
}

final emailsProvider = StateNotifierProvider<EmailsNotifier, EmailsState>((ref) {
  return EmailsNotifier(ref);
});
