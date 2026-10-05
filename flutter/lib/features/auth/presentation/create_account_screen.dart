import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widgets/gradient_button.dart';
import '../../../core/widgets/google_glass_button.dart';
import '../../../core/widgets/grid_background.dart';
import '../../../core/widgets/sub_page_top_bar.dart';
import '../providers/auth_provider.dart';
import '../../../core/router/app_router.dart';
import '../../../core/widgets/pop_in_item.dart';
import '../../../core/localization/app_localizations.dart';

class CreateAccountScreen extends ConsumerStatefulWidget {
  const CreateAccountScreen({super.key});

  @override
  ConsumerState<CreateAccountScreen> createState() =>
      _CreateAccountScreenState();
}

class _CreateAccountScreenState extends ConsumerState<CreateAccountScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _consentAccepted = false;
  String? _consentError;
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _createAccount() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_consentAccepted) {
      setState(() {
        _consentError = context.tr('consentRequiredError');
      });
      return;
    }
    setState(() => _consentError = null);
    final success = await ref.read(authProvider.notifier).createAccount(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
    if (success && mounted) {
      context.go(AppRoutes.dashboard);
    }
  }

  Future<void> _signUpWithGoogle() async {
    if (!_consentAccepted) {
      setState(() {
        _consentError = context.tr('consentRequiredError');
      });
      return;
    }
    setState(() => _consentError = null);
    await ref.read(authProvider.notifier).signInWithGoogle(isSignUp: true);
    // Note: Do not navigate to dashboard here.
    // Supabase redirects the browser to Google accounts; once returned,
    // AuthCallbackScreen handles post-OAuth validation and navigates to dashboard.
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: context.colors.background,
      body: GridBackground(
        child: Column(
          children: [
            SubPageTopBar(
              onBack: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go(AppRoutes.landing);
                }
              },
            ),
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 460),
                    child: Column(
                      children: [




                // Animated Card
                PopInItem(
                  index: 0,
                  duration: const Duration(milliseconds: 450),
                  curve: Curves.easeOutBack,
                  slideOffset: 24.0,
                  initialScale: 0.92,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: context.colors.surfaceCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: context.colors.glassBorder),
                    boxShadow: [
                      BoxShadow(
                        color: context.colors.onSurface.withValues(alpha: 0.08),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Center(
                          child: Column(
                            children: [
                                Text(
                                context.tr('createAccountTitle'),
                                style: AppTypography.headlineMd,
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                context.tr('createAccountSubtitle'),
                                style: AppTypography.bodySm.copyWith(
                                  color: context.colors.onSurfaceVariant,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                        SizedBox(height: 20),
                        _FieldLabel(context.tr('fullNameLabel')),
                        SizedBox(height: 8),
                        TextFormField(
                          controller: _nameController,
                          style: AppTypography.bodyMd,
                          decoration:
                              InputDecoration(hintText: context.tr('fullNameHint')),
                          validator: (v) => (v == null || v.isEmpty)
                              ? context.tr('nameRequired')
                              : null,
                        ),
                        SizedBox(height: 16),
                        _FieldLabel(context.tr('emailLabel')),
                        SizedBox(height: 8),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          style: AppTypography.bodyMd,
                          decoration: InputDecoration(
                              hintText: context.tr('contactEmailHint')),
                          validator: (v) => (v == null || !v.contains('@'))
                              ? context.tr('emailInvalid')
                              : null,
                        ),
                        SizedBox(height: 16),
                        _FieldLabel(context.tr('passwordLabel')),
                        SizedBox(height: 8),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          style: AppTypography.bodyMd,
                          decoration: InputDecoration(
                            hintText: context.tr('passwordMinCharsHint'),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                color: context.colors.outline,
                                size: 20,
                              ),
                              onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword),
                            ),
                          ),
                          validator: (v) => (v == null || v.length < 6)
                              ? context.tr('passwordTooShort')
                              : null,
                        ),
                        SizedBox(height: 16),
                        _FieldLabel(context.tr('confirmPasswordLabel')),
                        SizedBox(height: 8),
                        TextFormField(
                          controller: _confirmController,
                          obscureText: _obscureConfirm,
                          style: AppTypography.bodyMd,
                          decoration: InputDecoration(
                            hintText: context.tr('repeatPasswordHint'),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureConfirm
                                    ? Icons.visibility_outlined
                                    : Icons.visibility_off_outlined,
                                color: context.colors.outline,
                                size: 20,
                              ),
                              onPressed: () => setState(
                                  () => _obscureConfirm = !_obscureConfirm),
                            ),
                          ),
                          validator: (v) => v != _passwordController.text
                              ? context.tr('passwordsDoNotMatch')
                              : null,
                        ),
                        SizedBox(height: 16),
                        // Terms & Privacy Consent Checkbox
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              height: 24,
                              width: 24,
                              child: Checkbox(
                                value: _consentAccepted,
                                activeColor: context.colors.primary,
                                checkColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                side: BorderSide(
                                  color: context.colors.outline.withValues(alpha: 0.6),
                                  width: 1.5,
                                ),
                                onChanged: (val) {
                                  setState(() {
                                    _consentAccepted = val ?? false;
                                    if (_consentAccepted) _consentError = null;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Wrap(
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  Text(
                                    context.tr('agreeToPrefix'),
                                    style: AppTypography.bodySm.copyWith(
                                      color: context.colors.onSurfaceVariant,
                                    ),
                                  ),
                                  InkWell(
                                    onTap: () async {
                                      final uri = Uri.parse('https://networklinkai.com/terms');
                                      if (await canLaunchUrl(uri)) await launchUrl(uri);
                                    },
                                    child: Text(
                                      context.tr('termsAndConditions'),
                                      style: AppTypography.bodySm.copyWith(
                                        color: context.colors.primary,
                                        fontWeight: FontWeight.w600,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    context.tr('agreeAnd'),
                                    style: AppTypography.bodySm.copyWith(
                                      color: context.colors.onSurfaceVariant,
                                    ),
                                  ),
                                  InkWell(
                                    onTap: () async {
                                      final uri = Uri.parse('https://networklinkai.com/privacy');
                                      if (await canLaunchUrl(uri)) await launchUrl(uri);
                                    },
                                    child: Text(
                                      context.tr('privacyPolicy'),
                                      style: AppTypography.bodySm.copyWith(
                                        color: context.colors.primary,
                                        fontWeight: FontWeight.w600,
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        if (_consentError != null) ...[
                          SizedBox(height: 10),
                          Container(
                            padding: EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: context.colors.errorContainer.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: context.colors.errorRuby.withValues(alpha: 0.5),
                              ),
                            ),
                            child: Text(
                              _consentError!,
                              style: AppTypography.bodySm.copyWith(
                                color: context.colors.error,
                              ),
                            ),
                          ),
                        ],

                        if (authState.errorMessage != null) ...[
                          SizedBox(height: 12),
                          Container(
                            padding: EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: context.colors.errorContainer
                                  .withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                  color: context.colors.errorRuby
                                      .withValues(alpha: 0.5)),
                            ),
                            child: Text(authState.errorMessage!,
                                style: AppTypography.bodySm
                                    .copyWith(color: context.colors.error)),
                          ),
                        ],
                        SizedBox(height: 20),
                        GradientButton(
                          label: context.tr('createAccountTitle'),
                          onPressed: _createAccount,
                          isLoading: authState.isLoading,
                        ),

                        SizedBox(height: 20),

                        // Divider
                        Row(
                          children: [
                            Expanded(
                              child: Divider(
                                color: context.colors.outlineVariant.withValues(alpha: 0.5),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                context.tr('orContinueWith'),
                                style: AppTypography.labelCaps.copyWith(
                                  color: context.colors.outline,
                                ),
                              ),
                            ),
                            Expanded(
                              child: Divider(
                                color: context.colors.outlineVariant.withValues(alpha: 0.5),
                              ),
                            ),
                          ],
                        ),

                        SizedBox(height: 16),

                        // Google sign up button
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: GoogleGlassButton(
                            onPressed: _signUpWithGoogle,
                            isLoading: authState.isLoading,
                          ),
                        ),

                        const SizedBox(height: 20),
                        Center(
                          child: _AnimatedLinkButton(
                            prefixText: context.tr('alreadyHaveAccount'),
                            actionText: context.tr('signInAction'),
                            onTap: () => context.pushReplacement(AppRoutes.signIn),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  ),
],
),
),
);
}
}

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: AppTypography.bodyMd.copyWith(
        color: context.colors.onSurfaceVariant,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}

class _AnimatedLinkButton extends StatefulWidget {
  final String prefixText;
  final String actionText;
  final VoidCallback onTap;

  const _AnimatedLinkButton({
    required this.prefixText,
    required this.actionText,
    required this.onTap,
  });

  @override
  State<_AnimatedLinkButton> createState() => _AnimatedLinkButtonState();
}

class _AnimatedLinkButtonState extends State<_AnimatedLinkButton> {
  bool _isHovered = false;
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTapDown: (_) => setState(() => _isPressed = true),
        onTapUp: (_) {
          setState(() => _isPressed = false);
          widget.onTap();
        },
        onTapCancel: () => setState(() => _isPressed = false),
        child: AnimatedScale(
          scale: _isPressed ? 0.96 : 1.0,
          duration: const Duration(milliseconds: 100),
          child: RichText(
            text: TextSpan(
              text: widget.prefixText,
              style: AppTypography.bodySm.copyWith(
                color: context.colors.onSurfaceVariant,
              ),
              children: [
                TextSpan(
                  text: widget.actionText,
                  style: AppTypography.bodySm.copyWith(
                    color: _isHovered || _isPressed
                        ? context.colors.primary.withValues(alpha: 0.85)
                        : context.colors.primary,
                    fontWeight: FontWeight.w600,
                    decoration: _isHovered ? TextDecoration.underline : TextDecoration.none,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}



