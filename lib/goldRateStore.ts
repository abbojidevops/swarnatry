"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseClient } from "./supabaseClient";
import { DEFAULT_GOLD_CONFIG } from "./goldMath";

const LS_SHOWROOM_SETTINGS = "swarnatry_showroom_settings";
const GOLD_RATE_EVENT = "swarnatry_gold_rate_changed";

export const toRupees = (paise: number): number => Math.round(paise) / 100;
export const toPaise = (rupees: number): number => Math.round(rupees * 100);

/**
 * Phase 8: Showroom Festive & Muhurtham Offer Campaign Engine
 */
export type FestiveDiscountType =
  | "va_discount_percent"
  | "making_discount_flat"
  | "zero_making_above_grams";

export interface FestiveOffer {
  id: string;
  enabled: boolean;
  isActive?: boolean;
  title: string;
  name?: string;
  teluguTitle: string;
  nameTe?: string;
  discountType: FestiveDiscountType;
  discountValue: number; // e.g. 25 for 25% off VA%, 250 for ₹250 off making/g, 50 for 50g+ zero making
  bannerText: string;
  badgeText?: string;
  bannerTextTelugu: string;
  badgeTextTe?: string;
  validUntil?: string; // e.g. "Limited Muhurtham Period" / "ఈ నెల చివరి వరకు"
}

export const FESTIVE_CAMPAIGN_PRESETS: FestiveOffer[] = [
  {
    id: "wedding_season",
    enabled: true,
    isActive: true,
    title: "Wedding Season & Sravana Masam Special",
    name: "Wedding Season & Sravana Masam Special",
    teluguTitle: "శ్రావణ మాసం & పెళ్లిళ్ల సీజన్ ఆఫర్",
    nameTe: "శ్రావణ మాసం & పెళ్లిళ్ల సీజన్ ఆఫర్",
    discountType: "va_discount_percent",
    discountValue: 25, // 25% off VA
    bannerText: "🎉 Festive Special: Flat 25% OFF on Wastage (VA%) on all Heritage Gold Jewelry!",
    badgeText: "25% OFF on Wastage (VA%)",
    bannerTextTelugu: "🎉 ప్రత్యేక పండుగ ఆఫర్: అన్ని ఆభరణాల తరుగు (VA%) పై ఫ్లాట్ 25% తగ్గింపు!",
    badgeTextTe: "తరుగు (VA%) పై 25% తగ్గింపు",
    validUntil: "Muhurtham Special",
  },
  {
    id: "akshaya_tritiya",
    enabled: true,
    isActive: true,
    title: "Akshaya Tritiya & Dhanteras Bullion Utsav",
    name: "Akshaya Tritiya & Dhanteras Bullion Utsav",
    teluguTitle: "అక్షయ తృతీయ & ధంతేరస్ ఉత్సవం",
    nameTe: "అక్షయ తృతీయ & ధంతేరస్ ఉత్సవం",
    discountType: "making_discount_flat",
    discountValue: 250, // ₹250 off per gram on making
    bannerText: "✨ Shubh Muhurtham: Flat ₹250 OFF per gram on Making Charges across all 22K/24K Ornaments!",
    badgeText: "Flat ₹250/g OFF on Making",
    bannerTextTelugu: "✨ శుభ ముహూర్తం: ప్రతి గ్రాము తయారీ కూలీపై ఫ్లాట్ ₹250 తగ్గింపు!",
    badgeTextTe: "తయారీ కూలీపై ₹250/గ్రా తగ్గింపు",
    validUntil: "Akshaya Tritiya",
  },
  {
    id: "bridal_zero_making",
    enabled: true,
    isActive: true,
    title: "Grand Bridal 50g+ Zero Making Offer",
    name: "Grand Bridal 50g+ Zero Making Offer",
    teluguTitle: "50 గ్రాములకు పైగా బ్రైడల్ సెట్స్ పై ఉచిత తయారీ కూలీ",
    nameTe: "50 గ్రాములకు పైగా బ్రైడల్ సెట్స్ పై ఉచిత తయారీ కూలీ",
    discountType: "zero_making_above_grams",
    discountValue: 50, // 50g threshold
    bannerText: "👑 Royal Bridal Offer: 100% FREE Making Charges on all Bridal Sets above 50 Grams!",
    badgeText: "100% Free Making (50g+)",
    bannerTextTelugu: "👑 రాయల్ బ్రైడల్ ఆఫర్: 50 గ్రాముల పైబడిన పెళ్లి ఆభరణాలపై 100% ఉచిత తయారీ కూలీ!",
    badgeTextTe: "100% ఉచిత తయారీ కూలీ",
    validUntil: "Bridal Special",
  },
];

