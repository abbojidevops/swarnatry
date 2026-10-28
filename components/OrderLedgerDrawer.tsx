"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  X,
  Share2,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronRight,
  Flame,
  Gem,
  Sparkles,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  User,
  Coins,
  Send,
  Download,
  Upload,
} from "lucide-react";
import {
  GoldsmithOrder,
  KarigarStage,
  KARIGAR_STAGES,
  getStoredOrders,
  saveStoredOrder,
  updateStoredOrderStage,
  deleteStoredOrder,
  updateOrderHuidCode,
  generateKarigarWhatsAppMessage,
  exportOrdersJSON,
  importOrdersJSON,
} from "@/lib/orderStore";
import { formatINR, sanitizePhoneNumber } from "@/lib/goldMath";
import { useLanguage } from "@/context/LanguageContext";

interface OrderLedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  showroomName: string;
  initialNewOrderData?: Partial<GoldsmithOrder> | null;
  onClearInitialOrderData?: () => void;
}

export const OrderLedgerDrawer: React.FC<OrderLedgerDrawerProps> = ({
  isOpen,
  onClose,
  showroomName,
  initialNewOrderData,
  onClearInitialOrderData,
}) => {
  const [orders, setOrders] = useState<GoldsmithOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "new">("list");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const { language, setLanguage, isTe } = useLanguage();
  const [isAdvancingOrderId, setIsAdvancingOrderId] = useState<string | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    orderId?: string;
    isAll?: boolean;
  }>({ isOpen: false });
  const [typedConfirmWord, setTypedConfirmWord] = useState<string>("");

  // New Order Form State
  const [custName, setCustName] = useState<string>("");
  const [custPhone, setCustPhone] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");
  const [advanceCash, setAdvanceCash] = useState<string>("50000");
  const [advanceOldGold, setAdvanceOldGold] = useState<string>("0");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [karigarName, setKarigarName] = useState<string>("Master Craftsman");
  const [huidInput, setHuidInput] = useState<string>("");

  // Load orders on mount & when opened
  useEffect(() => {
    if (isOpen) {
      setOrders(getStoredOrders());
    }
  }, [isOpen]);

  // Handle incoming new order prefill (e.g. from calculator or bridal drawer)
  useEffect(() => {
    if (initialNewOrderData && isOpen) {
      setActiveTab("new");
      if (initialNewOrderData.customerName) setCustName(initialNewOrderData.customerName);
      if (initialNewOrderData.customerPhone) setCustPhone(initialNewOrderData.customerPhone);
      if (initialNewOrderData.customNotes) setCustomNotes(initialNewOrderData.customNotes);
      if (initialNewOrderData.deliveryDate) setDeliveryDate(initialNewOrderData.deliveryDate);
    }
  }, [initialNewOrderData, isOpen]);

  // Stage advancement handler with atomic state assertion & transient lock
  const handleAdvanceStage = (orderId: string, nextStage: KarigarStage, currentStage: KarigarStage) => {
    if (isAdvancingOrderId === orderId) return;
    setIsAdvancingOrderId(orderId);
    try {
      const updated = updateStoredOrderStage(orderId, nextStage, undefined, currentStage);
      if (updated) {
        setOrders(getStoredOrders());
      }
    } finally {
      setTimeout(() => {
        setIsAdvancingOrderId(null);
      }, 300);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportOrdersJSON();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SwarnaTry_AutoBackup_PreDelete_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Safe delete with automated backup and typed confirmation
  const triggerDeleteOrder = (orderId: string) => {
    handleExportJSON();
    setDeleteConfirmModal({ isOpen: true, orderId, isAll: false });
    setTypedConfirmWord("");
  };

  const triggerClearAllOrders = () => {
    handleExportJSON();
    setDeleteConfirmModal({ isOpen: true, isAll: true });
    setTypedConfirmWord("");
  };

  const executeConfirmedDelete = () => {
    if (typedConfirmWord !== "DELETE") return;
    if (deleteConfirmModal.isAll) {
      if (typeof window !== "undefined") {
        localStorage.setItem("swarnatry_goldsmith_orders_v1", JSON.stringify([]));
        setOrders([]);
      }
    } else if (deleteConfirmModal.orderId) {
      deleteStoredOrder(deleteConfirmModal.orderId);
      setOrders(getStoredOrders());
    }
    setDeleteConfirmModal({ isOpen: false });
    setTypedConfirmWord("");
  };

  const handleSendWhatsAppUpdate = (order: GoldsmithOrder) => {
    const cleanPhone = sanitizePhoneNumber(order.customerPhone);
    let msg = generateKarigarWhatsAppMessage(order, showroomName, language);
    if (msg.length > 1750) {
      msg = msg.substring(0, 1750) + "\n...";
    }
    const phoneParam = cleanPhone ? `phone=${cleanPhone}&` : "";
    window.open(`https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const count = importOrdersJSON(content);
        if (count > 0) {
          setOrders(getStoredOrders());
          alert(`Successfully imported ${count} orders!`);
        } else {
          alert("Invalid orders JSON file format.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) return;

    const items = initialNewOrderData?.items || [
      {
        id: "SW-ORD-CUSTOM",
        name: "Custom Handcrafted Bridal Gold Design",
        category: "Custom Jewelry",
        grams: 36,
        purity: "22K",
        imageUri: "",
        price: 315000,
      },
    ];

    const grandTotal = initialNewOrderData?.grandTotalEstimate || 315000;
    const advanceCashNum = parseFloat(advanceCash) || 0;
    const advanceOldGoldNum = parseFloat(advanceOldGold) || 0;
    const balance = Math.max(0, grandTotal - advanceCashNum);

    const newOrder: GoldsmithOrder = {
      id: `SW-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      customerName: custName,
      customerPhone: custPhone,
      deliveryDate: deliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      eventDate,
      stage: "booked",
      stageUpdatedAt: new Date().toISOString(),
      isComboSet: Boolean(initialNewOrderData?.isComboSet),
      items,
      totalGrossGrams: initialNewOrderData?.totalGrossGrams || 36,
      totalNetGrams: initialNewOrderData?.totalNetGrams || 34.5,
      grandTotalEstimate: grandTotal,
      advanceCashPaid: advanceCashNum,
      advanceOldGoldGrams: advanceOldGoldNum,
      balancePayable: balance,
      customNotes,
      karigarName,
      huidCode: huidInput ? huidInput.toUpperCase().trim() : undefined,
      stageHistory: [
        {
          stage: "booked",
          timestamp: new Date().toISOString(),
          note: `Order booked with advance ${formatINR(advanceCashNum)}`,
        },
      ],
    };

    saveStoredOrder(newOrder);
    setOrders(getStoredOrders());
    setActiveTab("list");
    if (onClearInitialOrderData) onClearInitialOrderData();
  };

  // Filter & Search
  const filteredOrders = orders.filter((o) => {
    if (filterStage !== "all" && o.stage !== filterStage) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchId = o.id.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      return matchName || matchId || matchPhone;
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-obsidian-950/85 backdrop-blur-md flex justify-end transition-opacity animate-in fade-in">
      <div className="w-full max-w-2xl bg-obsidian-900 border-l border-gold-900/60 shadow-2xl flex flex-col h-full text-ivory">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gold-900/60 bg-obsidian-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-950/60 border border-gold-700/50 flex items-center justify-center text-gold-300">
              <ClipboardList className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel font-bold text-lg text-gold-300">
                  {isTe ? "స్వర్ణకారుల వర్క్ ఆర్డర్ బుక్" : "Goldsmith Karigar Tracker"}
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30">
                  {orders.length} {isTe ? "ఆర్డర్లు" : "Orders"}
                </span>
              </div>
              <p className="text-xs text-ivory-muted">
                {isTe
                  ? "ఆర్డర్ బుకింగ్, మూస తయారీ, రాళ్ల అమరిక & హాల్‌మార్క్ లైవ్ ట్రాకింగ్"
                  : "Track custom orders across Melting, Nakshi setting & Hallmarking stages"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="text-xs bg-obsidian-800 border border-gold-900/60 text-gold-300 px-2.5 py-1.5 rounded-lg font-medium hover:border-gold-500 flex items-center gap-1 transition-colors"
              title="Backup / Export Orders JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup / Export</span>
            </button>

            <label
              className="cursor-pointer text-xs bg-obsidian-800 border border-gold-900/60 text-gold-300 px-2.5 py-1.5 rounded-lg font-medium hover:border-gold-500 flex items-center gap-1 transition-colors"
              title="Restore / Import Orders JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restore / Import</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={() => setLanguage(language === "en" ? "te" : "en")}
              className="text-xs bg-obsidian-800 border border-gold-900/60 text-gold-300 px-2.5 py-1.5 rounded-lg font-medium hover:border-gold-500"
            >
              {language === "en" ? "తెలుగు" : "English"}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-obsidian-800 text-ivory-muted hover:text-white flex items-center justify-center border border-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="p-3 bg-obsidian-950/60 border-b border-gold-900/40 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex bg-obsidian-900 border border-gold-900/60 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === "list"
                  ? "bg-gold-500 text-obsidian-950 font-bold"
                  : "text-ivory-muted hover:text-ivory"
              }`}
            >
              <span>{isTe ? "యాక్టివ్ ఆర్డర్లు" : "Active Orders"} ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("new")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                activeTab === "new"
                  ? "bg-gold-500 text-obsidian-950 font-bold"
                  : "text-ivory-muted hover:text-ivory"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isTe ? "కొత్త ఆర్డర్ బుకింగ్" : "Book New Order"}</span>
            </button>
          </div>

          {activeTab === "list" && (
            <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-gold-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name / order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-obsidian-900 border border-gold-900/50 rounded-xl pl-8 pr-3 py-1 text-xs text-ivory focus:outline-none focus:border-gold-500"
                />
              </div>

              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="bg-obsidian-900 border border-gold-900/50 rounded-xl px-2 py-1 text-[11px] text-gold-300 focus:outline-none"
              >
                <option value="all">All Stages</option>
                <option value="booked">1. Booked</option>
                <option value="melting">2. Melting</option>
                <option value="setting">3. Stone Setting</option>
                <option value="polishing">4. Polishing</option>
                <option value="ready">5. Ready</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: ORDERS LIST & KARIGAR PIPELINE */}
          {activeTab === "list" && (
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-xs text-ivory-muted space-y-2">
                  <ClipboardList className="w-10 h-10 text-gold-500/30 mx-auto" />
                  <p>{isTe ? "ఆర్డర్లు ఏవీ కనుగొనబడలేదు." : "No orders found matching your filter."}</p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const stageCfg = KARIGAR_STAGES[order.stage];
                  const stageKeys: KarigarStage[] = ["booked", "melting", "setting", "polishing", "ready"];
                  const currentIdx = stageKeys.indexOf(order.stage);

                  return (
                    <div
                      key={order.id}
                      data-order-id={order.id}
                      className="bg-obsidian-850 border border-gold-900/60 rounded-2xl p-4 shadow-lg space-y-3.5"
                    >
                      {/* Order Card Top Bar */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-ivory">
                              {order.customerName}
                            </h4>
                            <span className="font-mono text-[10px] text-gold-300 bg-obsidian-950 px-2 py-0.5 rounded border border-gold-500/30">
                              {order.id}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-ivory-muted mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gold-400" />
                              {order.customerPhone}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gold-400" />
                              Due: <strong className="text-gold-200">{order.deliveryDate}</strong>
                            </span>
                          </div>
                        </div>

                        {/* WhatsApp Update Button */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSendWhatsAppUpdate(order)}
                            className="bg-emerald-700 hover:bg-emerald-600 text-white font-medium px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors"
                            title="Send Live WhatsApp Status Update"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>WhatsApp Status</span>
                          </button>

                          <button
                            onClick={() => triggerDeleteOrder(order.id)}
                            className="p-1.5 text-ivory-muted hover:text-red-400 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items & Financial Breakdown */}
                      <div className="bg-obsidian-950/70 rounded-xl p-3 border border-gold-900/40 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gold-300 font-semibold truncate max-w-[280px]">
                            {order.items.map((i) => i.name).join(", ")}
                          </span>
                          <span className="text-emerald-400 font-bold font-mono">
                            {formatINR(order.grandTotalEstimate)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-white/5 text-[11px] text-ivory-muted">
                          <div>
                            Gross: <strong className="text-ivory">{order.totalGrossGrams}g</strong>
                          </div>
                          <div>
                            Adv: <strong className="text-gold-300">{formatINR(order.advanceCashPaid)}</strong>
                          </div>
                          <div>
                            Balance: <strong className="text-amber-300">{formatINR(order.balancePayable)}</strong>
                          </div>
                        </div>

                        {order.customNotes && (
                          <p className="text-[10px] text-ivory-muted/80 italic pt-1 border-t border-white/5">
                            Karigar Note: &ldquo;{order.customNotes}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* 5-Stage Karigar Progress Stepper */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-ivory-muted uppercase tracking-wider text-[10px] font-bold">
                            Production Stage:
                          </span>
                          <span className="text-gold-300 font-semibold">
                            {isTe ? stageCfg.teluguLabel : stageCfg.label} ({stageCfg.stepNumber}/5)
                          </span>
                        </div>

                        {/* Visual Stage Progress Dots */}
                        <div className="grid grid-cols-5 gap-1.5">
                          {stageKeys.map((sKey, sIdx) => {
                            const isCompleted = sIdx <= currentIdx;
                            const isCurrent = sIdx === currentIdx;
                            const cfg = KARIGAR_STAGES[sKey];

                            return (
                              <button
                                key={sKey}
                                data-stage={sKey}
                                disabled={isAdvancingOrderId === order.id}
                                onClick={() => handleAdvanceStage(order.id, sKey, order.stage)}
                                className={`stage-step p-1.5 rounded-lg border text-center transition-all disabled:opacity-50 ${
                                  isCurrent
                                    ? "bg-gold-500 text-obsidian-950 border-gold-400 font-bold shadow-gold-glow"
                                    : isCompleted
                                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
                                    : "bg-obsidian-950 text-ivory-muted/40 border-white/5 opacity-50"
                                }`}
                                title={`Click to set stage to ${cfg.label}`}
                              >
                                <span className="block text-[9px] font-mono leading-none">
                                  Step {sIdx + 1}
                                </span>
                                <span className="block text-[10px] truncate mt-0.5">
                                  {isTe ? cfg.teluguLabel.split(" ")[0] : cfg.label.split(" ")[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Explicit Next Stage Advance Button (Hidden when status is READY) */}
                        {currentIdx < stageKeys.length - 1 && order.stage !== "ready" && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              disabled={isAdvancingOrderId === order.id}
                              onClick={() => handleAdvanceStage(order.id, stageKeys[currentIdx + 1], order.stage)}
                              className="bg-gold-500 hover:bg-gold-400 text-obsidian-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <span>
                                {isAdvancingOrderId === order.id
                                  ? (isTe ? "నమోదు అవుతోంది..." : "Updating...")
                                  : isTe
                                  ? `${KARIGAR_STAGES[stageKeys[currentIdx + 1]].teluguLabel} కి తరలించు`
                                  : `Advance to ${KARIGAR_STAGES[stageKeys[currentIdx + 1]].label}`}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* BIS 916 HUID Hallmarking Code Tag & Input (Phase 7) */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-ivory-muted flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-amber-900/60 border border-amber-500/40 text-[9px] font-bold text-amber-300 flex items-center justify-center">
                              BIS
                            </span>
                            <span>BIS 916 HUID Code:</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder="e.g. HD8792"
                              defaultValue={order.huidCode || ""}
                              onBlur={(e) => {
                                const val = e.target.value.trim().toUpperCase();
                                if (val !== (order.huidCode || "")) {
                                  updateOrderHuidCode(order.id, val);
                                  setOrders(getStoredOrders());
                                }
                              }}
                              className="w-24 bg-obsidian-950 border border-gold-900/60 rounded px-2 py-0.5 text-center text-xs font-mono font-bold text-gold-300 uppercase focus:outline-none focus:border-gold-400"
                            />
                            {order.huidCode && (
                              <span className="text-[10px] text-emerald-400 font-semibold">✓ Stamped</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: BOOK NEW WORK ORDER FORM */}
          {activeTab === "new" && (
            <form onSubmit={handleCreateOrder} className="space-y-4 animate-in fade-in">
              <div className="bg-obsidian-850 border border-gold-900/60 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-gold-300 font-cinzel uppercase tracking-wider block border-b border-gold-900/40 pb-2">
                  {isTe ? "కస్టమర్ & ఆర్డర్ వివరాలు" : "Customer & Booking Information"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-ivory-muted block">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="e.g. Smt. Lakshmi Devi"
                      className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-ivory-muted block">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-ivory-muted block">
                      Expected Delivery Date *
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-ivory-muted block">
                      Assigned Karigar / Master Goldsmith
                    </label>
                    <input
                      type="text"
                      value={karigarName}
                      onChange={(e) => setKarigarName(e.target.value)}
                      placeholder="e.g. Master Ramanaiah Achari"
                      className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold-500"
                    />
                  </div>
                </div>

                {/* Advance Payments */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gold-900/40">
                  <div className="space-y-1">
                    <label className="text-[11px] text-ivory-muted block">
                      Advance Cash Paid (₹):
                    </label>
                    <input
                      type="number"
                      value={advanceCash}
                      onChange={(e) => setAdvanceCash(e.target.value)}
                      className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl px-3 py-2 text-xs text-gold-300 font-mono focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-ivory-muted block">
                      Advance Old Gold (g):
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      value={advanceOldGold}
                      onChange={(e) => setAdvanceOldGold(e.target.value)}
                      className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl px-3 py-2 text-xs text-gold-300 font-mono focus:outline-none focus:border-gold-500"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] text-ivory-muted flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-amber-900/60 border border-amber-500/40 text-[8px] font-bold text-amber-300 flex items-center justify-center">
                        BIS
                      </span>
                      <span>BIS 916 HUID Hallmarking Code (Optional - 6 Characters):</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. HD8792"
                      value={huidInput}
                      onChange={(e) => setHuidInput(e.target.value.toUpperCase())}
                      className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl px-3 py-2 text-xs text-gold-300 font-mono focus:outline-none focus:border-gold-500 uppercase"
                    />
                  </div>
                </div>

                {/* Custom Karigar Notes */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] text-ivory-muted block">
                    Custom Karigar Instructions & Sizing:
                  </label>
                  <textarea
                    rows={3}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g. 18 inch necklace length, South Indian screw back jhumkas, ruby flower center..."
                    className="w-full bg-obsidian-950 border border-gold-900/60 rounded-xl p-3 text-xs text-ivory focus:outline-none focus:border-gold-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("list")}
                  className="px-4 py-2 rounded-xl text-xs text-ivory-muted hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-gold-600 hover:bg-gold-500 text-obsidian-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-gold-glow"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isTe ? "ఆర్డర్ ఖరారు చేయండి" : "Confirm & Save Order"}</span>
                </button>
              </div>
            </form>
          )}

          {/* Destructive Action Modal (Auto-Backup & Typed Confirmation) */}
          {deleteConfirmModal.isOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-obsidian-900 border border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-cinzel font-bold text-sm text-red-300">
                      {deleteConfirmModal.isAll ? "Confirm Wipe All Orders" : "Confirm Order Deletion"}
                    </h3>
                    <p className="text-[11px] text-ivory-muted">
                      A timestamped JSON backup has been automatically downloaded to your device.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-obsidian-950 rounded-xl border border-white/5 space-y-2 text-xs">
                  <p className="text-ivory-muted">
                    To prevent accidental loss, type <strong className="text-red-400 font-mono">DELETE</strong> in uppercase to confirm:
                  </p>
                  <input
                    type="text"
                    value={typedConfirmWord}
                    onChange={(e) => setTypedConfirmWord(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full bg-obsidian-900 border border-red-500/40 rounded-lg px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-red-400 uppercase"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmModal({ isOpen: false });
                      setTypedConfirmWord("");
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs text-ivory-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={typedConfirmWord !== "DELETE"}
                    onClick={executeConfirmedDelete}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Permanently Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
