"use client";

import React, { useState } from "react";
import {
  Crown,
  Sparkles,
  Trash2,
  X,
  Share2,
  Camera,
  Image as ImageIcon,
  Check,
  ChevronUp,
  ChevronDown,
  Layers,
  Scale,
  Gem,
  Calculator,
  ArrowRight,
  Flame,
  CircleDot,
  Sliders,
  DollarSign,
  Download,
  Coins,
  Printer,
  ClipboardList,
} from "lucide-react";
import { JewelryItem, getJewelryImageUri } from "@/data/mockJewelryCatalog";
import { formatINR, OldGoldItem, calculateOldGoldExchange } from "@/lib/goldMath";
import { OldGoldExchangePanel } from "@/components/OldGoldExchangePanel";
import { useLanguage } from "@/context/LanguageContext";
import {
  BridalComboSlots,
  BridalSlotId,
  BRIDAL_SLOT_CONFIGS,
  BRIDAL_PRESETS,
  calculateComboSetTotals,
  allocateGramsForTargetBudget,
  generateBridalComboWhatsAppQuote,
  EquippedOrnament,
} from "@/lib/comboSetStore";

interface BridalComboDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  slots: BridalComboSlots;
  isComboMode: boolean;
  onToggleComboMode: (enabled: boolean) => void;
  onEquipSlot: (slotId: BridalSlotId, item: JewelryItem, grams?: number) => void;
  onUnequipSlot: (slotId: BridalSlotId) => void;
  onUpdateSlotGrams: (slotId: BridalSlotId, grams: number) => void;
  onClearCombo: () => void;
  onLoadPreset: (presetId: string) => void;
  goldRate22K: number;
  goldRate24K: number;
  showroomName: string;
  onLaunchLiveAR: () => void;
  onLaunchPhotoMatch: () => void;
  onExportLookbook?: () => void;
  onOpenPrintEstimate?: (estimateData: any) => void;
  onBookOrder?: (orderData: any) => void;
}

