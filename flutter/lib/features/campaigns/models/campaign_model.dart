import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';

/// Contact recipient representation within a campaign
class CampaignContact {
  final String id;
  final String name;
  final String? email;
  final String? company;
  final String? position;
  final String? avatarUrl;

  const CampaignContact({
    required this.id,
    required this.name,
    this.email,
    this.company,
    this.position,
    this.avatarUrl,
  });

  factory CampaignContact.fromJson(Map<String, dynamic> json) {
    return CampaignContact(
      id: json['id'] as String? ?? json['contact_id'] as String? ?? '',
      name: json['name'] as String? ?? 'Unnamed Contact',
      email: json['email'] as String?,
      company: json['company'] as String?,
      position: json['position'] as String?,
      avatarUrl: json['avatar_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'company': company,
      'position': position,
      'avatar_url': avatarUrl,
    };
  }

  CampaignContact copyWith({
    String? id,
    String? name,
    String? email,
    String? company,
    String? position,
    String? avatarUrl,
  }) {
    return CampaignContact(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      company: company ?? this.company,
      position: position ?? this.position,
      avatarUrl: avatarUrl ?? this.avatarUrl,
    );
  }
}

/// Email Campaign model mapping to Supabase `email_campaigns` table
class EmailCampaign {
  final String id;
  final String userId;
  final String name;
  final String purpose;
  final String subject;
  final String status; // 'draft' | 'running' | 'paused' | 'completed'
  final List<CampaignContact> contacts;
  final int sentCount;
  final int totalCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const EmailCampaign({
    required this.id,
    required this.userId,
    required this.name,
    required this.purpose,
    required this.subject,
    this.status = 'draft',
    this.contacts = const [],
    this.sentCount = 0,
    this.totalCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  double get progressPercent {
    final total = totalCount > 0 ? totalCount : contacts.length;
    if (total <= 0) return 0.0;
    return (sentCount / total).clamp(0.0, 1.0);
  }

  bool get isRunning => status == 'running';
  bool get isCompleted => status == 'completed';
  bool get isDraft => status == 'draft';
  bool get isPaused => status == 'paused';

  String get statusLabel {
    switch (status.toLowerCase()) {
      case 'running':
        return 'Running';
      case 'completed':
        return 'Completed';
      case 'paused':
        return 'Paused';
      case 'draft':
      default:
        return 'Draft';
    }
  }

  Color statusBadgeColor(BuildContext context) {
    switch (status.toLowerCase()) {
      case 'running':
        return context.colors.glowBlue;
      case 'completed':
        return context.colors.successGlow;
      case 'paused':
        return context.colors.warningAmber;
      case 'draft':
      default:
        return const Color(0xFFF59E0B);
    }
  }

  factory EmailCampaign.fromJson(Map<String, dynamic> json) {
    List<CampaignContact> parsedContacts = [];
    if (json['campaign_contacts'] is List) {
      final list = json['campaign_contacts'] as List;
      for (final item in list) {
        if (item is Map<String, dynamic>) {
          if (item['contacts'] is Map<String, dynamic>) {
            parsedContacts.add(CampaignContact.fromJson(item['contacts'] as Map<String, dynamic>));
          } else if (item['contact'] is Map<String, dynamic>) {
            parsedContacts.add(CampaignContact.fromJson(item['contact'] as Map<String, dynamic>));
          } else {
            parsedContacts.add(CampaignContact.fromJson(item));
          }
        }
      }
    } else if (json['contacts'] is List) {
      final list = json['contacts'] as List;
      parsedContacts = list
          .whereType<Map<String, dynamic>>()
          .map((c) => CampaignContact.fromJson(c))
          .toList();
    }

    final sent = (json['sent_count'] as num?)?.toInt() ?? 0;
    final total = (json['total_count'] as num?)?.toInt() ??
        ((json['campaign_contacts'] as List?)?.length ?? parsedContacts.length);

    return EmailCampaign(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      name: json['name'] as String? ?? 'Untitled Campaign',
      purpose: json['purpose'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      status: json['status'] as String? ?? 'draft',
      contacts: parsedContacts,
      sentCount: sent,
      totalCount: total,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'purpose': purpose,
      'subject': subject,
      'status': status,
      'sent_count': sentCount,
      'total_count': totalCount,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  EmailCampaign copyWith({
    String? id,
    String? userId,
    String? name,
    String? purpose,
    String? subject,
    String? status,
    List<CampaignContact>? contacts,
    int? sentCount,
    int? totalCount,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return EmailCampaign(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      purpose: purpose ?? this.purpose,
      subject: subject ?? this.subject,
      status: status ?? this.status,
      contacts: contacts ?? this.contacts,
      sentCount: sentCount ?? this.sentCount,
      totalCount: totalCount ?? this.totalCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
