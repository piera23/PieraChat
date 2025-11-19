# 🏗️ PieraChat Build Instructions

**Complete guide to building PieraChat for all platforms**

---

## Quick Build Commands

### All Platforms

**Windows:**
```powershell
.\build-all.ps1 -All
```

**Linux/macOS:**
```bash
./build-all.sh --all
```

### Individual Components

**Backend only:**
```bash
# Windows
.\build-all.ps1 -Backend

# Linux/macOS
./build-all.sh --backend
```

**Frontend only:**
```bash
# Windows
.\build-all.ps1 -Frontend

# Linux/macOS
./build-all.sh --frontend
```

**Mobile:**
```bash
cd mobile
eas build --platform android --profile preview  # APK
eas build --platform ios --profile production   # IPA
```

---

## Build Outputs

### Backend

**Location:** `builds/PieraChat-Backend-{arch}-v2.0.0.{zip|tar.gz}`

**Architectures:**
- `win-x64` - Windows 64-bit
- `win-x86` - Windows 32-bit
- `win-arm64` - Windows ARM64
- `linux-x64` - Linux 64-bit
- `linux-arm64` - Linux ARM64
- `osx-x64` - macOS Intel
- `osx-arm64` - macOS Apple Silicon

**Contents:**
- `PieraServer` (or `PieraServer.exe` on Windows)
- All dependencies bundled
- Ready to run, no .NET SDK needed

**Size:** ~70-90 MB

### Frontend

**Location:** `builds/PieraChat-Frontend-v2.0.0.{zip|tar.gz}`

**Contents:**
- `index.html` - Main HTML file
- `assets/` - JavaScript, CSS, images
- All files optimized and minified

**Size:** ~200 KB

**Deployment:**
- Extract to web server root
- Serve with Nginx, Apache, or any static host
- Works with Vercel, Netlify, Cloudflare Pages

### Mobile

**Android APK:** `PieraChat-v2.0.0.apk` (~50 MB)
- Direct install on Android devices
- For testing/internal distribution
- Download from EAS build page

**Android AAB:** `PieraChat-v2.0.0.aab` (~30 MB)
- Google Play Store format
- Smaller download for users
- Required for Play Store

**iOS IPA:** `PieraChat-v2.0.0.ipa` (~40 MB)
- TestFlight distribution
- App Store submission
- Requires Mac + Xcode to build

---

## Build Requirements

### Backend

- **.NET 8 SDK** (for building)
- **.NET 8 Runtime** (for running)
- No other dependencies

### Frontend

- **Node.js 18+**
- **npm** (included with Node.js)

### Mobile

- **Node.js 18+**
- **Expo CLI & EAS CLI**
- **For iOS**: Mac, Xcode 14+, Apple Developer Account
- **For Android**: No special requirements

---

## Detailed Build Instructions

### Backend Build Options

**Self-contained:**
```bash
# Includes .NET runtime, ~70MB
dotnet publish -c Release -r linux-x64 --self-contained true -p:PublishSingleFile=true
```

**Framework-dependent:**
```bash
# Requires .NET runtime on server, ~10MB
dotnet publish -c Release -r linux-x64 --self-contained false
```

**Single file:**
```bash
# All in one executable
dotnet publish -c Release -r linux-x64 -p:PublishSingleFile=true
```

### Frontend Build Options

**Production:**
```bash
npm run build
# Output: dist/ (~200KB)
```

**Development:**
```bash
npm run dev
# Hot reload at http://localhost:3000
```

**Preview production:**
```bash
npm run preview
# Test production build locally
```

### Mobile Build Profiles

**Development:**
```bash
eas build --profile development
# Development client for debugging
```

**Preview:**
```bash
eas build --profile preview --platform android
# APK for internal testing
```

**Production:**
```bash
eas build --profile production --platform android
# AAB for Google Play Store

eas build --profile production --platform ios
# IPA for App Store
```

---

## Docker Build

**Build image:**
```bash
docker build -t pierachat-backend ./backend/PieraServer
```

**Run container:**
```bash
docker run -d -p 8080:8080 --name pierachat pierachat-backend
```

**Using docker-compose:**
```bash
docker-compose up -d
```

---

## Clean Build

**Remove all build artifacts:**

**Windows:**
```powershell
.\build-all.ps1 -All -Clean
```

