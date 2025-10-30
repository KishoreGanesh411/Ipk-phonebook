import { Lead } from "@/features/home/data/leadData";

// Example REST integration
export async function fetchLeadsREST(baseUrl: string, token?: string): Promise<Lead[]> {
  const res = await fetch(`${baseUrl}/leads`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error(`REST fetch failed (${res.status})`);
  const data = await res.json();
  return data as Lead[];
}

// Example GraphQL integration
export async function fetchLeadsGraphQL(endpoint: string, token?: string): Promise<Lead[]> {
  const query = `
    query Leads {
      leads { id name phone company status tone }
    }
  `;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error(`GraphQL fetch failed (${res.status})`);
  const json = await res.json();
  return json.data?.leads ?? [];
}

