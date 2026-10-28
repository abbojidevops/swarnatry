"use client";

import React, { useState, useMemo } from "react";
import {
  JewelryItem,
  JewelryCategory,
  JewelryStyle,
} from "@/data/mockJewelryCatalog";
import { calculateGoldPrice, formatINR } from "@/lib/goldMath";
import {
  Search,
  SlidersHorizontal,
  Camera,
  UploadCloud,
  Calculator,
  Sparkles,
  Layers,
  ArrowUpDown,
  Tag,
  Scale,
  Trash2,
  Edit3,
  Gem,
  PlusCircle,
  QrCode,
  Share2,
  Crown,
  X,
  Volume2,
} from "lucide-react";
import { VoiceSearchButton, ParsedVoiceCommand } from "@/components/VoiceSearchButton";
import {
  BridalComboSlots,
  BridalSlotId,
  BRIDAL_SLOT_CONFIGS,
  determineSlotForItem,
} from "@/lib/comboSetStore";

interface CatalogGridProps {
  catalog: JewelryItem[];
  onSelectForLiveAR: (item: JewelryItem) => void;
  onSelectForPhotoMatch: (item: JewelryItem) => void;
  onOpenCalculator: (item: JewelryItem) => void;
  onOpenShareModal?: (item: JewelryItem) => void;
  onEditItem?: (item: JewelryItem) => void;
  onDeleteItem?: (id: string) => void;
  onOpenAdminStudio?: () => void;
  goldRate22K: number;
  bridalSlots?: BridalComboSlots;
  onEquipSlot?: (slotId: BridalSlotId, item: JewelryItem) => void;
  onOpenBridalDrawer?: () => void;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  catalog,
  onSelectForLiveAR,
  onSelectForPhotoMatch,
  onOpenCalculator,
  onOpenShareModal,
  onEditItem,
  onDeleteItem,
  onOpenAdminStudio,
  goldRate22K,
  bridalSlots,
  onEquipSlot,
  onOpenBridalDrawer,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStyle, setSelectedStyle] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [maxGramsFilter, setMaxGramsFilter] = useState<number | null>(null);
  const [voiceTranscriptNotice, setVoiceTranscriptNotice] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "grams-asc" | "grams-desc" | "price-asc" | "price-desc"
  >("grams-asc");

  const handleVoiceCommand = (cmd: ParsedVoiceCommand) => {
    if (cmd.category) {
      setSelectedCategory(cmd.category);
    }
    if (cmd.targetGrams) {
      setMaxGramsFilter(cmd.targetGrams);
    }
    if (cmd.query && !cmd.category) {
      setSearchQuery(cmd.query);
    }
    setVoiceTranscriptNotice(cmd.transcript);
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return catalog
      .filter((item) => {
        if (selectedCategory !== "all" && item.category !== selectedCategory) {
          return false;
        }
        if (selectedStyle !== "all" && item.style !== selectedStyle) {
          return false;
        }
        if (maxGramsFilter && item.minGrams > maxGramsFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesId = item.id.toLowerCase().includes(query);
          const matchesName = item.name.toLowerCase().includes(query);
          const matchesTelugu = item.teluguName?.toLowerCase().includes(query);
          const matchesHindi = item.hindiName?.toLowerCase().includes(query);
          const matchesGems = item.gemstones.toLowerCase().includes(query);
          if (
            !matchesId &&
            !matchesName &&
            !matchesTelugu &&
            !matchesHindi &&
            !matchesGems
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const priceA = calculateGoldPrice(a.defaultGrams, a.purity, {
          goldRate22K,
          stoneWeightGrams: a.stoneWeightGrams,
          stoneCostFlat: a.stoneCostFlat,
        }).totalEstimatedPrice;
        const priceB = calculateGoldPrice(b.defaultGrams, b.purity, {
          goldRate22K,
          stoneWeightGrams: b.stoneWeightGrams,
          stoneCostFlat: b.stoneCostFlat,
        }).totalEstimatedPrice;

        if (sortBy === "grams-asc") return a.minGrams - b.minGrams;
        if (sortBy === "grams-desc") return b.maxGrams - a.maxGrams;
        if (sortBy === "price-asc") return priceA - priceB;
        if (sortBy === "price-desc") return priceB - priceA;
        return 0;
      });
  }, [catalog, selectedCategory, selectedStyle, searchQuery, sortBy, goldRate22K]);

  return (
    <section className="space-y-6">
      {/* Category Tabs & Filter Toolbar */}
      <div className="bg-obsidian-900/80 border border-gold-900/60 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-royal-card space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 font-semibold shadow-gold-glow"
                : "bg-obsidian-950/70 text-ivory-muted hover:text-ivory border border-gold-900/40"
            }`}
          >
            All Ornaments ({catalog.length})
          </button>

          <button
            onClick={() => setSelectedCategory("earrings")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategory === "earrings"
                ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 font-semibold shadow-gold-glow"
                : "bg-obsidian-950/70 text-ivory-muted hover:text-ivory border border-gold-900/40"
            }`}
          >
            Earrings (Jhumkas/Chandbalis)
          </button>

          <button
            onClick={() => setSelectedCategory("necklaces")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategory === "necklaces"
                ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 font-semibold shadow-gold-glow"
                : "bg-obsidian-950/70 text-ivory-muted hover:text-ivory border border-gold-900/40"
            }`}
          >
            Necklaces (Chokers/Harams)
          </button>

          <button
            onClick={() => setSelectedCategory("maang-tikka")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategory === "maang-tikka"
                ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 font-semibold shadow-gold-glow"
                : "bg-obsidian-950/70 text-ivory-muted hover:text-ivory border border-gold-900/40"
            }`}
          >
            Maang Tikka (Papidi Billa)
          </button>

          <button
            onClick={() => setSelectedCategory("nose-rings")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategory === "nose-rings"
                ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 font-semibold shadow-gold-glow"
                : "bg-obsidian-950/70 text-ivory-muted hover:text-ivory border border-gold-900/40"
            }`}
          >
            Nose Rings (Mukku Pudaka/Nath)
          </button>

          <button
            onClick={() => setSelectedCategory("bangles")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
              selectedCategory === "bangles"
                ? "bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 font-semibold shadow-gold-glow"
                : "bg-obsidian-950/70 text-ivory-muted hover:text-ivory border border-gold-900/40"
            }`}
          >
            Bangles / Vanki
          </button>
        </div>

        {/* Secondary Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gold-900/40">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gold-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Design ID, stone, or craft... (లేదా మాట్లాడండి)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-obsidian-950 border border-gold-900/70 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-ivory placeholder-ivory-muted/50 focus:outline-none focus:border-gold-500/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ivory-muted hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <VoiceSearchButton onParsedVoiceCommand={handleVoiceCommand} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-obsidian-950 border border-gold-900/70 rounded-xl px-3 py-1.5 text-xs text-ivory-muted">
              <Tag className="w-3.5 h-3.5 text-gold-400" />
              <span>Style:</span>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="bg-transparent text-gold-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-obsidian-900 text-ivory">All Styles</option>
                <option value="Nakshi" className="bg-obsidian-900 text-ivory">Nakshi (Embossed)</option>
                <option value="Temple" className="bg-obsidian-900 text-ivory">Temple (Deity)</option>
                <option value="Kundan" className="bg-obsidian-900 text-ivory">Kundan / Polki</option>
                <option value="Plain Gold" className="bg-obsidian-900 text-ivory">Plain Gold / Filigree</option>
                <option value="Antique" className="bg-obsidian-900 text-ivory">Antique</option>
                <option value="22K Hallmark" className="bg-obsidian-900 text-ivory">22K Hallmark</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-obsidian-950 border border-gold-900/70 rounded-xl px-3 py-1.5 text-xs text-ivory-muted">
              <ArrowUpDown className="w-3.5 h-3.5 text-gold-400" />
              <span>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-gold-200 focus:outline-none cursor-pointer"
              >
                <option value="grams-asc" className="bg-obsidian-900 text-ivory">Weight: Low to High</option>
                <option value="grams-desc" className="bg-obsidian-900 text-ivory">Weight: High to Low</option>
                <option value="price-asc" className="bg-obsidian-900 text-ivory">Price: Low to High</option>
                <option value="price-desc" className="bg-obsidian-900 text-ivory">Price: High to Low</option>
              </select>
            </div>

            {onOpenAdminStudio && (
              <button
                onClick={onOpenAdminStudio}
                className="bg-gradient-to-r from-gold-500/15 via-gold-400/20 to-gold-500/15 border border-gold-500/40 text-gold-300 hover:text-gold-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                title="Upload real jewelry photos"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Upload</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Voice Search / Gram Filter Banner */}
        {(voiceTranscriptNotice || maxGramsFilter) && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gold-950/60 border border-gold-500/40 text-xs text-gold-200 animate-in fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              <Volume2 className="w-4 h-4 text-gold-400 shrink-0" />
              <span>
                {voiceTranscriptNotice ? (
                  <>
                    <strong className="text-gold-300">Voice Query:</strong> &ldquo;{voiceTranscriptNotice}&rdquo;
                  </>
                ) : null}
                {maxGramsFilter ? (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-300 text-[11px] font-mono">
                    Max: {maxGramsFilter}g
                  </span>
                ) : null}
              </span>
            </div>
            <button
              onClick={() => {
                setVoiceTranscriptNotice(null);
                setMaxGramsFilter(null);
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-2.5 py-1 rounded-lg bg-obsidian-900 border border-gold-900/60 text-[11px] text-ivory-muted hover:text-white transition-colors shrink-0"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Bridal Combo Banner */}
      {bridalSlots && onOpenBridalDrawer && (
        <div className="bg-gradient-to-r from-gold-950/40 via-obsidian-900 to-gold-950/40 border border-gold-600/40 rounded-2xl p-3.5 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold-900/50 border border-gold-600/50 flex items-center justify-center text-gold-300">
              <Crown className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-gold-200 font-cinzel">
                  Bridal Combo Set & Trousseau Planner
                </h4>
                <span className="text-[10px] bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded-full border border-gold-500/30 font-semibold">
                  {Object.values(bridalSlots).filter(Boolean).length} / 5 Equipped
                </span>
              </div>
              <p className="text-[11px] text-ivory-muted">
                Layer Choker, Long Haram, Earrings, Maang Tikka, and Nath simultaneously in Live AR and Photo Match.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenBridalDrawer}
            className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-gold-glow"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Open Bridal Tray & Budget Planner</span>
          </button>
        </div>
      )}

      {/* Catalog Grid Cards */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-obsidian-900/40 rounded-2xl border border-gold-900/40">
          <Sparkles className="w-10 h-10 text-gold-500/40 mx-auto mb-3" />
          <h3 className="font-cinzel text-lg text-ivory">No matching ornaments found</h3>
          <p className="text-xs text-ivory-muted mt-1">Try clearing your search query or switching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const minEstimate = calculateGoldPrice(item.minGrams, item.purity, {
              goldRate22K,
              stoneWeightGrams: item.stoneWeightGrams,
              stoneCostFlat: item.stoneCostFlat,
            }).totalEstimatedPrice;
            const maxEstimate = calculateGoldPrice(item.maxGrams, item.purity, {
              goldRate22K,
              stoneWeightGrams: item.stoneWeightGrams,
              stoneCostFlat: item.stoneCostFlat,
            }).totalEstimatedPrice;

            const isEquippedInCombo = bridalSlots
              ? Object.values(bridalSlots).some((s) => s?.item.id === item.id)
              : false;

            return (
              <div
                key={item.id}
                data-sku={item.id}
                className="group relative rounded-2xl bg-gradient-to-b from-obsidian-900/90 via-obsidian-900/70 to-obsidian-950/90 border border-gold-900/60 hover:border-gold-500/50 transition-all duration-300 hover:shadow-gold-glow flex flex-col overflow-hidden"
              >
                {/* Top Badges & Share QR Button */}
                <div className="p-3.5 pb-0 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] font-semibold text-gold-300 bg-obsidian-950/90 border border-gold-500/30 px-2 py-0.5 rounded">
                      {item.id}
                    </span>
                    {item.isCustom && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                        Real Upload
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenShareModal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShareModal(item);
                        }}
                        className="p-1 rounded-lg bg-obsidian-950/80 hover:bg-gold-500/20 text-gold-300 hover:text-gold-200 border border-gold-900/60 transition-colors"
                        title="Get QR Standee & Direct Try-On Link"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-ruby-950/70 text-ruby-200 border border-ruby-500/30">
                      {item.style}
                    </span>
                  </div>
                </div>

                {/* Jewelry Showcase Box */}
                <div
                  onClick={() => onOpenCalculator(item)}
                  className="relative aspect-square w-full p-6 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform duration-300"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    {item.svgContent.trim().startsWith("<svg") ? (
                      <div
                        className="w-full h-full flex items-center justify-center filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                        dangerouslySetInnerHTML={{ __html: item.svgContent }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.svgContent}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                      />
                    )}
                  </div>

                  {/* Hover Quick View Overlay */}
                  <div className="absolute inset-0 bg-obsidian-950/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity flex items-center justify-center gap-2 p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectForLiveAR(item);
                      }}
                      className="p-2.5 rounded-full bg-gold-500 text-obsidian-950 hover:bg-gold-400 font-semibold shadow-gold-glow transition-transform hover:scale-110"
                      title="Live AR Camera"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectForPhotoMatch(item);
                      }}
                      className="p-2.5 rounded-full bg-obsidian-800 text-ivory hover:bg-obsidian-700 border border-gold-500/40 transition-transform hover:scale-110"
                      title="Custom Photo Match"
                    >
                      <UploadCloud className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCalculator(item);
                      }}
                      className="p-2.5 rounded-full bg-obsidian-800 text-gold-300 hover:bg-obsidian-700 border border-gold-500/40 transition-transform hover:scale-110"
                      title="Price Estimator"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                    {onOpenShareModal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenShareModal(item);
                        }}
                        className="p-2.5 rounded-full bg-obsidian-800 text-gold-300 hover:bg-obsidian-700 border border-gold-500/40 transition-transform hover:scale-110"
                        title="Customer QR & Deep Link"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    {item.isCustom && onEditItem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditItem(item);
                        }}
                        className="p-2.5 rounded-full bg-obsidian-800 text-emerald-400 hover:bg-obsidian-700 border border-emerald-500/40 transition-transform hover:scale-110"
                        title="Edit in Admin Studio"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Info */}
                <div className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-cinzel text-base font-bold text-ivory line-clamp-1 group-hover:text-gold-200 transition-colors">
                      {item.name}
                    </h3>
                    {item.teluguName && (
                      <p className="text-[11px] text-ivory-muted/70 italic mt-0.5 line-clamp-1">
                        {item.teluguName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-obsidian-950/80 border border-gold-900/40">
                    <div className="flex items-center gap-1.5 text-ivory-muted">
                      <Scale className="w-3.5 h-3.5 text-gold-400" />
                      <span>Craftable:</span>
                    </div>
                    <span className="font-semibold text-gold-300 font-mono">
                      {item.minGrams}g – {item.maxGrams}g
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] text-ivory-muted uppercase tracking-wider">
                      Est. Live 22K Value:
                    </div>
                    <div className="text-sm sm:text-base font-bold font-cinzel text-gold-gradient">
                      {formatINR(minEstimate)} – {formatINR(maxEstimate)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gold-900/50">
                    <button
                      onClick={() => onSelectForLiveAR(item)}
                      className="py-1.5 px-2 rounded-lg bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Live</span>
                    </button>

                    <button
                      onClick={() => onSelectForPhotoMatch(item)}
                      className="py-1.5 px-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 border border-gold-900/50 text-ivory-soft text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Match</span>
                    </button>

                    <button
                      onClick={() => onOpenCalculator(item)}
                      className="py-1.5 px-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-750 border border-gold-900/50 text-gold-400 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
                      title="Calculate Gold Price"
                    >
                      <Calculator className="w-3 h-3" />
                      <span>Rate</span>
                    </button>
                  </div>

                  {/* Bridal Combo Quick Equip Button */}
                  {onEquipSlot && bridalSlots && (
                    <button
                      onClick={() => {
                        const slot = determineSlotForItem(item, bridalSlots);
                        onEquipSlot(slot, item);
                      }}
                      className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                        isEquippedInCombo
                          ? "bg-gold-500/25 text-gold-200 border-gold-400/80 hover:bg-gold-500/35 shadow-gold-glow"
                          : "bg-obsidian-950 hover:bg-gold-950/40 text-gold-400/90 border-gold-900/60 hover:border-gold-500/40"
                      }`}
                    >
                      <Crown className="w-3 h-3 text-gold-400" />
                      <span>
                        {isEquippedInCombo ? "✓ Equipped in Set" : "+ Add to Bridal Set"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
