/**
 * Multi-Slot Bridal Combo State Manager & Budget Allocation Engine
 * Manages simultaneous layering of Choker, Haram, Earrings, Maang Tikka, and Nose Ring.
 */

import { JewelryItem, MOCK_JEWELRY_CATALOG } from "@/data/mockJewelryCatalog";
import { calculateGoldPrice, formatINR, PriceBreakdown, RECEIPT_LABELS } from "@/lib/goldMath";

export type BridalSlotId =
  | "slot_choker"
  | "slot_haram"
  | "slot_earrings"
  | "slot_tikka"
  | "slot_nosering";

export interface BridalSlotConfig {
  id: BridalSlotId;
  label: string;
  teluguLabel: string;
  categoryLabel: string;
  iconName: string;
  defaultZIndex: number;
  // Natural AR positioning adjustments relative to default anchor
  defaultOffsetYAdjustment: number;
  defaultScaleMultiplier: number;
}

export const BRIDAL_SLOT_CONFIGS: Record<BridalSlotId, BridalSlotConfig> = {
  slot_choker: {
    id: "slot_choker",
    label: "Choker / Short Necklace",
    teluguLabel: "కంఠాభరణం / చోకర్",
    categoryLabel: "Choker (High Neck)",
    iconName: "Crown",
    defaultZIndex: 3,
    defaultOffsetYAdjustment: -15, // Anchored higher near collarbone
    defaultScaleMultiplier: 0.95,
  },
  slot_haram: {
    id: "slot_haram",
    label: "Long Haram / Kasu Mala",
    teluguLabel: "పెద్ద హారం / కాసుల దండ",
    categoryLabel: "Haram (Low Chest)",
    iconName: "Gem",
    defaultZIndex: 2,
    defaultOffsetYAdjustment: 55, // Anchored lower on chest below choker
    defaultScaleMultiplier: 1.15,
  },
  slot_earrings: {
    id: "slot_earrings",
    label: "Earrings / Jhumkas",
    teluguLabel: "దిద్దులు / జుంకాలు",
    categoryLabel: "Earrings (Both Lobes)",
    iconName: "Sparkles",
    defaultZIndex: 4,
    defaultOffsetYAdjustment: 0,
    defaultScaleMultiplier: 1.0,
  },
  slot_tikka: {
    id: "slot_tikka",
    label: "Maang Tikka / Papidi Billa",
    teluguLabel: "పాపిడి బిళ్ళ / మాంగ్ టిక్కా",
    categoryLabel: "Forehead / Hairline",
    iconName: "Flame",
    defaultZIndex: 5,
    defaultOffsetYAdjustment: 0,
    defaultScaleMultiplier: 1.0,
  },
  slot_nosering: {
    id: "slot_nosering",
    label: "Nose Ring / Nath / Pudaka",
    teluguLabel: "ముక్కు పుడక / నత్",
    categoryLabel: "Nose Wing",
    iconName: "CircleDot",
    defaultZIndex: 6,
    defaultOffsetYAdjustment: 0,
    defaultScaleMultiplier: 1.0,
  },
};

export interface EquippedOrnament {
  slotId: BridalSlotId;
  item: JewelryItem;
  selectedGrams: number;
  customScale?: number;
  customOffsetY?: number;
  customOffsetX?: number;
  neckCurve?: number; // -40 to +40 degrees parabolic warp
  yawAngle?: number;  // -35 to +35 degrees perspective tilt
}

export type BridalComboSlots = Record<BridalSlotId, EquippedOrnament | null>;

export interface BridalPreset {
  id: string;
  name: string;
  teluguName: string;
  subtitle: string;
  description: string;
  badge: string;
  itemIds: Partial<Record<BridalSlotId, string>>;
}