export async function updateFestiveOffer(offer: FestiveOffer | null) {
  const updated = await saveShowroomSettings({ festiveOffer: offer || undefined });
  return updated;
}

export function calculateFestiveDiscount(
  grams: number,
  baseWastagePercent: number,
  baseMakingChargePerGram: number,
  goldRate: number,
  offer?: FestiveOffer | null
): {
  discountAmount: number;
  finalPrice?: number;
  effectiveWastagePercent: number;
  effectiveMakingChargePerGram: number;
  offerApplied: boolean;
  savingsDescription: string;
} {
  const isOfferActive = Boolean(offer && (offer.enabled || offer.isActive));
  if (!offer || !isOfferActive) {
    return {
      discountAmount: 0,
      finalPrice: Math.round(grams * goldRate + grams * (baseWastagePercent / 100) * goldRate + grams * baseMakingChargePerGram),
      effectiveWastagePercent: baseWastagePercent,
      effectiveMakingChargePerGram: baseMakingChargePerGram,
      offerApplied: false,
      savingsDescription: "",
    };
  }

  let effectiveWastage = baseWastagePercent;
  let effectiveMaking = baseMakingChargePerGram;

  if (offer.discountType === "va_discount_percent") {
    effectiveWastage = Math.max(0, baseWastagePercent * (1 - offer.discountValue / 100));
  } else if (offer.discountType === "making_discount_flat") {
    effectiveMaking = Math.max(0, baseMakingChargePerGram - offer.discountValue);
  } else if (offer.discountType === "zero_making_above_grams") {
    if (grams >= offer.discountValue) {
      effectiveMaking = 0;
    }
  }

  const standardWastageCost = grams * (baseWastagePercent / 100) * goldRate;
  const standardMakingCost = grams * baseMakingChargePerGram;
  const standardAddons = standardWastageCost + standardMakingCost;

  const discountedWastageCost = grams * (effectiveWastage / 100) * goldRate;
  const discountedMakingCost = grams * effectiveMaking;
  const discountedAddons = discountedWastageCost + discountedMakingCost;

  const savings = Math.max(0, Math.round(standardAddons - discountedAddons));
  const applied = savings > 0;

  return {
    discountAmount: savings,
    finalPrice: Math.round(grams * goldRate + discountedAddons),
    effectiveWastagePercent: effectiveWastage,
    effectiveMakingChargePerGram: effectiveMaking,
    offerApplied: applied,
    savingsDescription: applied
      ? offer.discountType === "va_discount_percent"
        ? `${offer.discountValue}% OFF on Wastage (VA)`
        : offer.discountType === "making_discount_flat"
        ? `₹${offer.discountValue}/g OFF on Making`
        : `100% Free Making (50g+ Offer)`
      : "",
  };
}

export interface ShowroomSettings {
  id?: string;
  showroomName: string;
  goldRate22K: number;
  goldRate24K: number;
  goldRate18K: number;
  rate22KPaise?: number;
  rate24KPaise?: number;
  rate18KPaise?: number;
  gstOnMakingOnly?: boolean;
  isRateLocked: boolean;
  festiveOffer?: FestiveOffer;
  updatedAt: string;
}

