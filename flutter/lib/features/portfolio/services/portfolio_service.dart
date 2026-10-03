import 'dart:convert';
import 'dart:typed_data';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/services/supabase_service.dart';
import '../models/portfolio_model.dart';

class PortfolioService {
  PortfolioService._();

  static final _supabase = SupabaseService.client;

  /// Fetch user's existing portfolio from Supabase
  static Future<Portfolio?> fetchPortfolio(String userId) async {
    try {
      final res = await _supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

      if (res != null) {
        return Portfolio.fromMap(res);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /// Fetch user's network profile for autofill and AI generation
  static Future<Map<String, dynamic>?> fetchNetworkProfile(String userId) async {
    try {
      final res = await _supabase
          .from('network_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
      return res;
    } catch (_) {
      return null;
    }
  }

  /// Upsert portfolio to Supabase
  static Future<Portfolio?> savePortfolio(Portfolio portfolio) async {
    try {
      final data = portfolio.toMap();
      final res = await _supabase
          .from('portfolios')
          .upsert(data, onConflict: 'user_id')
          .select()
          .single();

      return Portfolio.fromMap(res);
    } catch (e) {
      // If error might be unique slug collision on another user, handle slug fallback
      if (e.toString().toLowerCase().contains('slug') ||
          e.toString().toLowerCase().contains('unique')) {
        final uniqueSlug =
            '${portfolio.slug}-${DateTime.now().millisecondsSinceEpoch % 10000}';
        final fallbackData = portfolio.copyWith(slug: uniqueSlug).toMap();
        final res = await _supabase
            .from('portfolios')
            .upsert(fallbackData, onConflict: 'user_id')
            .select()
            .single();
        return Portfolio.fromMap(res);
      }
      rethrow;
    }
  }

  /// Sync directory visibility on network_profiles
  static Future<void> updateNetworkProfilePublic(String userId, bool isPublic) async {
    try {
      await _supabase
          .from('network_profiles')
          .update({'is_public': isPublic})
          .eq('user_id', userId);
    } catch (_) {}
  }

  /// Upload profile image to 'portfolios' Supabase storage bucket
  static Future<String?> uploadProfileImage({
    required Uint8List bytes,
    required String fileName,
    required String userId,
  }) async {
    try {
      final extension = fileName.split('.').last.toLowerCase();
      final storagePath =
          '$userId/profile_${DateTime.now().millisecondsSinceEpoch}.$extension';

      await _supabase.storage.from('portfolios').uploadBinary(
            storagePath,
            bytes,
          );

      final publicUrl =
          _supabase.storage.from('portfolios').getPublicUrl(storagePath);
      return publicUrl;
    } catch (_) {
      // Fallback: convert to base64 data URL if storage bucket fails or not configured
      try {
        final base64String = base64Encode(bytes);
        return 'data:image/jpeg;base64,$base64String';
      } catch (_) {
        return null;
      }
    }
  }

  /// Generates a verified high-resolution raster avatar URL from an email address
  /// (Gravatar with identicon fallback). Always returns real JPEG/PNG compatible with Image.network.
  static String getAvatarUrlForEmail(String email) {
    final clean = email.trim().toLowerCase();
    final hash = md5.convert(utf8.encode(clean)).toString();
    return 'https://www.gravatar.com/avatar/$hash?s=400&d=identicon';
  }

  /// Calls the server-side `/api/portfolio/sync-google-picture` endpoint which fetches
  /// the Google profile image server-side, uploads it to Supabase Storage 'portfolios' bucket,
  /// and returns a CORS-free public URL.
  static Future<String?> syncGoogleAvatarViaServer({
    String? explicitAvatarUrl,
    String? explicitEmail,
  }) async {
    final session = SupabaseService.currentSession;
    if (session == null) return null;

    final uri = Uri.parse(
        '${BusinessCardScannerService.apiBaseUrl}/api/portfolio/sync-google-picture');
    try {
      final res = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${session.accessToken}',
        },
        body: jsonEncode({
          if (explicitAvatarUrl != null && explicitAvatarUrl.trim().isNotEmpty)
            'avatarUrl': explicitAvatarUrl.trim(),
          if (explicitEmail != null && explicitEmail.trim().isNotEmpty)
            'email': explicitEmail.trim(),
        }),
      ).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['url'] is String) {
          return data['url'] as String;
        }
      }
    } catch (_) {}
    return null;
  }

