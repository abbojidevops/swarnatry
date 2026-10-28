"use client";

import React, { useState } from "react";
import { Sparkles, Info, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from "lucide-react";
import { FaceAnalysisResult, SuitabilityScore } from "@/lib/faceStylistEngine";
import { useLanguage } from "@/context/LanguageContext";

interface FaceSuitabilityBadgeProps {
  analysis: FaceAnalysisResult;
  suitability: SuitabilityScore;
  className?: string;
  isCompact?: boolean;
}

export const FaceSuitabilityBadge: React.FC<FaceSuitabilityBadgeProps> = ({
  analysis,
  suitability,
  className = "",
  isCompact = false,
}) => {
  const { isTe } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isHighMatch = suitability.score >= 90;
  const isAdvisory = suitability.score < 80;

  return (
    <div
      className={`rounded-2xl transition-all duration-300 backdrop-blur-md border shadow-lg ${
        isAdvisory
          ? "bg-amber-950/85 border-amber-500/40 text-amber-200"
          : isHighMatch
          ? "bg-obsidian-950/85 border-gold-500/50 text-gold-200 shadow-gold-glow/20"
          : "bg-obsidian-950/80 border-gold-900/60 text-ivory"
      } ${className}`}
    >
      {/* Top Bar Summary */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-3 px-3.5 py-2 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
              isAdvisory
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : isHighMatch
                ? "bg-gold-500 text-obsidian-950"
                : "bg-obsidian-800 text-gold-300"
            }`}
          >
            {isHighMatch ? (
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            ) : isAdvisory ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold tracking-wide">
                {isTe ? suitability.tagTe : suitability.tagEn}
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded-full bg-black/40 border border-white/10 text-ivory-muted font-mono">
                {isTe ? analysis.shapeTeluguLabel : analysis.shapeLabel}
              </span>
            </div>
            {!isCompact && (
              <p className="text-[10px] text-ivory-muted/90 truncate max-w-[240px] sm:max-w-xs">
                {isTe ? suitability.reasonTe : suitability.reasonEn}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          className="text-ivory-muted hover:text-white p-1 rounded-lg transition-colors shrink-0"
          aria-label="Toggle details"
        >
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded Details Drawer */}
      {isExpanded && (
        <div className="px-3.5 pb-3 pt-1 border-t border-white/10 space-y-2 text-[11px] leading-relaxed">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">
              {isTe ? "ముఖ ఆకృతి విశ్లేషణ:" : "Face Shape Analysis:"}
            </span>
            <p className="text-ivory-muted text-[10px]">
              {isTe ? analysis.descriptionTe : analysis.descriptionEn}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">
              {isTe ? "ఆభరణాల సరిపోలిక కారణం:" : "Stylist Match Rationale:"}
            </span>
            <p className="text-ivory text-[10.5px]">
              {isTe ? suitability.reasonTe : suitability.reasonEn}
            </p>
          </div>

          {(suitability.alternativeTipEn || suitability.alternativeTipTe) && (
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-0.5 text-[10px]">
              <span className="font-semibold block text-amber-300">
                {isTe ? "💡 స్టైలింగ్ సలహా:" : "💡 Goldsmith Styling Tip:"}
              </span>
              <p>{isTe ? suitability.alternativeTipTe : suitability.alternativeTipEn}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
