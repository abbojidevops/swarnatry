"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { JewelryItem, getJewelryImageUri } from "@/data/mockJewelryCatalog";
import { formatINR, calculateGoldPrice } from "@/lib/goldMath";
import { useLanguage } from "@/context/LanguageContext";
import confetti from "canvas-confetti";
import {
  X,
  Check,
  Undo2,
  Trash2,
  PenTool,
  Circle,
  ArrowUpRight,
  Sparkles,
  Scale,
  Plus,
  Layers,
  FileText,
  Download,
} from "lucide-react";

export interface KarigarCustomizationResult {
  annotatedImageUri: string;
  extraGrams: number;
  totalGrams: number;
  customNotes: string;
  selectedMotifs: string[];
}

interface KarigarMotifOption {
  id: string;
  name: string;
  teluguName: string;
  grams: number;
  description: string;
}

const KARIGAR_MOTIF_ADDONS: KarigarMotifOption[] = [
  {
    id: "guttapusalu",
    name: "Guttapusalu Pearl Clusters",
    teluguName: "గుత్తపుసలు ముత్యాల వేలాడదీత",
    grams: 2.5,
    description: "Hand-strung bunch of natural Basra seed pearls fringed along the bottom border.",
  },
  {
    id: "back_chain",
    name: "Solid Gold Back-Chain (Replace Thread)",
    teluguName: "బంగారు చైన్ లింకులు (త్రాడు బదులు)",
    grams: 6.0,
    description: "Replace fabric/silk thread dori with 18-inch 22K handmade solid link chain with S-hook.",
  },
  {
    id: "kempu_drops",
    name: "Kempu & Pacha Ruby-Emerald Drops",
    teluguName: "కెంపు / పచ్చ వేలాడే చుక్కలు",
    grams: 1.8,
    description: "Add prong-set pear-cut Burmese cabochon rubies and emerald drops along outer rim.",
  },
  {
    id: "detachable",
    name: "Detachable 2-in-1 Center Pendant",
    teluguName: "విడిపోయే 2-in-1 పెండెంట్ మెకానిజం",
    grams: 3.0,
    description: "Engineer hidden slide-lock clip so center pendant detaches to wear on a plain chain.",
  },
  {
    id: "lakshmi_motif",
    name: "Embossed Lakshmi / Peacock Medallion",
    teluguName: "లక్ష్మీదేవి / నెమలి నక్షి బొమ్మ",
    grams: 2.2,
    description: "Emboss high-relief Gajalakshmi medallion in place of standard plain flower center.",
  },
  {
    id: "mesh_border",
    name: "Broad Double-Layer Mesh Border",
    teluguName: "డబుల్ లేయర్ నక్షి మెష్ అంచు",
    grams: 4.5,
    description: "Add an extra outer braided gold rope and stamped floral petal rim for broad bridal look.",
  },
];

interface KarigarCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: JewelryItem | null;
  goldRate22K: number;
  goldRate24K?: number;
  showroomName?: string;
  initialExtraGrams?: number;
  initialNotes?: string;
  onSaveCustomization?: (result: KarigarCustomizationResult) => void;
  onSaveAttachment?: (result: KarigarCustomizationResult) => void;
  onOpenCalculator?: (item: JewelryItem) => void;
}

type DrawTool = "pen" | "circle" | "arrow";
type DrawColor = "#EF4444" | "#D4AF37" | "#10B981" | "#FFFFFF";

interface StrokeStep {
  tool: DrawTool;
  color: DrawColor;
  size: number;
  points: { x: number; y: number }[];
}