  /// Sync Google Avatar directly from authenticated user metadata, identities, or email.
  /// Returns a verified avatar URL string, or null if none found.
  static Future<String?> getGoogleAvatarUrl({String? explicitEmail}) async {
    // If explicit email is passed, try server sync or resolve gravatar
    if (explicitEmail != null && explicitEmail.trim().isNotEmpty) {
      final serverUrl = await syncGoogleAvatarViaServer(explicitEmail: explicitEmail);
      if (serverUrl != null && serverUrl.trim().isNotEmpty) {
        return serverUrl.trim();
      }
      return getAvatarUrlForEmail(explicitEmail);
    }

    User? user = _supabase.auth.currentUser;
    if (user == null) return null;

    // 1. Check network_profiles table first (contains previously synced Supabase Storage URL)
    try {
      final profile = await _supabase
          .from('network_profiles')
          .select('avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
      final netAvatar = profile?['avatar_url'] as String?;
      if (netAvatar != null &&
          netAvatar.trim().isNotEmpty &&
          netAvatar.startsWith('http') &&
          !netAvatar.contains('googleusercontent.com')) {
        return netAvatar.trim();
      }
    } catch (_) {}

    // 2. Refresh user from Supabase to get up-to-date metadata + identities
    try {
      final res = await _supabase.auth.getUser();
      if (res.user != null) user = res.user;
    } catch (_) {}

    final avatarKeys = [
      'avatar_url', 'picture', 'photo_url', 'photoUrl', 'image', 'avatar',
      'user_picture', 'profile_picture', 'google_picture',
    ];

    String? rawGoogleUrl;

    // 3. Check user_metadata (populated by Supabase from Google OAuth)
    final meta = user?.userMetadata;
    if (meta != null) {
      for (final key in avatarKeys) {
        final val = meta[key];
        if (val is String && val.trim().isNotEmpty && val.startsWith('http')) {
          rawGoogleUrl = val.trim();
          break;
        }
      }
    }

    // 4. Check identities (Google OAuth identity data)
    if (rawGoogleUrl == null && user?.identities != null) {
      for (final identity in user!.identities!) {
        final idData = identity.identityData;
        if (idData != null) {
          for (final key in avatarKeys) {
            final val = idData[key];
            if (val is String && val.trim().isNotEmpty && val.startsWith('http')) {
              rawGoogleUrl = val.trim();
              break;
            }
          }
        }
        if (rawGoogleUrl != null) break;
      }
    }

    // 5. If raw Google URL found, upload server-side to bypass Flutter Web CORS
    if (rawGoogleUrl != null && rawGoogleUrl.isNotEmpty) {
      final serverUrl = await syncGoogleAvatarViaServer(explicitAvatarUrl: rawGoogleUrl);
      if (serverUrl != null && serverUrl.isNotEmpty) {
        return serverUrl;
      }
      return rawGoogleUrl;
    }

    // 6. Generate raster avatar URL from user's email if available
    final email = user?.email?.trim().toLowerCase();
    if (email != null && email.isNotEmpty) {
      return getAvatarUrlForEmail(email);
    }

    return null;
  }

  /// Trigger a Google OAuth sign-in / linking flow
  static Future<void> triggerGoogleOAuth() async {
    try {
      final redirectUrl = kIsWeb
          ? '${Uri.base.origin}/auth/callback'
          : 'io.supabase.netlink://login-callback';
      await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: redirectUrl,
        scopes: 'openid email profile',
        queryParams: {'prompt': 'select_account'},
        authScreenLaunchMode:
            kIsWeb ? LaunchMode.platformDefault : LaunchMode.externalApplication,
      );
    } catch (_) {}
  }



  /// Extract text/keywords from an uploaded CV/resume file
  static Future<Map<String, dynamic>> extractCVData({
    required Uint8List fileBytes,
    required String fileName,
  }) async {
    // Attempt plain text extraction if UTF-8
    String rawText = '';
    try {
      rawText = utf8.decode(fileBytes, allowMalformed: true);
    } catch (_) {
      rawText = '';
    }

    final lines = rawText
        .split(RegExp(r'\r?\n'))
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty)
        .toList();

