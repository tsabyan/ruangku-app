"use client";

import { Transaction } from "@/types/finance";
import { formatIDR, cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useMemo } from "react";
import { getCategoryIcon } from "./categoryIcons";

interface HomeViewProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onViewHistory: () => void;
}

export default function HomeView({
  transactions,
  isLoading,
  onViewHistory,
}: HomeViewProps) {
  const now = useMemo(() => new Date(), []);

  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
    const income = thisMonth
      .filter((t) => t.type === "INCOME")
      .reduce((s, t) => s + t.amount, 0);
    const expense = thisMonth
      .filter((t) => t.type === "EXPENSE")
      .reduce((s, t) => s + t.amount, 0);
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    };
  }, [transactions, now]);

  return (
    <div className="h-full overflow-y-auto bg-white">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-400 rounded-full animate-spin" />
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
              Loading...
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Finance
              </h1>
              <p className="text-zinc-400 text-sm font-medium">
                {now.toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </header>

          {/* Balance Card */}
          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="p-6 rounded-4xl bg-white border border-zinc-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] space-y-5"
          >
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">
                Balance This Month
              </p>
              <h2
                className={cn(
                  "text-4xl font-black tracking-tighter",
                  balance >= 0 ? "text-zinc-900" : "text-rose-500",
                )}
              >
                {balance >= 0 ? "" : "-"}
                {formatIDR(Math.abs(balance))}
              </h2>
            </div>
            <div className="flex gap-6 pt-3 border-t border-zinc-50">
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  Income
                </p>
                <p className="text-base font-black text-emerald-500">
                  {formatIDR(totalIncome)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  Expense
                </p>
                <p className="text-base font-black text-rose-500">
                  {formatIDR(totalExpense)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <section className="space-y-4 pb-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-lg font-bold text-zinc-900 tracking-tight">
                Recent
              </h3>
              <button
                onClick={onViewHistory}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                All →
              </button>
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-zinc-50 flex items-center justify-center">
                      {getCategoryIcon(t.category)}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-sm tracking-tight">
                        {t.notes}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-medium">
                        {t.category} •{" "}
                        {new Date(t.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col">
                    <p
                      className={cn(
                        "font-bold text-sm",
                        t.type === "EXPENSE"
                          ? "text-rose-500"
                          : "text-emerald-500",
                      )}
                    >
                      {t.type === "EXPENSE" ? "-" : "+"} {formatIDR(t.amount)}
                    </p>
                    <span className="text-[9px] font-bold text-zinc-300 uppercase">
                      {t.input_method}
                    </span>
                  </div>
                </motion.div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-8 text-zinc-300 text-sm">
                  No transactions yet
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
