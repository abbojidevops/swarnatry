"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { JewelryItem } from "@/data/mockJewelryCatalog";
import { calculateGoldPrice, formatINR } from "@/lib/goldMath";
import {
  X,
  QrCode,
  Link,
  Copy,
  Check,
  Download,
  Share2,
  Camera,
  UploadCloud,
  Sparkles,
  Smartphone,
  Store,
} from "lucide-react";

interface ShareDesignModalProps {
  item: JewelryItem | null;
  isOpen: boolean;
  onClose: () => void;
  showroomName: string;
  goldRate22K: number;
}

export const ShareDesignModal: React.FC<ShareDesignModalProps> = ({
  item,
  isOpen,
  onClose,
  showroomName,
  goldRate22K,
}) => {
  const [selectedMode, setSelectedMode] = useState<"live-ar" | "photo-match">(
    "live-ar"
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isGeneratingStandee, setIsGeneratingStandee] = useState<boolean>(false);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Compute deep link URL
  const [origin, setOrigin] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const deepLinkUrl = item
    ? `${origin || "http://localhost:3000"}/?tryon=${item.id}&mode=${selectedMode}`
    : "";

  // Generate QR code data URL whenever link or item changes
  useEffect(() => {
    if (!deepLinkUrl || !item) return;

    QRCode.toDataURL(
      deepLinkUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: "#0B0B0E",
          light: "#FAF8F5",
        },
        errorCorrectionLevel: "M",
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [deepLinkUrl, item]);

  if (!isOpen || !item) return null;

  const priceEst = calculateGoldPrice(item.defaultGrams, item.purity, {
    goldRate22K,
    stoneWeightGrams: item.stoneWeightGrams,
    stoneCostFlat: item.stoneCostFlat,
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLinkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `✨ *Try on ${item.name} (${item.id}) on your phone!*\n\nTap this link to open live AR try-on directly on your camera:\n${deepLinkUrl}\n\n_Crafted by ${showroomName}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Generate Downloadable Showroom Counter Standee (800 x 1200)
  const handleDownloadStandee = async () => {
    setIsGeneratingStandee(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Dark Royal Gradient Background
      const bg = ctx.createLinearGradient(0, 0, 0, 1200);
      bg.addColorStop(0, "#08080B");
      bg.addColorStop(0.5, "#12121A");
      bg.addColorStop(1, "#0B0B0E");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 800, 1200);

      // 2. Gold Borders
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 4;
      ctx.strokeRect(28, 28, 744, 1144);

      ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(38, 38, 724, 1124);

      // 3. Showroom Header
      ctx.textAlign = "center";
      ctx.font = "bold 28px 'Cinzel', serif, Georgia";
      ctx.fillStyle = "#FAF8F5";
      ctx.fillText(showroomName.toUpperCase(), 400, 95);

      ctx.font = "italic 16px 'Playfair Display', serif";
      ctx.fillStyle = "#D4AF37";
      ctx.fillText("Instant AR Try-On • Scan on Your Phone", 400, 130);

      // Decorative Line
      ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 150);
      ctx.lineTo(650, 150);
      ctx.stroke();

      // 4. Ornament Image & Details Box
      const ornamentImg = new Image();
      ornamentImg.crossOrigin = "anonymous";
      ornamentImg.src = qrDataUrl; // placeholder until ornament is drawn

      // Design Title
      ctx.font = "bold 26px 'Cinzel', serif";
      ctx.fillStyle = "#FAF8F5";
      ctx.fillText(item.name, 400, 205);

      ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#D4AF37";
      ctx.fillText(
        `SKU: ${item.id}  •  ${item.defaultGrams}g (${item.purity} Hallmarked)`,
        400,
        238
      );

      ctx.font = "bold 24px 'Cinzel', serif";
      ctx.fillStyle = "#FFE484";
      ctx.fillText(
        `Est. Value: ${formatINR(priceEst.totalEstimatedPrice)}`,
        400,
        275
      );

      // 5. Draw QR Code in Center
      if (qrDataUrl) {
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((r) => {
          qrImg.onload = r;
          qrImg.onerror = r;
        });

        const qrSize = 360;
        const qrX = (800 - qrSize) / 2;
        const qrY = 330;

        // White Card behind QR for reliable phone camera scanning
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.roundRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 24);
        ctx.fill();

        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // Gold border around QR
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 24);
        ctx.stroke();
      }

      // 6. Scan Instructions at Bottom
      const instrY = 790;
      ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#FAF8F5";
      ctx.fillText("📱 SCAN WITH ANY PHONE CAMERA", 400, instrY);

      ctx.font = "16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#C5C0B6";
      ctx.fillText("No app download required. Opens your live AR mirror", 400, instrY + 35);
      ctx.fillText("and shows this exact ornament on your face!", 400, instrY + 62);

      // Bottom Badge
      ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
      ctx.beginPath();
      ctx.roundRect(140, 930, 520, 70, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = "600 15px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#FFE89E";
      ctx.fillText(
        "✨ Powered by SwarnaTry AI AR • 100% Price Transparency",
        400,
        972
      );

      // Footer
      ctx.font = "12px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#8E887E";
      ctx.fillText(
        "Prices subject to live 22K bullion rates at showroom checkout.",
        400,
        1070
      );

      // Download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `SwarnaTry_QR_Standee_${item.id}.png`;
      a.click();
    } catch (e) {
      console.error("Standee export error:", e);
    } finally {
      setIsGeneratingStandee(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-lg bg-obsidian-900 border border-gold-subtle rounded-3xl shadow-gold-glow-lg overflow-hidden my-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 border-b border-gold-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-300">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-400">
                Customer QR & Direct Try-On Link
              </span>
              <h3 className="font-cinzel text-base sm:text-lg font-bold text-ivory">
                {item.name}
              </h3>
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
        <div className="p-6 space-y-5">
          {/* Mode Switcher */}
          <div className="flex items-center justify-center">
            <div className="bg-obsidian-950 p-1 rounded-xl border border-gold-900/60 flex items-center gap-1 text-xs">
              <button
                onClick={() => setSelectedMode("live-ar")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  selectedMode === "live-ar"
                    ? "bg-gold-500 text-obsidian-950 font-bold shadow-gold-glow"
                    : "text-ivory-muted hover:text-ivory"
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Live AR Camera</span>
              </button>

              <button
                onClick={() => setSelectedMode("photo-match")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                  selectedMode === "photo-match"
                    ? "bg-gold-500 text-obsidian-950 font-bold shadow-gold-glow"
                    : "text-ivory-muted hover:text-ivory"
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Photo Match</span>
              </button>
            </div>
          </div>

          {/* QR Code Showcase Box */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-obsidian-950 border border-gold-subtle space-y-3">
            <div className="relative p-3 bg-white rounded-2xl shadow-xl border-2 border-gold-400">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Try-On QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-black">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gold-300">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Scan with any smartphone camera</span>
              </div>
              <p className="text-[11px] text-ivory-muted max-w-xs">
                Immediately launches {selectedMode === "live-ar" ? "Live AR Camera" : "Photo Match"} wearing{" "}
                <strong className="text-ivory">{item.id}</strong> ({item.defaultGrams}g).
              </p>
            </div>
          </div>

          {/* Deep Link URL Input Box */}
          <div className="space-y-1.5">
            <label className="text-xs text-ivory-muted flex items-center gap-1">
              <Link className="w-3 h-3 text-gold-400" />
              <span>Shareable Customer URL:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={deepLinkUrl}
                className="flex-1 bg-obsidian-950 border border-gold-900/80 rounded-xl px-3 py-2 text-xs font-mono text-gold-300 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="bg-obsidian-800 hover:bg-obsidian-750 text-ivory border border-gold-900/60 p-2 rounded-xl text-xs flex items-center gap-1 transition-colors"
                title="Copy Link"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gold-300" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/20"
            >
              <Share2 className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadStandee}
              disabled={isGeneratingStandee}
              className="btn-gold-primary py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGeneratingStandee ? "Generating..." : "Download QR Standee"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
