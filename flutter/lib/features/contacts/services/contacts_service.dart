import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../core/services/supabase_service.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../models/contact_model.dart';

class ContactsService {
  ContactsService._();

  static Future<List<ContactModel>> fetchContacts(String userId) async {
    try {
      final response = await SupabaseService.client
          .from('contacts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      final List<dynamic> data = response as List<dynamic>;
      return data.map((json) => ContactModel.fromMap(json as Map<String, dynamic>)).toList();
    } catch (e) {
      return [];
    }
  }

  static Future<ContactModel?> createContact(ContactModel contact) async {
    try {
      final response = await SupabaseService.client
          .from('contacts')
          .insert(contact.toMap())
          .select()
          .single();

      return ContactModel.fromMap(response);
    } catch (e) {
      return null;
    }
  }

  static Future<bool> updateContact(ContactModel contact) async {
    try {
      await SupabaseService.client
          .from('contacts')
          .update(contact.toMap())
          .eq('id', contact.id);
      return true;
    } catch (_) {
      return false;
    }
  }

  static Future<bool> deleteContact(String contactId) async {
    try {
      await SupabaseService.client
          .from('contacts')
          .delete()
          .eq('id', contactId);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Extracts professional contact details from a LinkedIn profile URL
  static Future<Map<String, dynamic>> extractLinkedInProfile(String linkedinUrl) async {
    try {
      final uri = Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/linkedin/extract');
      final response = await http
          .post(
            uri,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'linkedinUrl': linkedinUrl.trim()}),
          )
          .timeout(const Duration(seconds: 6));

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        if (body['success'] == true && body['profile'] != null) {
          return body['profile'] as Map<String, dynamic>;
        }
      }
    } catch (_) {}

    // Offline / client-side heuristic fallback
    final match = RegExp(r'linkedin\.com\/in\/([^\/\?]+)').firstMatch(linkedinUrl.trim());
    final username = match?.group(1) ?? '';
    final name = username
        .replaceAll('-', ' ')
        .split(' ')
        .map((w) => w.isNotEmpty ? '${w[0].toUpperCase()}${w.substring(1)}' : '')
        .join(' ')
        .trim();

    return {
      'linkedinUrl': linkedinUrl.trim(),
      'username': username,
      'name': name.isNotEmpty ? name : 'LinkedIn Contact',
    };
  }
}
