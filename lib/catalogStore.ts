"use client";

import { useState, useEffect, useCallback } from "react";
import { JewelryItem, MOCK_JEWELRY_CATALOG } from "@/data/mockJewelryCatalog";
import { getSupabaseClient } from "./supabaseClient";

const DB_NAME = "swarnatry_catalog_db";
const STORE_NAME = "custom_ornaments";
const DB_VERSION = 1;
const STORAGE_EVENT = "swarnatry_catalog_updated";
const LOCAL_STORAGE_BACKUP_KEY = "swarnatry_custom_catalog_backup";

export type CloudSyncStatus = "synced" | "offline" | "syncing" | "error";

/**
 * Open IndexedDB database with schema initialization
 */
function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = (e) => {
        console.warn("IndexedDB error, falling back to localStorage:", e);
        resolve(null);
      };
    } catch (err) {
      console.warn("IndexedDB init exception:", err);
      resolve(null);
    }
  });
}

/**
 * Fetch all custom ornaments from IndexedDB (or fallback to localStorage)
 */
export async function getCustomOrnaments(): Promise<JewelryItem[]> {
  const db = await openDB();

  if (!db) {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        resolve(req.result || []);
      };
      req.onerror = () => {
        const stored = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
        resolve(stored ? JSON.parse(stored) : []);
      };
    } catch {
      resolve([]);
    }
  });
}

/**
 * Save a single custom ornament to IndexedDB & localStorage
 */
export async function saveOrnamentToLocalStore(
  item: JewelryItem
): Promise<boolean> {
  const db = await openDB();

  try {
    const existing = await getCustomOrnaments();
    const filtered = existing.filter((i) => i.id !== item.id);
    const updated = [item, ...filtered];
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(updated));
    } catch (e) {}
  } catch (err) {}

  if (!db) {
    notifyCatalogChange();
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);

      req.onsuccess = () => {
        notifyCatalogChange();
        resolve(true);
      };
      req.onerror = () => {
        notifyCatalogChange();
        resolve(false);
      };
    } catch {
      notifyCatalogChange();
      resolve(false);
    }
  });
}

/**
 * Delete an ornament from local store
 */
export async function deleteOrnamentFromLocalStore(
  id: string
): Promise<boolean> {
  const db = await openDB();

  try {
    const existing = await getCustomOrnaments();
    const updated = existing.filter((i) => i.id !== id);
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, JSON.stringify(updated));
  } catch {}

  if (!db) {
    notifyCatalogChange();
    return true;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => {
        notifyCatalogChange();
        resolve(true);
      };
      req.onerror = () => {
        notifyCatalogChange();
        resolve(false);
      };
    } catch {
      notifyCatalogChange();
      resolve(false);
    }
  });
}

/**
 * Convert frontend JewelryItem to Supabase PostgreSQL table row format
 */
