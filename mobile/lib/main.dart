import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/theme/app_theme.dart';
import 'src/core/theme/theme_provider.dart';
import 'src/core/router/app_router.dart';

void main() {
  // Capture Flutter framework errors
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    // In production, send to crash reporting service (e.g., Sentry, Firebase Crashlytics)
    // For now, just log to console
    debugPrint('Flutter Error: ${details.exception}');
    debugPrint('Stack trace: ${details.stack}');
  };

  // Capture async errors not caught by Flutter
  runZonedGuarded(
    () {
      runApp(
        const ProviderScope(
          child: PitPulseApp(),
        ),
      );
    },
    (error, stackTrace) {
      // In production, send to crash reporting service
      debugPrint('Uncaught error: $error');
      debugPrint('Stack trace: $stackTrace');
    },
  );
}

class PitPulseApp extends ConsumerWidget {
  const PitPulseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    final themeMode = ref.watch(themeSettingProvider.notifier).getThemeMode();

    return MaterialApp.router(
      title: 'PitPulse',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
