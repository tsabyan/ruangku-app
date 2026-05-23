"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Trash2, Check, Receipt } from "lucide-react";
import { Transaction } from "@/types/finance";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "./categoryIcons";
import { ConfirmModal } from "@/components/goals/ConfirmModal";

const CATEGORIES = [
  "F&B", "Transport", "Groceries", "Shopping", "Entertainment",
  "Bills", "Salary", "Investment", "Gift", "Subsidy", "Other",
];

interface TransactionDetailProps {
  transaction: Transaction;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Omit<Transaction, "id">>) => void;
  onDelete: (id: string) => void;
}

export function TransactionDetail({
  transaction: tx,
  onClose,
  onUpdate,
  onDelete,
}: TransactionDetailProps) {
  const [form, setForm] = useState({
    amount: String(tx.amount),
    category: tx.category,
    notes: tx.notes,
    type: tx.type,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate(tx.id, {
      amount: Number(form.amount),
      category: form.category,
      notes: form.notes,
      type: form.type,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  const handleDelete = () => {
    onDelete(tx.id);
    onClose();
  };

  const isDirty =
    form.amount !== String(tx.amount) ||
    form.category !== tx.category ||
    form.notes !== tx.notes ||
    form.type !== tx.type;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
        <motion.div
          key="drawer"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 overflow-y-auto max-h-[92vh]"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-zinc-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3">
            <h2 className="text-base font-bold text-zinc-900">Transaction Detail</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-zinc-400 hover:bg-zinc-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 pb-8 space-y-5">
            {/* Receipt image */}
            {tx.receipt_image && (
              <div className="w-full rounded-2xl overflow-hidden bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-100">
                  <Receipt className="w-3 h-3 text-zinc-400" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Receipt</span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tx.receipt_image} alt="Receipt" className="w-full object-contain max-h-64" />
              </div>
            )}

            {/* Items list */}
            {tx.items && tx.items.length > 0 && (
              <div className="bg-zinc-50 rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Items</p>
                <div className="space-y-1">
                  {tx.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                      <span className="text-zinc-300 mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-zinc-100">
              {(["EXPENSE", "INCOME"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all",
                    form.type === t
                      ? t === "EXPENSE" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                      : "bg-white text-zinc-400",
                  )}
                >
                  {t === "EXPENSE" ? "Expense" : "Income"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Amount</label>
              <div className="flex items-center gap-2 bg-zinc-50 rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-zinc-400">Rp</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="flex-1 bg-transparent outline-none text-zinc-900 font-bold text-sm"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</label>
              <div className="flex items-center gap-2 bg-zinc-50 rounded-xl px-4 py-3">
                {getCategoryIcon(form.category)}
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="flex-1 bg-transparent outline-none text-zinc-900 font-semibold text-sm"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full bg-zinc-50 rounded-xl px-4 py-3 text-sm text-zinc-900 font-semibold outline-none"
              />
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-[10px] text-zinc-300 font-bold uppercase tracking-widest px-1">
              <span>{new Date(tx.date).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span>via {tx.input_method}</span>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!isDirty && !saved}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all",
                saved
                  ? "bg-emerald-500 text-white"
                  : isDirty
                    ? "bg-zinc-900 text-white active:scale-[0.98]"
                    : "bg-zinc-100 text-zinc-400 cursor-default",
              )}
            >
              {saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Changes"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete transaction?"
        message="This transaction will be permanently removed from your history."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
