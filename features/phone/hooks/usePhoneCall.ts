import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";
import CallDetectorManager from "react-native-call-detection";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";

// Android-only: call logs
let CallLogs: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CallLogs = require("react-native-call-log");
} catch (e) {
  // optional on iOS/web
}

export type ReceivedCall = {
  number: string;
  name?: string;
  type?: string; // INCOMING/OUTGOING/MISSED
  dateTime?: string; // ISO string
  duration?: number; // seconds
};

export function usePhoneCall() {
  const [callDetector, setCallDetector] = useState<any>(null);
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [lastDialed, setLastDialed] = useState<string | null>(null);
  const [receivedCalls, setReceivedCalls] = useState<ReceivedCall[]>([]);

  const pendingDialRef = useRef<{ number: string; startedAt: number } | null>(
    null
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const fetchAndroidCallLogs = useCallback(
    async (phone?: string) => {
      if (Platform.OS !== "android" || !CallLogs) return;
      try {
        // Request READ_CALL_LOG permission if needed
        const perm = await check(PERMISSIONS.ANDROID.READ_CALL_LOG);
        if (perm !== RESULTS.GRANTED) {
          const res = await request(PERMISSIONS.ANDROID.READ_CALL_LOG);
          if (res !== RESULTS.GRANTED) return;
        }
        // Some packages expose .load, others expose .getAll
        // We try .load first, then fall back.
        let rawLogs: any[] = [];
        if (typeof CallLogs.load === "function") {
          rawLogs = await CallLogs.load(20);
        } else if (CallLogs?.default?.load) {
          rawLogs = await CallLogs.default.load(20);
        } else if (typeof CallLogs.getAll === "function") {
          rawLogs = await CallLogs.getAll();
        } else if (CallLogs?.default?.getAll) {
          rawLogs = await CallLogs.default.getAll();
        }
        const normalizedPhone = phone?.replace(/[\s\-()]/g, "");
        const mapped: ReceivedCall[] = (rawLogs || [])
          .map((l: any) => ({
            number: String(l.phoneNumber || l.number || ""),
            name: l.name ?? l.cachedName ?? undefined,
            type: l.type || l.callType,
            dateTime: l.timestamp
              ? new Date(Number(l.timestamp)).toISOString()
              : l.dateTime || undefined,
            duration: l.duration ? Number(l.duration) : undefined,
          }))
          .filter((it) => it.number)
          .filter((it) =>
            normalizedPhone ? it.number.replace(/[\s\-()]/g, "") === normalizedPhone : true
          )
          .slice(0, 5);
        setReceivedCalls(mapped);
      } catch (err) {
        // Swallow errors; call logs are best-effort.
      }
    },
    []
  );

  useEffect(() => {
    // Android: live call state detection
    if (Platform.OS === "android") {
      // Ensure phone state permission for call state callbacks
      (async () => {
        try {
          const p = await check(PERMISSIONS.ANDROID.READ_PHONE_STATE);
          if (p !== RESULTS.GRANTED) {
            await request(PERMISSIONS.ANDROID.READ_PHONE_STATE);
          }
        } catch {}
      })();

      const detector = new CallDetectorManager(
        async (event) => {
          if (event === "Disconnected") {
            setPopupVisible(true);
            await fetchAndroidCallLogs(pendingDialRef.current?.number || undefined);
          }
        },
        true,
        () => {},
        {
          title: "Phone Permission",
          message: "We need access to detect call state.",
        }
      );
      setCallDetector(detector);
    }

    const sub = AppState.addEventListener("change", async (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      // iOS: after we return to foreground from a dial, show popup
      if (
        Platform.OS === "ios" &&
        prev !== "active" &&
        next === "active" &&
        pendingDialRef.current
      ) {
        setPopupVisible(true);
        pendingDialRef.current = null;
      }
    });

    return () => {
      sub.remove();
      if (callDetector) callDetector.dispose();
    };
  }, [fetchAndroidCallLogs, callDetector]);

  const makeCall = useCallback(async (phoneNumber: string) => {
    const url = `tel:${phoneNumber}`;
    setLastDialed(phoneNumber);

    if (Platform.OS === "android") {
      const permission = await check(PERMISSIONS.ANDROID.CALL_PHONE);
      if (permission !== RESULTS.GRANTED) {
        await request(PERMISSIONS.ANDROID.CALL_PHONE);
      }
    }

    pendingDialRef.current = { number: phoneNumber, startedAt: Date.now() };
    await Linking.openURL(url);

    if (Platform.OS === "ios") {
      // Fallback: if AppState callback doesn't fire (some env), still show after a delay
      setTimeout(() => {
        if (pendingDialRef.current) {
          setPopupVisible(true);
          pendingDialRef.current = null;
        }
      }, 3500);
    }
  }, []);

  const hidePopup = useCallback(() => setPopupVisible(false), []);

  return {
    makeCall,
    isPopupVisible,
    showFollowUp: () => setPopupVisible(true),
    hideFollowUp: hidePopup,
    lastDialed,
    receivedCalls,
  };
}
