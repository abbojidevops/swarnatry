"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  CheckCircle2,
  Sparkles,
  Monitor,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice && !isStandaloneMode) {
      setIsInstallable(true);
    }

    // Android / Chrome / Desktop PWA listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__swarnatryInstallPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    (window as any).__swarnatryInstallPrompt = handleBeforeInstallPrompt;
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return { deferredPrompt, isInstallable, isIOS, isStandalone, setDeferredPrompt };
}

export const PWAInstallBanner: React.FC<{
  onOpenTour?: () => void;
}> = () => {
  const { deferredPrompt, isInstallable, isIOS, isStandalone, setDeferredPrompt } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [installedSuccess, setInstalledSuccess] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (installing) {
            installing.onstatechange = () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            };
          }
        };
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  // If update is available, always show update toast
  const renderUpdateToast = () => {
    if (!updateAvailable) return null;
    return (
      <div
        onClick={() => window.location.reload()}
        className="fixed top-4 right-4 z-50 bg-gold-500 text-obsidian-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs border border-gold-300 animate-in slide-in-from-top cursor-pointer hover:bg-gold-400 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-obsidian-900" />
        <span>New version available — tap to refresh</span>
      </div>
    );
  };

  // If already running standalone or dismissed, only render update toast / iOS guide
  if (isStandalone || !isInstallable || isDismissed) {
    return (
      <>
        {renderUpdateToast()}
        {showIOSModal && (
          <IOSInstallGuideModal onClose={() => setShowIOSModal(false)} />
        )}
      </>
    );
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalledSuccess(true);
        setDeferredPrompt(null);
        setTimeout(() => setIsDismissed(true), 3000);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {renderUpdateToast()}
      {/* Floating Bottom Kiosk / PWA Install Prompt */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-40 max-w-md bg-obsidian-900/95 border border-gold-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center text-gold-300 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-cinzel font-bold text-gold-200 uppercase tracking-wide">
                Install Showroom App
              </h4>
              <span className="bg-emerald-950/80 text-emerald-300 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                PWA Kiosk
              </span>
            </div>
            <p className="text-[11px] text-ivory-muted mt-0.5 leading-snug">
              Install SwarnaTry on this device for full-screen immersive try-on with zero address bar distraction.
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={handleInstallClick}
                className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-gold-glow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{installedSuccess ? "Installed!" : isIOS ? "How to Install (iOS)" : "Install App"}</span>
              </button>

              <button
                onClick={() => setIsDismissed(true)}
                className="text-[11px] text-ivory-muted hover:text-ivory px-2 py-1 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-ivory-muted hover:text-ivory p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSModal && (
        <IOSInstallGuideModal onClose={() => setShowIOSModal(false)} />
      )}
    </>
  );
};

export const IOSInstallGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm bg-obsidian-900 border border-gold-500/40 rounded-3xl p-5 shadow-2xl text-ivory space-y-4">
        <div className="flex items-center justify-between border-b border-gold-900/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gold-900/40 text-gold-300 border border-gold-700/50">
              <Smartphone className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-cinzel font-bold text-sm text-gold-200">
                Install on iPhone / iPad
              </h3>
              <p className="text-[10px] text-ivory-muted">Full-Screen Standalone Kiosk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-obsidian-800 flex items-center justify-center text-ivory-muted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-obsidian-950/70 border border-gold-900/40">
            <span className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-300 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </span>
            <p className="text-ivory leading-relaxed">
              Tap the Safari <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-gold-300" /> at the bottom of your screen.
            </p>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-obsidian-950/70 border border-gold-900/40">
            <span className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-300 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </span>
            <p className="text-ivory leading-relaxed">
              Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-gold-300" />.
            </p>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-obsidian-950/70 border border-gold-900/40">
            <span className="w-6 h-6 rounded-full bg-gold-500/20 text-gold-300 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </span>
            <p className="text-ivory leading-relaxed">
              Tap <strong>Add</strong> in the top right corner. The SwarnaTry luxury icon will appear on your Home Screen!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold py-2.5 rounded-xl text-xs transition-colors"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
