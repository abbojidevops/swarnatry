"use client";

import React, { useState } from "react";
import { JewelryItem } from "@/data/mockJewelryCatalog";
import { formatINR } from "@/lib/goldMath";
import { useLanguage } from "@/context/LanguageContext";
import {
  Calendar,
  Sparkles,
  Gift,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Share2,
  Clock,
  PiggyBank,
  Scale,
} from "lucide-react";

interface GoldSchemePlannerProps {
  item?: JewelryItem | null;
  targetGrams?: number;
  goldRate22K: number;
  showroomName?: string;
  onEnroll?: (details: {
    mode: "value" | "weight";
    monthlyAmount: number;
    accumulatedGrams: number;
    totalSavings: number;
  }) => void;
}

export const GoldSchemePlanner: React.FC<GoldSchemePlannerProps> = ({
  item,
  targetGrams = 40,
  goldRate22K = 7150,
  showroomName = "Sri Krishna Jewellers",
  onEnroll,
}) => {
  const { isTe } = useLanguage();
  const [schemeMode, setSchemeMode] = useState<"value" | "weight">("value");

  // Mode 1: Value-based installment
  const [monthlyAmount, setMonthlyAmount] = useState<number>(10000);

  // Mode 2: Weight-based target
  const [targetWeight, setTargetWeight] = useState<number>(
    targetGrams || (item ? item.defaultGrams : 36)
  );

  // Calculations for Mode 1 (Value-based)
  // Customer pays 11 months, Showroom pays 12th month
  const totalCustomerPaid = monthlyAmount * 11;
  const showroomBonus = monthlyAmount * 1;
  const totalMaturityValue = monthlyAmount * 12;

  // Approx grams purchasable at maturity
  const approxGramsMaturity = Number(
    (totalMaturityValue / goldRate22K).toFixed(2)
  );

  // Wastage waiver savings (avg 14% showroom perk)
  const wastageWaiverSavings = Math.round(
    totalMaturityValue * 0.14
  );
  const totalMode1Savings = showroomBonus + wastageWaiverSavings;

  // Calculations for Mode 2 (Weight-based)
  // Target gold weight divided over 11 months
  const monthlyGramsTarget = Number((targetWeight / 11).toFixed(2));
  const estimatedMonthlyCost = Math.round(monthlyGramsTarget * goldRate22K);
  const totalWeightCost = Math.round(targetWeight * goldRate22K);
  const weightWastageSavings = Math.round(
    totalWeightCost * ((item?.wastagePercent || 14) / 100)
  );
  const totalMode2Savings = weightWastageSavings + Math.round(estimatedMonthlyCost * 0.8);

  const activeSavings = schemeMode === "value" ? totalMode1Savings : totalMode2Savings;

  const handleEnrollWhatsApp = () => {
    const formattedMonthly = formatINR(
      schemeMode === "value" ? monthlyAmount : estimatedMonthlyCost
    );
    const formattedSavings = formatINR(activeSavings);

    const message = isTe
      ? `నమస్తే ${showroomName}!\n\nనేను మీ "11+1 నెలల బంగారు పొదుపు స్కీమ్ (11-Month Gold Scheme)" లో చేరాలనుకుంటున్నాను.\n\n` +
        `• స్కీమ్ రకం: ${schemeMode === "value" ? "నెలవారీ నగదు చిట్" : "గ్రాముల నిల్వ స్కీమ్"}\n` +
        `• నెలవారీ వాయిదా: ${formattedMonthly} (11 నెలలు)\n` +
        `• ఆశించిన ఆభరణం: ${item?.name || "బంగారు ఆభరణాలు"} (${targetWeight}g)\n` +
        `• అంచనా ఆదా: ${formattedSavings} (బోనస్ నెల + 100% ఉచిత తరుగు)\n\n` +
        `దయచేసి రిజిస్ట్రేషన్ మరియు ఖాతా వివరాలను తెలియజేయండి!`
      : `Namaste ${showroomName}!\n\nI would like to enroll in your "11+1 Monthly Gold Savings Scheme".\n\n` +
        `• Plan Type: ${schemeMode === "value" ? "Monthly Cash Installment" : "Gold Weight Accumulation"}\n` +
        `• Monthly Installment: ${formattedMonthly} for 11 months\n` +
        `• Target Ornament: ${item?.name || "Gold Jewelry"} (${targetWeight}g)\n` +
        `• Projected Savings: ${formattedSavings} (12th Month Bonus + 100% Free Wastage/VA)\n\n` +
        `Please share the enrollment form and payment link!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");

    if (onEnroll) {
      onEnroll({
        mode: schemeMode,
        monthlyAmount: schemeMode === "value" ? monthlyAmount : estimatedMonthlyCost,
        accumulatedGrams: schemeMode === "value" ? approxGramsMaturity : targetWeight,
        totalSavings: activeSavings,
      });
    }
  };

  return (
    <div className="space-y-5 text-ivory">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-obsidian-950 border border-gold-900/60 text-xs">
        <button
          type="button"
          onClick={() => setSchemeMode("value")}
          className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            schemeMode === "value"
              ? "bg-gold-500 text-obsidian-950 font-bold shadow-sm"
              : "text-ivory-muted hover:text-ivory"
          }`}
        >
          <PiggyBank className="w-3.5 h-3.5" />
          <span>{isTe ? "నెలవారీ నగదు చిట్ (Value Scheme)" : "Fixed Monthly Cash Plan"}</span>
        </button>

        <button
          type="button"
          onClick={() => setSchemeMode("weight")}
          className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            schemeMode === "weight"
              ? "bg-gold-500 text-obsidian-950 font-bold shadow-sm"
              : "text-ivory-muted hover:text-ivory"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isTe ? "గ్రాముల నిల్వ స్కీమ్ (Weight Lock)" : "Gold Grams Lock Plan"}</span>
        </button>
      </div>

      {/* Scheme Description Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-gold-950/40 via-obsidian-900 to-gold-950/30 border border-gold-500/40 flex items-start gap-3">
        <Gift className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gold-300 font-cinzel">
              {isTe ? "11+1 నెలల బంగారు స్కీమ్ ఆఫర్" : "11+1 Showroom Gold Savings Plan"}
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-semibold">
              {isTe ? "0% తరుగు (VA)" : "Zero Wastage"}
            </span>
          </div>
          <p className="text-ivory-muted text-[11px] leading-relaxed">
            {isTe
              ? "మీరు 11 నెలలు మాత్రమే వాయిదాలు చెల్లిస్తారు. 12వ నెల వాయిదాను షోరూమ్ ఉచితంగా బోనస్‌గా ఇస్తుంది! అదనంగా 14% నుండి 18% వరకు తరుగు (VA) పూర్తిగా ఉచితం."
              : "Pay 11 monthly installments, and the showroom contributes the 12th month installment as a free bonus! Plus, get 100% waiver on making/wastage charges up to 18% upon maturity."}
          </p>
        </div>
      </div>

      {/* Dynamic Controls based on Mode */}
      {schemeMode === "value" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ivory-muted">
              {isTe ? "నెలవారీ వాయిదా మొత్తం (Monthly Installment):" : "Monthly Installment Amount:"}
            </span>
            <span className="font-mono font-bold text-gold-300 text-sm">
              {formatINR(monthlyAmount)}/month
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[5000, 10000, 25000, 50000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setMonthlyAmount(amt)}
                className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  monthlyAmount === amt
                    ? "bg-gold-500 text-obsidian-950 border-gold-400"
                    : "bg-obsidian-950 border-white/5 text-ivory-muted hover:text-ivory"
                }`}
              >
                ₹{(amt / 1000).toFixed(0)}k
              </button>
            ))}
          </div>

          {/* Range Slider */}
          <input
            type="range"
            min={2000}
            max={100000}
            step={1000}
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            className="w-full accent-gold-500 cursor-pointer h-1.5 bg-obsidian-950 rounded-lg"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ivory-muted">
              {isTe ? "లక్ష్య బంగారు బరువు (Target Gold Weight):" : "Target Gold Weight for Wedding:"}
            </span>
            <span className="font-mono font-bold text-gold-300 text-sm">
              {targetWeight} Grams (22K)
            </span>
          </div>

          {/* Quick weight presets */}
          <div className="grid grid-cols-4 gap-2">
            {[24, 40, 60, 80].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setTargetWeight(g)}
                className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  targetWeight === g
                    ? "bg-gold-500 text-obsidian-950 border-gold-400"
                    : "bg-obsidian-950 border-white/5 text-ivory-muted hover:text-ivory"
                }`}
              >
                {g}g
              </button>
            ))}
          </div>

          <input
            type="range"
            min={10}
            max={120}
            step={2}
            value={targetWeight}
            onChange={(e) => setTargetWeight(Number(e.target.value))}
            className="w-full accent-gold-500 cursor-pointer h-1.5 bg-obsidian-950 rounded-lg"
          />

          <div className="p-3 rounded-xl bg-obsidian-950/80 border border-gold-900/40 flex items-center justify-between text-xs">
            <span className="text-ivory-muted">
              {isTe ? "నెలవారీ సగటు వాయిదా:" : "Estimated Monthly Installment:"}
            </span>
            <span className="font-mono font-bold text-gold-300">
              ~{formatINR(estimatedMonthlyCost)}/mo ({monthlyGramsTarget}g)
            </span>
          </div>
        </div>
      )}

      {/* Side-by-Side Savings Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Buy Today Box */}
        <div className="p-3.5 rounded-2xl bg-obsidian-950/80 border border-white/5 space-y-2">
          <span className="text-ivory-muted text-[11px] block uppercase tracking-wider">
            {isTe ? "నేరుగా కొనుగోలు (Buy Today)" : "Outright Purchase"}
          </span>
          <div className="font-mono font-bold text-ivory text-base">
            {formatINR(schemeMode === "value" ? totalMaturityValue : totalWeightCost)}
          </div>
          <p className="text-[10px] text-ivory-muted">
            {isTe
              ? "+ పూర్తి తరుగు (14% - 18% VA) మరియు ఒకేసారి పూర్తి నగదు భారం."
              : "+ Full Making & Wastage charges (14%-18% VA) payable upfront."}
          </p>
        </div>

        {/* 11+1 Scheme Box */}
        <div className="p-3.5 rounded-2xl bg-gold-950/30 border border-gold-500/50 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-gold-300 text-[11px] font-bold block uppercase tracking-wider">
              {isTe ? "11+1 నెలల స్కీమ్" : "11+1 Monthly Scheme"}
            </span>
            <span className="text-[9px] bg-gold-500 text-obsidian-950 font-bold px-1.5 py-0.5 rounded">
              {isTe ? "లాభం" : "Best Value"}
            </span>
          </div>
          <div className="font-mono font-bold text-gold-200 text-base">
            {formatINR(
              schemeMode === "value"
                ? totalCustomerPaid
                : Math.round(estimatedMonthlyCost * 11)
            )}
            <span className="text-[11px] text-gold-400 font-normal ml-1">
              (11 వాయిదాలు)
            </span>
          </div>
          <div className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>
              {isTe
                ? `మొత్తం ఆదా: ${formatINR(activeSavings)}!`
                : `Total Savings: ${formatINR(activeSavings)}!`}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Checklist */}
      <div className="p-3.5 rounded-2xl bg-obsidian-950/90 border border-gold-900/60 space-y-2 text-xs">
        <span className="text-gold-400 text-[10px] font-semibold uppercase tracking-wider block">
          {isTe ? "స్కీమ్ ప్రయోజనాల జాబితా:" : "Plan Benefits & Guarantees:"}
        </span>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2 text-ivory">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {schemeMode === "value"
                ? `12వ నెల బోనస్: షోరూమ్ ఉచితంగా ${formatINR(showroomBonus)} జమ చేస్తుంది`
                : `లాక్ చేసిన గ్రాములు: వివాహ సమయానికి పెరిగే గోల్డ్ రేట్ నుండి రక్షణ`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-ivory">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isTe
                ? `100% ఉచిత తరుగు: దాదాపు ${formatINR(schemeMode === "value" ? wastageWaiverSavings : weightWastageSavings)} ఆదా`
                : `100% Wastage Waiver: Saves approx ${formatINR(schemeMode === "value" ? wastageWaiverSavings : weightWastageSavings)} on VA`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-ivory">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {isTe
                ? "22K 916 BIS హాల్మార్క్ ఆభరణాలు మాత్రమే డెలివరీ చేయబడతాయి"
                : "Guaranteed 22K 916 BIS Hallmark certified jewelry on maturity"}
            </span>
          </div>
        </div>
      </div>

      {/* WhatsApp Action Button */}
      <button
        type="button"
        onClick={handleEnrollWhatsApp}
        className="btn-gold-primary w-full py-3 rounded-xl text-xs font-bold shadow-gold-glow flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        <span>
          {isTe
            ? "వాట్సాప్ ద్వారా స్కీమ్‌లో చేరండి (Enroll via WhatsApp)"
            : "Enroll in 11-Month Gold Scheme on WhatsApp"}
        </span>
      </button>
    </div>
  );
};
