/**
 * Goldsmith Custom Work Order & Karigar Tracking Engine
 * Manages custom order booking, advance payments, old gold receipts, and production stages.
 */

import { formatINR } from "@/lib/goldMath";

export type KarigarStage =
  | "booked"     // 1. Order Booked (ఆర్డర్ తీసుకున్నారు)
  | "melting"    // 2. Melting & Die/Wax Work (మూస / తయారీలో ఉంది)
  | "setting"    // 3. Stone Setting & Nakshi (రాళ్ల అమరిక / నక్షి పని)
  | "polishing"  // 4. Polishing & Hallmarking (పాలిషింగ్ & 916 హాల్మార్క్)
  | "ready";     // 5. Ready for Delivery (డెలివరీకి సిద్ధం)

export interface KarigarStageConfig {
  id: KarigarStage;
  label: string;
  teluguLabel: string;
  stepNumber: number;
  description: string;
  colorClass: string;
}

export const KARIGAR_STAGES: Record<KarigarStage, KarigarStageConfig> = {
  booked: {
    id: "booked",
    label: "Order Booked",
    teluguLabel: "ఆర్డర్ తీసుకున్నారు",
    stepNumber: 1,
    description: "Advance payment received & technical specifications logged",
    colorClass: "bg-blue-500",
  },
  melting: {
    id: "melting",
    label: "Melting & Die Work",
    teluguLabel: "మూస / తయారీలో ఉంది",
    stepNumber: 2,
    description: "Gold alloyed to 916 touch, die-casting & framework creation",
    colorClass: "bg-amber-500",
  },
  setting: {
    id: "setting",
    label: "Stone Setting & Nakshi",
    teluguLabel: "రాళ్ల అమరిక & నక్షి పని",
    stepNumber: 3,
    description: "Hand-chiseling, Kundan/Ruby placement & pearl stringing",
    colorClass: "bg-purple-500",
  },
  polishing: {
    id: "polishing",
    label: "Polishing & Hallmarking",
    teluguLabel: "పాలిషింగ్ & హాల్‌మార్క్",
    stepNumber: 4,
    description: "Mirror buffing, ultrasonic cleaning & 22K 916 BIS laser stamp",
    colorClass: "bg-indigo-500",
  },
  ready: {
    id: "ready",
    label: "Ready for Delivery",
    teluguLabel: "డెలివరీకి సిద్ధంగా ఉంది",
    stepNumber: 5,
    description: "Quality inspection cleared, boxed & ready for customer pickup",
    colorClass: "bg-emerald-500",
  },
};

export interface OrderItemEntry {
  id: string;
  sku?: string;
  name: string;
  designName?: string;
  teluguName?: string;
  category: string;
  grams: number;
  netGrams?: number;
  rate?: number;
  va?: number;
  making?: number;
  stoneCost?: number;
  total?: number;
  purity: string;
  imageUri: string;
  price: number;
}

export interface GoldsmithOrder {
  id: string; // e.g. "SW-ORD-2026-101"
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryDate: string;
  eventDate?: string;
  customer?: {
    name: string;
    phone: string;
    weddingDate?: string;
    deliveryDate: string;
  };
  stage: KarigarStage;
  status?: "BOOKED" | "MELTING" | "SETTING" | "POLISH" | "READY" | KarigarStage;
  stageUpdatedAt: string;
  isComboSet: boolean;
  items: OrderItemEntry[];
  totalGrossGrams: number;
  totalNetGrams: number;
  grandTotalEstimate: number;
  advanceCashPaid: number;
  advanceOldGoldGrams: number;
  advances?: {
    cash: number;
    oldGoldGrams: number;
  };
  balancePayable: number;
  customNotes: string;
  karigarNotes?: string;
  karigarName?: string;
  referencePhotoBlob?: string;
  tryOnSnapshot?: string;
  stageHistory: Array<{
    stage: KarigarStage;
    timestamp: string;
    note?: string;
  }>;
  statusHistory?: Array<{
    stage: string;
    timestamp: string;
    note?: string;
  }>;
}

const LS_ORDERS_KEY = "swarnatry_goldsmith_orders_v1";
const ORDERS_DB_NAME = "swarnatry_orders_db";
const ORDERS_STORE_NAME = "orders";

/**
 * Initialize swarnatry_orders_db in IndexedDB for dual persistence
 */
