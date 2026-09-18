/// Data model for Portfolios and Sections matching Supabase public.portfolios schema
library;

class PortfolioSection {
  final String id;
  final String type; // 'about' | 'experience' | 'projects' | 'skills' | 'education' | 'testimonials' | 'contact' | 'custom'
  final String title;
  final String content;
  final int order;
  final Map<String, dynamic> metadata;

  const PortfolioSection({
    required this.id,
    required this.type,
    required this.title,
    required this.content,
    required this.order,
    this.metadata = const {},
  });

  factory PortfolioSection.fromMap(Map<String, dynamic> map) {
    return PortfolioSection(
      id: map['id']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
      type: map['type']?.toString() ?? 'custom',
      title: map['title']?.toString() ?? '',
      content: map['content']?.toString() ?? '',
      order: (map['order'] is num) ? (map['order'] as num).toInt() : 0,
      metadata: map['metadata'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(map['metadata'] as Map)
          : const {},
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'content': content,
      'order': order,
      'metadata': metadata,
    };
  }

  PortfolioSection copyWith({
    String? id,
    String? type,
    String? title,
    String? content,
    int? order,
    Map<String, dynamic>? metadata,
  }) {
    return PortfolioSection(
      id: id ?? this.id,
      type: type ?? this.type,
      title: title ?? this.title,
      content: content ?? this.content,
      order: order ?? this.order,
      metadata: metadata ?? this.metadata,
    );
  }
}

class Portfolio {
  final String id;
  final String userId;
  final String slug;
  final String title;
  final String? subtitle;
  final String? bio;
  final String? profileImageUrl;
  final String? coverImageUrl;
  final List<PortfolioSection> sections;
  final String theme; // 'modern' | 'minimal' | 'creative' | 'professional'
  final bool isPublic;
  final bool showContactInfo;
  final bool showSocialLinks;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Portfolio({
    required this.id,
    required this.userId,
    required this.slug,
    required this.title,
    this.subtitle,
    this.bio,
    this.profileImageUrl,
    this.coverImageUrl,
    this.sections = const [],
    this.theme = 'modern',
    this.isPublic = true,
    this.showContactInfo = true,
    this.showSocialLinks = true,
    this.createdAt,
    this.updatedAt,
  });

  factory Portfolio.empty(String userId, [String? slug]) {
    final now = DateTime.now().toUtc();
    final defaultSlug = (slug != null && slug.trim().isNotEmpty)
        ? slug.trim().toLowerCase().replaceAll(RegExp(r'[^a-z0-9_-]'), '-')
        : 'user-${userId.substring(0, userId.length > 8 ? 8 : userId.length)}';
    return Portfolio(
      id: '',
      userId: userId,
      slug: defaultSlug,
      title: 'My Portfolio',
      subtitle: 'Professional & Innovator',
      bio: '',
      theme: 'modern',
      isPublic: true,
      showContactInfo: true,
      showSocialLinks: true,
      sections: const [],
      createdAt: now,
      updatedAt: now,
    );
  }

  factory Portfolio.fromMap(Map<String, dynamic> map) {
    List<PortfolioSection> parsedSections = [];
    if (map['sections'] is List) {
      parsedSections = (map['sections'] as List)
          .map((e) => e is Map<String, dynamic>
              ? PortfolioSection.fromMap(e)
              : PortfolioSection.fromMap(Map<String, dynamic>.from(e as Map)))
          .toList();
      parsedSections.sort((a, b) => a.order.compareTo(b.order));
    }

    return Portfolio(
      id: map['id']?.toString() ?? '',
      userId: map['user_id']?.toString() ?? '',
      slug: map['slug']?.toString() ?? '',
      title: map['title']?.toString() ?? '',
      subtitle: map['subtitle']?.toString(),
      bio: map['bio']?.toString(),
      profileImageUrl: map['profile_image_url']?.toString(),
      coverImageUrl: map['cover_image_url']?.toString(),
      sections: parsedSections,
      theme: map['theme']?.toString() ?? 'modern',
      isPublic: map['is_public'] ?? true,
      showContactInfo: map['show_contact_info'] ?? true,
      showSocialLinks: map['show_social_links'] ?? true,
      createdAt: map['created_at'] != null ? DateTime.tryParse(map['created_at'].toString()) : null,
      updatedAt: map['updated_at'] != null ? DateTime.tryParse(map['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toMap() {
    final map = <String, dynamic>{
      'user_id': userId,
      'slug': slug,
      'title': title,
      'subtitle': subtitle,
      'bio': bio,
      'profile_image_url': profileImageUrl,
      'cover_image_url': coverImageUrl,
      'sections': sections.map((s) => s.toMap()).toList(),
      'theme': theme,
      'is_public': isPublic,
      'show_contact_info': showContactInfo,
      'show_social_links': showSocialLinks,
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    };
    if (id.isNotEmpty) {
      map['id'] = id;
    }
    return map;
  }

  Portfolio copyWith({
    String? id,
    String? userId,
    String? slug,
    String? title,
    String? subtitle,
    String? bio,
    String? profileImageUrl,
    String? coverImageUrl,
    List<PortfolioSection>? sections,
    String? theme,
    bool? isPublic,
    bool? showContactInfo,
    bool? showSocialLinks,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Portfolio(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      slug: slug ?? this.slug,
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      bio: bio ?? this.bio,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      sections: sections ?? this.sections,
      theme: theme ?? this.theme,
      isPublic: isPublic ?? this.isPublic,
      showContactInfo: showContactInfo ?? this.showContactInfo,
      showSocialLinks: showSocialLinks ?? this.showSocialLinks,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
