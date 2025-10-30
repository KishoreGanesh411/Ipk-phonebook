export const leadCategories = [
  "New Leads",
  "Existing Leads",
  "Investors",
  "Pending Calls",
  "Missed Calls"
] as const;

export type LeadCategory = (typeof leadCategories)[number];

export type LeadStatusTone = "primary" | "success" | "error" | "muted";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  company?: string;
  status: string;
  tone: LeadStatusTone;
};

export const leadCatalogue: Record<LeadCategory, Lead[]> = {
  "New Leads": [
    { id: "NL-001", name: "Aarav Patel", phone: "+91 99888 11223", company: "Patel Holdings", status: "Interested", tone: "primary" },
    { id: "NL-002", name: "Priya Menon", phone: "+91 98765 44321", company: "Nimbus Realty", status: "Schedule demo", tone: "muted" },
    { id: "NL-003", name: "Rishi Kapoor", phone: "+1 415 555 0112", company: "Bay Area Tech", status: "Documents pending", tone: "primary" },
    { id: "NL-004", name: "Sneha Rao", phone: "+971 50 321 7654", company: "Gulf Ventures", status: "High priority", tone: "success" }
  ],
  "Existing Leads": [
    { id: "EL-101", name: "Vikram Shah", phone: "+91 99345 22110", company: "Shah Industries", status: "KYC complete", tone: "success" },
    { id: "EL-102", name: "Sarah Johnson", phone: "+1 212 555 0199", company: "Madison Consulting", status: "Review proposal", tone: "muted" },
    { id: "EL-103", name: "Nikita Verma", phone: "+91 98450 77889", company: "Verma Finance", status: "Awaiting contract", tone: "primary" },
    { id: "EL-104", name: "Mohammed Ali", phone: "+971 56 987 2310", company: "Ali Investments", status: "Follow-up today", tone: "primary" }
  ],
  Investors: [
    { id: "IN-201", name: "Karan Singh", phone: "+91 90000 22121", company: "Singh Capital", status: "Active mandate", tone: "success" },
    { id: "IN-202", name: "Emily Davis", phone: "+1 646 555 0147", company: "Davis Holdings", status: "Portfolio review", tone: "muted" },
    { id: "IN-203", name: "Harini Iyer", phone: "+91 98200 44221", company: "Iyer Ventures", status: "Send performance", tone: "primary" },
    { id: "IN-204", name: "Liam O'Connor", phone: "+44 20 7946 0703", company: "O'Connor Group", status: "Awaiting funding", tone: "primary" }
  ],
  "Pending Calls": [
    { id: "PC-301", name: "Rohit Gupta", phone: "+91 98765 55667", company: "Gupta Retail", status: "Call by 6 PM", tone: "primary" },
    { id: "PC-302", name: "Isabella Costa", phone: "+34 600 123 987", company: "Costa Partners", status: "Time-zone note", tone: "muted" },
    { id: "PC-303", name: "Sunil Nair", phone: "+91 98111 44770", company: "Nair Logistics", status: "Needs pricing", tone: "primary" },
    { id: "PC-304", name: "Ananya Desai", phone: "+91 90080 33445", company: "Desai Metals", status: "Share pitch deck", tone: "primary" }
  ],
  "Missed Calls": [
    { id: "MC-401", name: "Sofia Martinez", phone: "+52 55 1234 8765", company: "Martinez Trading", status: "Missed at 09:20", tone: "error" },
    { id: "MC-402", name: "Kunal Malhotra", phone: "+91 99000 88001", company: "Malhotra Textiles", status: "Left voice note", tone: "muted" },
    { id: "MC-403", name: "Noah Williams", phone: "+1 305 555 0101", company: "Williams Finance", status: "Missed at 13:45", tone: "error" },
    { id: "MC-404", name: "Grace Lee", phone: "+65 8123 4433", company: "Lee Strategic", status: "Request call back", tone: "primary" }
  ]
};
