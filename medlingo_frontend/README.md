# Evara Health Translator

A React Native application for medical translation services, featuring audio capture and transcription capabilities.

## Features

- **Login Screen**: Secure authentication with email and password
- **Language Selection**: Choose languages for both doctor and patient communication
- **Audio Capture & Transcription**: Record and transcribe conversations with conversation history
- **Responsive Design**: Background images positioned to left and right of content boxes
- **Modern UI**: Glass morphism design with consistent theming

## Screens

1. **Login Screen**: User authentication
2. **Language Selection**: Dropdown selection for doctor and patient languages
3. **Audio Capture**: Side-by-side recording interface with transcription areas

## Technical Stack

- React Native with Expo
- TypeScript
- Custom theme system (colors, spacing, typography)
- Reusable components (Button, Input)
- Responsive layout with background image positioning

## Project Structure

```
src/
├── components/
│   ├── App.tsx              # Main navigation component
│   ├── LoginScreen.tsx      # Login interface
│   ├── LanguageSelectionScreen.tsx  # Language selection
│   ├── AudioCaptureScreen.tsx       # Audio recording
│   ├── Button.tsx           # Reusable button component
│   ├── Input.tsx            # Reusable input component
│   └── index.ts             # Component exports
├── theme/
│   ├── colors.ts            # Color palette
│   ├── spacing.ts           # Spacing and border radius
│   ├── typography.ts        # Font sizes and weights
│   └── index.ts             # Theme exports
└── assets/
    └── images/
        └── background-image.webp  # Background image
```

## Getting Started

