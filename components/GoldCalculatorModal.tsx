"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Scale,
  Percent,
  Hammer,
  Receipt,
  Share2,
  Camera,
  UploadCloud,
  Check,
  ShieldCheck,
  Sparkles,
  Printer,
  Gem,
  Languages,
  QrCode,
  Coins,
  ClipboardList,
  Users,
  PiggyBank,
  Heart,
} from "lucide-react";
import { JewelryItem, getJewelryImageUri } from "@/data/mockJewelryCatalog";
import {
  calculateGoldPrice,
  formatINR,
  generateWhatsAppQuote,
  PriceBreakdown,
  GoldPriceConfig,
  RECEIPT_LABELS,
  OldGoldItem,
  OldGoldExchangeSummary,
  calculateOldGoldItem,
  calculateOldGoldExchange,
  roundRupee,
} from "@/lib/goldMath";
import { OldGoldExchangePanel } from "@/components/OldGoldExchangePanel";
import { useLanguage } from "@/context/LanguageContext";
import { GoldSchemePlanner } from "@/components/GoldSchemePlanner";
import { FamilyVoteModal } from "@/components/FamilyVoteModal";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";

interface GoldCalculatorModalProps {
  item: JewelryItem | null;
  isOpen: boolean;
  onClose: () => void;
  goldRate22K: number;
  goldRate24K: number;
  showroomName: string;
  onSelectForLiveAR: (item: JewelryItem) => void;
  onSelectForPhotoMatch: (item: JewelryItem) => void;
  onOpenShareModal?: (item: JewelryItem) => void;
  onOpenPrintEstimate?: (estimateData: any) => void;
  onBookOrder?: (orderData: any) => void;
}

