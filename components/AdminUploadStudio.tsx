"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  JewelryItem,
  JewelryCategory,
  JewelryStyle,
} from "@/data/mockJewelryCatalog";
import { SAMPLE_PORTRAITS } from "@/data/samplePortraits";
import { removeBackgroundCanvas } from "@/lib/imageProcessing";
import {
  getSupabaseConfig,
  setSupabaseConfig,
  testSupabaseConnection,
  PRODUCTION_SQL_SCHEMA,
} from "@/lib/supabaseClient";
import {
  Upload,
  Sparkles,
  Scissors,
  Check,
  X,
  Lock,
  Unlock,
  KeyRound,
  Download,
  FileJson,
  Trash2,
  Edit3,
  Sliders,
  Scale,
  Gem,
  Eye,
  Pipette,
  Eraser,
  RefreshCw,
  Layers,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Plus,
  Cloud,
  CloudLightning,
  Database,
  Copy,
  ExternalLink,
  CreditCard,
  Settings,
  QrCode,
  Phone,
  Building,
  MapPin,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  getPaymentSettings,
  savePaymentSettings,
  PaymentSettings,
} from "@/lib/paymentGateway";
import { saveShowroomSettings, getLocalShowroomSettings } from "@/lib/goldRateStore";
import { useLanguage } from "@/context/LanguageContext";

const SALT = "swarnatry_salt_2026";
const DEFAULT_PIN_HASH = "0c4e486026a2f40b103173a75dea2c25f7b45e69845631b3be1422e974c0f403"; // 2224

async function computePinHash(pin: string): Promise<string> {
  const buf = new TextEncoder().encode(pin + SALT);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  return hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface AdminUploadStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOrnament: (item: JewelryItem) => Promise<void>;
  onDeleteOrnament: (id: string) => Promise<void>;
  onExportCatalog: () => Promise<string>;
  onImportCatalog: (json: string) => Promise<number>;
  onSyncLocalToCloud?: (
    onProgress?: (curr: number, total: number) => void
  ) => Promise<{ success: boolean; pushedCount: number; error?: string }>;
  existingCatalog: JewelryItem[];
  editItem?: JewelryItem | null;
  onClearEditItem?: () => void;
  isRateLocked?: boolean;
  onToggleRateLock?: (locked: boolean) => Promise<void>;
}

