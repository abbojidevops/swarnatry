"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { HeroBanner } from "@/components/HeroBanner";
import { CatalogGrid } from "@/components/CatalogGrid";
import { LiveARTryOn } from "@/components/LiveARTryOn";
import { CustomPhotoTryOn } from "@/components/CustomPhotoTryOn";
import { GoldCalculatorModal } from "@/components/GoldCalculatorModal";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { AdminUploadStudio } from "@/components/AdminUploadStudio";
import { ShareDesignModal } from "@/components/ShareDesignModal";
import { BridalComboDrawer } from "@/components/BridalComboDrawer";
import { PrintableEstimateModal } from "@/components/PrintableEstimateModal";
import { OrderLedgerDrawer } from "@/components/OrderLedgerDrawer";
import { PWAInstallBanner, usePWAInstall } from "@/components/PWAInstallBanner";
import { OnboardingTourModal } from "@/components/OnboardingTourModal";
import { JewelryItem } from "@/data/mockJewelryCatalog";
import { useJewelryCatalog } from "@/lib/catalogStore";
import { useGoldRateStore } from "@/lib/goldRateStore";
import { getStoredOrders, GoldsmithOrder } from "@/lib/orderStore";
import {
  BridalComboSlots,
  BridalSlotId,
  INITIAL_BRIDAL_SLOTS,
  BRIDAL_PRESETS,
  loadPersistedBridalSlots,
  savePersistedBridalSlots,
  getPersistedComboMode,
  setPersistedComboMode,
  determineSlotForItem,
} from "@/lib/comboSetStore";
import {
  Sparkles,
  Camera,
  UploadCloud,
  Calculator,
  ShieldCheck,
  Store,
  ChevronRight,
  Heart,
  Crown,
  PlusCircle,
  QrCode,
  Layers,
  X,
} from "lucide-react";
import { savePaymentSettings } from "@/lib/paymentGateway";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Helper component inside Suspense to read URL deep-link query parameters
 * e.g. ?tryon=SW-HRM-104&mode=live-ar OR ?shop=Sri+Vasavi+Gold&rate22k=7250&wa=919876543210
 */
