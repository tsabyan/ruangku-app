"use client";

import { useMemo } from "react";
import { Task } from "@/types/goals";
import { getDaysInMonth, getMonthYearTitle, cn } from "@/lib/utils";
import { motion } from "motion/react";

interface TaskHeatmapProps {
  taskTitle: string;
  history: Task[];
}

export function TaskHeatmap({ history }: TaskHeatmapProps) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysCount = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const monthTitle = getMonthYearTitle();

  const dayStatus = useMemo(() => {
    const status: Record<number, boolean> = {};
    history.forEach((t) => {
      const d = new Date(t.current_due_date);
      if (
        d.getMonth() === month &&
        d.getFullYear() === year &&
        t.is_completed
      ) {
        status[d.getDate()] = true;
      }
    });
    return status;
  }, [history, month, year]);

  const days = Array.from({ length: daysCount }, (_, i) => i + 1);
  const emptyPrefix = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden bg-zinc-50 rounded-2xl p-4 mt-2 border border-zinc-100"
    >
      <div className="flex justify-between items-center mb-3 px-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
          {monthTitle}
        </span>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 rounded-sm bg-zinc-900" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            Consistency
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-[8px] font-bold text-zinc-300 text-center mb-1"
          >
            {d}
          </div>
        ))}
        {emptyPrefix.map((i) => (
          <div key={`e-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const completed = dayStatus[day];
          const isToday = day === now.getDate();
          return (
            <div
              key={day}
              className={cn(
                "aspect-square rounded-sm transition-colors relative flex items-center justify-center",
                completed
                  ? "bg-zinc-900 shadow-sm"
                  : "bg-zinc-200/50 border border-zinc-200/80",
              )}
            >
              {isToday && !completed && (
                <div className="w-1 h-1 rounded-full bg-zinc-400" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
