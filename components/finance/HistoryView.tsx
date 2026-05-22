"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Search, X } from "lucide-react";
import { Transaction } from "@/types/finance";
import { formatIDR, cn } from "@/lib/utils";
import { getCategoryIcon } from "./categoryIcons";

interface HistoryViewProps {
  transactions: Transaction[];
  onBack: () => void;
}

export default function HistoryView({
  transactions,
  onBack,
}: HistoryViewProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [selectedType, setSelectedType] = useState<
    "ALL" | "EXPENSE" | "INCOME"
  >("ALL");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(transactions.map((t) => t.category)))],
    [transactions],
  );

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        const matchSearch =
          t.notes.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase());
        const matchCat = selectedCat === "All" || t.category === selectedCat;
        const matchType = selectedType === "ALL" || t.type === selectedType;
        return matchSearch && matchCat && matchType;
      }),
    [transactions, search, selectedCat, selectedType],
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            History
          </h2>
          <button
            onClick={onBack}
            className="p-2 bg-zinc-100 rounded-full text-zinc-400 hover:bg-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="relative mb-4">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300"
            size={17}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-200 focus:border-zinc-300 transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-200"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
          {(["ALL", "EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap uppercase tracking-widest transition-all border",
                selectedType === t
                  ? "bg-zinc-900 border-zinc-900 text-white"
                  : "bg-white border-zinc-200 text-zinc-400",
              )}
            >
              {t === "ALL" ? "All" : t === "EXPENSE" ? "Expense" : "Income"}
            </button>
          ))}
          <div className="w-px bg-zinc-100 shrink-0 mx-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap uppercase tracking-widest transition-all border",
                selectedCat === cat
                  ? "bg-zinc-900 border-zinc-900 text-white"
                  : "bg-white border-zinc-200 text-zinc-400",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-zinc-300 text-sm">
            No transactions found
          </div>
        ) : (
          filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center">
                  {getCategoryIcon(t.category)}
                </div>
                <div>
                  <p className="font-bold text-zinc-900 text-sm">{t.notes}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    {t.category} •{" "}
                    {new Date(t.date).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col">
                <p
                  className={cn(
                    "font-black text-sm",
                    t.type === "EXPENSE" ? "text-rose-500" : "text-emerald-500",
                  )}
                >
                  {t.type === "EXPENSE" ? "-" : "+"} {formatIDR(t.amount)}
                </p>
                <span className="text-[8px] font-bold text-zinc-300 uppercase">
                  via {t.input_method}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
