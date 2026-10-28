export const roundRupee = (n: number): number => Math.round(n);

export interface GoldPriceConfig {
  goldRate22K: number; // in INR per gram, e.g. 7150
  goldRate24K: number; // in INR per gram, e.g. 7800
  goldRate18K: number; // in INR per gram, e.g. 5850
  wastagePercent: number; // e.g. 12%
  makingChargePerGram: number; // e.g. 450
  flatMakingCharge?: number;
  stoneWeightGrams?: number; // Stone deduction
  stoneCostFlat?: number; // Gemstone / Kundan flat charge
  gstPercent: number; // Standard 3%
  gstOnMakingOnly?: boolean; // Whether GST applies strictly to making charges
}

export interface PriceBreakdown {
  grossGrams: number;
  stoneWeightGrams: number;
  netGoldGrams: number;
  purity: "22K" | "24K" | "18K";
  goldRatePerGram: number;
  baseGoldCost: number;
  wastagePercent: number;
  wastageCost: number;
  makingCharges: number;
  stoneCost: number;
  taxableSubtotal: number;
  gstPercent: number;
  gstAmount: number;
  totalEstimatedPrice: number;
  gstOnMakingOnly?: boolean;
}

export const DEFAULT_GOLD_CONFIG: GoldPriceConfig = {
  goldRate22K: 7150, // Contemporary standard market rate per gram
  goldRate24K: 7800,
  goldRate18K: 5850,
  wastagePercent: 12.0, // Typical traditional bridal jewelry VA
  makingChargePerGram: 450,
  stoneWeightGrams: 0,
  stoneCostFlat: 0,
  gstPercent: 3.0, // Statutory 3% GST on jewelry
  gstOnMakingOnly: false,
};

export function calculateGoldPrice(
  grossGrams: number,
  purity: "22K" | "24K" | "18K" = "22K",
  customConfig: Partial<GoldPriceConfig> = {}
): PriceBreakdown {
  const config = { ...DEFAULT_GOLD_CONFIG, ...customConfig };

  const rate =
    purity === "24K"
      ? config.goldRate24K
      : purity === "18K"
      ? config.goldRate18K
      : config.goldRate22K;

  const stoneWeight = Math.min(grossGrams, Math.max(0, config.stoneWeightGrams || 0));
  const netGoldGrams = Math.max(0, grossGrams - stoneWeight);

  // Base Gold Cost is based strictly on Net Gold Weight
  const baseGoldCost = roundRupee(netGoldGrams * rate);
  
  // Wastage / VA (%) is calculated on Base Gold Cost
  const wastageCost = roundRupee(baseGoldCost * (config.wastagePercent / 100));

  // Making charges calculated per Gross Grams (traditional goldsmith practice) or flat
  const makingCharges = config.flatMakingCharge
    ? roundRupee(config.flatMakingCharge)
    : roundRupee(grossGrams * config.makingChargePerGram);

  const stoneCost = roundRupee(config.stoneCostFlat || 0);

  // GST Calculation: On full total or on Making Charges only
  let taxableSubtotal = 0;
  let gstAmount = 0;
  if (config.gstOnMakingOnly) {
    taxableSubtotal = makingCharges;
    gstAmount = roundRupee(makingCharges * (config.gstPercent / 100));
  } else {
    taxableSubtotal = baseGoldCost + wastageCost + makingCharges + stoneCost;
    gstAmount = roundRupee(taxableSubtotal * (config.gstPercent / 100));
  }

  const totalEstimatedPrice = baseGoldCost + wastageCost + makingCharges + stoneCost + gstAmount;

  return {
    grossGrams,
    stoneWeightGrams: stoneWeight,
    netGoldGrams: parseFloat(netGoldGrams.toFixed(3)),
    purity,
    goldRatePerGram: rate,
    baseGoldCost,
    wastagePercent: config.wastagePercent,
    wastageCost,
    makingCharges,
    stoneCost,
    taxableSubtotal,
    gstPercent: config.gstPercent,
    gstAmount,
    totalEstimatedPrice,
    gstOnMakingOnly: config.gstOnMakingOnly,
  };
}

export function calculateNetGoldWeight(
  grossGrams: number,
  stoneWeightGrams: number = 0
): number {
  return Math.max(0, parseFloat((grossGrams - Math.min(grossGrams, Math.max(0, stoneWeightGrams))).toFixed(3)));
}

