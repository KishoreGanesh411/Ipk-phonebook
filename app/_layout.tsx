import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import { AppSplash } from "@/components/ui/AppSplash";
import { ThemeProvider } from "@/core/theme/ThemeProvider";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const { isSignedIn } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, [segments]);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn() && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn() && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [segments, ready, router, isSignedIn]);

  return (
    <SafeAreaProvider>
    <ThemeProvider>
      <StatusBar style="auto" />
      {ready ? <Slot /> : <AppSplash />}
    </ThemeProvider>
    </SafeAreaProvider>
  );
}