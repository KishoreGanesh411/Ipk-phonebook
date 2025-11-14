import { apolloClient } from "@/core/graphql/apolloClient";
import { ADD_LEAD_INTERACTION, UPDATE_LEAD_DETAILS_AFTER_CALL } from "@/core/graphql/queries";

export type InteractionChannel = "CALL" | "WHATSAPP" | "EMAIL" | "SMS" | "OTHER";

export async function updateLeadAfterCall(params: {
  leadId: string;
  channel: InteractionChannel;
  note: string;
  productExplained: boolean;
  nextFollowUpAt?: string | null;
  stage?: string; // ClientStage, defaults to CLIENT_INTERESTED
}) {
  const { leadId, channel, note, productExplained, nextFollowUpAt, stage } = params;
  const variables = {
    leadId,
    channel,
    note,
    productExplained,
    nextFollowUpAt: nextFollowUpAt ?? null,
    stage: (stage as any) ?? "CLIENT_INTERESTED",
  } as any;
  const { data } = await apolloClient.mutate({
    mutation: UPDATE_LEAD_DETAILS_AFTER_CALL,
    variables,
  });
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
