import { create } from "zustand";

export type ActiveLeadSnapshot = {
  id?: string | null;
  name?: string | null;
  phone?: string | null;
  clientStage?: string | null;
  status?: string | null;
  leadSource?: string | null;
  leadCode?: string | null;
  assignedRM?: string | null;
  assignedRmId?: string | null;
  lastContactedAt?: string | null;
  nextActionDueAt?: string | null;
  selectedSim?: string | null;
};

type CallInfo = {
  dialed: string;
  normalized: string;
  startedAt: number;
  lead?: ActiveLeadSnapshot | null;
};

type CallState = {
  activeCall: CallInfo | null;
  startCall: (rawNumber: string, lead?: ActiveLeadSnapshot | null) => void;
  endCall: () => void;
};

const normalizeNumber = (value: string) =>
  value.replace(/[\s\-()]/g, "");

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  startCall: (rawNumber, lead) => {
    const trimmed = rawNumber.trim();
    if (!trimmed) return;
    const normalized = normalizeNumber(trimmed);
    set({
      activeCall: {
        dialed: trimmed,
        normalized,
        startedAt: Date.now(),
        lead,
      },
    });
  },
  endCall: () => set({ activeCall: null }),
}));
