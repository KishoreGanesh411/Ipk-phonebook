import { apolloClient } from '@/core/graphql/apolloClient';
import { UPDATE_LEAD_DETAILS_AFTER_CALL } from '@/core/graphql/queries';

export type InteractionChannel = 'CALL' | 'WHATSAPP' | 'EMAIL' | 'SMS' | 'OTHER';

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
    stage: (stage as any) ?? 'CLIENT_INTERESTED',
  } as any;
  const { data } = await apolloClient.mutate({
    mutation: UPDATE_LEAD_DETAILS_AFTER_CALL,
    variables,
  });
  return data?.changeStage;
}