export const GoldCalculatorModal: React.FC<GoldCalculatorModalProps> = ({
  item,
  isOpen,
  onClose,
  goldRate22K,
  goldRate24K,
  showroomName,
  onSelectForLiveAR,
  onSelectForPhotoMatch,
  onOpenShareModal,
  onOpenPrintEstimate,
  onBookOrder,
}) => {
  if (!isOpen || !item) return null;

  const [selectedGrams, setSelectedGrams] = useState<number>(item.defaultGrams);
  const [selectedPurity, setSelectedPurity] = useState<"22K" | "24K" | "18K">(
    item.purity || "22K"
  );
  const [wastagePercent, setWastagePercent] = useState<number>(
    item.wastagePercent || 12.5
  );
  const [makingCharge, setMakingCharge] = useState<number>(
    item.makingChargePerGram || 450
  );
  const [stoneWeight, setStoneWeight] = useState<number>(
    item.stoneWeightGrams || 0
  );
  const [stoneCost, setStoneCost] = useState<number>(item.stoneCostFlat || 0);
  const { language, setLanguage, isTe } = useLanguage();
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [oldGold, setOldGold] = useState<{
    items: OldGoldItem[];
    totalTradeInValue: number;
  } | null>(null);

  // Tabs & Modals State (Phase 6)
  const [calcTab, setCalcTab] = useState<"calculator" | "exchange" | "scheme">("calculator");
  const [isFamilyVoteOpen, setIsFamilyVoteOpen] = useState<boolean>(false);
  const [isLeadCaptureOpen, setIsLeadCaptureOpen] = useState<boolean>(false);

  // Sync state when item changes
  useEffect(() => {
    if (item) {
      setSelectedGrams(item.defaultGrams);
      setWastagePercent(item.wastagePercent);
      setMakingCharge(item.makingChargePerGram);
      setSelectedPurity(item.purity || "22K");
      setStoneWeight(item.stoneWeightGrams || 0);
      setStoneCost(item.stoneCostFlat || 0);
    }
  }, [item]);

  // Compute live breakdown
  const config: Partial<GoldPriceConfig> = {
    goldRate22K,
    goldRate24K,
    goldRate18K: Math.round(goldRate24K * 0.75),
    wastagePercent,
    makingChargePerGram: makingCharge,
    stoneWeightGrams: stoneWeight,
    stoneCostFlat: stoneCost,
    gstPercent: 3.0,
  };

  const breakdown: PriceBreakdown = calculateGoldPrice(
    selectedGrams,
    selectedPurity,
    config
  );

  // Recalculate old gold items whenever live rate or items change
  const liveOldGoldItems: OldGoldItem[] = (oldGold?.items || []).map((it) =>
    calculateOldGoldItem(
      {
        id: it.id,
        description: it.description,
        grossGrams: it.grossGrams,
        dustDeductionGrams: it.dustDeductionGrams,
        purityType: it.purityType,
        customTouchPercent: it.touchPercent,
        customMeltingLossPercent: it.meltingLossPercent,
        customPenaltyPerGram: it.exchangePenaltyPerGram,
      },
      goldRate22K,
      goldRate24K
    )
  );

  const oldGoldSummary = calculateOldGoldExchange(
    liveOldGoldItems,
    breakdown.totalEstimatedPrice,
    breakdown.netGoldGrams
  );

  const currentTradeInValue = oldGold ? oldGoldSummary.totalExchangeValue : 0;
  const netPayable = Math.max(0, breakdown.totalEstimatedPrice - currentTradeInValue);
  const creditCarryForward = currentTradeInValue > breakdown.totalEstimatedPrice
    ? currentTradeInValue - breakdown.totalEstimatedPrice
    : 0;

  const handleApplyOldGold = (tradeInValue: number, summary: OldGoldExchangeSummary) => {
    if (!summary.items || summary.items.length === 0) {
      setOldGold(null);
    } else {
      setOldGold({
        items: summary.items,
        totalTradeInValue: summary.totalExchangeValue,
      });
    }
  };

  const labels = RECEIPT_LABELS[language];

  // Thickness / Physical Density note based on selected gram weight within its range
  const gramPercent =
    item.maxGrams > item.minGrams
      ? (selectedGrams - item.minGrams) / (item.maxGrams - item.minGrams)
      : 0.5;

  let thicknessNote = "";
  let thicknessBadge = "";
  if (gramPercent <= 0.3) {
    thicknessNote =
      language === "te"
        ? "తేలికపాటి సౌకర్యవంతమైన డిజైన్: సుదీర్ఘ వేడుకలలో సౌకర్యంగా ధరించడానికి అనుకూలం."
        : "Lightweight Comfort Fit: Hollow/lighter core calibration. Ideal for extended festive wear with minimal fatigue.";
    thicknessBadge =
      language === "te" ? "తేలికపాటి బ్రైడల్ ఫిట్" : "Lightweight / Everyday Bridal";
  } else if (gramPercent <= 0.7) {
    thicknessNote =
      language === "te"
        ? "ప్రామాణిక ఘనమైన నగల నిర్మాణం: సాంప్రదాయ సాంద్రత మరియు దృఢమైన నిర్మాణం."
        : "Standard Heritage Solid: Traditional density with reinforced structural rigidity and balanced gold thickness.";
    thicknessBadge =
      language === "te" ? "సాంప్రదాయ ఘనమైన ఫిట్" : "Standard Traditional Solid";
  } else {
    thicknessNote =
      language === "te"
        ? "ఘనమైన పురాతన నక్షి నిర్మాణం: గరిష్ట లోతు మరియు తరతరాల నాణ్యతతో కూడిన హెవీ వెయిట్."
        : "Heirloom Grand Antique: Ultra-dense solid Nakshi gold core with maximum embossed depth and heirloom longevity.";
    thicknessBadge =
      language === "te" ? "భారీ హెరిటేజ్ వెయిట్" : "Grand Heirloom Heavyweight";
  }

  const handleShareWhatsApp = () => {
    const encoded = generateWhatsAppQuote(
      item.id,
      language === "te" && item.teluguName ? item.teluguName : item.name,
      breakdown,
      showroomName,
      language
    );
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const handleCopyQuote = () => {
    const text = decodeURIComponent(
      generateWhatsAppQuote(
        item.id,
        language === "te" && item.teluguName ? item.teluguName : item.name,
        breakdown,
        showroomName,
        language
      )
    );
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const handlePrintQuote = () => {
    if (onOpenPrintEstimate) {
      onClose();
      onOpenPrintEstimate({
        items: [
          {
            id: item.id,
            name: item.name,
            teluguName: item.teluguName,
            category: item.categoryLabel,
            grossGrams: breakdown.grossGrams,
            netGrams: breakdown.netGoldGrams,
            stoneWeight: breakdown.stoneWeightGrams,
            purity: breakdown.purity,
            rate: breakdown.goldRatePerGram,
            baseGoldCost: breakdown.baseGoldCost,
            wastagePercent: breakdown.wastagePercent,
            wastageCost: breakdown.wastageCost,
            makingCharges: breakdown.makingCharges,
            stoneCost: breakdown.stoneCost,
            gstAmount: breakdown.gstAmount,
            totalEstimatedPrice: breakdown.totalEstimatedPrice,
            imageUri: getJewelryImageUri(item),
          },
        ],
        oldGoldSummary: oldGoldSummary.totalExchangeValue > 0 ? oldGoldSummary : null,
      });
    } else {
      window.print();
    }
  };

  const handleBookOrder = () => {
    if (onBookOrder) {
      onClose();
      onBookOrder({
        items: [
          {
            id: item.id,
            name: item.name,
            teluguName: item.teluguName,
            category: item.categoryLabel,
            grams: breakdown.grossGrams,
            purity: breakdown.purity,
            imageUri: getJewelryImageUri(item),
            price: breakdown.totalEstimatedPrice,
          },
        ],
        totalGrossGrams: breakdown.grossGrams,
        totalNetGrams: breakdown.netGoldGrams,
        grandTotalEstimate: breakdown.totalEstimatedPrice,
        advanceCashPaid: Math.round(breakdown.totalEstimatedPrice * 0.25),
        advanceOldGoldGrams: oldGoldSummary ? oldGoldSummary.totalNetGrams : 0,
        balancePayable: oldGoldSummary && oldGoldSummary.totalExchangeValue > 0 ? oldGoldSummary.netPayableAfterExchange : breakdown.totalEstimatedPrice,
        customNotes: `Custom order for ${item.name} (${breakdown.purity} Gold, Gross: ${breakdown.grossGrams}g, Net: ${breakdown.netGoldGrams}g).`,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-obsidian-900 border border-gold-subtle rounded-3xl shadow-gold-glow-lg overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 border-b border-gold-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-300">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  {labels.estimateTitle}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                  100% Price Transparency
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-cinzel text-ivory">
                {language === "te" && item.teluguName ? item.teluguName : item.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Bilingual Toggle Button */}
            <div className="flex items-center bg-obsidian-950 p-1 rounded-xl border border-gold-900/60 text-xs">
              <Languages className="w-3.5 h-3.5 text-gold-400 ml-1.5 mr-1" />
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  language === "en"
                    ? "bg-gold-500 text-obsidian-950 font-bold"
                    : "text-ivory-muted hover:text-ivory"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("te")}
                className={`px-2 py-0.5 rounded-lg transition-colors ${
                  language === "te"
                    ? "bg-gold-500 text-obsidian-950 font-bold"
                    : "text-ivory-muted hover:text-ivory"
                }`}
              >
                తెలుగు
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-ivory-muted hover:text-ivory hover:bg-obsidian-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Phase 6) */}
        <div className="flex border-b border-gold-900/60 bg-obsidian-950 text-xs font-medium">
          <button
            type="button"
            onClick={() => setCalcTab("calculator")}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-2 border-b-2 ${
              calcTab === "calculator"
                ? "border-gold-500 text-gold-300 font-bold bg-gold-950/20"
                : "border-transparent text-ivory-muted hover:text-ivory"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{language === "te" ? "ధర అంచనా & వివరాలు" : "Live Price Estimate"}</span>
          </button>

          <button
            type="button"
            onClick={() => setCalcTab("exchange")}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-2 border-b-2 ${
              calcTab === "exchange"
                ? "border-gold-500 text-gold-300 font-bold bg-gold-950/20"
                : "border-transparent text-ivory-muted hover:text-ivory"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{language === "te" ? "పాత బంగారం ఎక్స్ఛేంజ్" : "Old Gold Exchange"}</span>
            {oldGold && oldGold.items.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCalcTab("scheme")}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-2 border-b-2 ${
              calcTab === "scheme"
                ? "border-gold-500 text-gold-300 font-bold bg-gold-950/20"
                : "border-transparent text-ivory-muted hover:text-ivory"
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>{language === "te" ? "11+1 గోల్డ్ స్కీమ్" : "11-Month Gold Scheme"}</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
              0% VA
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {calcTab === "scheme" ? (
            <GoldSchemePlanner
              item={item}
              targetGrams={selectedGrams}
              goldRate22K={goldRate22K}
              showroomName={showroomName}
              onEnroll={() => setCalcTab("calculator")}
            />
          ) : calcTab === "exchange" ? (
            <OldGoldExchangePanel
              goldRate22K={goldRate22K}
              goldRate24K={goldRate24K}
              newPurchaseTotal={breakdown.totalEstimatedPrice}
              newPurchaseNetGrams={breakdown.netGoldGrams}
              exchangeItems={liveOldGoldItems}
              onChangeItems={(newItems) => {
                if (newItems.length === 0) {
                  setOldGold(null);
                } else {
                  const summary = calculateOldGoldExchange(
                    newItems,
                    breakdown.totalEstimatedPrice,
                    breakdown.netGoldGrams
                  );
                  setOldGold({
                    items: newItems,
                    totalTradeInValue: summary.totalExchangeValue,
                  });
                }
              }}
              onApplyToCalculator={handleApplyOldGold}
              language={language}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Visual Preview & Craftsmanship specs */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square w-full rounded-2xl bg-gradient-to-b from-obsidian-950 to-obsidian-900 border border-gold-900/60 p-6 flex flex-col items-center justify-center overflow-hidden group shadow-inner-gold">
                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-obsidian-950/80 border border-gold-500/30 text-gold-300 font-semibold">
                    {item.id}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-ruby-950/80 border border-ruby-500/40 text-ruby-200">
                    {item.style} Craft
                  </span>
                </div>

                {/* Scalable Vector / Image Preview */}
                <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  {item.svgContent.trim().startsWith("<svg") ? (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: item.svgContent }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.svgContent}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]"
                    />
                  )}
                </div>

                <div className="absolute bottom-3 inset-x-3 text-center">
                  <div className="text-[11px] text-ivory-muted bg-obsidian-950/90 py-1.5 px-3 rounded-lg border border-gold-subtle">
                    {item.craftsmanshipNote}
                  </div>
                </div>
              </div>

              {/* Gemstone and Hallmarking details */}
              <div className="p-3.5 rounded-xl bg-obsidian-950/60 border border-gold-900/60 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-gold-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>BIS 916 Hallmark & Gemstone Specifications</span>
                </div>
                <p className="text-ivory-muted text-[11px] leading-relaxed">
                  {item.gemstones}
                </p>
              </div>

              {/* Action Buttons to Try-On right away */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onSelectForLiveAR(item);
                  }}
                  className="btn-gold-primary py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Live AR Try-On</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onSelectForPhotoMatch(item);
                  }}
                  className="btn-gold-secondary py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Photo Match</span>
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Sliders & Live Pricing Formula */}
            <div className="lg:col-span-7 space-y-5">
              {/* Purity Selector */}
              <div className="p-4 rounded-xl bg-obsidian-950/80 border border-gold-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-ivory uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                    <span>Gold Purity Standard:</span>
                  </label>
                  <span className="text-xs text-gold-300 font-mono">
                    Rate: {formatINR(breakdown.goldRatePerGram)}/g
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(["22K", "24K", "18K"] as const).map((purity) => (
                    <button
                      key={purity}
                      onClick={() => setSelectedPurity(purity)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                        selectedPurity === purity
                          ? "bg-gold-500/20 border-gold-400 text-gold-200 font-semibold shadow-gold-glow"
                          : "bg-obsidian-900 border-gold-900/60 text-ivory-muted hover:border-gold-700"
                      }`}
                    >
                      {purity === "22K"
                        ? "22K (916 KDM)"
                        : purity === "24K"
                        ? "24K (Pure Gold)"
                        : "18K (Studded/Diamond)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight Slider (Gross Grams) */}
              <div className="p-4 rounded-xl bg-obsidian-950/80 border border-gold-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-gold-400" />
                    <span className="text-xs font-semibold text-ivory uppercase tracking-wider">
                      {labels.grossWeight}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-cinzel text-gold-200">
                      {selectedGrams.toFixed(1)}
                    </span>
                    <span className="text-xs text-gold-400">Grams</span>
                  </div>
                </div>

                <input
                  type="range"
                  min={item.minGrams}
                  max={item.maxGrams}
                  step={0.5}
                  value={selectedGrams}
                  onChange={(e) => setSelectedGrams(parseFloat(e.target.value))}
                  className="w-full"
                />

                <div className="flex justify-between text-[11px] text-ivory-muted font-mono">
                  <span>Min: {item.minGrams}g</span>
                  <span className="text-gold-300">Default: {item.defaultGrams}g</span>
                  <span>Max: {item.maxGrams}g</span>
                </div>

                {/* Net Gold Weight & Stone Deduction Callout */}
                {breakdown.stoneWeightGrams > 0 && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <Gem className="w-3.5 h-3.5" />
                      <span>{labels.stoneWeight}:</span>
                      <span className="font-mono font-bold">
                        -{breakdown.stoneWeightGrams}g
                      </span>
                    </div>

                    <div className="text-emerald-200 font-semibold font-mono">
                      {labels.netWeight}: {breakdown.netGoldGrams}g
                    </div>
                  </div>
                )}

                {/* Thickness / Physical Note */}
                <div className="pt-1 border-t border-gold-900/40">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-gold-500/15 text-gold-300 border border-gold-500/30">
                    {thicknessBadge}
                  </span>
                  <p className="text-[11px] text-ivory-muted mt-1">
                    {thicknessNote}
                  </p>
                </div>
              </div>

              {/* Goldsmith Configs: Wastage (VA) & Making Charges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Wastage / Value Addition */}
                <div className="p-3.5 rounded-xl bg-obsidian-950/80 border border-gold-subtle space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-ivory-muted flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-gold-400" />
                      <span>{labels.wastageVA}:</span>
                    </label>
                    <span className="font-semibold text-gold-300">
                      {wastagePercent.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={20}
                    step={0.5}
                    value={wastagePercent}
                    onChange={(e) =>
                      setWastagePercent(parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="text-[10px] text-ivory-muted flex justify-between">
                    <span>8% (Plain)</span>
                    <span className="text-gold-400/90 font-medium">
                      Cost: {formatINR(breakdown.wastageCost)}
                    </span>
                    <span>20% (Antique)</span>
                  </div>
                </div>

                {/* Making Charges */}
                <div className="p-3.5 rounded-xl bg-obsidian-950/80 border border-gold-subtle space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="text-ivory-muted flex items-center gap-1">
                      <Hammer className="w-3.5 h-3.5 text-gold-400" />
                      <span>{labels.makingCharges}:</span>
                    </label>
                    <span className="font-semibold text-gold-300">
                      {formatINR(makingCharge)}/g
                    </span>
                  </div>
                  <input
                    type="range"
                    min={300}
                    max={750}
                    step={25}
                    value={makingCharge}
                    onChange={(e) =>
                      setMakingCharge(parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="text-[10px] text-ivory-muted flex justify-between">
                    <span>₹300/g</span>
                    <span className="text-gold-400/90 font-medium">
                      Total: {formatINR(breakdown.makingCharges)}
                    </span>
                    <span>₹750/g</span>
                  </div>
                </div>
              </div>

              {/* Complete Breakdown Formula Table */}
              <div className="rounded-xl bg-gradient-to-b from-obsidian-950 to-obsidian-900 border border-gold-500/30 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gold-900/60 pb-2">
                  <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider">
                    {labels.breakdownTitle}
                  </span>
                  <span className="text-[11px] text-ivory-muted">
                    {labels.liveRateDisclaimer}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-ivory-muted">
                    <span>
                      {labels.baseGoldCost} ({breakdown.netGoldGrams}g Net ×{" "}
                      {formatINR(breakdown.goldRatePerGram)}):
                    </span>
                    <span className="text-ivory font-mono">
                      {formatINR(breakdown.baseGoldCost)}
                    </span>
                  </div>

                  <div className="flex justify-between text-ivory-muted">
                    <span>
                      {labels.wastageVA} ({breakdown.wastagePercent}%):
                    </span>
                    <span className="text-ivory font-mono">
                      + {formatINR(breakdown.wastageCost)}
                    </span>
                  </div>

                  <div className="flex justify-between text-ivory-muted">
                    <span>
                      {labels.makingCharges} ({breakdown.grossGrams}g × ₹
                      {makingCharge}):
                    </span>
                    <span className="text-ivory font-mono">
                      + {formatINR(breakdown.makingCharges)}
                    </span>
                  </div>

                  {breakdown.stoneCost > 0 && (
                    <div className="flex justify-between text-ivory-muted">
                      <span>{labels.stoneCost}:</span>
                      <span className="text-ivory font-mono">
                        + {formatINR(breakdown.stoneCost)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-ivory-muted border-t border-dashed border-gold-900/60 pt-1.5">
                    <span>{labels.subtotal}:</span>
                    <span className="text-ivory font-mono font-medium">
                      {formatINR(breakdown.taxableSubtotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-ivory-muted">
                    <span>{labels.gstLabel}:</span>
                    <span className="text-ivory font-mono">
                      + {formatINR(breakdown.gstAmount)}
                    </span>
                  </div>
                </div>

                {/* Grand Total Estimated Price & Old Gold Net Settlement */}
                <div className="pt-2.5 border-t border-gold-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase text-gold-400 block">
                        {labels.totalEstPrice}:
                      </span>
                      <span className="text-[11px] text-ivory-muted">
                        {language === "te"
                          ? "ఎటువంటి దాగివున్న ఛార్జీలు లేవు"
                          : "Zero hidden showroom charges"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xl sm:text-2xl font-bold font-cinzel text-gold-bright tracking-tight">
                        {formatINR(breakdown.totalEstimatedPrice)}
                      </span>
                    </div>
                  </div>

                  {oldGold && currentTradeInValue > 0 && (
                    <div className="pt-2 border-t border-emerald-500/30 space-y-1 text-xs">
                      <div className="flex justify-between text-emerald-300 font-medium">
                        <span>
                          {language === "te"
                            ? `పాత బంగారం మార్పిడి తగ్గింపు (${oldGoldSummary.items.length} వస్తువులు):`
                            : `Old Gold Trade-in Credit (${oldGoldSummary.items.length} items):`}
                        </span>
                        <span className="font-mono">
                          - {formatINR(currentTradeInValue)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-sm font-bold">
                        <span className="text-ivory">
                          {language === "te" ? "చెల్లించవలసిన నికర మొత్తం:" : "Net Balance Payable:"}
                        </span>
                        <span className="text-emerald-400 font-cinzel text-xl font-bold">
                          {formatINR(netPayable)}
                        </span>
                      </div>

                      {creditCarryForward > 0 && (
                        <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-lg p-2 text-center text-emerald-200 text-xs font-semibold animate-in fade-in">
                          ✨ +{formatINR(creditCarryForward)} credit balance (carry forward)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Old Gold Trade-In Panel (Phase 3C) */}
              <OldGoldExchangePanel
                goldRate22K={goldRate22K}
                goldRate24K={goldRate24K}
                newPurchaseTotal={breakdown.totalEstimatedPrice}
                newPurchaseNetGrams={breakdown.netGoldGrams}
                exchangeItems={liveOldGoldItems}
                onChangeItems={(newItems) => {
                  if (newItems.length === 0) {
                    setOldGold(null);
                  } else {
                    const summary = calculateOldGoldExchange(
                      newItems,
                      breakdown.totalEstimatedPrice,
                      breakdown.netGoldGrams
                    );
                    setOldGold({
                      items: newItems,
                      totalTradeInValue: summary.totalExchangeValue,
                    });
                  }
                }}
                onApplyToCalculator={handleApplyOldGold}
                language={language}
              />

              {/* Action Toolbar: WhatsApp Quote & Copy & QR & Print & Book Order */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {/* Feature C: Ask Family Vote Button */}
                <button
                  type="button"
                  onClick={() => setIsFamilyVoteOpen(true)}
                  className="bg-obsidian-800 hover:bg-gold-950/60 text-gold-300 py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-gold-900/60 hover:border-gold-500 transition-colors font-medium"
                  title="Ask family for vote on WhatsApp"
                >
                  <Users className="w-4 h-4 text-gold-400" />
                  <span>{language === "te" ? "కుటుంబ ఓటు" : "Ask Family"}</span>
                </button>

                {/* Feature D: Save Estimate & VIP Lead Capture */}
                <button
                  type="button"
                  onClick={() => setIsLeadCaptureOpen(true)}
                  className="bg-obsidian-800 hover:bg-gold-950/60 text-gold-300 py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-gold-900/60 hover:border-gold-500 transition-colors font-medium"
                  title="Save quote and unlock VIP showroom discount"
                >
                  <Sparkles className="w-4 h-4 text-gold-400" />
                  <span>{language === "te" ? "కొటేషన్ సేవ్" : "Save Quote"}</span>
                </button>

                {onBookOrder && (
                  <button
                    onClick={handleBookOrder}
                    className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold py-2.5 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-gold-glow"
                    title="Book Goldsmith Custom Work Order"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>{language === "te" ? "ఆర్డర్ బుక్ చేయండి" : "Book Karigar Order"}</span>
                  </button>
                )}

                <button
                  onClick={handlePrintQuote}
                  className="bg-obsidian-800 hover:bg-obsidian-700 text-gold-300 py-2.5 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-gold-900/60 transition-colors"
                  title="Print official quotation slip (A4 or 80mm Thermal)"
                >
                  <Printer className="w-4 h-4 text-gold-400" />
                  <span>{language === "te" ? "అంచనా రసీదు ప్రింట్" : "Print Estimate Slip"}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="flex-1 min-w-[140px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/30"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {language === "te"
                      ? "వాట్సాప్ ద్వారా పంపండి"
                      : "Send WhatsApp"}
                  </span>
                </button>

                {onOpenShareModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenShareModal(item);
                    }}
                    className="bg-obsidian-800 hover:bg-obsidian-700 text-gold-300 py-2.5 px-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-gold-900/60 transition-colors"
                    title="Generate QR Standee & Direct Deep Link"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">QR Standee</span>
                  </button>
                )}

                <button
                  onClick={handleCopyQuote}
                  className="bg-obsidian-800 hover:bg-obsidian-700 text-ivory py-2.5 px-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-gold-900/60 transition-colors"
                  title="Copy formatted quotation text"
                >
                  {copiedQuote ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="w-4 h-4 text-gold-300" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Feature C: Ask Family Poll Modal */}
        {isFamilyVoteOpen && (
          <FamilyVoteModal
            isOpen={isFamilyVoteOpen}
            onClose={() => setIsFamilyVoteOpen(false)}
            optionA={{
              id: item.id,
              name: item.name,
              grams: selectedGrams,
              price: breakdown.totalEstimatedPrice,
              imageSrc: getJewelryImageUri(item),
            }}
            optionB={{
              id: "SW-HRM-104",
              name: "Royal Heritage Kasu Mala & Temple Haram",
              grams: 56,
              price: Math.round(56 * goldRate22K * 1.15),
            }}
            showroomName={showroomName}
          />
        )}

        {/* Feature D: Soft Lead Capture Modal */}
        {isLeadCaptureOpen && (
          <LeadCaptureModal
            isOpen={isLeadCaptureOpen}
            onClose={() => setIsLeadCaptureOpen(false)}
            ornamentItem={item}
            currentGrams={selectedGrams}
            estimatedPrice={breakdown.totalEstimatedPrice}
            source="calculator"
          />
        )}
      </div>
    </div>
  );
};
