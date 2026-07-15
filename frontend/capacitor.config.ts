import type { CapacitorConfig } from "@capacitor/cli";

const productionUrl = process.env.CAPACITOR_REMOTE_URL || "http://159.75.139.2";
const productionHost = new URL(productionUrl).hostname;

const config: CapacitorConfig = {
  appId: "com.smarteldercare.medical",
  appName: "智慧医养",
  webDir: "dist",
  server: {
    url: productionUrl,
    cleartext: true,
    allowNavigation: Array.from(new Set([productionHost, "159.75.139.2", "10.0.2.2"])),
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#f7fbfc",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2600,
      launchAutoHide: true,
      backgroundColor: "#f7fbfc",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#f7fbfc",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "native",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
