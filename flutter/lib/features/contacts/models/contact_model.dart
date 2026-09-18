class ContactModel {
  final String id;
  final String userId;
  final String name;
  final String? email;
  final String? phone;
  final String? company;
  final String? position;
  final String? notes;
  final String? whereMet;
  final String? metAt;
  final List<String> tags;
  final String? avatarUrl;
  final String? linkedinUrl;
  final DateTime createdAt;
  final DateTime? updatedAt;

  const ContactModel({
    required this.id,
    required this.userId,
    required this.name,
    this.email,
    this.phone,
    this.company,
    this.position,
    this.notes,
    this.whereMet,
    this.metAt,
    this.tags = const [],
    this.avatarUrl,
    this.linkedinUrl,
    required this.createdAt,
    this.updatedAt,
  });

  factory ContactModel.fromMap(Map<String, dynamic> map) {
    return ContactModel(
      id: map['id']?.toString() ?? '',
      userId: map['user_id']?.toString() ?? '',
      name: map['name']?.toString() ?? '',
      email: map['email']?.toString(),
      phone: map['phone']?.toString(),
      company: map['company']?.toString(),
      position: map['position']?.toString(),
      notes: map['notes']?.toString(),
      whereMet: map['where_met']?.toString(),
      metAt: map['met_at']?.toString(),
      tags: (map['tags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      avatarUrl: map['avatar_url']?.toString(),
      linkedinUrl: map['linkedin_url']?.toString(),
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: map['updated_at'] != null
          ? DateTime.tryParse(map['updated_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'user_id': userId,
      'name': name,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (company != null) 'company': company,
      if (position != null) 'position': position,
      if (notes != null) 'notes': notes,
      if (whereMet != null) 'where_met': whereMet,
      if (metAt != null) 'met_at': metAt,
      'tags': tags,
      if (avatarUrl != null) 'avatar_url': avatarUrl,
      if (linkedinUrl != null) 'linkedin_url': linkedinUrl,
    };
  }

  ContactModel copyWith({
    String? id,
    String? userId,
    String? name,
    String? email,
    String? phone,
    String? company,
    String? position,
    String? notes,
    String? whereMet,
    String? metAt,
    List<String>? tags,
    String? avatarUrl,
    String? linkedinUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return ContactModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      company: company ?? this.company,
      position: position ?? this.position,
      notes: notes ?? this.notes,
      whereMet: whereMet ?? this.whereMet,
      metAt: metAt ?? this.metAt,
      tags: tags ?? this.tags,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      linkedinUrl: linkedinUrl ?? this.linkedinUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