function DeepLinkHandler({
  catalog,
  onDeepLinkMatch,
  onPartnerShowroomMatch,
}: {
  catalog: JewelryItem[];
  onDeepLinkMatch: (
    item: JewelryItem,
    mode: "live-ar" | "photo-match" | "calculator" | "bridal"
  ) => void;
  onPartnerShowroomMatch?: (params: {
    shop: string;
    rate22k?: number;
    phone?: string;
    city?: string;
  }) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Partner Showroom Link Query Parameters (?shop=...&rate22k=...&wa=...&city=...)
    const shop = searchParams.get("shop") || searchParams.get("showroom");
    const rate22kParam = searchParams.get("rate22k") || searchParams.get("rate");
    const waParam = searchParams.get("wa") || searchParams.get("phone");
    const cityParam = searchParams.get("city");

    if (shop && onPartnerShowroomMatch) {
      const rateNum = rate22kParam ? parseFloat(rate22kParam) : undefined;
      onPartnerShowroomMatch({
        shop,
        rate22k: rateNum && !isNaN(rateNum) && rateNum > 0 ? rateNum : undefined,
        phone: waParam || undefined,
        city: cityParam || undefined,
      });
    }

    // 2. Try-On Item Deep Link (?tryon=SKU&mode=... or ?tryonA=SKU&tryonB=SKU)
    const tryonSku = searchParams.get("tryon") || searchParams.get("tryonA");
    const modeParam = searchParams.get("mode");

    if (tryonSku && catalog.length > 0) {
      const matched = catalog.find(
        (i) => i.id.toLowerCase() === tryonSku.toLowerCase()
      );
      if (matched) {
        let mode: "live-ar" | "photo-match" | "calculator" | "bridal" = "live-ar";
        if (modeParam === "photo-match" || modeParam === "photo") {
          mode = "photo-match";
        } else if (modeParam === "calculator" || modeParam === "calc") {
          mode = "calculator";
        } else if (modeParam === "bridal" || modeParam === "combo" || modeParam === "bridal-poll") {
          mode = "bridal";
        }
        onDeepLinkMatch(matched, mode);
      }
    }
  }, [searchParams, catalog, onDeepLinkMatch, onPartnerShowroomMatch]);

  return null;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "catalog" | "live-ar" | "photo-match"
  >("catalog");

  // Dynamic Persistent Catalog Store (IndexedDB + Supabase Cloud Sync)
  const {
    catalog,
    isLoading: isCatalogLoading,
    syncStatus,
    addOrnament,
    addOrnamentsBatch,
    deleteOrnament,
    syncAllLocalToCloud,
    exportCatalog,
    importCatalog,
  } = useJewelryCatalog();

  // Showroom & Realtime Gold Bullion Store
  const {
    settings: showroomSettings,
    updateRates,
    updateShowroomName,
    toggleRateLock,
  } = useGoldRateStore();

  // Multi-Slot Bridal Combo State (Phase 3B)
  const [bridalSlots, setBridalSlots] =
    useState<BridalComboSlots>(INITIAL_BRIDAL_SLOTS);
  const [isComboMode, setIsComboMode] = useState<boolean>(false);
  const [isBridalDrawerOpen, setIsBridalDrawerOpen] = useState<boolean>(false);

  const [selectedItemForTryOn, setSelectedItemForTryOn] =
    useState<JewelryItem | null>(null);
  const [calculatorItem, setCalculatorItem] = useState<JewelryItem | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState<boolean>(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState<boolean>(false);
  const [isAdminStudioOpen, setIsAdminStudioOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<JewelryItem | null>(null);
  const [shareItem, setShareItem] = useState<JewelryItem | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [showroomMode, setShowroomMode] = useState<boolean>(false);

  // Old Gold Exchange, Print Estimates & Order Ledger (Phase 3C)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printEstimateData, setPrintEstimateData] = useState<any>(null);
  const [isOrderLedgerOpen, setIsOrderLedgerOpen] = useState<boolean>(false);
  const [orderPrefillData, setOrderPrefillData] = useState<Partial<GoldsmithOrder> | null>(null);
  const [ordersCount, setOrdersCount] = useState<number>(0);

  // Partner Showroom State (Phase 5)
  const { isTe } = useLanguage();
  const [partnerShowroomBanner, setPartnerShowroomBanner] = useState<{
    shop: string;
    city?: string;
    rate22k?: number;
  } | null>(null);

  const handlePartnerShowroomMatch = (params: {
    shop: string;
    rate22k?: number;
    phone?: string;
    city?: string;
  }) => {
    updateShowroomName(params.shop);
    setShowroomMode(true);
    if (params.rate22k) {
      const rate24k = Math.round(params.rate22k * (24 / 22));
      updateRates(params.rate22k, rate24k);
      toggleRateLock(true);
    }
    if (params.phone) {
      savePaymentSettings({
        showroomPhone: params.phone,
        merchantName: params.shop,
      });
    }
    setPartnerShowroomBanner({
      shop: params.shop,
      city: params.city,
      rate22k: params.rate22k,
    });
  };

  // PWA Install & Interactive Onboarding (Phase 4)
  const { deferredPrompt, isInstallable, isStandalone } = usePWAInstall();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Auto-launch Onboarding tour on first visit
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasCompleted =
        localStorage.getItem("swarnatry_tour_seen") ||
        localStorage.getItem("swarnatry_onboarding_completed");
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setIsOnboardingOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
    }
  };

  const handleTourAction = (
    actionKey: "calculator" | "live-ar" | "photo-match" | "bridal-set" | "orders"
  ) => {
    if (actionKey === "calculator") {
      if (catalog.length > 0) {
        setCalculatorItem(catalog[0]);
        setIsCalculatorOpen(true);
      }
    } else if (actionKey === "live-ar") {
      setIsComboMode(true);
      setActiveTab("live-ar");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (actionKey === "photo-match") {
      setIsComboMode(true);
      setActiveTab("photo-match");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (actionKey === "bridal-set") {
      setIsBridalDrawerOpen(true);
    } else if (actionKey === "orders") {
      setIsOrderLedgerOpen(true);
    }
  };

  // Sync orders count
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrdersCount(getStoredOrders().length);
    }
  }, [isOrderLedgerOpen]);

  const handleOpenPrintEstimate = (estimateData: any) => {
    setPrintEstimateData(estimateData);
    setIsPrintModalOpen(true);
  };

  const handleBookOrder = (orderData: any) => {
    setOrderPrefillData(orderData);
    setIsOrderLedgerOpen(true);
  };

  // Load persisted bridal combo slots on initial catalog load
  useEffect(() => {
    if (catalog.length > 0) {
      const saved = loadPersistedBridalSlots(catalog);
      // If slots are completely empty, pre-populate with the popular Tirumala Temple set for instant wow-factor
      const hasAny = Object.values(saved).some(Boolean);
      if (!hasAny) {
        const initialPreset = BRIDAL_PRESETS[0];
        const newSlots: BridalComboSlots = { ...INITIAL_BRIDAL_SLOTS };
        (Object.keys(initialPreset.itemIds) as BridalSlotId[]).forEach((slotId) => {
          const itemId = initialPreset.itemIds[slotId];
          if (itemId) {
            const found = catalog.find((i) => i.id === itemId);
            if (found) {
              newSlots[slotId] = {
                slotId,
                item: found,
                selectedGrams: found.defaultGrams,
                neckCurve: found.category === "necklaces" ? (found.minGrams <= 32 ? 15 : 25) : 0,
              };
            }
          }
        });
        setBridalSlots(newSlots);
        savePersistedBridalSlots(newSlots);
        setIsComboMode(true);
        setPersistedComboMode(true);
      } else {
        setBridalSlots(saved);
        setIsComboMode(getPersistedComboMode());
      }
    }
  }, [catalog]);

  const activeTryOnItem = selectedItemForTryOn || catalog[0];

  const handleSelectForLiveAR = (item: JewelryItem) => {
    setSelectedItemForTryOn(item);
    setActiveTab("live-ar");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectForPhotoMatch = (item: JewelryItem) => {
    setSelectedItemForTryOn(item);
    setActiveTab("photo-match");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenCalculator = (item: JewelryItem) => {
    setCalculatorItem(item);
    setIsCalculatorOpen(true);
  };

  const handleOpenShareModal = (item: JewelryItem) => {
    setShareItem(item);
    setIsShareModalOpen(true);
  };

  const handleEditItem = (item: JewelryItem) => {
    setEditingItem(item);
    setIsAdminStudioOpen(true);
  };

  const handleOpenAdminStudio = () => {
    setEditingItem(null);
    setIsAdminStudioOpen(true);
  };

  const handleDeepLinkMatch = React.useCallback(
    (
      item: JewelryItem,
      mode: "live-ar" | "photo-match" | "calculator" | "bridal"
    ) => {
      setSelectedItemForTryOn(item);
      if (mode === "calculator") {
        setCalculatorItem(item);
        setIsCalculatorOpen(true);
      } else if (mode === "bridal") {
        const slot = determineSlotForItem(item, bridalSlots);
        handleEquipSlot(slot, item, item.defaultGrams);
        setIsComboMode(true);
        setIsBridalDrawerOpen(true);
      } else {
        setActiveTab(mode);
      }
    },
    []
  );

  // Bridal Combo Slot Handlers
  const handleEquipSlot = (
    slotId: BridalSlotId,
    item: JewelryItem,
    grams?: number
  ) => {
    setBridalSlots((prev) => {
      const updated: BridalComboSlots = {
        ...prev,
        [slotId]: {
          slotId,
          item,
          selectedGrams: grams || item.defaultGrams,
          neckCurve:
            item.category === "necklaces"
              ? item.minGrams <= 32
                ? 15
                : 25
              : 0,
        },
      };
      savePersistedBridalSlots(updated);
      return updated;
    });
  };

  const handleUnequipSlot = (slotId: BridalSlotId) => {
    setBridalSlots((prev) => {
      const updated = { ...prev, [slotId]: null };
      savePersistedBridalSlots(updated);
      return updated;
    });
  };

  const handleUpdateSlotGrams = (slotId: BridalSlotId, grams: number) => {
    setBridalSlots((prev) => {
      const existing = prev[slotId];
      if (!existing) return prev;
      const updated = {
        ...prev,
        [slotId]: { ...existing, selectedGrams: grams },
      };
      savePersistedBridalSlots(updated);
      return updated;
    });
  };

  const handleClearCombo = () => {
    setBridalSlots({ ...INITIAL_BRIDAL_SLOTS });
    savePersistedBridalSlots({ ...INITIAL_BRIDAL_SLOTS });
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = BRIDAL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const newSlots: BridalComboSlots = { ...INITIAL_BRIDAL_SLOTS };
    (Object.keys(preset.itemIds) as BridalSlotId[]).forEach((slotId) => {
      const itemId = preset.itemIds[slotId];
      if (itemId) {
        const found = catalog.find((i) => i.id === itemId);
        if (found) {
          newSlots[slotId] = {
            slotId,
            item: found,
            selectedGrams: found.defaultGrams,
            neckCurve:
              found.category === "necklaces"
                ? found.minGrams <= 32
                  ? 15
                  : 25
                : 0,
          };
        }
      }
    });

    setBridalSlots(newSlots);
    savePersistedBridalSlots(newSlots);
    setIsComboMode(true);
    setPersistedComboMode(true);
  };

  const handleToggleComboMode = (enabled: boolean) => {
    setIsComboMode(enabled);
    setPersistedComboMode(enabled);
  };

  const customCount = catalog.filter((i) => i.isCustom).length;
  const bridalEquippedCount = Object.values(bridalSlots).filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-ivory">
      {/* Deep Link Handler for ?tryon=SKU&mode=live-ar OR ?shop=...&rate22k=... */}
      <Suspense fallback={null}>
        <DeepLinkHandler
          catalog={catalog}
          onDeepLinkMatch={handleDeepLinkMatch}
          onPartnerShowroomMatch={handlePartnerShowroomMatch}
        />
      </Suspense>

      {/* Global Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        goldRate22K={showroomSettings.goldRate22K}
        setGoldRate22K={(rate) =>
          updateRates(rate, showroomSettings.goldRate24K)
        }
        goldRate24K={showroomSettings.goldRate24K}
        setGoldRate24K={(rate) =>
          updateRates(showroomSettings.goldRate22K, rate)
        }
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
        onOpenAdminStudio={handleOpenAdminStudio}
        showroomMode={showroomMode}
        setShowroomMode={setShowroomMode}
        showroomName={showroomSettings.showroomName}
        setShowroomName={updateShowroomName}
        customOrnamentsCount={customCount}
        syncStatus={syncStatus}
        isRateLocked={showroomSettings.isRateLocked}
        bridalSlotsCount={bridalEquippedCount}
        onOpenBridalDrawer={() => setIsBridalDrawerOpen(true)}
        onOpenOrderLedger={() => setIsOrderLedgerOpen(true)}
        ordersCount={ordersCount}
        onOpenTour={() => setIsOnboardingOpen(true)}
        onInstallPWA={isInstallable && !isStandalone ? handleTriggerInstall : undefined}
      />

      {/* Partner Showroom Rebranded Welcome Banner (Phase 5) */}
      {partnerShowroomBanner && (
        <div className="bg-gradient-to-r from-gold-950 via-obsidian-900 to-gold-950 border-b border-gold-500/50 px-4 py-2 text-xs flex items-center justify-between text-gold-200">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
            <Store className="w-4 h-4 text-gold-400 shrink-0" />
            <span>
              <strong>{isTe ? "అధికారిక షోరూమ్ పోర్టల్:" : "Official Showroom Portal:"}</strong>{" "}
              <span className="font-cinzel font-bold text-ivory tracking-wide">
                {partnerShowroomBanner.shop}
              </span>
              {partnerShowroomBanner.city && (
                <span className="text-ivory-muted ml-1">({partnerShowroomBanner.city})</span>
              )}
              {partnerShowroomBanner.rate22k && (
                <span className="ml-2 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[11px]">
                  22K Rate Locked: ₹{partnerShowroomBanner.rate22k.toLocaleString("en-IN")}/g
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => setPartnerShowroomBanner(null)}
            className="text-ivory-muted hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Hero Section displayed on catalog tab */}
        {activeTab === "catalog" && (
          <HeroBanner
            onStartLiveAR={() => {
              setIsComboMode(true);
              setActiveTab("live-ar");
            }}
            onStartPhotoMatch={() => setActiveTab("photo-match")}
            onExploreCatalog={() => {
              const el = document.getElementById("catalog-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            showroomMode={showroomMode}
            showroomName={showroomSettings.showroomName}
          />
        )}

        {/* Tab 1: Catalog & Estimator Grid */}
        {activeTab === "catalog" && (
          <div id="catalog-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-ivory">
                  Smart Ornament Catalog & Gram Range Guide
                </h2>
                <p className="text-xs sm:text-sm text-ivory-muted">
                  Select any design to visualize in Live AR or customize craftable weight with our Goldsmith Estimator.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBridalDrawerOpen(true)}
                  className="bg-gold-950/70 hover:bg-gold-900 border border-gold-600/60 text-gold-300 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Crown className="w-4 h-4 text-gold-400" />
                  <span>Bridal Set Tray ({bridalEquippedCount}/5)</span>
                </button>

                <button
                  onClick={handleOpenAdminStudio}
                  className="bg-gradient-to-r from-gold-500/15 via-gold-400/25 to-gold-500/15 border border-gold-400/60 text-gold-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-gold-glow hover:scale-105 transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-gold-300" />
                  <span>Upload Real Design</span>
                </button>
              </div>
            </div>

            <CatalogGrid
              catalog={catalog}
              onSelectForLiveAR={handleSelectForLiveAR}
              onSelectForPhotoMatch={handleSelectForPhotoMatch}
              onOpenCalculator={handleOpenCalculator}
              onOpenShareModal={handleOpenShareModal}
              onEditItem={handleEditItem}
              onDeleteItem={deleteOrnament}
              onOpenAdminStudio={handleOpenAdminStudio}
              goldRate22K={showroomSettings.goldRate22K}
              bridalSlots={bridalSlots}
              onEquipSlot={handleEquipSlot}
              onOpenBridalDrawer={() => setIsBridalDrawerOpen(true)}
            />
          </div>
        )}

        {/* Tab 2: Mode 1 — Live AR Camera Virtual Try-On */}
        {activeTab === "live-ar" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-2.5 py-0.5 rounded-full border border-gold-500/30">
                  Mode 1: Real-Time AR Mirror
                </span>
                <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-ivory mt-1">
                  Live AR Camera Virtual Try-On
                </h2>
                <p className="text-xs text-ivory-muted">
                  Powered by facial anchor tracking for Earlobes (177, 401), Nostrils (98, 327), Forehead (10, 151), and Neck Base.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBridalDrawerOpen(true)}
                  className="text-xs text-gold-300 hover:text-gold-200 font-semibold px-3 py-1.5 rounded-xl border border-gold-600/50 bg-gold-950/40 flex items-center gap-1.5 shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5 text-gold-400" />
                  <span>Bridal Set ({bridalEquippedCount}/5)</span>
                </button>

                <button
                  onClick={() => handleOpenShareModal(activeTryOnItem)}
                  className="text-xs text-gold-300 hover:text-gold-200 font-medium px-3 py-1.5 rounded-xl border border-gold-500/40 bg-obsidian-900 flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Share QR</span>
                </button>

                <button
                  onClick={() => setActiveTab("catalog")}
                  className="text-xs text-gold-300 hover:text-gold-200 font-medium px-3 py-1.5 rounded-xl border border-gold-900/60 bg-obsidian-900"
                >
                  Back to Catalog
                </button>
              </div>
            </div>

            <LiveARTryOn
              initialItem={activeTryOnItem}
              catalog={catalog}
              onOpenCalculator={handleOpenCalculator}
              onSelectForPhotoMatch={handleSelectForPhotoMatch}
              goldRate22K={showroomSettings.goldRate22K}
              goldRate24K={showroomSettings.goldRate24K}
              showroomName={showroomSettings.showroomName}
              bridalSlots={bridalSlots}
              isComboMode={isComboMode}
              onToggleComboMode={handleToggleComboMode}
              onEquipSlot={handleEquipSlot}
              onOpenBridalDrawer={() => setIsBridalDrawerOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Mode 2 — Custom Photo Match (Upload Portrait + Upload Screenshot) */}
        {activeTab === "photo-match" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Mode 2: Bespoke Multi-Layer Studio
                </span>
                <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-ivory mt-1">
                  Custom Photo Match & 3D Neck-Curve Studio
                </h2>
                <p className="text-xs text-ivory-muted">
                  Layer multiple ornaments simultaneously, bend flat necklaces with 3D Parabolic Curve, and rotate yaw perspective.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBridalDrawerOpen(true)}
                  className="text-xs text-gold-300 hover:text-gold-200 font-semibold px-3 py-1.5 rounded-xl border border-gold-600/50 bg-gold-950/40 flex items-center gap-1.5 shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5 text-gold-400" />
                  <span>Bridal Set ({bridalEquippedCount}/5)</span>
                </button>

                <button
                  onClick={() => handleOpenShareModal(activeTryOnItem)}
                  className="text-xs text-gold-300 hover:text-gold-200 font-medium px-3 py-1.5 rounded-xl border border-gold-500/40 bg-obsidian-900 flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Share QR</span>
                </button>

                <button
                  onClick={() => setActiveTab("catalog")}
                  className="text-xs text-gold-300 hover:text-gold-200 font-medium px-3 py-1.5 rounded-xl border border-gold-900/60 bg-obsidian-900"
                >
                  Back to Catalog
                </button>
              </div>
            </div>

            <CustomPhotoTryOn
              initialItem={activeTryOnItem}
              catalog={catalog}
              goldRate22K={showroomSettings.goldRate22K}
              goldRate24K={showroomSettings.goldRate24K}
              showroomName={showroomSettings.showroomName}
              onOpenCalculator={handleOpenCalculator}
              bridalSlots={bridalSlots}
              isComboMode={isComboMode}
              onOpenBridalDrawer={() => setIsBridalDrawerOpen(true)}
              onEquipSlot={handleEquipSlot}
            />
          </div>
        )}
      </main>

      {/* Unified Bridal Set Combo Tray & Budget Planner Drawer (Phase 3B) */}
      <BridalComboDrawer
        isOpen={isBridalDrawerOpen}
        onClose={() => setIsBridalDrawerOpen(false)}
        slots={bridalSlots}
        isComboMode={isComboMode}
        onToggleComboMode={handleToggleComboMode}
        onEquipSlot={handleEquipSlot}
        onUnequipSlot={handleUnequipSlot}
        onUpdateSlotGrams={handleUpdateSlotGrams}
        onClearCombo={handleClearCombo}
        onLoadPreset={handleLoadPreset}
        goldRate22K={showroomSettings.goldRate22K}
        goldRate24K={showroomSettings.goldRate24K}
        showroomName={showroomSettings.showroomName}
        onLaunchLiveAR={() => {
          setIsComboMode(true);
          setPersistedComboMode(true);
          setActiveTab("live-ar");
        }}
        onLaunchPhotoMatch={() => {
          setIsComboMode(true);
          setPersistedComboMode(true);
          setActiveTab("photo-match");
        }}
        onOpenPrintEstimate={handleOpenPrintEstimate}
        onBookOrder={handleBookOrder}
      />

      {/* Global Interactive Goldsmith Price Calculator Drawer / Modal */}
      <GoldCalculatorModal
        item={calculatorItem}
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        goldRate22K={showroomSettings.goldRate22K}
        goldRate24K={showroomSettings.goldRate24K}
        showroomName={showroomSettings.showroomName}
        onSelectForLiveAR={handleSelectForLiveAR}
        onSelectForPhotoMatch={handleSelectForPhotoMatch}
        onOpenShareModal={handleOpenShareModal}
        onOpenPrintEstimate={handleOpenPrintEstimate}
        onBookOrder={handleBookOrder}
      />

      {/* Printable Showroom Estimate Slip & Thermal Receipt Modal (Phase 3C) */}
      <PrintableEstimateModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        showroomName={showroomSettings.showroomName}
        goldRate22K={showroomSettings.goldRate22K}
        goldRate24K={showroomSettings.goldRate24K}
        items={printEstimateData?.items || []}
        oldGoldSummary={printEstimateData?.oldGoldSummary || null}
        customerName={printEstimateData?.customerName || "Valued Customer"}
        customerPhone={printEstimateData?.customerPhone || "+91 98765 XXXXX"}
        tryOnSnapshot={printEstimateData?.tryOnSnapshot || null}
        isBridalSet={printEstimateData?.isBridalSet || false}
      />

      {/* Goldsmith Custom Order Booking & Karigar Stage Tracker Drawer (Phase 3C) */}
      <OrderLedgerDrawer
        isOpen={isOrderLedgerOpen}
        onClose={() => setIsOrderLedgerOpen(false)}
        showroomName={showroomSettings.showroomName}
        initialNewOrderData={orderPrefillData}
        onClearInitialOrderData={() => setOrderPrefillData(null)}
      />

      {/* Subscription Tier & Showroom Pro Modal */}
      <SubscriptionGate
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        showroomMode={showroomMode}
        setShowroomMode={setShowroomMode}
        showroomName={showroomSettings.showroomName}
        setShowroomName={updateShowroomName}
      />

      {/* Goldsmith Admin Studio Drawer / Upload Engine & Cloud Sync */}
      <AdminUploadStudio
        isOpen={isAdminStudioOpen}
        onClose={() => {
          setIsAdminStudioOpen(false);
          setEditingItem(null);
        }}
        onSaveOrnament={addOrnament}
        onSaveOrnamentsBatch={addOrnamentsBatch}
        onDeleteOrnament={deleteOrnament}
        onExportCatalog={exportCatalog}
        onImportCatalog={importCatalog}
        onSyncLocalToCloud={syncAllLocalToCloud}
        existingCatalog={catalog}
        editItem={editingItem}
        onClearEditItem={() => setEditingItem(null)}
        isRateLocked={showroomSettings.isRateLocked}
        onToggleRateLock={toggleRateLock}
      />

      {/* Customer QR Standee & Direct Deep Link Modal */}
      <ShareDesignModal
        item={shareItem}
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setShareItem(null);
        }}
        showroomName={showroomSettings.showroomName}
        goldRate22K={showroomSettings.goldRate22K}
      />

      {/* Interactive Bilingual Onboarding & Showcase Tour (Phase 4) */}
      <OnboardingTourModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onAction={handleTourAction}
      />

      {/* Standalone PWA Kiosk Install Banner (Phase 4) */}
      <PWAInstallBanner />

      {/* Footer */}
      <footer className="mt-16 border-t border-gold-900/50 bg-obsidian-950 py-8 px-4 text-center text-xs text-ivory-muted/70">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-cinzel font-bold text-sm text-gold-300 tracking-wider">
              SWARNATRY
            </span>
            <span>• AI Virtual Try-On & Gold Estimation Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Net Gold Weight Calculations</span>
            <span>•</span>
            <span>Bridal Combo Layering</span>
            <span>•</span>
            <span>3D Neck-Curve Warping</span>
            <span>•</span>
            <button
              onClick={handleOpenAdminStudio}
              className="text-gold-400 hover:underline"
            >
              Goldsmith Studio
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