function itemToSupabaseRow(item: JewelryItem) {
  return {
    id: item.id,
    name: item.name,
    telugu_name: item.teluguName || null,
    hindi_name: item.hindiName || null,
    category: item.category,
    category_label: item.categoryLabel,
    style: item.style,
    purity: item.purity || "22K",
    min_grams: item.minGrams,
    max_grams: item.maxGrams,
    default_grams: item.defaultGrams,
    wastage_percent: item.wastagePercent,
    making_charge_per_gram: item.makingChargePerGram,
    stone_weight_grams: item.stoneWeightGrams || 0,
    stone_cost_flat: item.stoneCostFlat || 0,
    description: item.description || "",
    craftsmanship_note: item.craftsmanshipNote || "",
    gemstones: item.gemstones || "",
    anchor_type: item.anchorType || "necklace",
    default_scale: item.defaultScale || 1.0,
    default_offset_y: item.defaultOffsetY || 0,
    default_offset_x: item.defaultOffsetX || 0,
    aspect_ratio: item.aspectRatio || 1.0,
    svg_content: item.svgContent,
    is_custom: true,
    is_single_earring: Boolean(item.isSingleEarring),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Convert Supabase PostgreSQL row to frontend JewelryItem
 */
function supabaseRowToItem(row: any): JewelryItem {
  return {
    id: row.id,
    name: row.name,
    teluguName: row.telugu_name || undefined,
    hindiName: row.hindi_name || undefined,
    category: row.category,
    categoryLabel: row.category_label,
    style: row.style,
    purity: row.purity || "22K",
    minGrams: Number(row.min_grams),
    maxGrams: Number(row.max_grams),
    defaultGrams: Number(row.default_grams),
    wastagePercent: Number(row.wastage_percent),
    makingChargePerGram: Number(row.making_charge_per_gram),
    stoneWeightGrams: Number(row.stone_weight_grams || 0),
    stoneCostFlat: Number(row.stone_cost_flat || 0),
    description: row.description || "",
    craftsmanshipNote: row.craftsmanship_note || "",
    gemstones: row.gemstones || "",
    anchorType: row.anchor_type || "necklace",
    defaultScale: Number(row.default_scale || 1.0),
    defaultOffsetY: Number(row.default_offset_y || 0),
    defaultOffsetX: Number(row.default_offset_x || 0),
    aspectRatio: Number(row.aspect_ratio || 1.0),
    svgContent: row.svg_content,
    isCustom: true,
    isSingleEarring: Boolean(row.is_single_earring),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

/**
 * Fetch all items from Supabase Cloud
 */
export async function fetchCloudOrnaments(): Promise<JewelryItem[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("ornaments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map(supabaseRowToItem);
  } catch (err) {
    console.warn("Could not fetch cloud ornaments:", err);
    return [];
  }
}

/**
 * Push all local custom ornaments to Supabase Cloud
 */
export async function pushAllLocalToCloud(
  onProgress?: (current: number, total: number) => void
): Promise<{ success: boolean; pushedCount: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      pushedCount: 0,
      error: "Supabase client not configured. Check Cloud Settings.",
    };
  }

  const localItems = await getCustomOrnaments();
  if (localItems.length === 0) {
    return { success: true, pushedCount: 0 };
  }

  let count = 0;
  for (let i = 0; i < localItems.length; i++) {
    const item = localItems[i];
    try {
      const row = itemToSupabaseRow(item);
      const { error } = await client.from("ornaments").upsert(row);
      if (!error) {
        count++;
      }
    } catch (e) {
      console.warn(`Failed to push item ${item.id}`, e);
    }
    if (onProgress) {
      onProgress(i + 1, localItems.length);
    }
  }

  return { success: true, pushedCount: count };
}

/**
 * Export all catalog items (base + custom) as a JSON string
 */
export async function exportCatalogJSON(): Promise<string> {
  const custom = await getCustomOrnaments();
  const full = [...custom, ...MOCK_JEWELRY_CATALOG];
  return JSON.stringify(
    {
      version: "1.0",
      exportDate: new Date().toISOString(),
      platform: "SwarnaTry Goldsmith Platform",
      totalItems: full.length,
      customCount: custom.length,
      items: full,
    },
    null,
    2
  );
}

/**
 * Import a catalog JSON backup
 */
export async function importCatalogJSON(jsonString: string): Promise<number> {
  try {
    const parsed = JSON.parse(jsonString);
    const itemsToImport: JewelryItem[] = Array.isArray(parsed)
      ? parsed
      : parsed.items || [];

    let count = 0;
    const client = getSupabaseClient();

    for (const item of itemsToImport) {
      if (item && item.id && item.name) {
        const customItem: JewelryItem = {
          ...item,
          isCustom: true,
          createdAt: item.createdAt || new Date().toISOString(),
        };
        await saveOrnamentToLocalStore(customItem);

        if (client) {
          try {
            await client.from("ornaments").upsert(itemToSupabaseRow(customItem));
          } catch (e) {}
        }
        count++;
      }
    }
    notifyCatalogChange();
    return count;
  } catch (err) {
    console.error("Import catalog failed:", err);
    throw new Error("Invalid catalog JSON file format.");
  }
}

/**
 * Notify all mounted components and tabs of catalog state modification
 */
function notifyCatalogChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }
}

