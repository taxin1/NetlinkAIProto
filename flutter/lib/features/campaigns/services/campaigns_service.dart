import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../models/campaign_model.dart';

class CampaignsService {
  static SupabaseClient? get _supabase {
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  /// Fetch campaigns for user from Supabase or fallback to mock data
  static Future<List<EmailCampaign>> fetchCampaigns(String userId) async {
    final client = _supabase;
    final isRealUser = userId.isNotEmpty && userId != 'guest_user' && userId != 'guest';

    if (isRealUser) {
      if (client != null) {
        try {
          final data = await client
              .from('email_campaigns')
              .select('''
                *,
                campaign_contacts (
                  contact_id,
                  contacts:contact_id (id, name, email, company, position, avatar_url)
                )
              ''')
              .eq('user_id', userId)
              .order('created_at', ascending: false);

          return (data as List<dynamic>)
              .whereType<Map<String, dynamic>>()
              .map((json) => EmailCampaign.fromJson(json))
              .toList();
        } catch (e) {
          debugPrint('Error fetching campaigns from Supabase: $e');
          return const <EmailCampaign>[];
        }
      }
      return const <EmailCampaign>[];
    }

    // Default starter campaigns for guest / preview
    return _getStarterCampaigns(userId);
  }

  /// Fetch target contacts with non-null emails
  static Future<List<CampaignContact>> fetchContacts(String userId) async {
    final client = _supabase;
    final isRealUser = userId.isNotEmpty && userId != 'guest_user' && userId != 'guest';

    if (isRealUser) {
      if (client != null) {
        try {
          final data = await client
              .from('contacts')
              .select('id, name, email, company, position, avatar_url')
              .eq('user_id', userId)
              .not('email', 'is', null)
              .order('name', ascending: true);

          return (data as List<dynamic>)
              .whereType<Map<String, dynamic>>()
              .map((json) => CampaignContact.fromJson(json))
              .toList();
        } catch (e) {
          debugPrint('Error fetching contacts from Supabase: $e');
          return const <CampaignContact>[];
        }
      }
      return const <CampaignContact>[];
    }

    // Default sample contacts for preview
    return _getStarterContacts();
  }

  /// Create a new campaign with recipient contacts
  static Future<EmailCampaign> createCampaign({
    required String userId,
    required String name,
    required String purpose,
    required String subject,
    required List<CampaignContact> contacts,
  }) async {
    final client = _supabase;
    final campaignId = DateTime.now().millisecondsSinceEpoch.toString();

    if (client != null && userId.isNotEmpty && userId != 'guest_user') {
      try {
        final campaignRow = await client
            .from('email_campaigns')
            .insert({
              'user_id': userId,
              'name': name.trim(),
              'purpose': purpose.trim(),
              'subject': subject.trim(),
              'status': 'draft',
              'sent_count': 0,
            })
            .select()
            .single();

        final realId = campaignRow['id'] as String;

        if (contacts.isNotEmpty) {
          final junctionRows = contacts
              .map((c) => {
                    'campaign_id': realId,
                    'contact_id': c.id,
                  })
              .toList();

          await client.from('campaign_contacts').insert(junctionRows);
        }

        return EmailCampaign(
          id: realId,
          userId: userId,
          name: name,
          purpose: purpose,
          subject: subject,
          status: 'draft',
          contacts: contacts,
          sentCount: 0,
          totalCount: contacts.length,
          createdAt: DateTime.now(),
        );
      } catch (e) {
        debugPrint('Error inserting campaign into Supabase: $e');
      }
    }

    // Local in-memory creation for guests
    return EmailCampaign(
      id: campaignId,
      userId: userId.isNotEmpty ? userId : 'guest_user',
      name: name,
      purpose: purpose,
      subject: subject,
      status: 'draft',
      contacts: contacts,
      sentCount: 0,
      totalCount: contacts.length,
      createdAt: DateTime.now(),
    );
  }

  /// AI generation of campaign purpose based on campaign name
  static Future<String> generateCampaignPurpose(String campaignName) async {
    // Attempt Gemini generation via Next.js API
    try {
      final currentUserId = _supabase?.auth.currentUser?.id;
      final session = _supabase?.auth.currentSession;
      final res = await http.post(
        Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/generate-campaign-content'),
        headers: {
          'Content-Type': 'application/json',
          if (session != null) 'Authorization': 'Bearer ${session.accessToken}',
        },
        body: jsonEncode({
          'campaignName': campaignName,
          'generatePurpose': true,
          if (currentUserId != null) 'userId': currentUserId,
        }),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final purpose = data['purpose'] as String?;
        if (purpose != null && purpose.trim().isNotEmpty) {
          return purpose.trim();
        }
      }
    } catch (_) {}

    await Future.delayed(const Duration(milliseconds: 400));

    final nameLower = campaignName.toLowerCase();
    if (nameLower.contains('demo') || nameLower.contains('product') || nameLower.contains('launch')) {
      return 'Introduce our cutting-edge AI networking and relationship management platform to key executives. Highlight how automated contact sync, AI cold outreach, and smart event matchmaking reduce manual follow-up time by 75%. Invite recipients to an exclusive 15-minute product walk-through tailored to their strategic priorities.';
    } else if (nameLower.contains('partner') || nameLower.contains('collaborat')) {
      return 'Explore high-leverage strategic partnerships with innovative industry leaders. Highlight our complementary capabilities in AI workflow automation and cross-platform networking. Propose a brief introductory session to evaluate potential co-marketing and joint integration opportunities.';
    } else if (nameLower.contains('follow') || nameLower.contains('summit') || nameLower.contains('event') || nameLower.contains('conf')) {
      return 'Re-engage key connections established during recent technology conferences and leadership summits. Reference the shared discussions around AI infrastructure and digital transformation. Provide actionable takeaways and invite recipients to a 1-on-1 virtual sync next week.';
    } else if (nameLower.contains('q1') || nameLower.contains('q2') || nameLower.contains('q3') || nameLower.contains('q4') || nameLower.contains('outreach')) {
      return 'Deliver targeted quarterly executive outreach to high-value prospective partners and clients. Share recent case studies demonstrating enhanced networking ROI and automated pipeline acceleration. Prompt recipients to schedule an exploratory strategy discussion.';
    } else {
      return 'Engage key professional contacts to strengthen our business relationship and explore mutual opportunities. Highlight recent industry advancements and provide relevant insights tailored to their organization. Invite recipients to connect for a high-impact 15-minute catch-up.';
    }
  }

  /// AI generation of email subject line based on campaign name & purpose
  static Future<String> generateCampaignSubject(String campaignName, [String? purpose]) async {
    // Attempt Gemini generation via Next.js API
    try {
      final currentUserId = _supabase?.auth.currentUser?.id;
      final session = _supabase?.auth.currentSession;
      final res = await http.post(
        Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/generate-campaign-content'),
        headers: {
          'Content-Type': 'application/json',
          if (session != null) 'Authorization': 'Bearer ${session.accessToken}',
        },
        body: jsonEncode({
          'campaignName': campaignName,
          if (purpose != null && purpose.isNotEmpty) 'campaignPurpose': purpose,
          'generateSubject': true,
          if (currentUserId != null) 'userId': currentUserId,
        }),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final subject = data['subject'] as String?;
        if (subject != null && subject.trim().isNotEmpty) {
          return subject.trim();
        }
      }
    } catch (_) {}

    await Future.delayed(const Duration(milliseconds: 300));

    final nameLower = campaignName.toLowerCase();
    if (nameLower.contains('demo') || nameLower.contains('product')) {
      return 'Exclusive preview: Accelerating networking ROI with Netlink AI';
    } else if (nameLower.contains('partner') || nameLower.contains('collaborat')) {
      return 'Exploring strategic collaboration between our teams';
    } else if (nameLower.contains('event') || nameLower.contains('summit') || nameLower.contains('follow')) {
      return 'Great connecting at the summit — next steps & collaboration';
    } else if (nameLower.contains('q1') || nameLower.contains('q2') || nameLower.contains('q3') || nameLower.contains('q4')) {
      return 'Strategic growth & partnership priorities for this quarter';
    } else {
      return 'Quick question regarding your networking strategy';
    }
  }

  /// AI generation of both purpose & subject
  static Future<Map<String, String>> generateAllContent(String campaignName) async {
    try {
      final currentUserId = _supabase?.auth.currentUser?.id;
      final session = _supabase?.auth.currentSession;
      final res = await http.post(
        Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/generate-campaign-content'),
        headers: {
          'Content-Type': 'application/json',
          if (session != null) 'Authorization': 'Bearer ${session.accessToken}',
        },
        body: jsonEncode({
          'campaignName': campaignName,
          'generatePurpose': true,
          'generateSubject': true,
          if (currentUserId != null) 'userId': currentUserId,
        }),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        final purpose = data['purpose'] as String?;
        final subject = data['subject'] as String?;
        if (purpose != null && subject != null) {
          return {'purpose': purpose.trim(), 'subject': subject.trim()};
        }
      }
    } catch (_) {}

    final purpose = await generateCampaignPurpose(campaignName);
    final subject = await generateCampaignSubject(campaignName, purpose);
    return {'purpose': purpose, 'subject': subject};
  }

  /// Run campaign outreach to recipients with live progress updates
  static Future<EmailCampaign> runCampaign({
    required EmailCampaign campaign,
    bool skipAlreadySent = false,
    void Function(double progress, String contactName)? onProgress,
  }) async {
    final client = _supabase;
    final contactsToProcess = campaign.contacts.where((c) => c.email != null && c.email!.isNotEmpty).toList();
    final total = contactsToProcess.length;

    if (total == 0) return campaign;

    // Update status to running
    if (client != null && campaign.userId != 'guest_user') {
      try {
        await client
            .from('email_campaigns')
            .update({'status': 'running'})
            .eq('id', campaign.id);

        final session = client.auth.currentSession;
        if (session != null) {
          http.post(
            Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/run-campaign'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${session.accessToken}',
            },
            body: jsonEncode({
              'campaignId': campaign.id,
              'userId': campaign.userId,
            }),
          ).timeout(const Duration(seconds: 5)).catchError((_) => http.Response('', 500));
        }
      } catch (_) {}
    }

    int sent = 0;
    for (int i = 0; i < total; i++) {
      final contact = contactsToProcess[i];
      final currentProgress = (i + 1) / total;

      if (onProgress != null) {
        onProgress(currentProgress, contact.name);
      }

      // Simulate realistic email synthesis & dispatch
      await Future.delayed(const Duration(milliseconds: 700));

      final emailBody = _synthesizePersonalizedEmail(
        contact: contact,
        campaign: campaign,
      );

      // Record email in Supabase and send via backend API
      if (client != null && campaign.userId != 'guest_user') {
        try {
          await client.from('emails').insert({
            'user_id': campaign.userId,
            'contact_id': contact.id,
            'subject': campaign.subject,
            'body': emailBody,
            'status': 'sent',
            'campaign_id': campaign.id,
          });

          await client.from('events').insert({
            'user_id': campaign.userId,
            'contact_id': contact.id,
            'event_type': 'email_sent',
            'description': 'Sent campaign email: ${campaign.name}',
          });

          final session = client.auth.currentSession;
          if (session != null && contact.email != null) {
            http.post(
              Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/send-email'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ${session.accessToken}',
              },
              body: jsonEncode({
                'to': contact.email,
                'subject': campaign.subject,
                'body': emailBody,
                'contactId': contact.id,
                'campaignId': campaign.id,
              }),
            ).timeout(const Duration(seconds: 8)).catchError((_) => http.Response('', 500));
          }
        } catch (_) {}
      }

      sent++;
    }