export function openOrdersDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(ORDERS_DB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(ORDERS_STORE_NAME)) {
          db.createObjectStore(ORDERS_STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

if (typeof window !== "undefined") {
  openOrdersDB().then((db) => {
    if (db) {
      try {
        const tx = db.transaction(ORDERS_STORE_NAME, "readwrite");
        const store = tx.objectStore(ORDERS_STORE_NAME);
        INITIAL_SAMPLE_ORDERS.forEach((o) => store.put(o));
      } catch (e) {}
    }
  }).catch(() => {});
}

// 2 Sample realistic orders for instant demo
export const INITIAL_SAMPLE_ORDERS: GoldsmithOrder[] = [
  {
    id: "SW-ORD-8812",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "Ananya Sharma",
    customerPhone: "+91 98490 12345",
    deliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    stage: "setting",
    stageUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    isComboSet: false,
    items: [
      {
        id: "SW-HRM-104",
        name: "Padmavathi Nakshi Royal Haram",
        teluguName: "పద్మావతి నక్షి పెద్ద హారం",
        category: "Necklaces",
        grams: 56,
        purity: "22K",
        imageUri: "",
        price: 492000,
      },
    ],
    totalGrossGrams: 56,
    totalNetGrams: 53.5,
    grandTotalEstimate: 492000,
    advanceCashPaid: 150000,
    advanceOldGoldGrams: 22.5,
    balancePayable: 185000,
    customNotes: "South Sea pearls extra hanging below center Lakshmi medallion; 18 inch length.",
    karigarName: "Ustaad Ramanaiah",
    stageHistory: [
      { stage: "booked", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), note: "Advance ₹1.5L received" },
      { stage: "melting", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), note: "Die casting ready" },
      { stage: "setting", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), note: "Burmese ruby setting in progress" },
    ],
  },
  {
    id: "SW-ORD-8819",
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: "Sneha Reddy",
    customerPhone: "+91 94400 98765",
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    stage: "polishing",
    stageUpdatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    isComboSet: true,
    items: [
      {
        id: "SW-CHK-108",
        name: "Mayura Heritage Temple Choker",
        teluguName: "మయూర టెంపుల్ చోకర్",
        category: "Choker",
        grams: 28,
        purity: "22K",
        imageUri: "",
        price: 248000,
      },
      {
        id: "SW-JHM-201",
        name: "Kalyani Antique Bell Jhumkas",
        teluguName: "కళ్యాణి సాంప్రదాయ జుంకాలు",
        category: "Earrings",
        grams: 18,
        purity: "22K",
        imageUri: "",
        price: 154000,
      },
    ],
    totalGrossGrams: 46,
    totalNetGrams: 44.8,
    grandTotalEstimate: 402000,
    advanceCashPaid: 200000,
    advanceOldGoldGrams: 0,
    balancePayable: 202000,
    customNotes: "South Indian screw back hooks for Jhumkas; antique matte gold polish.",
    karigarName: "Srinivas Achari",
    stageHistory: [
      { stage: "booked", timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { stage: "melting", timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { stage: "setting", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { stage: "polishing", timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), note: "Sent to BIS hallmarking center" },
    ],
  },
];

/**
 * Load all goldsmith custom orders from localStorage
 */
export function getStoredOrders(): GoldsmithOrder[] {
  if (typeof window === "undefined") return INITIAL_SAMPLE_ORDERS;

  try {
    const raw = localStorage.getItem(LS_ORDERS_KEY);
    if (!raw) {
      localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(INITIAL_SAMPLE_ORDERS));
      return INITIAL_SAMPLE_ORDERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Could not load goldsmith orders from localStorage:", err);
    return INITIAL_SAMPLE_ORDERS;
  }
}

/**
 * Save or append an order
 */
export function saveStoredOrder(order: GoldsmithOrder): void {
  if (typeof window === "undefined") return;

  try {
    const orders = getStoredOrders();
    const existingIdx = orders.findIndex((o) => o.id === order.id);
    let updated: GoldsmithOrder[];
    if (existingIdx >= 0) {
      updated = [...orders];
      updated[existingIdx] = order;
    } else {
      updated = [order, ...orders];
    }
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Could not save goldsmith order:", err);
  }
}

/**
 * Advance an order to next stage
 */
export function updateStoredOrderStage(
  orderId: string,
  nextStage: KarigarStage,
  note?: string,
  expectedFromStage?: KarigarStage
): GoldsmithOrder | null {
  if (typeof window === "undefined") return null;

  try {
    const orders = getStoredOrders();
    const target = orders.find((o) => o.id === orderId);
    if (!target) return null;

    // Atomic assertion: reject if stage changed underneath
    if (expectedFromStage && target.stage !== expectedFromStage) {
      console.warn(
        `Atomic stage check failed for ${orderId}: current is ${target.stage}, expected ${expectedFromStage}`
      );
      return null;
    }

    target.stage = nextStage;
    target.stageUpdatedAt = new Date().toISOString();
    target.stageHistory.push({
      stage: nextStage,
      timestamp: new Date().toISOString(),
      note: note || `Stage updated to ${KARIGAR_STAGES[nextStage].label}`,
    });

    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(orders));
    return target;
  } catch (err) {
    console.warn("Could not update order stage:", err);
    return null;
  }
}

