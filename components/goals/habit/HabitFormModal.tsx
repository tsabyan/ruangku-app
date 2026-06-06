"use client";

import { useState } from "react";
import { Habit, HabitColor, HabitFrequency, Goal } from "@/types/goals";
import { cn } from "@/lib/utils";
const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  editingHabit: Habit | null;
  goals: Goal[];
  presetGoalId?: string | null;  // when opened from GoalDetail
  onSave: (
    name: string, description: string, icon: string, color: HabitColor,
    frequencyType: HabitFrequency, customDays: number[], targetFrequency: number,
    goalId: string | null,
  ) => void;
  onClose: () => void;
}

export function HabitFormModal({ editingHabit, goals, presetGoalId, onSave, onClose }: Props) {
  const [name, setName] = useState(editingHabit?.name ?? "");
  const [description, setDescription] = useState(editingHabit?.description ?? "");
  const [freqType, setFreqType] = useState<HabitFrequency>(editingHabit?.frequency_type ?? "daily");
  const [customDays, setCustomDays] = useState<number[]>(editingHabit?.custom_days ?? []);
  const [targetFreq, setTargetFreq] = useState(editingHabit?.target_frequency ?? 1);
  const [goalId, setGoalId] = useState<string | null>(
    editingHabit?.goal_id ?? presetGoalId ?? null
  );

  const toggleDay = (d: number) =>
    setCustomDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), description, "✨", "indigo", freqType,
      freqType === "custom" ? customDays : [],
      freqType === "daily" ? 1 : targetFreq,
      goalId,
    );
    onClose();
  };

  const activeGoals = goals.filter((g) => g.status === "ongoing");

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 text-center">
          {editingHabit ? "Edit Habit" : "New Habit"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Name</label>
            <input type="text" required maxLength={35} placeholder="e.g. Morning Meditation"
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-zinc-300 transition-colors text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Description</label>
            <textarea placeholder="Optional notes..." value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-zinc-300 resize-none h-16 text-sm"
            />
          </div>

          {/* Link to Goal */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Link to Goal</label>
            <select
              value={goalId ?? ""}
              onChange={(e) => setGoalId(e.target.value || null)}
              disabled={!!presetGoalId}
              className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:border-zinc-300 text-sm text-zinc-700 disabled:opacity-60"
            >
              <option value="">— Standalone (no goal) —</option>
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Frequency</label>
            <div className="flex bg-zinc-100 p-1 rounded-lg">
              {(["daily", "weekly", "custom"] as HabitFrequency[]).map((f) => (
                <button key={f} type="button" onClick={() => { setFreqType(f); if (f === "daily") setTargetFreq(1); }}
                  className={cn("flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all",
                    freqType === f ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {freqType === "weekly" && (
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-800">Times per week</p>
                <p className="text-[10px] text-zinc-400">Required completions</p>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setTargetFreq((p) => Math.max(1, p - 1))} className="w-7 h-7 bg-white border border-zinc-200 rounded-md font-bold hover:bg-zinc-100">-</button>
                <span className="text-sm font-bold text-zinc-800 w-4 text-center">{targetFreq}</span>
                <button type="button" onClick={() => setTargetFreq((p) => Math.min(6, p + 1))} className="w-7 h-7 bg-white border border-zinc-200 rounded-md font-bold hover:bg-zinc-100">+</button>
              </div>
            </div>
          )}

          {freqType === "custom" && (
            <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 space-y-2">
              <p className="text-xs font-semibold text-zinc-800">Select days</p>
              <div className="flex justify-between gap-1">
                {[1,2,3,4,5,6,0].map((d) => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={cn("w-8 h-8 rounded-full text-xs font-bold transition-all",
                      customDays.includes(d) ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-100"
                    )}>
                    {WEEKDAY_NAMES[d]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-650 font-bold hover:bg-zinc-50 transition-colors text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition-colors text-xs uppercase tracking-widest"
            >
              {editingHabit ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
