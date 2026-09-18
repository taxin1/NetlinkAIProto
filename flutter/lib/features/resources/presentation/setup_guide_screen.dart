import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/glass_card.dart';
import '../../../core/widgets/sub_page_top_bar.dart';
import '../../../core/widgets/floating_liquid_glass_nav_bar.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/utils/responsive.dart';
import '../../../core/localization/app_localizations.dart';




class SetupGuideScreen extends StatefulWidget {
  const SetupGuideScreen({super.key});

  @override
  State<SetupGuideScreen> createState() => _SetupGuideScreenState();
}

class _SetupGuideScreenState extends State<SetupGuideScreen> {
  final ScrollController _scrollController = ScrollController();
  final GlobalKey _profileKey = GlobalKey();
  final GlobalKey _connectKey = GlobalKey();
  final GlobalKey _toolsKey = GlobalKey();
  final GlobalKey _configKey = GlobalKey();

  String _activeTab = 'Profile';
  bool _isAutoScrolling = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isAutoScrolling || !mounted || !_scrollController.hasClients) return;

    double getY(GlobalKey key) {
      if (key.currentContext == null) return double.infinity;
      final RenderBox? box = key.currentContext!.findRenderObject() as RenderBox?;
      if (box == null || !box.hasSize) return double.infinity;
      return box.localToGlobal(Offset.zero).dy;
    }

    final screenH = MediaQuery.of(context).size.height;
    final triggerLine = kToolbarHeight + MediaQuery.of(context).padding.top + 72 + 50; 
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentPixels = _scrollController.position.pixels;

    String newActive = _activeTab;

    if ((maxScroll > 0 && currentPixels >= maxScroll - 80) || getY(_configKey) <= screenH * 0.65) {
      newActive = 'Config';
    } else if (getY(_toolsKey) <= triggerLine) {
      newActive = 'Tools';
    } else if (getY(_connectKey) <= triggerLine) {
      newActive = 'Connect';
    } else {
      newActive = 'Profile';
    }

    if (newActive != _activeTab) {
      setState(() => _activeTab = newActive);
    }
  }

  void _scrollTo(GlobalKey key, [String? targetTab]) {
    if (targetTab != null && _activeTab != targetTab) {
      setState(() => _activeTab = targetTab);
    }
    if (key.currentContext == null) return;
    final RenderBox? box = key.currentContext!.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return;
    final position = box.localToGlobal(Offset.zero, ancestor: context.findRenderObject());
    final target = _scrollController.offset + position.dy - (kToolbarHeight + MediaQuery.of(context).padding.top + 16);
    
    _isAutoScrolling = true;
    _scrollController.animateTo(
      target.clamp(0.0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeOutCubic,
    ).then((_) {
      Future.delayed(const Duration(milliseconds: 150), () {
        if (mounted) _isAutoScrolling = false;
      });
    });
  }

  Widget _buildCheckItem(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.check, color: Colors.green, size: 18),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant))),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.background,
      body: Stack(
        children: [
          // ── Ambient glows ────────────────────────────────────────────────
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Color(0x260055FF), // blue/15%
                    Color(0x000B0E14),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -80,
            left: -120,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Color(0x1FB655FF), // purple/12%
                    Color(0x000B0E14),
                  ],
                ),
              ),
            ),
          ),

          // ── Scrollable content ──────────────────────────────────────────
          SingleChildScrollView(
            controller: _scrollController,
            padding: EdgeInsets.only(
              top: kToolbarHeight + MediaQuery.of(context).padding.top + 20,
              left: Responsive.pagePadding(context),
              right: Responsive.pagePadding(context),
              bottom: 72 + MediaQuery.of(context).padding.bottom + 32,
            ),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: Responsive.maxContentWidth),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),

                // ── Title Section ────────────────────────────────────────
                Center(
                  child: Text(
                    context.tr('completeSetupGuideTitle'),
                    style: AppTypography.displayLgMobile.copyWith(height: 1.1),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 32),

                  const SizedBox(height: 32),

                  // ── Sequential Content ──────────────────────────────────────
                  Container(
                    key: _profileKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          icon: Icons.person_pin_rounded,
                          label: context.tr('setupSecProfile'),
                          color: context.colors.primary,
                        ),
                        const SizedBox(height: 16),
                        _buildProfileTab(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),
                  
                  Container(
                    key: _connectKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          icon: Icons.sync_alt_rounded,
                          label: context.tr('setupSecConnect'),
                          color: const Color(0xFF38BDF8),
                        ),
                        const SizedBox(height: 16),
                        _buildConnectTab(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),
                  
                  Container(
                    key: _toolsKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          icon: Icons.psychology_rounded,
                          label: context.tr('setupSecTools'),
                          color: const Color(0xFF8B5CF6),
                        ),
                        const SizedBox(height: 16),
                        _buildToolsTab(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),
                  
                  Container(
                    key: _configKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SectionHeader(
                          icon: Icons.security_rounded,
                          label: context.tr('setupSecConfig'),
                          color: const Color(0xFF10B981),
                        ),
                        const SizedBox(height: 16),
                        _buildConfigTab(),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),

                  // ── Pro Tips ───────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: context.colors.surfaceDim,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.colors.glassBorder),
                      boxShadow: [
                        BoxShadow(
                          color: context.colors.onSurface.withValues(alpha: 0.04),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.lightbulb_outline,
                                color: Colors.orangeAccent, size: 24),
                            const SizedBox(width: 8),
                            Text(context.tr('setupProTipsTitle'),
                                style: AppTypography.headlineMd),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildCheckItem(context.tr('setupProTip1')),
                        const SizedBox(height: 12),
                        _buildCheckItem(context.tr('setupProTip2')),
                        const SizedBox(height: 12),
                        _buildCheckItem(context.tr('setupProTip3')),
                      ],
                    ),
                  ),
                  const SizedBox(height: 48),

                  // ── Footer CTA ───────────────────────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: context.colors.surfaceCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: context.colors.glassBorder),
                      boxShadow: [
                        BoxShadow(
                          color: context.colors.onSurface.withValues(alpha: 0.04),
                          blurRadius: 16,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Text(context.tr('readyToGetStartedTitle'), style: AppTypography.headlineSm),
                        const SizedBox(height: 16),
                        Text(
                          context.tr('setupReadyDesc'),
                          textAlign: TextAlign.center,
                          style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
                        ),
                        const SizedBox(height: 24),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            GradientButton(
                              label: context.tr('goToProfileSetupBtn'),
                              onPressed: () => context.push(AppRoutes.createAccount),
                              icon: Icons.arrow_forward,
                              height: 48,
                            ),
                            const SizedBox(height: 14),
                            LiquidGlassButton(
                              label: context.tr('viewFaqBtn'),
                              onPressed: () => context.push(AppRoutes.faq),
                              icon: Icons.help_outline,
                              height: 48,
                            ),

                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 64),
                ],
              ),
            ),
          ),
          ),

          // ── Bottom Floating Liquid Glass Navbar ──
          FloatingLiquidGlassNavBar(
            activeTabLabel: _activeTab == 'Profile'
                ? context.tr('setupNavTabProfile')
                : _activeTab == 'Connect'
                    ? context.tr('setupNavTabConnect')
                    : _activeTab == 'Tools'
                        ? context.tr('setupNavTabTools')
                        : context.tr('setupNavTabConfig'),
            items: [
              FloatingNavItem(
                label: context.tr('setupNavTabProfile'),
                icon: Icons.person_outline,
                activeIcon: Icons.person,
                onTap: () => _scrollTo(_profileKey, 'Profile'),
              ),
              FloatingNavItem(
                label: context.tr('setupNavTabConnect'),
                icon: Icons.link_outlined,
                activeIcon: Icons.link,
                onTap: () => _scrollTo(_connectKey, 'Connect'),
              ),
              FloatingNavItem(
                label: context.tr('setupNavTabTools'),
                icon: Icons.auto_awesome_outlined,
                activeIcon: Icons.auto_awesome,
                onTap: () => _scrollTo(_toolsKey, 'Tools'),
              ),
              FloatingNavItem(
                label: context.tr('setupNavTabConfig'),
                icon: Icons.settings_outlined,
                activeIcon: Icons.settings,
                onTap: () => _scrollTo(_configKey, 'Config'),
              ),
            ],
          ),

          // ── Fixed Top Bar ───────────────────────────────────────────────
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SubPageTopBar(
              onBack: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go(AppRoutes.resources);
                }
              },
            ),
          ),
        ],
      ),
    );
  }



  Widget _buildProfileTab() {
    final isJa = context.isJapanese;
    return GlassCard(
      key: const ValueKey('profile'),
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(24),
      glowColor: context.colors.primary.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.person_outline, color: Colors.blue, size: 20),
              const SizedBox(width: 8),
              Text(
                isJa ? 'プロフィールを完成させる' : 'Complete Your Profile',
                style: AppTypography.headlineSm,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            isJa
                ? 'プロフェッショナルプロフィールを設定し、ネットワーキングの可能性を最大限に引き出しましょう。'
                : 'Set up your professional profile to maximize your networking potential.',
            style: AppTypography.bodySm
                .copyWith(color: context.colors.onSurfaceVariant),
          ),
          const SizedBox(height: 32),
          _buildStepItem(
            icon: Icons.check_circle_outline,
            title: isJa ? 'ステップ 1: プロフィール画面を開く' : 'Step 1: Access Your Profile',
            content: isJa
                ? [
                    '1. サイドバーから「ダッシュボード -> ネットワークプロフィール」を開きます',
                    '2. または上部ナビゲーションのプロフィールアイコンをクリックします',
                    '3. プロフィール編集画面が表示されます',
                  ]
                : [
                    '1. Navigate to Dashboard -> Network Profile from the sidebar',
                    '2. Or click on your profile icon in the top navigation',
                    '3. You\'ll see your profile editing interface',
                  ],
          ),
          const SizedBox(height: 24),
          _buildStepItem(
            icon: Icons.image_outlined,
            title: isJa ? 'ステップ 2: プロフィール写真をアップロード' : 'Step 2: Upload Profile Picture',
            content: isJa
                ? [
                    '1. プロフィール画像のプレースホルダーをクリックします',
                    '2. デバイスからプロフェッショナルな写真を選択します',
                    '3. 推奨サイズ：400x400ピクセル以上',
                    '4. 対応フォーマット：JPG, PNG, WebP',
                    '5. 画像は自動的に最適化およびトリミングされます',
                  ]
                : [
                    '1. Click on the profile picture placeholder',
                    '2. Select a professional photo from your device',
                    '3. Recommended size: 400x400 pixels or larger',
                    '4. Supported formats: JPG, PNG, or WebP',
                    '5. Your image will be automatically optimized and cropped',
                  ],
          ),
          const SizedBox(height: 24),
          _buildStepItem(
            icon: Icons.description_outlined,
            title: isJa ? 'ステップ 3: プロフェッショナル情報を追加' : 'Step 3: Add Professional Information',
            content: isJa
                ? [
                    '基本情報:',
                    '• 氏名: あなたのフルネーム',
                    '• 役職: 現在のポジションまたは役割',
                    '• 会社名: 所属企業または組織',
                    '• 自己紹介 (Bio): 専門分野や強みを簡潔に（2〜3文推奨）',
                    '• 活動拠点: 都市および国名',
                    '',
                    '連絡先情報:',
                    '• メールアドレス: ビジネス用メールアドレス',
                    '• 電話番号: 連絡可能な電話番号（任意）',
                    '• Webサイト: 個人または企業のWebサイトURL',
                  ]
                : [
                    'Basic Information:',
                    '• Full Name: Your complete professional name',
                    '• Job Title: Your current position or role',
                    '• Company: Your current company or organization',
                    '• Bio: A brief professional summary (2-3 sentences recommended)',
                    '• Location: Your city and country',
                    '',
                    'Contact Information:',
                    '• Email: Your professional email address',
                    '• Phone: Your business phone number (optional)',
                    '• Website: Your personal or company website',
                  ],
          ),
          const SizedBox(height: 24),
          _buildStepItem(
            icon: Icons.link,
            title: isJa ? 'ステップ 4: ソーシャルリンクを連携' : 'Step 4: Add Social Links',
            content: isJa
                ? [
                    'ソーシャルメディアを連携して、他のユーザーがあなたを見つけやすくします:',
                    '• LinkedIn: LinkedInプロフィールのURL',
                    '• Twitter/X: Twitter/Xのユーザー名またはURL',
                    '• GitHub: GitHubプロフィール（エンジニア向け）',
                    '• Instagram: Instagramプロフィール（任意）',
                    '• その他のリンク: その他のWebリンク',
                    '',
                    'ヒント: これらのリンクは公開プロフィールに表示され、スムーズな相互接続を促進します。',
                  ]
                : [
                    'Connect your social media profiles to make it easier for others to find and connect with you:',
                    '• LinkedIn: Your LinkedIn profile URL',
                    '• Twitter/X: Your Twitter handle or profile URL',
                    '• GitHub: Your GitHub profile (for developers)',
                    '• Instagram: Your Instagram profile (optional)',
                    '• Other Links: Any other professional profiles or websites',
                    '',
                    'Tip: These links will appear on your public network profile, making it easy for others to connect with you on different platforms.',
                  ],
          ),
          const SizedBox(height: 24),
          _buildStepItem(
            icon: Icons.shield_outlined,
            title: isJa ? 'ステップ 5: プライバシー設定' : 'Step 5: Privacy Settings',
            content: isJa
                ? [
                    'プロフィールの公開範囲を設定します:',
                    '• 公開プロフィール: すべてのNetwork Link AIユーザーに公開',
                    '• 連絡先情報: 公開する連絡先情報の選択',
                    '• ソーシャルリンク: 公開するSNSリンクの管理',
                    '• ポートフォリオ公開範囲: ポートフォリオを閲覧できる相手を設定',
                    '',
                    '注意: 公開プロフィールにすると人脈形成が加速しますが、非公開項目はいつでも個別に保護できます。',
                  ]
                : [
                    'Configure who can see your profile:',
                    '• Public Profile: Make your profile visible to all Network Link AI users',
                    '• Contact Information: Choose what contact details are visible',
                    '• Social Links: Control which social links are public',
                    '• Portfolio Visibility: Set who can view your portfolio',
                    '',
                    'Note: A public profile helps you connect with more professionals, but you can always keep certain information private.',
                  ],
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: context.colors.surfaceVariant.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: context.colors.glassBorder),
              boxShadow: [
                BoxShadow(
                  color: context.colors.onSurface.withValues(alpha: 0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle_outline,
                        color: Colors.blue, size: 16),
                    const SizedBox(width: 8),
                    Text(
                      isJa ? 'プロフィール完了チェックリスト' : 'Profile Completion Checklist',
                      style: AppTypography.bodyMd
                          .copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildChecklistItem(isJa ? 'プロフィール写真のアップロード' : 'Profile picture uploaded'),
                _buildChecklistItem(isJa ? '氏名・役職の登録' : 'Full name and job title added'),
                _buildChecklistItem(isJa ? '自己紹介（Bio）の記述' : 'Professional bio written'),
                _buildChecklistItem(isJa ? '1つ以上のSNSリンク追加' : 'At least one social link added'),
                _buildChecklistItem(isJa ? 'プライバシー設定の確認' : 'Privacy settings configured'),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildChecklistItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: Colors.blue, size: 14),
          const SizedBox(width: 8),
          Text(text,
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Tab 2: Connect
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildConnectTab() {
    final isJa = context.isJapanese;
    return Column(
      key: const ValueKey('connect'),
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildIntegrationCard(
          icon: Icons.calendar_today,
          title: isJa ? 'Googleカレンダー連携' : 'Google Calendar Integration',
          subtitle: isJa
              ? 'Googleカレンダーを連携してイベント、面談、ネットワーキングの機会を自動同期します。'
              : 'Connect your Google Calendar to sync events, meetings, and networking opportunities.',
          whyContent: isJa
              ? [
                  'カレンダーのイベントをNetwork Link AIと自動同期',
                  'インテリジェントな面談リマインダーを受信',
                  'メールから直接予定を作成',
                  'ネットワーキング活動や面談実績を追跡',
                  '大切なビジネスチャンスを見逃さない',
                ]
              : [
                  'Automatically sync your calendar events with Network Link AI',
                  'Get intelligent meeting reminders',
                  'Create events directly from emails',
                  'Track networking activities and meetings',
                  'Never miss an important connection',
                ],
          howContent: isJa
              ? [
                  '1. 「ダッシュボード -> 設定 -> 連携サービス」を開きます',
                  '2. Googleカレンダーのセクションを見つけます',
                  '3. 「Googleカレンダーを連携」ボタンをクリックします',
                  '4. Googleの認証画面に移動し、アクセスを許可します',
                  '5. 連携するGoogleアカウントを選択します',
                  '6. 必要なアクセス権限を確認して承認します',
                  '7. Network Link AIに自動でリダイレクトされます',
                  '8. カレンダー連携完了の確認メッセージが表示されます',
                ]
              : [
                  '1. Go to Dashboard -> Settings -> Integrations',
                  '2. Find the Google Calendar section',
                  '3. Click the "Connect Google Calendar" button',
                  '4. You\'ll be redirected to Google to authorize Network Link AI',
                  '5. Select the Google account you want to connect',
                  '6. Review and approve the permissions requested',
                  '7. You\'ll be redirected back to Network Link AI',
                  '8. You should see a confirmation message that Calendar is connected',
                ],
          extraTitle: isJa ? '連携後の動作:' : 'What Happens After Connection:',
          extraContent: isJa
              ? [
                  'カレンダーイベントが自動的に同期されます',
                  'カレンダーおよびイベントページに「連携済み」バッジが表示されます',
                  'Network Link AIで作成した予定がGoogleカレンダーに反映されます',
                  '設定画面からいつでも同期のON/OFFを切り替えられます',
                ]
              : [
                  'Your calendar events will sync automatically',
                  'You\'ll see a "Synced" badge on the Calendar and Events pages',
                  'New events created in Network Link AI will appear in your Google Calendar',
                  'You can enable/disable sync anytime from Settings',
                ],
          securityNote: isJa
              ? 'Network Link AIはカレンダーイベントの読み取りおよび書き込み権限のみを要求します。メール本文や連絡先、その他のGoogleデータに無断でアクセスすることはありません。アクセス権限はGoogleアカウント設定からいつでも解除できます。'
              : 'Network Link AI only requests read and write access to your calendar events. We never access your emails, contacts, or other Google data. You can revoke access at any time from your Google Account settings.',
        ),
        const SizedBox(height: 24),
        _buildIntegrationCard(
          icon: Icons.mail_outline,
          title: isJa ? 'Gmail連携' : 'Gmail Integration',
          subtitle: isJa
              ? 'Gmailアカウントを連携してメール送信、会話の追跡、ネットワーキング連絡を一元管理します。'
              : 'Connect your Gmail account to send emails, track conversations, and manage your networking communications.',
          whyContent: isJa
              ? [
                  'Network Link AIから直接メールを送信',
                  '連絡先とのメール履歴をタイムラインで確認',
                  'AIを活用してパーソナライズされたメールを下書き作成',
                  'AIメールキャンペーンの配信・管理',
                  'メールの要約や重要ポイントを自動抽出',
                ]
              : [
                  'Send emails directly from Network Link AI',
                  'Track email conversations with contacts',
                  'Use AI to draft and personalize emails',
                  'Manage email campaigns',
                  'Get email highlights and summaries',
                ],
          howContent: isJa
              ? [
                  '1. 「ダッシュボード -> 設定 -> 連携サービス」を開きます',
                  '2. Gmailセクションを見つけます',
                  '3. 「Gmailを連携」ボタンをクリックします',
                  '4. Googleアカウントでサインインします',
                  '5. 権限を確認して承認します',
                  '6. 連携完了のメッセージが表示されます',
                ]
              : [
                  '1. Go to Dashboard -> Settings -> Integrations',
                  '2. Find the Gmail section',
                  '3. Click the "Connect Gmail" button',
                  '4. Sign in with your Google account',
                  '5. Review and approve the permissions',
                  '6. You\'ll see a confirmation when Gmail is connected',
                ],
          extraTitle: isJa ? 'Gmail機能の使い方:' : 'Using Gmail Features:',
          extraContent: isJa
              ? [
                  'メール送信: メール画面に移動して「新規作成」をクリック',
                  'AI下書き: AIアシスタントを使ってプロフェッショナルな文面を作成',
                  '会話追跡: 各連絡先との全メールスレッドを確認',
                  'メールキャンペーン: 一括キャンペーンの作成と送信管理',
                ]
              : [
                  'Send Emails: Go to Emails page and click "Compose"',
                  'AI Drafts: Use the AI assistant to draft professional emails',
                  'Track Conversations: View all email threads with each contact',
                  'Email Campaigns: Create and manage bulk email campaigns',
                ],
          securityNote: null,
        ),
      ],
    );
  }

  Widget _buildIntegrationCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<String> whyContent,
    required List<String> howContent,
    required String extraTitle,
    required List<String> extraContent,
    required String? securityNote,
  }) {
    final isJa = context.isJapanese;
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(24),
      glowColor: context.colors.primary.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: Colors.blue, size: 20),
              const SizedBox(width: 8),
              Text(title, style: AppTypography.headlineSm),
            ],
          ),
          const SizedBox(height: 8),
          Text(subtitle,
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
          const SizedBox(height: 24),
          Text(isJa ? '連携するメリット:' : 'Why Connect?',
              style:
                  AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...whyContent.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('• ',
                        style: TextStyle(color: context.colors.onSurfaceVariant)),
                    Expanded(
                        child: Text(item,
                            style: AppTypography.bodySm
                                .copyWith(color: context.colors.onSurfaceVariant))),
                  ],
                ),
              )),
          const SizedBox(height: 24),
          Text(isJa ? '連携手順:' : 'How to Connect:',
              style:
                  AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...howContent.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(item,
                    style: AppTypography.bodySm
                        .copyWith(color: context.colors.onSurfaceVariant)),
              )),
          const SizedBox(height: 24),
          Text(extraTitle,
              style:
                  AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...extraContent.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('• ',
                        style: TextStyle(color: context.colors.onSurfaceVariant)),
                    Expanded(
                        child: Text(item,
                            style: AppTypography.bodySm
                                .copyWith(color: context.colors.onSurfaceVariant))),
                  ],
                ),
              )),
          if (securityNote != null) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: context.colors.surfaceVariant.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: context.colors.glassBorder),
                boxShadow: [
                  BoxShadow(
                    color: context.colors.onSurface.withValues(alpha: 0.04),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.security, color: Colors.blue, size: 16),
                      const SizedBox(width: 8),
                      Text(isJa ? 'セキュリティについて' : 'Security Note',
                          style: AppTypography.bodyMd.copyWith(
                              fontWeight: FontWeight.bold, color: Colors.blue)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(securityNote,
                      style: AppTypography.labelSm
                          .copyWith(color: context.colors.onSurfaceVariant)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Tab 3: Tools
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildToolsTab() {
    final isJa = context.isJapanese;
    return Column(
      key: const ValueKey('tools'),
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Expanded(
                child: _buildToolCard(
              icon: Icons.document_scanner_outlined,
              title: isJa ? 'AI名刺スキャナー' : 'Business Card Scanner',
              desc: isJa
                  ? 'AIを使用して名刺写真から瞬時に連絡先情報を抽出します。'
                  : 'Use AI to instantly extract contact information from business card photos.',
              howToUse: isJa
                  ? [
                      '1. 「ダッシュボード -> 名刺スキャナー」を開きます',
                      '2. 「画像をアップロード」をクリックするか写真をドラッグ＆ドロップします',
                      '3. AIが情報を抽出するまで数秒待ちます',
                      '4. 抽出されたデータを確認します',
                      '5. 必要に応じて項目を修正します',
                      '6. 「連絡先を保存」をクリックしてディレクトリに追加します',
                    ]
                  : [
                      '1. Go to Dashboard -> Business Card Scanner',
                      '2. Click "Upload Image" or drag and drop a photo',
                      '3. Wait for AI to extract information (usually 2-5 seconds)',
                      '4. Review the extracted data',
                      '5. Edit any fields if needed',
                      '6. Click "Save Contact" to add to your contacts',
                    ],
              note: isJa
                  ? 'ヒント: 明るい場所で名刺全体がはっきり写るように撮影すると、最高の精度で認識されます。氏名、役職、会社名、電話、メールなどを自動抽出します。'
                  : 'Tip: Take clear, well-lit photos of business cards for best results. The AI can extract name, email, phone, company, and more.',
            )),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
                child: _buildToolCard(
              icon: Icons.auto_awesome,
              title: isJa ? 'AIアシスタント' : 'AI Assistant',
              desc: isJa
                  ? 'メール作成、連絡先管理、ネットワーキングの相談などをAIがサポートします。'
                  : 'Get help with emails, contacts, and networking tasks using AI.',
              howToUse: isJa
                  ? [
                      '1. 「ダッシュボード -> AIアシスタント」を開きます',
                      '2. チャット欄に質問やリクエストを入力します',
                      '3. マイクアイコンをタップして音声入力も可能です',
                      '4. AIが以下をサポートします:',
                      '   • メールの自動下書き作成',
                      '   • 連絡先情報の整理と要約',
                      '   • ネットワーキング戦略のアドバイス',
                      '   • 疑問点への迅速な回答',
                    ]
                  : [
                      '1. Go to Dashboard -> AI Assistant',
                      '2. Type your question or request in the chat',
                      '3. Use voice input by clicking the microphone icon',
                      '4. The AI can help with:',
                      '   • Drafting emails',
                      '   • Managing contacts',
                      '   • Networking advice',
                      '   • Answering questions',
                    ],
              note: null,
            )),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
                child: _buildToolCard(
              icon: Icons.mail_outline,
              title: isJa ? 'AIメール生成' : 'AI Email Generation',
              desc: isJa
                  ? 'プロフェッショナルで相手に合わせたメールをAIが自動作成します。'
                  : 'Let AI draft professional, personalized emails for you.',
              howToUse: isJa
                  ? [
                      '1. 「ダッシュボード -> メール」を開きます',
                      '2. 「新規作成」をクリックするか連絡先を選択します',
                      '3. 「AIで生成」ボタンをクリックします',
                      '4. 伝えたい内容や目的を簡単に入力します',
                      '5. AIが最適な文面を下書き作成します',
                      '6. 必要に応じて編集します',
                      '7. 送信または下書き保存します',
                    ]
                  : [
                      '1. Go to Dashboard -> Emails',
                      '2. Click "Compose" or select a contact',
                      '3. Click "Generate with AI" button',
                      '4. Describe what you want to say',
                      '5. AI will draft the email for you',
                      '6. Review and edit as needed',
                      '7. Send or save as draft',
                    ],
              note: null,
            )),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
                child: _buildToolCard(
              icon: Icons.work_outline,
              title: isJa ? 'AIポートフォリオビルダー' : 'Portfolio Builder',
              desc: isJa
                  ? '職務経歴書やCVから美しい公開ポートフォリオを自動生成します。'
                  : 'Create a stunning professional portfolio with AI assistance.',
              howToUse: isJa
                  ? [
                      '1. 「ダッシュボード -> ポートフォリオ」を開きます',
                      '2. 履歴書またはCVファイルをアップロードします',
                      '3. 「ポートフォリオを生成」をクリックします',
                      '4. AIが職歴や実績から魅力的なページを作成します',
                      '5. レイアウト、配色、記載内容をカスタマイズします',
                      '6. プロジェクトやスキル実績を追加します',
                      '7. 公開リンクをコピーして共有します',
                    ]
                  : [
                      '1. Go to Dashboard -> Portfolio',
                      '2. Upload your CV or resume',
                      '3. Click "Generate Portfolio"',
                      '4. AI will create a beautiful portfolio from your CV',
                      '5. Customize colors, layout, and content',
                      '6. Add projects, skills, and achievements',
                      '7. Share your portfolio link',
                    ],
              note: null,
            )),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
                child: _buildToolCard(
              icon: Icons.people_outline,
              title: isJa ? 'ネットワークモード' : 'Networking Mode',
              desc: isJa
                  ? '対面イベントや展示会でスマートに名刺交換とフォローアップを実施します。'
                  : 'Discover and connect with professionals in your network.',
              howToUse: isJa
                  ? [
                      '1. 「ダッシュボード -> ネットワークモード」を開きます',
                      '2. 名刺を素早く連続スキャンします',
                      '3. 事前に設定したフォローアップテンプレートを確認します',
                      '4. ワンタップで相手に挨拶メールを送信できます',
                      '5. セッションごとのスキャン・送信実績を把握します',
                    ]
                  : [
                      '1. Go to Dashboard -> Networking Mode',
                      '2. Browse professionals in your network',
                      '3. Filter by industry, location, or skills',
                      '4. View public profiles',
                      '5. Connect with professionals',
                      '6. Add them to your contacts',
                    ],
              note: null,
            )),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
                child: _buildToolCard(
              icon: Icons.bar_chart,
              title: isJa ? 'アナリティクス＆分析' : 'Analytics',
              desc: isJa
                  ? 'ネットワーキングの成果を測定し、成長をトラッキングします。'
                  : 'Track your networking activities and measure your success.',
              howToUse: isJa
                  ? [
                      '追跡可能な主要指標:',
                      '• 総連絡先数と人脈成長率',
                      '• メール開封率・返信率のパフォーマンス',
                      '• 参加イベントと獲得ROI',
                      '• キャンペーンの成約率',
                      '• AIによるパーソナライズされた改善アドバイス',
                    ]
                  : [
                      'What You Can Track:',
                      '• Total contacts and growth',
                      '• Email performance metrics',
                      '• Networking events attended',
                      '• Campaign success rates',
                      '• Most active connections',
                    ],
              note: null,
            )),
          ],
        ),
      ],
    );
  }

  Widget _buildToolCard({
    required IconData icon,
    required String title,
    required String desc,
    required List<String> howToUse,
    required String? note,
  }) {
    final isJa = context.isJapanese;
    return GlassCard(
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(24),
      glowColor: context.colors.primary.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: context.colors.primary, size: 20),
              const SizedBox(width: 8),
              Text(title, style: AppTypography.headlineSm),
            ],
          ),
          const SizedBox(height: 16),
          Text(desc,
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
          const SizedBox(height: 16),
          Text(isJa ? '使い方:' : 'How to Use:',
              style:
                  AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...howToUse.map((item) => Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Text(item,
                    style: AppTypography.bodySm
                        .copyWith(color: context.colors.onSurfaceVariant)),
              )),
          if (note != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: context.colors.surfaceVariant.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(note,
                  style: AppTypography.labelSm
                      .copyWith(color: context.colors.onSurfaceVariant)),
            ),
          ],
        ],
      ),
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Tab 4: Config
  // ──────────────────────────────────────────────────────────────────────────
  Widget _buildConfigTab() {
    final isJa = context.isJapanese;
    return GlassCard(
      key: const ValueKey('config'),
      borderRadius: BorderRadius.circular(20),
      padding: const EdgeInsets.all(24),
      glowColor: context.colors.primary.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.settings_outlined, color: Colors.blue, size: 20),
              const SizedBox(width: 8),
              Text(isJa ? 'アカウント設定' : 'Account Settings',
                  style: AppTypography.headlineSm),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            isJa
                ? 'アカウントの基本設定や通知、セキュリティを管理します。'
                : 'Configure your account preferences and notification settings.',
            style: AppTypography.bodySm
                .copyWith(color: context.colors.onSurfaceVariant),
          ),
          const SizedBox(height: 32),
          Text(isJa ? '一般設定' : 'General Settings', style: AppTypography.headlineSm),
          const SizedBox(height: 16),
          Text(isJa ? 'メール通知' : 'Email Notifications',
              style:
                  AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(isJa ? '受信するメール通知を選択してください:' : 'Control what email notifications you receive:',
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
          const SizedBox(height: 8),
          _buildBulletItem(context, isJa ? '新しいコンタクトや面談のリクエスト' : 'New connection requests'),
          _buildBulletItem(context, isJa ? 'メールキャンペーンの配信・返信アップデート' : 'Email campaign updates'),
          _buildBulletItem(context, isJa ? 'ミーティングのリマインダー通知' : 'Meeting reminders'),
          _buildBulletItem(context, isJa ? 'システムアップデートとお知らせ' : 'System updates and announcements'),
          const SizedBox(height: 24),
          Text(isJa ? 'アプリ内通知' : 'App Notifications',
              style:
                  AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(isJa ? 'アプリ内プッシュ通知の設定:' : 'Manage in-app notifications:',
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
          const SizedBox(height: 8),
          _buildBulletItem(context, isJa ? '新着アクションのリアルタイム通知' : 'Real-time notifications for new activities'),
          _buildBulletItem(context, isJa ? 'ミーティングのリマインダー' : 'Meeting reminders'),
          _buildBulletItem(context, isJa ? '重要メールのハイライト' : 'Email highlights'),
          _buildBulletItem(context, isJa ? 'コネクションの更新' : 'Connection updates'),
          const SizedBox(height: 32),
          Text(isJa ? 'プライバシー＆セキュリティ' : 'Privacy & Security', style: AppTypography.headlineSm),
          const SizedBox(height: 16),
          Text(isJa ? 'プロフィールの公開範囲' : 'Profile Visibility',
              style:
                  AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
              isJa
                  ? 'プロフィールや連絡先情報の公開範囲を制御します。公開に設定すると多くのプロフェッショナルと繋がることができますが、いつでも非公開に設定できます。'
                  : 'Control who can see your profile and contact information. You can make your profile public to connect with more professionals, or keep it private.',
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
          const SizedBox(height: 24),
          Text(isJa ? 'データ管理' : 'Data Management',
              style:
                  AppTypography.bodyMd.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(isJa ? '登録データの管理:' : 'Manage your data:',
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
          const SizedBox(height: 8),
          _buildBulletItem(context, isJa ? 'データのエクスポート' : 'Export your data'),
          _buildBulletItem(context, isJa ? 'アカウントの削除' : 'Delete your account'),
          _buildBulletItem(context, isJa ? '連携中サービスの一覧・管理' : 'Manage connected integrations'),
          _buildBulletItem(context, isJa ? 'ストレージ使用量の確認' : 'View data usage'),
          const SizedBox(height: 32),
          Text(isJa ? 'プラン＆サブスクリプション' : 'Subscription Management', style: AppTypography.headlineSm),
          const SizedBox(height: 16),
          Text(
              isJa
                  ? '現在の加入プランの確認、請求履歴の確認、プランのアップグレードや変更を行えます。'
                  : 'Manage your subscription, view billing history, and upgrade or downgrade your plan.',
              style: AppTypography.bodySm
                  .copyWith(color: context.colors.onSurfaceVariant)),
          const SizedBox(height: 16),
          _buildBulletItem(context, isJa ? '現在のプランと利用可能機能の確認' : 'View current plan and features'),
          _buildBulletItem(context, isJa ? 'ProfessionalまたはEnterpriseへのアップグレード' : 'Upgrade to Professional or Enterprise'),
          _buildBulletItem(context, isJa ? '請求履歴と領収書の確認' : 'View billing history'),
          _buildBulletItem(context, isJa ? 'お支払い方法の更新' : 'Update payment method'),
          _buildBulletItem(context, isJa ? 'サブスクリプションの解約手続き' : 'Cancel subscription (if applicable)'),
          const SizedBox(height: 24),
          GradientButton(
            label: isJa ? '料金プラン設定へ' : 'Go to Subscription Settings',
            icon: Icons.arrow_forward,
            height: 46,
            onPressed: () => context.push(AppRoutes.pricing),
          ),
        ],
      ),
    );
  }

  Widget _buildBulletItem(BuildContext context, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('• ', style: TextStyle(color: context.colors.onSurfaceVariant)),
          Expanded(
              child: Text(text,
                  style: AppTypography.bodySm
                      .copyWith(color: context.colors.onSurfaceVariant))),
        ],
      ),
    );
  }

  Widget _buildStepItem({
    required IconData icon,
    required String title,
    required List<String> content,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.blue, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: AppTypography.bodyMd
                      .copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              ...content.map((item) {
                if (item.isEmpty) return const SizedBox(height: 8);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(item,
                      style: AppTypography.bodySm
                          .copyWith(color: context.colors.onSurfaceVariant)),
                );
              }),
            ],
          ),
        ),
      ],
    );
  }
}

