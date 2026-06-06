"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth, getDay, subDays } from "date-fns";
import { ChevronLeft, Flame, Sparkles, Archive, Trash2, Edit3, Check, Undo2, ExternalLink, Activity } from "lucide-react";
import { Habit, HabitColor, HabitFrequency, Goal } from "@/types/goals";
import { cn } from "@/lib/utils";
import { HabitFormModal } from "./HabitFormModal";
import { ConfirmModal } from "@/components/goals/ConfirmModal";
import { getStreaks } from "@/hooks/useHabitStore";

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  habit: Habit;
  goals: Goal[];
  todayStr: string;
  onBack: () => void;
  onEdit: () => void;         // kept for compat, internally we use modal
  onDelete: () => void;
  onToggleArchive: () => void;
  onToggleLog: (dateStr: string) => void;
  onUpdateHabit: (updates: Partial<Habit>) => void;
}

export function HabitDetailView({ habit, goals, todayStr, onBack, onDelete, onToggleArchive, onToggleLog, onUpdateHabit }: Props) {
  const router = useRouter();
  const streaks = getStreaks(habit.history);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const linkedGoal = goals.find((g) => g.id === habit.goal_id) ?? null;

  const calendarDays = useMemo(() => {
    const startMonth = startOfMonth(new Date());
    const endMonth = endOfMonth(new Date());
    const firstDayOfWeek = getDay(startMonth);
    const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const buffer = Array.from({ length: offset }, (_, i) => ({
      date: subDays(startMonth, offset - i), isCurrentMonth: false,
    }));
    const active: { date: Date; isCurrentMonth: boolean }[] = [];
    let cur = startMonth;
    while (cur <= endMonth) {
      active.push({ date: cur, isCurrentMonth: true });
      cur = subDays(cur, -1);
    }
    return [...buffer, ...active];
  }, []);

  const handleEditSave = (
    name: string, description: string, icon: string, color: HabitColor,
    frequencyType: HabitFrequency, customDays: number[], targetFrequency: number,
    goalId: string | null,
  ) => {
    onUpdateHabit({ name, description, icon, color, frequency_type: frequencyType, custom_days: customDays, target_frequency: targetFrequency, goal_id: goalId });
    setShowEditForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 text-xs font-bold uppercase tracking-widest transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowEditForm(true)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={onToggleArchive}
            className={cn("p-2 rounded-lg transition-all", habit.is_archived ? "text-indigo-500 hover:bg-indigo-50" : "text-zinc-400 hover:bg-zinc-100")}>
            {habit.is_archived ? <Undo2 className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="flex items-start gap-4 p-5 rounded-2xl border border-zinc-100 bg-zinc-50">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-zinc-700 bg-zinc-100 shrink-0">
          <Activity className="w-6 h-6 text-zinc-800" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-zinc-900 leading-tight">{habit.name}</h1>
          {habit.description && <p className="text-sm text-zinc-500 mt-1">{habit.description}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white text-zinc-600 border border-zinc-100">
              {habit.frequency_type === "daily" && "Daily"}
              {habit.frequency_type === "weekly" && `${habit.target_frequency}× / Week`}
              {habit.frequency_type === "custom" && "Custom Days"}
            </span>
            {habit.is_archived && (
              <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-600">Archived</span>
            )}
          </div>
          {/* Goal link */}
          {linkedGoal && (
            <button
              onClick={() => router.push(`/goals/${linkedGoal.id}`)}
              className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              Part of: <span className="underline underline-offset-2 truncate">{linkedGoal.title}</span>
            </button>
          )}
        </div>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-zinc-100 p-4 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Current</p>
            <p className="text-xl font-black text-zinc-800">{streaks.current} days</p>
          </div>
        </div>
        <div className="bg-white border border-zinc-100 p-4 rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 fill-blue-300 text-blue-500" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Best</p>
            <p className="text-xl font-black text-zinc-800">{streaks.best} days</p>
          </div>
        </div>
      </div>

      {/* Quick check-in */}
      {!habit.is_archived && (
        <div className="flex items-center justify-between p-4 bg-zinc-900 text-white rounded-2xl">
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Quick check-in</h4>
            <p className="text-sm mt-0.5 text-zinc-200">Have you done it today?</p>
          </div>
          <button onClick={() => onToggleLog(todayStr)}
            className={cn("px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              habit.history.includes(todayStr) ? "bg-white/10 text-white hover:bg-white/20" : "bg-white text-zinc-900 hover:bg-zinc-100"
            )}>
            {habit.history.includes(todayStr) ? "Done ✓" : "Mark Done"}
          </button>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white border border-zinc-100 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-800">Month Summary</h3>
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-0.5">{format(new Date(), "MMMM yyyy")}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />Done</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-zinc-100 border border-zinc-200" />Pending</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_NAMES.slice(1).concat(WEEKDAY_NAMES[0]).map((l) => (
            <span key={l} className="text-[10px] uppercase font-bold text-zinc-400">{l}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 justify-items-center">
          {calendarDays.map(({ date, isCurrentMonth }, idx) => {
            const ds = format(date, "yyyy-MM-dd");
            const done = habit.history.includes(ds);
            const isToday = ds === todayStr;
            return (
              <button key={`${ds}-${idx}`} onClick={() => !habit.is_archived && onToggleLog(ds)}
                disabled={habit.is_archived}
                className={cn("w-8 h-8 rounded-full text-xs flex items-center justify-center transition-all font-medium",
                  done ? "text-white bg-zinc-900" : cn(
                    isCurrentMonth ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-500" : "opacity-20 text-zinc-400",
                    isToday && "ring-2 ring-zinc-900 font-bold text-zinc-900"
                  )
                )}>
                {format(date, "d")}
              </button>
            );
          })}
        </div>
        <div className="pt-3 border-t border-zinc-50 flex items-center justify-around text-center">
          <div>
            <p className="text-zinc-400 text-[10px] uppercase tracking-wider">Total logged</p>
            <p className="text-lg font-black text-zinc-800">{habit.history.length}×</p>
          </div>
          <div className="w-px h-8 bg-zinc-100" />
          <div>
            <p className="text-zinc-400 text-[10px] uppercase tracking-wider">Started</p>
            <p className="text-sm font-bold text-zinc-800">{format(parseISO(habit.created_at), "MMM d, yyyy")}</p>
          </div>
        </div>
      </div>

      {/* Edit form modal */}
      {showEditForm && (
        <HabitFormModal
          editingHabit={habit}
          goals={goals}
          onSave={handleEditSave}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Habit?"
        message="All history will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => { setShowDeleteConfirm(false); onDelete(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
