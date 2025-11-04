import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/core/theme/ThemeProvider";
import type { ReceivedCall } from "@/features/phone/hooks/usePhoneCall";
import type { StageKey } from "@/features/leads/screens/type";

type Props = {
  visible: boolean;
  onClose: () => void;
  phoneNumber?: string | null;
  recentCalls?: ReceivedCall[];
  onSubmit?: (data: {
    nextFollowUpAt?: string | null;
    clientStatus?: string | null;
    stage?: StageKey | null;
    notes?: string | null;
  }) => Promise<void> | void;
};

const STAGES: StageKey[] = [
  "NEW_LEAD",
  "FIRST_TALK_DONE",
  "CLIENT_INTERESTED",
  "FOLLOWING_UP",
  "ACCOUNT_OPENED",
  "HIBERNATED",
  "NO_RESPONSE_DORMANT",
  "NOT_INTERESTED_DORMANT",
  "RISKY_CLIENT_DORMANT",
];

export function CallFollowUpModal({
  visible,
  onClose,
  phoneNumber,
  recentCalls = [],
  onSubmit,
}: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [clientStatus, setClientStatus] = useState("");
  const [stage, setStage] = useState<StageKey | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return !!(clientStatus || notes || nextFollowUpAt || stage);
  }, [clientStatus, notes, nextFollowUpAt, stage]);

  const handleSubmit = async () => {
    if (!canSubmit) return onClose();
    try {
      setSubmitting(true);
      await onSubmit?.({
        nextFollowUpAt: nextFollowUpAt || null,
        clientStatus: clientStatus || null,
        stage: stage ?? null,
        notes: notes || null,
      });
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />
        <Card style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text size="lg" weight="bold">Call Follow-up</Text>
                {phoneNumber ? (
                  <Text size="sm" tone="muted">For {phoneNumber}</Text>
                ) : null}
              </View>
              <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button">
                <MaterialIcons name="close" size={22} color={theme.colors.muted} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <Field
                label="Next follow-up (YYYY-MM-DD HH:mm)"
                placeholder="2025-11-03 16:30"
                value={nextFollowUpAt}
                onChangeText={setNextFollowUpAt}
                keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
              />

              <Field
                label="Client status"
                placeholder="e.g. Interested / No response / Not interested"
                value={clientStatus}
                onChangeText={setClientStatus}
              />

              <View style={{ gap: theme.spacing.xs }}>
                <Text size="sm" tone="muted">Client stage</Text>
                <View style={styles.stageGrid}>
                  {STAGES.map((s) => {
                    const active = stage === s;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setStage(active ? null : s)}
                        style={[styles.stagePill, active && styles.stagePillActive]}
                        accessibilityRole="button"
                      >
                        <Text size="sm" style={active ? styles.stageLabelActive : undefined}>{s.replaceAll("_", " ")}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Field
                label="Notes"
                placeholder="Type important notes from the call"
                value={notes}
                onChangeText={setNotes}
                multiline
                style={{ height: 96, textAlignVertical: "top" }}
              />
            </View>

            <View style={styles.section}>
              <Text weight="semibold">Recent calls</Text>
              {Platform.OS === "android" ? (
                <View style={{ gap: 6 }}>
                  {recentCalls.length === 0 ? (
                    <Text size="sm" tone="muted">No call log available</Text>
                  ) : (
                    recentCalls.map((c, idx) => (
                      <View key={idx} style={styles.logRow}>
                        <MaterialIcons
                          name={c.type === "INCOMING" ? "call-received" : c.type === "OUTGOING" ? "call-made" : "call-missed"}
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text size="sm" style={{ flex: 1 }}>
                          {c.type ?? "UNKNOWN"} · {c.dateTime ? new Date(c.dateTime).toLocaleString() : ""}
                        </Text>
                        {typeof c.duration === "number" ? (
                          <Text size="sm" tone="muted">{c.duration}s</Text>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              ) : (
                <Text size="sm" tone="muted">iOS does not allow reading the system call log.</Text>
              )}
            </View>

            <View style={styles.actions}>
              <Button label="Save follow-up" onPress={handleSubmit} loading={submitting} disabled={!canSubmit && !submitting} />
            </View>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(16, 24, 40, 0.45)",
      padding: theme.spacing.lg,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      width: "100%",
      maxWidth: 520,
      padding: 0,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.lg,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    headerText: {
      flex: 1,
      gap: 4,
    },
    closeButton: {
      height: 36,
      width: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background,
    },
    form: {
      gap: theme.spacing.md,
    },
    stageGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    stagePill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    stagePillActive: {
      backgroundColor: "rgba(70,95,255,0.12)",
      borderColor: theme.colors.primary,
    },
    stageLabelActive: {
      color: theme.colors.primary,
      fontWeight: "600",
    },
    section: {
      gap: 8,
    },
    logRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
    },
    actions: {
      alignItems: "flex-end",
    },
  });

