"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import {
  JewelryItem,
  MOCK_JEWELRY_CATALOG,
  getJewelryImageUri,
} from "@/data/mockJewelryCatalog";
import {
  initFaceLandmarker,
  detectFaceAnchors,
  FaceAnchors,
} from "@/lib/faceLandmarker";
import { formatINR } from "@/lib/goldMath";
import { useLanguage } from "@/context/LanguageContext";
import {
  BridalComboSlots,
  BridalSlotId,
  BRIDAL_SLOT_CONFIGS,
  determineSlotForItem,
  EquippedOrnament,
} from "@/lib/comboSetStore";
import {
  Camera,
  RefreshCw,
  Sliders,
  Sparkles,
  Download,
  AlertCircle,
  Eye,
  Check,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Calculator,
  Shield,
  Layers,
  Crown,
  Gem,
  Flame,
  CircleDot,
} from "lucide-react";

interface LiveARTryOnProps {
  initialItem?: JewelryItem;
  catalog?: JewelryItem[];
  onOpenCalculator: (item: JewelryItem) => void;
  onSelectForPhotoMatch?: (item: JewelryItem) => void;
  goldRate22K: number;
  goldRate24K?: number;
  bridalSlots?: BridalComboSlots;
  isComboMode?: boolean;
  onToggleComboMode?: (enabled: boolean) => void;
  onEquipSlot?: (slotId: BridalSlotId, item: JewelryItem) => void;
  onOpenBridalDrawer?: () => void;
}

export type CameraState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