export function formatINR(amount: number): string {
  const rounded = roundRupee(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rounded);
}

// Bilingual Labels Dictionary
export interface ReceiptLabels {
  estimateTitle: string;
  designLabel: string;
  grossWeight: string;
  stoneWeight: string;
  netWeight: string;
  ratePerGram: string;
  breakdownTitle: string;
  baseGoldCost: string;
  wastageVA: string;
  makingCharges: string;
  stoneCost: string;
  subtotal: string;
  gstLabel: string;
  totalEstPrice: string;
  footerNote: string;
  liveRateDisclaimer: string;
  oldGoldGross: string;
  oldGoldDeduction: string;
  oldGoldNet: string;
  oldGoldPurity: string;
  oldGoldTouch: string;
  oldGoldMeltLoss: string;
  oldGoldRate: string;
  oldGoldTotalCredit: string;
  netPayable: string;
  goldToGoldBalance: string;
}

export const RECEIPT_LABELS: Record<"en" | "te", ReceiptLabels> = {
  en: {
    estimateTitle: "Formal Goldsmith Estimate",
    designLabel: "Design / SKU",
    grossWeight: "Gross Total Weight",
    stoneWeight: "Stone Weight Deduction",
    netWeight: "Net Gold Weight",
    ratePerGram: "Live Gold Rate",
    breakdownTitle: "Price Breakdown Formula",
    baseGoldCost: "Base Gold Value",
    wastageVA: "Wastage / Value Addition (VA)",
    makingCharges: "Crafting / Making Charges",
    stoneCost: "Gemstone / Stone Charges",
    subtotal: "Taxable Subtotal",
    gstLabel: "GST (Statutory 3%)",
    totalEstPrice: "Total Estimated Price",
    footerNote: "Generated via SwarnaTry Goldsmith AR Platform",
    liveRateDisclaimer: "Prices subject to live bullion rates at store checkout.",
    oldGoldGross: "Old Gold Gross Weight",
    oldGoldDeduction: "Dust & Wax Deduction",
    oldGoldNet: "Net Meltable Gold",
    oldGoldPurity: "Touch / Purity Grade",
    oldGoldTouch: "Purity Touch %",
    oldGoldMeltLoss: "Melting Loss (%)",
    oldGoldRate: "Effective Exchange Rate",
    oldGoldTotalCredit: "Total Old Gold Trade-in Credit (-)",
    netPayable: "Net Balance Payable",
    goldToGoldBalance: "Gold-to-Gold Weight Balance",
  },
  te: {
    estimateTitle: "బంగారు నగల అంచనా రసీదు",
    designLabel: "డిజైన్ / కోడ్",
    grossWeight: "స్థూల బరువు (Gross Weight)",
    stoneWeight: "రాళ్ల బరువు మినహాయింపు (Stone)",
    netWeight: "నికర బంగారు బరువు (Net Gold)",
    ratePerGram: "ప్రస్తుత బంగారం ధర",
    breakdownTitle: "ధర గణన వివరాలు",
    baseGoldCost: "ప్రాథమిక బంగారం విలువ",
    wastageVA: "తరుగు / విలువ చేర్పు (VA)",
    makingCharges: "మజూరీ / తయారీ ఛార్జీలు",
    stoneCost: "రాళ్ల ధర (Gemstones)",
    subtotal: "పన్ను పరిధిలోని మొత్తం",
    gstLabel: "జీఎస్టీ (GST 3%)",
    totalEstPrice: "మొత్తం అంచనా ధర",
    footerNote: "స్వర్ణట్రై (SwarnaTry) డిజిటల్ ప్లాట్‌ఫారమ్ ద్వారా రూపొందించబడింది",
    liveRateDisclaimer: "దుకాణం వద్ద లైవ్ బులియన్ మార్కెట్ ధరల ఆధారంగా ధరలు నిర్ణయించబడతాయి.",
    oldGoldGross: "పాత బంగారం స్థూల బరువు",
    oldGoldDeduction: "దుమ్ము / మైనం తగ్గింపు",
    oldGoldNet: "నికర కరిగే బంగారం",
    oldGoldPurity: "స్వచ్ఛత / టచ్ రకం",
    oldGoldTouch: "స్వచ్ఛత టచ్ %",
    oldGoldMeltLoss: "కరుగుదల తగ్గింపు (%)",
    oldGoldRate: "ఎక్స్ఛేంజ్ ధర / గ్రాము",
    oldGoldTotalCredit: "పాత బంగారం ఎక్స్ఛేంజ్ విలువ (-)",
    netPayable: "నికర చెల్లించవలసిన మొత్తం",
    goldToGoldBalance: "బంగారం బరువు సంతులనం",
  },
};

