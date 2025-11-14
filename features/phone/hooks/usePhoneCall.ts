// features/phone/hooks/usePhoneCall.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus, Linking } from "react-native";

export type ActiveLead = { id: string; name?: string; phone?: string } | null;

export interface UsePhoneCallReturn {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;

  isCalling: boolean;
  isFollowUpOpen: boolean;
  callDurationSeconds: number | null;
  activeLead: ActiveLead;

  startCall: (opts?: {
    leadId?: string;
    leadName?: string;
    phone?: string;
  }) => Promise<void>;
  closeFollowUp: () => void;
}

const normalizePhone = (raw: string): string => {
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) {
    return "+" + cleaned.slice(1).replace(/\+/g, "");
  }
  return cleaned.replace(/\+/g, "");
};

export function usePhoneCall(): UsePhoneCallReturn {
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState<boolean>(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callDurationSeconds, setCallDurationSeconds] = useState<number | null>(
    null
  );
  const [activeLead, setActiveLead] = useState<ActiveLead>(null);

  // Refs to avoid stale closures in AppState handler
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isCallingRef = useRef<boolean>(isCalling);
  const callStartedAtRef = useRef<number | null>(callStartedAt);

  useEffect(() => {
    isCallingRef.current = isCalling;
  }, [isCalling]);

  useEffect(() => {
    callStartedAtRef.current = callStartedAt;
  }, [callStartedAt]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      const wasBackground = prev === "background" || prev === "inactive";
      if (
        wasBackground &&
        next === "active" &&
        isCallingRef.current === true &&
        callStartedAtRef.current != null
      ) {
        const seconds = Math.max(
          1,
          Math.round((Date.now() - (callStartedAtRef.current as number)) / 1000)
        );
        setCallDurationSeconds(seconds);
        setIsCalling(false);
        setIsFollowUpOpen(true);
      }
    });

    return () => {
      sub.remove();
    };
  }, []);

  const startCall = useCallback<UsePhoneCallReturn["startCall"]>(
    async (opts) => {
      const sourceNumber = opts?.phone ?? phoneNumber;
      const normalized = normalizePhone(sourceNumber);

      if (!normalized) {
        Alert.alert("Dialer", "Enter a phone number first");
        return;
      }

      if (opts?.leadId) {
        setActiveLead({
          id: String(opts.leadId),
          name: opts.leadName,
          phone: opts.phone ?? sourceNumber,
        });
      } else {
        setActiveLead(null);
      }

      const url = `tel:${normalized}`;
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          Alert.alert("Dialer", "This device cannot place phone calls.");
          return;
        }

        setIsCalling(true);
        setCallStartedAt(Date.now());
        setCallDurationSeconds(null);

        await Linking.openURL(url);
      } catch (err) {
        console.error("Failed to open dialer", err);
        setIsCalling(false);
        setCallStartedAt(null);
        Alert.alert("Dialer", "Failed to open the phone app.");
      }
    },
    [phoneNumber]
  );

  const closeFollowUp = useCallback(() => {
    setIsFollowUpOpen(false);
    setCallDurationSeconds(null);
  }, []);

  return {
    phoneNumber,
    setPhoneNumber,
    isCalling,
    isFollowUpOpen,
    callDurationSeconds,
    activeLead,
    startCall,
    closeFollowUp,
  };
}
