"use client";

import QRCode from "qrcode";

export interface SubscriptionPlan {
  id: string;
  name: string;
  teluguName?: string;
  amount: number;
  durationDays: number;
  billingPeriodLabel: string;
  persona: "b2c" | "b2b";
  features: string[];
  isPopular?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  "b2c-weekly": {
    id: "b2c-weekly",
    name: "Weekly Bridal Pass",
    teluguName: "వారం రోజుల పెళ్లి పాస్",
    amount: 199,
    durationDays: 7,
    billingPeriodLabel: "/ 7 days",
    persona: "b2c",
    features: [
      "Unlimited Custom Photo Match Try-Ons",
      "Upload Any Screenshot from Instagram & WhatsApp",
      "Automatic AI Background Removal",
      "High-Res 1080p Comparison Cards",
    ],
    isPopular: true,
  },
  "b2c-monthly": {
    id: "b2c-monthly",
    name: "Monthly Trousseau Pass",
    teluguName: "నెలవారీ పెళ్లి నగల పాస్",
    amount: 499,
    durationDays: 30,
    billingPeriodLabel: "/ month",
    persona: "b2c",
    features: [
      "Everything in Weekly Pass",
      "5-Piece Bridal Combo Set Layering",
      "Family Reverse Budget Planner",
      "Multi-person Bridal Party Try-On",
      "Instant WhatsApp Quote Sharing",
    ],
  },
  "b2b-kiosk-monthly": {
    id: "b2b-kiosk-monthly",
    name: "Showroom Pro Kiosk (Monthly)",
    teluguName: "షోరూమ్ ప్రో కియోస్క్ (నెలవారీ)",
    amount: 2999,
    durationDays: 30,
    billingPeriodLabel: "/ month",
    persona: "b2b",
    features: [
      "Dedicated Full-Screen iPad/Tablet Kiosk View",
      "White-Label Showroom Branding & Logo",
      "Old Gold Exchange & Melting Deduction Engine",
      "Printable A4 Royal Quotations & 80mm Thermal POS Receipts",
      "5-Stage Karigar Workshop Order Ledger",
      "Unlimited Real Jewelry Uploads & Chroma Isolator",
    ],
    isPopular: true,
  },
  "b2b-kiosk-annual": {
    id: "b2b-kiosk-annual",
    name: "Showroom Pro Kiosk (Annual)",
    teluguName: "షోరూమ్ ప్రో కియోస్క్ (వార్షిక ప్లాన్)",
    amount: 29999,
    durationDays: 365,
    billingPeriodLabel: "/ year (Save 20%)",
    persona: "b2b",
    features: [
      "Everything in Monthly Kiosk Plan",
      "2 Months Free (Save ₹6,000)",
      "Supabase Cloud Real-Time Bullion Sync",
      "Priority 24/7 Goldsmith Onboarding Support",
      "Multi-Device Showroom Catalog Sync",
    ],
  },
};

export interface PaymentSettings {
  merchantUpiId: string;
  merchantName: string;
  razorpayKeyId: string;
  adminPin: string;
  showroomPhone: string;
  showroomGstin: string;
  showroomAddress: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  merchantUpiId: "swarnatry@upi",
  merchantName: "SwarnaTry Jewellers SaaS",
  razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  adminPin: "2224",
  showroomPhone: "+91 98765 43210",
  showroomGstin: "36AAACS1234F1Z8",
  showroomAddress: "Main Road, Goldsmith Street, Jewellers Colony, Hyderabad",
};

const PAYMENT_SETTINGS_KEY = "swarnatry_payment_settings";
const ACTIVE_SUB_KEY = "swarnatry_active_subscription";

export function getPaymentSettings(): PaymentSettings {
  if (typeof window === "undefined") return DEFAULT_PAYMENT_SETTINGS;
  try {
    const raw = localStorage.getItem(PAYMENT_SETTINGS_KEY);
    if (!raw) return DEFAULT_PAYMENT_SETTINGS;
    return { ...DEFAULT_PAYMENT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to load payment settings:", e);
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

export function savePaymentSettings(settings: Partial<PaymentSettings>): PaymentSettings {
  if (typeof window === "undefined") return DEFAULT_PAYMENT_SETTINGS;
  try {
    const curr = getPaymentSettings();
    const updated = { ...curr, ...settings };
    localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error("Failed to save payment settings:", e);
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

export interface ActiveSubscription {
  planId: string;
  planName: string;
  amount: number;
  durationDays: number;
  startDate: string;
  expiryDate: string;
  paymentMethod: "razorpay" | "upi_qr" | "manual_kiosk";
  transactionRef: string;
  status: "active" | "pending_verification";
  invoiceNumber: string;
  showroomName?: string;
}

export function getActiveSubscription(): ActiveSubscription | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SUB_KEY);
    if (!raw) return null;
    const sub: ActiveSubscription = JSON.parse(raw);
    const now = new Date().getTime();
    const expiry = new Date(sub.expiryDate).getTime();
    if (now > expiry) {
      // Expired
      return null;
    }
    return sub;
  } catch (e) {
    return null;
  }
}

export function saveActiveSubscription(sub: ActiveSubscription): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_SUB_KEY, JSON.stringify(sub));
    window.dispatchEvent(new Event("swarnatry_subscription_updated"));
  } catch (e) {
    console.error("Failed to save active subscription:", e);
  }
}

export function clearActiveSubscription(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVE_SUB_KEY);
    window.dispatchEvent(new Event("swarnatry_subscription_updated"));
  } catch (e) {
    console.error("Failed to clear subscription:", e);
  }
}

/**
 * Builds standard UPI payment intent URL
 * e.g. upi://pay?pa=swarnatry@upi&pn=SwarnaTry&am=199&cu=INR&tn=Weekly Bridal Pass
 */
export function generateUpiUrl(params: {
  upiId: string;
  merchantName: string;
  amount: number;
  note: string;
  transactionRef?: string;
}): string {
  const pa = encodeURIComponent(params.upiId);
  const pn = encodeURIComponent(params.merchantName);
  const am = params.amount.toFixed(2);
  const tn = encodeURIComponent(params.note);
  const tr = params.transactionRef ? `&tr=${encodeURIComponent(params.transactionRef)}` : "";
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}${tr}`;
}

/**
 * Generates high-contrast QR Code base64 Data URL for instant mobile UPI scanning
 */
export async function generateUpiQrCode(upiUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(upiUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });
  } catch (e) {
    console.error("Failed to generate UPI QR:", e);
    return "";
  }
}

/**
 * Dynamically loads Razorpay Standard Checkout SDK
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Failed to load Razorpay script from CDN.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Launches Razorpay Standard modal
 */
export async function launchRazorpayCheckout(params: {
  plan: SubscriptionPlan;
  keyId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (paymentId: string) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !(window as any).Razorpay) {
    throw new Error("Razorpay SDK could not be loaded. Please use instant UPI payment fallback.");
  }

  const options = {
    key: params.keyId,
    amount: params.plan.amount * 100, // amount in paise
    currency: "INR",
    name: "SwarnaTry SaaS",
    description: params.plan.name,
    image: "/icon.svg",
    prefill: {
      name: params.customerName || "Showroom Guest",
      email: params.customerEmail || "customer@swarnatry.in",
      contact: params.customerPhone || "9876543210",
    },
    theme: {
      color: "#D4AF37",
    },
    handler: function (response: any) {
      if (response && response.razorpay_payment_id) {
        params.onSuccess(response.razorpay_payment_id);
      }
    },
    modal: {
      ondismiss: function () {
        if (params.onDismiss) params.onDismiss();
      },
    },
  };

  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