/**
 * Delete an order
 */
export function deleteStoredOrder(orderId: string): void {
  if (typeof window === "undefined") return;

  try {
    const orders = getStoredOrders();
    const filtered = orders.filter((o) => o.id !== orderId);
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn("Could not delete order:", err);
  }
}

/**
 * 1-Click WhatsApp Order Status Notification generator
 */
export function generateKarigarWhatsAppMessage(
  order: GoldsmithOrder,
  showroomName: string = "SwarnaTry Heritage Jewellers",
  lang: "en" | "te" = "en"
): string {
  const stageCfg = KARIGAR_STAGES[order.stage];
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (lang === "te") {
    let msg = `👑 *${showroomName.toUpperCase()} — ఆర్డర్ స్థితి అప్‌డేట్* 👑\n`;
    msg += `నమస్కారం *${order.customerName}* గారు,\n\n`;
    msg += `మీ ఆర్డర్ నంబర్: *${order.id}*\n`;
    msg += `ప్రస్తుత స్థితి: 📍 *${stageCfg.teluguLabel} (${stageCfg.label})*\n`;
    msg += `వివరాలు: ${stageCfg.description}\n`;
    msg += `──────────────────────\n`;
    msg += `✨ *నగల వివరాలు:*\n`;
    order.items.forEach((it, idx) => {
      msg += `${idx + 1}. ${it.teluguName || it.name} (${it.grams}g - ${it.purity})\n`;
    });
    msg += `──────────────────────\n`;
    msg += `📅 ఆశించిన డెలివరీ తేదీ: *${order.deliveryDate}*\n`;
    msg += `💰 అడ్వాన్స్ చెల్లించినది: ${formatINR(order.advanceCashPaid)}`;
    if (order.advanceOldGoldGrams > 0) {
      msg += ` (+ ${order.advanceOldGoldGrams}g పాత బంగారం)\n`;
    } else {
      msg += `\n`;
    }
    msg += `💵 మిగిలిన బ్యాలెన్స్: *${formatINR(order.balancePayable)}*\n`;
    msg += `──────────────────────\n`;
    msg += `మీ ఆభరణాలు అనుభవజ్ఞులైన స్వర్ణకారుల చేత 22K 916 BIS హాల్‌మార్క్ ప్రమాణాలతో రూపొందించబడుతున్నాయి. సందేహాల కోసం మా షోరూమ్‌ను సంప్రదించండి!`;
    return msg;
  } else {
    let msg = `👑 *${showroomName.toUpperCase()} — Custom Order Status Update* 👑\n`;
    msg += `Dear *${order.customerName}*,\n\n`;
    msg += `Order Reference: *${order.id}*\n`;
    msg += `Current Goldsmith Stage: 📍 *${stageCfg.label} [Step ${stageCfg.stepNumber}/5]*\n`;
    msg += `Status Detail: ${stageCfg.description}\n`;
    msg += `──────────────────────\n`;
    msg += `✨ *Ornament(s):*\n`;
    order.items.forEach((it, idx) => {
      msg += `${idx + 1}. ${it.name} (${it.grams}g • ${it.purity})\n`;
    });
    msg += `──────────────────────\n`;
    msg += `📅 Expected Delivery Date: *${order.deliveryDate}*\n`;
    msg += `💰 Advance Paid: ${formatINR(order.advanceCashPaid)}`;
    if (order.advanceOldGoldGrams > 0) {
      msg += ` (+ ${order.advanceOldGoldGrams}g Old Gold)\n`;
    } else {
      msg += `\n`;
    }
    msg += `💵 Remaining Balance on Delivery: *${formatINR(order.balancePayable)}*\n`;
    msg += `──────────────────────\n`;
    msg += `Your jewelry is being handcrafted with 22K 916 BIS Hallmarked excellence. Thank you for choosing ${showroomName}!`;
    return msg;
  }
}

// Aliases for Phase 3C API contract
export const getOrders = getStoredOrders;
export const createOrder = saveStoredOrder;
export const updateOrderStatus = updateStoredOrderStage;
export const deleteOrder = deleteStoredOrder;

export function getOrderById(orderId: string): GoldsmithOrder | null {
  const orders = getStoredOrders();
  return orders.find((o) => o.id === orderId) || null;
}

export function exportOrdersJSON(): string {
  const orders = getStoredOrders();
  return JSON.stringify(orders, null, 2);
}

export function importOrdersJSON(jsonString: string): number {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(parsed));
      return parsed.length;
    }
    return 0;
  } catch (e) {
    console.error("Failed to import orders JSON:", e);
    return 0;
  }
}
