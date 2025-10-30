import Constants from "expo-constants";

type Extra = {
  EXPO_PUBLIC_API_URL?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  API_URL: extra.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_API_URL ?? "https://api.example.com"
};

// config/env.ts
export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.5:3000/graphql", // your Nest GraphQL endpoint
  FIREBASE: {
    apiKey: process.env.EXPO_PUBLIC_FB_API_KEY!,
    authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN!,
    projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID!,
    storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET!,
    messagingSenderId: process.env.EXPO_PUBLIC_FB_MESSAGING_SENDER_ID!,
    appId: process.env.EXPO_PUBLIC_FB_APP_ID!,
  },
};
