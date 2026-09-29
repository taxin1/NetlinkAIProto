import 'package:flutter/foundation.dart';

@immutable
class ScannedContactAction {
  final String id;
  final String name;
  final String company;
  final String email;
  final String phone;
  final String title;
  final DateTime scannedAt;
  final bool emailSent;
  final String? emailSubject;

  const ScannedContactAction({
    required this.id,
    required this.name,
    required this.company,
    required this.email,
    required this.phone,
    required this.title,
    required this.scannedAt,
    required this.emailSent,
    this.emailSubject,
  });

  ScannedContactAction copyWith({
    String? id,
    String? name,
    String? company,
    String? email,
    String? phone,
    String? title,
    DateTime? scannedAt,
    bool? emailSent,
    String? emailSubject,
  }) {
    return ScannedContactAction(
      id: id ?? this.id,
      name: name ?? this.name,
      company: company ?? this.company,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      title: title ?? this.title,
      scannedAt: scannedAt ?? this.scannedAt,
      emailSent: emailSent ?? this.emailSent,
      emailSubject: emailSubject ?? this.emailSubject,
    );
  }
}

@immutable
class NetworkingModeState {
  final bool isEnabled;
  final String contextMessage;
  final String? emailTemplate;
  final bool isGeneratingTemplate;
  final bool isTemplatePrepared;
  final bool isEditingTemplate;
  final int usageCount;
  final int usageLimit;
  final bool isPro;
  final bool isScanning;
  final String? activeEventTitle;
  final List<ScannedContactAction> sessionScannedContacts;
  final String? lastScannedMessage;

  const NetworkingModeState({
    this.isEnabled = false,
    this.contextMessage =
        "Great meeting you at the event today! I'd love to stay in touch and share my portfolio and projects. Let's connect about potential collaboration opportunities.",
    this.emailTemplate,
    this.isGeneratingTemplate = false,
    this.isTemplatePrepared = false,
    this.isEditingTemplate = false,
    this.usageCount = 0,
    this.usageLimit = 100,
    this.isPro = false,
    this.isScanning = false,
    this.activeEventTitle,
    this.sessionScannedContacts = const [],
    this.lastScannedMessage,
  });

  bool get isLimitReached => !isPro && usageCount >= usageLimit;
  int get remainingUses => isPro ? -1 : (usageLimit - usageCount).clamp(0, usageLimit);

  int get responseRate {
    if (sessionScannedContacts.isEmpty) return 0;
    final sent = sessionScannedContacts.where((c) => c.emailSent).length;
    return ((sent / sessionScannedContacts.length) * 100).round();
  }

  NetworkingModeState copyWith({
    bool? isEnabled,
    String? contextMessage,
    String? emailTemplate,
    bool? isGeneratingTemplate,
    bool? isTemplatePrepared,
    bool? isEditingTemplate,
    int? usageCount,
    int? usageLimit,
    bool? isPro,
    bool? isScanning,
    String? activeEventTitle,
    List<ScannedContactAction>? sessionScannedContacts,
    String? lastScannedMessage,
  }) {
    return NetworkingModeState(
      isEnabled: isEnabled ?? this.isEnabled,
      contextMessage: contextMessage ?? this.contextMessage,
      emailTemplate: emailTemplate ?? this.emailTemplate,
      isGeneratingTemplate: isGeneratingTemplate ?? this.isGeneratingTemplate,
      isTemplatePrepared: isTemplatePrepared ?? this.isTemplatePrepared,
      isEditingTemplate: isEditingTemplate ?? this.isEditingTemplate,
      usageCount: usageCount ?? this.usageCount,
      usageLimit: usageLimit ?? this.usageLimit,
      isPro: isPro ?? this.isPro,
      isScanning: isScanning ?? this.isScanning,
      activeEventTitle: activeEventTitle ?? this.activeEventTitle,
      sessionScannedContacts: sessionScannedContacts ?? this.sessionScannedContacts,
      lastScannedMessage: lastScannedMessage,
    );
  }
}
