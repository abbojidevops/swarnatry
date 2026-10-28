"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Check,
  Crown,
  Store,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Smartphone,
  Share2,
  QrCode,
  CreditCard,
  Copy,
  Receipt,
  FileCheck,
  Printer,
  ChevronLeft,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionPlan,
  getPaymentSettings,
  getActiveSubscription,
  saveActiveSubscription,
  clearActiveSubscription,
  generateUpiUrl,
  generateUpiQrCode,
  launchRazorpayCheckout,
  ActiveSubscription,
} from "@/lib/paymentGateway";
import { formatINR } from "@/lib/goldMath";

interface SubscriptionGateProps {
  isOpen: boolean;
  onClose: () => void;
  showroomMode: boolean;
  setShowroomMode: (val: boolean) => void;
  showroomName: string;
  setShowroomName: (name: string) => void;
}

export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  isOpen,
  onClose,
  showroomMode,
  setShowroomMode,
  showroomName,
  setShowroomName,
}) => {
  const [activePersona, setActivePersona] = useState<"b2c" | "b2b">("b2c");
  const [inputShowroom, setInputShowroom] = useState(showroomName);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);

  // Checkout Flow State: "catalog" | "checkout" | "invoice"
  const [viewState, setViewState] = useState<"catalog" | "checkout" | "invoice">("catalog");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"upi_qr" | "razorpay">("upi_qr");
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>("");
  const [upiIntentUrl, setUpiIntentUrl] = useState<string>("");
  const [utrNumber, setUtrNumber] = useState<string>("");
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const paymentSettings = getPaymentSettings();

  useEffect(() => {
    if (isOpen) {
      const currentSub = getActiveSubscription();
      setActiveSub(currentSub);
      setInputShowroom(showroomName);
      setViewState("catalog");
      setErrorMessage("");
    }
  }, [isOpen, showroomName]);

  if (!isOpen) return null;

  // Handle plan selection -> launch checkout mode
  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setErrorMessage("");

    // Generate UPI URL & QR
    const txnRef = `STX-${Date.now().toString().slice(-6)}`;
    const url = generateUpiUrl({
      upiId: paymentSettings.merchantUpiId,
      merchantName: paymentSettings.merchantName,
      amount: plan.amount,
      note: `SwarnaTry ${plan.name}`,
      transactionRef: txnRef,
    });
    setUpiIntentUrl(url);

    const qr = await generateUpiQrCode(url);
    setUpiQrDataUrl(qr);

    // If Razorpay Key is configured and user defaults to razorpay, could launch directly
    if (paymentSettings.razorpayKeyId) {
      setPaymentMethod("razorpay");
    } else {
      setPaymentMethod("upi_qr");
    }

    setViewState("checkout");
  };

  // Launch Razorpay Modal
  const handleRazorpayPay = async () => {
    if (!selectedPlan) return;
    setIsProcessing(true);
    setErrorMessage("");

    try {
      if (!paymentSettings.razorpayKeyId) {
        throw new Error("Razorpay Key ID not configured in Admin Studio. Please use instant UPI QR below.");
      }

      await launchRazorpayCheckout({
        plan: selectedPlan,
        keyId: paymentSettings.razorpayKeyId,
        customerName: inputShowroom || "Valued Customer",
        onSuccess: (paymentId: string) => {
          finalizeActivation(selectedPlan, "razorpay", paymentId);
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (e: any) {
      setIsProcessing(false);
      setErrorMessage(e.message || "Failed to start Razorpay checkout. Please pay with UPI QR.");
      setPaymentMethod("upi_qr");
    }
  };

  // Finalize & Activate Subscription
  const finalizeActivation = (
    plan: SubscriptionPlan,
    method: "razorpay" | "upi_qr",
    refId: string
  ) => {
    const startDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + plan.durationDays * 86400000).toISOString();
    const invNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newSub: ActiveSubscription = {
      planId: plan.id,
      planName: plan.name,
      amount: plan.amount,
      durationDays: plan.durationDays,
      startDate,
      expiryDate,
      paymentMethod: method,
      transactionRef: refId || `UPI-${Date.now()}`,
      status: "active",
      invoiceNumber: invNumber,
      showroomName: inputShowroom.trim() || showroomName,
    };

    saveActiveSubscription(newSub);
    setActiveSub(newSub);

    if (plan.persona === "b2b") {
      setShowroomMode(true);
      if (inputShowroom.trim()) {
        setShowroomName(inputShowroom.trim());
      }
    }

    setIsProcessing(false);
    setViewState("invoice");

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: ["#D4AF37", "#FFE484", "#FAF8F5", "#8E182A", "#10B981"],
    });
  };

  const handleVerifyUpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setErrorMessage("Please enter a valid 6 to 12 digit UPI Transaction Reference / UTR Number from your banking app.");
      return;
    }

    finalizeActivation(selectedPlan, "upi_qr", utrNumber.trim());
  };

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(paymentSettings.merchantUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-4xl bg-obsidian-900 border border-gold-subtle rounded-3xl shadow-gold-glow-lg overflow-hidden my-auto max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-obsidian-950 via-obsidian-900 to-obsidian-950 border-b border-gold-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewState !== "catalog" ? (
              <button
                onClick={() => setViewState("catalog")}
                className="p-2 rounded-xl bg-obsidian-800 text-gold-300 hover:text-white border border-gold-900/60"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-gold-600 to-gold-400 text-obsidian-950 shadow-gold-glow">
                <Crown className="w-5 h-5 font-bold" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gold-400">
                  SwarnaTry SaaS Platform
                </span>
                {activeSub && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Active: {activeSub.planName}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-cinzel text-ivory">
                {viewState === "catalog"
                  ? "Unlock Royal Virtual Try-On Access"
                  : viewState === "checkout"
                  ? `Checkout: ${selectedPlan?.name}`
                  : "Digital Subscription Tax Invoice"}
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

        {/* VIEW 1: CATALOG TIERS */}
        {viewState === "catalog" && (
          <>
            {/* Persona Switcher Tabs */}
            <div className="px-6 pt-5 pb-2 flex items-center justify-center">
              <div className="bg-obsidian-950 p-1.5 rounded-2xl border border-gold-900/80 flex items-center gap-2">
                <button
                  onClick={() => setActivePersona("b2c")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activePersona === "b2c"
                      ? "bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 shadow-gold-glow"
                      : "text-ivory-muted hover:text-ivory"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>B2C Bridal & Shopper Pass</span>
                </button>

                <button
                  onClick={() => setActivePersona("b2b")}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activePersona === "b2b"
                      ? "bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 shadow-gold-glow"
                      : "text-ivory-muted hover:text-ivory"
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>B2B Goldsmith & Showroom Kiosk</span>
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {activePersona === "b2c" ? (
                /* B2C Tiers */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Free Tier */}
                  <div
                    data-tier="free"
                    className="tier-card rounded-2xl bg-obsidian-950/70 border border-gold-900/50 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-ivory-muted uppercase tracking-wider">
                        Discovery
                      </div>
                      <h3 className="font-cinzel text-xl font-bold text-ivory">
                        Free Guest Pass
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-cinzel text-ivory">
                          ₹0
                        </span>
                        <span className="text-xs text-ivory-muted">/ forever</span>
                      </div>
                      <p className="text-xs text-ivory-muted">
                        Explore the heritage jewelry catalog and try on standard
                        pieces with live camera.
                      </p>
                      <ul className="space-y-2 text-xs text-ivory-soft pt-2">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Full 8+ Heritage Catalog Access</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Live 22K Goldsmith Estimator</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Mode 1: Live AR Camera</span>
                        </li>
                        <li className="flex items-center gap-2 text-ivory-muted/60">
                          <span>✕ No custom screenshot uploads</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={onClose}
                      className="w-full py-2.5 rounded-xl border border-gold-900/60 bg-obsidian-900 text-ivory hover:text-gold-200 text-xs font-semibold"
                    >
                      Included Free
                    </button>
                  </div>

                  {/* Weekly Bridal Pass */}
                  <div
                    data-tier="weekly"
                    className="tier-card relative rounded-2xl bg-gradient-to-b from-obsidian-850 to-obsidian-950 border-2 border-gold-400 p-5 flex flex-col justify-between space-y-4 shadow-gold-glow"
                  >
                    <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gold-500 text-obsidian-950 text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                        Bridal Shopping Pass
                      </div>
                      <h3 className="font-cinzel text-xl font-bold text-gold-gradient">
                        Weekly Bridal Pass
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-cinzel text-gold-bright">
                          ₹199
                        </span>
                        <span className="text-xs text-ivory-muted">/ 7 days</span>
                      </div>
                      <p className="text-xs text-ivory-muted">
                        Perfect for brides and families visiting jewelry showrooms this upcoming weekend.
                      </p>
                      <ul className="space-y-2 text-xs text-ivory-soft pt-2">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-gold-400 shrink-0" />
                          <span>Unlimited Custom Photo Match Try-Ons</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-gold-400 shrink-0" />
                          <span>Upload Any Screenshot from Instagram & WhatsApp</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-gold-400 shrink-0" />
                          <span>Automatic AI Background Removal</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(SUBSCRIPTION_PLANS["b2c-weekly"])}
                      className="btn-gold-primary w-full py-2.5 rounded-xl text-xs font-bold"
                    >
                      Unlock ₹199 Bridal Pass
                    </button>
                  </div>

                  {/* Monthly Trousseau Pass */}
                  <div
                    data-tier="monthly"
                    className="tier-card rounded-2xl bg-obsidian-950/70 border border-gold-900/50 p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-ivory-muted uppercase tracking-wider">
                        Full Season
                      </div>
                      <h3 className="font-cinzel text-xl font-bold text-ivory">
                        Monthly Trousseau Pass
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold font-cinzel text-ivory">
                          ₹499
                        </span>
                        <span className="text-xs text-ivory-muted">/ month</span>
                      </div>
                      <p className="text-xs text-ivory-muted">
                        For multiple wedding events (Engagement, Muhurtham, Sangeet, Reception).
                      </p>
                      <ul className="space-y-2 text-xs text-ivory-soft pt-2">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Everything in Weekly Pass</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>5-Piece Bridal Combo Set Layering</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Family Reverse Budget Allocator</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(SUBSCRIPTION_PLANS["b2c-monthly"])}
                      className="w-full py-2.5 rounded-xl border border-gold-500/40 bg-obsidian-900 text-gold-300 hover:bg-gold-500/10 text-xs font-semibold transition-colors"
                    >
                      Unlock ₹499 Monthly Pass
                    </button>
                  </div>
                </div>
              ) : (
                /* B2B Showroom Kiosk */
                <div className="space-y-6">
                  <div
                    data-tier="showroom"
                    className="tier-card rounded-3xl bg-gradient-to-br from-obsidian-950 via-obsidian-900 to-obsidian-950 border-2 border-gold-500/50 p-6 sm:p-8 shadow-gold-glow space-y-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold-900/60 pb-6">
                      <div>
                        <div className="flex items-center gap-2 text-gold-400 text-xs font-semibold uppercase tracking-wider">
                          <Store className="w-4 h-4" />
                          <span>Jewelry Showroom Kiosk Mode</span>
                        </div>
                        <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-gold-gradient mt-1">
                          SwarnaTry Showroom Pro & Kiosk License
                        </h3>
                        <p className="text-xs sm:text-sm text-ivory-muted mt-1 max-w-xl">
                          Deploy SwarnaTry on showroom iPad/Tablet counters. Let customers virtually try on 100+ ornaments and receive branded WhatsApp estimates with your shop name.
                        </p>
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        <div className="text-3xl font-bold font-cinzel text-gold-bright">
                          ₹2,999
                          <span className="text-xs font-normal text-ivory-muted">/ month</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">
                          or ₹29,999/year (Save 20%)
                        </div>
                      </div>
                    </div>

                    {/* Showroom Interactive White-Label Configurator */}
                    <div className="bg-obsidian-950/80 rounded-2xl p-4 sm:p-5 border border-gold-subtle space-y-3">
                      <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider block">
                        ⚡ Live White-Label Branding Setup
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-xs text-ivory-muted">
                            Your Showroom / Brand Name:
                          </label>
                          <input
                            type="text"
                            value={inputShowroom}
                            onChange={(e) => setInputShowroom(e.target.value)}
                            placeholder="e.g. Sri Krishna Heritage Jewellers"
                            className="w-full bg-obsidian-900 border border-gold-500/40 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-ivory focus:outline-none focus:border-gold-400"
                          />
                        </div>

                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => handleSelectPlan(SUBSCRIPTION_PLANS["b2b-kiosk-monthly"])}
                            className="btn-gold-primary flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Monthly Kiosk (₹2,999)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* B2B Feature Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-obsidian-950/60 border border-gold-900/40 space-y-1.5">
                        <div className="font-semibold text-gold-300 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4" />
                          <span>iPad & Tablet Kiosk</span>
                        </div>
                        <p className="text-ivory-muted text-[11px]">
                          Locks customer session in kiosk view with zero distraction and instant touch controls.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-obsidian-950/60 border border-gold-900/40 space-y-1.5">
                        <div className="font-semibold text-gold-300 flex items-center gap-1.5">
                          <Share2 className="w-4 h-4" />
                          <span>A4 & 80mm Receipts</span>
                        </div>
                        <p className="text-ivory-muted text-[11px]">
                          Generates instant thermal receipts and A4 quotations with your store GSTIN and phone number.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-obsidian-950/60 border border-gold-900/40 space-y-1.5">
                        <div className="font-semibold text-gold-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Old Gold Engine</span>
                        </div>
                        <p className="text-ivory-muted text-[11px]">
                          Indian trade-in melting calculations with hallmark/KDM solder deductions and Karigar orders.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* VIEW 2: CHECKOUT & INSTANT UPI / RAZORPAY GATEWAY */}
        {viewState === "checkout" && selectedPlan && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Plan Summary */}
              <div className="bg-obsidian-950 rounded-2xl p-5 border border-gold-900/60 space-y-4">
                <div className="flex items-center justify-between border-b border-gold-900/40 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold">
                      Selected Plan
                    </span>
                    <h3 className="font-cinzel text-xl font-bold text-gold-200">
                      {selectedPlan.name}
                    </h3>
                  </div>
                  <span className="text-2xl font-cinzel font-bold text-gold-bright">
                    {formatINR(selectedPlan.amount)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-ivory-muted">Validity Duration:</span>
                    <span className="font-semibold text-ivory">{selectedPlan.durationDays} Days</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-ivory-muted">Merchant Name:</span>
                    <span className="font-semibold text-ivory">{paymentSettings.merchantName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-ivory-muted">Official Merchant UPI ID:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-gold-300">{paymentSettings.merchantUpiId}</span>
                      <button
                        onClick={handleCopyUpiId}
                        className="text-ivory-muted hover:text-white"
                        title="Copy UPI ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Features included */}
                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-gold-400 uppercase tracking-wider block mb-2">
                    Included Benefits:
                  </span>
                  <ul className="space-y-1.5 text-xs text-ivory-soft">
                    {selectedPlan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Payment Methods */}
              <div className="space-y-4">
                {/* Method Switcher */}
                <div className="grid grid-cols-2 gap-2 bg-obsidian-950 p-1 rounded-xl border border-gold-900/60">
                  <button
                    onClick={() => setPaymentMethod("upi_qr")}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      paymentMethod === "upi_qr"
                        ? "bg-gold-600 text-obsidian-950"
                        : "text-ivory-muted hover:text-ivory"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Instant UPI QR</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod("razorpay");
                      handleRazorpayPay();
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      paymentMethod === "razorpay"
                        ? "bg-gold-600 text-obsidian-950"
                        : "text-ivory-muted hover:text-ivory"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Razorpay Standard</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                    {errorMessage}
                  </div>
                )}

                {/* UPI QR Presentation */}
                {paymentMethod === "upi_qr" && (
                  <div className="bg-obsidian-950 rounded-2xl p-5 border border-gold-900/60 space-y-4 text-center">
                    <div className="inline-block p-2 bg-white rounded-2xl shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={upiQrDataUrl}
                        alt="UPI Payment QR Code"
                        className="w-44 h-44 object-contain mx-auto"
                      />
                    </div>

                    <div>
                      <span className="text-xs text-gold-300 font-semibold block">
                        Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                      </span>
                      <span className="text-[11px] text-ivory-muted">
                        Exact Amount: <strong>{formatINR(selectedPlan.amount)}</strong>
                      </span>
                    </div>

                    {/* Mobile 1-Click Intent Button */}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = upiIntentUrl;
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/40"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Open UPI App (GPay / PhonePe / Paytm)</span>
                    </button>

                    {/* UTR Verification Form */}
                    <form onSubmit={handleVerifyUpiSubmit} className="pt-2 border-t border-gold-900/40 space-y-2 text-left">
                      <label className="text-[11px] text-ivory-muted block">
                        Enter 12-Digit Bank Reference / UTR Number:
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          placeholder="Enter 12-Digit UTR / Reference Number (e.g. 428901234567)"
                          className="flex-1 bg-obsidian-900 border border-gold-500/40 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-400 font-mono"
                        />
                        <button
                          type="submit"
                          className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-3 py-2 rounded-xl text-xs shrink-0 transition-colors"
                        >
                          Verify & Activate
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Razorpay Launch Option */}
                {paymentMethod === "razorpay" && (
                  <div className="bg-obsidian-950 rounded-2xl p-5 border border-gold-900/60 text-center space-y-4">
                    <CreditCard className="w-10 h-10 text-gold-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-semibold text-ivory">Razorpay Secure Checkout</h4>
                      <p className="text-xs text-ivory-muted mt-1">
                        Pay via Credit Card, Debit Card, Netbanking, or UPI via Razorpay Gateway.
                      </p>
                    </div>

                    <button
                      onClick={handleRazorpayPay}
                      disabled={isProcessing}
                      className="btn-gold-primary w-full py-3 rounded-xl text-xs font-bold"
                    >
                      {isProcessing ? "Opening Gateway..." : `Pay ${formatINR(selectedPlan.amount)} with Razorpay`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: DIGITAL TAX INVOICE & RECEIPT */}
        {viewState === "invoice" && activeSub && (
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-center">
            <div className="max-w-md mx-auto bg-obsidian-950 rounded-3xl p-6 border border-gold-500/50 shadow-2xl space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-gold-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-gold-900/40 text-gold-300">
                    <Receipt className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-cinzel font-bold text-sm text-gold-200">
                      SwarnaTry SaaS Tax Invoice
                    </h4>
                    <span className="text-[10px] text-ivory-muted font-mono">
                      {activeSub.invoiceNumber}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                  PAID & ACTIVE
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ivory-muted">Plan Unlocked:</span>
                  <span className="font-semibold text-gold-200">{activeSub.planName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ivory-muted">Customer / Showroom:</span>
                  <span className="font-semibold text-ivory">{activeSub.showroomName || "Showroom Guest"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ivory-muted">Payment Reference:</span>
                  <span className="font-mono text-emerald-400">{activeSub.transactionRef}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-ivory-muted">Valid Until:</span>
                  <span className="font-semibold text-ivory">
                    {new Date(activeSub.expiryDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-t border-gold-900/60 text-sm font-bold">
                  <span className="text-ivory">Total Amount Paid:</span>
                  <span className="text-gold-bright font-cinzel">{formatINR(activeSub.amount)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-obsidian-850 hover:bg-obsidian-800 text-gold-300 font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-gold-900/60 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Invoice</span>
                </button>

                <button
                  onClick={onClose}
                  className="flex-1 btn-gold-primary py-2 px-3 rounded-xl text-xs font-bold"
                >
                  Launch App Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
