"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "success" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const variantStyles = {
    danger: "bg-red-500 hover:bg-red-600",
    success: "bg-emerald-600 hover:bg-emerald-700",
    primary: "bg-zinc-900 hover:bg-zinc-800",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-xs rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-zinc-900">{title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{message}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors border border-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all shadow-sm",
                  variantStyles[confirmVariant],
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