export const KarigarCustomizationModal: React.FC<KarigarCustomizationModalProps> = ({
  isOpen,
  onClose,
  item,
  goldRate22K,
  initialExtraGrams = 0,
  initialNotes = "",
  onSaveCustomization,
  onSaveAttachment,
  onOpenCalculator,
}) => {
  const { isTe } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<DrawTool>("pen");
  const [selectedColor, setSelectedColor] = useState<DrawColor>("#EF4444");
  const [brushSize, setBrushSize] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [strokes, setStrokes] = useState<StrokeStep[]>([]);
  const [currentStroke, setCurrentStroke] = useState<StrokeStep | null>(null);

  // Selected Goldsmith Add-Ons
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState<string>(initialNotes);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  // Calculate Extra Grams from active add-ons
  const extraGrams = selectedAddonIds.reduce((sum, id) => {
    const addon = KARIGAR_MOTIF_ADDONS.find((m) => m.id === id);
    return sum + (addon ? addon.grams : 0);
  }, initialExtraGrams);

  const baseGrams = item ? item.defaultGrams : 30;
  const totalGrams = Math.round((baseGrams + extraGrams) * 10) / 10;
  const estimatedCustomPrice = item
    ? calculateGoldPrice(totalGrams, item.purity, {
        goldRate22K,
        wastagePercent: item.wastagePercent,
        makingChargePerGram: item.makingChargePerGram,
      })
    : null;

  // Load Base Ornament Image onto Canvas
  useEffect(() => {
    if (!isOpen || !item) return;
    const imgUri = getJewelryImageUri(item);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setBaseImage(img);
    };
    img.src = imgUri;
  }, [isOpen, item]);

  // Redraw Canvas (Background Image + All Strokes)
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Dark Luxury Goldsmith Studio Grid Background
    ctx.fillStyle = "#0B0B0E";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Subtle Blueprint Grid
    ctx.strokeStyle = "rgba(212, 175, 55, 0.08)";
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw Base Jewelry Ornament centered
    if (baseImage) {
      const padding = 50;
      const maxW = canvas.width - padding * 2;
      const maxH = canvas.height - padding * 2;
      let drawW = baseImage.width;
      let drawH = baseImage.height;

      const scale = Math.min(maxW / drawW, maxH / drawH, 1.2);
      drawW = drawW * scale;
      drawH = drawH * scale;
      const drawX = (canvas.width - drawW) / 2;
      const drawY = (canvas.height - drawH) / 2;

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 20;
      ctx.drawImage(baseImage, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // Draw all recorded strokes
    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;
    allStrokes.forEach((st) => {
      if (st.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = st.color;
      ctx.fillStyle = st.color;
      ctx.lineWidth = st.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (st.tool === "pen") {
        ctx.beginPath();
        ctx.moveTo(st.points[0].x, st.points[0].y);
        for (let i = 1; i < st.points.length; i++) {
          ctx.lineTo(st.points[i].x, st.points[i].y);
        }
        ctx.stroke();
      } else if (st.tool === "circle") {
        if (st.points.length >= 2) {
          const p1 = st.points[0];
          const p2 = st.points[st.points.length - 1];
          const rx = Math.abs(p2.x - p1.x) / 2;
          const ry = Math.abs(p2.y - p1.y) / 2;
          const cx = Math.min(p1.x, p2.x) + rx;
          const cy = Math.min(p1.y, p2.y) + ry;

          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.max(rx, 8), Math.max(ry, 8), 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (st.tool === "arrow") {
        if (st.points.length >= 2) {
          const from = st.points[0];
          const to = st.points[st.points.length - 1];
          const headlen = 14;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const angle = Math.atan2(dy, dx);

          // Arrow shaft
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();

          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    });
  }, [baseImage, strokes, currentStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Pointer Handlers for Canvas Drawing
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const pt = getCanvasCoords(e);
    setCurrentStroke({
      tool: selectedTool,
      color: selectedColor,
      size: brushSize,
      points: [pt],
    });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    const pt = getCanvasCoords(e);
    setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, pt] } : null));
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    if (currentStroke.points.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  // Toggle Goldsmith Motif Add-on
  const toggleAddon = (addon: KarigarMotifOption) => {
    setSelectedAddonIds((prev) => {
      const exists = prev.includes(addon.id);
      let next: string[];
      if (exists) {
        next = prev.filter((id) => id !== addon.id);
      } else {
        next = [...prev, addon.id];
      }

      // Auto update text notes
      const notesList = next
        .map((id) => KARIGAR_MOTIF_ADDONS.find((m) => m.id === id)?.description)
        .filter(Boolean)
        .join("\n• ");
      setCustomInstructions(notesList ? `• ${notesList}` : "");

      return next;
    });
  };

  // Save Final Composite Markup
  const handleSaveAndExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || !item) return;

    // Draw watermark into export canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const eCtx = exportCanvas.getContext("2d");
    if (!eCtx) return;

    eCtx.drawImage(canvas, 0, 0);

    // Watermark tag
    eCtx.fillStyle = "rgba(11, 11, 14, 0.85)";
    eCtx.fillRect(16, exportCanvas.height - 65, 380, 50);
    eCtx.strokeStyle = "#D4AF37";
    eCtx.lineWidth = 1;
    eCtx.strokeRect(16, exportCanvas.height - 65, 380, 50);

    eCtx.fillStyle = "#FFE89E";
    eCtx.font = "bold 13px 'Cinzel', serif";
    eCtx.fillText("KARIGAR WORKSHOP CUSTOM REDLINE MARKUP", 28, exportCanvas.height - 40);

    eCtx.font = "11px 'Plus Jakarta Sans', sans-serif";
    eCtx.fillStyle = "#FAF8F5";
    eCtx.fillText(
      `${item.name} • ${totalGrams}g (${item.defaultGrams}g + ${extraGrams}g custom)`,
      28,
      exportCanvas.height - 24
    );

    const dataUri = exportCanvas.toDataURL("image/png");

    confetti({
      particleCount: 75,
      spread: 60,
      colors: ["#D4AF37", "#EF4444", "#10B981"],
    });

    const result: KarigarCustomizationResult = {
      annotatedImageUri: dataUri,
      extraGrams,
      totalGrams,
      customNotes: customInstructions,
      selectedMotifs: selectedAddonIds,
    };

    if (onSaveCustomization) onSaveCustomization(result);
    if (onSaveAttachment) onSaveAttachment(result);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-obsidian-900 border border-gold-500/50 rounded-3xl shadow-gold-glow-lg flex flex-col max-h-[92vh] overflow-hidden text-ivory">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gold-900/60 bg-obsidian-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gold-500/10 border border-gold-500/30 text-gold-400 shadow-gold-glow">
              <PenTool className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">
                  Goldsmith Workshop Redline Pad
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-ruby-950 border border-ruby-500/40 text-rose-300 font-semibold font-mono">
                  +{extraGrams}g Modified
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold font-cinzel text-ivory">
                {isTe ? "ఆభరణం డిజైన్ మార్పులు & కస్టమైజేషన్" : `Customize Design: ${item.name}`}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-ivory-muted hover:text-ivory hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Canvas Viewport (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-5 bg-obsidian-950 flex flex-col items-center justify-between gap-3 border-b lg:border-b-0 lg:border-r border-gold-900/60">
            {/* Drawing Toolbar */}
            <div className="w-full flex items-center justify-between gap-2 flex-wrap bg-obsidian-900/90 p-2.5 rounded-2xl border border-gold-900/60 text-xs">
              {/* Tool Mode */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedTool("pen")}
                  className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                    selectedTool === "pen"
                      ? "bg-gold-500 text-obsidian-950 font-bold"
                      : "text-ivory-muted hover:text-white"
                  }`}
                  title="Freehand Redline Pen"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTool("circle")}
                  className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                    selectedTool === "circle"
                      ? "bg-gold-500 text-obsidian-950 font-bold"
                      : "text-ivory-muted hover:text-white"
                  }`}
                  title="Circle Area of Change"
                >
                  <Circle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Circle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTool("arrow")}
                  className={`p-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                    selectedTool === "arrow"
                      ? "bg-gold-500 text-obsidian-950 font-bold"
                      : "text-ivory-muted hover:text-white"
                  }`}
                  title="Draw Pointer Arrow"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Arrow</span>
                </button>
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-1.5">
                {[
                  { color: "#EF4444" as DrawColor, label: "Redline" },
                  { color: "#D4AF37" as DrawColor, label: "Gold" },
                  { color: "#10B981" as DrawColor, label: "Green" },
                  { color: "#FFFFFF" as DrawColor, label: "White" },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setSelectedColor(c.color)}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      selectedColor === c.color ? "scale-125 border-white shadow-md" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.label}
                  />
                ))}
              </div>

              {/* Undo & Clear */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStrokes((prev) => prev.slice(0, -1))}
                  disabled={strokes.length === 0}
                  className="p-1.5 rounded-lg text-ivory-muted hover:text-white hover:bg-obsidian-800 disabled:opacity-30"
                  title="Undo last stroke"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setStrokes([])}
                  disabled={strokes.length === 0}
                  className="p-1.5 rounded-lg text-ruby-400 hover:bg-ruby-950/40 disabled:opacity-30"
                  title="Clear all drawings"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Canvas */}
            <div className="relative aspect-square w-full max-w-md rounded-2xl overflow-hidden border border-gold-900/60 shadow-inner flex items-center justify-center cursor-crosshair select-none bg-obsidian-950">
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-[11px] text-ivory-muted text-center italic">
              {isTe
                ? "ఆభరణంపై మార్పులు చేయాలనుకుంటున్న చోట వృత్తం లేదా బాణం గీయండి."
                : "Draw arrows or circle areas on the ornament you want modified by the artisan."}
            </p>
          </div>

          {/* Right Controls: Goldsmith Add-Ons & Weight Math (5 Cols) */}
          <div className="lg:col-span-5 p-5 space-y-5 flex flex-col justify-between bg-obsidian-900">
            {/* Live Weight & Cost Recalculation Card */}
            <div className="p-4 rounded-2xl bg-obsidian-950/90 border border-gold-subtle space-y-2">
              <div className="flex items-center justify-between text-xs border-b border-gold-900/40 pb-2">
                <span className="text-ivory-muted flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-gold-400" />
                  <span>Base Weight:</span>
                </span>
                <span className="font-mono font-bold text-ivory">{item.defaultGrams} g</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-gold-900/40 pb-2">
                <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Custom Add-On Metal:</span>
                </span>
                <span className="font-mono font-bold text-rose-300">+{extraGrams} g</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] text-gold-400 uppercase tracking-wider block">
                    Customized Gross Wt:
                  </span>
                  <span className="text-xl font-bold font-mono text-gold-300">
                    {totalGrams} g
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-ivory-muted uppercase tracking-wider block">
                    Estimated Price:
                  </span>
                  <span className="text-lg font-bold font-cinzel text-emerald-300">
                    {estimatedCustomPrice ? formatINR(estimatedCustomPrice.totalEstimatedPrice) : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* 1-Click Motif Stamps & Add-Ons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gold-300 font-cinzel uppercase tracking-wider block">
                {isTe ? "1-క్లిక్ బంగారు పని మార్పులు (యాడ్-ఆన్స్):" : "1-Click Goldsmith Modification Add-Ons:"}
              </span>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {KARIGAR_MOTIF_ADDONS.map((addon) => {
                  const isChecked = selectedAddonIds.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddon(addon)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-xs ${
                        isChecked
                          ? "bg-gold-500/15 border-gold-400 text-gold-200"
                          : "bg-obsidian-950/80 border-gold-900/60 text-ivory-muted hover:border-gold-500/40"
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[220px]">
                        <div className="font-semibold text-ivory text-xs flex items-center gap-1.5">
                          <span>{isTe ? addon.teluguName : addon.name}</span>
                        </div>
                        <p className="text-[10px] text-ivory-muted line-clamp-1">{addon.description}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold text-emerald-400 text-[11px]">
                          +{addon.grams}g
                        </span>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked ? "bg-gold-500 border-gold-400 text-obsidian-950" : "border-gold-900/80"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 font-bold" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Karigar Technical Instruction Notes */}
            <div className="space-y-1.5">
              <label className="text-xs text-ivory-muted flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gold-400" />
                <span>{isTe ? "స్వర్ణకారుని సూచనలు (ఆర్డర్ కోసం):" : "Workshop Technical Notes:"}</span>
              </label>
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Center stone ruby round cabochon; back-chain with screw lock..."
                className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl p-2.5 text-xs text-ivory focus:outline-none focus:border-gold-400 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-obsidian-950 text-ivory-muted hover:text-white text-xs border border-gold-900/60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveAndExport}
                className="flex-1 btn-gold-primary py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-gold-glow"
              >
                <Check className="w-4 h-4" />
                <span>{isTe ? "కస్టమైజేషన్ ఖరారు చేయండి" : "Confirm Karigar Markup (+Δg)"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