export const DEFAULT_SHOWROOM_SETTINGS: ShowroomSettings = {
  id: "default_showroom",
  showroomName: "Sri Krishna Heritage Jewellers",
  goldRate22K: DEFAULT_GOLD_CONFIG.goldRate22K,
  goldRate24K: DEFAULT_GOLD_CONFIG.goldRate24K,
  goldRate18K: DEFAULT_GOLD_CONFIG.goldRate18K,
  rate22KPaise: toPaise(DEFAULT_GOLD_CONFIG.goldRate22K),
  rate24KPaise: toPaise(DEFAULT_GOLD_CONFIG.goldRate24K),
  rate18KPaise: toPaise(DEFAULT_GOLD_CONFIG.goldRate18K),
  gstOnMakingOnly: false,
  isRateLocked: false,
  festiveOffer: FESTIVE_CAMPAIGN_PRESETS[0],
  updatedAt: new Date().toISOString(),
};

/**
 * Get current showroom settings from LocalStorage or Default
 */
export function getLocalShowroomSettings(): ShowroomSettings {
  if (typeof window === "undefined") return DEFAULT_SHOWROOM_SETTINGS;
  try {
    const raw = localStorage.getItem(LS_SHOWROOM_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SHOWROOM_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {}
  return DEFAULT_SHOWROOM_SETTINGS;
}

/**
 * Fetch settings from Supabase Cloud (with fallback to LocalStorage)
 */
export async function fetchShowroomSettings(): Promise<ShowroomSettings> {
  const client = getSupabaseClient();
  const local = getLocalShowroomSettings();

  if (!client) return local;

  try {
    const { data, error } = await client
      .from("showroom_settings")
      .select("*")
      .eq("id", "default_showroom")
      .single();

    if (error || !data) {
      return local;
    }

    const rate22K = Number(data.gold_rate_22k) || local.goldRate22K;
    const rate24K = Number(data.gold_rate_24k) || local.goldRate24K;
    const rate18K = Number(data.gold_rate_18k) || local.goldRate18K;

    const cloudSettings: ShowroomSettings = {
      id: data.id,
      showroomName: data.showroom_name || local.showroomName,
      goldRate22K: rate22K,
      goldRate24K: rate24K,
      goldRate18K: rate18K,
      rate22KPaise: toPaise(rate22K),
      rate24KPaise: toPaise(rate24K),
      rate18KPaise: toPaise(rate18K),
      gstOnMakingOnly: data.gst_on_making_only !== undefined ? Boolean(data.gst_on_making_only) : Boolean(local.gstOnMakingOnly),
      isRateLocked: Boolean(data.is_rate_locked),
      updatedAt: data.updated_at || new Date().toISOString(),
    };

    // Cache to localStorage
    try {
      localStorage.setItem(LS_SHOWROOM_SETTINGS, JSON.stringify(cloudSettings));
    } catch (e) {}

    return cloudSettings;
  } catch {
    return local;
  }
}

/**
 * Save settings to Supabase and LocalStorage
 */
export async function saveShowroomSettings(
  settings: Partial<ShowroomSettings>
): Promise<ShowroomSettings> {
  const current = getLocalShowroomSettings();
  const nextRate22K = settings.goldRate22K !== undefined ? settings.goldRate22K : current.goldRate22K;
  const nextRate24K = settings.goldRate24K !== undefined ? settings.goldRate24K : current.goldRate24K;
  const nextRate18K = settings.goldRate18K !== undefined ? settings.goldRate18K : current.goldRate18K;

  const updated: ShowroomSettings = {
    ...current,
    ...settings,
    goldRate22K: nextRate22K,
    goldRate24K: nextRate24K,
    goldRate18K: nextRate18K,
    rate22KPaise: toPaise(nextRate22K),
    rate24KPaise: toPaise(nextRate24K),
    rate18KPaise: toPaise(nextRate18K),
    updatedAt: new Date().toISOString(),
  };

  // Always update local cache
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LS_SHOWROOM_SETTINGS, JSON.stringify(updated));
      window.dispatchEvent(new Event(GOLD_RATE_EVENT));
    } catch (e) {}
  }

  // Attempt Supabase write if connected
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from("showroom_settings").upsert({
        id: "default_showroom",
        showroom_name: updated.showroomName,
        gold_rate_22k: updated.goldRate22K,
        gold_rate_24k: updated.goldRate24K,
        gold_rate_18k: updated.goldRate18K,
        is_rate_locked: updated.isRateLocked,
        updated_at: updated.updatedAt,
      });
    } catch (err) {
      console.warn("Could not save settings to Supabase, cached locally:", err);
    }
  }

  return updated;
}

