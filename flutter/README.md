# Netlink AI Execution Manual

## Introduction

Netlink AI is an AI-powered professional networking platform built with Flutter. It provides features such as an AI assistant, networking dashboard, global user directory, emails management, analytics dashboard, portfolio showcasing, quotation generation, and settings configuration.

The application starts from [lib/main.dart](file:///d:/Office/NetlinkAIProto/lib/main.dart). The main method locks the device orientation to portrait, configures the system UI overlay, and launches the [NetlinkApp](file:///d:/Office/NetlinkAIProto/lib/main.dart#L33) root widget.

Key architecture components:
* State management is powered by flutter_riverpod. The state for authentication is managed by the [authProvider](file:///d:/Office/NetlinkAIProto/lib/features/auth/providers/auth_provider.dart#L88) provider.
* Navigation is handled by go_router, with the router configuration defined in [lib/core/router/app_router.dart](file:///d:/Office/NetlinkAIProto/lib/core/router/app_router.dart).
* Mock repository implementations simulate interactions for domain entities defined in [lib/features/remaining_domain_stubs.dart](file:///d:/Office/NetlinkAIProto/lib/features/remaining_domain_stubs.dart).

---

## Prerequisites

Before running the project, ensure that the following tools are installed on your development machine:

1. Flutter SDK: version 3.0.0 or higher (less than 4.0.0). Refer to the SDK constraint in [pubspec.yaml](file:///d:/Office/NetlinkAIProto/pubspec.yaml).
2. Android SDK: required for running on Android emulators or physical Android devices.
3. Xcode: required for running on iOS simulators or physical iOS devices (macOS only).
4. Google Chrome or another supported browser: required for running the web target.
5. An IDE: VS Code, Android Studio, or IntelliJ IDEA with Flutter and Dart extensions installed.

### Configuring Custom Android SDK and AVD Locations

If your Android SDK and Android Virtual Devices (AVD) are not installed in the default location on the C: drive, you must configure your environment variables and Flutter settings to point to your custom folders.

#### Step 1: Configure Flutter Android SDK Path
Run the following command to link Flutter to your custom Android SDK directory (for example, F:\Android\Sdk):
```powershell
flutter config --android-sdk "F:\Android\Sdk"
```

#### Step 2: Set Environment Variables
To make the SDK and AVD accessible globally, set the following environment variables.

For the current PowerShell session:
```powershell
$env:ANDROID_HOME="F:\Android\Sdk"
$env:ANDROID_AVD_HOME="F:\Android\.android\avd"
```

To set them permanently for your Windows user account, run the following commands in PowerShell:
```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "F:\Android\Sdk", "User")
[System.Environment]::SetEnvironmentVariable("ANDROID_AVD_HOME", "F:\Android\.android\avd", "User")
```

After running the permanent setup commands, restart your terminal or IDE for the environment changes to take effect.

---

## Setup Instructions

Follow these steps to set up the project locally:

1. Open a terminal and navigate to the project root directory: d:/Office/NetlinkAIProto
2. Download all package dependencies by running the following command:
   ```bash
   flutter pub get
   ```
3. (Optional) Run the build runner to trigger code generation. Although this project relies on pre-configured providers, the build tools are registered in [pubspec.yaml](file:///d:/Office/NetlinkAIProto/pubspec.yaml). Run the code generator with:
   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

---

## Running the Application

To run the application, ensure you have a target device (physical device, simulator, emulator, or browser) connected.

### List Available Devices
Run this command to list all detected devices:
```bash
flutter devices
```

### Run on Default Device
To build and run the application in debug mode on your default target device, use:
```bash
flutter run
```

### Run on a Specific Device
To run the app on a specific device, use its device ID from the list:
```bash
flutter run -d <device-id>
```

For example, to run on Google Chrome:
```bash
flutter run -d chrome
```

---

## Testing

The project includes unit and widget tests. The main widget smoke test is located at [test/widget_test.dart](file:///d:/Office/NetlinkAIProto/test/widget_test.dart).

To run all tests in the project, execute:
```bash
flutter test
```

---

## Building for Production

To compile the application for production release, use the following compilation commands.

### Build Android
* APK release:
  ```bash
  flutter build apk --release
  ```
* App Bundle release (for Google Play Store upload):
  ```bash
  flutter build appbundle --release
  ```

### Build iOS
* iOS App Store release package:
  ```bash
  flutter build ipa --release
  ```

### Build Web
* Web application release:
  ```bash
  flutter build web --release
  ```
  The compiled web files will be generated in the build/web directory.

---

## Project Structure Overview

Here is a summary of the directories and important files in the project:

* [pubspec.yaml](file:///d:/Office/NetlinkAIProto/pubspec.yaml): Defines dependencies, assets, and project configurations.
* [lib/main.dart](file:///d:/Office/NetlinkAIProto/lib/main.dart): The main entry point of the Flutter application.
* [lib/core/](file:///d:/Office/NetlinkAIProto/lib/core/): Contains core application configurations.
  * [lib/core/router/app_router.dart](file:///d:/Office/NetlinkAIProto/lib/core/router/app_router.dart): Routing configuration and navigation definitions.
  * [lib/core/theme/](file:///d:/Office/NetlinkAIProto/lib/core/theme/): Dark theme definitions.
* [lib/features/](file:///d:/Office/NetlinkAIProto/lib/features/): Contains feature-specific logic, controllers, and screens.
  * [lib/features/auth/](file:///d:/Office/NetlinkAIProto/lib/features/auth/): Simulated authentication features.
  * [lib/features/remaining_domain_stubs.dart](file:///d:/Office/NetlinkAIProto/lib/features/remaining_domain_stubs.dart): Stubs for entities like Emails, Quotations, Pricing, and Portfolio.
