"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const LS_SUPABASE_URL = "swarnatry_supabase_url";
const LS_SUPABASE_KEY = "swarnatry_supabase_anon_key";
const SUPABASE_EVENT = "swarnatry_supabase_config_changed";

let clientInstance: SupabaseClient | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: "env" | "localStorage" | "none";
}

/**
 * Get active Supabase credentials from Env or LocalStorage
 */
export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window === "undefined") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    return {
      url,
      anonKey,
      isConfigured: Boolean(url && anonKey),
      source: url && anonKey ? "env" : "none",
    };
  }

  // 1. Check process.env
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: "env",
    };
  }

  // 2. Check localStorage
  try {
    const localUrl = localStorage.getItem(LS_SUPABASE_URL) || "";
    const localKey = localStorage.getItem(LS_SUPABASE_KEY) || "";
    if (localUrl && localKey) {
      return {
        url: localUrl,
        anonKey: localKey,
        isConfigured: true,
        source: "localStorage",
      };
    }
  } catch (e) {}

  return {
    url: "",
    anonKey: "",
    isConfigured: false,
    source: "none",
  };
}

/**
 * Save credentials directly in LocalStorage (no restart needed)
 */
export function setSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === "undefined") return;
  try {
    if (url && anonKey) {
      localStorage.setItem(LS_SUPABASE_URL, url.trim());
      localStorage.setItem(LS_SUPABASE_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(LS_SUPABASE_URL);
      localStorage.removeItem(LS_SUPABASE_KEY);
    }
    clientInstance = null;
    window.dispatchEvent(new Event(SUPABASE_EVENT));
  } catch (e) {
    console.warn("Could not save Supabase credentials to localStorage", e);
  }
}

/**
 * Retrieve initialized Supabase client singleton
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (clientInstance) return clientInstance;

  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;

  try {
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return clientInstance;
  } catch (err) {
    console.warn("Failed to create Supabase client:", err);
    return null;
  }
}

/**
 * Test connectivity against Supabase backend
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tableExists: boolean;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: "Supabase URL or Anon Key is missing.",
      tableExists: false,
    };
  }

  try {
    // Probe the ornaments table
    const { data, error } = await client
      .from("ornaments")
      .select("id")
      .limit(1);

    if (error) {
      // If code is 42P01, table does not exist yet (needs SQL schema migration)
      if (error.code === "42P01" || error.message.includes("relation") || error.message.includes("does not exist")) {
        return {
          success: true,
          message: "Connected to Supabase! (Tables not yet created — run the SQL schema script below).",
          tableExists: false,
        };
      }
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        tableExists: false,
      };
    }

    return {
      success: true,
      message: "Connected and synced with Supabase PostgreSQL cloud!",
      tableExists: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Network error: ${err.message || "Failed to reach Supabase server"}`,
      tableExists: false,
    };
  }
}

/**
 * Production-ready PostgreSQL DDL Script for 1-click cloud setup
 */
export const PRODUCTION_SQL_SCHEMA = `-- ====================================================================
-- SwarnaTry SaaS — Production Cloud Database Schema & Storage Policies
-- Run this script inside your Supabase Project -> SQL Editor
-- ====================================================================

-- 1. Create Ornaments Table
CREATE TABLE IF NOT EXISTS public.ornaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  telugu_name TEXT,
  hindi_name TEXT,
  category TEXT NOT NULL,
  category_label TEXT NOT NULL,
  style TEXT NOT NULL,
  purity TEXT NOT NULL DEFAULT '22K',
  min_grams NUMERIC NOT NULL,
  max_grams NUMERIC NOT NULL,
  default_grams NUMERIC NOT NULL,
  wastage_percent NUMERIC NOT NULL DEFAULT 12.0,
  making_charge_per_gram NUMERIC NOT NULL DEFAULT 450,
  stone_weight_grams NUMERIC DEFAULT 0,
  stone_cost_flat NUMERIC DEFAULT 0,
  description TEXT,
  craftsmanship_note TEXT,
  gemstones TEXT,
  anchor_type TEXT NOT NULL DEFAULT 'necklace',
  default_scale NUMERIC NOT NULL DEFAULT 1.0,
  default_offset_y NUMERIC NOT NULL DEFAULT 0,
  default_offset_x NUMERIC NOT NULL DEFAULT 0,
  aspect_ratio NUMERIC NOT NULL DEFAULT 1.0,
  svg_content TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT true,
  is_single_earring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Showroom Settings Table (For Live Bullion Broadcast)
CREATE TABLE IF NOT EXISTS public.showroom_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_showroom',
  showroom_name TEXT NOT NULL DEFAULT 'SwarnaTry Heritage Jewellers',
  gold_rate_22k NUMERIC NOT NULL DEFAULT 7150,
  gold_rate_24k NUMERIC NOT NULL DEFAULT 7800,
  gold_rate_18k NUMERIC NOT NULL DEFAULT 5850,
  is_rate_locked BOOLEAN NOT NULL DEFAULT false,
  wastage_default NUMERIC NOT NULL DEFAULT 12.0,
  making_charge_default NUMERIC NOT NULL DEFAULT 450,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default showroom record if not present
INSERT INTO public.showroom_settings (id, showroom_name, gold_rate_22k, gold_rate_24k, gold_rate_18k, is_rate_locked)
VALUES ('default_showroom', 'SwarnaTry Heritage Jewellers', 7150, 7800, 5850, false)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable Row Level Security (RLS) with Public Read & Authenticated/Anon Write for Demo
ALTER TABLE public.ornaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showroom_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to ornaments catalog
CREATE POLICY "Public can view ornaments" ON public.ornaments
  FOR SELECT USING (true);

-- Allow public insert/update/delete for demo showroom operations
CREATE POLICY "Public can manage ornaments" ON public.ornaments
  FOR ALL USING (true);

-- Allow public read access to showroom bullion settings
CREATE POLICY "Public can view showroom settings" ON public.showroom_settings
  FOR SELECT USING (true);

-- Allow public update to showroom settings
CREATE POLICY "Public can modify showroom settings" ON public.showroom_settings
  FOR ALL USING (true);

-- 4. Enable Realtime Broadcasting
ALTER PUBLICATION supabase_realtime ADD TABLE public.showroom_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ornaments;

-- ====================================================================
-- Schema setup complete! Your multi-device cloud backend is ready.
-- ====================================================================
`;
