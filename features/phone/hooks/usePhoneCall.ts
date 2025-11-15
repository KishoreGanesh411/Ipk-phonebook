// features/phone/hooks/usePhoneCall.ts
import { useCallStore } from "@/features/phone/store/call.store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  Linking,
  PermissionsAndroid,
  Platform,
} from "react-native";
import CallDetectorManager from "react-native-call-detection";

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

type RawCallEvent =
  | string
  | { state?: string; type?: string; phoneNumber?: string };

const getCallEventState = (event: RawCallEvent | null | undefined): string | null => {
  if (!event) {
    return null;
  }
  if (typeof event === "string") {
    return event;
  }
  return event.state ?? event.type ?? null;
};

const requestCallPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return true;
  }

  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
    PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
  ]);

  const hasPhoneState =
    granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] ===
    PermissionsAndroid.RESULTS.GRANTED;
  const hasCallLog =
    granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] ===
    PermissionsAndroid.RESULTS.GRANTED;

  if (hasPhoneState && hasCallLog) {
    console.log("Call permissions granted");
    return true;
  }

  console.warn("Call permissions denied", granted);
  Alert.alert(
    "Dialer",
    "Call permissions are required to track call progress on Android."
  );
  return false;
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
  const callDetectorRef = useRef<InstanceType<typeof CallDetectorManager> | null>(
    null
  );
  const endCallCallback = useCallStore((state) => state.endCall);
  const startCallRecord = useCallStore((state) => state.startCall);
  const endCallRef = useRef(endCallCallback);

  useEffect(() => {
    isCallingRef.current = isCalling;
  }, [isCalling]);

  useEffect(() => {
    callStartedAtRef.current = callStartedAt;
  }, [callStartedAt]);

  useEffect(() => {
    endCallRef.current = endCallCallback;
  }, [endCallCallback]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const detector = new CallDetectorManager(
      (event) => {
        const callState = getCallEventState(event);
        if (
          callState === "Disconnected" &&
          isCallingRef.current === true &&
          callStartedAtRef.current != null
        ) {
          const seconds = Math.max(
            1,
            Math.round(
              (Date.now() - (callStartedAtRef.current as number)) / 1000
            )
          );
          setCallDurationSeconds(seconds);
          setIsCalling(false);
          setIsFollowUpOpen(true);
          setCallStartedAt(null);
          endCallRef.current?.();
        }
      },
      false,
      (reason) => {
        console.warn("Call detection permission denied", reason);
      }
    );

    callDetectorRef.current = detector;

    return () => {
      callDetectorRef.current?.dispose();
      callDetectorRef.current = null;
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

      const permissionsGranted = await requestCallPermissions();
      if (!permissionsGranted) {
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
        startCallRecord(sourceNumber);

        await Linking.openURL(url);
      } catch (err) {
        console.error("Failed to open dialer", err);
        setIsCalling(false);
        setCallStartedAt(null);
        Alert.alert("Dialer", "Failed to open the phone app.");
      }
    },
    [phoneNumber, startCallRecord]
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
