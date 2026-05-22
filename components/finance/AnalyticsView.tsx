"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Transaction } from "@/types/finance";
import { formatIDR } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#18181b",
  "#52525b",
  "#71717a",
  "#a1a1aa",
  "#d4d4d8",
  "#3f3f46",
];

interface AnalyticsViewProps {
  transactions: Transaction[];
}

export default function AnalyticsView({ transactions }: AnalyticsViewProps) {
  const [offset, setOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return d;
  }, [offset]);

  const monthLabel = useMemo(
    () =>
      selectedDate.toLocaleString("en-US", { month: "long", year: "numeric" }),
    [selectedDate],
  );

  const monthTx = useMemo(() => {
    return transactions.filter((t) => {
      const td = new Date(t.date);
      return (
        td.getMonth() === selectedDate.getMonth() &&
        td.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [transactions, selectedDate]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx
      .filter((t) => t.type === "EXPENSE")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx]);

  const totalExpense = categoryData.reduce((a, c) => a + c.value, 0);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <header className="flex justify-between items-center">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            Analytics
          </h2>
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
            <button
              onClick={() => setOffset((p) => p - 1)}
              className="p-2 hover:bg-white/70 rounded-lg text-zinc-400 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[11px] font-bold text-zinc-900 uppercase tracking-tight w-16 text-center">
              {monthLabel.split(" ")[0]}
            </span>
            <button
              disabled={offset === 0}
              onClick={() => setOffset((p) => p + 1)}
              className="p-2 hover:bg-white/70 rounded-lg text-zinc-400 transition-colors disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </header>

        {/* Pie Chart */}
        <section className="bg-white rounded-4xl p-6 shadow-sm border border-zinc-100 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-zinc-900">Spending Breakdown</h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-2 py-1 rounded-lg">
              {monthLabel}
            </span>
          </div>

          {categoryData.length > 0 ? (
            <>
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid #e4e4e7",
                        fontSize: 12,
                      }}
                      formatter={(v) =>
                        typeof v === "number" ? formatIDR(v) : String(v)
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">
                    Total
                  </span>
                  <span className="text-sm font-black text-zinc-900">
                    {formatIDR(totalExpense)}
                  </span>
                </div>
              </div>

              {/* Category list */}
              <div className="space-y-3">
                {categoryData.map((c, i) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-sm font-semibold text-zinc-700">
                        {c.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-zinc-900">
                        {formatIDR(c.value)}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-2">
                        {totalExpense > 0
                          ? Math.round((c.value / totalExpense) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-300 text-sm">
              No expense data
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