export const LiveARTryOn: React.FC<LiveARTryOnProps> = ({
  initialItem,
  catalog = MOCK_JEWELRY_CATALOG,
  onOpenCalculator,
  onSelectForPhotoMatch,
  goldRate22K,
  goldRate24K = 7470,
  bridalSlots,
  isComboMode = false,
  onToggleComboMode,
  onEquipSlot,
  onOpenBridalDrawer,
}) => {
  const { isTe } = useLanguage();
  const [selectedItem, setSelectedItem] = useState<JewelryItem>(
    initialItem || catalog[0] || MOCK_JEWELRY_CATALOG[0]
  );
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraState, setCameraState] = useState<CameraState>("requesting");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [isLiteMode, setIsLiteMode] = useState<boolean>(false);
  const [trackingConfidence, setTrackingConfidence] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Active slot focus for fine-tuning in Bridal Combo Mode
  const [activeSlotFocus, setActiveSlotFocus] = useState<BridalSlotId>("slot_choker");

  // Per-slot fine-tuning overrides
  const [slotOverrides, setSlotOverrides] = useState<
    Record<
      BridalSlotId,
      { scale: number; offsetY: number; offsetX: number; rotate: number }
    >
  >({
    slot_choker: { scale: 1.0, offsetY: 0, offsetX: 0, rotate: 0 },
    slot_haram: { scale: 1.0, offsetY: 0, offsetX: 0, rotate: 0 },
    slot_earrings: { scale: 1.0, offsetY: 0, offsetX: 0, rotate: 0 },
    slot_tikka: { scale: 1.0, offsetY: 0, offsetX: 0, rotate: 0 },
    slot_nosering: { scale: 1.0, offsetY: 0, offsetX: 0, rotate: 0 },
  });

  // Manual Fine-Tuning state (Single mode)
  const [manualScale, setManualScale] = useState<number>(1.0);
  const [manualOffsetY, setManualOffsetY] = useState<number>(0);
  const [manualOffsetX, setManualOffsetX] = useState<number>(0);
  const [manualRotate, setManualRotate] = useState<number>(0);
  const [goldTone, setGoldTone] = useState<
    "champagne" | "antique" | "rose" | "bright"
  >("champagne");

  // Snapshot modal state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Refs
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const cachedJewelryImgRef = useRef<HTMLImageElement | null>(null);
  const cachedSlotImgsRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Sync initial item if changed from parent
  useEffect(() => {
    if (initialItem) {
      setSelectedItem(initialItem);
      setManualScale(1.0);
      setManualOffsetY(0);
      setManualOffsetX(0);
      setManualRotate(0);
    }
  }, [initialItem]);

  // Pre-render SVG / Data URI jewelry into HTML Image element (Single mode)
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = getJewelryImageUri(selectedItem);
    img.onload = () => {
      cachedJewelryImgRef.current = img;
    };
  }, [selectedItem]);

  // Preload and cache all equipped slot images (Bridal Combo Mode)
  useEffect(() => {
    if (!bridalSlots) return;

    (Object.keys(bridalSlots) as BridalSlotId[]).forEach((slotId) => {
      const entry = bridalSlots[slotId];
      if (entry && entry.item) {
        const uri = getJewelryImageUri(entry.item);
        if (!cachedSlotImgsRef.current.has(entry.item.id)) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = uri;
          img.onload = () => {
            cachedSlotImgsRef.current.set(entry.item.id, img);
          };
        }
      }
    });
  }, [bridalSlots]);

  // Initialize MediaPipe Vision Tasks with 10s timeout fallback
  useEffect(() => {
    let mounted = true;
    async function loadLandmarker() {
      try {
        setIsModelLoading(true);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("MediaPipe 10s timeout")), 10000)
        );
        const landmarker = await Promise.race([initFaceLandmarker(), timeoutPromise]);
        if (mounted) {
          landmarkerRef.current = landmarker;
          setIsModelLoading(false);
          setIsLiteMode(false);
        }
      } catch (err: any) {
        console.warn("MediaPipe model loading warning/timeout, falling back to Lite Mode:", err);
        if (mounted) {
          setIsLiteMode(true);
          setIsModelLoading(false);
        }
      }
    }
    loadLandmarker();

    return () => {
      mounted = false;
    };
  }, []);

  // Main AR Render Loop
  const renderLoop = useCallback(() => {
    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    if (video.readyState !== 4) {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      animFrameIdRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    // Clear overlay canvas
    ctx.clearRect(0, 0, width, height);

    // Run facial detection or Lite Mode centered fallback
    let anchors =
      !isLiteMode && landmarkerRef.current
        ? detectFaceAnchors(landmarkerRef.current, video)
        : null;

    if (!anchors || !anchors.detected) {
      if (isLiteMode || !landmarkerRef.current) {
        // High-precision calibrated static fallback for Lite Mode
        anchors = {
          detected: true,
          faceWidth: 0.35,
          faceHeight: 0.45,
          rollAngle: 0,
          pitchAngle: 0,
          yawAngle: 0,
          neck: { x: 0.5, y: 0.68 },
          chest: { x: 0.5, y: 0.86 },
          forehead: { x: 0.5, y: 0.32 },
          nose: { x: 0.5, y: 0.48 },
          noseWing: { x: 0.47, y: 0.5 },
          leftEar: { x: 0.32, y: 0.46 },
          rightEar: { x: 0.68, y: 0.46 },
          chin: { x: 0.5, y: 0.6 },
        };
        setTrackingConfidence(0.5);
      } else {
        setTrackingConfidence(0);
      }
    } else {
      setTrackingConfidence(0.9);
    }

    if (anchors) {
      if (isComboMode && bridalSlots) {
        drawBridalComboSet(ctx, width, height, anchors);
      } else {
        drawSingleJewelry(
          ctx,
          width,
          height,
          anchors,
          selectedItem,
          manualScale,
          manualOffsetY,
          manualOffsetX,
          manualRotate
        );
      }
    }

    animFrameIdRef.current = requestAnimationFrame(renderLoop);
  }, [
    selectedItem,
    manualScale,
    manualOffsetY,
    manualOffsetX,
    manualRotate,
    goldTone,
    isComboMode,
    bridalSlots,
    activeSlotFocus,
    slotOverrides,
    isLiteMode,
  ]);

  useEffect(() => {
    animFrameIdRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [renderLoop]);

  // Apply Gold Tone / Warmth Filter
  const applyGoldToneFilter = (ctx: CanvasRenderingContext2D) => {
    if (goldTone === "rose") {
      ctx.filter = "sepia(0.3) saturate(1.4) hue-rotate(-15deg)";
    } else if (goldTone === "antique") {
      ctx.filter = "sepia(0.5) contrast(1.1) brightness(0.95)";
    } else if (goldTone === "bright") {
      ctx.filter = "saturate(1.2) brightness(1.1)";
    } else {
      ctx.filter = "none";
    }
  };

  // Draw a single ornament with normalized facial-fraction offsets
  const drawSingleJewelry = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    anchors: FaceAnchors,
    item: JewelryItem,
    scaleMod: number,
    offsetYMod: number,
    offsetXMod: number,
    rotateMod: number,
    verticalStackAdjustment: number = 0,
    providedImg?: HTMLImageElement
  ) => {
    const img = providedImg || cachedJewelryImgRef.current;
    if (!img || !img.complete) return;

    ctx.save();
    applyGoldToneFilter(ctx);

    const faceW = anchors.faceWidth * width;
    const faceH = anchors.faceHeight * height;

    // Fractional offset relative to dynamic face dimensions (Item 12)
    const effOffsetX = (offsetXMod / 100) * faceW;
    const effOffsetY = (offsetYMod / 100) * faceH;

    if (item.anchorType === "earrings") {
      // Left Earlobe Earring
      const leftX = anchors.leftEar.x * width + effOffsetX;
      const leftY = anchors.leftEar.y * height + effOffsetY;
      const earScale = (faceW / 240) * item.defaultScale * scaleMod;
      const ew = 90 * earScale;
      const eh = ew / (img.width / img.height || item.aspectRatio);

      ctx.save();
      ctx.translate(leftX, leftY);
      ctx.rotate(anchors.rollAngle + (rotateMod * Math.PI) / 180);
      ctx.drawImage(img, -ew / 2, 0, ew, eh);
      ctx.restore();

      // Right Earlobe Earring (Horizontally Flipped)
      const rightX = anchors.rightEar.x * width + effOffsetX;
      const rightY = anchors.rightEar.y * height + effOffsetY;

      ctx.save();
      ctx.translate(rightX, rightY);
      ctx.rotate(anchors.rollAngle - (rotateMod * Math.PI) / 180);
      ctx.scale(-1, 1);
      ctx.drawImage(img, -ew / 2, 0, ew, eh);
      ctx.restore();
    } else if (item.anchorType === "necklace") {
      // Necklace anchored at Neck Base with smart vertical stacking
      const neckX = anchors.neck.x * width + effOffsetX;
      const neckY =
        anchors.neck.y * height +
        item.defaultOffsetY +
        verticalStackAdjustment +
        effOffsetY;
      const neckScale = (faceW / 180) * item.defaultScale * scaleMod;
      const nw = 340 * neckScale;
      const nh = nw / (img.width / img.height || item.aspectRatio);

      ctx.save();
      ctx.translate(neckX, neckY);
      ctx.rotate(anchors.rollAngle + (rotateMod * Math.PI) / 180);
      ctx.drawImage(img, -nw / 2, -nh * 0.15, nw, nh);
      ctx.restore();
    } else if (item.anchorType === "nose") {
      // Nose Ring anchored at Nostril Wing
      const noseX =
        anchors.noseWing.x * width + item.defaultOffsetX + effOffsetX;
      const noseY =
        anchors.noseWing.y * height + item.defaultOffsetY + effOffsetY;
      const noseScale = (faceW / 280) * item.defaultScale * scaleMod;
      const now = 80 * noseScale;
      const noh = now / (img.width / img.height || item.aspectRatio);

      ctx.save();
      ctx.translate(noseX, noseY);
      ctx.rotate(anchors.rollAngle + (rotateMod * Math.PI) / 180);
      ctx.drawImage(img, -now * 0.3, -noh * 0.3, now, noh);
      ctx.restore();
    } else if (item.anchorType === "forehead") {
      // Maang Tikka at Hairline / Forehead Center
      const tikkaX = anchors.forehead.x * width + effOffsetX;
      const tikkaY =
        anchors.forehead.y * height + item.defaultOffsetY + effOffsetY;
      const tikkaScale = (faceH / 260) * item.defaultScale * scaleMod;
      const tw = 120 * tikkaScale;
      const th = tw / (img.width / img.height || item.aspectRatio);

      ctx.save();
      ctx.translate(tikkaX, tikkaY);
      ctx.rotate(anchors.rollAngle + (rotateMod * Math.PI) / 180);
      ctx.drawImage(img, -tw / 2, -th * 0.2, tw, th);
      ctx.restore();
    } else {
      // General / Bangles
      const wx = width * 0.5 + effOffsetX;
      const wy = height * 0.75 + effOffsetY;
      const bw = 200 * item.defaultScale * scaleMod;
      const bh = bw / (img.width / img.height || 1.0);
      ctx.save();
      ctx.translate(wx, wy);
      ctx.drawImage(img, -bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    }

    ctx.restore();
  };

  // Draw full Bridal Combo Set simultaneously
  const drawBridalComboSet = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    anchors: FaceAnchors
  ) => {
    if (!bridalSlots) return;

    const hasChoker = Boolean(bridalSlots.slot_choker);
    const hasHaram = Boolean(bridalSlots.slot_haram);
    const bothNecklacesEquipped = hasChoker && hasHaram;

    // Render Order (Back to Front):
    // 1. slot_haram (Low chest, background)
    // 2. slot_choker (High collarbone, layered in front of haram)
    // 3. slot_earrings (Earlobes)
    // 4. slot_tikka (Forehead)
    // 5. slot_nosering (Nose Wing)

    // 1. Long Haram
    if (bridalSlots.slot_haram) {
      const entry = bridalSlots.slot_haram;
      const override = slotOverrides.slot_haram;
      const img = cachedSlotImgsRef.current.get(entry.item.id);
      // If both necklaces are on, push Haram down so it sits gloriously below Choker
      const haramOffset = bothNecklacesEquipped ? 60 : 25;
      const haramScale = (bothNecklacesEquipped ? 1.15 : 1.0) * override.scale;

      drawSingleJewelry(
        ctx,
        width,
        height,
        anchors,
        entry.item,
        haramScale,
        override.offsetY,
        override.offsetX,
        override.rotate,
        haramOffset,
        img
      );
    }

    // 2. Choker / Short Necklace
    if (bridalSlots.slot_choker) {
      const entry = bridalSlots.slot_choker;
      const override = slotOverrides.slot_choker;
      const img = cachedSlotImgsRef.current.get(entry.item.id);
      // Offset choker slightly higher near collarbone
      const chokerOffset = bothNecklacesEquipped ? -20 : -5;
      const chokerScale = (bothNecklacesEquipped ? 0.95 : 1.0) * override.scale;

      drawSingleJewelry(
        ctx,
        width,
        height,
        anchors,
        entry.item,
        chokerScale,
        override.offsetY,
        override.offsetX,
        override.rotate,
        chokerOffset,
        img
      );
    }

    // 3. Earrings
    if (bridalSlots.slot_earrings) {
      const entry = bridalSlots.slot_earrings;
      const override = slotOverrides.slot_earrings;
      const img = cachedSlotImgsRef.current.get(entry.item.id);
      drawSingleJewelry(
        ctx,
        width,
        height,
        anchors,
        entry.item,
        override.scale,
        override.offsetY,
        override.offsetX,
        override.rotate,
        0,
        img
      );
    }

    // 4. Maang Tikka
    if (bridalSlots.slot_tikka) {
      const entry = bridalSlots.slot_tikka;
      const override = slotOverrides.slot_tikka;
      const img = cachedSlotImgsRef.current.get(entry.item.id);
      drawSingleJewelry(
        ctx,
        width,
        height,
        anchors,
        entry.item,
        override.scale,
        override.offsetY,
        override.offsetX,
        override.rotate,
        0,
        img
      );
    }

    // 5. Nose Ring
    if (bridalSlots.slot_nosering) {
      const entry = bridalSlots.slot_nosering;
      const override = slotOverrides.slot_nosering;
      const img = cachedSlotImgsRef.current.get(entry.item.id);
      drawSingleJewelry(
        ctx,
        width,
        height,
        anchors,
        entry.item,
        override.scale,
        override.offsetY,
        override.offsetX,
        override.rotate,
        0,
        img
      );
    }
  };

  // Capture High-Res Snapshot
  const handleTakeSnapshot = () => {
    const video = webcamRef.current?.video;
    const overlayCanvas = canvasRef.current;
    if (!video || !overlayCanvas) return;

    const snapCanvas = document.createElement("canvas");
    snapCanvas.width = video.videoWidth || 1280;
    snapCanvas.height = video.videoHeight || 720;
    const ctx = snapCanvas.getContext("2d");
    if (!ctx) return;

    // Draw webcam frame
    ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
    // Draw AR jewelry overlay
    ctx.drawImage(overlayCanvas, 0, 0, snapCanvas.width, snapCanvas.height);

    // Watermark
    ctx.fillStyle = "rgba(11, 11, 14, 0.75)";
    ctx.fillRect(20, snapCanvas.height - 75, 340, 55);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, snapCanvas.height - 75, 340, 55);

    ctx.fillStyle = "#FFE89E";
    ctx.font = "bold 15px 'Cinzel', serif";
    ctx.fillText("SWARNATRY • AI VIRTUAL TRY-ON", 35, snapCanvas.height - 45);

    ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#FAF8F5";
    ctx.fillText(
      isComboMode ? "Bridal Combo Set • 22K 916 BIS Hallmarked" : `${selectedItem.name} • 22K 916 BIS`,
      35,
      snapCanvas.height - 28
    );

    setCapturedImage(snapCanvas.toDataURL("image/png"));
  };

  const handleDownloadSnapshot = () => {
    if (!capturedImage) return;
    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `SwarnaTry-${isComboMode ? "Bridal-Combo-Set" : selectedItem.id}-AR-TryOn.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Carousel item click handler
  const handleCarouselItemClick = (item: JewelryItem) => {
    if (isComboMode && onEquipSlot && bridalSlots) {
      const targetSlot = determineSlotForItem(item, bridalSlots);
      onEquipSlot(targetSlot, item);
      setActiveSlotFocus(targetSlot);
    } else {
      setSelectedItem(item);
      setManualScale(item.defaultScale || 1.0);
      setManualOffsetY(0);
      setManualOffsetX(0);
      setManualRotate(0);
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-obsidian-950 border border-gold-900/60 shadow-gold-glow-lg flex flex-col">
      {/* Top Floating Header & Mode Toggles */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none flex-wrap gap-2">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Tracking Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-obsidian-950/85 border border-gold-900/80 backdrop-blur-md shadow-lg">
            <span
              className={`w-2 h-2 rounded-full ${
                isLiteMode
                  ? "bg-amber-400"
                  : trackingConfidence > 0.4
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-[11px] font-medium text-gold-300">
              {isModelLoading
                ? "Loading Vision Model..."
                : isLiteMode
                ? "Lite Mode (No Face Tracking)"
                : trackingConfidence > 0.4
                ? "Face Tracked (60 FPS)"
                : "Align Face to Center"}
            </span>
          </div>

          {/* Bridal Combo Mode Toggle */}
          {onToggleComboMode && (
            <button
              onClick={() => onToggleComboMode(!isComboMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-lg ${
                isComboMode
                  ? "bg-gold-600 text-obsidian-950 border border-gold-400 shadow-gold-glow scale-105"
                  : "bg-obsidian-950/85 text-gold-300 border border-gold-900/80 hover:border-gold-500"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{isComboMode ? "Bridal Combo Mode (ON)" : "Single Item Mode"}</span>
            </button>
          )}

          {/* Bridal Tray Trigger Button */}
          {onOpenBridalDrawer && bridalSlots && (
            <button
              onClick={onOpenBridalDrawer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-obsidian-950/85 hover:bg-gold-950/50 text-gold-300 border border-gold-500/50 text-xs font-medium backdrop-blur-md transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-gold-400" />
              <span>
                Bridal Tray (
                {
                  Object.values(bridalSlots).filter((v) => Boolean(v)).length
                }
                /5)
              </span>
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowControls(!showControls)}
            className={`px-3 py-1.5 rounded-xl backdrop-blur-md border transition-all flex items-center gap-1.5 text-xs font-semibold ${
              showControls
                ? "bg-gold-500 text-obsidian-950 border-gold-400 shadow-gold-glow"
                : "bg-obsidian-950/80 text-gold-300 border-gold-900/80 hover:bg-obsidian-800"
            }`}
            title="Toggle Fine-Tuning Controls"
          >
            <Sliders className="w-4 h-4" />
            <span>Tune</span>
          </button>

          <button
            onClick={() =>
              setFacingMode(facingMode === "user" ? "environment" : "user")
            }
            className="p-2 rounded-xl bg-obsidian-950/80 text-gold-300 border border-gold-900/80 hover:bg-obsidian-800 backdrop-blur-md transition-colors"
            title="Switch Camera (Front / Back)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main AR Video & Canvas Viewport */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-obsidian-900 overflow-hidden flex items-center justify-center">
        {cameraState === "denied" || cameraState === "unavailable" ? (
          <div className="text-center p-8 max-w-md mx-auto space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/70 border border-amber-500/50 flex items-center justify-center text-amber-400 mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-cinzel font-bold text-base text-gold-300">
                {isTe ? "కెమెరా అనుమతి బ్లాక్ చేయబడింది" : "Camera Access Blocked"}
              </h3>
              <p className="text-xs text-ivory-muted leading-relaxed">
                {isTe
                  ? "కెమెరా యాక్సెస్ నిరోధించబడింది. బ్రౌజర్ URL బార్‌లో అనుమతించండి, లేదా ఫోటో మ్యాచ్ ఉపయోగించండి."
                  : "Camera access was blocked. Tap allow in your browser URL bar, or try Photo Match."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setCameraState("requesting");
                }}
                className="w-full sm:w-auto bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 border border-gold-900/60 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                {isTe ? "మళ్లీ ప్రయత్నించండి" : "Try Camera Again"}
              </button>
              {onSelectForPhotoMatch && (
                <button
                  onClick={() => onSelectForPhotoMatch(selectedItem)}
                  className="w-full sm:w-auto bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-gold-glow"
                >
                  {isTe ? "ఫోటో మ్యాచ్ ఉపయోగించండి" : "Use Photo Match instead"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              videoConstraints={{
                facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }}
              onUserMedia={() => setCameraState("granted")}
              onUserMediaError={(err: any) => {
                console.warn("Camera media error:", err);
                if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
                  setCameraState("unavailable");
                } else {
                  setCameraState("denied");
                }
              }}
              mirrored={facingMode === "user"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
                facingMode === "user" ? "scale-x-[-1]" : ""
              }`}
            />
          </>
        )}

        {/* Live Active Ornament Pill Overlay */}
        {!isComboMode ? (
          <div className="absolute top-20 left-4 z-10 bg-obsidian-950/85 border border-gold-900/60 rounded-2xl p-3 backdrop-blur-md max-w-xs shadow-xl hidden sm:block">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gold-300 tracking-wide font-cinzel truncate">
                {selectedItem.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-ivory-muted">
              <span>{selectedItem.id}</span>
              <span className="text-emerald-400 font-semibold">
                {formatINR(
                  selectedItem.defaultGrams * goldRate22K * (1 + selectedItem.wastagePercent / 100) * 1.03
                )}
              </span>
            </div>
          </div>
        ) : (
          /* Bridal Combo Active Stacking Pill Overlay */
          <div className="absolute top-20 left-4 z-10 bg-obsidian-950/90 border border-gold-500/40 rounded-2xl p-3 backdrop-blur-md max-w-xs shadow-xl hidden sm:block space-y-1.5">
            <div className="flex items-center justify-between border-b border-gold-900/40 pb-1">
              <span className="text-[11px] font-bold text-gold-300 font-cinzel uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-gold-400" />
                <span>Bridal Combo Stack</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Smart Stacking ON</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {(Object.keys(BRIDAL_SLOT_CONFIGS) as BridalSlotId[]).map((slotId) => {
                const item = bridalSlots?.[slotId]?.item;
                if (!item) return null;
                return (
                  <div
                    key={slotId}
                    onClick={() => setActiveSlotFocus(slotId)}
                    className={`flex items-center justify-between px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      activeSlotFocus === slotId
                        ? "bg-gold-500/20 text-gold-300 font-semibold"
                        : "text-ivory-muted hover:text-ivory"
                    }`}
                  >
                    <span className="truncate max-w-[140px]">• {item.name}</span>
                    <span className="text-[10px] text-gold-400/80">{item.id}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Floating Snapshot Trigger Button */}
        <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20 pointer-events-auto">
          <button
            onClick={handleTakeSnapshot}
            className="group relative p-1 rounded-full bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-200 shadow-gold-glow hover:scale-105 transition-all"
            title="Take High-Res Try-On Snapshot"
          >
            <div className="p-3.5 sm:p-4 rounded-full bg-obsidian-950 group-hover:bg-obsidian-900 transition-colors flex items-center justify-center">
              <Camera className="w-6 h-6 text-gold-300" />
            </div>
          </button>
        </div>

        {/* Fine-Tuning Floating Controls Drawer */}
        {showControls && (
          <div className="absolute top-16 right-4 z-20 w-64 sm:w-72 bg-obsidian-950/95 border border-gold-500/40 rounded-2xl p-4 backdrop-blur-md shadow-2xl space-y-3 animate-in fade-in slide-in-from-right duration-200 text-ivory">
            <div className="flex items-center justify-between border-b border-gold-900/60 pb-2">
              <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>{isComboMode ? "Slot Fine-Tuning" : "AR Fine-Tuning"}</span>
              </span>
              <button
                onClick={() => {
                  if (isComboMode) {
                    setSlotOverrides((prev) => ({
                      ...prev,
                      [activeSlotFocus]: { scale: 1.0, offsetY: 0, offsetX: 0, rotate: 0 },
                    }));
                  } else {
                    setManualScale(1.0);
                    setManualOffsetY(0);
                    setManualOffsetX(0);
                    setManualRotate(0);
                  }
                }}
                className="text-[10px] text-ivory-muted hover:text-gold-300 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* In Bridal Combo Mode: Slot Selector Pills */}
            {isComboMode && bridalSlots && (
              <div className="space-y-1">
                <span className="text-[10px] text-ivory-muted uppercase tracking-wider block">
                  Select Layer to Tune:
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(BRIDAL_SLOT_CONFIGS) as BridalSlotId[]).map((slotId) => {
                    const isEquipped = Boolean(bridalSlots[slotId]);
                    return (
                      <button
                        key={slotId}
                        onClick={() => setActiveSlotFocus(slotId)}
                        disabled={!isEquipped}
                        className={`text-[10px] py-1 px-1.5 rounded-lg border transition-all text-center truncate ${
                          activeSlotFocus === slotId
                            ? "bg-gold-500 text-obsidian-950 border-gold-400 font-bold"
                            : isEquipped
                            ? "bg-obsidian-900 text-gold-300 border-gold-900/60 hover:border-gold-500"
                            : "bg-obsidian-950 text-ivory-muted/40 border-white/5 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {slotId === "slot_choker" && "Choker"}
                        {slotId === "slot_haram" && "Haram"}
                        {slotId === "slot_earrings" && "Earrings"}
                        {slotId === "slot_tikka" && "Tikka"}
                        {slotId === "slot_nosering" && "Nath"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scale Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-ivory-muted">
                <span>Scale / Size:</span>
                <span className="text-gold-300 font-mono">
                  {isComboMode
                    ? slotOverrides[activeSlotFocus].scale.toFixed(2)
                    : manualScale.toFixed(2)}
                  x
                </span>
              </div>
              <input
                type="range"
                min={0.6}
                max={1.6}
                step={0.05}
                value={
                  isComboMode
                    ? slotOverrides[activeSlotFocus].scale
                    : manualScale
                }
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (isComboMode) {
                    setSlotOverrides((prev) => ({
                      ...prev,
                      [activeSlotFocus]: { ...prev[activeSlotFocus], scale: val },
                    }));
                  } else {
                    setManualScale(val);
                  }
                }}
                className="w-full h-1.5 bg-obsidian-900 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>

            {/* Vertical Offset Slider (Normalized Fraction of Face Height) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-ivory-muted">
                <span>Vertical Position:</span>
                <span className="text-gold-300 font-mono">
                  {isComboMode
                    ? slotOverrides[activeSlotFocus].offsetY > 0 ? `+${slotOverrides[activeSlotFocus].offsetY}%` : `${slotOverrides[activeSlotFocus].offsetY}%`
                    : manualOffsetY > 0 ? `+${manualOffsetY}%` : `${manualOffsetY}%`}
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={
                  isComboMode
                    ? slotOverrides[activeSlotFocus].offsetY
                    : manualOffsetY
                }
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (isComboMode) {
                    setSlotOverrides((prev) => ({
                      ...prev,
                      [activeSlotFocus]: { ...prev[activeSlotFocus], offsetY: val },
                    }));
                  } else {
                    setManualOffsetY(val);
                  }
                }}
                className="w-full h-1.5 bg-obsidian-900 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>

            {/* Horizontal Offset Slider (Normalized Fraction of Face Width) */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-ivory-muted">
                <span>Horizontal Offset:</span>
                <span className="text-gold-300 font-mono">
                  {isComboMode
                    ? slotOverrides[activeSlotFocus].offsetX > 0 ? `+${slotOverrides[activeSlotFocus].offsetX}%` : `${slotOverrides[activeSlotFocus].offsetX}%`
                    : manualOffsetX > 0 ? `+${manualOffsetX}%` : `${manualOffsetX}%`}
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={
                  isComboMode
                    ? slotOverrides[activeSlotFocus].offsetX
                    : manualOffsetX
                }
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (isComboMode) {
                    setSlotOverrides((prev) => ({
                      ...prev,
                      [activeSlotFocus]: { ...prev[activeSlotFocus], offsetX: val },
                    }));
                  } else {
                    setManualOffsetX(val);
                  }
                }}
                className="w-full h-1.5 bg-obsidian-900 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>

            {/* Gold Tone / Lighting Filter */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] text-ivory-muted block">
                Gold Tone / Lighting:
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: "champagne", label: "22K Champ" },
                  { id: "antique", label: "Nakshi" },
                  { id: "rose", label: "Rose Gold" },
                  { id: "bright", label: "24K Polish" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setGoldTone(t.id as any)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all ${
                      goldTone === t.id
                        ? "bg-gold-500 text-obsidian-950 font-bold"
                        : "bg-obsidian-900 text-ivory-muted hover:text-ivory border border-gold-900/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Swap Carousel */}
      <div className="p-4 bg-obsidian-950 border-t border-gold-900/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider font-cinzel">
              {isComboMode ? "Tap to Add into Bridal Combo Slot" : "Catalog Selection Carousel"}
            </span>
            {isComboMode && (
              <span className="bg-gold-500/20 text-gold-300 text-[10px] px-2 py-0.5 rounded-full border border-gold-500/30">
                Layering Active
              </span>
            )}
          </div>
          <span className="text-[11px] text-ivory-muted">
            {isComboMode ? "Tap to equip slot" : "Tap ornament to wear live"}
          </span>
        </div>

        <div className="bottom-carousel flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
          {catalog.map((item) => (
            <button
              key={item.id}
              onClick={() => handleCarouselItemClick(item)}
              className={`shrink-0 w-24 sm:w-28 p-2 rounded-xl border text-center transition-all ${
                selectedItem.id === item.id ||
                (isComboMode && bridalSlots && Object.values(bridalSlots).some((s) => s?.item.id === item.id))
                  ? "bg-gradient-to-b from-gold-500/25 to-obsidian-900 border-gold-400 shadow-gold-glow scale-105"
                  : "bg-obsidian-950/80 border-gold-900/50 hover:border-gold-700 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-1 flex items-center justify-center filter drop-shadow">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getJewelryImageUri(item)}
                  alt={item.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <span className="text-[11px] font-semibold text-ivory block line-clamp-1">
                {item.name}
              </span>
              <span className="text-[10px] text-gold-300 font-mono block">
                {item.minGrams}g - {item.maxGrams}g
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Snapshot Preview & Export Modal */}
      {capturedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-obsidian-900 border border-gold-subtle rounded-2xl p-5 shadow-gold-glow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-gold-900/60 pb-3">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-ivory">
                  Captured AR Virtual Try-On
                </h3>
                <p className="text-xs text-gold-300">
                  {isComboMode ? "Full Bridal Set Try-On Snapshot" : "Single Ornament Try-On"}
                </p>
              </div>
              <button
                onClick={() => setCapturedImage(null)}
                className="text-ivory-muted hover:text-ivory p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-gold-500/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured Try On"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDownloadSnapshot}
                className="flex-1 btn-gold-primary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Save to Photos (HD)</span>
              </button>

              <button
                onClick={() => setCapturedImage(null)}
                className="py-2.5 px-4 rounded-xl bg-obsidian-800 text-ivory hover:bg-obsidian-700 text-xs border border-gold-900/60"
              >
                Retake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
