"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Scan,
  FileEdit,
  Send,
  Camera,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Utensils,
  Car,
  ShoppingBag,
  ShoppingCart,
  Tv,
  Receipt,
  PlusCircle,
  Briefcase,
  TrendingUp,
  Gift,
  Landmark,
  HelpCircle,
} from "lucide-react";
import { Transaction, InputMethod } from "@/types/finance";
import { cn } from "@/lib/utils";

const EXPENSE_CATS = [
  { id: "F&B", name: "Makan", icon: <Utensils size={16} /> },
  { id: "Transport", name: "Transport", icon: <Car size={16} /> },
  { id: "Groceries", name: "Belanja", icon: <ShoppingBag size={16} /> },
  { id: "Shopping", name: "Shopping", icon: <ShoppingCart size={16} /> },
  { id: "Entertainment", name: "Hiburan", icon: <Tv size={16} /> },
  { id: "Bills", name: "Tagihan", icon: <Receipt size={16} /> },
  { id: "Other", name: "Lainnya", icon: <HelpCircle size={16} /> },
];

const INCOME_CATS = [
  { id: "Salary", name: "Gaji", icon: <Briefcase size={16} /> },
  { id: "Investment", name: "Investasi", icon: <TrendingUp size={16} /> },
  { id: "Gift", name: "Hadiah", icon: <Gift size={16} /> },
  { id: "Subsidy", name: "Subsidi", icon: <Landmark size={16} /> },
  { id: "Other", name: "Lainnya", icon: <PlusCircle size={16} /> },
];

interface AddViewProps {
  onAdd: (tx: Omit<Transaction, "id" | "date">) => void;
  onComplete: () => void;
}

