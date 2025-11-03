import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { toast } from "@/components/feedback/Toast";
import { Field } from "@/components/ui/Field";
import { LoginButton } from "@/components/ui/LoginButton";
import { Text } from "@/components/ui/Text";
import { useTheme } from "@/core/theme/ThemeProvider";
import { useAuthStore } from "@/features/auth/store/auth.store";

const DEMO_EMAIL = "bharath@ipkwealth.com";
const DEMO_PASSWORD = "Ipk@2025";

export const SignInScreen = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width >= 840;

  const passwordRef = useRef<TextInput>(null);
  const { signIn, signingIn, error, hydrateUserFromGraphQL } = useAuthStore();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [fetchingAfterLogin, setFetchingAfterLogin] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password) {
      toast("Enter email and password");
      return;
    }
    try {
      const success = await signIn({ email: email.trim(), password });
      if (!success) {
        toast("Incorrect email or password");
        return;
      }
      setFetchingAfterLogin(true);
      await hydrateUserFromGraphQL();
      toast("Signed in successfully");
      router.replace("/(tabs)");
    } catch (err) {
      console.error("SignIn error:", err);
      toast("Something went wrong");
    } finally {
      setFetchingAfterLogin(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 64}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, isTablet && styles.scrollWide]}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Text style={styles.wordmark}>IPKwealth</Text>
            <Text size="xl" weight="bold" style={styles.title}>
              Sign In
            </Text>
            <Text tone="muted" style={styles.subtitle}>
              Access your IPK Wealth CRM from anywhere and follow up with leads
              instantly.
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Work email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Field
              ref={passwordRef}
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              blurOnSubmit={true}
              error={error}
            />

            <LoginButton
              label="Login"
              onPress={handleSubmit}
              loading={signingIn || fetchingAfterLogin}
              loadingText="Please wait…"
              style={styles.cta}
            />

            <Text tone="muted" size="sm" style={styles.hint}>
              Demo account — email: ipktest@ipkwealth.com | password: Ipk@2025
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: ReturnType<typeof useTheme>) => {
  const s = theme.spacing ?? { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
  const r = theme.radii ?? { sm: 8, md: 12, lg: 16 };
  // Let LoginButton control its blue color and border; keep only position/margins here.

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: s.lg,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      gap: s.xl,
    },
    scrollWide: {
      alignItems: "stretch",
    },
    hero: {
      alignItems: "center",
      gap: s.md,
    },
    wordmark: {
      fontSize: 42,
      fontWeight: "900",
      letterSpacing: 1.2,
      color: theme.colors.text,
    },
    title: {
      letterSpacing: 0.5,
    },
    subtitle: {
      textAlign: "center",
      paddingHorizontal: s.md,
    },
    form: {
      gap: s.md,
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: r.lg,
      padding: s.lg,
    },
    cta: {
      alignSelf: "center",
      marginTop: s.md,
    },
    hint: {
      textAlign: "center",
      marginTop: s.sm,
    },
  });
};

