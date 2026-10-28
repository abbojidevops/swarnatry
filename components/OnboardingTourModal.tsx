"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Camera,
  Layers,
  Coins,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Crown,
  Scale,
  Receipt,
  Languages,
} from "lucide-react";

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (actionKey: "calculator" | "live-ar" | "photo-match" | "bridal-set" | "orders") => void;
}

interface TourSlide {
  id: string;
  badge: string;
  badgeTe: string;
  title: string;
  titleTe: string;
  subtitle: string;
  subtitleTe: string;
  description: string;
  descriptionTe: string;
  points: string[];
  pointsTe: string[];
  icon: React.ReactNode;
  actionKey: "calculator" | "live-ar" | "photo-match" | "bridal-set" | "orders";
  actionLabel: string;
  actionLabelTe: string;
}

const TOUR_SLIDES: TourSlide[] = [
  {
    id: "slide-calculator",
    badge: "Module 1 • Dynamic Pricing",
    badgeTe: "మాడ్యూల్ 1 • లైవ్ ధర & తూకం",
    title: "Real Craftable Gram Ranges & Live Bullion",
    titleTe: "స్వర్ణకారుల నిజమైన తూకం & లైవ్ బంగారం రేటు",
    subtitle: "Precision calculations without hidden charges",
    subtitleTe: "ఎటువంటి దాగివున్న ఛార్జీలు లేకుండా పారదర్శక లెక్కింపు",
    description:
      "Every heritage ornament is calibrated with real-world craftable weights (e.g. 18g–26g). Slide the weight bar to dynamically update gold thickness, wastage (VA %), and live 22K/24K prices.",
    descriptionTe:
      "ప్రతి ఆభరణం నిజమైన స్వర్ణకారుల బరువు పరిధితో (18 గ్రా – 26 గ్రా) రూపొందించబడింది. బరువు స్లైడర్ ద్వారా తరుగు (VA %), మజూరి మరియు లైవ్ 22K బంగారు ధరలను స్వయంచాలకంగా లెక్కించండి.",
    points: [
      "Live 22K & 24K gold rate input editable by showroom staff",
      "Dynamic physical gold density note (Lightweight vs Heirloom Antique)",
      "Zero-hidden-fee itemized breakdown with 3% GST",
    ],
    pointsTe: [
      "షోరూమ్ సిబ్బంది సులభంగా మార్చుకోగల లైవ్ 22K & 24K ధరలు",
      "బరువును బట్టి తేలికపాటి లేదా ఘనమైన నక్షి ఆభరణాల వివరణ",
      "3% జీఎస్టీతో కూడిన పారదర్శక రసీదు బ్రేకప్",
    ],
    icon: <Scale className="w-8 h-8 text-gold-300" />,
    actionKey: "calculator",
    actionLabel: "Try Live Calculator",
    actionLabelTe: "లైవ్ కాలిక్యులేటర్ చూడండి",
  },
  {
    id: "slide-ar-tryon",
    badge: "Module 2 • AI Computer Vision",
    badgeTe: "మాడ్యూల్ 2 • AI కంప్యూటర్ విజన్",
    title: "Live Camera AR & Screenshot Match",
    titleTe: "లైవ్ కెమెరా AR & స్క్రీన్‌షాట్ ఫోటో మ్యాచ్",
    subtitle: "Wear on face in real-time or upload Instagram screenshots",
    subtitleTe: "లైవ్ కెమెరాలో లేదా ఇన్‌స్టాగ్రామ్ ఫోటోలతో ట్రై చేయండి",
    description:
      "Experience realistic gold try-on with automatic facial landmark tracking for Harams, Chokers, Jhumkas, and Maang Tikkas. Upload any custom jewelry photo to isolate it with 1-click AI chroma cleaning.",
    descriptionTe:
      "హారాలు, చోకర్లు, జుంకాలు మరియు పాపిడి బిళ్ళలను మీ ముఖంపై లైవ్ AR ద్వారా ధరించండి. ఇన్‌స్టాగ్రామ్ లేదా వాట్సాప్ నుండి నగల ఫోటోలను అప్‌లోడ్ చేసి క్షణాల్లో బ్యాక్‌గ్రౌండ్ తొలగించండి.",
    points: [
      "MediaPipe real-time face landmark calibration",
      "Custom Screenshot Upload with velvet/tray background remover",
      "Side-by-side bridal comparison cards for family sharing",
    ],
    pointsTe: [
      "మీడియాపైప్ ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ఫేస్ ట్రాకింగ్",
      "వెల్వెట్ ట్రే రంగును క్లిక్ చేసి తొలగించే బ్యాక్‌గ్రౌండ్ రిమూవర్",
      "కుటుంబ సభ్యులకు వాట్సాప్‌లో పంపడానికి పోలిక కార్డులు",
    ],
    icon: <Camera className="w-8 h-8 text-gold-300" />,
    actionKey: "live-ar",
    actionLabel: "Launch Live AR Camera",
    actionLabelTe: "లైవ్ AR కెమెరా ప్రారంభించండి",
  },
  {
    id: "slide-bridal-combo",
    badge: "Module 3 • Bridal Combo Set",
    badgeTe: "మాడ్యూల్ 3 • పెళ్లి నగల సెట్ కాంబో",
    title: "5-Piece Layering & Reverse Budget Allocator",
    titleTe: "5 ఆభరణాల లేయరింగ్ & కుటుంబ బడ్జెట్ ప్లానర్",
    subtitle: "Wear Choker + Haram + Earrings + Tikka simultaneously",
    subtitleTe: "చోకర్, హారం, జుంకాలు, పాపిడి బిళ్ళను ఒకేసారి ధరించండి",
    description:
      "Layer multiple ornaments together with 3D neck-curve perspective warping. Set your family wedding budget to let the AI auto-balance gold weights across all 5 bridal pieces within safe craft limits.",
    descriptionTe:
      "చోకర్, లాంగ్ హారం, జుంకాలు మరియు పాపిడి బిళ్ళలను ఒకేసారి ధరించండి. మెడ వంపును బట్టి 3D నెక్-కర్వ్ వార్పింగ్ సెట్ చేయబడుతుంది. మీ బడ్జెట్ ఎంచుకుంటే యాప్ ప్రతి ఆభరణం బరువును ఆటోమేటిక్‌గా సర్దుబాటు చేస్తుంది.",
    points: [
      "Simultaneous 5-slot anatomical layer rendering",
      "3D neck curvature perspective wrap for Harams & Chokers",
      "1-Click Curated Heritage Presets (Tirumala Temple, Nizami Kundan)",
    ],
    pointsTe: [
      "ఒకేసారి 5 శరీర భాగాలపై ఆభరణాల అమరిక",
      "మెడ ఆకారాన్ని బట్టి 3D సహజసిద్ధమైన వంపు",
      "1-క్లిక్ సాంప్రదాయ పెళ్లి సెట్ ప్రీసెట్లు",
    ],
    icon: <Crown className="w-8 h-8 text-gold-300" />,
    actionKey: "bridal-set",
    actionLabel: "Open Bridal Set Tray",
    actionLabelTe: "పెళ్లి సెట్ ట్రే చూడండి",
  },
  {
    id: "slide-exchange-karigar",
    badge: "Module 4 • Workshop & Lifecycle",
    badgeTe: "మాడ్యూల్ 4 • పాత బంగారం & వర్క్‌షాప్",
    title: "Old Gold Trade-in & Karigar Order Pipeline",
    titleTe: "పాత బంగారు మార్పిడి & 5-దశల వర్క్‌షాప్ ఆర్డర్లు",
    subtitle: "Melting loss engine, A4 quotes, and 80mm thermal receipts",
    subtitleTe: "కరుగుదల తగ్గింపు, A4 కొటేషన్లు & 80mm థర్మల్ రసీదులు",
    description:
      "Deduct old heirloom gold value directly from new bridal purchases. Track bespoke jewelry creation across 5 production stages with 1-click WhatsApp progress updates for customers.",
    descriptionTe:
      "పాత బంగారు ఆభరణాల విలువను కొత్త పెళ్లి సెట్ నుండి నేరుగా తగ్గించండి. ఆర్డర్ బుక్ చేసినప్పటి నుండి డెలివరీ వరకు 5 దశల్లో వర్క్‌షాప్ పనులను ట్రాక్ చేసి కస్టమర్‌కు వాట్సాప్ అప్‌డేట్లు పంపండి.",
    points: [
      "Hallmark 916 & KDM soldered melt deduction calculation",
      "Dual-format printable slips: A4 Royal Bridal Slip + 80mm POS Slip",
      "5-Stage Karigar Tracker with automated Telugu & English WhatsApp updates",
    ],
    pointsTe: [
      "హాల్‌మార్క్ 916 & కేడీఎం సాల్డర్ కరుగుదల లెక్కలు",
      "రెండు రకాల ప్రింట్ రసీదులు: A4 రాయల్ కొటేషన్ & 80mm థర్మల్ స్లిప్",
      "5 దశల కారికర్ ట్రాకర్ & వాట్సాప్ స్టేటస్ సందేశాలు",
    ],
    icon: <Receipt className="w-8 h-8 text-gold-300" />,
    actionKey: "orders",
    actionLabel: "View Karigar Orders",
    actionLabelTe: "వర్క్‌షాప్ ఆర్డర్లు చూడండి",
  },
];

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
  onAction,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [language, setLanguage] = useState<"en" | "te">("en");
  const isTe = language === "te";

  if (!isOpen) return null;

  const slide = TOUR_SLIDES[currentSlideIndex];
  const isFirst = currentSlideIndex === 0;
  const isLast = currentSlideIndex === TOUR_SLIDES.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentSlideIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("swarnatry_tour_seen", "true");
      localStorage.setItem("swarnatry_onboarding_completed", "true");
    } catch (e) {}
    onClose();
  };

  const handleExecuteAction = () => {
    handleComplete();
    if (onAction) {
      onAction(slide.actionKey);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-2xl bg-obsidian-900 border border-gold-500/50 rounded-3xl shadow-gold-glow-lg overflow-hidden my-auto flex flex-col text-ivory"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 border-b border-gold-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-900/50 border border-gold-700/60 flex items-center justify-center text-gold-300">
              <Sparkles className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <span className="text-xs font-bold font-cinzel text-gold-300 tracking-wider">
                SWARNATRY SHOWCASE
              </span>
              <p className="text-[10px] text-ivory-muted">Interactive Feature Walkthrough</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(isTe ? "en" : "te")}
              className="text-xs bg-obsidian-800 border border-gold-900/60 hover:border-gold-500 text-gold-300 px-2.5 py-1 rounded-lg transition-colors font-medium flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{isTe ? "English" : "తెలుగు"}</span>
            </button>

            <button
              onClick={handleComplete}
              className="w-7 h-7 rounded-lg bg-obsidian-800 text-ivory-muted hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-1">
          {/* Badge & Icon Banner */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-500/20 text-gold-300 border border-gold-500/40 mb-2">
                {isTe ? slide.badgeTe : slide.badge}
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-cinzel text-ivory">
                {isTe ? slide.titleTe : slide.title}
              </h3>
              <p className="text-xs text-gold-400 font-medium mt-1">
                {isTe ? slide.subtitleTe : slide.subtitle}
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-obsidian-950 to-gold-950/40 border border-gold-500/40 flex items-center justify-center shrink-0 shadow-gold-glow">
              {slide.icon}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-ivory-soft leading-relaxed">
            {isTe ? slide.descriptionTe : slide.description}
          </p>

          {/* Key Feature Bullets */}
          <div className="bg-obsidian-950/80 rounded-2xl p-4 border border-gold-900/50 space-y-2.5">
            <span className="text-[11px] font-semibold text-gold-400 uppercase tracking-wider block">
              {isTe ? "ముఖ్య ప్రయోజనాలు:" : "Key Architectural Capabilities:"}
            </span>
            <ul className="space-y-2 text-xs">
              {(isTe ? slide.pointsTe : slide.points).map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-ivory/90">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Slide Navigation & Jump-In Footer */}
        <div className="px-6 py-4 bg-obsidian-950 border-t border-gold-900/60 flex items-center justify-between gap-3 flex-wrap">
          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5">
            {TOUR_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                data-slide={s.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`tour-slide h-2 rounded-full transition-all ${
                  idx === currentSlideIndex
                    ? "w-7 bg-gold-400"
                    : "w-2 bg-obsidian-700 hover:bg-gold-800"
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteAction}
              className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-gold-glow"
            >
              <span>Try This: {isTe ? slide.actionLabelTe : slide.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 border-l border-gold-900/60 pl-2">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-xl bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 transition-colors"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-3 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-ivory text-xs font-semibold flex items-center gap-1 transition-colors border border-white/5"
              >
                <span>{isLast ? (isTe ? "ముగించండి" : "Finish") : (isTe ? "తరువాత" : "Next")}</span>
                {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
