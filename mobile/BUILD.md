# 📱 PieraChat Mobile Build Guide

**Complete guide to building PieraChat mobile app for Android and iOS**

---

## Prerequisites

- **Node.js** 18+ installed
- **Expo CLI** installed: `npm install -g expo-cli eas-cli`
- **Expo account** (free): https://expo.dev/signup
- **For iOS**: Mac with Xcode 14+, Apple Developer Account ($99/year)
- **For Android**: Android Studio (optional, for testing)

---

## Quick Start

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Login to Expo
npx expo login

# 3. Configure EAS (first time only)
eas build:configure

# 4. Build APK for Android (preview)
eas build --platform android --profile preview

# 5. Build for production
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## Development Builds

### Run on Emulator/Simulator

**Android Emulator:**
```bash
npm run android
```

**iOS Simulator (Mac only):**
```bash
npm run ios
```

**Web (for testing):**
```bash
npm run web
```

### Run on Physical Device with Expo Go

```bash
# Start dev server
npm start

# Scan QR code with:
# - iOS: Camera app
# - Android: Expo Go app
```

---

## Production Builds

### Android APK (for testing)

**Build APK:**
```bash
eas build --platform android --profile preview
```

- Build time: ~10-15 minutes
- Output: APK file (~50MB)
- Can be installed directly on Android devices
- No Google Play account needed

**Download and install:**
1. Build completes, EAS provides download link
2. Download APK to Android device
3. Enable "Install from unknown sources"
4. Open APK and install

### Android App Bundle (for Google Play)

**Build AAB:**
```bash
eas build --platform android --profile production
```

- Build time: ~10-15 minutes
- Output: AAB file (Android App Bundle)
- Required format for Google Play Store
- Smaller download size for users

**Configuration in app.json:**
```json
{
  "android": {
    "package": "com.pierachat.app",
    "versionCode": 1,
    "permissions": [...]
  }
}
```

**Submit to Google Play:**
```bash
# Automatic submission
eas submit --platform android

# Or manually upload AAB to Google Play Console
# https://play.google.com/console
```

### iOS Build

**Prerequisites:**
- Mac with macOS 12+
- Xcode 14+ installed
- Apple Developer Account ($99/year)
- App created in App Store Connect

**Build IPA:**
```bash
eas build --platform ios --profile production
```

- Build time: ~15-20 minutes
- Output: IPA file
- Requires Apple Developer credentials

**Configuration in app.json:**
```json
{
  "ios": {
    "bundleIdentifier": "com.pierachat.app",
    "buildNumber": "1",
    "supportsTablet": true
  }
}
```

**Submit to App Store:**
```bash
# Automatic submission to TestFlight
eas submit --platform ios

# Then promote to App Store via App Store Connect
# https://appstoreconnect.apple.com
```

---

## Build Profiles

### `eas.json` Configuration

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

**Profiles:**
- **development**: For development builds with dev client
- **preview**: APK builds for testing (internal distribution)
- **production**: Store-ready builds (AAB for Android, IPA for iOS)

---

## Environment Configuration

### Server URLs

**Development (localhost):**
```javascript
// mobile/src/config/constants.js
export const WEBSOCKET_URL = 'ws://localhost:8080/ws';
export const SERVER_URL = 'http://localhost:8080';
```

**Development (physical device):**
```javascript
// Use your computer's local IP
export const WEBSOCKET_URL = 'ws://192.168.1.100:8080/ws';
export const SERVER_URL = 'http://192.168.1.100:8080';
```

**Production:**
```javascript
export const WEBSOCKET_URL = 'wss://chat.example.com/ws';
export const SERVER_URL = 'https://chat.example.com';
```

**Find your local IP:**
```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

---

## Build Process Details

### Step-by-Step Android Build

1. **Configure project:**
```bash
cd mobile
eas build:configure
```

2. **Update app.json:**
```json
{
  "expo": {
    "name": "PieraChat",
    "version": "2.0.0",
    "android": {
      "package": "com.pierachat.app",
      "versionCode": 1
    }
  }
}
```

3. **Start build:**
```bash
eas build --platform android --profile production
```

4. **Build steps (on EAS servers):**
   - Install dependencies
   - Configure native projects
   - Compile native code
   - Sign with keystore
   - Create APK/AAB

5. **Download:**
   - Build page: https://expo.dev/accounts/[username]/projects/pierachat/builds
   - Or use CLI: `eas build:list`

### Step-by-Step iOS Build

1. **Prerequisites check:**
```bash
# On your Mac
xcode-select --install
xcodebuild -version  # Should show Xcode 14+
```

2. **Apple Developer setup:**
   - Sign in to https://developer.apple.com
   - Create App ID: com.pierachat.app
   - Create provisioning profile
   - (EAS can handle this automatically)

3. **Start build:**
```bash
eas build --platform ios --profile production
```

4. **First build - authentication:**
   - EAS will prompt for Apple ID
   - Two-factor authentication code
   - Select team/provisioning profile

5. **Subsequent builds:**
   - Credentials cached
   - Automatic build

6. **TestFlight:**
```bash
# Submit to TestFlight
eas submit --platform ios

# Or manually:
# 1. Download IPA
# 2. Open Xcode > Transporter
# 3. Upload IPA
```

---

## Signing & Credentials

### Android Keystore

**Automatic (recommended):**
- EAS generates and manages keystore
- Stored securely on Expo servers
- No manual management needed

**Manual:**
```bash
# Generate keystore
keytool -genkeypair -v -keystore pierachat.keystore -alias pierachat \
  -keyalg RSA -keysize 2048 -validity 10000

