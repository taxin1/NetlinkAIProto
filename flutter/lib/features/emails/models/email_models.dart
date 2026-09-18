class EmailItem {
  final String id;
  final String userId;
  final String? contactId;
  final String? contactName;
  final String? contactEmail;
  final String? contactCompany;
  final String subject;
  final String body;
  final String status; // 'draft', 'sent', 'failed'
  final DateTime? sentAt;
  final DateTime createdAt;

  const EmailItem({
    required this.id,
    required this.userId,
    this.contactId,
    this.contactName,
    this.contactEmail,
    this.contactCompany,
    required this.subject,
    required this.body,
    this.status = 'draft',
    this.sentAt,
    required this.createdAt,
  });

  factory EmailItem.fromJson(Map<String, dynamic> json) {
    String? cName;
    String? cEmail;
    String? cCompany;

    if (json['contacts'] is Map<String, dynamic>) {
      final c = json['contacts'] as Map<String, dynamic>;
      cName = c['name'] as String?;
      cEmail = c['email'] as String?;
      cCompany = c['company'] as String?;
    } else {
      cName = json['contact_name'] as String?;
      cEmail = json['contact_email'] as String?;
      cCompany = json['contact_company'] as String?;
    }

    DateTime? parseSentAt;
    if (json['sent_at'] != null) {
      parseSentAt = DateTime.tryParse(json['sent_at'].toString());
    }

    DateTime parseCreated;
    if (json['created_at'] != null) {
      parseCreated = DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now();
    } else {
      parseCreated = DateTime.now();
    }

    return EmailItem(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      contactId: json['contact_id']?.toString(),
      contactName: cName,
      contactEmail: cEmail,
      contactCompany: cCompany,
      subject: json['subject']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      status: json['status']?.toString() ?? 'draft',
      sentAt: parseSentAt,
      createdAt: parseCreated,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'contact_id': contactId,
      'subject': subject,
      'body': body,
      'status': status,
      if (sentAt != null) 'sent_at': sentAt!.toIso8601String(),
    };
  }

  EmailItem copyWith({
    String? id,
    String? userId,
    String? contactId,
    String? contactName,
    String? contactEmail,
    String? contactCompany,
    String? subject,
    String? body,
    String? status,
    DateTime? sentAt,
    DateTime? createdAt,
  }) {
    return EmailItem(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      contactId: contactId ?? this.contactId,
      contactName: contactName ?? this.contactName,
      contactEmail: contactEmail ?? this.contactEmail,
      contactCompany: contactCompany ?? this.contactCompany,
      subject: subject ?? this.subject,
      body: body ?? this.body,
      status: status ?? this.status,
      sentAt: sentAt ?? this.sentAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class EmailReplyItem {
  final String id;
  final String userId;
  final String subject;
  final String snippet;
  final String body;
  final String fromEmail;
  final String fromName;
  final DateTime receivedAt;
  final bool isRead;
  final String? gmailMessageId;

  const EmailReplyItem({
    required this.id,
    required this.userId,
    required this.subject,
    required this.snippet,
    required this.body,
    required this.fromEmail,
    required this.fromName,
    required this.receivedAt,
    this.isRead = false,
    this.gmailMessageId,
  });

  factory EmailReplyItem.fromJson(Map<String, dynamic> json) {
    final rawFrom = json['from_email']?.toString() ?? json['from']?.toString() ?? '';
    String name = rawFrom;
    String email = rawFrom;

    final emailMatch = RegExp(r'<([^>]+)>').firstMatch(rawFrom);
    if (emailMatch != null) {
      email = emailMatch.group(1) ?? rawFrom;
      final namePart = rawFrom.substring(0, emailMatch.start).trim();
      if (namePart.isNotEmpty) {
        name = namePart.replaceAll('"', '');
      } else {
        name = email;
      }
    }

    final dateStr = json['received_at']?.toString() ?? json['date']?.toString();
    final date = dateStr != null ? DateTime.tryParse(dateStr) ?? DateTime.now() : DateTime.now();

    return EmailReplyItem(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      subject: json['subject']?.toString() ?? 'No Subject',
      snippet: json['snippet']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      fromEmail: email,
      fromName: name,
      receivedAt: date,
      isRead: json['is_read'] == true,
      gmailMessageId: json['gmail_message_id']?.toString(),
    );
  }

  EmailReplyItem copyWith({
    String? id,
    String? userId,
    String? subject,
    String? snippet,
    String? body,
    String? fromEmail,
    String? fromName,
    DateTime? receivedAt,
    bool? isRead,
    String? gmailMessageId,
  }) {
    return EmailReplyItem(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      subject: subject ?? this.subject,
      snippet: snippet ?? this.snippet,
      body: body ?? this.body,
      fromEmail: fromEmail ?? this.fromEmail,
      fromName: fromName ?? this.fromName,
      receivedAt: receivedAt ?? this.receivedAt,
      isRead: isRead ?? this.isRead,
      gmailMessageId: gmailMessageId ?? this.gmailMessageId,
    );
  }
}

class EmailHighlightSection {
  final String title;
  final List<String> items;

  const EmailHighlightSection({
    required this.title,
    required this.items,
  });
}

class EmailContactOption {
  final String id;
  final String name;
  final String email;
  final String? company;

  const EmailContactOption({
    required this.id,
    required this.name,
    required this.email,
    this.company,
  });

  factory EmailContactOption.fromJson(Map<String, dynamic> json) {
    return EmailContactOption(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unnamed Contact',
      email: json['email']?.toString() ?? '',
      company: json['company']?.toString(),
    );
  }
}
