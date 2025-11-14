// features/phone/components/CallFollowUpModal.tsx
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { logCallInteraction } from "../../leads/services/interactions.service";

export type LeadSummary = { id: string; name?: string; phone?: string } | null;

export interface CallFollowUpModalProps {
  visible: boolean;
  durationSeconds: number;
  lead: LeadSummary;
  onClose: () => void;
}

export default function CallFollowUpModal({
  visible,
  durationSeconds,
  lead,
  onClose,
}: CallFollowUpModalProps) {
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await logCallInteraction({
        leadId: lead?.id,
        phone: lead?.phone ?? "",
        durationSeconds: Math.max(1, Math.round(durationSeconds || 0)),
        notes,
        nextAction,
      });
      onClose();
      setNotes("");
      setNextAction("");
    } catch (err) {
      console.error("logCallInteraction failed", err);
      Alert.alert("Call Follow-up", "Failed to save follow-up. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const leadLine = lead?.name || lead?.phone ? `${lead?.name ?? ""}${lead?.name && lead?.phone ? " • " : ""}${lead?.phone ?? ""}` : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { /* blocking via BackHandler in screen */ }}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Call Follow-up</Text>
          {leadLine ? <Text style={styles.subtitle}>{leadLine}</Text> : null}
          <Text style={styles.duration}>Call duration: {Math.max(1, Math.round(durationSeconds || 0))} sec</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Notes / Summary</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add context, commitments, objections, etc."
              placeholderTextColor="#94A3B8"
              multiline
              style={[styles.input, styles.multiline]}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Next action</Text>
            <TextInput
              value={nextAction}
              onChangeText={setNextAction}
              placeholder="e.g., Follow up on 18 Nov, send WhatsApp"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryBtn,
              saving ? { opacity: 0.6 } : undefined,
              pressed ? { opacity: 0.9 } : undefined,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>{saving ? "Saving..." : "Save & Continue"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#334155",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  subtitle: {
    marginTop: 4,
    color: "#CBD5E1",
  },
  duration: {
    marginTop: 8,
    color: "#CBD5E1",
  },
  field: {
    marginTop: 14,
  },
  label: {
    marginBottom: 6,
    color: "#CBD5E1",
  },
  input: {
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#F8FAFC",
    backgroundColor: "#0B1220",
  },
  multiline: {
    height: 96,
    textAlignVertical: "top",
  },
  primaryBtn: {
    marginTop: 18,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