# Configure in eas.json
{
  "build": {
    "production": {
      "android": {
        "credentialsSource": "local"
      }
    }
  }
}
```

### iOS Certificates & Profiles

**Automatic (recommended):**
- EAS handles certificates
- Provisioning profiles managed
- No manual portal work

**Manual:**
1. Create certificate in Apple Developer Portal
2. Create provisioning profile
3. Download and configure in EAS

---

## Testing Builds

### Android APK Testing

1. **Download APK** from EAS build page
2. **Transfer to device:**
   ```bash
   adb install pierachat.apk
   ```
3. **Or scan QR code** from EAS build page
4. **Enable "Unknown sources"** in Android settings
5. **Install and test**

### iOS TestFlight Testing

1. **Submit build** to TestFlight
2. **Wait for processing** (10-30 minutes)
3. **Add internal testers:**
   - App Store Connect > TestFlight
   - Add testers by email
4. **Testers receive email**
5. **Install via TestFlight app**
6. **Collect feedback**

---

## Publishing to Stores

### Google Play Store

**Requirements:**
- Google Play Developer account ($25 one-time)
- App signed with release keystore
- Privacy policy URL
- Content rating completed
- Store listing (screenshots, description)

**Steps:**
1. **Create app** in Google Play Console
2. **Complete store listing:**
   - App name: PieraChat
   - Short description: "Secure end-to-end encrypted chat"
   - Full description: [See README.md]
   - Screenshots: 2-8 images (1080x1920px)
   - Icon: 512x512px
3. **Upload AAB:**
   ```bash
   eas build --platform android --profile production
   eas submit --platform android
   ```
4. **Set pricing:** Free
5. **Content rating questionnaire**
6. **Privacy policy:** Required
7. **Submit for review** (2-7 days)

**Releases:**
- **Internal testing:** Small group
- **Closed testing:** Limited audience
- **Open testing:** Public beta
- **Production:** Full release

### Apple App Store

**Requirements:**
- Apple Developer account ($99/year)
- App Store Connect app configured
- Privacy policy and terms
- Screenshots for all device sizes
- App review guidelines followed

**Steps:**
1. **Create app** in App Store Connect
2. **Configure app:**
   - Name: PieraChat
   - Bundle ID: com.pierachat.app
   - Primary language: Italian
   - Category: Social Networking
3. **Pricing:** Free
4. **Privacy policy URL:** Required
5. **App Information:**
   - Description: [See README.md]
   - Keywords: chat, secure, e2ee, encrypted, messaging
   - Support URL
   - Marketing URL
6. **Media:**
   - Screenshots:
     - iPhone 6.5": 1242x2688px (3 required)
     - iPad Pro 12.9": 2048x2732px (2 required)
   - App preview video (optional)
7. **Build:**
   ```bash
   eas build --platform ios --profile production
   eas submit --platform ios
   ```
8. **App Review Information:**
   - Contact info
   - Demo account (if required)
   - Notes for reviewer
9. **Submit for review** (2-7 days)

---

## Troubleshooting

### Build Failed

**Android:**
```bash
# Clear cache
cd mobile
rm -rf node_modules
npm install

# Try again
eas build --platform android --profile preview --clear-cache
```

**iOS:**
```bash
# Check credentials
eas credentials

# Repair
eas build --platform ios --clear-cache
```

### "Could not find Expo project"

```bash
cd mobile
expo init . --template blank  # Reinitialize
npm install  # Reinstall dependencies
```

### "Keystore error" (Android)

```bash
# Let EAS manage keystore
eas credentials -p android
# Select "Remove keystore" then rebuild
```

### "Provisioning profile error" (iOS)

```bash
# Reset credentials
eas credentials -p ios
# Select "Remove and regenerate"
```

### App Crashes on Launch

**Check logs:**
```bash
# Android
adb logcat | grep PieraChat

# iOS (on Mac)
# Xcode > Devices and Simulators > View Device Logs
```

**Common issues:**
- Missing permissions in app.json
- Server URL misconfigured
- Network unreachable
- Certificate issues (iOS)

---

## Update & Maintenance

### Version Bumping

**Update version:**
```json
// app.json
{
  "expo": {
    "version": "2.0.1",  // User-facing version
    "android": {
      "versionCode": 2    // Increment for each build
    },
    "ios": {
      "buildNumber": "2"  // Increment for each build
    }
  }
}
```

### Publishing Updates (OTA)

**Using Expo Updates:**
```bash
# Publish update without rebuilding
eas update --branch production --message "Bug fixes"
```

- JavaScript/assets updates only
- No native code changes
- Instant delivery to users
- No app store review

**When to rebuild:**
- Native dependency changes
- Permission changes
- app.json changes
- Expo SDK upgrade

---

## Resources

**EAS Build:**
- Docs: https://docs.expo.dev/build/introduction/
- Dashboard: https://expo.dev/accounts/[username]/projects

**App Stores:**
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com

**Support:**
- Expo Forums: https://forums.expo.dev
- Discord: https://chat.expo.dev

---

## Build Checklist

**Before building:**
- [ ] Update version numbers
- [ ] Update server URLs for production
- [ ] Test locally on emulator/simulator
- [ ] Test on physical device
- [ ] Verify all permissions in app.json
- [ ] Check icon and splash screen
- [ ] Review app description and metadata

**After building:**
- [ ] Download and test APK/IPA
- [ ] Submit to TestFlight/Internal Testing
- [ ] Gather beta tester feedback
- [ ] Fix critical bugs
- [ ] Prepare store listing
- [ ] Submit for app store review

---

Made with ❤️ by PieraChat Team
