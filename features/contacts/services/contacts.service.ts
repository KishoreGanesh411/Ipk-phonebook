import { Result, ok } from "@/core/utils/result";
import { Contact } from "@/features/contacts/types";
import { ipkLeadPipeline } from "@/features/leads/data/ipkLeadModel";

export async function fetchSiteContacts(): Promise<Result<Contact[], string>> {
  const contacts: Contact[] = ipkLeadPipeline.map((lead) => {
    const derivedName = `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
    return {
      id: lead.id,
      displayName: lead.name ?? (derivedName || "Unnamed Lead"),
      phone: lead.phone,
      email: lead.email,
      avatarUri: undefined,
    };
  });

  return ok(contacts);
}
