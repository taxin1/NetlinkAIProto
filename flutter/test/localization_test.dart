import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:networklink_ai/core/localization/app_localizations.dart';

void main() {
  group('AppLocalizations Tests', () {
    test('English translations match expected values', () {
      final l10n = AppLocalizations(const Locale('en'));
      expect(l10n.translate('freeTrialDesc'), 'You are in Trial Mode. Progress will not be saved.');
      expect(l10n.translate('trialWarning'), 'You are in Trial Mode. Progress will not be saved.');
      expect(l10n.translate('signUp'), 'Sign up');
      expect(l10n.translate('eventsSchedule'), 'Events Schedule');
      expect(l10n.translate('addEvent'), 'Add Event');
      expect(l10n.translate('emailCalendarHighlights'), 'Email & Calendar Highlights');
      expect(l10n.translate('deleteEmailSettingsTitle'), 'Delete Email Settings?');
      expect(l10n.translate('voiceStatusListening'), 'Listening');
      expect(l10n.translate('faqQ1'), 'How do I create an account?');
      expect(l10n.translate('continueWithGoogle'), 'Continue with Google');
      expect(l10n.translate('meetings'), 'Meetings');
      expect(l10n.translate('overview'), 'Overview');
      expect(l10n.translate('exploreEventMatches'), 'Explore Event Matches');
      expect(l10n.translate('emailSettingsSaved'), 'Email settings saved successfully!');
      expect(l10n.translate('pleaseEnterEventTitle'), 'Please enter an event title');
      expect(l10n.translate('voiceActionExecutedSuccess'), 'Done! The action has been executed successfully.');
      expect(l10n.translate('view'), 'View');
      expect(l10n.translate('you'), 'You');
      expect(l10n.translate('allTime'), 'All time');
      expect(l10n.translate('scheduled'), 'Scheduled');
      expect(l10n.translate('last7Days'), 'Last 7 days');
      expect(l10n.translate('noHighlightsYet'), 'No recent emails or calendar updates to summarize yet.');
      expect(l10n.translate('viewDetailedAnalytics'), 'View detailed analytics');
    });

    test('Japanese translations match expected values', () {
      final l10n = AppLocalizations(const Locale('ja'));
      expect(l10n.translate('freeTrialDesc'), 'トライアルモードで利用中です。進行状況は保存されません。');
      expect(l10n.translate('trialWarning'), 'トライアルモードで利用中です。進行状況は保存されません。');
      expect(l10n.translate('signUp'), '新規登録');
      expect(l10n.translate('eventsSchedule'), 'イベントスケジュール');
      expect(l10n.translate('addEvent'), 'イベントを追加');
      expect(l10n.translate('emailCalendarHighlights'), 'メール＆カレンダーのハイライト');
      expect(l10n.translate('deleteEmailSettingsTitle'), 'メール設定を削除しますか？');
      expect(l10n.translate('voiceStatusListening'), '聞き取り中');
      expect(l10n.translate('faqQ1'), 'アカウントを作成するにはどうすればよいですか？');
      expect(l10n.translate('continueWithGoogle'), 'Googleで続行');
      expect(l10n.translate('meetings'), 'ミーティング');
      expect(l10n.translate('overview'), '概要');
      expect(l10n.translate('exploreEventMatches'), 'イベントマッチングを探索');
      expect(l10n.translate('emailSettingsSaved'), 'メール設定を正常に保存しました！');
      expect(l10n.translate('pleaseEnterEventTitle'), 'イベント名を入力してください');
      expect(l10n.translate('voiceActionExecutedSuccess'), '完了しました！アクションは正常に実行されました。');
      expect(l10n.translate('view'), '表示');
      expect(l10n.translate('you'), 'あなた');
      expect(l10n.translate('allTime'), '全期間');
      expect(l10n.translate('scheduled'), '予定あり');
      expect(l10n.translate('last7Days'), '過去7日間');
      expect(l10n.translate('noHighlightsYet'), '要約するメールやカレンダーの更新はまだありません。');
      expect(l10n.translate('viewDetailedAnalytics'), '詳細なアナリティクスを表示');
    });
  });
}
