"use client";

import { formatINR } from "@/lib/goldMath";

export type OccasionType = "wedding" | "festival" | "gift" | "personal";

export interface ShowroomLead {
  id: string;
  customerName: string;
  phone: string;
  occasion: OccasionType;
  ornamentId: string;
  ornamentName: string;
  selectedGrams: number;
  estimatedPrice: number;
  oldGoldExchangeValue?: number;
  timestamp: string;
  source: "live-ar" | "photo-match" | "calculator" | "scheme" | "poll" | "bridal";
  notes?: string;
}

export interface LeadAnalytics {
  totalLeads: number;
  totalTryOns: number;
  topOrnament: string;
  avgBudget: number;
  weddingLeadsCount: number;
  festivalLeadsCount: number;
}

const STORAGE_KEY = "swarnatry_leads_v1";

const INITIAL_LEADS: ShowroomLead[] = [
  {
    id: "LEAD-801",
    customerName: "Sravani Reddy",
    phone: "+91 98480 12345",
    occasion: "wedding",
    ornamentId: "SW-HRM-104",
    ornamentName: "Royal Heritage Kasu Mala & Temple Haram",
    selectedGrams: 64,
    estimatedPrice: 545000,
    oldGoldExchangeValue: 180000,
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    source: "bridal",
    notes: "Exchanged 24g old KDM necklace. Wedding date in December.",
  },
  {
    id: "LEAD-802",
    customerName: "Anusha Chowdary",
    phone: "+91 99890 54321",
    occasion: "wedding",
    ornamentId: "SW-CHK-108",
    ornamentName: "Padmavati Antique Choker Set",
    selectedGrams: 38,
    estimatedPrice: 320000,
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    source: "live-ar",
    notes: "Tried in Live AR with matching jhumkas. Liked 94% Oval face match.",
  },
  {
    id: "LEAD-803",
    customerName: "Madhavi Latha",
    phone: "+91 94401 98765",
    occasion: "festival",
    ornamentId: "SW-JHM-201",
    ornamentName: "Traditional Lakshmi Devatha Buttalu",
    selectedGrams: 24,
    estimatedPrice: 198000,
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    source: "calculator",
    notes: "Interested in Diwali purchase. Inquired about 11+1 gold scheme.",
  },
  {
    id: "LEAD-804",
    customerName: "Deepika Varma",
    phone: "+91 91212 34567",
    occasion: "gift",
    ornamentId: "SW-VNK-401",
    ornamentName: "Mayuri Nakshi Antique Bangle Pair",
    selectedGrams: 32,
    estimatedPrice: 265000,
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    source: "scheme",
    notes: "Enrolled in ₹25,000/month 11-month gold savings chit plan.",
  },
];

export function getLeads(): ShowroomLead[] {
  if (typeof window === "undefined") return INITIAL_LEADS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_LEADS;
  } catch {
    return INITIAL_LEADS;
  }
}

export function saveLead(
  leadData: Omit<ShowroomLead, "id" | "timestamp">
): ShowroomLead {
  const current = getLeads();
  const newLead: ShowroomLead = {
    ...leadData,
    id: `LEAD-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString(),
  };

  const updated = [newLead, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("swarnatry_leads_updated"));
    } catch (e) {
      console.warn("Failed to persist lead:", e);
    }
  }
  return newLead;
}

export function deleteLead(id: string): void {
  const current = getLeads();
  const updated = current.filter((l) => l.id !== id);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("swarnatry_leads_updated"));
    } catch (e) {
      console.warn("Failed to delete lead:", e);
    }
  }
}

export function clearAllLeads(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent("swarnatry_leads_updated"));
    } catch {}
  }
}

export function getLeadAnalytics(): LeadAnalytics {
  const leads = getLeads();
  if (leads.length === 0) {
    return {
      totalLeads: 0,
      totalTryOns: 24,
      topOrnament: "Padmavati Antique Choker",
      avgBudget: 320000,
      weddingLeadsCount: 0,
      festivalLeadsCount: 0,
    };
  }

  const ornamentCounts: Record<string, number> = {};
  let totalVal = 0;
  let weddings = 0;
  let festivals = 0;

  leads.forEach((l) => {
    ornamentCounts[l.ornamentName] = (ornamentCounts[l.ornamentName] || 0) + 1;
    totalVal += l.estimatedPrice || 0;
    if (l.occasion === "wedding") weddings++;
    if (l.occasion === "festival") festivals++;
  });

  let topOrnament = leads[0].ornamentName;
  let maxCount = 0;
  Object.entries(ornamentCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topOrnament = name;
    }
  });

  return {
    totalLeads: leads.length,
    totalTryOns: leads.length * 6 + 18, // Estimated realistic try-on volume
    topOrnament,
    avgBudget: Math.round(totalVal / leads.length),
    weddingLeadsCount: weddings,
    festivalLeadsCount: festivals,
  };
}

export function exportLeadsCSV(): string {
  const leads = getLeads();
  const headers = [
    "Lead ID",
    "Customer Name",
    "Phone Number",
    "Occasion",
    "Ornament Name",
    "Selected Grams",
    "Estimated Price (INR)",
    "Old Gold Exchange (INR)",
    "Source",
    "Timestamp",
    "Notes",
  ];

  const rows = leads.map((l) => [
    l.id,
    `"${l.customerName.replace(/"/g, '""')}"`,
    `"${l.phone}"`,
    l.occasion,
    `"${l.ornamentName.replace(/"/g, '""')}"`,
    l.selectedGrams,
    l.estimatedPrice,
    l.oldGoldExchangeValue || 0,
    l.source,
    new Date(l.timestamp).toLocaleString("en-IN"),
    `"${(l.notes || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateWhatsAppFollowUpUrl(
  lead: ShowroomLead,
  showroomName: string = "Sri Krishna Jewellers",
  isTe: boolean = false
): string {
  const cleanPhone = lead.phone.replace(/\D/g, "");
  const formattedVal = formatINR(lead.estimatedPrice);

  const message = isTe
    ? `నమస్తే ${lead.customerName} గారు,\n\nమీరు ${showroomName} వర్చువల్ షోరూమ్‌లో పరిశీలించిన "${lead.ornamentName}" (${lead.selectedGrams} గ్రాములు, సుమారు విలువ ${formattedVal}) గురించిన వివరాలు సిద్ధంగా ఉన్నాయి.\n\nమీ ${lead.occasion === "wedding" ? "శుభ వివాహానికి" : "వేడుకకు"} ప్రత్యేక ఆఫర్‌లు మరియు 0% తరుగుతో కూడిన 11 నెలల గోల్డ్ స్కీమ్ అందుబాటులో ఉంది. మా షోరూమ్‌ను సందర్శించండి లేదా ఇక్కడ నేరుగా రిప్లై ఇవ్వండి!\n\nధన్యవాదాలు,\n${showroomName}`
    : `Namaste ${lead.customerName} Ji,\n\nThank you for exploring "${lead.ornamentName}" (${lead.selectedGrams}g, Approx ${formattedVal}) at ${showroomName}.\n\nWe have special wedding & festive customization offers available, along with our 11+1 Monthly Gold Savings Scheme (100% VA / Wastage Free!). Please visit our showroom or reply here to book an in-person viewing.\n\nWarm regards,\n${showroomName}`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