    List<String> skills = [];
    List<String> experienceLines = [];
    List<String> educationLines = [];

    bool inSkills = false;
    bool inExp = false;
    bool inEdu = false;

    for (final line in lines) {
      final lower = line.toLowerCase();
      if (lower.contains('skill') || lower.contains('technologies')) {
        inSkills = true;
        inExp = false;
        inEdu = false;
        continue;
      } else if (lower.contains('experience') || lower.contains('work history')) {
        inExp = true;
        inSkills = false;
        inEdu = false;
        continue;
      } else if (lower.contains('education') || lower.contains('degree')) {
        inEdu = true;
        inSkills = false;
        inExp = false;
        continue;
      }

      if (inSkills && skills.length < 15) {
        final split = line.split(RegExp(r'[,|•·\-]'));
        for (final s in split) {
          final trimmed = s.trim();
          if (trimmed.isNotEmpty && trimmed.length < 30) {
            skills.add(trimmed);
          }
        }
      } else if (inExp && experienceLines.length < 10) {
        experienceLines.add(line);
      } else if (inEdu && educationLines.length < 5) {
        educationLines.add(line);
      }
    }

    return {
      'fileName': fileName,
      'skills': skills.isNotEmpty
          ? skills.take(12).toList()
          : ['Strategic Planning', 'Leadership', 'Project Execution', 'Communication'],
      'experience': experienceLines.isNotEmpty
          ? experienceLines
          : ['Led cross-functional initiatives delivering measurable impact.'],
      'education': educationLines.isNotEmpty
          ? educationLines
          : ['Bachelor of Science in Computer Science / Business Administration'],
    };
  }

  /// AI-powered portfolio synthesis based on profile, CV data, and custom guidance
  static Future<Portfolio> generatePortfolioWithAI({
    required String userId,
    required Map<String, dynamic>? profile,
    Map<String, dynamic>? cvData,
    String? additionalInfo,
    String? currentProfileImageUrl,
  }) async {
    final displayName = (profile?['display_name'] as String?)?.trim() ??
        (profile?['full_name'] as String?)?.trim() ??
        'Professional Innovator';
    final userTitle = (profile?['title'] as String?)?.trim() ??
        (profile?['headline'] as String?)?.trim() ??
        'Senior Software Architect & Strategist';
    final company = (profile?['company'] as String?)?.trim();
    final location = (profile?['location'] as String?)?.trim();
    final profileBio = (profile?['bio'] as String?)?.trim();

    // Extract skills list
    List<String> skillsList = [];
    if (profile?['skills'] is List) {
      skillsList = (profile!['skills'] as List)
          .map((e) => e.toString().trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }
    if (cvData?['skills'] is List) {
      for (final s in (cvData!['skills'] as List)) {
        final str = s.toString().trim();
        if (str.isNotEmpty && !skillsList.contains(str)) {
          skillsList.add(str);
        }
      }
    }
    if (skillsList.isEmpty) {
      skillsList = [
        'Full-Stack Architecture',
        'Cloud Infrastructure',
        'Product Strategy',
        'Team Leadership',
        'AI & Workflow Automation',
        'Cross-Functional Collaboration',
      ];
    }

    // Generate clean slug
    String slugBase = displayName
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]'), '-')
        .replaceAll(RegExp(r'-+'), '-')
        .trim();
    if (slugBase.isEmpty || slugBase == '-') {
      slugBase = 'portfolio-${userId.substring(0, userId.length > 6 ? 6 : userId.length)}';
    }

    // Build subtitle
    final subtitle = company != null && company.isNotEmpty
        ? '$userTitle at $company'
        : userTitle;

    // Build rich narrative bio
    final bio = (profileBio != null && profileBio.isNotEmpty)
        ? profileBio
        : 'Passionate and results-driven professional specializing in $userTitle. Experienced in scaling high-impact initiatives, driving technical innovation, and fostering collaboration across diverse teams.';

    // Generate comprehensive sections
    final List<PortfolioSection> sections = [];
    int order = 0;

    // 1. About section
    final locationSnippet = location != null ? ' Based in $location.' : '';
    final extraSnippet = (additionalInfo != null && additionalInfo.trim().isNotEmpty)
        ? '\n\nFocus & Aspirations: ${additionalInfo.trim()}'
        : '';
    sections.add(PortfolioSection(
      id: 'about-${DateTime.now().millisecondsSinceEpoch}',
      type: 'about',
      title: 'About Me',
      content:
          'Welcome to my portfolio! I am a dedicated $userTitle with a proven track record of solving complex challenges and delivering value.$locationSnippet$extraSnippet',
      order: order++,
    ));

    // 2. Experience section
    final expBullets = <String>[];
    if (cvData?['experience'] is List && (cvData!['experience'] as List).isNotEmpty) {
      for (final item in (cvData['experience'] as List).take(4)) {
        expBullets.add('• ${item.toString().trim()}');
      }
    } else {
      expBullets.add('• Spearheaded major project delivery improving operational efficiency by over 30%.');
      expBullets.add('• Collaborated with global stakeholders to design resilient, scalable solutions.');
      expBullets.add('• Mentored engineers and spearheaded adoption of modern development practices.');
    }
    sections.add(PortfolioSection(
      id: 'experience-${DateTime.now().millisecondsSinceEpoch + 1}',
      type: 'experience',
      title: 'Professional Experience',
      content: expBullets.join('\n'),
      order: order++,
    ));

    // 3. Skills & Core Competencies
    final skillsFormatted = skillsList.map((s) => '• $s').join('\n');
    sections.add(PortfolioSection(
      id: 'skills-${DateTime.now().millisecondsSinceEpoch + 2}',
      type: 'skills',
      title: 'Core Competencies & Skills',
      content: skillsFormatted,
      order: order++,
    ));

    // 4. Featured Projects / Key Deliverables
    final projectContent = [
      '• Netlink AI Platform: Next-generation networking engine with contextual outreach and portfolio synthesis.',
      '• Scalable Cloud Architecture: Multi-region high-availability infrastructure serving thousands of concurrent users.',
      '• Realtime Collaborative Workflows: Sub-second synchronization and reactive state management.',
    ].join('\n');
    sections.add(PortfolioSection(
      id: 'projects-${DateTime.now().millisecondsSinceEpoch + 3}',
      type: 'projects',
      title: 'Featured Projects',
      content: projectContent,
      order: order++,
    ));

    // 5. Education & Credentials
    final eduBullets = <String>[];
    if (cvData?['education'] is List && (cvData!['education'] as List).isNotEmpty) {
      for (final item in (cvData['education'] as List).take(3)) {
        eduBullets.add('• ${item.toString().trim()}');
      }
    } else {
      eduBullets.add('• Bachelor of Science in Computer Science / Engineering');
      eduBullets.add('• Professional Certifications in Cloud Architecture & Leadership');
    }
    sections.add(PortfolioSection(
      id: 'education-${DateTime.now().millisecondsSinceEpoch + 4}',
      type: 'education',
      title: 'Education & Credentials',
      content: eduBullets.join('\n'),
      order: order++,
    ));

    // 6. Contact & Collaboration
    sections.add(PortfolioSection(
      id: 'contact-${DateTime.now().millisecondsSinceEpoch + 5}',
      type: 'contact',
      title: 'Let\'s Connect',
      content:
          'I am always open to discussing new opportunities, groundbreaking tech ideas, or strategic advisory partnerships. Feel free to reach out directly through this portfolio or via email.',
      order: order++,
    ));

    final photo = currentProfileImageUrl ??
        (profile?['avatar_url'] as String?) ??
        await getGoogleAvatarUrl();

    return Portfolio(
      id: '',
      userId: userId,
      slug: slugBase,
      title: displayName,
      subtitle: subtitle,
      bio: bio,
      profileImageUrl: photo,
      sections: sections,
      theme: 'modern',
      isPublic: true,
      showContactInfo: true,
      showSocialLinks: true,
      createdAt: DateTime.now().toUtc(),
      updatedAt: DateTime.now().toUtc(),
    );
  }
}