export default function AddView({ onAdd, onComplete }: AddViewProps) {
  const [tab, setTab] = useState<InputMethod>("AI");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [aiInput, setAiInput] = useState("");
  const [scanStep, setScanStep] = useState<"idle" | "scanning" | "review">("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const base64ImageRef = useRef<string | null>(null);
  const [scannedData, setScannedData] = useState<{
    amount: number;
    category: string;
    notes: string;
    items: string[];
  } | null>(null);
  const [reviewForm, setReviewForm] = useState<{ amount: string; category: string; notes: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manualForm, setManualForm] = useState({
    amount: "",
    category: "F&B",
    notes: "",
    type: "EXPENSE" as "EXPENSE" | "INCOME",
  });

  const triggerSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onComplete();
    }, 1500);
  };

  const handleAiSubmit = async () => {
    if (!aiInput.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to process. Please try again.");
        return;
      }
      onAdd({
        amount: data.amount,
        category: data.category,
        notes: data.notes,
        type: "EXPENSE",
        input_method: "AI",
      });
      setAiInput("");
      triggerSuccess();
    } catch {
      alert("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCapturedImage(objectUrl);
    setScanStep("scanning");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const res = await fetch("/api/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: reader.result }),
        });
        const data = await res.json();
        if (!res.ok) {
          setScanStep("idle");
          alert(data.error || "Failed to scan receipt. Please try again.");
          return;
        }
        base64ImageRef.current = reader.result as string;
        setScannedData(data);
        setReviewForm({ amount: String(data.amount), category: data.category, notes: data.notes });
        setScanStep("review");
      } catch {
        setScanStep("idle");
        alert("Failed to scan receipt. Please try again.");
      }
    };
  };

  const handleSaveScan = () => {
    if (!scannedData || !reviewForm) return;
    onAdd({
      amount: Number(reviewForm.amount) || scannedData.amount,
      category: reviewForm.category,
      notes: reviewForm.notes,
      type: "EXPENSE",
      input_method: "SCAN",
      items: scannedData.items,
      receipt_image: base64ImageRef.current ?? undefined,
    });
    triggerSuccess();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.amount) return;
    onAdd({
      amount: Number(manualForm.amount),
      category: manualForm.category,
      notes: manualForm.notes,
      type: manualForm.type,
      input_method: "MANUAL",
    });
    triggerSuccess();
  };

  return (
    <div className="h-full overflow-y-auto bg-white relative">
      <div className="max-w-2xl mx-auto p-6 space-y-6 flex flex-col min-h-full">
        <div className="flex justify-between items-center shrink-0">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            Add
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-zinc-100 rounded-xl shrink-0">
          {(
            [
              ["AI", <MessageSquare size={15} />],
              ["SCAN", <Scan size={15} />],
              ["MANUAL", <FileEdit size={15} />],
            ] as [InputMethod, React.ReactNode][]
          ).map(([t, icon]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg transition-all",
                tab === t
                  ? "bg-white text-zinc-900 shadow-sm font-bold"
                  : "text-zinc-400 font-medium",
              )}
            >
              {icon}
              <span className="text-[11px]">{t}</span>
            </button>
          ))}
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {/* AI Tab */}
            {tab === "AI" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                <div className="relative">
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Describe your expense... (e.g., Coffee 50k)"
                    className="w-full h-40 p-5 bg-white border border-zinc-200 rounded-3xl shadow-sm resize-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 outline-none transition-all placeholder:text-zinc-200 font-medium text-zinc-900"
                  />
                  <div className="absolute bottom-4 left-5 flex items-center gap-2 text-zinc-300">
                    <AlertCircle size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      AI mode enabled
                    </span>
                  </div>
                </div>
                <button
                  disabled={loading || !aiInput.trim()}
                  onClick={handleAiSubmit}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
                    loading
                      ? "bg-zinc-100 text-zinc-400"
                      : "bg-zinc-900 text-white active:scale-95",
                  )}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Submit
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* SCAN Tab */}
            {tab === "SCAN" && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                  onChange={onFileChange}
                />
                {scanStep === "idle" && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-72 border border-zinc-200 rounded-[2.5rem] bg-white flex flex-col items-center justify-center gap-4 group active:bg-zinc-50 transition-all shadow-sm"
                  >
                    <div className="w-20 h-20 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-900 group-active:scale-95 transition-transform">
                      <Camera size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-zinc-900">
                        Take a Photo of Receipt
                      </p>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mt-1">
                        Automatic OCR
                      </p>
                    </div>
                  </button>
                )}
                {scanStep === "scanning" && (
                  <div className="w-full h-72 bg-zinc-900 rounded-[2.5rem] relative overflow-hidden flex items-center justify-center shadow-lg">
                    {capturedImage && (
                      <img
                        src={capturedImage}
                        alt="Receipt"
                        className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm"
                      />
                    )}
                    <div className="text-white text-center z-10 space-y-4">
                      <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold">
                        Reading Receipt...
                      </p>
                    </div>
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        ease: "linear",
                      }}
                      className="absolute left-0 right-0 h-0.5 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] z-20"
                    />
                  </div>
                )}
                {scanStep === "review" && scannedData && reviewForm && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-zinc-100 space-y-4"
                  >
                    {capturedImage && (
                      <div className="w-full h-40 rounded-2xl overflow-hidden bg-zinc-50">
                        <img
                          src={capturedImage}
                          alt="Receipt"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    {/* Items list */}
                    {scannedData.items.length > 0 && (
                      <div className="bg-zinc-50 rounded-2xl p-4 space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Items found</p>
                        {scannedData.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                            <span className="text-zinc-300 mt-0.5">•</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Editable fields */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount</label>
                        <div className="flex items-center gap-2 bg-zinc-50 rounded-xl px-4 py-3">
                          <span className="text-sm font-bold text-zinc-400">Rp</span>
                          <input
                            type="number"
                            value={reviewForm.amount}
                            onChange={(e) => setReviewForm((f) => f ? { ...f, amount: e.target.value } : f)}
                            className="flex-1 bg-transparent outline-none text-zinc-900 font-bold text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</label>
                        <select
                          value={reviewForm.category}
                          onChange={(e) => setReviewForm((f) => f ? { ...f, category: e.target.value } : f)}
                          className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm text-zinc-900 font-semibold outline-none"
                        >
                          {["F&B","Transport","Groceries","Shopping","Entertainment","Bills","Other"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</label>
                        <input
                          type="text"
                          value={reviewForm.notes}
                          onChange={(e) => setReviewForm((f) => f ? { ...f, notes: e.target.value } : f)}
                          className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm text-zinc-900 font-semibold outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => setScanStep("idle")}
                        className="py-4 rounded-2xl border border-zinc-200 text-zinc-500 font-bold text-sm"
                      >
                        Retry
                      </button>
                      <button
                        onClick={handleSaveScan}
                        className="py-4 rounded-2xl bg-zinc-900 text-white font-bold text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Save
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* MANUAL Tab */}
            {tab === "MANUAL" && (
              <motion.div
                key="manual"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase px-1 tracking-widest">
                      Amount
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-900">
                        Rp
                      </span>
                      <input
                        type="number"
                        required
                        value={manualForm.amount}
                        onChange={(e) =>
                          setManualForm((p) => ({
                            ...p,
                            amount: e.target.value,
                          }))
                        }
                        className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 outline-none text-xl font-black text-zinc-900 transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setManualForm((p) => ({
                          ...p,
                          type: "EXPENSE",
                          category: "F&B",
                        }))
                      }
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                        manualForm.type === "EXPENSE"
                          ? "bg-white text-rose-500 shadow-sm"
                          : "text-zinc-400",
                      )}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setManualForm((p) => ({
                          ...p,
                          type: "INCOME",
                          category: "Salary",
                        }))
                      }
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-xs font-bold transition-all",
                        manualForm.type === "INCOME"
                          ? "bg-white text-emerald-500 shadow-sm"
                          : "text-zinc-400",
                      )}
                    >
                      Income
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase px-1 tracking-widest">
                      Category
                    </label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {(manualForm.type === "EXPENSE"
                        ? EXPENSE_CATS
                        : INCOME_CATS
                      ).map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            setManualForm((p) => ({ ...p, category: c.id }))
                          }
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1",
                            manualForm.category === c.id
                              ? "bg-zinc-900 border-zinc-900 text-white scale-105"
                              : "bg-white border-zinc-100 text-zinc-400",
                          )}
                        >
                          {c.icon}
                          <span className="text-[9px] font-bold uppercase tracking-tight text-center truncate w-full">
                            {c.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-400 uppercase px-1 tracking-widest">
                      Notes
                    </label>
                    <input
                      type="text"
                      value={manualForm.notes}
                      onChange={(e) =>
                        setManualForm((p) => ({ ...p, notes: e.target.value }))
                      }
                      className="w-full mt-1 p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-zinc-900/10 outline-none text-sm font-semibold text-zinc-900 transition-all"
                      placeholder="Lunch..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Save Transaction
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              <div className="flex items-center gap-2.5 bg-zinc-900 text-white text-sm font-bold px-4 py-2.5 rounded-full shadow-lg">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                Transaction saved
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
