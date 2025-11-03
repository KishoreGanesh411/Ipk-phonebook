export type StageKey =
  | 'ACCOUNT_OPENED'
  | 'CLIENT_INTERESTED'
  | 'FIRST_TALK_DONE'
  | 'FOLLOWING_UP'
  | 'HIBERNATED'
  | 'NEW_LEAD'
  | 'NOT_INTERESTED_DORMANT'
  | 'NO_RESPONSE_DORMANT'
  | 'RISKY_CLIENT_DORMANT';

export type LeadItem = {
  id: string;
  name?: string | null;
  phone: string;
  clientStage?: StageKey | null;
  status: string;
  leadSource?: string | null;
  assignedRM?: string | null;
  assignedRmId?: string | null;
  leadCode?: string | null;
  nextActionDueAt?: string | null;
  lastContactedAt?: string | null;
  investmentRange?: string | null;
  sipAmount?: number | null;
  product?: string | null;
};