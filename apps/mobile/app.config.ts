import type { ConfigContext, ExpoConfig } from "expo/config";

function requireApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_API_URL missing. Add it to apps/mobile/.env.development or .env.production.",
    );
  }
  return url.replace(/\/$/, "");
}

function resolveAppEnv(): "development" | "production" {
  if (process.env.APP_ENV === "production") return "production";
  if (process.env.APP_ENV === "development") return "development";
  const profile = process.env.EAS_BUILD_PROFILE;
  if (profile === "preview" || profile === "production") return "production";
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = resolveAppEnv();
  const apiUrl = requireApiUrl();

  return {
    ...config,
    name: "PadosiPro",
    slug: "padosipro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "padosipro",
    userInterfaceStyle: "light",
    newArchEnabled: false,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FAFAF7",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.padosipro.test",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundColor: "#155C49",
      },
      package: "com.padosipro.test",
      usesCleartextTraffic: true,
      softwareKeyboardLayoutMode: "resize",
    } as ExpoConfig["android"],
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          resizeMode: "contain",
          backgroundColor: "#FAFAF7",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appEnv,
      apiUrl,
      eas: {
        projectId: "f0d54d65-2cc0-4d3f-8e6f-159093dca58a",
      },
    },
    owner: "deveshmaurya",
  };
};