**Linux/macOS:**
```bash
./build-all.sh --all --clean
```

**Manual cleanup:**
```bash
# Backend
rm -rf backend/PieraServer/bin backend/PieraServer/obj backend/PieraServer/publish

# Frontend
rm -rf frontend/dist frontend/node_modules

# Mobile
rm -rf mobile/node_modules

# Build artifacts
rm -rf builds/
```

---

## Build for Different Architectures

### Windows

**64-bit (most common):**
```powershell
.\build-all.ps1 -Backend -Architecture win-x64
```

**32-bit:**
```powershell
.\build-all.ps1 -Backend -Architecture win-x86
```

**ARM64 (Surface Pro X, etc.):**
```powershell
.\build-all.ps1 -Backend -Architecture win-arm64
```

### Linux

**x64 (Intel/AMD):**
```bash
./build-all.sh --backend --arch linux-x64
```

**ARM64 (Raspberry Pi 4, etc.):**
```bash
./build-all.sh --backend --arch linux-arm64
```

### macOS

**Intel:**
```bash
./build-all.sh --backend --arch osx-x64
```

**Apple Silicon (M1/M2):**
```bash
./build-all.sh --backend --arch osx-arm64
```

---

## Testing Builds

### Backend

```bash
# Extract archive
cd builds
tar -xzf PieraChat-Backend-linux-x64-v2.0.0.tar.gz

# Run
./PieraServer

# Test
curl http://localhost:8080
```

### Frontend

```bash
# Extract
cd builds
unzip PieraChat-Frontend-v2.0.0.zip -d frontend

# Serve with Python
cd frontend
python3 -m http.server 8000

# Open http://localhost:8000
```

### Mobile

**Android APK:**
1. Download APK from EAS
2. Transfer to Android device
3. Enable "Unknown sources"
4. Install and test

**iOS IPA:**
1. Submit to TestFlight
2. Install TestFlight app
3. Install build from TestFlight
4. Test

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/build.yml
name: Build PieraChat

on:
  push:
    branches: [ main ]

jobs:
  build-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0'
      - run: ./build-all.sh --backend

  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: ./build-all.sh --frontend
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build

build-backend:
  stage: build
  image: mcr.microsoft.com/dotnet/sdk:8.0
  script:
    - ./build-all.sh --backend
  artifacts:
    paths:
      - builds/

build-frontend:
  stage: build
  image: node:18
  script:
    - ./build-all.sh --frontend
  artifacts:
    paths:
      - builds/
```

---

## Troubleshooting

### Backend Build Fails

**"dotnet command not found"**
- Install .NET 8 SDK
- Add to PATH

**"Platform not supported"**
- Check architecture name
- Use correct RID (Runtime Identifier)

### Frontend Build Fails

**"node command not found"**
- Install Node.js 18+
- Restart terminal

**"Out of memory"**
- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

### Mobile Build Fails

**"EAS Build failed"**
- Check EAS build logs
- Verify eas.json configuration
- Clear cache: `eas build --clear-cache`

**"Could not find Expo project"**
- Run `expo init` in mobile directory
- Reinstall node_modules

---

## Build Size Optimization

### Backend

**Trim unused code:**
```bash
dotnet publish -c Release -p:PublishTrimmed=true -p:PublishSingleFile=true
# Can reduce size by 30-50%
```

### Frontend

**Already optimized with Vite:**
- Code splitting
- Tree shaking
- Minification
- Gzip compression

**Further optimization:**
```javascript
// vite.config.js
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
}
```

### Mobile

**Use Production builds:**
- Hermes engine enabled
- ProGuard/R8 (Android)
- Bitcode (iOS)

---

## Next Steps

After building:

1. **Test locally** - Verify all features work
2. **Deploy to staging** - Test in production-like environment
3. **Deploy to production** - See [DEPLOYMENT.md](DEPLOYMENT.md)
4. **Monitor** - Set up logging and monitoring
5. **Update** - Regular updates and security patches

---

## Resources

- **Installation Guide**: [INSTALLATION.md](INSTALLATION.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Mobile Build Guide**: [mobile/BUILD.md](mobile/BUILD.md)
- **API Documentation**: [docs/API.md](docs/API.md)

---

Made with ❤️ by PieraChat Team