export const BRIDAL_PRESETS: BridalPreset[] = [
  {
    id: "preset_tirumala_temple",
    name: "Tirumala Temple Bridal Set",
    teluguName: "తిరుమల టెంపుల్ రాయల్ పెళ్లి సెట్",
    subtitle: "Kasu Mala + Nakshi Choker + Bell Jhumkas + Tikka",
    description: "Sacred South Indian royal bride styling with 22K die-cast Nakshi work and ruby-studded coin mala.",
    badge: "Most Popular",
    itemIds: {
      slot_choker: "SW-CHK-108",
      slot_haram: "SW-HRM-104",
      slot_earrings: "SW-JHM-201",
      slot_tikka: "SW-TIK-301",
      slot_nosering: "SW-PUD-408",
    },
  },
  {
    id: "preset_nizami_kundan",
    name: "Royal Nizami Kundan & Kasu Set",
    teluguName: "రాయల్ నిజామీ కుందన్ & కాసుల సెట్",
    subtitle: "Polki Chandbali + Kasu Mala + Pearl Nath",
    description: "Opulent Hyderabad Nizam court bridal ensemble with Polki uncut diamonds and Peshwai pearl nose ring.",
    badge: "Heritage Royal",
    itemIds: {
      slot_choker: "SW-CHK-108",
      slot_haram: "SW-KAS-112",
      slot_earrings: "SW-BAL-208",
      slot_tikka: "SW-TIK-301",
      slot_nosering: "SW-NTH-401",
    },
  },
  {
    id: "preset_lightweight_engagement",
    name: "Lightweight Engagement Trousseau",
    teluguName: "తేలికపాటి నిశ్చితార్థం & రిసెప్షన్ సెట్",
    subtitle: "Contemporary Choker + Jhumkas + Tikka",
    description: "Comfortable, modern 3-piece trousseau tailored for engagement ceremonies and sangeet functions.",
    badge: "Lightweight",
    itemIds: {
      slot_choker: "SW-CHK-108",
      slot_earrings: "SW-JHM-201",
      slot_tikka: "SW-TIK-301",
    },
  },
];

export const INITIAL_BRIDAL_SLOTS: BridalComboSlots = {
  slot_choker: null,
  slot_haram: null,
  slot_earrings: null,
  slot_tikka: null,
  slot_nosering: null,
};

const LS_BRIDAL_COMBO_KEY = "swarnatry_bridal_combo_set_v1";
const LS_COMBO_MODE_KEY = "swarnatry_is_combo_mode_v1";

/**
 * Determine the most suitable anatomical slot for an ornament
 */
export function determineSlotForItem(
  item: JewelryItem,
  currentSlots: BridalComboSlots
): BridalSlotId {
  if (item.category === "earrings") return "slot_earrings";
  if (item.category === "maang-tikka") return "slot_tikka";
  if (item.category === "nose-rings") return "slot_nosering";

  if (item.category === "necklaces") {
    const isChokerLike =
      item.name.toLowerCase().includes("choker") ||
      item.categoryLabel.toLowerCase().includes("choker") ||
      item.minGrams <= 32;

    if (isChokerLike) {
      if (!currentSlots.slot_choker) return "slot_choker";
      if (!currentSlots.slot_haram) return "slot_haram";
      return "slot_choker";
    } else {
      if (!currentSlots.slot_haram) return "slot_haram";
      if (!currentSlots.slot_choker) return "slot_choker";
      return "slot_haram";
    }
  }

  return "slot_choker";
}

/**
 * Load equipped bridal slots from localStorage
 */
export function loadPersistedBridalSlots(catalog: JewelryItem[]): BridalComboSlots {
  if (typeof window === "undefined") return { ...INITIAL_BRIDAL_SLOTS };

  try {
    const saved = localStorage.getItem(LS_BRIDAL_COMBO_KEY);
    if (!saved) return { ...INITIAL_BRIDAL_SLOTS };

    const parsed = JSON.parse(saved) as Record<
      BridalSlotId,
      {
        itemId: string;
        selectedGrams: number;
        customScale?: number;
        customOffsetY?: number;
        customOffsetX?: number;
        neckCurve?: number;
        yawAngle?: number;
      } | null
    >;

    const result: BridalComboSlots = { ...INITIAL_BRIDAL_SLOTS };
    (Object.keys(parsed) as BridalSlotId[]).forEach((slotId) => {
      const entry = parsed[slotId];
      if (entry && entry.itemId) {
        const found = catalog.find((c) => c.id === entry.itemId);
        if (found) {
          result[slotId] = {
            slotId,
            item: found,
            selectedGrams: entry.selectedGrams || found.defaultGrams,
            customScale: entry.customScale,
            customOffsetY: entry.customOffsetY,
            customOffsetX: entry.customOffsetX,
            neckCurve: entry.neckCurve || 0,
            yawAngle: entry.yawAngle || 0,
          };
        }
      }
    });

    return result;
  } catch (err) {
    console.warn("Could not load bridal combo set from localStorage:", err);
    return { ...INITIAL_BRIDAL_SLOTS };
  }
}

/**
 * Persist equipped bridal slots to localStorage
 */
