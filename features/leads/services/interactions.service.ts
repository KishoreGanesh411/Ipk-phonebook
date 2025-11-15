import { apolloClient } from "@/core/graphql/apolloClient";
import {
  ADD_LEAD_INTERACTION,
  UPDATE_LEAD_DETAILS_AFTER_CALL,
  UPDATE_LEAD_REMARK,
} from "@/core/graphql/queries";

export type InteractionChannel = "CALL" | "WHATSAPP" | "EMAIL" | "SMS" | "OTHER";

export async function updateLeadAfterCall(params: {
  leadId: string;
  channel: InteractionChannel;
  note?: string | null;
  productExplained?: boolean;
  nextFollowUpAt?: string | null;
  stage?: string; // ClientStage, defaults to CLIENT_INTERESTED
  stageFilter?: string | null;
  callStartedAt?: string | null;
  callEndedAt?: string | null;
  durationSeconds?: number | null;
  saveRemark?: boolean;
}) {
  const {
    leadId,
    channel,
    note,
    productExplained,
    nextFollowUpAt,
    stage,
    stageFilter,
    callStartedAt,
    callEndedAt,
    durationSeconds,
    saveRemark,
  } = params;

  const segments: string[] = [];
  const trimmedNote = note?.trim();
  if (trimmedNote) {
    segments.push(trimmedNote);
  }
  if (callStartedAt) {
    segments.push(`Call started at ${callStartedAt}`);
  }
  if (callEndedAt) {
    segments.push(`Call ended at ${callEndedAt}`);
  }
  if (Number.isFinite(durationSeconds ?? NaN)) {
    const seconds = Math.max(1, Math.round((durationSeconds ?? 0) || 0));
    segments.push(`Call duration ${seconds}s`);
  }

  const finalNote = segments.length ? segments.join(" | ") : undefined;

  const variables: Record<string, unknown> = {
    leadId,
    channel,
    stage: (stage as any) ?? "CLIENT_INTERESTED",
  };

  if (nextFollowUpAt !== undefined) {
    variables.nextFollowUpAt = nextFollowUpAt ?? null;
  }
  if (finalNote !== undefined) {
    variables.note = finalNote;
  }
  if (productExplained !== undefined) {
    variables.productExplained = productExplained;
  }
  if (stageFilter !== undefined) {
    variables.stageFilter = stageFilter ?? null;
  }

  const { data } = await apolloClient.mutate({
    mutation: UPDATE_LEAD_DETAILS_AFTER_CALL,
    variables,
  });

  if (saveRemark && finalNote) {
    await apolloClient.mutate({
      mutation: UPDATE_LEAD_REMARK,
      variables: { leadId, remark: finalNote },
    });
  }

  return data?.changeStage;
}

export async function logCallInteraction(input: {
  leadId?: string;
  phone: string;
  durationSeconds: number;
  notes: string;
  nextAction: string;
}): Promise<void> {
  const { leadId, phone, durationSeconds, notes, nextAction } = input;
  if (!leadId) {
    console.warn("Skipping lead interaction: leadId missing");
    return;
  }

  const normalizedPhone = phone?.trim();
  const segments = [
    notes?.trim(),
    nextAction?.trim() ? `Next: ${nextAction.trim()}` : undefined,
    normalizedPhone ? `Number: ${normalizedPhone}` : undefined,
    Number.isFinite(durationSeconds)
      ? `Duration: ${Math.max(1, Math.round(durationSeconds))}s`
      : undefined,
  ].filter((part): part is string => Boolean(part));
  const text = segments.join(" | ") || "Call follow-up";

  await apolloClient.mutate({
    mutation: ADD_LEAD_INTERACTION,
    variables: {
      input: {
        leadId,
        channel: "CALL",
        text,
        tags: ["call", "follow-up"],
      },
    },
  });
}
