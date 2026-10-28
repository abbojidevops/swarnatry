"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  JewelryItem,
  MOCK_JEWELRY_CATALOG,
  getJewelryImageUri,
} from "@/data/mockJewelryCatalog";
import { SAMPLE_PORTRAITS, SamplePortrait } from "@/data/samplePortraits";
import {
  removeBackgroundCanvas,
  warpNecklaceCanvas,
  createComparisonCard,
  createBridalSetLookbookCard,
} from "@/lib/imageProcessing";
import { formatINR, calculateGoldPrice } from "@/lib/goldMath";
import { useLanguage } from "@/context/LanguageContext";
import {
  BridalComboSlots,
  BridalSlotId,
  BRIDAL_SLOT_CONFIGS,
  calculateComboSetTotals,
} from "@/lib/comboSetStore";
import { FaceSuitabilityBadge } from "@/components/FaceSuitabilityBadge";
import {
  getPresetFaceAnalysis,
  calculateSuitability,
  FaceShape,
} from "@/lib/faceStylistEngine";
import { FamilyVoteModal } from "@/components/FamilyVoteModal";
import { GoldSchemePlanner } from "@/components/GoldSchemePlanner";
import { SAREE_DRAPES, SareeDrape } from "@/components/LiveARTryOn";
import {
  Upload,
  Sparkles,
  Download,
  RotateCw,
  FlipHorizontal,
  Trash2,
  Copy,
  Sliders,
  Sun,
  Eye,
  EyeOff,
  Move,
  Layers,
  ArrowUp,
  ArrowDown,
  Crown,
  Gem,
  Plus,
  Compass,
  Check,
  Users,
  PiggyBank,
  Scale,
  X,
  Palette,
} from "lucide-react";

interface CustomPhotoTryOnProps {
  initialItem?: JewelryItem;
  catalog?: JewelryItem[];
  goldRate22K: number;
  goldRate24K?: number;
  showroomName: string;
  onOpenCalculator: (item: JewelryItem) => void;
  bridalSlots?: BridalComboSlots;
  isComboMode?: boolean;
  onOpenBridalDrawer?: () => void;
  onEquipSlot?: (slotId: BridalSlotId, item: JewelryItem) => void;
}

export interface PhotoLayer {
  id: string;
  name: string;
  categoryLabel?: string;
  imgElement: HTMLImageElement | HTMLCanvasElement;
  item?: JewelryItem;
  x: number;
  y: number;
  scale: number;
  rotation: number; // degrees
  flipped: boolean;
  shadowBlur: number;
  shadowOpacity: number;
  warmth: number;
  neckCurve: number; // -40 to +40 degrees parabolic warp
  yawAngle: number; // -35 to +35 degrees perspective tilt
  visible: boolean;
}

const PORTRAIT_FACE_SHAPES: Record<string, FaceShape> = {
  "portrait-bridal-1": "oval",
  "portrait-bridal-2": "heart",
  "portrait-bridal-3": "round",
  "portrait-bridal-4": "square",
};

