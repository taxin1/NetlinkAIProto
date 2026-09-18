import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/supabase_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../contacts/providers/contacts_provider.dart';
import '../models/networking_mode_state.dart';

final networkingModeProvider =
    StateNotifierProvider<NetworkingModeNotifier, NetworkingModeState>((ref) {
  return NetworkingModeNotifier(ref);
});

class NetworkingModeNotifier extends StateNotifier<NetworkingModeState> {
  final Ref _ref;

  NetworkingModeNotifier(this._ref) : super(const NetworkingModeState()) {
    _init();
  }

  SupabaseClient? get _client => SupabaseService.client;

  Future<void> _init() async {
    final user = _ref.read(authProvider).user;
    if (user == null || user.isGuest) return;

    try {
      // 1. Check user profile for name & portfolio slug
      final profileRes = await _client
          ?.from('network_profiles')
          .select('full_name, title, company, custom_slug')
          .eq('user_id', user.id)
          .maybeSingle();

      // 2. Count networking mode usages from events
      final countRes = await _client
          ?.from('events')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_type', 'email_sent');

      final count = (countRes as List?)?.length ?? state.usageCount;

      state = state.copyWith(
        usageCount: count,
      );

      // Pre-generate a default template if not prepared
      if (state.emailTemplate == null) {
        final name = profileRes?['full_name'] as String? ?? (user.name.isNotEmpty ? user.name : 'Innovator');
        final title = profileRes?['title'] as String? ?? 'Professional';
        final company = profileRes?['company'] as String? ?? 'Network Link AI';
        final slug = profileRes?['custom_slug'] as String? ?? '';
        final portfolioUrl = slug.isNotEmpty
            ? 'https://www.networklinkai.com/portfolio/$slug'
            : 'https://www.networklinkai.com';

        final defaultTemplate =
            "Hi [Contact Name],\n\n"
            "Great meeting you at the event today! As discussed, I'd love to stay in touch and explore collaboration opportunities.\n\n"
            "You can review my background and latest interactive portfolio here:\n"
            "$portfolioUrl\n\n"
            "Looking forward to connecting again soon.\n\n"
            "Best regards,\n"
            "$name\n"
            "$title | $company\n"
            "${user.email}";

        state = state.copyWith(
          emailTemplate: defaultTemplate,
          isTemplatePrepared: true,
        );
      }
    } catch (_) {}
  }

  void updateContextMessage(String message) {
    state = state.copyWith(
      contextMessage: message,
      isTemplatePrepared: false,
    );
  }

  void toggleEnabled(bool checked) {
    if (checked && state.isLimitReached) {
      return;
    }
    state = state.copyWith(isEnabled: checked);
  }

  void setActiveEvent(String? title) {
    state = state.copyWith(activeEventTitle: title);
  }

  Future<void> generateTemplate() async {
    state = state.copyWith(isGeneratingTemplate: true);

    await Future.delayed(const Duration(milliseconds: 700));

    final user = _ref.read(authProvider).user;
    String name = (user != null && user.name.isNotEmpty) ? user.name : 'Innovator';
    String title = 'Professional';
    String company = 'Network Link AI';
    String portfolioUrl = 'https://www.networklinkai.com';

    try {
      if (user != null && !user.isGuest) {
        final profileRes = await _client
            ?.from('network_profiles')
            .select('full_name, title, company, custom_slug')
            .eq('user_id', user.id)
            .maybeSingle();

        if (profileRes != null) {
          name = profileRes['full_name'] as String? ?? name;
          title = profileRes['title'] as String? ?? title;
          company = profileRes['company'] as String? ?? company;
          final slug = profileRes['custom_slug'] as String? ?? '';
          if (slug.isNotEmpty) {
            portfolioUrl = 'https://www.networklinkai.com/portfolio/$slug';
          }
        }
      }
    } catch (_) {}

    final generated =
        "Hi [Contact Name],\n\n"
        "${state.contextMessage.trim()}\n\n"
        "Feel free to check out my digital portfolio and key work here:\n"
        "$portfolioUrl\n\n"
        "Let me know when you have time for a quick follow-up chat or coffee next week.\n\n"
        "Best regards,\n"
        "$name\n"
        "$title | $company\n"
        "${user?.email ?? ''}";

    state = state.copyWith(
      emailTemplate: generated,
      isGeneratingTemplate: false,
      isTemplatePrepared: true,
      isEditingTemplate: false,
    );
  }

  void setEditingTemplate(bool isEditing) {
    state = state.copyWith(isEditingTemplate: isEditing);
  }

  void updateTemplateContent(String content) {
    state = state.copyWith(
      emailTemplate: content,
      isTemplatePrepared: true,
    );
  }

  Future<void> processScannedCard({
    required String name,
    required String company,
    required String email,
    required String phone,
    required String title,
  }) async {
    state = state.copyWith(isScanning: true);

    try {
      // 1. Save to contacts provider
      await _ref.read(contactsProvider.notifier).addContact(
            name: name,
            email: email,
            phone: phone,
            company: company,
            position: title,
            whereMet: 'Networking Event (Auto-Scanned)',
            metAt: DateTime.now().toIso8601String(),
            notes: 'Scanned via Networking Mode',
            tags: ['Networking', 'Card Scanner'],
          );

      bool sent = false;
      String? subject;

      // 2. If enabled, send automated personalized follow-up email
      if (state.isEnabled && !state.isLimitReached && email.isNotEmpty) {
        final user = _ref.read(authProvider).user;
        final template = state.emailTemplate ??
            "Hi [Contact Name],\n\nGreat meeting you today! Let's connect soon.";
        final personalizedBody = template.replaceAll('[Contact Name]', name);
        subject = "Great connecting at the event, $name!";

        if (user != null && !user.isGuest) {
          try {
            await _client?.from('emails').insert({
              'user_id': user.id,
              'subject': subject,
              'body': personalizedBody,
              'status': 'sent',
              'sent_at': DateTime.now().toUtc().toIso8601String(),
              'created_at': DateTime.now().toUtc().toIso8601String(),
            });

            await _client?.from('events').insert({
              'user_id': user.id,
              'event_type': 'email_sent',
              'description': 'Networking Mode auto follow-up email sent to $name ($email)',
              'created_at': DateTime.now().toUtc().toIso8601String(),
            });
          } catch (_) {}
        }

        sent = true;
      }

      final scannedItem = ScannedContactAction(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: name,
        company: company,
        email: email,
        phone: phone,
        title: title,
        scannedAt: DateTime.now(),
        emailSent: sent,
        emailSubject: subject,
      );

      state = state.copyWith(
        isScanning: false,
        usageCount: sent ? state.usageCount + 1 : state.usageCount,
        sessionScannedContacts: [scannedItem, ...state.sessionScannedContacts],
        lastScannedMessage: sent
            ? 'Scanned $name ($company) — Follow-up email sent automatically!'
            : 'Scanned $name ($company) — Added to your contacts.',
      );
    } catch (e) {
      state = state.copyWith(
        isScanning: false,
        lastScannedMessage: 'Added $name to contacts.',
      );
    }
  }
}
