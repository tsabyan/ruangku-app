"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, getDay, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { Check, Flame, Activity } from "lucide-react";
import { Habit, HabitColor, HabitFrequency, Goal } from "@/types/goals";
import { cn } from "@/lib/utils";
import { HabitFormModal } from "./habit/HabitFormModal";
import { getStreaks } from "@/hooks/useHabitStore";

type Filter = "today" | "all" | "archived";

interface Props {
  habits: Habit[];
  goals: Goal[];
  isCreating: boolean;
  onCreatingClose: () => void;
  onAddHabit: (name: string, description: string, icon: string, color: HabitColor, frequencyType: HabitFrequency, customDays: number[], targetFrequency: number, goalId?: string | null) => void;
  onUpdateHabit: (id: string, updates: Partial<Habit>) => void;
  onDeleteHabit: (id: string) => void;
  onToggleHabitLog: (id: string, dateStr: string) => void;
}

export function HabitTracker({ habits, goals, isCreating, onCreatingClose, onAddHabit, onUpdateHabit, onDeleteHabit, onToggleHabitLog }: Props) {
  const router = useRouter();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayDay = getDay(new Date());
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [internalFormOpen, setInternalFormOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("today");

  const isFormOpen = isCreating || internalFormOpen;

  const active = useMemo(() => habits.filter((h) => !h.is_archived), [habits]);
  const archived = useMemo(() => habits.filter((h) => h.is_archived), [habits]);

  const filtered = useMemo(() => {
    if (filter === "today")
      return active.filter((h) => {
        if (h.frequency_type === "daily") return true;
        if (h.frequency_type === "custom") return h.custom_days.includes(todayDay);
        return true;
      });
    if (filter === "archived") return archived;
    return active;
  }, [filter, active, archived, todayDay]);

  const metrics = useMemo(() => {
    let totalExpected = 0, totalDone = 0;
    active.forEach((h) => {
      const target = h.frequency_type === "weekly" ? h.target_frequency : h.frequency_type === "custom" ? h.custom_days.length : 7;
      totalExpected += target;
      const done = h.history.filter((d) => { const p = parseISO(d); return p >= weekStart && p <= weekEnd; }).length;
      totalDone += Math.min(done, target);
    });
    const consistency = totalExpected > 0 ? Math.round((totalDone / totalExpected) * 100) : 0;
    const highestStreak = active.reduce((acc, h) => Math.max(acc, getStreaks(h.history).current), 0);
    const todayList = active.filter((h) => h.frequency_type === "daily" || (h.frequency_type === "custom" && h.custom_days.includes(todayDay)));
    const todayDone = todayList.filter((h) => h.history.includes(todayStr)).length;
    return { consistency, highestStreak, todayTotal: todayList.length, todayDone };
  }, [active, weekStart, weekEnd, todayDay, todayStr]);

  const closeForm = () => {
    setInternalFormOpen(false);
    setEditingHabit(null);
    onCreatingClose();
  };

  const handleSave = (name: string, description: string, icon: string, color: HabitColor, frequencyType: HabitFrequency, customDays: number[], targetFrequency: number, goalId: string | null) => {
    if (editingHabit) {
      onUpdateHabit(editingHabit.id, { name, description, icon, color, frequency_type: frequencyType, custom_days: customDays, target_frequency: targetFrequency, goal_id: goalId });
    } else {
      onAddHabit(name, description, icon, color, frequencyType, customDays, targetFrequency, goalId);
    }
  };

  const goalMap = useMemo(() => Object.fromEntries(goals.map((g) => [g.id, g.title])), [goals]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 px-6 pt-6 pb-28 space-y-5">
        {/* Header */}
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Habits</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl space-y-3">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Weekly</p>
            <p className="text-3xl font-extrabold text-zinc-900">{metrics.consistency}%</p>
            <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.consistency}%` }} />
            </div>
          </div>
          <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl space-y-2">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Top Streak</p>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 fill-amber-500 text-amber-500" />
              <span className="text-3xl font-extrabold text-zinc-900">{metrics.highestStreak}</span>
            </div>
            <p className="text-[10px] text-zinc-400">days consecutive</p>
          </div>
        </div>

        {/* Today progress */}
        {metrics.todayTotal > 0 && (
          <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Today</p>
              <p className="text-xs font-bold text-zinc-800">{metrics.todayDone} / {metrics.todayTotal}</p>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.todayTotal > 0 ? Math.round((metrics.todayDone / metrics.todayTotal) * 100) : 0}%` }} />
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
          {(["today", "all", "archived"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                filter === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-700"
              )}>
              {f === "today" ? "Today" : f === "all" ? "All" : "Archived"}
            </button>
          ))}
        </div>

        {/* Habit list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-14 border-2 border-dashed border-zinc-100 rounded-3xl space-y-2">
              <p className="text-2xl opacity-40">✨</p>
              <p className="text-sm font-medium text-zinc-400">
                {filter === "today" ? "All done for today!" : filter === "archived" ? "No archived habits." : "No habits yet."}
              </p>
            </div>
          ) : (
            filtered.map((habit) => {
              const done = habit.history.includes(todayStr);
              const { current: streak } = getStreaks(habit.history);
              const linkedGoalName = habit.goal_id ? goalMap[habit.goal_id] : null;
              return (
                <div key={habit.id}
                  onClick={() => router.push(`/goals/habits/${habit.id}`)}
                  className="group bg-white border border-zinc-100 hover:border-zinc-200 p-4 rounded-2xl flex items-center justify-between gap-4 cursor-pointer shadow-sm transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shrink-0",
                      done ? "bg-zinc-50 text-zinc-300" : "bg-zinc-50 text-zinc-700"
                    )}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className={cn("font-semibold text-zinc-800 truncate leading-tight", done && "text-zinc-400 line-through")}>
                        {habit.name}
                      </h3>
                      {habit.description && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{habit.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm tracking-widest bg-zinc-50 text-zinc-500 border border-zinc-100">
                          {habit.frequency_type === "daily" ? "Daily" : habit.frequency_type === "weekly" ? `${habit.target_frequency}× Week` : "Custom"}
                        </span>
                        {streak > 0 && (
                          <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />{streak}d
                          </span>
                        )}
                        {linkedGoalName && (
                          <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-sm truncate max-w-24">
                            🎯 {linkedGoalName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleHabitLog(habit.id, todayStr); }}
                    className={cn("w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all shrink-0 shadow-sm",
                      done ? "bg-zinc-900 border-zinc-900" : "border-zinc-200 hover:border-zinc-400"
                    )}>
                    <Check className={cn("w-4 h-4", done ? "text-white" : "text-transparent group-hover:text-zinc-300")} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isFormOpen && (
        <HabitFormModal
          editingHabit={editingHabit}
          goals={goals}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
