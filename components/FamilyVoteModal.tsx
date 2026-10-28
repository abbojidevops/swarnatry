"use client";

import React, { useState, useRef } from "react";
import { JewelryItem } from "@/data/mockJewelryCatalog";
import { formatINR } from "@/lib/goldMath";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  Share2,
  Download,
  Users,
  Sparkles,
  CheckCircle2,
  Heart,
  ThumbsUp,
  ExternalLink,
} from "lucide-react";

export interface PollOption {
  id: string;
  name: string;
  teluguName?: string;
  grams: number;
  price: number;
  imageSrc?: string;
}

interface FamilyVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  optionA: PollOption;
  optionB: PollOption;
  showroomName?: string;
}

export const FamilyVoteModal: React.FC<FamilyVoteModalProps> = ({
  isOpen,
  onClose,
  optionA,
  optionB,
  showroomName = "Sri Krishna Jewellers",
}) => {
  const { isTe } = useLanguage();
  const [votesA, setVotesA] = useState<number>(14);
  const [votesB, setVotesB] = useState<number>(9);
  const [userVoted, setUserVoted] = useState<"A" | "B" | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  const totalVotes = votesA + votesB;
  const pctA = Math.round((votesA / totalVotes) * 100);
  const pctB = 100 - pctA;

  const handleCastVote = (opt: "A" | "B") => {
    if (userVoted) return;
    setUserVoted(opt);
    if (opt === "A") setVotesA((prev) => prev + 1);
    else setVotesB((prev) => prev + 1);
  };

  const getShareablePollUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/?tryonA=${encodeURIComponent(
      optionA.id
    )}&tryonB=${encodeURIComponent(optionB.id)}&mode=bridal-poll`;
  };

  const handleShareWhatsApp = () => {
    const pollUrl = getShareablePollUrl();
    const formattedPriceA = formatINR(optionA.price);
    const formattedPriceB = formatINR(optionB.price);

    const message = isTe
      ? `నమస్తే! మా పెళ్లి నగల ఎంపిక కోసం మీ అభిప్రాయం/ఓటు కావాలి 💍✨\n\n` +
        `క్రింది రెండు డిజైన్లలో ఏది నా ముఖానికి మరియు పెళ్లి చీరకు బాగా సరిపోతుంది?\n\n` +
        `🅰️ ఆప్షన్ A: ${optionA.name} (${optionA.grams} గ్రాములు - ${formattedPriceA})\n` +
        `🅱️ ఆప్షన్ B: ${optionB.name} (${optionB.grams} గ్రాములు - ${formattedPriceB})\n\n` +
        `ఈ లింక్ ఓపెన్ చేసి లైవ్ AR లో చూసి మీ ఓటు వేయండి:\n${pollUrl}\n\n` +
        `(${showroomName} వర్చువల్ జ్యువెలరీ ట్రై-ఆన్)`
      : `Namaste! Need your vote to finalize my wedding jewelry look 💍✨\n\n` +
        `Which design looks more graceful and royal on me?\n\n` +
        `🅰️ Option A: ${optionA.name} (${optionA.grams}g - ${formattedPriceA})\n` +
        `🅱️ Option B: ${optionB.name} (${optionB.grams}g - ${formattedPriceB})\n\n` +
        `Open this link to view both in virtual try-on and cast your vote:\n${pollUrl}\n\n` +
        `(${showroomName} Virtual Showroom)`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleCopyLink = async () => {
    const url = getShareablePollUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  // Canvas Image Download for Family WhatsApp Card
  const handleDownloadCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#0B0B0E";
    ctx.fillRect(0, 0, 1080, 1080);

    // Decorative Royal Border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, 1020, 1020);

    // Top Header Banner
    ctx.fillStyle = "#18181F";
    ctx.fillRect(40, 40, 1000, 140);
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 42px 'Cinzel', serif";
    ctx.textAlign = "center";
    ctx.fillText("FAMILY JEWELRY POLL • పెళ్లి నగల ఓటు", 540, 105);

    ctx.fillStyle = "#F8F5E9";
    ctx.font = "24px sans-serif";
    ctx.fillText(`${showroomName} • Help the Bride Pick Her Look!`, 540, 150);

    // Two Columns: Option A and Option B
    // Left Box (Option A)
    ctx.fillStyle = "#14141A";
    ctx.fillRect(60, 220, 460, 720);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 220, 460, 720);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("OPTION A", 290, 280);

    ctx.fillStyle = "#F8F5E9";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(optionA.name.slice(0, 25), 290, 340);
    ctx.fillStyle = "#D4AF37";
    ctx.font = "24px monospace";
    ctx.fillText(`${optionA.grams}g • 22K 916`, 290, 385);
    ctx.fillText(formatINR(optionA.price), 290, 430);

    // Right Box (Option B)
    ctx.fillStyle = "#14141A";
    ctx.fillRect(560, 220, 460, 720);
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 3;
    ctx.strokeRect(560, 220, 460, 720);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText("OPTION B", 790, 280);

    ctx.fillStyle = "#F8F5E9";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(optionB.name.slice(0, 25), 790, 340);
    ctx.fillStyle = "#D4AF37";
    ctx.font = "24px monospace";
    ctx.fillText(`${optionB.grams}g • 22K 916`, 790, 385);
    ctx.fillText(formatINR(optionB.price), 790, 430);

    // Bottom Watermark
    ctx.fillStyle = "#8E8D8A";
    ctx.font = "22px sans-serif";
    ctx.fillText("SwarnaTry Virtual Try-On • Share your vote on WhatsApp!", 540, 1010);

    // Trigger download
    const link = document.createElement("a");
    link.download = `SwarnaTry_Family_Poll_${optionA.name.slice(0, 8)}_vs_${optionB.name.slice(0, 8)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-obsidian-900 border border-gold-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-ivory">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-obsidian-950/60 hover:bg-obsidian-800 text-ivory-muted hover:text-ivory transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-gold-400" />
            <span>
              {isTe
                ? "అమ్మ & కుటుంబ సభ్యుల ఓటు (Family Poll)"
                : "Ask Family & Friends Co-Shopping Poll"}
            </span>
          </div>
          <h3 className="font-cinzel text-xl font-bold text-ivory">
            {isTe
              ? "ఏ డిజైన్ బాగుందో కుటుంబ సభ్యులను అడగండి"
              : "Which Design Looks Better on You?"}
          </h3>
          <p className="text-xs text-ivory-muted max-w-sm mx-auto">
            {isTe
              ? "ఈ పోల్ లింక్‌ను లేదా కార్డ్‌ను వాట్సాప్ గ్రూప్‌లో షేర్ చేయండి. బంధువులు ఓటు వేసి వారి అభిప్రాయాన్ని తెలియజేస్తారు."
              : "Share this comparison poll card on your family WhatsApp group. Relatives can see both looks side-by-side and vote!"}
          </p>
        </div>

        {/* Side-by-Side Comparison Voting Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card A */}
          <div
            onClick={() => handleCastVote("A")}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 relative ${
              userVoted === "A"
                ? "bg-gold-950/40 border-gold-400 shadow-gold-glow/20 scale-[1.02]"
                : "bg-obsidian-950/80 border-gold-900/60 hover:border-gold-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold-500 text-obsidian-950">
                Option A
              </span>
              <span className="text-[10px] text-ivory-muted font-mono font-bold">
                {votesA} Votes ({pctA}%)
              </span>
            </div>

            {optionA.imageSrc && (
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-obsidian-900 border border-gold-900/40 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optionA.imageSrc}
                  alt={optionA.name}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            )}

            <div>
              <h4 className="font-semibold text-xs text-ivory line-clamp-1">
                {optionA.name}
              </h4>
              <div className="text-[11px] font-mono text-gold-300 font-bold mt-0.5">
                {formatINR(optionA.price)} • {optionA.grams}g
              </div>
            </div>

            {/* Vote Progress Bar */}
            <div className="w-full bg-obsidian-900 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className="bg-gold-500 h-full transition-all duration-500"
                style={{ width: `${pctA}%` }}
              />
            </div>

            <button
              type="button"
              className={`w-full py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                userVoted === "A"
                  ? "bg-gold-500 text-obsidian-950"
                  : "bg-obsidian-900 hover:bg-obsidian-850 text-gold-300 border border-gold-900/60"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{userVoted === "A" ? "You Voted A!" : "Vote for A"}</span>
            </button>
          </div>

          {/* Card B */}
          <div
            onClick={() => handleCastVote("B")}
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 relative ${
              userVoted === "B"
                ? "bg-gold-950/40 border-gold-400 shadow-gold-glow/20 scale-[1.02]"
                : "bg-obsidian-950/80 border-gold-900/60 hover:border-gold-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold-400 text-obsidian-950">
                Option B
              </span>
              <span className="text-[10px] text-ivory-muted font-mono font-bold">
                {votesB} Votes ({pctB}%)
              </span>
            </div>

            {optionB.imageSrc && (
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-obsidian-900 border border-gold-900/40 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optionB.imageSrc}
                  alt={optionB.name}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            )}

            <div>
              <h4 className="font-semibold text-xs text-ivory line-clamp-1">
                {optionB.name}
              </h4>
              <div className="text-[11px] font-mono text-gold-300 font-bold mt-0.5">
                {formatINR(optionB.price)} • {optionB.grams}g
              </div>
            </div>

            {/* Vote Progress Bar */}
            <div className="w-full bg-obsidian-900 rounded-full h-2 overflow-hidden border border-white/5">
              <div
                className="bg-gold-400 h-full transition-all duration-500"
                style={{ width: `${pctB}%` }}
              />
            </div>

            <button
              type="button"
              className={`w-full py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                userVoted === "B"
                  ? "bg-gold-400 text-obsidian-950"
                  : "bg-obsidian-900 hover:bg-obsidian-850 text-gold-300 border border-gold-900/60"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{userVoted === "B" ? "You Voted B!" : "Vote for B"}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: WhatsApp & Image Download */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="btn-gold-primary w-full py-3 rounded-xl text-xs font-bold shadow-gold-glow flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>
              {isTe
                ? "కుటుంబ వాట్సాప్ గ్రూప్‌లో పోల్ షేర్ చేయండి"
                : "Share Poll on Family WhatsApp Group"}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handleDownloadCard}
              className="py-2.5 px-3 rounded-xl bg-obsidian-950 hover:bg-obsidian-850 border border-gold-900/60 text-gold-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isTe ? "పోల్ కార్డ్ డౌన్‌లోడ్" : "Download Poll Card"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-obsidian-950 hover:bg-obsidian-850 border border-gold-900/60 text-gold-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{copiedLink ? "Link Copied!" : "Copy Poll Link"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