export function savePersistedBridalSlots(slots: BridalComboSlots): void {
  if (typeof window === "undefined") return;

  try {
    const serialized: Record<string, any> = {};
    (Object.keys(slots) as BridalSlotId[]).forEach((slotId) => {
      const entry = slots[slotId];
      if (entry) {
        serialized[slotId] = {
          itemId: entry.item.id,
          selectedGrams: entry.selectedGrams,
          customScale: entry.customScale,
          customOffsetY: entry.customOffsetY,
          customOffsetX: entry.customOffsetX,
          neckCurve: entry.neckCurve,
          yawAngle: entry.yawAngle,
        };
      } else {
        serialized[slotId] = null;
      }
    });
    localStorage.setItem(LS_BRIDAL_COMBO_KEY, JSON.stringify(serialized));
  } catch (err) {
    console.warn("Could not save bridal combo set to localStorage:", err);
  }
}

/**
 * Check if combo mode is enabled
 */
export function getPersistedComboMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LS_COMBO_MODE_KEY) === "true";
}

export function setPersistedComboMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_COMBO_MODE_KEY, enabled ? "true" : "false");
}

/**
 * Summary calculation of the entire bridal combo set
 */
export interface ComboSetCalculation {
  totalPieces: number;
  items: Array<{
    slotId: BridalSlotId;
    slotLabel: string;
    item: JewelryItem;
    selectedGrams: number;
    breakdown: PriceBreakdown;
  }>;
  totalGrossGrams: number;
  totalNetGrams: number;
  totalStoneWeightGrams: number;
  totalStoneCost: number;
  totalBaseGoldCost: number;
  totalWastageCost: number;
  totalMakingCharges: number;
  totalGst: number;
  grandTotal: number;
  minPossibleGrandTotal: number;
  maxPossibleGrandTotal: number;
  minPossibleGrams: number;
  maxPossibleGrams: number;
}

export function calculateComboSetTotals(
  slots: BridalComboSlots,
  goldRate22K: number,
  goldRate24K: number
): ComboSetCalculation {
  const activeEntries = (Object.keys(slots) as BridalSlotId[])
    .map((slotId) => slots[slotId])
    .filter((e): e is EquippedOrnament => Boolean(e));

  let totalGrossGrams = 0;
  let totalNetGrams = 0;
  let totalStoneWeightGrams = 0;
  let totalStoneCost = 0;
  let totalBaseGoldCost = 0;
  let totalWastageCost = 0;
  let totalMakingCharges = 0;
  let totalGst = 0;
  let grandTotal = 0;

  let minPossibleGrandTotal = 0;
  let maxPossibleGrandTotal = 0;
  let minPossibleGrams = 0;
  let maxPossibleGrams = 0;

  const itemizedList: ComboSetCalculation["items"] = [];

  activeEntries.forEach((entry) => {
    const item = entry.item;
    const grams = entry.selectedGrams;

    const breakdown = calculateGoldPrice(grams, item.purity, {
      goldRate22K,
      goldRate24K,
      wastagePercent: item.wastagePercent,
      makingChargePerGram: item.makingChargePerGram,
      stoneWeightGrams: item.stoneWeightGrams,
      stoneCostFlat: item.stoneCostFlat,
    });

    // Min & Max range
    const minBreakdown = calculateGoldPrice(item.minGrams, item.purity, {
      goldRate22K,
      goldRate24K,
      wastagePercent: item.wastagePercent,
      makingChargePerGram: item.makingChargePerGram,
      stoneWeightGrams: item.stoneWeightGrams,
      stoneCostFlat: item.stoneCostFlat,
    });
    const maxBreakdown = calculateGoldPrice(item.maxGrams, item.purity, {
      goldRate22K,
      goldRate24K,
      wastagePercent: item.wastagePercent,
      makingChargePerGram: item.makingChargePerGram,
      stoneWeightGrams: item.stoneWeightGrams,
      stoneCostFlat: item.stoneCostFlat,
    });

    totalGrossGrams += breakdown.grossGrams;
    totalNetGrams += breakdown.netGoldGrams;
    totalStoneWeightGrams += breakdown.stoneWeightGrams;
    totalStoneCost += breakdown.stoneCost;
    totalBaseGoldCost += breakdown.baseGoldCost;
    totalWastageCost += breakdown.wastageCost;
    totalMakingCharges += breakdown.makingCharges;
    totalGst += breakdown.gstAmount;
    grandTotal += breakdown.totalEstimatedPrice;

    minPossibleGrandTotal += minBreakdown.totalEstimatedPrice;
    maxPossibleGrandTotal += maxBreakdown.totalEstimatedPrice;
    minPossibleGrams += item.minGrams;
    maxPossibleGrams += item.maxGrams;

    itemizedList.push({
      slotId: entry.slotId,
      slotLabel: BRIDAL_SLOT_CONFIGS[entry.slotId].label,
      item,
      selectedGrams: grams,
      breakdown,
    });
  });

  return {
    totalPieces: activeEntries.length,
    items: itemizedList,
    totalGrossGrams,
    totalNetGrams,
    totalStoneWeightGrams,
    totalStoneCost,
    totalBaseGoldCost,
    totalWastageCost,
    totalMakingCharges,
    totalGst,
    grandTotal,
    minPossibleGrandTotal,
    maxPossibleGrandTotal,
    minPossibleGrams,
    maxPossibleGrams,
  };
}

