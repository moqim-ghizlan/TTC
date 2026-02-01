# TTC Mobile

React Native mobile application for TTC (Take This Code) - a real-time code sharing platform.

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Studio

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure API endpoint:
Edit `src/services/api.ts` and update `API_BASE_URL` to point to your backend server.

### Running the App

Start the development server:
```bash
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

## Features

- Generate or enter custom session keys
- Real-time code editing
- Automatic language detection
- Copy and share code
- Dark theme optimized for mobile

## Tech Stack

- React Native
- Expo
- TypeScript
- React Navigation
- Axios
