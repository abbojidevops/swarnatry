"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Volume2, X } from "lucide-react";
import { JewelryCategory } from "@/data/mockJewelryCatalog";
import { useLanguage } from "@/context/LanguageContext";

export interface ParsedVoiceCommand {
  transcript: string;
  query: string;
  category?: JewelryCategory;
  targetGrams?: number;
  maxBudget?: number;
}

interface VoiceSearchButtonProps {
  onParsedVoiceCommand: (parsed: ParsedVoiceCommand) => void;
  className?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onParsedVoiceCommand,
  className = "",
}) => {
  const { isTe, language } = useLanguage();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [interimText, setInterimText] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        isTe
          ? "మీ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ లేదు. దయచేసి Chrome లేదా Safari వాడండి."
          : "Voice recognition is not supported in this browser. Please use Chrome or Safari."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      // te-IN if Telugu active, else en-IN
      recognition.lang = isTe ? "te-IN" : "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText("");
      };

      recognition.onresult = (event: any) => {
        let current = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setInterimText(current);

        if (event.results[0].isFinal) {
          handleProcessVoiceText(current);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const handleProcessVoiceText = (text: string) => {
    const raw = text.trim();
    if (!raw) return;

    const lower = raw.toLowerCase();
    let category: JewelryCategory | undefined = undefined;
    let targetGrams: number | undefined = undefined;
    let maxBudget: number | undefined = undefined;
    let query = raw;

    // 1. Detect Category Keywords (English & Telugu phonetic matches)
    if (
      lower.includes("jhumka") ||
      lower.includes("jhumki") ||
      lower.includes("earring") ||
      lower.includes("buttalu") ||
      lower.includes("బుట్టలు") ||
      lower.includes("ఝుంకా") ||
      lower.includes("చెవి") ||
      lower.includes("chandbali") ||
      lower.includes("కమ్మలు")
    ) {
      category = "earrings";
    } else if (
      lower.includes("haram") ||
      lower.includes("choker") ||
      lower.includes("necklace") ||
      lower.includes("kasu mala") ||
      lower.includes("మాల") ||
      lower.includes("హారం") ||
      lower.includes("చోకర్") ||
      lower.includes("గొలుసు") ||
      lower.includes("కంఠాభరణం")
    ) {
      category = "necklaces";
    } else if (
      lower.includes("tikka") ||
      lower.includes("billa") ||
      lower.includes("papidi") ||
      lower.includes("పాపిడి") ||
      lower.includes("బిళ్ళ") ||
      lower.includes("మాంగ్")
    ) {
      category = "maang-tikka";
    } else if (
      lower.includes("nose") ||
      lower.includes("nath") ||
      lower.includes("pudaka") ||
      lower.includes("ముక్కు") ||
      lower.includes("పుడక") ||
      lower.includes("ముక్కుపుడక") ||
      lower.includes("నత్")
    ) {
      category = "nose-rings";
    } else if (
      lower.includes("bangle") ||
      lower.includes("vanki") ||
      lower.includes("గాజులు") ||
      lower.includes("వంకీ") ||
      lower.includes("కడియం")
    ) {
      category = "bangles";
    }

    // 2. Extract Gram numbers
    // e.g. "20 grams", "25g", "30 గ్రాములు", "40 gm"
    const gramMatch =
      lower.match(/(\d+)\s*(?:g|gm|grams|gram|గ్రాములు|గ్రాం|గ్రా)/i) ||
      lower.match(/(?:under|below|దాదాపు|సుమారు)\s*(\d+)/i);

    if (gramMatch && gramMatch[1]) {
      const g = parseInt(gramMatch[1], 10);
      if (!isNaN(g) && g > 0 && g <= 500) {
        targetGrams = g;
      }
    }

    // Telugu spoken numbers fallback
    const teluguNumbers: Record<string, number> = {
      "పది": 10,
      "ఇరవై": 20,
      "ఇరవై ఐదు": 25,
      "ముప్పై": 30,
      "నలభై": 40,
      "యాభై": 50,
      "అరవై": 60,
      "డెబ్బై": 70,
      "ఎనభై": 80,
      "వంద": 100,
    };
    for (const [word, val] of Object.entries(teluguNumbers)) {
      if (lower.includes(word)) {
        targetGrams = val;
        break;
      }
    }

    // 3. Extract Budget numbers
    // e.g. "2 lakhs", "3 లక్షలు", "50000"
    const lakhMatch = lower.match(/(\d+)\s*(?:lakh|lakhs|లక్ష|లక్షలు)/i);
    if (lakhMatch && lakhMatch[1]) {
      maxBudget = parseInt(lakhMatch[1], 10) * 100000;
    }

    // Pass parsed command back to Catalog
    onParsedVoiceCommand({
      transcript: raw,
      query: category ? "" : raw,
      category,
      targetGrams,
      maxBudget,
    });
  };

  if (!speechSupported) {
    return null;
  }

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`relative inline-flex items-center justify-center p-2.5 rounded-xl border transition-all ${
          isListening
            ? "bg-ruby-600 text-white border-ruby-400 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse"
            : "bg-obsidian-900/90 text-gold-300 hover:text-gold-200 border-gold-500/40 hover:border-gold-400 shadow-sm"
        }`}
        title={
          isListening
            ? isTe
              ? "వాయిస్ రికార్డింగ్ ఆపండి"
              : "Stop Listening"
            : isTe
              ? "వాయిస్ ద్వారా వెతకండి (తెలుగు / English)"
              : "Voice Search in Telugu / English"
        }
      >
        {isListening ? (
          <>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
            <MicOff className="w-4 h-4" />
          </>
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>

      {/* Floating Listening Feedback Bubble */}
      {isListening && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-72 bg-obsidian-950/95 border border-gold-500/60 rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-gold-900/60 pb-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gold-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{isTe ? "మాట్లాడండి..." : "Listening..."}</span>
            </div>
            <button
              onClick={stopListening}
              className="text-ivory-muted hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-ivory font-medium min-h-[36px] italic">
            {interimText ||
              (isTe
                ? 'ఉదా: "20 గ్రాముల బుట్టలు" లేదా "Nakshi choker under 50 grams"'
                : 'Say e.g. "Jhumkas under 25 grams" or "Choker"')}
          </p>

          <div className="text-[10px] text-ivory-muted flex items-center justify-between pt-1 border-t border-gold-900/40">
            <span>{isTe ? "భాష: తెలుగు (te-IN)" : "Language: English (en-IN)"}</span>
            <span className="text-gold-400 font-mono">Tap mic to cancel</span>
          </div>
        </div>
      )}
    </div>
  );
};