/**
 * Reverse Budget Planner:
 * Given a target budget in INR, automatically adjusts the selected grams
 * for each equipped ornament within its craftable minGrams - maxGrams range.
 */
export function allocateGramsForTargetBudget(
  targetBudgetInr: number,
  slots: BridalComboSlots,
  goldRate22K: number,
  goldRate24K: number
): Record<BridalSlotId, number> {
  const result: Record<BridalSlotId, number> = {
    slot_choker: 0,
    slot_haram: 0,
    slot_earrings: 0,
    slot_tikka: 0,
    slot_nosering: 0,
  };

  const activeSlots = (Object.keys(slots) as BridalSlotId[]).filter(
    (slotId) => Boolean(slots[slotId])
  );

  if (activeSlots.length === 0) return result;

  // Initialize with minimum craftable grams
  activeSlots.forEach((slotId) => {
    const entry = slots[slotId];
    if (entry) {
      result[slotId] = entry.item.minGrams;
    }
  });

  // Calculate cost at min grams
  let totalAtMin = 0;
  let totalAtMax = 0;

  activeSlots.forEach((slotId) => {
    const entry = slots[slotId]!;
    const minBd = calculateGoldPrice(entry.item.minGrams, entry.item.purity, {
      goldRate22K,
      goldRate24K,
      wastagePercent: entry.item.wastagePercent,
      makingChargePerGram: entry.item.makingChargePerGram,
      stoneWeightGrams: entry.item.stoneWeightGrams,
      stoneCostFlat: entry.item.stoneCostFlat,
    });
    const maxBd = calculateGoldPrice(entry.item.maxGrams, entry.item.purity, {
      goldRate22K,
      goldRate24K,
      wastagePercent: entry.item.wastagePercent,
      makingChargePerGram: entry.item.makingChargePerGram,
      stoneWeightGrams: entry.item.stoneWeightGrams,
      stoneCostFlat: entry.item.stoneCostFlat,
    });
    totalAtMin += minBd.totalEstimatedPrice;
    totalAtMax += maxBd.totalEstimatedPrice;
  });

  if (targetBudgetInr <= totalAtMin) {
    // Keep at min grams
    return result;
  }

  if (targetBudgetInr >= totalAtMax) {
    // Maximize all items
    activeSlots.forEach((slotId) => {
      result[slotId] = slots[slotId]!.item.maxGrams;
    });
    return result;
  }

  // Linear interpolation factor t between min and max
  const t = Math.max(0, Math.min(1, (targetBudgetInr - totalAtMin) / (totalAtMax - totalAtMin)));

  activeSlots.forEach((slotId) => {
    const item = slots[slotId]!.item;
    const interpolated = item.minGrams + t * (item.maxGrams - item.minGrams);
    // Round to whole gram or 0.5 gram
    const rounded = Math.round(interpolated);
    result[slotId] = Math.max(item.minGrams, Math.min(item.maxGrams, rounded));
  });

  return result;
}

/**
 * Generate bilingual WhatsApp quotation for the complete Bridal Combo Set
 */
