"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import {
  Printer,
  X,
  FileText,
  Receipt,
  Languages,
  Share2,
  Check,
  Crown,
  Scale,
  Sparkles,
  Phone,
  Building,
  Calendar,
  User,
  ShieldCheck,
  Coins,
  Download,
  AlertCircle,
} from "lucide-react";
import { formatINR, OldGoldExchangeSummary, sanitizePhoneNumber, roundRupee } from "@/lib/goldMath";
import { useLanguage } from "@/context/LanguageContext";

export interface EstimateLineItem {
  id: string;
  name: string;
  teluguName?: string;
  category: string;
  grossGrams: number;
  netGrams: number;
  stoneWeight: number;
  purity: string;
  rate: number;
  baseGoldCost: number;
  wastagePercent: number;
  wastageCost: number;
  makingCharges: number;
  stoneCost: number;
  gstAmount: number;
  totalEstimatedPrice: number;
  imageUri?: string;
}

interface PrintableEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  showroomName: string;
  showroomPhone?: string;
  showroomGstin?: string;
  showroomAddress?: string;
  showroomSettings?: any;
  goldRate22K: number;
  goldRate24K: number;
  items: EstimateLineItem[];
  calculatorState?: any;
  oldGoldData?: any;
  oldGoldSummary?: OldGoldExchangeSummary | null;
  customerName?: string;
  customerPhone?: string;
  tryOnSnapshot?: string | null;
  isBridalSet?: boolean;
  mode?: "a4" | "thermal";
  language?: "en" | "te";
  onPrint?: () => void;
}