// ==========================================
// Phase 3C: Old Gold Exchange & Melt Engine
// ==========================================

export type OldGoldPurityType =
  | "hallmark-916" // 22K 916 Hallmark (0% melting deduction, 100% 22K rate)
  | "kdm-soldered" // Non-916 KDM Soldered (e.g. 5% melting loss)
  | "custom-touch" // Machine touch % test (e.g. 85%, 88%)
  | "18k"          // 18K (75% touch)
  | "24k";         // 24K pure coin/bar (99.9% touch)

export interface OldGoldItem {
  id: string;
  description: string;
  grossGrams: number;
  dustDeductionGrams: number;
  netGrams: number;
  purityType: OldGoldPurityType;
  touchPercent: number; // e.g. 91.6 for 22K, 85 for custom, 75 for 18k, 99.9 for 24k
  meltingLossPercent: number; // e.g. 0% for 916, 5% for soldered
  exchangePenaltyPerGram: number; // e.g. ₹50–₹150 deduction from current rate
  effectiveRatePerGram: number; // calculated exchange rate applied per net gram
  fineGoldGrams: number; // netGrams * (touchPercent / 100) * (1 - meltingLoss/100)
  equivalent22KGrams: number; // fineGoldGrams / 0.916
  totalValue: number; // netGrams * effectiveRatePerGram
}

export interface OldGoldExchangeSummary {
  items: OldGoldItem[];
  itemBreakdown?: OldGoldItem[]; // alias
  totalGrossGrams: number;
  totalDustDeductionGrams: number;
  totalNetGrams: number;
  totalEquivalent22KGrams: number;
  totalEq22KGrams?: number; // alias
  totalExchangeValue: number;
  totalTradeInValue?: number; // alias
  netPayableAfterExchange: number; // newTotal - totalExchangeValue (clamped to min 0)
  netBalancePayable?: number; // alias
  customerRefundAmount: number; // if old gold value exceeds new purchase
  creditCarryForward: number; // credit carry forward balance when trade-in > purchase
  goldWeightBalanceGrams: number; // newNetGrams - totalEquivalent22KGrams
}

export interface OldGoldPurityPreset {
  id: OldGoldPurityType;
  label: string;
  teluguLabel: string;
  defaultTouch: number;
  defaultMeltingLoss: number;
  defaultPenalty: number;
}

export const OLD_GOLD_PURITY_PRESETS: Record<
  OldGoldPurityType,
  { label: string; teluguLabel: string; defaultTouch: number; defaultMeltingLoss: number; defaultPenalty: number }
> = {
  "hallmark-916": {
    label: "22K 916 Hallmark (Zero Melt Loss)",
    teluguLabel: "22K 916 హాల్‌మార్క్ (కరుగుదల తగ్గింపు లేదు)",
    defaultTouch: 91.6,
    defaultMeltingLoss: 0,
    defaultPenalty: 75,
  },
  "kdm-soldered": {
    label: "Traditional / KDM Soldered (5% Melt Deduction)",
    teluguLabel: "సాంప్రదాయ / కేడీఎం సాల్డర్ (5% కరుగుదల తగ్గింపు)",
    defaultTouch: 88.0,
    defaultMeltingLoss: 5,
    defaultPenalty: 100,
  },
  "custom-touch": {
    label: "Spectrometer / Touch Machine Test",
    teluguLabel: "టచ్ మెషిన్ టెస్ట్ (కస్టమ్ స్వచ్ఛత %)",
    defaultTouch: 85.0,
    defaultMeltingLoss: 0,
    defaultPenalty: 100,
  },
  "18k": {
    label: "18K Gold (75.0% Touch)",
    teluguLabel: "18 క్యారెట్ల బంగారం (75% టచ్)",
    defaultTouch: 75.0,
    defaultMeltingLoss: 2,
    defaultPenalty: 100,
  },
  "24k": {
    label: "24K Fine Gold Coin / Bar (99.9% Touch)",
    teluguLabel: "24K స్వచ్ఛమైన బంగారు బిళ్ళ / నాణెం (99.9%)",
    defaultTouch: 99.9,
    defaultMeltingLoss: 0,
    defaultPenalty: 50,
  },
};

