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

  try {
    // Check current permission status first
    const phoneStateStatus = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
    );
    const callLogStatus = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG
    );

    // If both already granted, return early
    if (phoneStateStatus && callLogStatus) {
      console.log("Call permissions already granted");
      return true;
    }

    // Request permissions
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

    // Check if permissions were denied permanently
    const phoneStateDenied =
      granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] ===
      PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
    const callLogDenied =
      granted[PermissionsAndroid.PERMISSIONS.READ_CALL_LOG] ===
      PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

    if (phoneStateDenied || callLogDenied) {
      Alert.alert(
        "Permissions Required",
        "Call tracking permissions are required. Please enable them in Settings > Apps > IPK PhoneBook > Permissions.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => {
              Linking.openSettings();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "Permissions Required",
        "Call permissions are required to track call progress and duration on Android."
      );
    }

    console.warn("Call permissions denied", granted);
    return false;
  } catch (error) {
    console.error("Error requesting call permissions:", error);
    Alert.alert(
      "Error",
      "Failed to request call permissions. Please try again."
    );
    return false;
  }
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
  const [incomingCallNumber, setIncomingCallNumber] = useState<string | null>(null);

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

  // Handle call end detection via call detector
  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const detector = new CallDetectorManager(
      (event) => {
        const callState = getCallEventState(event);
        const eventObj = typeof event === "object" ? event : null;
        const phoneNumber = eventObj?.phoneNumber || null;
        
        console.log("Call detector event:", callState, phoneNumber, event);
        
        // Handle incoming call
        if (callState === "Incoming" && phoneNumber) {
          console.log("Incoming call detected:", phoneNumber);
          setIncomingCallNumber(phoneNumber);
          // Start tracking incoming call
          setIsCalling(true);
          setCallStartedAt(Date.now());
          setCallDurationSeconds(null);
          // Try to find lead by phone number
          // Note: This would require access to leads data, which we'll handle in the component
        }
        // Handle call disconnected (outgoing or incoming)
        else if (
          callState === "Disconnected" &&
          (isCallingRef.current === true || incomingCallNumber) &&
          callStartedAtRef.current != null
        ) {
          const seconds = Math.max(
            1,
            Math.round(
              (Date.now() - (callStartedAtRef.current as number)) / 1000
            )
          );
          console.log("Call ended detected via detector, duration:", seconds);
          setCallDurationSeconds(seconds);
          setIsCalling(false);
          
          // If it was an incoming call, try to find the lead
          if (incomingCallNumber) {
            // We'll need to match this with a lead - for now just show follow-up
            // The component can handle lead matching
            setActiveLead(null); // Will be set by component if lead found
          }
          
          setIsFollowUpOpen(true);
          setCallStartedAt(null);
          setIncomingCallNumber(null);
          endCallRef.current?.();
        }
        // Handle "Offhook" - call is active (outgoing or incoming)
        else if (callState === "Offhook" || callState === "Connected") {
          // Call is now active
          if (!isCallingRef.current && !callStartedAtRef.current) {
            // Started tracking late, start now
            setIsCalling(true);
            setCallStartedAt(Date.now());
          }
        }
        // Handle "Idle" - call ended
        else if (
          (callState === "Idle" || callState === "OFFHOOK_IDLE") &&
          (isCallingRef.current === true || incomingCallNumber) &&
          callStartedAtRef.current != null
        ) {
          const seconds = Math.max(
            1,
            Math.round(
              (Date.now() - (callStartedAtRef.current as number)) / 1000
            )
          );
          console.log("Call ended detected (Idle state), duration:", seconds);
          setCallDurationSeconds(seconds);
          setIsCalling(false);
          
          if (incomingCallNumber) {
            setActiveLead(null);
          }
          
          setIsFollowUpOpen(true);
          setCallStartedAt(null);
          setIncomingCallNumber(null);
          endCallRef.current?.();
        }
      },
      true, // Enable reading phone number for incoming calls
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

  // Handle app state changes - detect when app returns from background after call
  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      console.log("AppState changed:", previousState, "->", nextAppState);

      // When app returns to foreground and we were calling
      if (
        previousState === "background" &&
        nextAppState === "active" &&
        isCallingRef.current === true &&
        callStartedAtRef.current != null
      ) {
        // Check if enough time has passed (at least 2 seconds) to consider it a call
        const elapsed = Date.now() - (callStartedAtRef.current as number);
        const seconds = Math.max(1, Math.round(elapsed / 1000));

        // If more than 2 seconds passed, assume call was made
        if (seconds >= 2) {
          console.log("App returned from background, call duration:", seconds);
          setCallDurationSeconds(seconds);
          setIsCalling(false);
          setIsFollowUpOpen(true);
          setCallStartedAt(null);
          endCallRef.current?.();
        } else {
          // If less than 2 seconds, user probably just opened dialer and closed it
          console.log("App returned quickly, probably no call was made");
          setIsCalling(false);
          setCallStartedAt(null);
          endCallRef.current?.();
        }
      }
    });

    return () => {
      subscription.remove();
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

      // Request permissions first
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

      // Use tel: scheme - opens dialer with number pre-filled
      // Note: On Android, user still needs to press call button due to security restrictions
      // Some devices support tel: with # to auto-dial, but it's not reliable
      const url = `tel:${normalized}`;
      try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          Alert.alert("Dialer", "This device cannot place phone calls.");
          return;
        }

        // Set calling state BEFORE opening dialer
        setIsCalling(true);
        const startTime = Date.now();
        setCallStartedAt(startTime);
        setCallDurationSeconds(null);
        startCallRecord(sourceNumber);

        console.log("Opening dialer for:", normalized);
        await Linking.openURL(url);
        
        // Note: App will go to background when dialer opens
        // We'll detect return via AppState listener
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
