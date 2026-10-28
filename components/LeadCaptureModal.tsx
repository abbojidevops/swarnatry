"use client";

import React, { useState } from "react";
import { JewelryItem } from "@/data/mockJewelryCatalog";
import { formatINR } from "@/lib/goldMath";
import { saveLead, OccasionType, ShowroomLead } from "@/lib/leadStore";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  Sparkles,
  Phone,
  User,
  Heart,
  Gift,
  Calendar,
  CheckCircle2,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (lead: ShowroomLead) => void;
  ornamentItem?: JewelryItem | null;
  currentGrams?: number;
  estimatedPrice?: number;
  source?: "live-ar" | "photo-match" | "calculator" | "scheme" | "poll" | "bridal";
  title?: string;
  subtitle?: string;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ornamentItem,
  currentGrams = 32,
  estimatedPrice = 250000,
  source = "calculator",
  title,
  subtitle,
}) => {
  const { isTe } = useLanguage();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [occasion, setOccasion] = useState<OccasionType>("wedding");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    const newLead = saveLead({
      customerName: customerName.trim(),
      phone: phone.trim(),
      occasion,
      ornamentId: ornamentItem?.id || "CUSTOM-TRYON",
      ornamentName: ornamentItem?.name || "Bridal Jewelry Try-On",
      selectedGrams: currentGrams,
      estimatedPrice,
      source,
      notes: notes.trim() || undefined,
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#10B981"],
    });

    setIsSubmitting(false);
    if (onSuccess) onSuccess(newLead);
    onClose();
  };

  const occasions: { id: OccasionType; labelEn: string; labelTe: string; icon: any }[] = [
    { id: "wedding", labelEn: "Wedding", labelTe: "శుభ వివాహం", icon: Heart },
    { id: "festival", labelEn: "Festival", labelTe: "పండుగ", icon: Sparkles },
    { id: "gift", labelEn: "Gift", labelTe: "బహుమతి", icon: Gift },
    { id: "personal", labelEn: "Personal", labelTe: "వ్యక్తిగతం", icon: Calendar },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-obsidian-900 border border-gold-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-ivory">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-obsidian-950/60 hover:bg-obsidian-800 text-ivory-muted hover:text-ivory transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>
              {isTe ? "ప్రత్యేక షోరూమ్ ఆఫర్ & కొటేషన్" : "Showroom Quote & Priority Access"}
            </span>
          </div>
          <h3 className="font-cinzel text-xl font-bold text-ivory">
            {title ||
              (isTe
                ? "మీ నగల కొటేషన్ సేవ్ చేసుకోండి"
                : "Save Your Custom Try-On & Estimate")}
          </h3>
          <p className="text-xs text-ivory-muted max-w-xs mx-auto">
            {subtitle ||
              (isTe
                ? "కస్టమ్ మేకింగ్ చార్జీలు, లైవ్ గోల్డ్ రేట్ తగ్గింపు మరియు వాట్సాప్ అప్‌డేట్‌లను పొందండి."
                : "Unlock exact goldsmith making charges, 0% wastage gold scheme offers, and instant WhatsApp support.")}
          </p>
        </div>

        {/* Selected Ornament Summary Pill */}
        {ornamentItem && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-obsidian-950/80 border border-gold-900/60 text-xs">
            <div className="truncate max-w-[200px]">
              <span className="font-semibold text-ivory block truncate">
                {ornamentItem.name}
              </span>
              <span className="text-[11px] text-ivory-muted">
                {currentGrams}g • 22K 916
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-ivory-muted uppercase tracking-wider block">
                Approx
              </span>
              <span className="font-mono font-bold text-gold-300">
                {formatINR(estimatedPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Lead Capture Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-ivory-muted flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold-400" />
              <span>{isTe ? "కస్టమర్ పేరు (Full Name):" : "Your Full Name:"}</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={isTe ? "ఉదా: శ్రావణి రెడ్డి" : "e.g. Sravani Reddy"}
              className="w-full bg-obsidian-950 border border-gold-500/40 rounded-xl px-3.5 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-ivory-muted flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gold-400" />
              <span>{isTe ? "వాట్సాప్ నెంబర్ (WhatsApp Number):" : "WhatsApp Number:"}</span>
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-obsidian-950 border border-gold-500/40 rounded-xl px-3.5 py-2.5 text-xs text-ivory focus:outline-none focus:border-gold-400 font-mono"
            />
          </div>

          {/* Occasion Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-ivory-muted">
              {isTe ? "కొనుగోలు సందర్భం (Shopping Occasion):" : "Shopping Occasion:"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {occasions.map((occ) => {
                const Icon = occ.icon;
                const isSelected = occasion === occ.id;
                return (
                  <button
                    key={occ.id}
                    type="button"
                    onClick={() => setOccasion(occ.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? "bg-gold-500/20 border-gold-400 text-gold-200"
                        : "bg-obsidian-950 border-white/5 text-ivory-muted hover:text-ivory"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-gold-400" />
                    <span>{isTe ? occ.labelTe : occ.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-gold-primary w-full py-3 rounded-xl text-xs font-bold shadow-gold-glow flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isTe
                ? "కొటేషన్ సేవ్ చేయండి & వివరాలు పొందండి"
                : "Save Estimate & Unlock Showroom Offers"}
            </span>
          </button>
        </form>

        {/* Skip for Demo Link */}
        <div className="text-center pt-1 border-t border-gold-900/40">
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] text-ivory-muted hover:text-gold-300 transition-colors inline-flex items-center gap-1"
          >
            <span>{isTe ? "తరువాత చేస్తాను (డెమో కొనసాగించండి)" : "Skip for now (Continue demo without saving)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
