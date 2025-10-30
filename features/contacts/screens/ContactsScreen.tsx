import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTheme } from "@/core/theme/ThemeProvider";
import { useContacts } from "@/features/contacts/hooks/useContacts";
import { ContactList } from "@/features/contacts/components/ContactList";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export const ContactsScreen = () => {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { contacts, loading, error, refetch } = useContacts();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
        <Text tone="muted">Syncing CRM contacts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load CRM contacts" description={error}>
        <Button label="Try again" onPress={refetch} />
      </EmptyState>
    );
  }

  if (contacts.length === 0) {
    return (
      <EmptyState
        title="No contacts yet"
        description="Add contacts in your CRM to show them across the app."
      >
        <Button label="Refresh" onPress={refetch} />
      </EmptyState>
    );
  }

  return <ContactList contacts={contacts} />;
};

const makeStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.background
    }
  });