/**
 * React Hook for Realtime Gold Bullion Rates & Showroom Locking
 */
export function useGoldRateStore() {
  const [settings, setSettings] = useState<ShowroomSettings>(
    getLocalShowroomSettings()
  );
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  const refreshSettings = useCallback(async () => {
    const s = await fetchShowroomSettings();
    setSettings(s);
    const client = getSupabaseClient();
    setIsCloudConnected(Boolean(client));
  }, []);

  useEffect(() => {
    refreshSettings();

    // Listen for local updates
    const handleUpdate = () => {
      setSettings(getLocalShowroomSettings());
    };
    window.addEventListener(GOLD_RATE_EVENT, handleUpdate);

    // Setup Supabase Realtime subscription if client available
    const client = getSupabaseClient();
    let channel: any = null;

    if (client) {
      try {
        channel = client
          .channel("showroom-settings-realtime")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "showroom_settings",
            },
            (payload) => {
              const row = payload.new as Record<string, any> | null;
              if (row && row.id) {
                const updated: ShowroomSettings = {
                  id: row.id,
                  showroomName: row.showroom_name || "Sri Swarna Jewelers",
                  goldRate22K: Number(row.gold_rate_22k) || 6850,
                  goldRate24K: Number(row.gold_rate_24k) || 7470,
                  goldRate18K: Number(row.gold_rate_18k) || 5600,
                  isRateLocked: Boolean(row.is_rate_locked),
                  updatedAt: row.updated_at || new Date().toISOString(),
                };
                setSettings(updated);
                try {
                  localStorage.setItem(
                    LS_SHOWROOM_SETTINGS,
                    JSON.stringify(updated)
                  );
                } catch (e) {}
              }
            }
          )
          .subscribe();
      } catch (e) {}
    }

    return () => {
      window.removeEventListener(GOLD_RATE_EVENT, handleUpdate);
      if (channel && client) {
        client.removeChannel(channel);
      }
    };
  }, [refreshSettings]);

  const updateRates = async (
    rate22K: number,
    rate24K: number,
    locked?: boolean
  ) => {
    const updated = await saveShowroomSettings({
      goldRate22K: rate22K,
      goldRate24K: rate24K,
      goldRate18K: Math.round(rate24K * 0.75),
      ...(locked !== undefined ? { isRateLocked: locked } : {}),
    });
    setSettings(updated);
  };

  const updateShowroomName = async (name: string) => {
    const updated = await saveShowroomSettings({ showroomName: name });
    setSettings(updated);
  };

  const toggleRateLock = async (locked: boolean) => {
    const updated = await saveShowroomSettings({ isRateLocked: locked });
    setSettings(updated);
  };

  const updateFestiveOffer = async (offer: FestiveOffer | null) => {
    const updated = await saveShowroomSettings({ festiveOffer: offer || undefined });
    setSettings(updated);
  };

  return {
    settings,
    isCloudConnected,
    updateRates,
    updateShowroomName,
    toggleRateLock,
    updateFestiveOffer,
    refreshSettings,
  };
}