export const OLD_GOLD_PURITY_PRESETS_ARRAY: OldGoldPurityPreset[] = [
  { id: "hallmark-916", ...OLD_GOLD_PURITY_PRESETS["hallmark-916"] },
  { id: "kdm-soldered", ...OLD_GOLD_PURITY_PRESETS["kdm-soldered"] },
  { id: "custom-touch", ...OLD_GOLD_PURITY_PRESETS["custom-touch"] },
  { id: "18k", ...OLD_GOLD_PURITY_PRESETS["18k"] },
  { id: "24k", ...OLD_GOLD_PURITY_PRESETS["24k"] },
];

/**
 * Calculates a single Old Gold Item exchange value with dust deduction,
 * touch percentage, and melting loss.
 */
export function calculateOldGoldItem(
  params: {
    id: string;
    description: string;
    grossGrams: number;
    dustDeductionGrams: number;
    purityType: OldGoldPurityType;
    customTouchPercent?: number;
    customMeltingLossPercent?: number;
    customPenaltyPerGram?: number;
  },
  live22KRate: number,
  live24KRate: number
): OldGoldItem {
  const preset = OLD_GOLD_PURITY_PRESETS[params.purityType];
  const touchPercent =
    params.customTouchPercent !== undefined
      ? params.customTouchPercent
      : preset.defaultTouch;
  const meltingLossPercent =
    params.customMeltingLossPercent !== undefined
      ? params.customMeltingLossPercent
      : preset.defaultMeltingLoss;
  const exchangePenaltyPerGram =
    params.customPenaltyPerGram !== undefined
      ? params.customPenaltyPerGram
      : preset.defaultPenalty;

  const grossGrams = Math.max(0, params.grossGrams);
  const dustDeductionGrams = Math.min(grossGrams, Math.max(0, params.dustDeductionGrams));
  const netGrams = Math.max(0, grossGrams - dustDeductionGrams);

  // Compute 24K Pure Fine Gold equivalent
  const netTouchFactor = (touchPercent / 100) * (1 - meltingLossPercent / 100);
  const fineGoldGrams = netGrams * netTouchFactor;
  const equivalent22KGrams = fineGoldGrams / 0.916;

  // Shop exchange rate per gram: 22K base minus penalty, scaled by purity touch ratio
  const adjustedBaseRate = Math.max(0, live22KRate - exchangePenaltyPerGram);
  const effectiveRatePerGram = Math.round(adjustedBaseRate * (touchPercent / 91.6) * (1 - meltingLossPercent / 100));
  const totalValue = Math.round(netGrams * effectiveRatePerGram);

  return {
    id: params.id,
    description: params.description,
    grossGrams,
    dustDeductionGrams,
    netGrams,
    purityType: params.purityType,
    touchPercent,
    meltingLossPercent,
    exchangePenaltyPerGram,
    effectiveRatePerGram,
    fineGoldGrams,
    equivalent22KGrams,
    totalValue,
  };
}

/**
 * Computes the aggregate old gold exchange summary and calculates
 * the net balance payable against new purchase estimates.
 */
export function calculateOldGoldExchange(
  items: OldGoldItem[],
  newPurchaseGrossTotal: number = 0,
  newPurchaseNetGrams: number = 0
): OldGoldExchangeSummary {
  let totalGrossGrams = 0;
  let totalDustDeductionGrams = 0;
  let totalNetGrams = 0;
  let totalEquivalent22KGrams = 0;
  let totalExchangeValue = 0;

  items.forEach((item) => {
    totalGrossGrams += item.grossGrams;
    totalDustDeductionGrams += item.dustDeductionGrams;
    totalNetGrams += item.netGrams;
    totalEquivalent22KGrams += item.equivalent22KGrams;
    totalExchangeValue += item.totalValue;
  });

  const netPayableAfterExchange = Math.max(0, roundRupee(newPurchaseGrossTotal - totalExchangeValue));
  const creditCarryForward = totalExchangeValue > newPurchaseGrossTotal ? roundRupee(totalExchangeValue - newPurchaseGrossTotal) : 0;
  const customerRefundAmount = creditCarryForward;
  const goldWeightBalanceGrams = Number((newPurchaseNetGrams - totalEquivalent22KGrams).toFixed(3));

  return {
    items,
    itemBreakdown: items,
    totalGrossGrams: Number(totalGrossGrams.toFixed(3)),
    totalDustDeductionGrams: Number(totalDustDeductionGrams.toFixed(3)),
    totalNetGrams: Number(totalNetGrams.toFixed(3)),
    totalEquivalent22KGrams: Number(totalEquivalent22KGrams.toFixed(3)),
    totalEq22KGrams: Number(totalEquivalent22KGrams.toFixed(3)),
    totalExchangeValue: roundRupee(totalExchangeValue),
    totalTradeInValue: roundRupee(totalExchangeValue),
    netPayableAfterExchange,
    netBalancePayable: netPayableAfterExchange,
    customerRefundAmount,
    creditCarryForward,
    goldWeightBalanceGrams,
  };
}