/**
 * React Hook for unified hybrid catalog management (Cloud + Offline Cache)
 */
export function useJewelryCatalog() {
  const [catalog, setCatalog] = useState<JewelryItem[]>(MOCK_JEWELRY_CATALOG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>("offline");

  const refreshCatalog = useCallback(async () => {
    try {
      // 1. Immediately read from local IndexedDB for instant zero-flicker UI
      const localCustom = await getCustomOrnaments();
      const localMap = new Map<string, JewelryItem>();
      localCustom.forEach((item) => localMap.set(item.id, item));

      // 2. Check if Supabase client is active
      const client = getSupabaseClient();
      if (client) {
        setSyncStatus("syncing");
        const cloudItems = await fetchCloudOrnaments();
        if (cloudItems.length > 0) {
          // Merge cloud items into local store
          for (const cItem of cloudItems) {
            localMap.set(cItem.id, cItem);
            // Save to IndexedDB cache in background
            saveOrnamentToLocalStore(cItem);
          }
          setSyncStatus("synced");
        } else {
          setSyncStatus("synced");
        }
      } else {
        setSyncStatus("offline");
      }

      // 3. Merge custom items with Mock items
      const mergedCustom = Array.from(localMap.values());
      const customIds = new Set(mergedCustom.map((i) => i.id));
      const filteredMocks = MOCK_JEWELRY_CATALOG.filter(
        (m) => !customIds.has(m.id)
      );

      setCatalog([...mergedCustom, ...filteredMocks]);
    } catch (e) {
      console.warn("Catalog refresh failed:", e);
      setSyncStatus("error");
      setCatalog(MOCK_JEWELRY_CATALOG);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();

    const handleUpdate = () => refreshCatalog();
    window.addEventListener(STORAGE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("swarnatry_supabase_config_changed", handleUpdate);

    return () => {
      window.removeEventListener(STORAGE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("swarnatry_supabase_config_changed", handleUpdate);
    };
  }, [refreshCatalog]);

  const addOrnament = async (item: JewelryItem) => {
    // Save to local cache first
    await saveOrnamentToLocalStore(item);

    // Save to Supabase Cloud if available
    const client = getSupabaseClient();
    if (client) {
      try {
        setSyncStatus("syncing");
        await client.from("ornaments").upsert(itemToSupabaseRow(item));
        setSyncStatus("synced");
      } catch (e) {
        console.warn("Could not save to Supabase cloud, saved locally:", e);
      }
    }

    await refreshCatalog();
  };

  const updateOrnament = async (
    id: string,
    updatedProps: Partial<JewelryItem>
  ) => {
    const existing = catalog.find((i) => i.id === id);
    if (existing) {
      const updated: JewelryItem = { ...existing, ...updatedProps };
      await addOrnament(updated);
    }
  };

  const deleteOrnament = async (id: string) => {
    await deleteOrnamentFromLocalStore(id);

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from("ornaments").delete().eq("id", id);
      } catch (e) {}
    }

    await refreshCatalog();
  };

  const syncAllLocalToCloud = async (
    onProgress?: (curr: number, total: number) => void
  ) => {
    setSyncStatus("syncing");
    const res = await pushAllLocalToCloud(onProgress);
    if (res.success) {
      setSyncStatus("synced");
      await refreshCatalog();
    } else {
      setSyncStatus("error");
    }
    return res;
  };

  const exportCatalog = async () => {
    return await exportCatalogJSON();
  };

  const importCatalog = async (jsonString: string) => {
    const count = await importCatalogJSON(jsonString);
    await refreshCatalog();
    return count;
  };

  return {
    catalog,
    isLoading,
    syncStatus,
    addOrnament,
    updateOrnament,
    deleteOrnament,
    syncAllLocalToCloud,
    exportCatalog,
    importCatalog,
    refreshCatalog,
  };
}