export function generateBridalComboWhatsAppQuote(
  calc: ComboSetCalculation,
  showroomName: string,
  goldRate22K: number,
  language: "en" | "te" = "en"
): string {
  const isTe = language === "te";
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  let message = "";

  if (isTe) {
    message += `👑 *${showroomName.toUpperCase()} — సంపూర్ణ పెళ్లి నగల సెట్ కొటేషన్* 👑\n`;
    message += `తేదీ: ${dateStr} | లైవ్ 22K రేటు: ₹${goldRate22K.toLocaleString("en-IN")}/గ్రామ్\n`;
    message += `──────────────────────\n`;
    message += `✨ *ఎంచుకున్న ఆభరణాలు (${calc.totalPieces} రకాలు):*\n\n`;

    calc.items.forEach((it, idx) => {
      const teluguTitle = it.item.teluguName || it.item.name;
      message += `${idx + 1}. *${teluguTitle}* (${BRIDAL_SLOT_CONFIGS[it.slotId].teluguLabel})\n`;
      message += `   • డిజైన్ ఐడీ: ${it.item.id}\n`;
      message += `   • బరువు: ${it.selectedGrams}g (${it.item.purity} బంగారం)\n`;
      if (it.breakdown.stoneWeightGrams > 0) {
        message += `   • రాళ్ల తగ్గింపు: -${it.breakdown.stoneWeightGrams}g | నికర బంగారం: ${it.breakdown.netGoldGrams}g\n`;
      }
      message += `   • ధర: ${formatINR(it.breakdown.totalEstimatedPrice)}\n\n`;
    });

    message += `──────────────────────\n`;
    message += `📊 *మొత్తం సెట్ వివరాలు:*\n`;
    message += `• మొత్తం స్థూల బరువు: *${calc.totalGrossGrams.toFixed(2)} గ్రాములు*\n`;
    message += `• నికర బంగారం బరువు: *${calc.totalNetGrams.toFixed(2)} గ్రాములు*\n`;
    if (calc.totalStoneWeightGrams > 0) {
      message += `• మొత్తం రాళ్ల బరువు: *${calc.totalStoneWeightGrams.toFixed(2)} గ్రాములు* (${formatINR(calc.totalStoneCost)})\n`;
    }
    message += `• మొత్తం జీఎస్టీ (3%): *${formatINR(calc.totalGst)}*\n`;
    message += `💰 *మొత్తం అంచనా బడ్జెట్: ${formatINR(calc.grandTotal)}*\n`;
    message += `(పరిధి: ${formatINR(calc.minPossibleGrandTotal)} – ${formatINR(calc.maxPossibleGrandTotal)})\n`;
    message += `──────────────────────\n`;
    message += `📍 *${showroomName}* లో ఈ సెట్ ప్రత్యక్షంగా చూడటానికి షోరూమ్ సందర్శించండి!`;
  } else {
    message += `👑 *${showroomName.toUpperCase()} — Complete Bridal Combo Set Quotation* 👑\n`;
    message += `Date: ${dateStr} | Live 22K Gold Rate: ₹${goldRate22K.toLocaleString("en-IN")}/g\n`;
    message += `──────────────────────\n`;
    message += `✨ *Equipped Bridal Ornaments (${calc.totalPieces} Pieces):*\n\n`;

    calc.items.forEach((it, idx) => {
      message += `${idx + 1}. *${it.item.name}* [${BRIDAL_SLOT_CONFIGS[it.slotId].label}]\n`;
      message += `   • SKU: ${it.item.id} | Purity: ${it.item.purity}\n`;
      message += `   • Gross Weight: ${it.selectedGrams}g\n`;
      if (it.breakdown.stoneWeightGrams > 0) {
        message += `   • Stone Deduction: -${it.breakdown.stoneWeightGrams}g (Net Gold: ${it.breakdown.netGoldGrams}g)\n`;
      }
      message += `   • Item Total: ${formatINR(it.breakdown.totalEstimatedPrice)}\n\n`;
    });

    message += `──────────────────────\n`;
    message += `📊 *Trousseau Summary:*\n`;
    message += `• Total Gross Gold Weight: *${calc.totalGrossGrams.toFixed(2)}g*\n`;
    message += `• Total Net Gold Weight: *${calc.totalNetGrams.toFixed(2)}g*\n`;
    if (calc.totalStoneWeightGrams > 0) {
      message += `• Total Gemstones: *${calc.totalStoneWeightGrams.toFixed(2)}g* (${formatINR(calc.totalStoneCost)})\n`;
    }
    message += `• Total GST (3%): *${formatINR(calc.totalGst)}*\n`;
    message += `💰 *GRAND TOTAL ESTIMATED BUDGET: ${formatINR(calc.grandTotal)}*\n`;
    message += `(Craftable Range: ${formatINR(calc.minPossibleGrandTotal)} – ${formatINR(calc.maxPossibleGrandTotal)})\n`;
    message += `──────────────────────\n`;
    message += `📍 Visit *${showroomName}* with this quotation for customized fitting and bridal orders!`;
  }

  return message;
}
