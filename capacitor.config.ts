import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.forclock.app',
  appName: 'For Clock Pro',
  webDir: 'dist',
  android: {
    // Allow WebView to use camera
    allowMixedContent: true,
  },
  ios: {
    // Allow WebView to use camera
    allowsLinkPreview: false,
  },
  server: {
    // Allow WebView to access navigator.mediaDevices
    androidScheme: 'https',
    iosScheme: 'https'
  }
};

export default config;

