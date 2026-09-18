import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/services/business_card_scanner_service.dart';

void main() {
  group('BusinessCardScannerService Tests', () {
    test('ScannedCardData json serialization', () {
      final json = {
        'name': 'Kenji Takahashi',
        'email': 'kenji.t@sorarobotics.jp',
        'phone': '+81 3-5555-0192',
        'company': 'Sora Robotics Tokyo',
        'position': 'Chief Technology Officer',
        'linkedin_url': 'https://linkedin.com/in/kenji-takahashi',
      };

      final data = ScannedCardData.fromJson(json);
      expect(data.name, 'Kenji Takahashi');
      expect(data.email, 'kenji.t@sorarobotics.jp');
      expect(data.company, 'Sora Robotics Tokyo');
      expect(data.position, 'Chief Technology Officer');

      final map = data.toJson();
      expect(map['name'], 'Kenji Takahashi');
      expect(map['email'], 'kenji.t@sorarobotics.jp');
    });

    test('scanCard returns valid card data when offline', () async {
      final dummyBytes = Uint8List.fromList([0, 1, 2, 3, 4]);
      final result = await BusinessCardScannerService.scanCard(
        imageBytes: dummyBytes,
        userId: 'test_user',
        fallbackNameHint: 'Dr. Hiroshi Tanaka',
      );

      expect(result.name, 'Dr. Hiroshi Tanaka');
      expect(result.company, isNotEmpty);
      expect(result.email, contains('@'));
    });
  });
}
