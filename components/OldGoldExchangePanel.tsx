"use client";

import React, { useState } from "react";
import {
  Coins,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Scale,
  Percent,
  Flame,
  AlertCircle,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  OldGoldItem,
  OldGoldPurityType,
  OLD_GOLD_PURITY_PRESETS,
  calculateOldGoldItem,
  calculateOldGoldExchange,
  OldGoldExchangeSummary,
  formatINR,
} from "@/lib/goldMath";

interface OldGoldExchangePanelProps {
  goldRate22K: number;
  goldRate24K: number;
  newPurchaseTotal: number;
  newPurchaseNetGrams: number;
  exchangeItems: OldGoldItem[];
  onChangeItems: (items: OldGoldItem[]) => void;
  language?: "en" | "te";
  onApplyToCalculator?: (tradeInValue: number, summary: OldGoldExchangeSummary) => void;
}

export const OldGoldExchangePanel: React.FC<OldGoldExchangePanelProps> = ({
  goldRate22K,
  goldRate24K,
  newPurchaseTotal,
  newPurchaseNetGrams,
  exchangeItems,
  onChangeItems,
  language = "en",
  onApplyToCalculator,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(exchangeItems.length > 0);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New Item Form State
  const [description, setDescription] = useState<string>("Old 22K Jewelry");
  const [grossGrams, setGrossGrams] = useState<string>("15.0");
  const [dustGrams, setDustGrams] = useState<string>("0.5");
  const [purityType, setPurityType] = useState<OldGoldPurityType>("hallmark-916");
  const [customTouch, setCustomTouch] = useState<string>("91.6");
  const [customMeltLoss, setCustomMeltLoss] = useState<string>("0");
  const [penaltyPerGram, setPenaltyPerGram] = useState<string>("75");

  const isTe = language === "te";

  // Calculate Summary
  const summary = calculateOldGoldExchange(
    exchangeItems,
    newPurchaseTotal,
    newPurchaseNetGrams
  );

  // Handler for Purity Type selection change
  const handlePurityChange = (type: OldGoldPurityType) => {
    setPurityType(type);
    const preset = OLD_GOLD_PURITY_PRESETS[type];
    setCustomTouch(preset.defaultTouch.toString());
    setCustomMeltLoss(preset.defaultMeltingLoss.toString());
    setPenaltyPerGram(preset.defaultPenalty.toString());
  };

  // Preview for current item being typed in form
  const previewItem = calculateOldGoldItem(
    {
      id: "preview",
      description,
      grossGrams: parseFloat(grossGrams) || 0,
      dustDeductionGrams: parseFloat(dustGrams) || 0,
      purityType,
      customTouchPercent: parseFloat(customTouch) || 91.6,
      customMeltingLossPercent: parseFloat(customMeltLoss) || 0,
      customPenaltyPerGram: parseFloat(penaltyPerGram) || 75,
    },
    goldRate22K,
    goldRate24K
  );

  const handleAddItem = () => {
    const gross = parseFloat(grossGrams) || 0;
    if (gross <= 0) return;

    const newItem = calculateOldGoldItem(
      {
        id: `old_${Date.now()}`,
        description: description.trim() || (isTe ? "పాత బంగారం" : "Old Gold Item"),
        grossGrams: gross,
        dustDeductionGrams: parseFloat(dustGrams) || 0,
        purityType,
        customTouchPercent: parseFloat(customTouch) || 91.6,
        customMeltingLossPercent: parseFloat(customMeltLoss) || 0,
        customPenaltyPerGram: parseFloat(penaltyPerGram) || 75,
      },
      goldRate22K,
      goldRate24K
    );

    onChangeItems([...exchangeItems, newItem]);
    setIsAddingNew(false);
    // Reset defaults for next item
    setDescription("Old Gold Item");
    setGrossGrams("10.0");
    setDustGrams("0.0");
  };

  const handleRemoveItem = (id: string) => {
    onChangeItems(exchangeItems.filter((i) => i.id !== id));
  };

  return (
    <div className="rounded-2xl border border-gold-900/60 bg-obsidian-900/90 overflow-hidden shadow-lg transition-all">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 bg-obsidian-950/90 flex items-center justify-between cursor-pointer hover:bg-obsidian-950 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-950/60 border border-gold-700/50 flex items-center justify-center text-gold-300">
            <Coins className="w-4 h-4 text-gold-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-gold-200 font-cinzel">
                {isTe ? "పాత బంగారం మార్పిడి & కరుగుదల" : "Old Gold Trade-in & Exchange"}
              </h4>
              {exchangeItems.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {exchangeItems.length} {isTe ? "నగలు" : "Items"} • -{formatINR(summary.totalExchangeValue)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-ivory-muted">
              {isTe
                ? "కస్టమర్ పాత బంగారం తరుగు/టచ్ తగ్గింపులతో లెక్కించి నికర ధర కనుగొనండి"
                : "Real-world melt deductions, touch testing % & net balance calculation"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gold-400">
          <span className="text-xs font-semibold hidden sm:inline">
            {isOpen ? (isTe ? "దాచండి" : "Collapse") : (isTe ? "వివరాలు" : "Expand")}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-4 space-y-4 border-t border-gold-900/40 animate-in fade-in">
          {/* List of current exchange items */}
          {exchangeItems.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">
                {isTe ? "ఎంచుకున్న పాత ఆభరణాలు:" : "Trade-in Items:"}
              </span>
              {exchangeItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-obsidian-950/80 rounded-xl p-3 border border-gold-900/50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ivory">
                        {idx + 1}. {item.description}
                      </span>
                      <span className="text-[10px] bg-gold-500/15 text-gold-300 px-1.5 py-0.5 rounded border border-gold-500/30">
                        {item.touchPercent}% Touch
                      </span>
                      {item.meltingLossPercent > 0 && (
                        <span className="text-[10px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded">
                          -{item.meltingLossPercent}% Melt
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ivory-muted flex items-center gap-2">
                      <span>Gross: {item.grossGrams}g</span>
                      <span>•</span>
                      <span>Dust: -{item.dustDeductionGrams}g</span>
                      <span>•</span>
                      <span className="text-gold-200 font-medium">Net: {item.netGrams}g</span>
                      <span>•</span>
                      <span>(Eq 22K: {item.equivalent22KGrams.toFixed(2)}g)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold font-cinzel text-sm">
                      +{formatINR(item.totalValue)}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-ivory-muted hover:text-red-400 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isAddingNew && (
              <div className="p-3 text-center bg-obsidian-950/40 rounded-xl border border-gold-900/30 border-dashed text-xs text-ivory-muted">
                {isTe
                  ? "పాత బంగారం ఇంకా జోడించలేదు. పాత నగలను మార్పిడి చేయడానికి క్రింది బటన్ నొక్కండి."
                  : "No old gold items added yet. Click below to add trade-in gold."}
              </div>
            )
          )}

          {/* Add New Item Form / Button */}
          {isAddingNew ? (
            <div className="bg-obsidian-950 rounded-2xl p-4 border border-gold-600/50 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gold-900/40 pb-2">
                <span className="text-xs font-bold text-gold-300 font-cinzel uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTe ? "కొత్త పాత ఆభరణం వివరాలు" : "Add Old Gold Specification"}</span>
                </span>
                <button
                  onClick={() => setIsAddingNew(false)}
                  className="text-[11px] text-ivory-muted hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {/* Item Name & Gross Wt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-ivory-muted block">
                    {isTe ? "ఆభరణం పేరు:" : "Item Description:"}
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 22K Old Coin / Traditional Haram"
                    className="w-full bg-obsidian-900 border border-gold-900/60 rounded-xl px-3 py-1.5 text-xs text-ivory focus:outline-none focus:border-gold-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-ivory-muted block">
                      {isTe ? "మొత్తం బరువు (g):" : "Gross Wt (g):"}
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={grossGrams}
                      onChange={(e) => setGrossGrams(e.target.value)}
                      className="w-full bg-obsidian-900 border border-gold-900/60 rounded-xl px-3 py-1.5 text-xs text-gold-200 focus:outline-none focus:border-gold-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-ivory-muted block">
                      {isTe ? "తరుగు / రాళ్లు (g):" : "Dust/Wax (g):"}
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      value={dustGrams}
                      onChange={(e) => setDustGrams(e.target.value)}
                      className="w-full bg-obsidian-900 border border-gold-900/60 rounded-xl px-3 py-1.5 text-xs text-gold-200 focus:outline-none focus:border-gold-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Purity / Touch Preset Selector */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-ivory-muted block">
                    {isTe ? "స్వచ్ఛత / టచ్ రకం:" : "Purity Type & Touch Preset:"}
                  </label>
                  <select
                    name="purity"
                    id="purity-select"
                    value={purityType}
                    onChange={(e) => handlePurityChange(e.target.value as OldGoldPurityType)}
                    className="bg-obsidian-900 border border-gold-900/60 rounded-lg px-2 py-1 text-xs text-gold-300 font-medium focus:outline-none focus:border-gold-500"
                  >
                    {(Object.keys(OLD_GOLD_PURITY_PRESETS) as OldGoldPurityType[]).map((type) => {
                      const preset = OLD_GOLD_PURITY_PRESETS[type];
                      return (
                        <option key={type} value={type}>
                          {preset.label} ({preset.defaultTouch}% Touch)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  {(Object.keys(OLD_GOLD_PURITY_PRESETS) as OldGoldPurityType[]).map((type) => {
                    const preset = OLD_GOLD_PURITY_PRESETS[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handlePurityChange(type)}
                        className={`p-2 rounded-xl border text-[11px] text-left transition-all truncate ${
                          purityType === type
                            ? "bg-gold-500/20 text-gold-200 border-gold-500 font-semibold"
                            : "bg-obsidian-900 text-ivory-muted border-white/5 hover:border-gold-900"
                        }`}
                      >
                        <span className="block font-semibold truncate">
                          {isTe ? preset.teluguLabel.split(" ")[0] : preset.label.split("(")[0]}
                        </span>
                        <span className="text-[10px] text-gold-400 block">
                          {preset.defaultTouch}% Touch
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Overrides (Touch %, Melt Loss %, Exchange Penalty) */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gold-900/40">
                <div className="space-y-1">
                  <label className="text-[10px] text-ivory-muted block">
                    Touch (%):
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={customTouch}
                    onChange={(e) => setCustomTouch(e.target.value)}
                    className="w-full bg-obsidian-900 border border-gold-900/60 rounded-lg px-2 py-1 text-xs text-ivory font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-ivory-muted block">
                    Melt Loss (%):
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    value={customMeltLoss}
                    onChange={(e) => setCustomMeltLoss(e.target.value)}
                    className="w-full bg-obsidian-900 border border-gold-900/60 rounded-lg px-2 py-1 text-xs text-ivory font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-ivory-muted block">
                    Shop Penalty (₹/g):
                  </label>
                  <input
                    type="number"
                    step={10}
                    value={penaltyPerGram}
                    onChange={(e) => setPenaltyPerGram(e.target.value)}
                    className="w-full bg-obsidian-900 border border-gold-900/60 rounded-lg px-2 py-1 text-xs text-ivory font-mono"
                  />
                </div>
              </div>

              {/* Live Preview & Add Button */}
              <div className="pt-2 flex items-center justify-between border-t border-gold-900/40 flex-wrap gap-2">
                <div className="text-xs">
                  <span className="text-ivory-muted block text-[10px]">
                    Item Valuation Preview:
                  </span>
                  <span className="font-bold text-emerald-400 font-cinzel text-sm">
                    {formatINR(previewItem.totalValue)}
                  </span>
                  <span className="text-[10px] text-ivory-muted ml-2">
                    (Net: {previewItem.netGrams}g | 22K Eq: {previewItem.equivalent22KGrams.toFixed(2)}g)
                  </span>
                </div>

                <button
                  onClick={handleAddItem}
                  className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-gold-glow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isTe ? "ఈ నగను జోడించండి" : "Add Item"}</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNew(true)}
              className="w-full py-2.5 px-3 rounded-xl border border-gold-900/60 hover:border-gold-500/60 bg-obsidian-950/60 hover:bg-gold-950/20 text-gold-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4 text-gold-400" />
              <span>{isTe ? "+ పాత బంగారం నగను జోడించండి" : "+ Add Old Gold Item for Exchange"}</span>
            </button>
          )}

          {/* Aggregate Settlement Summary */}
          {exchangeItems.length > 0 && (
            <div className="bg-obsidian-950 rounded-2xl p-4 border border-gold-600/40 space-y-2.5">
              <div className="flex items-center justify-between border-b border-gold-900/40 pb-2">
                <span className="text-xs font-bold text-gold-300 font-cinzel uppercase tracking-wider">
                  {isTe ? "మొత్తం సెటిల్మెంట్ వివరాలు" : "Net Settlement Summary"}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  ✓ {exchangeItems.length} {isTe ? "మార్పిడి నగలు" : "Items Applied"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-ivory-muted">
                  <span>{isTe ? "కొత్త ఆభరణాల మొత్తం ధర:" : "New Purchase Grand Total:"}</span>
                  <span className="font-semibold text-ivory">{formatINR(newPurchaseTotal)}</span>
                </div>

                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>{isTe ? "తగ్గింపు: పాత బంగారం విలువ (-):" : "Less: Total Old Gold Value (-):"}</span>
                  <span>-{formatINR(summary.totalExchangeValue)}</span>
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-gold-200 block">
                      {isTe ? "నికర చెల్లించవలసిన మొత్తం:" : "NET BALANCE PAYABLE:"}
                    </span>
                    <span className="text-[10px] text-ivory-muted block">
                      {summary.goldWeightBalanceGrams > 0
                        ? `${isTe ? "అదనపు బంగారం అవసరం" : "Extra Gold Weight needed"}: +${summary.goldWeightBalanceGrams}g`
                        : `${isTe ? "అదనపు బంగారం క్రెడిట్" : "Surplus Gold Weight"}: ${Math.abs(summary.goldWeightBalanceGrams)}g`}
                    </span>
                  </div>

                  <span className="text-xl font-bold font-cinzel text-gold-gradient">
                    {formatINR(summary.netPayableAfterExchange)}
                  </span>
                </div>

                {/* Gold-to-Gold Balance Card */}
                <div className="p-2.5 rounded-xl bg-gold-950/40 border border-gold-600/40 space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-gold-300">
                    <span className="flex items-center gap-1.5 font-cinzel">
                      <Scale className="w-3.5 h-3.5 text-gold-400" />
                      <span>{isTe ? "బంగారం-బంగారం బ్యాలెన్స్:" : "Gold-to-Gold Balance:"}</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {summary.goldWeightBalanceGrams > 0
                        ? `+${summary.goldWeightBalanceGrams.toFixed(2)}g extra gold needed`
                        : "Old gold covers full net weight"}
                    </span>
                  </div>
                  <p className="text-[10px] text-ivory-muted">
                    {summary.goldWeightBalanceGrams > 0
                      ? `New Net Gold: ${newPurchaseNetGrams.toFixed(2)}g | Old Gold 22K Eq: ${summary.totalEquivalent22KGrams.toFixed(2)}g`
                      : `Old Gold Eq (${summary.totalEquivalent22KGrams.toFixed(2)}g) fully covers new gold net weight (${newPurchaseNetGrams.toFixed(2)}g)!`}
                  </p>
                </div>

                {summary.customerRefundAmount > 0 && (
                  <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2.5 text-xs text-emerald-300 flex items-center justify-between">
                    <span>{isTe ? "కస్టమర్‌కు వాపసు ఇవ్వవలసిన మొత్తం:" : "Customer Refund Amount:"}</span>
                    <span className="font-bold font-mono">{formatINR(summary.customerRefundAmount)}</span>
                  </div>
                )}

                {onApplyToCalculator && (
                  <button
                    onClick={() => onApplyToCalculator(summary.totalExchangeValue, summary)}
                    className="w-full mt-2 bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-gold-glow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isTe ? "కాలిక్యులేటర్‌కు వర్తింపజేయండి" : "Apply to Calculator"}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
