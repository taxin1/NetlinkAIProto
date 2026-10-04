import 'package:flutter/widgets.dart';

/// Scope provided by [AppShell] to inform descendant pages whether a shell top bar is active.
class AppShellScope extends InheritedWidget {
  final bool hasTopBar;

  const AppShellScope({
    super.key,
    required this.hasTopBar,
    required super.child,
  });

  /// Returns true if an ancestor [AppShellScope] exists and [hasTopBar] is true.
  /// If no [AppShellScope] is present in the tree (e.g. standalone widget tests),
  /// defaults to false so pages display their standard in-page header.
  static bool hasTopBarOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<AppShellScope>()?.hasTopBar ?? false;
  }

  @override
  bool updateShouldNotify(AppShellScope oldWidget) => hasTopBar != oldWidget.hasTopBar;
}