> **Quick Setup Checklist**: See [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for a step-by-step checklist when setting up on a new system.

### Prerequisites

Before setting up the app, ensure you have the following installed:

#### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)

#### For Mobile Development
- **Expo CLI** (installed globally): `npm install -g expo-cli`
- **Expo Go app** (for testing on physical devices):
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

#### For iOS Development (macOS only)
- **Xcode** (latest version) - [Download from App Store](https://apps.apple.com/us/app/xcode/id497799835)
- **CocoaPods**: `sudo gem install cocoapods`
- **iOS Simulator** (comes with Xcode)

#### For Android Development
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** (installed via Android Studio)
- **Java Development Kit (JDK)** 11 or higher
- **Android Emulator** (set up via Android Studio)

#### Backend Requirements
- **Backend API Gateway** running on `http://localhost:8000` (see Backend Setup section)
- **PostgreSQL** (optional, if using database features)

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd MedLingoTranslator
```

#### 2. Install Dependencies

```bash
npm install
```

If you encounter issues, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 3. Environment Configuration

Create a `.env` file in the root directory (copy from `env.example`):

```bash
cp env.example .env
```

Edit `.env` and configure the following variables:

```env
# API Configuration
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
EXPO_PUBLIC_API_KEY=your-api-key-here

# Backend Gateway URL (for audio processing)
# Update this in src/api/audioApi.ts if different from localhost:8000
GATEWAY_BASE_URL=http://localhost:8000

# Development
NODE_ENV=development
```

**Note**: The audio API gateway URL is currently hardcoded in `src/api/audioApi.ts` as `http://localhost:8000`. Update this if your backend runs on a different URL.

#### 4. iOS Setup (macOS only)

If you plan to run on iOS:

```bash
cd ios
pod install
cd ..
```

**Note**: If you encounter CocoaPods issues:
```bash
sudo gem install cocoapods
pod repo update
cd ios && pod install && cd ..
```

#### 5. Android Setup

If you plan to run on Android:

1. Open Android Studio
2. Install Android SDK (API level 33 or higher)
3. Set up an Android Virtual Device (AVD) or connect a physical device
4. Enable USB debugging on physical devices

#### 6. Start the Development Server

```bash
npm start
```

This will:
- Start the Expo development server
- Open Expo DevTools in your browser
- Display a QR code for testing on physical devices

#### 7. Run on Your Preferred Platform

**Web:**
```bash
npm run web
# or press 'w' in the Expo CLI
```

**iOS Simulator (macOS only):**
```bash
npm run ios
# or press 'i' in the Expo CLI
```

**Android Emulator/Device:**
```bash
npm run android
# or press 'a' in the Expo CLI
```

**Physical Device:**
1. Install Expo Go app on your device
2. Scan the QR code displayed in the terminal/browser
3. The app will load on your device

### Backend Setup

The app requires a backend API gateway for audio processing. The backend should be running on `http://localhost:8000` by default.

#### Backend API Requirements

The backend must implement the following endpoint:

**POST `/v1/audio/process`**
- Accepts multipart/form-data with:
  - `payload`: JSON string containing `{ session_id, source_lang, target_lang }`
  - `file`: Audio file (m4a format)
- Returns JSON:
  ```json
  {
    "transcript": "transcribed text",
    "translated_text": "translated text",
    "audio_url": "url to audio file",
    "audio_b64": "base64 encoded audio",
    "mime": "audio/wav"
  }
  ```

#### Setting Up Backend (Example)

See `backend-example/` directory for example implementations:
- `auth-endpoints.js` - Authentication endpoints example
- `README.md` - Database schema and API documentation

**Quick Backend Setup:**
1. Set up your backend server (Node.js, Python, Go, etc.)
2. Implement the `/v1/audio/process` endpoint
3. Ensure CORS is configured to allow requests from Expo
4. Start the backend server on port 8000 (or update `src/api/audioApi.ts`)

### Platform-Specific Notes

#### iOS
- Requires macOS and Xcode for building
- Physical devices need to be registered in Apple Developer account (for production)
- Simulator works without registration
- Microphone permissions must be granted in iOS Settings

#### Android
- Works on Windows, macOS, and Linux
- Physical devices need USB debugging enabled
- Emulator works out of the box
- Microphone permissions are requested at runtime

#### Web
- Limited audio recording capabilities (browser-dependent)
- Some features may not work on web (use mobile platforms for full functionality)
- CORS must be properly configured on backend

### Verifying Installation

1. **Check Node.js version:**
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **Check Expo CLI:**
   ```bash
   expo --version
   ```

3. **Verify dependencies:**
   ```bash
   npm list --depth=0
   ```

4. **Test the app:**
   - Start the dev server: `npm start`
   - Open on web: Press `w`
   - Check for any error messages in the console

### Common Setup Issues

#### Issue: "EMFILE: too many open files" (macOS)
**Solution:**
```bash
ulimit -n 65536
npx expo start --clear
```

#### Issue: Metro bundler cache issues
**Solution:**
```bash
npx expo start --clear
# or
rm -rf .expo node_modules
npm install
```

#### Issue: iOS build fails
**Solution:**
```bash
cd ios
pod deintegrate
pod install
cd ..
npx expo run:ios
```

#### Issue: Android build fails
**Solution:**
- Ensure Android SDK is properly installed
- Check `ANDROID_HOME` environment variable
- Clean and rebuild:
  ```bash
  cd android
  ./gradlew clean
  cd ..
  npx expo run:android
  ```

#### Issue: Backend connection errors
**Solution:**
- Verify backend is running on `http://localhost:8000`
- Check CORS settings on backend
- Update `GATEWAY_BASE_URL` in `src/api/audioApi.ts` if needed
- For physical devices, use your computer's IP address instead of `localhost`

#### Issue: Audio recording not working
**Solution:**
- **iOS**: Check microphone permissions in Settings > Privacy > Microphone
- **Android**: Grant microphone permission when prompted
- **Web**: Use Chrome/Edge (better audio support than Safari)

### Development Workflow

1. **Start backend server** (if using local backend)
2. **Start Expo dev server**: `npm start`
3. **Open app** on your preferred platform
4. **Make code changes** - app will hot reload automatically
5. **Check logs** in terminal and browser DevTools

### Production Build

For production builds, see Expo documentation:
- [iOS Build Guide](https://docs.expo.dev/build/introduction/)
- [Android Build Guide](https://docs.expo.dev/build/introduction/)

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Design Features

- **Background Image Layout**: Background images are positioned to the left and right of content boxes, creating a centered content area
- **Glass Morphism**: Semi-transparent cards with subtle shadows
- **Responsive Design**: Adapts to different screen sizes
- **Consistent Theming**: Unified color palette, spacing, and typography

## Audio Capture Features

- **Recording Interface**: Start/Stop recording buttons for both doctor and patient
- **Transcription Areas**: Text input areas for displaying transcribed content
- **Conversation History**: Scrollable history of all recorded conversations
- **Real-time Feedback**: Visual indicators during recording

## Language Support

The application supports multiple languages including:
- English, Spanish, French, German, Italian, Portuguese
- Russian, Japanese, Korean, Chinese, Arabic, Hindi

## Development

The project uses a component-based architecture with:
- Reusable UI components
- Centralized theme system
- TypeScript for type safety
- Responsive design patterns

## Troubleshooting

If you encounter the "EMFILE: too many open files" error on macOS:
1. Increase file descriptor limit: `ulimit -n 65536`
2. Clear Expo cache: `npx expo start --clear`
3. Try different ports: `npx expo start --port 3000`