export const BridalComboDrawer: React.FC<BridalComboDrawerProps> = ({
  isOpen,
  onClose,
  slots,
  isComboMode,
  onToggleComboMode,
  onEquipSlot,
  onUnequipSlot,
  onUpdateSlotGrams,
  onClearCombo,
  onLoadPreset,
  goldRate22K,
  goldRate24K,
  showroomName,
  onLaunchLiveAR,
  onLaunchPhotoMatch,
  onExportLookbook,
  onOpenPrintEstimate,
  onBookOrder,
}) => {
  const [activeTab, setActiveTab] = useState<"slots" | "presets" | "budget" | "exchange">("slots");
  const { language, setLanguage, toggleLanguage, isTe } = useLanguage();
  const [targetBudget, setTargetBudget] = useState<number>(0);
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);
  const [oldGoldItems, setOldGoldItems] = useState<OldGoldItem[]>([]);

  const calc = calculateComboSetTotals(slots, goldRate22K, goldRate24K);
  const oldGoldExchange = calculateOldGoldExchange(
    oldGoldItems,
    calc.grandTotal,
    calc.totalNetGrams
  );

  // Handle Target Budget Slider
  const handleBudgetChange = (amount: number) => {
    setTargetBudget(amount);
    const allocated = allocateGramsForTargetBudget(amount, slots, goldRate22K, goldRate24K);
    (Object.keys(allocated) as BridalSlotId[]).forEach((slotId) => {
      const grams = allocated[slotId];
      if (grams > 0) {
        onUpdateSlotGrams(slotId, grams);
      }
    });
  };

  // WhatsApp Share
  const handleShareWhatsApp = () => {
    const text = generateBridalComboWhatsAppQuote(calc, showroomName, goldRate22K, language);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleCopyQuote = () => {
    const text = generateBridalComboWhatsAppQuote(calc, showroomName, goldRate22K, language);
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const handlePrintQuote = () => {
    if (onOpenPrintEstimate) {
      onClose();
      onOpenPrintEstimate({
        items: calc.items.map((it) => ({
          id: it.item.id,
          name: it.item.name,
          teluguName: it.item.teluguName,
          category: it.item.categoryLabel,
          grossGrams: it.breakdown.grossGrams,
          netGrams: it.breakdown.netGoldGrams,
          stoneWeight: it.breakdown.stoneWeightGrams,
          purity: it.breakdown.purity,
          rate: it.breakdown.goldRatePerGram,
          baseGoldCost: it.breakdown.baseGoldCost,
          wastagePercent: it.breakdown.wastagePercent,
          wastageCost: it.breakdown.wastageCost,
          makingCharges: it.breakdown.makingCharges,
          stoneCost: it.breakdown.stoneCost,
          gstAmount: it.breakdown.gstAmount,
          totalEstimatedPrice: it.breakdown.totalEstimatedPrice,
          imageUri: getJewelryImageUri(it.item),
        })),
        oldGoldSummary: oldGoldExchange.totalExchangeValue > 0 ? oldGoldExchange : null,
        isBridalSet: true,
      });
    } else {
      window.print();
    }
  };

  const handleBookOrder = () => {
    if (onBookOrder) {
      onClose();
      onBookOrder({
        items: calc.items.map((it) => ({
          id: it.item.id,
          name: it.item.name,
          teluguName: it.item.teluguName,
          category: it.item.categoryLabel,
          grams: it.breakdown.grossGrams,
          purity: it.breakdown.purity,
          imageUri: getJewelryImageUri(it.item),
          price: it.breakdown.totalEstimatedPrice,
        })),
        totalGrossGrams: calc.totalGrossGrams,
        totalNetGrams: calc.totalNetGrams,
        grandTotalEstimate: calc.grandTotal,
        advanceCashPaid: Math.round(calc.grandTotal * 0.25),
        advanceOldGoldGrams: oldGoldExchange ? oldGoldExchange.totalNetGrams : 0,
        balancePayable:
          oldGoldExchange && oldGoldExchange.totalExchangeValue > 0
            ? oldGoldExchange.netPayableAfterExchange
            : calc.grandTotal,
        customNotes: `Custom Bridal Combo Set Order (${calc.totalPieces} pieces: ${calc.items
          .map((i) => i.item.name)
          .join(", ")}).`,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-obsidian-950/85 backdrop-blur-md flex justify-end transition-opacity animate-in fade-in">
      <div className="w-full max-w-2xl bg-obsidian-900 border-l border-gold-900/60 shadow-2xl flex flex-col h-full text-ivory">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gold-900/60 bg-obsidian-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-900/40 border border-gold-700/50 flex items-center justify-center text-gold-300">
              <Crown className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-bold text-lg text-gold-300 tracking-wide">
                  {isTe ? "పెళ్లి నగల సెట్ కాంబో" : "Bridal Combo Set Tray"}
                </h2>
                <span className="bg-gold-500/20 text-gold-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gold-500/30">
                  {calc.totalPieces} / 5 {isTe ? "ధరించారు" : "Equipped"}
                </span>
              </div>
              <p className="text-xs text-ivory-muted">
                {isTe
                  ? "చోకర్, హారం, జుంకాలు, పాపిడి బిళ్ళ మరియు ముక్కు పుడకలను ఒకేసారి చూడండి"
                  : "Layer Choker, Long Haram, Earrings, Maang Tikka & Nath simultaneously"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === "en" ? "te" : "en")}
              className="text-xs bg-obsidian-800 border border-gold-900/60 hover:border-gold-500 text-gold-300 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
            >
              {language === "en" ? "తెలుగు" : "English"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-obsidian-800 text-ivory-muted hover:text-white flex items-center justify-center border border-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Combo Mode Switcher Bar */}
        <div className="px-5 py-3 bg-obsidian-950/60 border-b border-gold-900/40 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ivory-muted">
              {isTe ? "కాంబో లేయరింగ్ మోడ్:" : "Bridal Combo Mode:"}
            </span>
            <button
              onClick={() => onToggleComboMode(!isComboMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isComboMode ? "bg-gold-500" : "bg-obsidian-800"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-obsidian-950 transition-transform ${
                  isComboMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-gold-300">
              {isComboMode ? (isTe ? "యాక్టివ్ (ఆన్)" : "ACTIVE") : (isTe ? "ఆఫ్" : "OFF")}
            </span>
          </div>

          {calc.totalPieces > 0 && (
            <button
              onClick={onClearCombo}
              className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isTe ? "సెట్ క్లియర్ చేయండి" : "Clear All Slots"}</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gold-900/40 bg-obsidian-950 text-xs font-medium">
          <button
            onClick={() => setActiveTab("slots")}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "slots"
                ? "border-gold-500 text-gold-300 font-semibold bg-gold-950/20"
                : "border-transparent text-ivory-muted hover:text-ivory"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isTe ? "ఆభరణాల స్లాట్‌లు" : "Anatomical Slots"}</span>
          </button>
          <button
            onClick={() => setActiveTab("presets")}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "presets"
                ? "border-gold-500 text-gold-300 font-semibold bg-gold-950/20"
                : "border-transparent text-ivory-muted hover:text-ivory"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isTe ? "రాయల్ పెళ్లి ప్రీసెట్లు" : "Heritage Presets"}</span>
          </button>
          <button
            onClick={() => setActiveTab("budget")}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "budget"
                ? "border-gold-500 text-gold-300 font-semibold bg-gold-950/20"
                : "border-transparent text-ivory-muted hover:text-ivory"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isTe ? "బడ్జెట్" : "Budget"}</span>
          </button>
          <button
            onClick={() => setActiveTab("exchange")}
            className={`flex-1 py-3 text-center transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === "exchange"
                ? "border-gold-500 text-gold-300 font-semibold bg-gold-950/20"
                : "border-transparent text-ivory-muted hover:text-ivory"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{isTe ? "పాత బంగారం" : "Old Gold"}</span>
            {oldGoldItems.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: SLOTS */}
          {activeTab === "slots" && (
            <div className="space-y-3">
              {(Object.keys(BRIDAL_SLOT_CONFIGS) as BridalSlotId[]).map((slotId) => {
                const config = BRIDAL_SLOT_CONFIGS[slotId];
                const equipped = slots[slotId];

                return (
                  <div
                    key={slotId}
                    data-slot={slotId}
                    className={`rounded-xl border p-3.5 transition-all ${
                      equipped
                        ? "bg-obsidian-850/90 border-gold-600/40 shadow-lg shadow-gold-950/20"
                        : "bg-obsidian-950/40 border-gold-900/30 border-dashed"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-gold-900/40 text-gold-400 flex items-center justify-center text-xs">
                          {slotId === "slot_choker" && <Crown className="w-3.5 h-3.5" />}
                          {slotId === "slot_haram" && <Gem className="w-3.5 h-3.5" />}
                          {slotId === "slot_earrings" && <Sparkles className="w-3.5 h-3.5" />}
                          {slotId === "slot_tikka" && <Flame className="w-3.5 h-3.5" />}
                          {slotId === "slot_nosering" && <CircleDot className="w-3.5 h-3.5" />}
                        </span>
                        <div>
                          <h4 className="text-xs font-semibold text-gold-200">
                            {isTe ? config.teluguLabel : config.label}
                          </h4>
                          <span className="text-[10px] text-ivory-muted">
                            {config.categoryLabel}
                          </span>
                        </div>
                      </div>

                      {equipped && (
                        <button
                          onClick={() => onUnequipSlot(slotId)}
                          className="text-[11px] text-red-400 hover:text-red-300 p-1 rounded-md transition-colors"
                          title="Unequip from slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {equipped ? (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="w-14 h-14 rounded-lg bg-obsidian-950 border border-gold-900/60 p-1 flex items-center justify-center flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getJewelryImageUri(equipped.item)}
                            alt={equipped.item.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-medium text-ivory truncate">
                            {isTe ? (equipped.item.teluguName || equipped.item.name) : equipped.item.name}
                          </h5>
                          <div className="flex items-center gap-2 text-[11px] text-gold-400 mt-0.5">
                            <span>{equipped.item.id}</span>
                            <span>•</span>
                            <span>{equipped.item.purity}</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">
                              {formatINR(
                                (equipped.selectedGrams * (equipped.item.purity === "24K" ? goldRate24K : goldRate22K)) *
                                  (1 + equipped.item.wastagePercent / 100) *
                                  1.03
                              )}
                            </span>
                          </div>

                          {/* Gram Adjuster */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-ivory-muted flex items-center gap-1">
                              <Scale className="w-3 h-3 text-gold-400" />
                              {equipped.selectedGrams}g
                            </span>
                            <input
                              type="range"
                              min={equipped.item.minGrams}
                              max={equipped.item.maxGrams}
                              step={1}
                              value={equipped.selectedGrams}
                              onChange={(e) => onUpdateSlotGrams(slotId, Number(e.target.value))}
                              className="flex-1 h-1.5 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                            />
                            <span className="text-[10px] text-ivory-muted">
                              ({equipped.item.minGrams}g–{equipped.item.maxGrams}g)
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-ivory-muted/60">
                        {isTe
                          ? "ఈ స్లాట్‌లో ఇంకా ఏ ఆభరణం అమర్చలేదు (కేటలాగ్ నుండి ఎంచుకోండి)"
                          : "Empty Slot — Select an item from catalog to equip"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-3.5">
              <div className="bg-gold-950/20 border border-gold-900/50 rounded-xl p-3 text-xs text-gold-300/90 leading-relaxed">
                ✨ <strong>{isTe ? "1-క్లిక్ రాయల్ పెళ్లి సెట్లు:" : "1-Click Heritage Bridal Sets:"}</strong>{" "}
                {isTe
                  ? "అనుభవజ్ఞులైన స్వర్ణకారులు రూపొందించిన 4-పీస్ మరియు 5-పీస్ సాంప్రదాయ పెళ్లి నగల సమన్వయాలు."
                  : "Curated 4-piece and 5-piece royal bridal coordinates designed by master goldsmiths for seamless heritage harmony."}
              </div>

              {BRIDAL_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="bg-obsidian-850 border border-gold-900/60 hover:border-gold-600/70 rounded-xl p-4 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-cinzel font-bold text-sm text-gold-200">
                          {isTe ? preset.teluguName : preset.name}
                        </h4>
                        <span className="bg-gold-500/20 text-gold-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gold-500/30">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gold-400/80 font-medium mt-0.5">
                        {preset.subtitle}
                      </p>
                      <p className="text-[11px] text-ivory-muted mt-1.5 leading-normal">
                        {preset.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onLoadPreset(preset.id)}
                      className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0 transition-colors shadow-lg shadow-gold-900/20"
                    >
                      <span>{isTe ? "లోడ్ చేయండి" : "Equip Preset"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: REVERSE BUDGET PLANNER */}
          {activeTab === "budget" && (
            <div className="space-y-4">
              <div className="bg-obsidian-850 border border-gold-900/60 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-gold-400" />
                    <h4 className="text-xs font-semibold text-gold-300">
                      {isTe ? "కుటుంబ బడ్జెట్ రివర్స్ ప్లానర్" : "Family Bridal Budget Allocator"}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {targetBudget > 0 ? formatINR(targetBudget) : formatINR(calc.grandTotal)}
                  </span>
                </div>

                <p className="text-[11px] text-ivory-muted leading-relaxed mb-4">
                  {isTe
                    ? "మీ కుటుంబ బడ్జెట్‌ను ఎంచుకోండి — యాప్ ప్రతి ఆభరణం బరువును దాని కనిష్ట/గరిష్ట పరిధిలో స్వయంచాలకంగా సర్దుబాటు చేస్తుంది!"
                    : "Slide to your target family budget — the app automatically redistributes gold weight across all equipped ornaments within their craftable limits!"}
                </p>

                {/* Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={450000}
                    max={950000}
                    step={10000}
                    value={targetBudget || calc.grandTotal}
                    onChange={(e) => handleBudgetChange(Number(e.target.value))}
                    className="w-full h-2 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                  <div className="flex items-center justify-between text-[11px] text-ivory-muted">
                    <span>Min: {formatINR(calc.minPossibleGrandTotal)}</span>
                    <span>Max: {formatINR(calc.maxPossibleGrandTotal)}</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gold-900/40">
                  {[450000, 650000, 950000].map((presetAmt) => (
                    <button
                      key={presetAmt}
                      onClick={() => handleBudgetChange(presetAmt)}
                      className="bg-obsidian-950 hover:bg-gold-950/40 text-gold-300 text-[11px] font-medium py-1.5 px-2 rounded-lg border border-gold-900/60 transition-colors text-center"
                    >
                      ₹{(presetAmt / 100000).toFixed(1)} Lakhs
                    </button>
                  ))}
                </div>
              </div>

              {/* Itemized Allocation Review */}
              <div className="bg-obsidian-950 rounded-xl p-3 border border-gold-900/40 space-y-2">
                <h5 className="text-[11px] font-semibold text-gold-400 uppercase tracking-wider">
                  {isTe ? "ఆభరణాల వారీగా బరువు కేటాయింపు:" : "Dynamic Weight Allocation:"}
                </h5>
                {calc.items.map((it) => (
                  <div
                    key={it.slotId}
                    className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0"
                  >
                    <span className="text-ivory-muted truncate max-w-[200px]">
                      {isTe ? (it.item.teluguName || it.item.name) : it.item.name}
                    </span>
                    <span className="text-gold-200 font-medium">
                      {it.selectedGrams}g ({formatINR(it.breakdown.totalEstimatedPrice)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: OLD GOLD EXCHANGE */}
          {activeTab === "exchange" && (
            <div className="space-y-3">
              <div className="bg-gold-950/20 border border-gold-900/50 rounded-xl p-3 text-xs text-gold-300/90 leading-relaxed">
                🪙 <strong>{isTe ? "పాత బంగారు మార్పిడి (ఎక్స్ఛేంజ్):" : "Old Gold Trade-in & Melting Deduction:"}</strong>{" "}
                {isTe
                  ? "మీ పాత బంగారు ఆభరణాలను ఇక్కడ జోడించి, వాటి విలువను కొత్త పెళ్లి సెట్ ధర నుండి తగ్గించుకోండి."
                  : "Add your heirloom old gold ornaments to deduct their value directly from this bridal combo total."}
              </div>

              <OldGoldExchangePanel
                goldRate22K={goldRate22K}
                goldRate24K={goldRate24K}
                newPurchaseTotal={calc.grandTotal}
                newPurchaseNetGrams={calc.totalNetGrams}
                exchangeItems={oldGoldItems}
                onChangeItems={setOldGoldItems}
                language={language}
              />
            </div>
          )}
        </div>

        {/* Footer Summary & Mode Launchers */}
        <div className="p-4 sm:p-5 bg-obsidian-950 border-t border-gold-900/60 space-y-3">
          {/* Totals Banner */}
          <div className="bg-obsidian-900/90 rounded-xl p-3 border border-gold-900/50 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-ivory-muted block">
                  {isTe ? "మొత్తం స్థూల బరువు:" : "Total Gross Gold:"}
                </span>
                <span className="text-sm font-bold text-gold-300">
                  {calc.totalGrossGrams.toFixed(1)} Grams
                </span>
                <span className="text-[10px] text-ivory-muted block">
                  ({isTe ? "నికర బంగారం:" : "Net Gold:"} {calc.totalNetGrams.toFixed(1)}g)
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-ivory-muted block">
                  {isTe ? "మొత్తం అంచనా బడ్జెట్ (GSTతో):" : "Combined Estimated Budget:"}
                </span>
                <span className="text-xl font-cinzel font-bold text-gold-200">
                  {formatINR(calc.grandTotal)}
                </span>
              </div>
            </div>

            {/* Old Gold Settlement row if items exist */}
            {oldGoldItems.length > 0 && oldGoldExchange.totalExchangeValue > 0 && (
              <div className="pt-2 border-t border-gold-900/40 space-y-1 text-xs">
                <div className="flex items-center justify-between text-emerald-400">
                  <span>{isTe ? "పాత బంగారం ఎక్స్ఛేంజ్ విలువ (-):" : "Old Gold Trade-in Credit (-):"}</span>
                  <span className="font-semibold">- {formatINR(oldGoldExchange.totalExchangeValue)}</span>
                </div>
                <div className="flex items-center justify-between text-gold-bright font-bold pt-1 border-t border-gold-900/30">
                  <span>{isTe ? "నికర చెల్లించవలసిన మొత్తం:" : "Net Balance Payable:"}</span>
                  <span className="text-base font-cinzel">{formatINR(oldGoldExchange.netPayableAfterExchange)}</span>
                </div>
                <div className="text-[10px] text-ivory-muted text-right">
                  {oldGoldExchange.goldWeightBalanceGrams > 0
                    ? `Extra Gold Needed: +${oldGoldExchange.goldWeightBalanceGrams.toFixed(2)}g`
                    : "Old gold covers complete net weight"}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: Live AR & Photo Match */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              onClick={() => {
                onClose();
                onLaunchLiveAR();
              }}
              className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-gold-900/30"
            >
              <Camera className="w-4 h-4" />
              <span>{isTe ? "లైవ్ AR లో ధరించండి" : "Wear in Live AR"}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onLaunchPhotoMatch();
              }}
              className="bg-obsidian-800 hover:bg-obsidian-700 text-ivory font-medium py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-gold-900/60 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-gold-400" />
              <span>{isTe ? "ఫోటో మ్యాచ్ లో ధరించండి" : "Wear in Photo Match"}</span>
            </button>
          </div>

          {/* Quotation, Order & WhatsApp Toolbar */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            {onBookOrder && (
              <button
                onClick={handleBookOrder}
                className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-gold-glow"
                title="Book Custom Bridal Work Order with Karigar"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>{isTe ? "ఆర్డర్ బుక్" : "Book Bridal Order"}</span>
              </button>
            )}

            <button
              onClick={handlePrintQuote}
              className="bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 py-2 px-3 rounded-xl text-xs flex items-center gap-1.5 border border-gold-900/60 transition-colors"
              title="Print official quotation slip (A4 or 80mm Thermal)"
            >
              <Printer className="w-3.5 h-3.5 text-gold-400" />
              <span>{isTe ? "రసీదు" : "Print Estimate"}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex-1 min-w-[100px] bg-emerald-700 hover:bg-emerald-600 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isTe ? "వాట్సాప్" : "WhatsApp"}</span>
            </button>

            <button
              onClick={handleCopyQuote}
              className="bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 py-2 px-2.5 rounded-xl text-xs flex items-center gap-1 border border-gold-900/50 transition-colors"
              title="Copy text breakdown"
            >
              {copiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Calculator className="w-3.5 h-3.5" />}
              <span>{copiedQuote ? "Copied" : "Copy"}</span>
            </button>

            {onExportLookbook && (
              <button
                onClick={onExportLookbook}
                className="bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 py-2 px-2.5 rounded-xl text-xs flex items-center gap-1 border border-gold-900/50 transition-colors"
                title="Download 1080x1350 Bridal Lookbook Card"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Lookbook</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