export const CustomPhotoTryOn: React.FC<CustomPhotoTryOnProps> = ({
  initialItem,
  catalog = MOCK_JEWELRY_CATALOG,
  goldRate22K,
  goldRate24K = 7470,
  showroomName,
  onOpenCalculator,
  bridalSlots,
  isComboMode,
  onOpenBridalDrawer,
  onEquipSlot,
}) => {
  const { isTe } = useLanguage();
  // Step 1: Portrait Image State
  const [portraitSrc, setPortraitSrc] = useState<string>(
    SAMPLE_PORTRAITS[0].url
  );
  const [selectedPortrait, setSelectedPortrait] = useState<SamplePortrait | null>(
    SAMPLE_PORTRAITS[0]
  );

  // Multi-Layer State
  const [layers, setLayers] = useState<PhotoLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Custom Jewelry Screenshot Upload State
  const [rawJewelrySrc, setRawJewelrySrc] = useState<string | null>(null);
  const [cleanedJewelryCanvas, setCleanedJewelryCanvas] =
    useState<HTMLCanvasElement | null>(null);
  const [bgTolerance, setBgTolerance] = useState<number>(35);
  const [preserveGold, setPreserveGold] = useState<boolean>(true);

  // Interactive Dragging on Canvas State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Active selected layer helper
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || null;

  // AI Face Shape Stylist State (Phase 5)
  const [manualFaceShape, setManualFaceShape] = useState<FaceShape>("oval");
  const activeFaceShape: FaceShape =
    (selectedPortrait && PORTRAIT_FACE_SHAPES[selectedPortrait.id]) || manualFaceShape;
  const currentFaceAnalysis = getPresetFaceAnalysis(activeFaceShape);
  const activeOrnament =
    selectedLayer?.item || layers.find((l) => l.item)?.item || initialItem || null;
  const activeSuitability = activeOrnament
    ? calculateSuitability(activeOrnament, currentFaceAnalysis)
    : null;

  // Dynamic Gram Morphing & Modals State (Phase 6)
  const [layerGramsMap, setLayerGramsMap] = useState<Record<string, number>>({});
  const [isFamilyVoteOpen, setIsFamilyVoteOpen] = useState<boolean>(false);
  const [isSchemePlannerOpen, setIsSchemePlannerOpen] = useState<boolean>(false);

  const getLayerGrams = (layer: PhotoLayer): number => {
    if (layerGramsMap[layer.id]) return layerGramsMap[layer.id];
    return layer.item ? layer.item.defaultGrams : 36;
  };

  const handleUpdateLayerGrams = (layerId: string, grams: number) => {
    setLayerGramsMap((prev) => ({ ...prev, [layerId]: grams }));
  };

  // Feature C: Saree Drape Contrast Matcher (Phase 7)
  const [activeSareeDrape, setActiveSareeDrape] = useState<SareeDrape>(SAREE_DRAPES[0]);
  const [isSareePaletteOpen, setIsSareePaletteOpen] = useState<boolean>(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const portraitImgRef = useRef<HTMLImageElement | null>(null);
  const prevPortraitObjectUrlRef = useRef<string | null>(null);
  const prevJewelryObjectUrlRef = useRef<string | null>(null);

  // Helper to downscale large phone camera photos to max 1600px edge to prevent memory pressure
  const downscaleImageIfNeeded = (img: HTMLImageElement, maxEdge: number = 1600): string => {
    let { width, height } = img;
    if (width <= maxEdge && height <= maxEdge) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", 0.92);
      }
      return img.src;
    }

    if (width > height) {
      height = Math.round((height * maxEdge) / width);
      width = maxEdge;
    } else {
      width = Math.round((width * maxEdge) / height);
      height = maxEdge;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", 0.92);
    }
    return img.src;
  };

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      if (prevPortraitObjectUrlRef.current) {
        URL.revokeObjectURL(prevPortraitObjectUrlRef.current);
      }
      if (prevJewelryObjectUrlRef.current) {
        URL.revokeObjectURL(prevJewelryObjectUrlRef.current);
      }
    };
  }, []);

  // Helper to create a new layer from a JewelryItem
  const addLayerFromItem = useCallback(
    (
      item: JewelryItem,
      overrideTransform?: Partial<PhotoLayer>
    ) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = getJewelryImageUri(item);
      img.onload = () => {
        const newLayerId = `layer_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`;

        let defaultX = 400;
        let defaultY = 540;
        let defaultScale = item.defaultScale || 0.85;

        // Smart placement based on anchor type
        if (item.anchorType === "earrings") {
          defaultX = 330;
          defaultY = 380;
          defaultScale = 0.75;
        } else if (item.anchorType === "forehead") {
          defaultX = 400;
          defaultY = 240;
          defaultScale = 0.7;
        } else if (item.anchorType === "nose") {
          defaultX = 410;
          defaultY = 360;
          defaultScale = 0.55;
        } else if (item.category === "necklaces") {
          if (
            item.name.toLowerCase().includes("choker") ||
            item.minGrams <= 32
          ) {
            defaultX = 400;
            defaultY = 490;
            defaultScale = 0.85;
          } else {
            defaultX = 400;
            defaultY = 620;
            defaultScale = 1.15;
          }
        }

        const newLayer: PhotoLayer = {
          id: newLayerId,
          name: item.name,
          categoryLabel: item.categoryLabel,
          imgElement: img,
          item,
          x: overrideTransform?.x ?? defaultX,
          y: overrideTransform?.y ?? defaultY,
          scale: overrideTransform?.scale ?? defaultScale,
          rotation: overrideTransform?.rotation ?? 0,
          flipped: overrideTransform?.flipped ?? false,
          shadowBlur: overrideTransform?.shadowBlur ?? 14,
          shadowOpacity: overrideTransform?.shadowOpacity ?? 0.55,
          warmth: overrideTransform?.warmth ?? 1.0,
          neckCurve: overrideTransform?.neckCurve ?? 0,
          yawAngle: overrideTransform?.yawAngle ?? 0,
          visible: true,
        };

        setLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayerId);
      };
    },
    []
  );

  // Initialize with initial item if layers empty
  useEffect(() => {
    if (layers.length === 0) {
      const startingItem = initialItem || catalog[0] || MOCK_JEWELRY_CATALOG[0];
      addLayerFromItem(startingItem);
    }
  }, [initialItem, catalog, addLayerFromItem, layers.length]);

  // Load Portrait Image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = portraitSrc;
    img.onload = () => {
      portraitImgRef.current = img;
      renderMainCanvas();
    };
  }, [portraitSrc]);

  // Handle User Portrait Upload with Object URL revocation and max 1600px cap
  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (prevPortraitObjectUrlRef.current) {
        URL.revokeObjectURL(prevPortraitObjectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      prevPortraitObjectUrlRef.current = objectUrl;

      const tempImg = new Image();
      tempImg.onload = () => {
        const optimized = downscaleImageIfNeeded(tempImg, 1600);
        setPortraitSrc(optimized);
        setSelectedPortrait(null);
        URL.revokeObjectURL(objectUrl);
        prevPortraitObjectUrlRef.current = null;
      };
      tempImg.src = objectUrl;
    }
  };

  // Handle Custom Jewelry Screenshot Upload with Object URL revocation and max 1600px cap
  const handleJewelryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (prevJewelryObjectUrlRef.current) {
        URL.revokeObjectURL(prevJewelryObjectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      prevJewelryObjectUrlRef.current = objectUrl;

      const tempImg = new Image();
      tempImg.onload = () => {
        const optimized = downscaleImageIfNeeded(tempImg, 1600);
        setRawJewelrySrc(optimized);
        processCustomJewelry(optimized, bgTolerance, preserveGold);
        URL.revokeObjectURL(objectUrl);
        prevJewelryObjectUrlRef.current = null;
      };
      tempImg.src = objectUrl;
    }
  };

  const processCustomJewelry = (
    src: string,
    tolerance: number,
    preserve: boolean
  ) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const cleaned = removeBackgroundCanvas(tempCanvas, {
          tolerance,
          feather: 2,
          preserveGoldTones: preserve,
        });
        setCleanedJewelryCanvas(cleaned);

        // Add as a new layer automatically
        const newLayerId = `layer_upload_${Date.now()}`;
        const newLayer: PhotoLayer = {
          id: newLayerId,
          name: "Custom Uploaded Design",
          categoryLabel: "Uploaded Jewelry",
          imgElement: cleaned,
          x: 400,
          y: 560,
          scale: 0.85,
          rotation: 0,
          flipped: false,
          shadowBlur: 14,
          shadowOpacity: 0.55,
          warmth: 1.0,
          neckCurve: 0,
          yawAngle: 0,
          visible: true,
        };
        setLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayerId);
      }
    };
    img.src = src;
  };

  // 1-Click "Add All from Bridal Combo Set"
  const handleAddAllFromBridalCombo = () => {
    if (!bridalSlots) return;

    // Clear existing or append
    const activeEntries = (Object.keys(bridalSlots) as BridalSlotId[])
      .map((k) => bridalSlots[k])
      .filter((e): e is NonNullable<typeof e> => Boolean(e));

    activeEntries.forEach((entry) => {
      let x = 400;
      let y = 520;
      let scale = entry.item.defaultScale || 0.85;
      let neckCurve = 0;

      if (entry.slotId === "slot_choker") {
        x = 400;
        y = 480;
        scale = 0.85;
        neckCurve = 15;
      } else if (entry.slotId === "slot_haram") {
        x = 400;
        y = 630;
        scale = 1.15;
        neckCurve = 25;
      } else if (entry.slotId === "slot_earrings") {
        // Add left earring
        addLayerFromItem(entry.item, {
          x: 310,
          y: 390,
          scale: 0.72,
          flipped: false,
        });
        // Add right earring (mirrored)
        addLayerFromItem(entry.item, {
          x: 490,
          y: 390,
          scale: 0.72,
          flipped: true,
        });
        return;
      } else if (entry.slotId === "slot_tikka") {
        x = 400;
        y = 240;
        scale = 0.7;
      } else if (entry.slotId === "slot_nosering") {
        x = 410;
        y = 360;
        scale = 0.55;
      }

      addLayerFromItem(entry.item, { x, y, scale, neckCurve });
    });
  };

  // Main Canvas Rendering
  const renderMainCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pImg = portraitImgRef.current;
    if (!pImg || !pImg.complete) return;

    const width = 800;
    const height = Math.round((width / pImg.width) * pImg.height);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(pImg, 0, 0, width, height);

    // Draw Saree / Blouse Drape (Phase 7)
    if (activeSareeDrape.id !== "none") {
      ctx.save();
      const collarY = height * 0.65;
      const bottomY = height;

      const grad = ctx.createLinearGradient(0, collarY, width, bottomY);
      grad.addColorStop(0, activeSareeDrape.primary);
      grad.addColorStop(0.3, activeSareeDrape.sheen);
      grad.addColorStop(0.7, activeSareeDrape.primary);
      grad.addColorStop(1, activeSareeDrape.secondary);

      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      ctx.lineTo(0, collarY + 35);
      ctx.quadraticCurveTo(width * 0.25, collarY - 15, width * 0.5, collarY + 45);
      ctx.quadraticCurveTo(width * 0.75, collarY - 15, width, collarY + 35);
      ctx.lineTo(width, bottomY);
      ctx.closePath();

      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 14;
      ctx.fill();

      // Royal Gold Zari Border (జరీ అంచు)
      ctx.lineWidth = 14;
      const zariGrad = ctx.createLinearGradient(0, collarY, width, collarY);
      zariGrad.addColorStop(0, "#D4AF37");
      zariGrad.addColorStop(0.5, "#FFE89E");
      zariGrad.addColorStop(1, "#AA7A1E");
      ctx.strokeStyle = zariGrad;
      ctx.shadowColor = "rgba(212, 175, 55, 0.5)";
      ctx.shadowBlur = 8;
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF";
      ctx.stroke();

      ctx.restore();
    }

    // Draw all visible layers from bottom to top
    layers.forEach((layer) => {
      if (!layer.visible) return;

      ctx.save();
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      if (layer.flipped) {
        ctx.scale(-1, 1);
      }

      // Skin Drop Shadow
      ctx.shadowColor = `rgba(18, 12, 5, ${layer.shadowOpacity})`;
      ctx.shadowBlur = layer.shadowBlur;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 6;

      if (layer.warmth !== 1.0) {
        ctx.filter = `saturate(${layer.warmth}) brightness(${
          0.9 + layer.warmth * 0.1
        })`;
      }

      const img = layer.imgElement;
      const imgW =
        (img as HTMLCanvasElement).width ||
        (img as HTMLImageElement).naturalWidth ||
        300;
      const imgH =
        (img as HTMLCanvasElement).height ||
        (img as HTMLImageElement).naturalHeight ||
        300;

      let baseW = 280 * layer.scale;
      let baseH = (baseW / imgW) * imgH;

      // Dynamic Gram-to-Thickness Morphing (Phase 6)
      if (layer.item) {
        const itemG = getLayerGrams(layer);
        const minG = layer.item.minGrams || 20;
        const maxG = layer.item.maxGrams || 80;
        const morphT = Math.max(0, Math.min(1, (itemG - minG) / Math.max(1, maxG - minG)));
        const morphW = 0.88 + 0.24 * morphT;
        const morphH = 0.94 + 0.10 * morphT;
        baseW = baseW * morphW;
        baseH = baseH * (morphH / morphW);

        // Enhance metallic depth & shadow with weight
        ctx.shadowColor = `rgba(0, 0, 0, ${layer.shadowOpacity * (0.8 + 0.4 * morphT)})`;
        ctx.shadowBlur = layer.shadowBlur * (0.8 + 0.5 * morphT);
      }

      // 3D Neck Curve & Yaw Perspective Warping
      if (
        Math.abs(layer.neckCurve) > 0.5 ||
        Math.abs(layer.yawAngle) > 0.5
      ) {
        const warpedCanvas = warpNecklaceCanvas(
          img,
          layer.neckCurve,
          layer.yawAngle
        );
        const warpedW = (baseW / imgW) * warpedCanvas.width;
        const warpedH = (baseH / imgH) * warpedCanvas.height;
        ctx.drawImage(
          warpedCanvas,
          -warpedW / 2,
          -warpedH / 2,
          warpedW,
          warpedH
        );
      } else {
        ctx.drawImage(img, -baseW / 2, -baseH / 2, baseW, baseH);
      }

      // If active/selected, draw glowing gold bounding outline & handles
      if (selectedLayerId === layer.id) {
        ctx.shadowColor = "transparent";
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(-baseW / 2 - 6, -baseH / 2 - 6, baseW + 12, baseH + 12);
        ctx.setLineDash([]);

        // Corner Handles
        const cornerSize = 8;
        ctx.fillStyle = "#FFE89E";
        [
          [-baseW / 2 - 6, -baseH / 2 - 6],
          [baseW / 2 + 6 - cornerSize, -baseH / 2 - 6],
          [-baseW / 2 - 6, baseH / 2 + 6 - cornerSize],
          [baseW / 2 + 6 - cornerSize, baseH / 2 + 6 - cornerSize],
        ].forEach(([cx, cy]) => {
          ctx.fillRect(cx, cy, cornerSize, cornerSize);
        });
      }

      ctx.restore();
    });
  }, [layers, selectedLayerId, activeSareeDrape]);

  useEffect(() => {
    renderMainCanvas();
  }, [renderMainCanvas]);

  // Coordinate helper
  const getCanvasCoords = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
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

  // Pointer Down (Hit-Testing Layers from top to bottom)
  const handlePointerDown = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const { x, y } = getCanvasCoords(e);

    // Hit-test layers in reverse order (topmost first)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;

      const img = layer.imgElement;
      const imgW =
        (img as HTMLCanvasElement).width ||
        (img as HTMLImageElement).naturalWidth ||
        300;
      const imgH =
        (img as HTMLCanvasElement).height ||
        (img as HTMLImageElement).naturalHeight ||
        300;

      let baseW = 280 * layer.scale;
      let baseH = (baseW / imgW) * imgH;

      // Dynamic Gram-to-Thickness Morphing (Phase 6)
      if (layer.item) {
        const itemG = getLayerGrams(layer);
        const minG = layer.item.minGrams || 20;
        const maxG = layer.item.maxGrams || 80;
        const morphT = Math.max(0, Math.min(1, (itemG - minG) / Math.max(1, maxG - minG)));
        const morphW = 0.88 + 0.24 * morphT;
        const morphH = 0.94 + 0.10 * morphT;
        baseW = baseW * morphW;
        baseH = baseH * (morphH / morphW);
      }

      // Simple radial distance or bounding box hit test
      const dx = x - layer.x;
      const dy = y - layer.y;

      if (Math.abs(dx) <= baseW / 2 + 20 && Math.abs(dy) <= baseH / 2 + 20) {
        setSelectedLayerId(layer.id);
        setIsDragging(true);
        setDragOffset({ x: dx, y: dy });
        return;
      }
    }

    // Clicked empty space
    setSelectedLayerId(null);
  };

  const handlePointerMove = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDragging || !selectedLayerId) return;

    const { x, y } = getCanvasCoords(e);
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id === selectedLayerId) {
          return {
            ...layer,
            x: Math.round(x - dragOffset.x),
            y: Math.round(y - dragOffset.y),
          };
        }
        return layer;
      })
    );
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Layer Update Helper
  const updateSelectedLayer = (updates: Partial<PhotoLayer>) => {
    if (!selectedLayerId) return;
    setLayers((prev) =>
      prev.map((l) => (l.id === selectedLayerId ? { ...l, ...updates } : l))
    );
  };

  // Layer Reordering
  const bringForward = (id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  const sendBackward = (id: string) => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const duplicateLayer = (id: string) => {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    const newId = `layer_${Date.now()}`;
    const duplicated: PhotoLayer = {
      ...layer,
      id: newId,
      name: `${layer.name} (Copy)`,
      x: layer.x + 30,
      y: layer.y + 30,
      flipped: !layer.flipped, // toggle flip so mirrored earring works instantly!
    };
    setLayers((prev) => [...prev, duplicated]);
    setSelectedLayerId(newId);
  };

  const deleteLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Export 1080x1350 Comparison / Lookbook Card
  const handleExportCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);
    try {
      if (isComboMode && bridalSlots) {
        const calc = calculateComboSetTotals(bridalSlots, goldRate22K, goldRate24K);
        const lookbookDataUri = createBridalSetLookbookCard(canvas, {
          showroomName,
          goldRate22K,
          totalGrossGrams: calc.totalGrossGrams,
          totalNetGrams: calc.totalNetGrams,
          totalStoneWeightGrams: calc.totalStoneWeightGrams,
          grandTotal: calc.grandTotal,
          minPossibleTotal: calc.minPossibleGrandTotal,
          maxPossibleTotal: calc.maxPossibleGrandTotal,
          totalPieces: calc.totalPieces,
          items: calc.items.map((it) => ({
            id: it.item.id,
            name: it.item.name,
            teluguName: it.item.teluguName,
            categoryLabel: it.item.categoryLabel,
            selectedGrams: it.selectedGrams,
            priceFormatted: formatINR(it.breakdown.totalEstimatedPrice),
          })),
        });

        const link = document.createElement("a");
        link.href = lookbookDataUri;
        link.download = `SwarnaTry-Bridal-Set-Lookbook-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const activeItem = selectedLayer?.item || catalog[0];
        const cardDataUri = createComparisonCard(canvas, {
          id: activeItem.id,
          name: activeItem.name,
          category: activeItem.categoryLabel,
          grams: activeItem.defaultGrams,
          price: formatINR(
            activeItem.defaultGrams *
              goldRate22K *
              (1 + activeItem.wastagePercent / 100) *
              1.03
          ),
          showroomName,
        });

        const link = document.createElement("a");
        link.href = cardDataUri;
        link.download = `SwarnaTry-${activeItem.id}-PhotoMatch.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Step 1: Portrait Selection & Upload Bar */}
      <div className="bg-obsidian-900 border border-gold-900/60 rounded-3xl p-5 shadow-gold-glow">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider font-cinzel">
              Step 1: Choose or Upload Portrait
            </span>
            <h3 className="text-base font-bold text-ivory">
              Front-Facing Photo for Multi-Ornament Try-On
            </h3>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {SAMPLE_PORTRAITS.map((portrait) => (
              <button
                key={portrait.id}
                onClick={() => {
                  setSelectedPortrait(portrait);
                  setPortraitSrc(portrait.url);
                }}
                className={`relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedPortrait?.id === portrait.id
                    ? "border-gold-400 shadow-gold-glow scale-105"
                    : "border-gold-900/50 hover:border-gold-600 opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={portrait.url}
                  alt={`Model ${portrait.name}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}

            {/* Custom Upload Portrait */}
            <label className="shrink-0 w-16 h-16 rounded-2xl border-2 border-dashed border-gold-900/80 hover:border-gold-500 bg-obsidian-950/60 flex flex-col items-center justify-center cursor-pointer transition-colors text-gold-300">
              <Upload className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-medium">Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePortraitUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Feature B: AI Face Shape Stylist & Recommendation Banner */}
      <div className="bg-obsidian-950/80 border border-gold-900/60 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-bold text-ivory uppercase tracking-wider font-cinzel">
              AI Face-Shape Advisor (ముఖ ఆకృతి సలహాదారు)
            </span>
            <span className="text-[10px] bg-gold-500/15 text-gold-300 border border-gold-500/30 px-2 py-0.5 rounded-full font-semibold">
              {currentFaceAnalysis.shapeLabel} ({currentFaceAnalysis.shapeTeluguLabel})
            </span>
          </div>

          {/* Quick Face Shape Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(["oval", "round", "heart", "square"] as FaceShape[]).map((shape) => {
              const labels: Record<FaceShape, { en: string; te: string }> = {
                oval: { en: "Oval", te: "కోల" },
                round: { en: "Round", te: "గుండ్రని" },
                heart: { en: "Heart", te: "వి-షేప్" },
                square: { en: "Square", te: "విశాల" },
              };
              const isSelected = activeFaceShape === shape;
              return (
                <button
                  key={shape}
                  type="button"
                  onClick={() => {
                    setSelectedPortrait(null);
                    setManualFaceShape(shape);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    isSelected
                      ? "bg-gold-500 text-obsidian-950 font-bold shadow-gold-glow/20"
                      : "bg-obsidian-900 text-ivory-muted hover:text-ivory border border-white/5"
                  }`}
                >
                  <span>{labels[shape].en}</span>
                  <span className="text-[9px] opacity-75 ml-1">({labels[shape].te})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Suitability Badge for current ornament */}
        {activeOrnament && activeSuitability ? (
          <div className="pt-1">
            <FaceSuitabilityBadge
              analysis={currentFaceAnalysis}
              suitability={activeSuitability}
            />
          </div>
        ) : (
          <p className="text-[11px] text-ivory-muted italic">
            Select or drag any ornament onto the portrait to see real-time AI face-shape matching &amp; styling advice.
          </p>
        )}
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Canvas Viewport (7 Cols) */}
        <div className="lg:col-span-7 bg-obsidian-950 border border-gold-900/60 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gold-300 font-cinzel uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-gold-400" />
                <span>Multi-Layer Canvas ({layers.length} Layers)</span>
              </span>
              <span className="text-[10px] text-ivory-muted hidden sm:inline">
                • Click to select & drag
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Saree Drape Contrast Matcher (Phase 7) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsSareePaletteOpen(!isSareePaletteOpen)}
                  className={`bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 border border-gold-900/60 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors ${
                    activeSareeDrape.id !== "none" ? "border-gold-400 text-gold-200 bg-gold-950/40" : ""
                  }`}
                  title="Saree / Blouse Color Matcher (చీర రంగు మ్యాచింగ్)"
                >
                  <Palette className="w-3.5 h-3.5 text-gold-400" />
                  <span className="hidden sm:inline">Saree Color</span>
                  {activeSareeDrape.id !== "none" && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-obsidian-950 shadow-sm"
                      style={{ backgroundColor: activeSareeDrape.sheen }}
                    />
                  )}
                </button>

                {isSareePaletteOpen && (
                  <div className="absolute top-full mt-2 right-0 z-30 p-3 bg-obsidian-950/95 border border-gold-500/40 rounded-2xl shadow-2xl backdrop-blur-md w-60 sm:w-64 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-gold-900/40 pb-1.5">
                      <span className="text-[11px] font-bold text-gold-300 uppercase tracking-wider flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5" />
                        <span>Kanchipuram Saree Drape</span>
                      </span>
                      <button
                        onClick={() => setIsSareePaletteOpen(false)}
                        className="text-ivory-muted hover:text-ivory p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {SAREE_DRAPES.map((drape) => (
                        <button
                          key={drape.id}
                          type="button"
                          onClick={() => {
                            setActiveSareeDrape(drape);
                            setIsSareePaletteOpen(false);
                          }}
                          className={`p-1.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                            activeSareeDrape.id === drape.id
                              ? "bg-gold-500/20 border-gold-400 text-gold-200"
                              : "bg-obsidian-900/80 border-gold-900/40 text-ivory-muted hover:border-gold-500/60"
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-gold-400/50 shrink-0"
                            style={{
                              backgroundColor: drape.id === "none" ? "#16161F" : drape.sheen,
                            }}
                          />
                          <span className="truncate text-[10px] font-medium leading-tight">
                            {drape.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {bridalSlots && (
                <button
                  onClick={handleAddAllFromBridalCombo}
                  className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-gold-glow"
                  title="Load all equipped bridal slots onto this portrait"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Wear Bridal Set</span>
                </button>
              )}

              <button
                onClick={handleExportCard}
                disabled={isExporting}
                className="bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 border border-gold-900/60 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                title="Save & Download 1080x1350 High-Definition Comparison Card"
              >
                <Download className="w-3.5 h-3.5 text-gold-400" />
                <span>Save Comparison Card</span>
              </button>
            </div>
          </div>

          {/* Interactive Canvas */}
          <div className="relative w-full max-w-xl aspect-[4/5] bg-obsidian-900 rounded-2xl overflow-hidden border border-gold-900/40 shadow-inner flex items-center justify-center select-none">
            <canvas
              ref={canvasRef}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
            />
          </div>

          <p className="text-[11px] text-ivory-muted mt-3 text-center">
            💡 Tap any ornament to select it. Drag to place on neck/ears. Use 3D Neck Curve slider to bend flat necklaces naturally.
          </p>
        </div>

        {/* Right Column: Layer Inspector & 3D Warp Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Layer Management Tray */}
          <div className="bg-obsidian-900 border border-gold-900/60 rounded-3xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-gold-900/40 pb-2">
              <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider flex items-center gap-1.5 font-cinzel">
                <Layers className="w-3.5 h-3.5" />
                <span>Active Layers ({layers.length})</span>
              </span>
              <span className="text-[10px] text-ivory-muted">Z-Index Stack</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
              {layers.map((l, idx) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLayerId(l.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedLayerId === l.id
                      ? "bg-gold-950/40 border-gold-500 text-gold-200 font-semibold shadow-md"
                      : "bg-obsidian-950/60 border-white/5 text-ivory-muted hover:text-ivory"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[10px] font-mono text-gold-400/80 w-4">
                      #{idx + 1}
                    </span>
                    <span className="truncate max-w-[170px]">{l.name}</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => bringForward(l.id)}
                      className="p-1 hover:text-gold-300"
                      title="Bring Forward"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => sendBackward(l.id)}
                      className="p-1 hover:text-gold-300"
                      title="Send Backward"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => duplicateLayer(l.id)}
                      className="p-1 hover:text-gold-300"
                      title="Duplicate & Mirror"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteLayer(l.id)}
                      className="p-1 hover:text-red-400"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Catalog Adder or Screenshot Upload */}
            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <label className="flex-1 bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 py-2 px-3 rounded-xl border border-gold-900/60 text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>+ Upload Screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleJewelryUpload}
                  className="hidden"
                />
              </label>

              {onOpenBridalDrawer && (
                <button
                  onClick={onOpenBridalDrawer}
                  className="bg-obsidian-850 hover:bg-gold-950/40 text-gold-300 py-2 px-3 rounded-xl border border-gold-900/60 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Crown className="w-3.5 h-3.5 text-gold-400" />
                  <span>Bridal Tray</span>
                </button>
              )}
            </div>

            {/* Background Removal Clean Tolerance Slider */}
            <div className="pt-2 border-t border-gold-900/40 space-y-1">
              <div className="flex justify-between text-[11px] text-ivory-muted">
                <span>Background Clean Tolerance:</span>
                <span className="font-mono text-gold-300 font-semibold">{bgTolerance}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={75}
                value={bgTolerance}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setBgTolerance(val);
                  if (rawJewelrySrc) {
                    processCustomJewelry(rawJewelrySrc, val, preserveGold);
                  }
                }}
                className="w-full h-1.5 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
              />
            </div>
          </div>

          {/* Active Layer Inspector & 3D Parabolic Neck Curve Controls */}
          {selectedLayer ? (
            <div className="bg-obsidian-900 border border-gold-500/40 rounded-3xl p-5 shadow-xl space-y-4 text-ivory animate-in fade-in">
              <div className="flex items-center justify-between border-b border-gold-900/50 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-gold-200 truncate max-w-[200px]">
                    {selectedLayer.name}
                  </h4>
                  <span className="text-[10px] text-ivory-muted">
                    Transform & 3D Perspective Controls
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => duplicateLayer(selectedLayer.id)}
                    className="p-1.5 rounded-lg border text-xs flex items-center gap-1 bg-obsidian-800 text-gold-300 border-gold-900/60 hover:border-gold-500 transition-colors"
                    title="Duplicate to Both Ears / Mirror"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate to Both Ears</span>
                  </button>

                  <button
                    onClick={() =>
                      updateSelectedLayer({ flipped: !selectedLayer.flipped })
                    }
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                      selectedLayer.flipped
                        ? "bg-gold-500 text-obsidian-950 border-gold-400"
                        : "bg-obsidian-800 text-gold-300 border-gold-900/60"
                    }`}
                    title="Horizontally Flip Ornament"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Flip</span>
                  </button>
                </div>
              </div>

              {/* 3D PARABOLIC NECK CURVE SLIDER (Feature C) */}
              <div className="bg-gold-950/20 border border-gold-500/30 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gold-300 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-gold-400" />
                    <span>3D Neck Curve Bend:</span>
                  </span>
                  <span className="font-mono text-gold-200 font-bold">
                    {selectedLayer.neckCurve > 0
                      ? `+${selectedLayer.neckCurve}°`
                      : `${selectedLayer.neckCurve}°`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-40}
                  max={40}
                  step={1}
                  value={selectedLayer.neckCurve}
                  onChange={(e) =>
                    updateSelectedLayer({ neckCurve: Number(e.target.value) })
                  }
                  className="w-full h-1.5 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
                <div className="flex justify-between text-[10px] text-ivory-muted">
                  <span>-40° Inverted</span>
                  <span>0° Flat</span>
                  <span>+40° Natural Neck Wrap</span>
                </div>
              </div>

              {/* 3D YAW / HEAD-TURN PERSPECTIVE SLIDER (Feature C) */}
              <div className="bg-obsidian-950/60 border border-gold-900/40 rounded-2xl p-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gold-300 flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-gold-400" />
                    <span>3D Yaw / Head-Turn Angle:</span>
                  </span>
                  <span className="font-mono text-gold-200">
                    {selectedLayer.yawAngle > 0
                      ? `+${selectedLayer.yawAngle}°`
                      : `${selectedLayer.yawAngle}°`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-35}
                  max={35}
                  step={1}
                  value={selectedLayer.yawAngle}
                  onChange={(e) =>
                    updateSelectedLayer({ yawAngle: Number(e.target.value) })
                  }
                  className="w-full h-1.5 bg-obsidian-900 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
                <div className="flex justify-between text-[10px] text-ivory-muted">
                  <span>-35° Turn Left</span>
                  <span>0° Frontal</span>
                  <span>+35° Turn Right</span>
                </div>
              </div>

              {/* Scale & Rotation Sliders */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-ivory-muted">
                    <span>Size / Scale:</span>
                    <span className="font-mono text-gold-300">
                      {selectedLayer.scale.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.3}
                    max={1.8}
                    step={0.05}
                    value={selectedLayer.scale}
                    onChange={(e) =>
                      updateSelectedLayer({ scale: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-ivory-muted">
                    <span>Rotation:</span>
                    <span className="font-mono text-gold-300">
                      {selectedLayer.rotation}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={2}
                    value={selectedLayer.rotation}
                    onChange={(e) =>
                      updateSelectedLayer({ rotation: parseInt(e.target.value) })
                    }
                    className="w-full h-1.5 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                </div>
              </div>

              {/* Skin Shadow & Gold Warmth */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gold-900/40">
                <div className="space-y-1">
                  <span className="text-[11px] text-ivory-muted block">
                    Skin Drop Shadow:
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={0.9}
                    step={0.05}
                    value={selectedLayer.shadowOpacity}
                    onChange={(e) =>
                      updateSelectedLayer({
                        shadowOpacity: parseFloat(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-ivory-muted block">
                    Gold Warmth:
                  </span>
                  <input
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={selectedLayer.warmth}
                    onChange={(e) =>
                      updateSelectedLayer({
                        warmth: parseFloat(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                </div>
              </div>

              {/* Dynamic Gram Morphing & Realtime Price for active layer (Phase 6) */}
              {selectedLayer.item && (() => {
                const item = selectedLayer.item;
                const currG = getLayerGrams(selectedLayer);
                const minG = item.minGrams || 20;
                const maxG = item.maxGrams || 80;
                const morphT = Math.max(0, Math.min(1, (currG - minG) / Math.max(1, maxG - minG)));
                const price = calculateGoldPrice(currG, item.purity, {
                  goldRate22K,
                  wastagePercent: item.wastagePercent,
                  makingChargePerGram: item.makingChargePerGram,
                  stoneWeightGrams: item.stoneWeightGrams || 0,
                  stoneCostFlat: item.stoneCostFlat || 0,
                }).totalEstimatedPrice;

                const note =
                  morphT < 0.35
                    ? { en: `${currG}g: Sleek Lightweight Sheet Work`, te: `${currG}g: లైట్ వెయిట్ రేకు పని` }
                    : morphT < 0.70
                    ? { en: `${currG}g: Standard Handcrafted Casting`, te: `${currG}g: మధ్యస్థ ఘన చేతిపని` }
                    : { en: `${currG}g: Solid Heavyweight Nakshi Casting`, te: `${currG}g: భారీ గట్టి నక్షి పని` };

                return (
                  <div className="pt-2 space-y-2 border-t border-gold-900/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ivory-muted">Weight &amp; Thickness:</span>
                      <span className="font-mono font-bold text-gold-300">
                        {currG}g • {formatINR(price)}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-gold-950/30 border border-gold-500/30 text-[10px] text-gold-200">
                      <span>{isTe ? note.te : note.en}</span>
                    </div>

                    <input
                      type="range"
                      min={minG}
                      max={maxG}
                      step={1}
                      value={currG}
                      onChange={(e) => handleUpdateLayerGrams(selectedLayer.id, Number(e.target.value))}
                      className="w-full h-1.5 bg-obsidian-950 rounded-lg appearance-none cursor-pointer accent-gold-500"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsFamilyVoteOpen(true)}
                        className="py-1.5 px-2 rounded-xl bg-obsidian-950 hover:bg-gold-950/40 text-gold-300 border border-gold-900/60 font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-gold-400" />
                        <span>{isTe ? "కుటుంబ ఓటు" : "Ask Family"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsSchemePlannerOpen(true)}
                        className="py-1.5 px-2 rounded-xl bg-obsidian-950 hover:bg-gold-950/40 text-gold-300 border border-gold-900/60 font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <PiggyBank className="w-3.5 h-3.5 text-gold-400" />
                        <span>{isTe ? "11+1 స్కీమ్" : "Gold Scheme"}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenCalculator(item)}
                      className="w-full bg-obsidian-950 hover:bg-gold-950/40 text-gold-300 py-2 px-3 rounded-xl border border-gold-900/60 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Full Goldsmith Breakdown for {item.name}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-obsidian-900 border border-gold-900/40 rounded-3xl p-6 text-center text-xs text-ivory-muted">
              Select any ornament layer on the canvas to adjust 3D neck curvature, yaw perspective, and size.
            </div>
          )}

          {/* Catalog Quick-Add Carousel */}
          <div className="bg-obsidian-900 border border-gold-900/60 rounded-3xl p-4 shadow-md space-y-2">
            <span className="text-xs font-semibold text-gold-300 font-cinzel uppercase tracking-wider block">
              + Add Catalog Piece to Canvas
            </span>
            <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => addLayerFromItem(item)}
                  className="shrink-0 w-20 p-1.5 rounded-xl bg-obsidian-950 hover:bg-gold-950/40 border border-gold-900/50 hover:border-gold-500 text-center transition-all"
                  title={`Add ${item.name}`}
                >
                  <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getJewelryImageUri(item)}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow"
                    />
                  </div>
                  <span className="text-[10px] text-ivory block truncate">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature C: Ask Family Poll Modal (Phase 6) */}
      {isFamilyVoteOpen && (
        <FamilyVoteModal
          isOpen={isFamilyVoteOpen}
          onClose={() => setIsFamilyVoteOpen(false)}
          optionA={{
            id: selectedLayer?.item?.id || initialItem?.id || catalog[0].id,
            name: selectedLayer?.item?.name || initialItem?.name || catalog[0].name,
            grams: selectedLayer?.item ? getLayerGrams(selectedLayer) : (initialItem?.defaultGrams || 36),
            price: Math.round(
              (selectedLayer?.item ? getLayerGrams(selectedLayer) : (initialItem?.defaultGrams || 36)) *
                goldRate22K *
                1.15
            ),
            imageSrc: selectedLayer?.item ? getJewelryImageUri(selectedLayer.item) : undefined,
          }}
          optionB={{
            id: catalog[1]?.id || "SW-HRM-104",
            name: catalog[1]?.name || "Heritage Lakshmi Kasu Haram",
            grams: catalog[1]?.defaultGrams || 56,
            price: Math.round((catalog[1]?.defaultGrams || 56) * goldRate22K * 1.15),
            imageSrc: getJewelryImageUri(catalog[1] || catalog[0]),
          }}
          showroomName={showroomName}
        />
      )}

      {/* Feature B: Gold Scheme Planner Modal (Phase 6) */}
      {isSchemePlannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-obsidian-900 border border-gold-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-ivory max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSchemePlannerOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-obsidian-950/60 hover:bg-obsidian-800 text-ivory-muted hover:text-ivory transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <GoldSchemePlanner
              item={selectedLayer?.item || initialItem || catalog[0]}
              targetGrams={selectedLayer?.item ? getLayerGrams(selectedLayer) : 40}
              goldRate22K={goldRate22K}
              showroomName={showroomName}
              onEnroll={() => setIsSchemePlannerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
