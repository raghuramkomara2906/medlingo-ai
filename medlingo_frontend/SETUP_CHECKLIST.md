# Setup Checklist

Use this checklist when setting up the app on a new system.

## Pre-Installation

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm or yarn installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] Repository cloned to local machine

## Installation

- [ ] Run `npm install` successfully
- [ ] Create `.env` file from `env.example`
- [ ] Configure environment variables in `.env`

## Platform-Specific Setup

### iOS (macOS only)
- [ ] Xcode installed and updated
- [ ] CocoaPods installed (`pod --version`)
- [ ] Run `cd ios && pod install && cd ..`
- [ ] iOS Simulator available (or physical device connected)

### Android
- [ ] Android Studio installed
- [ ] Android SDK installed (API 33+)
- [ ] Android Emulator set up OR physical device with USB debugging enabled
- [ ] `ANDROID_HOME` environment variable set (if needed)

### Web
- [ ] Modern browser installed (Chrome, Edge, or Firefox recommended)

## Backend Setup

- [ ] Backend API gateway server set up
- [ ] Backend running on `http://localhost:8000` (or update `src/api/audioApi.ts`)
- [ ] Backend implements `/v1/audio/process` endpoint
- [ ] CORS configured on backend for Expo requests

## Verification

- [ ] Run `npm start` - Expo dev server starts
- [ ] No errors in terminal
- [ ] App loads on web (`npm run web` or press 'w')
- [ ] App loads on iOS simulator (`npm run ios` or press 'i') - macOS only
- [ ] App loads on Android emulator (`npm run android` or press 'a')
- [ ] Login screen displays correctly
- [ ] Audio recording permissions work (test on device)

## Troubleshooting

If something doesn't work:
- [ ] Clear Expo cache: `npx expo start --clear`
- [ ] Reinstall dependencies: `rm -rf node_modules && npm install`
- [ ] Check backend is running and accessible
- [ ] Verify environment variables are set correctly
- [ ] Check platform-specific requirements above

## Quick Start Commands

```bash
# Install dependencies
npm install

# iOS setup (macOS only)
cd ios && pod install && cd ..

# Start development server
npm start

# Run on specific platform
npm run web      # Web browser
npm run ios      # iOS Simulator (macOS)
npm run android  # Android Emulator/Device
```

## Environment Variables Reference

Required in `.env`:
- `EXPO_PUBLIC_API_BASE_URL` - Backend API base URL
- `EXPO_PUBLIC_API_KEY` - API key for backend
- `GATEWAY_BASE_URL` - Audio processing gateway URL (or update `src/api/audioApi.ts`)

Optional:
- `NODE_ENV` - Set to `development` or `production`



