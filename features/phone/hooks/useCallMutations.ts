import { useCallback } from "react";

import {
  logCallInteraction,
  updateLeadAfterCall,
} from "@/features/leads/services/interactions.service";

export type LogCallOptions = Parameters<typeof logCallInteraction>[0];
export type UpdateLeadAfterCallOptions = Parameters<typeof updateLeadAfterCall>[0];

export const useCallMutations = () => {
  const logCall = useCallback(
    async (options: LogCallOptions) => {
      await logCallInteraction(options);
    },
    []
  );

  const changeStage = useCallback(
    async (options: UpdateLeadAfterCallOptions) => {
      return updateLeadAfterCall(options);
    },
    []
  );

  return { logCall, changeStage };
};
