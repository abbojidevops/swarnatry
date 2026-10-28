"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Camera,
  UploadCloud,
  Calculator,
  Gem,
  Store,
  Crown,
  ChevronDown,
  Edit3,
  Check,
  RotateCcw,
  PlusCircle,
  ShieldCheck,
  Lock,
  Cloud,
  ClipboardList,
  Download,
  HelpCircle,
  Smartphone,
  Languages,
} from "lucide-react";
import { formatINR, DEFAULT_GOLD_CONFIG } from "@/lib/goldMath";
import { CloudSyncStatus } from "@/lib/catalogStore";
import { useLanguage } from "@/context/LanguageContext";

interface NavbarProps {
  activeTab: "catalog" | "live-ar" | "photo-match";
  setActiveTab: (tab: "catalog" | "live-ar" | "photo-match") => void;
  goldRate22K: number;
  setGoldRate22K: (rate: number) => void;
  goldRate24K: number;
  setGoldRate24K: (rate: number) => void;
  onOpenSubscription: () => void;
  onOpenAdminStudio: () => void;
  showroomMode: boolean;
  setShowroomMode: (val: boolean) => void;
  showroomName: string;
  setShowroomName: (name: string) => void;
  customOrnamentsCount: number;
  syncStatus?: CloudSyncStatus;
  isRateLocked?: boolean;
  bridalSlotsCount?: number;
  onOpenBridalDrawer?: () => void;
  onOpenOrderLedger?: () => void;
  ordersCount?: number;
  onOpenTour?: () => void;
  onInstallPWA?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  goldRate22K,
  setGoldRate22K,
  goldRate24K,
  setGoldRate24K,
  onOpenSubscription,
  onOpenAdminStudio,
  showroomMode,
  setShowroomMode,
  showroomName,
  setShowroomName,
  customOrnamentsCount,
  syncStatus = "offline",
  isRateLocked = false,
  bridalSlotsCount = 0,
  onOpenBridalDrawer,
  onOpenOrderLedger,
  ordersCount = 0,
  onOpenTour,
  onInstallPWA,
}) => {
  const { isTe, toggleLanguage } = useLanguage();
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [temp22K, setTemp22K] = useState(goldRate22K.toString());
  const [temp24K, setTemp24K] = useState(goldRate24K.toString());
  const [isEditingShowroom, setIsEditingShowroom] = useState(false);
  const [tempShowroomName, setTempShowroomName] = useState(showroomName);

  const handleSaveRates = () => {
    const r22 = parseFloat(temp22K);
    const r24 = parseFloat(temp24K);
    if (!isNaN(r22) && r22 > 0) setGoldRate22K(r22);
    if (!isNaN(r24) && r24 > 0) setGoldRate24K(r24);
    setIsEditingRate(false);
  };

  const handleResetRates = () => {
    setGoldRate22K(DEFAULT_GOLD_CONFIG.goldRate22K);
    setGoldRate24K(DEFAULT_GOLD_CONFIG.goldRate24K);
    setTemp22K(DEFAULT_GOLD_CONFIG.goldRate22K.toString());
    setTemp24K(DEFAULT_GOLD_CONFIG.goldRate24K.toString());
    setIsEditingRate(false);
  };

  const handleSaveShowroom = () => {
    if (tempShowroomName.trim()) {
      setShowroomName(tempShowroomName.trim());
    }
    setIsEditingShowroom(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gold-900/60 bg-obsidian-950/85 backdrop-blur-md">
      {/* Top Bullion & Showroom Bar */}
      <div className="bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 px-4 py-1.5 border-b border-gold-subtle text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Live Bullion Ticker */}
          <div className="flex items-center gap-3 overflow-x-auto py-0.5 no-scrollbar">
            <div className="flex items-center gap-1.5 text-gold-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="tracking-wider uppercase text-[10px] text-ivory-muted">
                Live Bullion:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-ivory font-semibold">
                22K:{" "}
                <span className="text-gold-300">
                  {formatINR(goldRate22K)}/g
                </span>
              </span>
              <span className="text-ivory-muted/40">•</span>
              <span className="text-ivory font-semibold">
                24K:{" "}
                <span className="text-gold-200">
                  {formatINR(goldRate24K)}/g
                </span>
              </span>
            </div>

            {isRateLocked ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                <Lock className="w-2.5 h-2.5" />
                <span>Locked by Showroom</span>
              </span>
            ) : (
              <button
                onClick={() => setIsEditingRate(!isEditingRate)}
                className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-gold-500/10 hover:bg-gold-500/20 text-gold-300 border border-gold-500/30 transition-colors"
                title="Edit Store Gold Rates"
              >
                <Edit3 className="w-3 h-3" />
                <span>Modify Rate</span>
              </button>
            )}

            {/* Cloud Sync Status Indicator */}
            <span
              data-sync-status={syncStatus}
              onClick={onOpenAdminStudio}
              className={`sync-badge cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                syncStatus === "synced"
                  ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
                  : syncStatus === "syncing"
                  ? "bg-gold-950/70 text-gold-300 border-gold-500/40 animate-pulse"
                  : "bg-amber-950/70 text-amber-300 border-amber-500/40"
              }`}
              title="Cloud Sync Engine Status"
            >
              <Cloud className="w-3 h-3" />
              <span>
                {syncStatus === "synced"
                  ? "Cloud Synced 🟢"
                  : syncStatus === "syncing"
                  ? "Syncing ⏳"
                  : "Offline Mode 🟡"}
              </span>
            </span>
          </div>

          {/* Right side: Admin Upload Studio + Bridal Tray + Showroom Kiosk Mode */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-obsidian-900/90 hover:bg-gold-950/60 text-gold-300 border border-gold-700/50 shadow-sm transition-all"
              title="Switch Language / భాషను మార్చండి (English / తెలుగు)"
            >
              <Languages className="w-3.5 h-3.5 text-gold-400" />
              <span>{isTe ? "English" : "తెలుగు"}</span>
            </button>

            {/* Interactive Demo Walkthrough */}
            {onOpenTour && (
              <button
                onClick={onOpenTour}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-gold-950/40 hover:bg-gold-950/80 text-gold-300 border border-gold-800/60 shadow-sm transition-all"
                title="Launch Interactive 4-Module Showcase & Pitch Tour"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Demo Tour</span>
              </button>
            )}

            {/* PWA Kiosk Install Trigger */}
            <button
              onClick={onInstallPWA || (() => {
                alert("To install on mobile / tablet: Tap your browser Share menu and select 'Add to Home Screen'.");
              })}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-obsidian-900/90 hover:bg-gold-950/60 text-gold-300 border border-gold-700/50 shadow-sm transition-all"
              title="Install SwarnaTry on Home Screen / Tablet Kiosk"
            >
              <Download className="w-3.5 h-3.5 text-gold-400" />
              <span>📲 Install App</span>
            </button>

            {/* Bridal Tray Button */}
            {onOpenBridalDrawer && (
              <button
                onClick={onOpenBridalDrawer}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-gold-950/70 hover:bg-gold-900/80 text-gold-300 border border-gold-600/50 shadow-md transition-all"
                title="Open Bridal Combo Trousseau Tray & Budget Planner"
              >
                <Crown className="w-3.5 h-3.5 text-gold-400" />
                <span>Bridal Set</span>
                {bridalSlotsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-gold-500 text-obsidian-950 font-bold text-[9px]">
                    {bridalSlotsCount}
                  </span>
                )}
              </button>
            )}

            {/* Karigar Orders & Booking Ledger */}
            {onOpenOrderLedger && (
              <button
                onClick={onOpenOrderLedger}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-obsidian-900/90 hover:bg-gold-950/60 text-gold-300 border border-gold-700/50 shadow-md transition-all"
                title="View Goldsmith Karigar Orders & Production Stages"
              >
                <ClipboardList className="w-3.5 h-3.5 text-gold-400" />
                <span>Orders</span>
                {typeof ordersCount === "number" && ordersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-gold-500 text-obsidian-950 font-bold text-[9px]">
                    {ordersCount}
                  </span>
                )}
              </button>
            )}

            {/* Goldsmith Admin Studio Quick Button */}
            <button
              onClick={onOpenAdminStudio}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-gold-500/20 via-gold-400/25 to-gold-500/20 text-gold-200 border border-gold-400/50 shadow-gold-glow hover:scale-105 transition-all"
              title="Upload Real Ornaments without Touching Code"
            >
              <PlusCircle className="w-3.5 h-3.5 text-gold-300" />
              <span>Admin Studio</span>
              {customOrnamentsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-gold-500 text-obsidian-950 font-bold text-[9px]">
                  {customOrnamentsCount}
                </span>
              )}
            </button>

            {showroomMode ? (
              <div className="flex items-center gap-2 bg-gold-500/15 border border-gold-500/40 rounded-full px-3 py-0.5">
                <Store className="w-3 h-3 text-gold-400" />
                <span className="text-[11px] text-gold-200 font-medium">
                  {showroomName}
                </span>
                <button
                  onClick={() => setIsEditingShowroom(true)}
                  className="text-ivory-muted hover:text-gold-300"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowroomMode(true)}
                className="hidden sm:inline-flex items-center gap-1 text-[11px] text-ivory-muted hover:text-gold-300 transition-colors"
              >
                <Store className="w-3 h-3" />
                <span>Showroom Mode</span>
              </button>
            )}

            <button
              onClick={onOpenSubscription}
              className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full transition-all hover:border-amber-400"
            >
              <Crown className="w-3 h-3" />
              <span>{showroomMode ? "Pro" : "Upgrade"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modify Rate Dropdown Modal/Banner */}
      {isEditingRate && (
        <div className="bg-obsidian-900 border-b border-gold-500/40 px-4 py-3 animate-in slide-in-from-top">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-ivory-soft">
              <span className="font-semibold text-gold-300 block sm:inline">
                Shopkeeper Gold Rate Override:
              </span>{" "}
              Changes apply instantly across all live estimations, making
              charges, and quotes.
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <label className="text-ivory-muted">22K (₹/g):</label>
                <input
                  type="number"
                  value={temp22K}
                  onChange={(e) => setTemp22K(e.target.value)}
                  className="w-24 bg-obsidian-950 border border-gold-500/40 rounded px-2 py-1 text-gold-200 text-xs focus:outline-none focus:border-gold-400"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <label className="text-ivory-muted">24K (₹/g):</label>
                <input
                  type="number"
                  value={temp24K}
                  onChange={(e) => setTemp24K(e.target.value)}
                  className="w-24 bg-obsidian-950 border border-gold-500/40 rounded px-2 py-1 text-gold-200 text-xs focus:outline-none focus:border-gold-400"
                />
              </div>

              <button
                onClick={handleSaveRates}
                className="bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-semibold px-3 py-1 rounded text-xs inline-flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Apply
              </button>

              <button
                onClick={handleResetRates}
                className="text-ivory-muted hover:text-ivory px-2 py-1 text-xs inline-flex items-center gap-1"
                title="Reset to default market benchmark"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Showroom Name Modal */}
      {isEditingShowroom && (
        <div className="bg-obsidian-900 border-b border-gold-500/40 px-4 py-2.5">
          <div className="max-w-md mx-auto flex items-center gap-2">
            <span className="text-xs text-gold-300 font-medium shrink-0">
              Showroom Name:
            </span>
            <input
              type="text"
              value={tempShowroomName}
              onChange={(e) => setTempShowroomName(e.target.value)}
              className="flex-1 bg-obsidian-950 border border-gold-500/40 rounded px-2.5 py-1 text-xs text-ivory focus:outline-none focus:border-gold-400"
              placeholder="e.g. Sri Krishna Jewellers"
            />
            <button
              onClick={handleSaveShowroom}
              className="bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-semibold px-3 py-1 rounded text-xs"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingShowroom(false)}
              className="text-ivory-muted hover:text-ivory text-xs px-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Nav Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div
            onClick={() => setActiveTab("catalog")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-gold-300 via-gold-500 to-gold-800 p-[1.5px] shadow-gold-glow transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-obsidian-950 rounded-[10px] flex items-center justify-center">
                <Gem className="w-5 h-5 sm:w-6 sm:h-6 text-gold-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-cinzel text-xl sm:text-2xl font-bold tracking-wider text-gold-gradient">
                  SWARNATRY
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300 border border-gold-500/40">
                  AI AR
                </span>
              </div>
              <p className="text-[11px] text-ivory-muted font-light tracking-wide -mt-0.5">
                {showroomMode
                  ? showroomName
                  : "Virtual Try-On & Gold Estimation"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex items-center bg-obsidian-900/90 border border-gold-900/80 rounded-full p-1 shadow-inner-gold">
              <button
                onClick={() => setActiveTab("catalog")}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "catalog"
                    ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 shadow-gold-glow font-semibold"
                    : "text-ivory-muted hover:text-gold-200"
                }`}
              >
                <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Catalog &</span>
                <span>Estimator</span>
              </button>

              <button
                onClick={() => setActiveTab("live-ar")}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "live-ar"
                    ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 shadow-gold-glow font-semibold"
                    : "text-ivory-muted hover:text-gold-200"
                }`}
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Mode 1:</span>
                <span>Live AR</span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ruby-light opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ruby-light"></span>
                </span>
              </button>

              <button
                onClick={() => setActiveTab("photo-match")}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "photo-match"
                    ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 shadow-gold-glow font-semibold"
                    : "text-ivory-muted hover:text-gold-200"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Mode 2:</span>
                <span>Photo Match</span>
              </button>
            </nav>

            <button
              onClick={onOpenSubscription}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 text-obsidian-950 shadow-gold-glow hover:scale-105 transition-all"
              title="Unlock B2C Bridal Pass or B2B Showroom Pro Kiosk"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Pro Pass</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