export function generateWhatsAppQuote(
  designId: string,
  designName: string,
  breakdown: PriceBreakdown,
  showroomName: string = "SwarnaTry Heritage Jewellers",
  lang: "en" | "te" = "en"
): string {
  const lbl = RECEIPT_LABELS[lang];

  let message = "";
  if (lang === "te") {
    message = `✨ *${showroomName}* — బంగారు ధర అంచనా రసీదు
━━━━━━━━━━━━━━━━━━━
🏷️ *${lbl.designLabel}:* ${designName} (${designId})
⚖️ *${lbl.grossWeight}:* ${breakdown.grossGrams}g (${breakdown.purity} హాల్‌మార్క్)`;

    if (breakdown.stoneWeightGrams > 0) {
      message += `\n💎 *${lbl.stoneWeight}:* -${breakdown.stoneWeightGrams}g
✨ *${lbl.netWeight}:* ${breakdown.netGoldGrams}g`;
    }

    message += `\n📈 *${lbl.ratePerGram}:* ${formatINR(breakdown.goldRatePerGram)}/గ్రాము

📋 *${lbl.breakdownTitle}:*
• ${lbl.baseGoldCost}: ${formatINR(breakdown.baseGoldCost)}
• ${lbl.wastageVA} (${breakdown.wastagePercent}%): ${formatINR(breakdown.wastageCost)}
• ${lbl.makingCharges}: ${formatINR(breakdown.makingCharges)}`;

    if (breakdown.stoneCost > 0) {
      message += `\n• ${lbl.stoneCost}: ${formatINR(breakdown.stoneCost)}`;
    }

    message += `\n• ${lbl.gstLabel}: ${formatINR(breakdown.gstAmount)}

💰 *${lbl.totalEstPrice}:* ${formatINR(breakdown.totalEstimatedPrice)}
━━━━━━━━━━━━━━━━━━━
_${lbl.footerNote}_
*${lbl.liveRateDisclaimer}*`;
  } else {
    message = `✨ *${showroomName}* — Estimate Quote
━━━━━━━━━━━━━━━━━━━
🏷️ *Design:* ${designName} (${designId})
⚖️ *Gross Weight:* ${breakdown.grossGrams}g (${breakdown.purity} Hallmarked)`;

    if (breakdown.stoneWeightGrams > 0) {
      message += `\n💎 *Stone Deduction:* -${breakdown.stoneWeightGrams}g
✨ *Net Gold Weight:* ${breakdown.netGoldGrams}g`;
    }

    message += `\n📈 *Gold Rate:* ${formatINR(breakdown.goldRatePerGram)}/gram

📋 *Price Breakdown:*
• Base Gold Value: ${formatINR(breakdown.baseGoldCost)}
• Wastage (VA ${breakdown.wastagePercent}%): ${formatINR(breakdown.wastageCost)}
• Crafting / Making: ${formatINR(breakdown.makingCharges)}`;

    if (breakdown.stoneCost > 0) {
      message += `\n• Gemstone / Stone Charges: ${formatINR(breakdown.stoneCost)}`;
    }

    message += `\n• GST (${breakdown.gstPercent}%): ${formatINR(breakdown.gstAmount)}

💰 *TOTAL ESTIMATED PRICE:* ${formatINR(breakdown.totalEstimatedPrice)}
━━━━━━━━━━━━━━━━━━━
_${lbl.footerNote}_
*${lbl.liveRateDisclaimer}*`;
  }

  // Ensure message stays safely under 1800 chars
  if (message.length > 1750) {
    message = message.substring(0, 1750) + "\n...";
  }

  return encodeURIComponent(message);
}

export function sanitizePhoneNumber(phone: string): string {
  const digits = (phone || "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.substring(1);
  return digits;
}
