import Constants from "expo-constants";
import { Platform } from "react-native";

type Extra = {
  EXPO_PUBLIC_API_URL?: string; // legacy
  EXPO_PUBLIC_GRAPHQL_URL?: string; // preferred
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  API_URL:
    extra.EXPO_PUBLIC_API_URL ??
    process.env.EXPO_PUBLIC_API_URL ??
    "https://api.example.com",
};

// Consolidated config
function deriveLocalGraphqlUrl(): string {
  // Prefer Android emulator loopback when host is localhost
  if (Platform.OS === "android") {
    const host = Constants.expoConfig?.hostUri ?? "";
    if (/localhost|127\.0\.0\.1/.test(host)) {
      return "http://10.0.2.2:3333/graphql";
    }
  }
  // Try to use the LAN IP from Expo host URI
  const hostUri = (Constants.expoConfig?.hostUri || "").split(":")[0];
  if (hostUri && /\d+\.\d+\.\d+\.\d+/.test(hostUri)) {
    return `http://${hostUri}:3333/graphql`;
  }
  // Fallbacks
  if (Platform.OS === "android") return "http://192.168.0.130:3333/graphql";
  return "http://localhost:3333/graphql";
}

export const ENV = {
  // GraphQL endpoint (NestJS)
  GRAPHQL_URL:
    extra.EXPO_PUBLIC_GRAPHQL_URL ??
    process.env.EXPO_PUBLIC_GRAPHQL_URL ??
    env.API_URL ??
    deriveLocalGraphqlUrl(),
  FIREBASE: {
    apiKey: process.env.EXPO_PUBLIC_FB_API_KEY!,
    authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN!,
    projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID!,
    storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET!,
    messagingSenderId: process.env.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID!,
    appId: process.env.EXPO_PUBLIC_FB_APP_ID!,
  },
};