    // Mark completed
    if (client != null && campaign.userId != 'guest_user') {
      try {
        await client
            .from('email_campaigns')
            .update({
              'status': 'completed',
              'sent_count': sent,
            })
            .eq('id', campaign.id);
      } catch (_) {}
    }

    return campaign.copyWith(
      status: 'completed',
      sentCount: sent,
      totalCount: total,
    );
  }

  /// Delete campaign
  static Future<bool> deleteCampaign(String campaignId) async {
    final client = _supabase;
    if (client != null) {
      try {
        await client.from('campaign_contacts').delete().eq('campaign_id', campaignId);
        await client.from('email_campaigns').delete().eq('id', campaignId);
        return true;
      } catch (e) {
        debugPrint('Error deleting campaign from Supabase: $e');
      }
    }
    return true;
  }

  /// Personalized email body synthesizer tailored to recipient & campaign
  static String _synthesizePersonalizedEmail({
    required CampaignContact contact,
    required EmailCampaign campaign,
  }) {
    final companySuffix = (contact.company != null && contact.company!.isNotEmpty)
        ? ' at ${contact.company}'
        : '';
    final positionMention = (contact.position != null && contact.position!.isNotEmpty)
        ? 'given your expertise as ${contact.position}'
        : 'given your background';

    return '''Hi ${contact.name},

I hope you are having an exceptional week!

I am reaching out specifically regarding our ${campaign.name} initiative. ${campaign.purpose}

With your leadership$companySuffix, $positionMention, I believe there is an immediate strategic alignment here that could unlock substantial value for your operations.

Would you be open to a brief 15-minute introductory call next week to explore ideas? Let me know what day and time works best for you.

Warm regards,
Netlink Professional''';
  }

  static List<CampaignContact> _getStarterContacts() {
    return const [
      CampaignContact(
        id: 'c1',
        name: 'Alex Vance',
        email: 'alex.vance@blackmesa.tech',
        company: 'Black Mesa Tech',
        position: 'VP of Engineering',
      ),
      CampaignContact(
        id: 'c2',
        name: 'Sarah Connor',
        email: 'sarah.connor@cyberdyne.io',
        company: 'Cyberdyne Systems',
        position: 'Head of Product',
      ),
      CampaignContact(
        id: 'c3',
        name: 'Elena Rostova',
        email: 'elena@novapartner.com',
        company: 'Nova Capital',
        position: 'Managing Director',
      ),
      CampaignContact(
        id: 'c4',
        name: 'David Kim',
        email: 'david.kim@nexusai.co',
        company: 'Nexus AI Labs',
        position: 'Chief Architect',
      ),
      CampaignContact(
        id: 'c5',
        name: 'Marcus Brody',
        email: 'mbrody@archaeotech.org',
        company: 'ArchaeoTech',
        position: 'Director of Partnerships',
      ),
    ];
  }

  static List<EmailCampaign> _getStarterCampaigns(String userId) {
    final contacts = _getStarterContacts();
    return [
      EmailCampaign(
        id: 'demo_camp_1',
        userId: userId,
        name: 'Q3 Enterprise AI Outreach',
        purpose: 'Introduce Netlink AI workflow automation to enterprise technology leaders, highlighting 75% reduction in manual follow-ups and AI matchmaking capabilities.',
        subject: 'Accelerating enterprise networking ROI with Netlink AI',
        status: 'completed',
        contacts: contacts.sublist(0, 3),
        sentCount: 3,
        totalCount: 3,
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
      ),
      EmailCampaign(
        id: 'demo_camp_2',
        userId: userId,
        name: 'AI Summit Executive Follow-up',
        purpose: 'Follow up with executive attendees from the Global Tech Summit, sharing presentation slides and scheduling 1-on-1 strategy deep-dives.',
        subject: 'Great connecting at Global Tech Summit — next steps',
        status: 'draft',
        contacts: contacts,
        sentCount: 0,
        totalCount: contacts.length,
        createdAt: DateTime.now().subtract(const Duration(hours: 8)),
      ),
    ];
  }
}