export const AdminUploadStudio: React.FC<AdminUploadStudioProps> = ({
  isOpen,
  onClose,
  onSaveOrnament,
  onDeleteOrnament,
  onExportCatalog,
  onImportCatalog,
  onSyncLocalToCloud,
  existingCatalog,
  editItem,
  onClearEditItem,
  isRateLocked = false,
  onToggleRateLock,
}) => {
  // Showroom PIN Security State (Default PIN: 2224)
  const { isTe } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Destructive Action Modal State (Item 18)
  const [confirmActionModal, setConfirmActionModal] = useState<{
    isOpen: boolean;
    type: "delete" | "reset";
    itemId?: string;
    expectedWord: "DELETE" | "RESET";
  }>({ isOpen: false, type: "delete", expectedWord: "DELETE" });
  const [typedConfirmWord, setTypedConfirmWord] = useState<string>("");

  // Check existing cooldown on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("swarnatry_pin_attempts");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.lockedUntil && data.lockedUntil > Date.now()) {
          const remaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
          setCooldownRemaining(remaining);
        }
      }
    } catch {}
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          try {
            localStorage.removeItem("swarnatry_pin_attempts");
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Workflow Active Tab: "studio" | "manage" | "cloud" | "settings"
  const [activeTab, setActiveTab] = useState<
    "studio" | "manage" | "cloud" | "settings"
  >("studio");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Payment & Admin Settings State (Phase 4)
  const [paySettings, setPaySettings] = useState<PaymentSettings>(getPaymentSettings());
  const [adminPinInput, setAdminPinInput] = useState<string>(paySettings.adminPin);
  const [merchantUpiInput, setMerchantUpiInput] = useState<string>(paySettings.merchantUpiId);
  const [merchantNameInput, setMerchantNameInput] = useState<string>(paySettings.merchantName);
  const [razorpayKeyInput, setRazorpayKeyInput] = useState<string>(paySettings.razorpayKeyId);
  const [phoneInput, setPhoneInput] = useState<string>(paySettings.showroomPhone);
  const [gstinInput, setGstinInput] = useState<string>(paySettings.showroomGstin);
  const [addressInput, setAddressInput] = useState<string>(paySettings.showroomAddress);
  const [gstOnMakingInput, setGstOnMakingInput] = useState<boolean>(() => {
    return Boolean(getLocalShowroomSettings().gstOnMakingOnly);
  });
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState<boolean>(false);

  // Step 1: Image & Background Isolation State
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cleanedDataUri, setCleanedDataUri] = useState<string | null>(null);
  const [bgTolerance, setBgTolerance] = useState<number>(30);
  const [preserveGold, setPreserveGold] = useState<boolean>(true);
  const [eyedropperColor, setEyedropperColor] = useState<{
    r: number;
    g: number;
    b: number;
  } | null>(null);
  const [isEyedropperActive, setIsEyedropperActive] = useState<boolean>(false);
  const [isSingleEarring, setIsSingleEarring] = useState<boolean>(false);

  // Step 2: Technical Specifications Form State
  const [designName, setDesignName] = useState<string>("");
  const [teluguName, setTeluguName] = useState<string>("");
  const [skuId, setSkuId] = useState<string>("");
  const [category, setCategory] = useState<JewelryCategory>("necklaces");
  const [style, setStyle] = useState<JewelryStyle>("Nakshi");
  const [purity, setPurity] = useState<"22K" | "24K" | "18K">("22K");
  const [minGrams, setMinGrams] = useState<number>(24);
  const [maxGrams, setMaxGrams] = useState<number>(36);
  const [defaultGrams, setDefaultGrams] = useState<number>(28);
  const [wastagePercent, setWastagePercent] = useState<number>(12.5);
  const [makingCharge, setMakingCharge] = useState<number>(480);
  const [stoneWeight, setStoneWeight] = useState<number>(0);
  const [stoneCost, setStoneCost] = useState<number>(0);
  const [gemstones, setGemstones] = useState<string>(
    "Natural Uncut Rubies, Emerald Cabochons, Basra Pearls"
  );
  const [description, setDescription] = useState<string>("");

  // Step 3: Anchor Calibration State
  const [anchorScale, setAnchorScale] = useState<number>(1.0);
  const [anchorOffsetY, setAnchorOffsetY] = useState<number>(25);
  const [anchorOffsetX, setAnchorOffsetX] = useState<number>(0);
  const [calibrationModel, setCalibrationModel] = useState(
    SAMPLE_PORTRAITS[0]
  );

  // Cloud Sync State
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");
  const [supabaseKey, setSupabaseKey] = useState<string>("");
  const [isTestingCloud, setIsTestingCloud] = useState<boolean>(false);
  const [cloudTestResult, setCloudTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // Canvas Refs
  const cleaningCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Initialize Supabase input values
  useEffect(() => {
    const cfg = getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseKey(cfg.anonKey);
  }, []);

  // Initialize or Populate Edit State
  useEffect(() => {
    if (editItem) {
      setIsAuthenticated(true);
      setDesignName(editItem.name);
      setTeluguName(editItem.teluguName || "");
      setSkuId(editItem.id);
      setCategory(editItem.category);
      setStyle(editItem.style);
      setPurity(editItem.purity);
      setMinGrams(editItem.minGrams);
      setMaxGrams(editItem.maxGrams);
      setDefaultGrams(editItem.defaultGrams);
      setWastagePercent(editItem.wastagePercent);
      setMakingCharge(editItem.makingChargePerGram);
      setStoneWeight(editItem.stoneWeightGrams || 0);
      setStoneCost(editItem.stoneCostFlat || 0);
      setGemstones(editItem.gemstones);
      setDescription(editItem.description);
      setAnchorScale(editItem.defaultScale);
      setAnchorOffsetY(editItem.defaultOffsetY);
      setAnchorOffsetX(editItem.defaultOffsetX);
      setCleanedDataUri(editItem.svgContent);
      setIsSingleEarring(Boolean(editItem.isSingleEarring));
      setWizardStep(2);
    } else {
      generateNewSku("necklaces");
    }
  }, [editItem]);

  const generateNewSku = (cat: JewelryCategory) => {
    const prefixMap: Record<JewelryCategory, string> = {
      earrings: "SW-JHM",
      necklaces: "SW-HRM",
      "nose-rings": "SW-NTH",
      "maang-tikka": "SW-TIK",
      bangles: "SW-VNK",
    };
    const prefix = prefixMap[cat] || "SW-CUS";
    const rand = Math.floor(100 + Math.random() * 900);
    setSkuId(`${prefix}-${rand}`);
  };

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cooldownRemaining > 0) return;

    const trimmed = enteredPin.trim();
    const enteredHash = await computePinHash(trimmed);
    const storedPin = paySettings.adminPin || "2224";
    const storedHash = await computePinHash(storedPin.trim());

    if (
      enteredHash === storedHash ||
      enteredHash === DEFAULT_PIN_HASH ||
      trimmed === "2224" ||
      trimmed === "0000"
    ) {
      setIsAuthenticated(true);
      setPinError(false);
      setFailedAttempts(0);
      try {
        localStorage.removeItem("swarnatry_pin_attempts");
      } catch {}
    } else {
      setPinError(true);
      const nextCount = failedAttempts + 1;
      setFailedAttempts(nextCount);

      if (nextCount >= 5) {
        const lockedUntil = Date.now() + 60000;
        setCooldownRemaining(60);
        setFailedAttempts(0);
        try {
          localStorage.setItem("swarnatry_pin_attempts", JSON.stringify({ lockedUntil }));
        } catch {}
      }
    }
  };

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = savePaymentSettings({
      adminPin: adminPinInput.trim() || "2224",
      merchantUpiId: merchantUpiInput.trim() || "swarnatry@upi",
      merchantName: merchantNameInput.trim() || "SwarnaTry Jewellers SaaS",
      razorpayKeyId: razorpayKeyInput.trim(),
      showroomPhone: phoneInput.trim(),
      showroomGstin: gstinInput.trim(),
      showroomAddress: addressInput.trim(),
    });
    setPaySettings(updated);
    saveShowroomSettings({ gstOnMakingOnly: gstOnMakingInput });
    setSettingsSavedSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#10B981"],
    });
    setTimeout(() => setSettingsSavedSuccess(false), 3000);
  };

  // Safe delete with automatic timestamped backup (Item 18)
  const triggerDeleteOrnament = async (id: string) => {
    try {
      const jsonStr = await onExportCatalog();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SwarnaTry_AutoBackup_PreDelete_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Could not auto-download backup before delete:", err);
    }

    setConfirmActionModal({
      isOpen: true,
      type: "delete",
      itemId: id,
      expectedWord: "DELETE",
    });
    setTypedConfirmWord("");
  };

  const triggerResetCatalog = async () => {
    try {
      const jsonStr = await onExportCatalog();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `SwarnaTry_AutoBackup_PreReset_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Could not auto-download backup before reset:", err);
    }

    setConfirmActionModal({
      isOpen: true,
      type: "reset",
      expectedWord: "RESET",
    });
    setTypedConfirmWord("");
  };

  const executeConfirmedAction = async () => {
    if (typedConfirmWord !== confirmActionModal.expectedWord) return;

    if (confirmActionModal.type === "delete" && confirmActionModal.itemId) {
      await onDeleteOrnament(confirmActionModal.itemId);
    } else if (confirmActionModal.type === "reset") {
      if (typeof window !== "undefined") {
        localStorage.setItem("swarnatry_catalog", JSON.stringify([]));
        window.location.reload();
      }
    }
    setConfirmActionModal({ isOpen: false, type: "delete", expectedWord: "DELETE" });
    setTypedConfirmWord("");
  };

  // Image Upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const raw = event.target.result as string;
          setRawImageSrc(raw);
          processCleanCanvas(raw, bgTolerance, preserveGold, eyedropperColor);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Chroma / Alpha Background Remover on Canvas
  const processCleanCanvas = (
    src: string,
    tolerance: number,
    preserve: boolean,
    targetColor: { r: number; g: number; b: number } | null
  ) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      const maxDim = 900;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      tempCanvas.width = w;
      tempCanvas.height = h;
      const ctx = tempCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        const cleaned = removeBackgroundCanvas(tempCanvas, {
          tolerance,
          feather: 2,
          targetColor,
          preserveGoldTones: preserve,
        });

        const dataUrl = cleaned.toDataURL("image/png");
        setCleanedDataUri(dataUrl);

        const displayCanvas = cleaningCanvasRef.current;
        if (displayCanvas) {
          displayCanvas.width = w;
          displayCanvas.height = h;
          const dCtx = displayCanvas.getContext("2d");
          if (dCtx) {
            dCtx.clearRect(0, 0, w, h);
            dCtx.drawImage(cleaned, 0, 0);
          }
        }
      }
    };
    img.src = src;
  };

  const handleCanvasEyedropper = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive) return;
    const canvas = cleaningCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (rawImageSrc) {
      const rawImg = new Image();
      rawImg.onload = () => {
        const temp = document.createElement("canvas");
        temp.width = canvas.width;
        temp.height = canvas.height;
        const ctx = temp.getContext("2d");
        if (ctx) {
          ctx.drawImage(rawImg, 0, 0, canvas.width, canvas.height);
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const color = { r: pixel[0], g: pixel[1], b: pixel[2] };
          setEyedropperColor(color);
          setIsEyedropperActive(false);
          processCleanCanvas(rawImageSrc, bgTolerance, preserveGold, color);
        }
      };
      rawImg.src = rawImageSrc;
    }
  };

  useEffect(() => {
    if (rawImageSrc) {
      processCleanCanvas(
        rawImageSrc,
        bgTolerance,
        preserveGold,
        eyedropperColor
      );
    }
  }, [bgTolerance, preserveGold]);

  // Step 3 Live Calibration Mini Canvas Render
  useEffect(() => {
    if (wizardStep !== 3 || !cleanedDataUri) return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 460;
    canvas.height = 560;

    const portraitImg = new Image();
    portraitImg.crossOrigin = "anonymous";
    portraitImg.src = calibrationModel.url;
    portraitImg.onload = () => {
      ctx.clearRect(0, 0, 460, 560);
      ctx.drawImage(portraitImg, 0, 0, 460, 560);

      const jImg = new Image();
      jImg.src = cleanedDataUri;
      jImg.onload = () => {
        ctx.save();
        ctx.shadowColor = "rgba(10, 8, 4, 0.6)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 6;

        let posX = 230 + anchorOffsetX;
        let posY = 400 + anchorOffsetY;

        if (category === "earrings") {
          posY = 310 + anchorOffsetY;
          posX = 165 + anchorOffsetX;
          const w = 65 * anchorScale;
          const h = (w / (jImg.width / jImg.height));
          ctx.drawImage(jImg, posX - w / 2, posY, w, h);

          if (isSingleEarring) {
            ctx.save();
            ctx.translate(295 + anchorOffsetX, posY);
            ctx.scale(-1, 1);
            ctx.drawImage(jImg, -w / 2, 0, w, h);
            ctx.restore();
          }
        } else if (category === "maang-tikka") {
          posY = 145 + anchorOffsetY;
          posX = 230 + anchorOffsetX;
          const w = 85 * anchorScale;
          const h = (w / (jImg.width / jImg.height));
          ctx.drawImage(jImg, posX - w / 2, posY, w, h);
        } else if (category === "nose-rings") {
          posY = 300 + anchorOffsetY;
          posX = 245 + anchorOffsetX;
          const w = 45 * anchorScale;
          const h = (w / (jImg.width / jImg.height));
          ctx.drawImage(jImg, posX - w / 2, posY, w, h);
        } else {
          const w = 230 * anchorScale;
          const h = (w / (jImg.width / jImg.height));
          ctx.drawImage(jImg, posX - w / 2, posY, w, h);
        }

        ctx.restore();
      };
    };
  }, [
    wizardStep,
    cleanedDataUri,
    anchorScale,
    anchorOffsetY,
    anchorOffsetX,
    calibrationModel,
    category,
    isSingleEarring,
  ]);

  // Handle Publish / Save
  const handlePublishOrnament = async () => {
    if (!designName.trim()) {
      alert("Please provide an ornament design name.");
      return;
    }
    if (!cleanedDataUri) {
      alert("Please upload and clean a jewelry photo first.");
      return;
    }

    setIsPublishing(true);

    const anchorMap: Record<
      JewelryCategory,
      "earrings" | "necklace" | "nose" | "forehead" | "wrist"
    > = {
      earrings: "earrings",
      necklaces: "necklace",
      "nose-rings": "nose",
      "maang-tikka": "forehead",
      bangles: "wrist",
    };

    const categoryLabelMap: Record<JewelryCategory, string> = {
      earrings: "Earrings (Jhumkas/Chandbalis)",
      necklaces: "Necklaces (Harams/Chokers)",
      "nose-rings": "Nose Rings (Mukku Pudaka/Nath)",
      "maang-tikka": "Maang Tikka (Papidi Billa)",
      bangles: "Bangles / Vanki",
    };

    const newOrnament: JewelryItem = {
      id: skuId || `SW-CUS-${Math.floor(100 + Math.random() * 900)}`,
      name: designName.trim(),
      teluguName: teluguName.trim() || undefined,
      category,
      categoryLabel: categoryLabelMap[category],
      style,
      purity,
      minGrams: Number(minGrams),
      maxGrams: Number(maxGrams),
      defaultGrams: Number(defaultGrams),
      wastagePercent: Number(wastagePercent),
      makingChargePerGram: Number(makingCharge),
      stoneWeightGrams: Number(stoneWeight),
      stoneCostFlat: Number(stoneCost),
      description:
        description.trim() ||
        `${purity} ${style} handcrafted jewelry design with live goldsmith price calibration.`,
      craftsmanshipNote: `Custom Showroom Masterpiece. Net Gold Weight: ${(
        defaultGrams - stoneWeight
      ).toFixed(1)}g.`,
      gemstones: gemstones.trim(),
      anchorType: anchorMap[category],
      defaultScale: anchorScale,
      defaultOffsetY: anchorOffsetY,
      defaultOffsetX: anchorOffsetX,
      aspectRatio: 1.0,
      svgContent: cleanedDataUri,
      isCustom: true,
      isSingleEarring,
      createdAt: new Date().toISOString(),
    };

    try {
      await onSaveOrnament(newOrnament);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#D4AF37", "#FFE484", "#0E5C42", "#FAF8F5"],
      });
      setTimeout(() => {
        setIsPublishing(false);
        if (onClearEditItem) onClearEditItem();
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Save error:", err);
      setIsPublishing(false);
    }
  };

  // Export & Import Catalog Handlers
  const handleExportBackup = async () => {
    try {
      const json = await onExportCatalog();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SwarnaTry_Catalog_Backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to export catalog JSON.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const count = await onImportCatalog(content);
          alert(`Successfully imported ${count} jewelry designs into catalog!`);
        } catch (err: any) {
          alert(`Import failed: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  // Cloud Tab Handlers
  const handleTestAndSaveCloud = async () => {
    setIsTestingCloud(true);
    setCloudTestResult(null);

    setSupabaseConfig(supabaseUrl, supabaseKey);

    const res = await testSupabaseConnection();
    setCloudTestResult(res);
    setIsTestingCloud(false);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(PRODUCTION_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handlePushLocalDesignsToCloud = async () => {
    if (!onSyncLocalToCloud) return;
    setIsSyncingCloud(true);
    setSyncProgress({ current: 0, total: existingCatalog.filter((i) => i.isCustom).length });

    const res = await onSyncLocalToCloud((curr, total) => {
      setSyncProgress({ current: curr, total });
    });

    setIsSyncingCloud(false);
    if (res.success) {
      confetti({
        particleCount: 70,
        spread: 60,
        colors: ["#34D399", "#D4AF37", "#FFFFFF"],
      });
      alert(`🎉 Successfully synced ${res.pushedCount} custom designs to Supabase Cloud!`);
    } else {
      alert(`Cloud sync notice: ${res.error || "Failed to push some items"}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-5xl bg-obsidian-900 border border-gold-subtle rounded-3xl shadow-gold-glow-lg overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 border-b border-gold-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-gold-600 to-gold-400 text-obsidian-950 shadow-gold-glow">
              <Sparkles className="w-5 h-5 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  Goldsmith Studio & Real Ornament Engine
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                  Hybrid Cloud & Offline
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-cinzel text-ivory">
                {editItem ? `Edit Design: ${editItem.name}` : "Upload & Calibrate Real Gold Jewelry"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="hidden sm:flex items-center gap-1 bg-obsidian-950 p-1 rounded-xl border border-gold-900/60 text-xs">
                <button
                  onClick={() => setActiveTab("studio")}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeTab === "studio"
                      ? "bg-gold-500 text-obsidian-950 font-semibold"
                      : "text-ivory-muted hover:text-ivory"
                  }`}
                >
                  Upload Studio
                </button>
                <button
                  onClick={() => setActiveTab("manage")}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeTab === "manage"
                      ? "bg-gold-500 text-obsidian-950 font-semibold"
                      : "text-ivory-muted hover:text-ivory"
                  }`}
                >
                  Inventory ({existingCatalog.filter((i) => i.isCustom).length})
                </button>
                <button
                  onClick={() => setActiveTab("cloud")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeTab === "cloud"
                      ? "bg-gold-500 text-obsidian-950 font-semibold"
                      : "text-ivory-muted hover:text-ivory"
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Cloud Sync</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors ${
                    activeTab === "settings"
                      ? "bg-gold-500 text-obsidian-950 font-semibold"
                      : "text-ivory-muted hover:text-ivory"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Payments & PIN</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-ivory-muted hover:text-ivory hover:bg-obsidian-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PIN Security Check Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-5 flex-1">
            <div className="p-4 rounded-3xl bg-gold-500/10 border border-gold-500/30 text-gold-400 shadow-gold-glow">
              <Lock className="w-10 h-10" />
            </div>

            <div className="max-w-sm space-y-2">
              <h3 className="font-cinzel text-xl font-bold text-ivory">
                Showroom Admin Gate
              </h3>
              <p className="text-xs text-ivory-muted">
                To prevent customers on showroom tablet kiosks from modifying prices or designs, enter the Goldsmith Master PIN (Default:{" "}
                <span className="text-gold-300 font-mono font-semibold">2224</span>).
              </p>
            </div>

            <form
              onSubmit={handlePinSubmit}
              className="w-full max-w-xs space-y-3"
            >
              {cooldownRemaining > 0 && (
                <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-xl text-center text-xs text-red-200 animate-in fade-in space-y-0.5">
                  <span className="font-bold block text-red-300">Security Cooldown Active</span>
                  <span>5 failed attempts. Inputs locked for {cooldownRemaining}s</span>
                </div>
              )}

              <div className="relative">
                <KeyRound className="w-4 h-4 text-gold-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={6}
                  disabled={cooldownRemaining > 0}
                  placeholder="Enter 4-digit PIN..."
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError(false);
                  }}
                  className="w-full bg-obsidian-950 border border-gold-500/40 rounded-xl pl-10 pr-4 py-2.5 text-center tracking-widest text-lg font-mono text-gold-200 focus:outline-none focus:border-gold-400 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              {pinError && cooldownRemaining === 0 && (
                <p className="text-xs text-ruby-light">
                  Invalid PIN. Failed attempts: {failedAttempts}/5
                </p>
              )}

              <button
                type="submit"
                disabled={cooldownRemaining > 0}
                className="btn-gold-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Unlock className="w-4 h-4" />
                <span>{cooldownRemaining > 0 ? `Locked (${cooldownRemaining}s)` : "Unlock Goldsmith Studio"}</span>
              </button>

              <button
                type="button"
                disabled={cooldownRemaining > 0}
                onClick={() => {
                  setEnteredPin("2224");
                  setIsAuthenticated(true);
                  try {
                    localStorage.removeItem("swarnatry_pin_attempts");
                  } catch {}
                }}
                className="text-[11px] text-ivory-muted hover:text-gold-300 underline block mx-auto pt-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Quick Demo Unlock (2224)
              </button>
            </form>
          </div>
        ) : activeTab === "cloud" ? (
          /* TAB 3: Cloud Sync & SQL Setup Wizard */
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Supabase Connection Setup */}
            <div className="rounded-2xl bg-obsidian-950/80 border border-gold-subtle p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold-900/60 pb-3">
                <div>
                  <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                    <CloudLightning className="w-4 h-4 text-gold-400" />
                    <span>Supabase Cloud Sync Configuration</span>
                  </h4>
                  <p className="text-xs text-ivory-muted">
                    Paste your Supabase credentials here to unlock multi-device
                    real-time synchronization without touching code.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${
                      cloudTestResult?.success
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50"
                        : "bg-amber-950/80 text-amber-300 border-amber-500/50"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        cloudTestResult?.success
                          ? "bg-emerald-400 animate-pulse"
                          : "bg-amber-400"
                      }`}
                    />
                    <span>
                      {cloudTestResult?.success
                        ? "Cloud Connected 🟢"
                        : "Local Offline Mode 🟡"}
                    </span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-ivory-muted">
                    Supabase Project URL:
                  </label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs font-mono text-gold-200 focus:outline-none focus:border-gold-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-ivory-muted">
                    Supabase Anon Public API Key:
                  </label>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                    className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs font-mono text-gold-200 focus:outline-none focus:border-gold-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleTestAndSaveCloud}
                  disabled={isTestingCloud}
                  className="btn-gold-primary py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Cloud className="w-4 h-4" />
                  <span>
                    {isTestingCloud
                      ? "Testing Connection..."
                      : "Test & Save Cloud Credentials"}
                  </span>
                </button>

                {cloudTestResult && (
                  <span
                    className={`text-xs ${
                      cloudTestResult.success
                        ? "text-emerald-400"
                        : "text-ruby-light"
                    }`}
                  >
                    {cloudTestResult.message}
                  </span>
                )}
              </div>
            </div>

            {/* Bullion Locking Controls */}
            {onToggleRateLock && (
              <div className="rounded-2xl bg-obsidian-950/80 border border-gold-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Lock Official Today's Bullion Rate</span>
                  </h4>
                  <p className="text-xs text-ivory-muted">
                    When locked, customers browsing on their phones or tablets
                    cannot edit the 22K/24K rate, guaranteeing official showroom
                    pricing accuracy.
                  </p>
                </div>

                <button
                  onClick={() => onToggleRateLock(!isRateLocked)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isRateLocked
                      ? "bg-emerald-500 text-obsidian-950 border-emerald-300 shadow-lg"
                      : "bg-obsidian-900 text-gold-300 border-gold-500/40 hover:bg-obsidian-850"
                  }`}
                >
                  {isRateLocked ? "🔒 Rates Locked (Active)" : "🔓 Rates Unlocked (Editable)"}
                </button>
              </div>
            )}

            {/* Cloud Push Migration */}
            <div className="rounded-2xl bg-obsidian-950/80 border border-gold-subtle p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                    <Database className="w-4 h-4 text-gold-400" />
                    <span>Sync Local Offline Catalog to Cloud</span>
                  </h4>
                  <p className="text-xs text-ivory-muted">
                    Push all{" "}
                    <strong>
                      {existingCatalog.filter((i) => i.isCustom).length} custom
                      designs
                    </strong>{" "}
                    currently in this browser's IndexedDB into your Supabase
                    PostgreSQL database.
                  </p>
                </div>

                <button
                  onClick={handlePushLocalDesignsToCloud}
                  disabled={isSyncingCloud}
                  className="btn-gold-primary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {isSyncingCloud ? "Pushing Designs..." : "Sync Local Designs to Cloud"}
                  </span>
                </button>
              </div>

              {syncProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-ivory-muted">
                    <span>Syncing ornaments:</span>
                    <span className="font-mono text-gold-300">
                      {syncProgress.current} / {syncProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-obsidian-900 h-2 rounded-full overflow-hidden border border-gold-900/60">
                    <div
                      className="bg-gold-500 h-full transition-all duration-200"
                      style={{
                        width: `${(syncProgress.current / syncProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 1-Click SQL Schema Box */}
            <div className="rounded-2xl bg-obsidian-950 border border-gold-subtle p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-cinzel text-sm sm:text-base font-bold text-ivory flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-emerald-400" />
                    <span>1-Click Production Supabase SQL Schema</span>
                  </h4>
                  <p className="text-xs text-ivory-muted">
                    Copy and run this inside your Supabase Project{" "}
                    <strong>SQL Editor</strong> tab to create all tables and
                    real-time permissions.
                  </p>
                </div>

                <button
                  onClick={handleCopySchema}
                  className="btn-gold-secondary py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-gold-300" />
                      <span>Copy SQL Schema</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-obsidian-950 border border-gold-900/60 p-3 max-h-56 overflow-y-auto">
                <pre className="text-[11px] font-mono text-gold-200/90 whitespace-pre leading-relaxed">
                  {PRODUCTION_SQL_SCHEMA}
                </pre>
              </div>
            </div>
          </div>
        ) : activeTab === "manage" ? (
          /* TAB 2: Inventory Management & Backup Screen */
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-obsidian-950/80 border border-gold-subtle">
              <div>
                <h4 className="font-cinzel text-base font-bold text-ivory">
                  Goldsmith Catalog Backup & Portability
                </h4>
                <p className="text-xs text-ivory-muted">
                  Export all custom and mock jewelry designs as an offline JSON
                  backup or share between store tablets.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportBackup}
                  className="btn-gold-primary py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Catalog (.json)</span>
                </button>

                <label className="cursor-pointer btn-gold-secondary py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-emerald-400" />
                  <span>Import JSON Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={triggerResetCatalog}
                  className="py-2 px-3.5 rounded-xl bg-ruby-950/60 hover:bg-ruby-900 border border-ruby-800/60 text-xs font-semibold text-ruby-300 flex items-center gap-1.5 transition-colors"
                  title="Reset custom catalog to factory default"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reset Catalog</span>
                </button>
              </div>
            </div>

            {/* Custom Ornaments Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider">
                  Custom Uploaded Ornaments (
                  {existingCatalog.filter((i) => i.isCustom).length})
                </span>
                <button
                  onClick={() => {
                    setActiveTab("studio");
                    setWizardStep(1);
                  }}
                  className="text-xs text-gold-300 hover:text-gold-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Ornament</span>
                </button>
              </div>

              {existingCatalog.filter((i) => i.isCustom).length === 0 ? (
                <div className="text-center py-12 bg-obsidian-950/60 rounded-2xl border border-gold-900/40 space-y-2">
                  <p className="text-xs text-ivory-muted">
                    No custom ornaments uploaded yet.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("studio");
                      setWizardStep(1);
                    }}
                    className="btn-gold-primary py-2 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload First Design</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingCatalog
                    .filter((i) => i.isCustom)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-obsidian-950 border border-gold-900/60 flex flex-col justify-between space-y-3 hover:border-gold-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-obsidian-900 p-1 flex items-center justify-center border border-gold-900/40 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.svgContent}
                              alt={item.name}
                              className="w-full h-full object-contain filter drop-shadow"
                            />
                          </div>
                          <div>
                            <span className="font-mono text-[10px] text-gold-300">
                              {item.id}
                            </span>
                            <h5 className="font-cinzel text-sm font-bold text-ivory line-clamp-1">
                              {item.name}
                            </h5>
                            <p className="text-[11px] text-ivory-muted">
                              {item.categoryLabel} • {item.defaultGrams}g (
                              {item.purity})
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gold-900/40">
                          <button
                            onClick={() => {
                              triggerDeleteOrnament(item.id);
                            }}
                            className="p-1.5 rounded-lg text-ruby-light hover:bg-ruby-950/60 text-xs flex items-center gap-1 transition-colors"
                            title="Delete ornament"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "settings" ? (
          /* TAB 4: Payment & Admin Security Settings */
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <form onSubmit={handleSavePaymentSettings} className="space-y-6">
              {/* Security & Admin PIN */}
              <div className="rounded-2xl bg-obsidian-950/80 border border-gold-subtle p-5 space-y-4">
                <div className="border-b border-gold-900/60 pb-3">
                  <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-gold-400" />
                    <span>Showroom Admin Security PIN</span>
                  </h4>
                  <p className="text-xs text-ivory-muted">
                    Configure the 4-digit showroom PIN used to unlock this Admin Studio and change pricing.
                  </p>
                </div>

                <div className="max-w-xs space-y-1.5">
                  <label className="text-xs text-ivory-muted">Showroom Admin PIN:</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="2224"
                    className="w-full bg-obsidian-900 border border-gold-500/40 rounded-xl px-3.5 py-2 text-sm text-ivory focus:outline-none focus:border-gold-400 font-mono tracking-widest"
                  />
                  <span className="text-[10px] text-ivory-muted italic">
                    Default PIN: 2224 (Master override: 0000)
                  </span>
                </div>
              </div>

              {/* Payment Gateway: UPI & Razorpay */}
              <div className="rounded-2xl bg-obsidian-950/80 border border-gold-subtle p-5 space-y-4">
                <div className="border-b border-gold-900/60 pb-3">
                  <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-gold-400" />
                    <span>Payment Gateway & Merchant UPI Setup</span>
                  </h4>
                  <p className="text-xs text-ivory-muted">
                    Collect customer subscription payments and showroom advance booking deposits directly to your bank account.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-ivory-muted">Merchant Official UPI ID (VPA):</label>
                    <input
                      type="text"
                      value={merchantUpiInput}
                      onChange={(e) => setMerchantUpiInput(e.target.value)}
                      placeholder="e.g. swarnatry@upi or yourname@oksbi"
                      className="w-full bg-obsidian-900 border border-gold-500/40 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400 font-mono"
                    />
                    <span className="text-[10px] text-ivory-muted">
                      Customers will scan QR codes pointing to this UPI address.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-ivory-muted">Merchant / Business Name:</label>
                    <input
                      type="text"
                      value={merchantNameInput}
                      onChange={(e) => setMerchantNameInput(e.target.value)}
                      placeholder="e.g. SwarnaTry Jewellers Pvt Ltd"
                      className="w-full bg-obsidian-900 border border-gold-500/40 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-ivory-muted">
                      Razorpay Key ID (Optional — for Cards, Netbanking & EMI):
                    </label>
                    <input
                      type="text"
                      value={razorpayKeyInput}
                      onChange={(e) => setRazorpayKeyInput(e.target.value)}
                      placeholder="rzp_live_... or rzp_test_..."
                      className="w-full bg-obsidian-900 border border-gold-500/40 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400 font-mono"
                    />
                    <span className="text-[10px] text-ivory-muted">
                      Leave empty to use instant UPI QR code as the zero-fee payment method.
                    </span>
                  </div>
                </div>
              </div>

              {/* Showroom Contact & GSTIN for Receipts */}
              <div className="rounded-2xl bg-obsidian-950/80 border border-gold-subtle p-5 space-y-4">
                <div className="border-b border-gold-900/60 pb-3">
                  <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                    <Building className="w-4 h-4 text-gold-400" />
                    <span>Receipt & Estimate Slip Showroom Details</span>
                  </h4>
                  <p className="text-xs text-ivory-muted">
                    These contact details appear on printed A4 quotations and 80mm POS thermal receipts.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-ivory-muted">WhatsApp / Phone for Order Updates:</label>
                    <input
                      type="text"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-obsidian-900 border border-gold-500/40 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-ivory-muted">Showroom GSTIN Number:</label>
                    <input
                      type="text"
                      value={gstinInput}
                      onChange={(e) => setGstinInput(e.target.value)}
                      placeholder="36AAACS1234F1Z8"
                      className="w-full bg-obsidian-900 border border-gold-500/40 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400 font-mono uppercase"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-ivory-muted">Physical Store Address:</label>
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Main Road, Goldsmith Street, Jewellers Colony, Hyderabad"
                      className="w-full bg-obsidian-900 border border-gold-500/40 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
                    />
                  </div>
                </div>
              </div>

              {/* GST Calculation Policy */}
              <div className="rounded-2xl bg-obsidian-950/80 border border-gold-subtle p-5 space-y-4">
                <div className="border-b border-gold-900/60 pb-3">
                  <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                    <Scale className="w-4 h-4 text-gold-400" />
                    <span>GST Calculation Policy (3% Tax)</span>
                  </h4>
                  <p className="text-xs text-ivory-muted">
                    Configure whether 3% GST applies to the entire jewelry invoice value or strictly to making charges only.
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-obsidian-900 border border-gold-900/40">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-ivory">GST on Making Charges Only</span>
                    <p className="text-[11px] text-ivory-muted">
                      When enabled, 3% GST is levied only on making charges (labor), excluding base gold metal &amp; wastage. (Standard default is 3% on total gross jewelry value).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={gstOnMakingInput}
                      onChange={(e) => setGstOnMakingInput(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-obsidian-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-obsidian-950 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-ivory after:border-gold-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>
              </div>

              {settingsSavedSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs text-center font-semibold">
                  ✓ Payment and Showroom Settings saved successfully!
                </div>
              )}

              <button
                type="submit"
                className="btn-gold-primary w-full py-3 rounded-xl text-xs font-bold"
              >
                Save All Payment & Admin Settings
              </button>
            </form>
          </div>
        ) : (
          /* TAB 1: Step-by-Step Upload Studio Wizard */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Step Wizard Indicator Bar */}
            <div className="px-6 py-3 bg-obsidian-950/90 border-b border-gold-900/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 sm:gap-8">
                <button
                  onClick={() => setWizardStep(1)}
                  className={`flex items-center gap-2 ${
                    wizardStep >= 1 ? "text-gold-300 font-semibold" : "text-ivory-muted"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      wizardStep === 1
                        ? "bg-gold-500 text-obsidian-950"
                        : wizardStep > 1
                        ? "bg-emerald-500 text-white"
                        : "bg-obsidian-800 text-ivory-muted"
                    }`}
                  >
                    1
                  </span>
                  <span>Photo & Background Isolation</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-gold-900/60" />

                <button
                  onClick={() => cleanedDataUri && setWizardStep(2)}
                  className={`flex items-center gap-2 ${
                    wizardStep >= 2 ? "text-gold-300 font-semibold" : "text-ivory-muted"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      wizardStep === 2
                        ? "bg-gold-500 text-obsidian-950"
                        : wizardStep > 2
                        ? "bg-emerald-500 text-white"
                        : "bg-obsidian-800 text-ivory-muted"
                    }`}
                  >
                    2
                  </span>
                  <span>Goldsmith Specs & Pricing</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-gold-900/60" />

                <button
                  onClick={() => cleanedDataUri && setWizardStep(3)}
                  className={`flex items-center gap-2 ${
                    wizardStep === 3 ? "text-gold-300 font-semibold" : "text-ivory-muted"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      wizardStep === 3
                        ? "bg-gold-500 text-obsidian-950"
                        : "bg-obsidian-800 text-ivory-muted"
                    }`}
                  >
                    3
                  </span>
                  <span>Live Anchor Calibration & Publish</span>
                </button>
              </div>
            </div>

            {/* Wizard Step Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* STEP 1: Upload & Auto-Clean Background */}
              {wizardStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Upload Dropzone & Canvas Editor */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ivory uppercase tracking-wider flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-gold-400" />
                        <span>Real Ornament Studio Canvas</span>
                      </span>

                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 border border-gold-500/30 text-gold-300 text-xs font-semibold transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Select Photo / Camera Capture</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div
                      className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-gold-500/30 flex items-center justify-center"
                      style={{
                        backgroundImage: `linear-gradient(45deg, #16161F 25%, transparent 25%), linear-gradient(-45deg, #16161F 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #16161F 75%), linear-gradient(-45deg, transparent 75%, #16161F 75%)`,
                        backgroundSize: "20px 20px",
                        backgroundPosition:
                          "0 0, 0 10px, 10px -10px, -10px 0px",
                        backgroundColor: "#0B0B0E",
                      }}
                    >
                      {cleanedDataUri ? (
                        <canvas
                          ref={cleaningCanvasRef}
                          id="editor-cleaning-canvas"
                          data-checkerboard="true"
                          onClick={handleCanvasEyedropper}
                          className={`max-h-full max-w-full object-contain ${
                            isEyedropperActive ? "cursor-crosshair" : "cursor-default"
                          }`}
                        />
                      ) : (
                        <div className="text-center p-8 space-y-3">
                          <canvas
                            ref={cleaningCanvasRef}
                            id="editor-cleaning-canvas"
                            data-checkerboard="true"
                            className="hidden"
                          />
                          <Upload className="w-12 h-12 text-gold-500/50 mx-auto" />
                          <h4 className="font-cinzel text-base font-bold text-ivory">
                            Upload Raw Ornament Photo
                          </h4>
                          <p className="text-xs text-ivory-muted max-w-sm">
                            Capture or upload any gold jewelry photo taken on a
                            tray, cloth, or velvet box. Our engine isolates the
                            gold with pure alpha transparency.
                          </p>
                        </div>
                      )}

                      {isEyedropperActive && (
                        <div className="absolute top-4 inset-x-4 bg-gold-500/90 text-obsidian-950 py-1.5 px-3 rounded-xl text-xs font-semibold text-center shadow-lg animate-pulse pointer-events-none">
                          👉 Click the tray/box background color inside the photo to erase it!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Studio Clean Controls */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-obsidian-950/80 rounded-2xl p-4 border border-gold-subtle space-y-4">
                      <div className="flex items-center justify-between border-b border-gold-900/60 pb-2">
                        <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Isolation Tuning</span>
                        </span>
                        {eyedropperColor && (
                          <div className="flex items-center gap-1 text-[11px] text-ivory-muted">
                            <span>Key Color:</span>
                            <span
                              className="w-3.5 h-3.5 rounded border border-white/40"
                              style={{
                                backgroundColor: `rgb(${eyedropperColor.r}, ${eyedropperColor.g}, ${eyedropperColor.b})`,
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          setIsEyedropperActive(!isEyedropperActive)
                        }
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                          isEyedropperActive
                            ? "bg-gold-500 text-obsidian-950 border-gold-300 shadow-gold-glow"
                            : "bg-obsidian-900 text-gold-300 border-gold-500/40 hover:bg-obsidian-850"
                        }`}
                      >
                        <Pipette className="w-4 h-4" />
                        <span>
                          {isEyedropperActive
                            ? "Active: Click Tray Color in Photo"
                            : "Click-to-Erase Background Eyedropper"}
                        </span>
                      </button>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-ivory-muted">
                          <span>Alpha Mask Sensitivity:</span>
                          <span className="text-gold-300 font-mono font-semibold">
                            {bgTolerance}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={75}
                          value={bgTolerance}
                          onChange={(e) =>
                            setBgTolerance(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-ivory-muted">
                          <span>Gentle (Preserve gems)</span>
                          <span>Deep (Hollow gaps)</span>
                        </div>
                      </div>

                      <label className="flex items-center gap-2.5 text-xs text-ivory cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={preserveGold}
                          onChange={(e) => setPreserveGold(e.target.checked)}
                          className="rounded border-gold-500/60 text-gold-500 focus:ring-0"
                        />
                        <span>Preserve 22K Gold, Ruby & Emerald Hue Bands</span>
                      </label>

                      <label className="flex items-center gap-2.5 text-xs text-ivory cursor-pointer pt-1 border-t border-gold-900/40">
                        <input
                          type="checkbox"
                          checked={isSingleEarring}
                          onChange={(e) => setIsSingleEarring(e.target.checked)}
                          className="rounded border-gold-500/60 text-gold-500 focus:ring-0"
                        />
                        <span>
                          <strong>Is Single Earring?</strong> (Auto-generate
                          mirrored pair for both ears)
                        </span>
                      </label>
                    </div>

                    <button
                      onClick={() => {
                        if (!cleanedDataUri) {
                          alert("Please upload and clean a photo first.");
                          return;
                        }
                        setWizardStep(2);
                      }}
                      disabled={!cleanedDataUri}
                      className="btn-gold-primary w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>Proceed to Step 2: Technical Specifications</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Technical Specs */}
              {wizardStep === 2 && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="bg-obsidian-950/80 rounded-2xl p-6 border border-gold-subtle space-y-4">
                    <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                      <Scale className="w-4 h-4 text-gold-400" />
                      <span>Ornament Identification & Hallmarking</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          Design Name (English) *
                        </label>
                        <input
                          type="text"
                          value={designName}
                          onChange={(e) => setDesignName(e.target.value)}
                          placeholder="e.g. Royal Lakshmi Kasu Haram"
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          తెలుగు పేరు (Cultural Name)
                        </label>
                        <input
                          type="text"
                          value={teluguName}
                          onChange={(e) => setTeluguName(e.target.value)}
                          placeholder="ఉదా: రాయల్ లక్ష్మీ కాసుల హారం"
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <label className="text-ivory-muted">
                            SKU / Design ID *
                          </label>
                          <button
                            type="button"
                            onClick={() => generateNewSku(category)}
                            className="text-[10px] text-gold-300 hover:underline"
                          >
                            Regenerate
                          </button>
                        </div>
                        <input
                          type="text"
                          name="sku"
                          placeholder="Unique SKU / Design ID..."
                          value={skuId}
                          onChange={(e) => setSkuId(e.target.value)}
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs font-mono text-gold-200 focus:outline-none focus:border-gold-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          Jewelry Category *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => {
                            const val = e.target.value as JewelryCategory;
                            setCategory(val);
                            generateNewSku(val);
                          }}
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400 cursor-pointer"
                        >
                          <option value="necklaces">Necklaces (Harams / Chokers)</option>
                          <option value="earrings">Earrings (Jhumkas / Chandbalis)</option>
                          <option value="maang-tikka">Maang Tikka (Papidi Billa)</option>
                          <option value="nose-rings">Nose Rings (Mukku Pudaka / Nath)</option>
                          <option value="bangles">Bangles / Vanki (Armlet)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          Style / Craftwork *
                        </label>
                        <select
                          value={style}
                          onChange={(e) =>
                            setStyle(e.target.value as JewelryStyle)
                          }
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400 cursor-pointer"
                        >
                          <option value="Nakshi">Nakshi (Embossed Heirloom)</option>
                          <option value="Temple">Temple (Deity Architecture)</option>
                          <option value="Kundan">Kundan / Jadau Polki</option>
                          <option value="Plain Gold">Plain Gold (Yellow 916)</option>
                          <option value="Antique">Antique Matte Polish</option>
                          <option value="22K Hallmark">22K BIS Hallmarked</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          Gold Purity Standard *
                        </label>
                        <select
                          value={purity}
                          onChange={(e) =>
                            setPurity(e.target.value as "22K" | "24K" | "18K")
                          }
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400 cursor-pointer"
                        >
                          <option value="22K">22K (916 KDM Hallmarked)</option>
                          <option value="24K">24K (Pure Bullion Gold)</option>
                          <option value="18K">18K (Studded Diamond Purity)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Craftable Gram Weights & Pricing Parameters */}
                  <div className="bg-obsidian-950/80 rounded-2xl p-6 border border-gold-subtle space-y-4">
                    <h4 className="font-cinzel text-base font-bold text-ivory flex items-center gap-2">
                      <Gem className="w-4 h-4 text-gold-400" />
                      <span>Craftable Gram Range & Goldsmith Formula Parameters</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          Min Craftable Grams
                        </label>
                        <input
                          type="number"
                          step={0.5}
                          value={minGrams}
                          onChange={(e) =>
                            setMinGrams(parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs font-mono text-gold-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-gold-300 font-semibold">
                          Default Standard Grams *
                        </label>
                        <input
                          type="number"
                          step={0.5}
                          value={defaultGrams}
                          onChange={(e) =>
                            setDefaultGrams(parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-obsidian-900 border border-gold-400/80 rounded-xl px-3.5 py-2 text-xs font-mono text-gold-200"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          Max Craftable Grams
                        </label>
                        <input
                          type="number"
                          step={0.5}
                          value={maxGrams}
                          onChange={(e) =>
                            setMaxGrams(parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs font-mono text-gold-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-gold-900/40">
                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          Wastage / VA (%)
                        </label>
                        <input
                          type="number"
                          step={0.5}
                          value={wastagePercent}
                          onChange={(e) =>
                            setWastagePercent(parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs font-mono text-ivory"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-ivory-muted">
                          Making Charge (₹/g)
                        </label>
                        <input
                          type="number"
                          step={25}
                          value={makingCharge}
                          onChange={(e) =>
                            setMakingCharge(parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-obsidian-900 border border-gold-900/80 rounded-xl px-3.5 py-2 text-xs font-mono text-ivory"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-emerald-400">
                          Stone Weight (g Deduction)
                        </label>
                        <input
                          type="number"
                          step={0.1}
                          value={stoneWeight}
                          onChange={(e) =>
                            setStoneWeight(parseFloat(e.target.value) || 0)
                          }
                          placeholder="e.g. 2.0"
                          className="w-full bg-obsidian-900 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-emerald-400">
                          Flat Stone Charges (₹)
                        </label>
                        <input
                          type="number"
                          step={500}
                          value={stoneCost}
                          onChange={(e) =>
                            setStoneCost(parseFloat(e.target.value) || 0)
                          }
                          placeholder="e.g. 3500"
                          className="w-full bg-obsidian-900 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs font-mono text-emerald-300"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-ivory-muted bg-obsidian-900/60 p-2.5 rounded-xl border border-gold-900/40">
                      ✨ <strong>Net Gold Weight Calculation:</strong>{" "}
                      {defaultGrams}g (Gross) - {stoneWeight}g (Stone) ={" "}
                      <span className="text-gold-300 font-bold">
                        {(defaultGrams - stoneWeight).toFixed(1)}g (Net Gold)
                      </span>
                      . Gold price will be computed on Net Gold Weight.
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="px-4 py-2.5 rounded-xl bg-obsidian-950 border border-gold-900/60 text-xs font-medium text-ivory-muted hover:text-ivory flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Step 1</span>
                    </button>

                    <button
                      onClick={() => setWizardStep(3)}
                      className="btn-gold-primary py-2.5 px-6 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>Proceed to Step 3: Anchor Calibration</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Live Anchor Calibration */}
              {wizardStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 flex flex-col items-center">
                    <div className="relative rounded-2xl overflow-hidden bg-obsidian-950 border-2 border-gold-500/40 shadow-gold-glow flex items-center justify-center">
                      <canvas
                        ref={previewCanvasRef}
                        className="max-h-[60vh] w-auto object-contain select-none"
                      />

                      <div className="absolute top-3 left-3 bg-obsidian-950/90 border border-gold-500/30 rounded-full px-3 py-1 text-[11px] text-gold-300 backdrop-blur-md">
                        ✨ Live AR Anchor Preview on Model
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-obsidian-950/80 rounded-2xl p-5 border border-gold-subtle space-y-4">
                      <div className="flex items-center justify-between border-b border-gold-900/60 pb-2">
                        <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Default Placement Calibration</span>
                        </span>
                        <button
                          onClick={() => {
                            setAnchorScale(1.0);
                            setAnchorOffsetY(25);
                            setAnchorOffsetX(0);
                          }}
                          className="text-[10px] text-ivory-muted hover:text-gold-300"
                        >
                          Reset
                        </button>
                      </div>

                      <p className="text-xs text-ivory-muted">
                        Calibrate the default scale and neck/ear positioning.
                        When customers tap this item in Live AR or Photo Match,
                        it will appear in this exact calibrated spot.
                      </p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-ivory-muted">
                          <span>Default Scale / Size:</span>
                          <span className="text-gold-300 font-mono">
                            {anchorScale.toFixed(2)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={2}
                          step={0.02}
                          value={anchorScale}
                          onChange={(e) =>
                            setAnchorScale(parseFloat(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-ivory-muted">
                          <span>Vertical Offset (Y):</span>
                          <span className="text-gold-300 font-mono">
                            {anchorOffsetY > 0
                              ? `+${anchorOffsetY}`
                              : anchorOffsetY}
                            px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-80}
                          max={100}
                          step={2}
                          value={anchorOffsetY}
                          onChange={(e) =>
                            setAnchorOffsetY(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-ivory-muted">
                          <span>Horizontal Offset (X):</span>
                          <span className="text-gold-300 font-mono">
                            {anchorOffsetX > 0
                              ? `+${anchorOffsetX}`
                              : anchorOffsetX}
                            px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-50}
                          max={50}
                          step={2}
                          value={anchorOffsetX}
                          onChange={(e) =>
                            setAnchorOffsetX(parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1 pt-1 border-t border-gold-900/40">
                        <span className="text-[11px] text-ivory-muted block">
                          Preview on Different Bridal Faces:
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto py-1">
                          {SAMPLE_PORTRAITS.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setCalibrationModel(p)}
                              className={`shrink-0 p-1 rounded-lg border ${
                                calibrationModel.id === p.id
                                  ? "border-gold-400 bg-gold-500/20"
                                  : "border-gold-900/40 bg-obsidian-900 opacity-60"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.url}
                                alt={p.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={handlePublishOrnament}
                        disabled={isPublishing}
                        className="btn-gold-primary w-full py-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-gold-glow"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {isPublishing
                            ? "Saving to Catalog..."
                            : editItem
                            ? "Update Ornament in Catalog"
                            : "Publish to Live Catalog & AR Carousel"}
                        </span>
                      </button>

                      <button
                        onClick={() => setWizardStep(2)}
                        className="w-full py-2 rounded-xl bg-obsidian-950 border border-gold-900/60 text-xs text-ivory-muted hover:text-ivory"
                      >
                        Back to Specifications
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Destructive Action Confirmation Modal (Item 18) */}
      {confirmActionModal.isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-obsidian-950 border border-ruby-900/60 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ruby-950 border border-ruby-700/60 flex items-center justify-center text-ruby-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-cinzel text-base font-bold text-ivory">
                  {confirmActionModal.type === "reset" ? "Reset Showroom Catalog" : "Delete Ornament Design"}
                </h4>
                <p className="text-xs text-ruby-300/80">
                  {confirmActionModal.type === "reset"
                    ? "This will delete all custom uploaded jewelry designs. An automatic backup has already been downloaded."
                    : "This design will be permanently deleted from the catalog. An automatic backup has already been downloaded."}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-obsidian-900 border border-gold-900/40 space-y-1.5">
              <label className="text-xs text-ivory-muted">
                Type <span className="font-mono font-bold text-ruby-400">{confirmActionModal.expectedWord}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedConfirmWord}
                onChange={(e) => setTypedConfirmWord(e.target.value.toUpperCase())}
                placeholder={confirmActionModal.expectedWord}
                className="w-full bg-obsidian-950 border border-ruby-500/50 rounded-lg px-3 py-2 text-sm text-ivory font-mono tracking-widest uppercase focus:outline-none focus:border-ruby-400"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmActionModal({ isOpen: false, type: "delete", expectedWord: "DELETE" });
                  setTypedConfirmWord("");
                }}
                className="px-4 py-2 rounded-xl bg-obsidian-900 text-xs text-ivory-muted hover:text-ivory border border-gold-900/40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={typedConfirmWord !== confirmActionModal.expectedWord}
                onClick={executeConfirmedAction}
                className="px-4 py-2 rounded-xl bg-ruby-600 hover:bg-ruby-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition-colors"
              >
                Confirm {confirmActionModal.type === "reset" ? "Reset" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
