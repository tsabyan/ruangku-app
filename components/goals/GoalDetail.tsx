"use client";

import { useState, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, ChevronRight, Activity, ChevronDown, ChevronLeft } from "lucide-react";
import { Goal, Habit, HabitColor, HabitFrequency } from "@/types/goals";
import { cn, getTodayStr } from "@/lib/utils";
import { ConfirmModal } from "@/components/goals/ConfirmModal";
import { getStreaks } from "@/hooks/useHabitStore";
import { HabitFormModal } from "@/components/goals/habit/HabitFormModal";

interface GoalDetailProps {
  goal: Goal;
  goals: Goal[];
  habits: Habit[];  // filtered: only habits where goal_id === goal.id
  onUpdateGoal: (updates: Partial<Goal>) => void;
  onDeleteGoal: () => void;
  onAddHabit: (name: string, description: string, icon: string, color: HabitColor, frequencyType: HabitFrequency, customDays: number[], targetFrequency: number, goalId: string | null) => void;
  onToggleHabitLog: (habitId: string, dateStr: string) => void;
}

export function GoalDetail({ goal, goals, habits, onUpdateGoal, onDeleteGoal, onAddHabit, onToggleHabitLog }: GoalDetailProps) {
  const router = useRouter();
  const todayStr = getTodayStr();
  const todayDay = new Date().getDay();

  const [logText, setLogText] = useState(goal.achievement_log_text);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLogText(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => onUpdateGoal({ achievement_log_text: val }), 1000);
  };

  // Today's focus: habits that are scheduled for today
  const todayHabits = habits.filter((h) => {
    if (h.is_archived) return false;
    if (h.frequency_type === "daily") return true;
    if (h.frequency_type === "custom") return h.custom_days.includes(todayDay);
    return true; // weekly: always show, let user decide
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="px-6 pt-6">
        <button onClick={() => router.push("/goals")}
          className="flex items-center gap-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 space-y-8">
        {/* Title */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 leading-tight">{goal.title}</h1>
          {goal.status !== "achieved" && (
            <button onClick={() => setIsDeletingGoal(true)}
              className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors shrink-0 mt-1">
              Delete
            </button>
          )}
        </div>

        {/* Achievement Log */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Achievement Log</h2>
          <textarea
            value={logText}
            onChange={handleLogChange}
            onBlur={() => onUpdateGoal({ achievement_log_text: logText })}
            readOnly={goal.status === "achieved"}
            placeholder={goal.status === "achieved" ? "Goal achieved! Write your reflection here." : "Write reflections, small wins, or notes..."}
            className={cn(
              "w-full min-h-35 p-5 bg-zinc-50 border border-transparent rounded-2xl outline-none transition-all text-zinc-700 leading-relaxed resize-none text-sm",
              goal.status !== "achieved" && "focus:border-zinc-100 focus:bg-white",
              goal.status === "achieved" && "cursor-default text-zinc-500 italic",
            )}
          />
        </section>

        {/* Today's Focus — habits linked to this goal */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Today&apos;s Focus</h2>
            {goal.status === "ongoing" && (
              <button onClick={() => setIsAddingHabit(true)} className="p-1 text-zinc-300 hover:text-zinc-900 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {todayHabits.length === 0 && (
              <p className="text-zinc-300 text-sm italic py-2">No habits for today yet. Add one!</p>
            )}
            {todayHabits.map((habit) => {
              const done = habit.history.includes(todayStr);
              const { current: streak } = getStreaks(habit.history);
              return (
                <div key={habit.id} className="flex items-center gap-3 group">
                  {/* Toggle */}
                  <button
                    disabled={goal.status !== "ongoing"}
                    onClick={() => onToggleHabitLog(habit.id, todayStr)}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                      done ? "bg-zinc-900 border-zinc-900" : "border-zinc-200",
                      goal.status !== "ongoing" && !done && "bg-zinc-50 cursor-not-allowed"
                    )}
                  >
                    {done && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>

                  {/* Info — click to navigate to habit detail */}
                  <button
                    onClick={() => router.push(`/goals/habits/${habit.id}`)}
                    className="flex-1 text-left py-1 min-w-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center text-zinc-700 transition-colors shrink-0",
                        done ? "bg-zinc-50 text-zinc-300" : "bg-zinc-50 text-zinc-700"
                      )}>
                        <Activity className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <span className={cn("text-base transition-all block truncate",
                          done ? "text-zinc-400 line-through" : "text-zinc-700 font-medium"
                        )}>
                          {habit.name}
                        </span>
                        {streak > 0 && (
                          <span className="text-[9px] font-bold text-amber-600">🔥 {streak}d streak</span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Navigate arrow */}
                  <ChevronRight className="w-4 h-4 text-zinc-200 group-hover:text-zinc-400 transition-colors shrink-0" />
                </div>
              );
            })}
          </div>

          {/* All habits for this goal (non-today) */}
          {habits.filter((h) => !h.is_archived && !todayHabits.includes(h)).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Other habits</p>
              {habits.filter((h) => !h.is_archived && !todayHabits.includes(h)).map((habit) => (
                <button key={habit.id} onClick={() => router.push(`/goals/habits/${habit.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors text-left">
                  <span className="text-zinc-500 bg-zinc-100 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-zinc-600 truncate flex-1">{habit.name}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Archived habits for this goal */}
          {habits.filter((h) => h.is_archived).length > 0 && (
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => setIsArchivedExpanded(!isArchivedExpanded)}
                className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 hover:text-zinc-650 uppercase tracking-widest transition-colors w-full text-left cursor-pointer"
              >
                <span>Archived habits ({habits.filter((h) => h.is_archived).length})</span>
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isArchivedExpanded ? "rotate-180" : "rotate-0")} />
              </button>
              {isArchivedExpanded && (
                <div className="space-y-2">
                  {habits.filter((h) => h.is_archived).map((habit) => (
                    <button key={habit.id} onClick={() => router.push(`/goals/habits/${habit.id}`)}
                      className="w-full flex items-center gap-3 p-3 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors text-left opacity-60">
                      <span className="text-zinc-400 bg-zinc-100 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4" />
                      </span>
                      <span className="text-sm font-medium text-zinc-500 truncate flex-1 line-through">{habit.name}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Delete Goal Modal */}
      <ConfirmModal
        isOpen={isDeletingGoal}
        title="Delete Goal?"
        message={`Are you sure you want to delete "${goal.title}"? Linked habits will become standalone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={onDeleteGoal}
        onCancel={() => setIsDeletingGoal(false)}
      />

      {/* Add Habit Modal (Integrated) */}
      {isAddingHabit && (
        <HabitFormModal
          editingHabit={null}
          goals={goals}
          presetGoalId={goal.id}
          onSave={onAddHabit}
          onClose={() => setIsAddingHabit(false)}
        />
      )}
    </div>
  );
}
