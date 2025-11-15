// features/phone/hooks/useCallMutations.ts (Conceptual)

import { gql } from '@apollo/client'; // Assuming Apollo Client
import { useMutation } from '@apollo/client/react';

// --- 1. Log Lead Call Mutation ---
const LOG_CALL_MUTATION = gql`
  mutation LogLeadCall($input: LogLeadCallInput!) {
    logLeadCall(input: $input) {
      id
      type
      text
      leadId
    }
  }
`;

// --- 2. Change Stage Mutation ---
const CHANGE_STAGE_MUTATION = gql`
  mutation ChangeLeadStage($input: ChangeStageInput!) {
    changeStage(input: $input) {
      id
      clientStage
      nextActionDueAt
    }
  }
`;

export const useCallMutations = () => {
    const [logCall] = useMutation(LOG_CALL_MUTATION);
    const [changeStage] = useMutation(CHANGE_STAGE_MUTATION);

    return { logCall, changeStage };
};