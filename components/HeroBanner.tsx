"use client";

import React from "react";
import {
  Camera,
  UploadCloud,
  Calculator,
  Sparkles,
  ShieldCheck,
  Scale,
  Gem,
  ArrowRight,
} from "lucide-react";

interface HeroBannerProps {
  onStartLiveAR: () => void;
  onStartPhotoMatch: () => void;
  onExploreCatalog: () => void;
  showroomMode: boolean;
  showroomName: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onStartLiveAR,
  onStartPhotoMatch,
  onExploreCatalog,
  showroomMode,
  showroomName,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-royal-card border border-gold-subtle shadow-gold-glow p-6 sm:p-10 text-center sm:text-left">
      {/* Decorative Radial Gold Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-ruby-950/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10 max-w-3xl space-y-5">
        {/* Heritage Crown Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-gold-400" />
          <span>
            {showroomMode
              ? `Welcome to ${showroomName} Virtual Showroom`
              : "Traditional Indian Bridal & Heritage Gold AR Platform"}
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-cinzel text-3xl sm:text-5xl font-bold tracking-tight text-ivory leading-tight sm:leading-tight">
          Adorn Royal Gold <br />
          <span className="text-gold-gradient">Before You Step In Store</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-ivory-muted leading-relaxed font-normal max-w-2xl">
          Visualize bespoke Harams, Chokers, Jhumkas, and Maang Tikkas on your
          face via <strong className="text-ivory">Live AR Camera</strong> or{" "}
          <strong className="text-ivory">Custom Photo Match</strong>. Calculate
          exact craftable gram ranges, wastage (VA%), and live estimated prices
          with 100% financial clarity.
        </p>

        {/* Main CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={onStartLiveAR}
            className="btn-gold-primary w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-gold-glow"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Live AR Camera</span>
          </button>

          <button
            onClick={onStartPhotoMatch}
            className="btn-gold-secondary w-full sm:w-auto px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Match From Photo / Screenshot</span>
          </button>

          <button
            onClick={onExploreCatalog}
            className="text-ivory-muted hover:text-gold-200 text-xs font-semibold px-4 py-3 flex items-center gap-1.5 transition-colors"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gold-900/40">
          <div className="flex items-center gap-2 text-xs text-ivory-muted">
            <Gem className="w-4 h-4 text-gold-400 shrink-0" />
            <span>8+ Authentic Heritage Designs</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-ivory-muted">
            <Scale className="w-4 h-4 text-gold-400 shrink-0" />
            <span>Craftable Gram Range Slider</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-ivory-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>22K BIS Hallmarked Grounding</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-ivory-muted">
            <Calculator className="w-4 h-4 text-gold-400 shrink-0" />
            <span>Wastage & Making Charge Breakdown</span>
          </div>
        </div>
      </div>
    </div>
  );
};
