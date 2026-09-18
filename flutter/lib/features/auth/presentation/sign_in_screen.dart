import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/services/supabase_service.dart';
import '../../../core/services/business_card_scanner_service.dart';
import '../../../core/widgets/app_toast.dart';
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

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).signIn(
          _emailController.text.trim(),
          _passwordController.text,
        );
    if (mounted && ref.read(authProvider).isAuthenticated) {
      context.go(AppRoutes.dashboard);
    }
  }

  Future<void> _signInWithGoogle() async {
    await ref.read(authProvider.notifier).signInWithGoogle(isSignUp: false);
    // Note: Do not navigate to dashboard here.
    // Supabase redirects the browser to Google accounts; once returned,
    // AuthCallbackScreen handles post-OAuth validation and navigates to dashboard.
  }

  Future<void> _showForgotPasswordDialog() async {
    final resetEmailController = TextEditingController(text: _emailController.text.trim());
    bool isSubmitting = false;
    await showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: context.colors.surfaceCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(context.tr('resetPassword'), style: AppTypography.headlineSm),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context.tr('resetPasswordInstructions'),
                style: AppTypography.bodySm.copyWith(color: context.colors.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: resetEmailController,
                keyboardType: TextInputType.emailAddress,
                style: AppTypography.bodyMd,
                decoration: InputDecoration(
                  hintText: context.tr('contactEmailHint'),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: isSubmitting ? null : () => Navigator.of(dialogCtx).pop(),
              child: Text(context.tr('cancel'), style: TextStyle(color: context.colors.onSurfaceVariant)),
            ),
            GradientButton(
              label: isSubmitting ? context.tr('sending') : context.tr('sendLink'),
              onPressed: isSubmitting
                  ? null
                  : () async {
                      final email = resetEmailController.text.trim();
                      if (email.isEmpty) return;
                      setDialogState(() => isSubmitting = true);
                      try {
                        await SupabaseService.auth.resetPasswordForEmail(email);
                        try {
                          await http.post(
                            Uri.parse('${BusinessCardScannerService.apiBaseUrl}/api/auth/notify'),
                            headers: {'Content-Type': 'application/json'},
                            body: jsonEncode({
                              'type': 'password_reset_requested',
                              'email': email,
                            }),
                          ).timeout(const Duration(seconds: 5));
                        } catch (_) {}
                        if (dialogCtx.mounted) Navigator.of(dialogCtx).pop();
                        if (mounted) {
                          AppToast.show(context, '${context.tr('resetInstructionsSent')} $email');
                        }
                      } catch (e) {
                        setDialogState(() => isSubmitting = false);
                        if (mounted) {
                          AppToast.show(context, '${context.tr('failedToSendResetLink')} $e');
                        }
                      }
                    },
            ),
          ],
        ),
      ),
    );
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




                // Animated Glass card form
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
                                context.tr('welcomeBack'),
                                style: AppTypography.headlineMd,
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                context.tr('signInSubtitle'),
                                style: AppTypography.bodyMd.copyWith(
                                  color: context.colors.onSurfaceVariant,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),

                        SizedBox(height: 20),

                        // Email field
                        Text(context.tr('emailLabel'),
                            style: AppTypography.bodyMd.copyWith(
                                color: context.colors.onSurfaceVariant,
                                fontWeight: FontWeight.w500)),
                        SizedBox(height: 8),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          style: AppTypography.bodyMd,
                          decoration: InputDecoration(
                            hintText: context.tr('contactEmailHint'),
                          ),
                          validator: (v) => (v == null || v.isEmpty)
                              ? context.tr('emailRequired')
                              : null,
                        ),
                        SizedBox(height: 16),

                        // Password field
                        Text(context.tr('passwordLabel'),
                            style: AppTypography.bodyMd.copyWith(
                                color: context.colors.onSurfaceVariant,
                                fontWeight: FontWeight.w500)),
                        SizedBox(height: 8),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          style: AppTypography.bodyMd,
                          decoration: InputDecoration(
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
                          validator: (v) => (v == null || v.isEmpty)
                              ? context.tr('passwordRequired')
                              : null,
                        ),

                        // Forgot password
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: _showForgotPasswordDialog,
                            style: TextButton.styleFrom(
                                padding: EdgeInsets.symmetric(
                                    vertical: 4, horizontal: 0)),
                            child: Text(context.tr('forgotPassword'),
                                style: AppTypography.bodySm
                                    .copyWith(color: context.colors.primary)),
                          ),
                        ),

                        // Error message
                        if (authState.errorMessage != null) ...[
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
                            child: Row(
                              children: [
                                Icon(Icons.error_outline,
                                    color: context.colors.error, size: 16),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    authState.errorMessage!,
                                    style: AppTypography.bodySm
                                        .copyWith(color: context.colors.error),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 12),
                        ],

                        SizedBox(height: 4),

                        // Sign in button
                        GradientButton(
                          label: context.tr('signInButton'),
                          onPressed: _signIn,
                          isLoading: authState.isLoading,
                        ),

                        SizedBox(height: 20),

                        // Divider
                        Row(
                          children: [
                            Expanded(
                              child: Divider(
                                  color: context.colors.outlineVariant
                                      .withValues(alpha: 0.5)),
                            ),
                            Padding(
                              padding: EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                context.tr('orContinueWith'),
                                style: AppTypography.labelCaps
                                    .copyWith(color: context.colors.outline),
                              ),
                            ),
                            Expanded(
                              child: Divider(
                                  color: context.colors.outlineVariant
                                      .withValues(alpha: 0.5)),
                            ),
                          ],
                        ),
                        SizedBox(height: 16),

                        // Google button — liquid glass with official Google logo
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: GoogleGlassButton(
                            onPressed: _signInWithGoogle,
                            isLoading: authState.isLoading,
                          ),
                        ),


                        const SizedBox(height: 20),

                        // Sign up link
                        Center(
                          child: _AnimatedLinkButton(
                            prefixText: context.tr('dontHaveAccount'),
                            actionText: context.tr('signUpAction'),
                            onTap: () => context.pushReplacement(AppRoutes.createAccount),
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
          scale: _isPressed ? 0.96 : (_isHovered ? 1.02 : 1.0),
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