export const PrintableEstimateModal: React.FC<PrintableEstimateModalProps> = ({
  isOpen,
  onClose,
  showroomName,
  showroomPhone = "+91 98765 43210",
  showroomGstin = "36AAACS1234F1Z8",
  showroomAddress = "Main Road, Goldsmith Street, Jewellers Colony, Hyderabad",
  showroomSettings,
  goldRate22K,
  goldRate24K,
  items,
  calculatorState,
  oldGoldData,
  oldGoldSummary: propOldGoldSummary,
  customerName: initialCustName = "Valued Customer",
  customerPhone: initialCustPhone = "+91 98765 XXXXX",
  tryOnSnapshot,
  isBridalSet = false,
  mode: initialMode = "a4",
  language: initialLanguage = "en",
  onPrint,
}) => {
  const { language: ctxLang, setLanguage: ctxSetLang, isTe: ctxIsTe } = useLanguage();
  const [printMode, setPrintMode] = useState<"a4" | "thermal">(initialMode);
  const [localLangOverride, setLocalLangOverride] = useState<"en" | "te" | null>(null);
  const language = localLangOverride || ctxLang;
  const isTe = language === "te";
  const [custName, setCustName] = useState<string>(initialCustName);
  const [custPhone, setCustPhone] = useState<string>(initialCustPhone);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportingPng, setIsExportingPng] = useState<boolean>(false);

  const effectiveShowroomPhone = showroomSettings?.showroomPhone || showroomPhone;
  const effectiveShowroomGstin = showroomSettings?.showroomGstin || showroomGstin;
  const effectiveShowroomAddress = showroomSettings?.showroomAddress || showroomAddress;
  const oldGoldSummary = propOldGoldSummary || oldGoldData || null;
  const [estimateNo] = useState<string>(
    `EST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  // Calculate Totals
  const totalGrossGrams = items.reduce((acc, i) => acc + i.grossGrams, 0);
  const totalNetGrams = items.reduce((acc, i) => acc + i.netGrams, 0);
  const totalStoneWeight = items.reduce((acc, i) => acc + i.stoneWeight, 0);
  const totalBaseGold = items.reduce((acc, i) => acc + i.baseGoldCost, 0);
  const totalWastage = items.reduce((acc, i) => acc + i.wastageCost, 0);
  const totalMaking = items.reduce((acc, i) => acc + i.makingCharges, 0);
  const totalStones = items.reduce((acc, i) => acc + i.stoneCost, 0);
  const totalGst = items.reduce((acc, i) => acc + i.gstAmount, 0);
  const grandTotalNew = items.reduce((acc, i) => acc + i.totalEstimatedPrice, 0);

  const oldGoldDeduction = oldGoldSummary ? oldGoldSummary.totalExchangeValue : 0;
  const netPayable = Math.max(0, grandTotalNew - oldGoldDeduction);
  const creditCarryForward = oldGoldDeduction > grandTotalNew ? oldGoldDeduction - grandTotalNew : 0;

  // Generate QR Code as Data URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const primarySku = items[0]?.id || "SW-HRM-104";
      const origin = window.location.origin || "http://localhost:3000";
      const link = `${origin}/?tryon=${primarySku}&mode=live-ar`;
      QRCode.toDataURL(link, {
        width: 140,
        margin: 1,
        color: { dark: "#0B0B0E", light: "#FFFFFF" },
      }).then(setQrCodeDataUrl).catch(() => {});
    }
  }, [items]);

  const handlePrint = () => {
    if (onPrint) onPrint();
    window.print();
  };

  const handleDownloadPNG = async () => {
    const slipElement = document.getElementById("printable-estimate-slip");
    if (!slipElement) return;

    setIsExportingPng(true);
    try {
      const canvas = await html2canvas(slipElement, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      if (!dataUrl || dataUrl === "data:,") {
        throw new Error("Canvas generation returned empty image");
      }
      const link = document.createElement("a");
      link.download = `SwarnaTry_${estimateNo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.warn("html2canvas error:", err);
      setToastMessage(
        isTe
          ? "PNG ఎక్స్‌పోర్ట్ సాధ్యం కాలేదు — ప్రింట్ → Save as PDF ఉపయోగించండి"
          : "PNG export unavailable — use Print → Save as PDF"
      );
      setTimeout(() => setToastMessage(null), 6000);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = sanitizePhoneNumber(custPhone);
    let msg = `👑 *${showroomName.toUpperCase()} — ${isTe ? "బంగారు ధర అంచనా రసీదు" : "Gold Estimate Quotation"}*\n`;
    msg += `Ref: ${estimateNo} | Date: ${new Date().toLocaleDateString("en-IN")}\n`;
    msg += `Customer: ${custName} (${custPhone})\n`;
    msg += `Live 22K Rate: ₹${goldRate22K.toLocaleString("en-IN")}/g\n`;
    msg += `──────────────────────\n`;

    const MAX_ITEMS = 5;
    const displayedItems = items.slice(0, MAX_ITEMS);
    const hiddenItems = items.slice(MAX_ITEMS);

    displayedItems.forEach((it, idx) => {
      msg += `${idx + 1}. *${isTe ? (it.teluguName || it.name) : it.name}* (${it.id})\n`;
      msg += `   • Gross: ${it.grossGrams}g | Net: ${it.netGrams}g | Price: ${formatINR(it.totalEstimatedPrice)}\n`;
    });

    if (hiddenItems.length > 0) {
      const hiddenTotal = hiddenItems.reduce((acc, it) => acc + it.totalEstimatedPrice, 0);
      msg += `...and ${hiddenItems.length} more items (Subtotal: ${formatINR(hiddenTotal)})\n`;
    }

    if (oldGoldSummary && oldGoldSummary.totalExchangeValue > 0) {
      msg += `──────────────────────\n`;
      msg += `💰 New Jewelry Total: ${formatINR(grandTotalNew)}\n`;
      msg += `🔄 Less Old Gold Exchange: -${formatINR(oldGoldSummary.totalExchangeValue)} (${oldGoldSummary.totalNetGrams}g)\n`;
      if (creditCarryForward > 0) {
        msg += `💵 *NET PAYABLE: ₹0 (Fully Covered)*\n`;
        msg += `✨ *Credit Balance (Carry Forward): +${formatINR(creditCarryForward)}*\n`;
      } else {
        msg += `💵 *NET PAYABLE: ${formatINR(netPayable)}*\n`;
      }
    } else {
      msg += `──────────────────────\n`;
      msg += `💵 *TOTAL ESTIMATE: ${formatINR(grandTotalNew)}*\n`;
    }
    msg += `──────────────────────\n📍 Certified 22K 916 BIS Hallmarked. Visit showroom for custom order booking!`;

    // Cap message length below 1750 characters
    if (msg.length > 1750) {
      msg = msg.substring(0, 1750) + "\n...";
    }

    const phoneParam = cleanPhone ? `phone=${cleanPhone}&` : "";
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(msg)}`, "_blank");
  };

  const toggleLang = () => {
    const next = language === "en" ? "te" : "en";
    setLocalLangOverride(next);
    ctxSetLang(next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-obsidian-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-obsidian-900 border border-gold-900/60 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-ivory">
        {/* Top Interactive Toolbar (Hidden during actual print) */}
        <div className="p-4 bg-obsidian-950 border-b border-gold-900/60 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-950/70 border border-gold-700/50 flex items-center justify-center text-gold-300">
              <Printer className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel font-bold text-base text-gold-300">
                  {isTe ? "అంచనా రసీదు ప్రింట్ & PDF" : "Showroom Estimate Slip"}
                </h3>
                <span className="text-[10px] font-mono bg-gold-500/15 text-gold-300 px-2 py-0.5 rounded border border-gold-500/30">
                  {estimateNo}
                </span>
              </div>
              <p className="text-[11px] text-ivory-muted">
                {isTe
                  ? "A4 రాయల్ కొటేషన్ లేదా 80mm థర్మల్ కౌంటర్ రసీదు మోడ్‌ను ఎంచుకోండి"
                  : "Choose between A4 Royal Quotation or 80mm POS Thermal Slip"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Switcher */}
            <div className="flex bg-obsidian-900 border border-gold-900/60 rounded-xl p-0.5 text-xs">
              <label
                onClick={() => setPrintMode("a4")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  printMode === "a4"
                    ? "bg-gold-500 text-obsidian-950 font-bold"
                    : "text-ivory-muted hover:text-ivory"
                }`}
              >
                <input
                  type="radio"
                  name="printMode"
                  value="a4"
                  checked={printMode === "a4"}
                  onChange={() => setPrintMode("a4")}
                  className="hidden"
                />
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Royal</span>
              </label>
              <label
                onClick={() => setPrintMode("thermal")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
                  printMode === "thermal"
                    ? "bg-gold-500 text-obsidian-950 font-bold"
                    : "text-ivory-muted hover:text-ivory"
                }`}
              >
                <input
                  type="radio"
                  name="printMode"
                  value="thermal"
                  checked={printMode === "thermal"}
                  onChange={() => setPrintMode("thermal")}
                  className="hidden"
                />
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm Thermal</span>
              </label>
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLang}
              className="text-xs bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 px-3 py-1.5 rounded-xl border border-gold-900/60 font-semibold"
            >
              {language === "en" ? "తెలుగు" : "English"}
            </button>

            {/* Print Trigger Button */}
            <button
              onClick={handlePrint}
              className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-gold-glow"
            >
              <Printer className="w-4 h-4" />
              <span>{isTe ? "ప్రింట్ / PDF" : "Print / PDF"}</span>
            </button>

            {/* PNG Image Download */}
            <button
              onClick={handleDownloadPNG}
              disabled={isExportingPng}
              className="bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 font-medium px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-gold-900/60 transition-colors disabled:opacity-50"
              title="Download Estimate Slip as high-resolution PNG image"
            >
              <Download className="w-3.5 h-3.5 text-gold-400" />
              <span>{isExportingPng ? "Exporting..." : "Download PNG"}</span>
            </button>

            {/* WhatsApp Trigger */}
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-obsidian-850 text-ivory-muted hover:text-white flex items-center justify-center border border-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer Information Quick Bar (Editable) */}
        <div className="px-6 py-2 bg-obsidian-950/60 border-b border-gold-900/30 flex items-center gap-4 flex-wrap text-xs print:hidden">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-ivory-muted">Customer:</span>
            <input
              type="text"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="bg-obsidian-900 border border-gold-900/60 rounded px-2 py-0.5 text-xs text-ivory w-36 focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-ivory-muted">Phone:</span>
            <input
              type="text"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              className="bg-obsidian-900 border border-gold-900/60 rounded px-2 py-0.5 text-xs text-ivory w-32 focus:outline-none focus:border-gold-500 font-mono"
            />
          </div>
        </div>

        {/* Export Error Toast */}
        {toastMessage && (
          <div className="mx-6 mt-3 p-3 bg-red-950/90 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center gap-2 animate-in fade-in print:hidden">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dynamic Paged Media Rules for A4 (12mm) vs Thermal (80mm 2mm) */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              printMode === "thermal"
                ? `
              @page { size: 80mm auto; margin: 2mm; }
              @media print {
                body { background: #ffffff !important; color: #000000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                #printable-estimate-slip { width: 72mm !important; max-width: 72mm !important; margin: 0 auto !important; padding: 1mm !important; font-family: 'Courier New', Courier, monospace !important; }
              }
            `
                : `
              @page { size: A4; margin: 12mm; }
              @media print {
                body { background: #ffffff !important; color: #000000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                thead { display: table-header-group !important; }
                tr, .print-row { break-inside: avoid !important; page-break-inside: avoid !important; }
                .print-totals { break-inside: avoid !important; page-break-inside: avoid !important; break-before: auto !important; }
                #printable-estimate-slip { width: 100% !important; max-width: 100% !important; margin: 0 auto !important; padding: 0 !important; }
              }
            `,
          }}
        />

        {/* Printable Viewport Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-obsidian-950/40">
          {/* ======================================================== */}
          {/* MODE 1: A4 ROYAL BRIDAL QUOTATION SLIP */}
          {/* ======================================================== */}
          {printMode === "a4" ? (
            <div
              id="printable-estimate-slip"
              className="w-full max-w-[800px] bg-white text-gray-900 p-8 sm:p-10 shadow-2xl rounded-xl border border-gray-200 print:border-none print:shadow-none print:p-0 print:w-full"
            >
              {/* Header */}
              <div className="border-b-2 border-amber-600 pb-5 mb-5 flex items-start justify-between">
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-wider text-amber-900 uppercase">
                    {showroomName}
                  </h1>
                  <p className="text-xs text-gray-600 mt-0.5">{showroomAddress}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>Phone: {showroomPhone}</span>
                    <span>•</span>
                    <span>GSTIN: {showroomGstin}</span>
                    <span>•</span>
                    <span className="font-semibold text-amber-800">22K 916 BIS Hallmarked</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded border border-amber-300 uppercase tracking-wider">
                    {isTe ? "అంచనా కొటేషన్" : "Official Estimate Slip"}
                  </span>
                  <div className="text-xs text-gray-600 mt-1 font-mono">
                    Ref: <strong>{estimateNo}</strong>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Customer & Live Bullion Info Bar */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3.5 mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Customer Name:</span>
                  <strong className="text-gray-900 text-sm">{custName}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Phone:</span>
                  <span className="text-gray-800 font-mono">{custPhone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Locked 22K Rate:</span>
                  <strong className="text-amber-900">₹{goldRate22K.toLocaleString("en-IN")}/g</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Locked 24K Rate:</span>
                  <strong className="text-gray-800">₹{goldRate24K.toLocaleString("en-IN")}/g</strong>
                </div>
              </div>

              {/* Itemized Ornaments Table */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-900 text-amber-50 uppercase text-[10px] tracking-wider">
                      <th className="p-2.5">S.No</th>
                      <th className="p-2.5">Ornament & SKU</th>
                      <th className="p-2.5 text-right">Gross Wt</th>
                      <th className="p-2.5 text-right">Stones</th>
                      <th className="p-2.5 text-right">Net Wt</th>
                      <th className="p-2.5 text-right">VA %</th>
                      <th className="p-2.5 text-right">Making</th>
                      <th className="p-2.5 text-right">GST (3%)</th>
                      <th className="p-2.5 text-right">Total Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 border-b border-gray-300">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-amber-50/30 print-row [break-inside:avoid] [page-break-inside:avoid]">
                        <td className="p-2.5 font-mono text-gray-500">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-gray-900">
                          {isTe ? (item.teluguName || item.name) : item.name}
                          <span className="block text-[10px] text-gray-500 font-mono">
                            {item.id} • {item.purity}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono">{item.grossGrams}g</td>
                        <td className="p-2.5 text-right font-mono text-gray-500">
                          {item.stoneWeight > 0 ? `-${item.stoneWeight}g` : "0g"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-gray-800">
                          {item.netGrams}g
                        </td>
                        <td className="p-2.5 text-right font-mono">{item.wastagePercent}%</td>
                        <td className="p-2.5 text-right font-mono">{formatINR(item.makingCharges)}</td>
                        <td className="p-2.5 text-right font-mono text-gray-500">
                          {formatINR(item.gstAmount)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                          {formatINR(item.totalEstimatedPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="print-totals [break-inside:avoid] [page-break-inside:avoid] [break-before:auto]">
                    <tr className="bg-gray-50 font-bold text-xs">
                      <td colSpan={2} className="p-2.5 text-gray-700">Total New Jewelry:</td>
                      <td className="p-2.5 text-right font-mono">{totalGrossGrams.toFixed(2)}g</td>
                      <td className="p-2.5 text-right font-mono text-gray-500">-{totalStoneWeight.toFixed(2)}g</td>
                      <td className="p-2.5 text-right font-mono">{totalNetGrams.toFixed(2)}g</td>
                      <td colSpan={3} className="p-2.5 text-right text-gray-500">
                        {showroomSettings?.gstOnMakingOnly ? "GST (3% Making): " : "GST Total: "}
                        {formatINR(totalGst)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-amber-900 text-sm">
                        {formatINR(grandTotalNew)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Old Gold Trade-in Box (If Applicable) */}
              {oldGoldSummary && oldGoldSummary.totalExchangeValue > 0 && (
                <div className="print-totals [break-inside:avoid] [page-break-inside:avoid] [break-before:auto] mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-1.5">
                    <span className="font-bold text-emerald-900 uppercase text-[11px] flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      <span>Old Gold Exchange Credit (పాత బంగారం మార్పిడి తగ్గింపు)</span>
                    </span>
                    <span className="font-mono text-emerald-800 font-semibold">
                      {oldGoldSummary.items.length} Old Items Exchanged
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">Old Gross Weight:</span>
                      <strong>{oldGoldSummary.totalGrossGrams}g</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Dust/Wax Deduction:</span>
                      <strong className="text-red-700">-{oldGoldSummary.totalDustDeductionGrams}g</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Net Old Weight:</span>
                      <strong>{oldGoldSummary.totalNetGrams}g</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Equivalent 22K Weight:</span>
                      <strong className="text-emerald-900">{oldGoldSummary.totalEquivalent22KGrams}g</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200 text-emerald-900 font-semibold text-sm">
                    <span>Total Old Gold Value Credited (-):</span>
                    <span className="font-mono font-bold text-base">
                      -{formatINR(oldGoldSummary.totalExchangeValue)}
                    </span>
                  </div>
                </div>
              )}

              {/* Net Settlement Banner & QR Code */}
              <div className="print-totals [break-inside:avoid] [page-break-inside:avoid] [break-before:auto] border-t-2 border-gray-900 pt-4 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {qrCodeDataUrl && (
                    <div className="p-1 border border-gray-300 rounded-lg text-center">
                      <canvas id="qr-code-canvas" className="hidden" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        id="qr-code-img"
                        src={qrCodeDataUrl}
                        alt="Try-On QR"
                        className="w-20 h-20 object-contain mx-auto"
                      />
                      <span className="text-[9px] text-gray-500 block mt-0.5">Scan to Try On</span>
                    </div>
                  )}

                  <div className="space-y-1 text-xs">
                    <p className="text-gray-500 italic text-[11px]">
                      *This is an official showroom estimate based on today&apos;s bullion market rates.
                    </p>
                    <p className="text-gray-500 italic text-[11px]">
                      *Prices subject to re-verification upon final goldsmith counter order confirmation.
                    </p>
                    <div className="text-gray-700 font-medium pt-1">
                      Authorized Signatory: _________________________
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  {oldGoldSummary && oldGoldSummary.totalExchangeValue > 0 ? (
                    <div>
                      <span className="text-xs text-gray-500 block">Net Balance Payable by Customer:</span>
                      <span className="text-3xl font-bold font-serif text-amber-950">
                        {formatINR(netPayable)}
                      </span>
                      {creditCarryForward > 0 && (
                        <span className="inline-block bg-emerald-100 text-emerald-900 font-bold text-[11px] px-2 py-0.5 rounded border border-emerald-300 mt-1">
                          + {formatINR(creditCarryForward)} credit balance (carry forward)
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500 block mt-0.5">
                        (Extra Gold needed: +{oldGoldSummary.goldWeightBalanceGrams}g)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs text-gray-500 block">Grand Total Estimated Price:</span>
                      <span className="text-3xl font-bold font-serif text-amber-950">
                        {formatINR(grandTotalNew)}
                      </span>
                      <span className="text-[11px] text-emerald-800 font-semibold block mt-0.5">
                        {showroomSettings?.gstOnMakingOnly ? "Inclusive of 3% GST on Making" : "Inclusive of 3% GST"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* BIS 916 HUID & Showroom Lifetime Buyback Guarantee Certificate (Phase 7) */}
              <div className="print-totals [break-inside:avoid] [page-break-inside:avoid] mt-6 p-4 rounded-xl border border-amber-400/80 bg-amber-50/70 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-300 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-800 text-amber-100 flex items-center justify-center font-bold text-xs shadow-sm">
                      BIS
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm text-amber-950 uppercase tracking-wide">
                        BIS 916 Hallmarked & Showroom Lifetime Buyback Guarantee
                      </h4>
                      <p className="text-[10px] text-amber-800">
                        బ్యూరో ఆఫ్ ఇండియన్ స్టాండర్డ్స్ (BIS) అధికారిక హాల్‌మార్క్ & జీవితకాల బై-బ్యాక్ హామీ పత్రం
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase block">Certified Authenticity Code:</span>
                    <span className="font-mono font-bold text-xs text-amber-900 px-2 py-0.5 rounded bg-amber-100 border border-amber-300">
                      BIS-916-HUID-PASS
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-amber-950">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold text-sm">✦</span>
                    <div>
                      <strong className="block font-semibold">100% Exchange Guarantee:</strong>
                      <span className="text-gray-600 text-[10px]">
                        Full net gold weight value credited against prevailing 22K market bullion rates at any time.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold text-sm">✦</span>
                    <div>
                      <strong className="block font-semibold">95% Cash Buyback:</strong>
                      <span className="text-gray-600 text-[10px]">
                        Instant cash buyback on net gold weight with official melting report and touch transparency.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold text-sm">✦</span>
                    <div>
                      <strong className="block font-semibold">Free Lifetime Karigar Service:</strong>
                      <span className="text-gray-600 text-[10px]">
                        Free ultrasonic cleaning, prong tightening, and authenticity check across all authorized branches.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* MODE 2: 80MM POS THERMAL COUNTER RECEIPT (MONOCHROME)   */
            /* ======================================================== */
            <div
              id="printable-estimate-slip"
              className="thermal-slip-mode w-[340px] max-w-[72mm] bg-white text-black p-4 shadow-2xl rounded font-mono text-[11px] leading-tight print:shadow-none print:p-0 print:w-[72mm] print:border-none"
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            >
              {/* Thermal Header */}
              <div className="text-center space-y-1 pb-2">
                <h2 className="font-bold text-sm tracking-wider uppercase">
                  {showroomName}
                </h2>
                <p className="text-[10px]">{showroomAddress}</p>
                <p className="text-[10px]">Ph: {showroomPhone} | GST: {showroomGstin}</p>
                <div className="text-[10px] font-bold border-y border-dashed border-black py-1 my-1 uppercase">
                  *** ESTIMATE SLIP (NOT A TAX INVOICE) ***
                </div>
              </div>

              {/* Meta */}
              <div className="space-y-0.5 pb-2 border-b border-dashed border-black text-[10px]">
                <div>Ref: {estimateNo}</div>
                <div>Date: {new Date().toLocaleDateString("en-IN")} {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                <div>Cust: {custName} ({custPhone})</div>
                <div>22K Rate: ₹{goldRate22K}/g | 24K: ₹{goldRate24K}/g</div>
              </div>

              {/* Items Table */}
              <div className="py-2 border-b border-dashed border-black space-y-2">
                <div className="flex justify-between font-bold text-[10px]">
                  <span>ITEM / SKU</span>
                  <span>NET(g)</span>
                  <span>PRICE</span>
                </div>
                {items.map((it, idx) => (
                  <div key={it.id} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{idx + 1}. {it.name.substring(0, 18)}</span>
                      <span>{formatINR(it.totalEstimatedPrice)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-black">
                      <span>{it.id} | Gr:{it.grossGrams}g | St:{it.stoneWeight}g</span>
                      <span>Net: {it.netGrams}g</span>
                    </div>
                    <div className="flex justify-between text-[9px] text-black">
                      <span>VA:{it.wastagePercent}% ({formatINR(it.wastageCost)})</span>
                      <span>Mk: {formatINR(it.makingCharges)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotals */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Gross Gold Wt:</span>
                  <span>{totalGrossGrams.toFixed(2)} g</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Gold Wt:</span>
                  <span>{totalNetGrams.toFixed(2)} g</span>
                </div>
                <div className="flex justify-between">
                  <span>{showroomSettings?.gstOnMakingOnly ? "GST (3% Making):" : "GST (3%):"}</span>
                  <span>{formatINR(totalGst)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1">
                  <span>New Jewelry Total:</span>
                  <span>{formatINR(grandTotalNew)}</span>
                </div>
              </div>

              {/* Old Gold Trade-In Thermal Section */}
              {oldGoldSummary && oldGoldSummary.totalExchangeValue > 0 && (
                <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                  <div className="font-bold uppercase">LESS: OLD GOLD TRADE-IN</div>
                  <div className="flex justify-between">
                    <span>Old Net Wt ({oldGoldSummary.items.length} pcs):</span>
                    <span>{oldGoldSummary.totalNetGrams} g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>22K Equivalent Wt:</span>
                    <span>{oldGoldSummary.totalEquivalent22KGrams} g</span>
                  </div>
                  <div className="flex justify-between font-bold text-[11px]">
                    <span>Old Gold Credit (-):</span>
                    <span>-{formatINR(oldGoldSummary.totalExchangeValue)}</span>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className="py-2 border-b-2 border-black space-y-1 text-center">
                <div className="text-[10px] font-bold uppercase">
                  {oldGoldSummary && oldGoldSummary.totalExchangeValue > 0
                    ? "NET BALANCE PAYABLE"
                    : "TOTAL ESTIMATED PRICE"}
                </div>
                <div className="text-xl font-bold font-mono">
                  {formatINR(netPayable)}
                </div>
                {creditCarryForward > 0 && (
                  <div className="text-[9px] font-bold text-black border border-black p-0.5 mt-1">
                    CREDIT BALANCE (CARRY FORWARD): +{formatINR(creditCarryForward)}
                  </div>
                )}
              </div>

              {/* Thermal BIS Hallmark & Buyback Box (Phase 7) */}
              <div className="py-1.5 border-b border-dashed border-black text-[9px] space-y-0.5">
                <div className="font-bold flex items-center justify-between uppercase">
                  <span>[BIS 916 HALLMARK CERTIFIED]</span>
                  <span>HUID: PASS</span>
                </div>
                <p>• 100% Exchange on 22K Net Gold Weight</p>
                <p>• 95% Cash Buyback Guarantee</p>
                <p>• Free Lifetime Ultrasonic Cleaning</p>
              </div>

              {/* Thermal Footer */}
              <div className="text-center pt-2 space-y-1 text-[9px] text-black">
                <p>22K 916 BIS Certified Gold • Valid for 24 Hrs</p>
                <p>Thank you! Visit again - {showroomName}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
