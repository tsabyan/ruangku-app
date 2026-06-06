"use client";

import { useParams, useRouter } from "next/navigation";
import { useHabitStore } from "@/hooks/useHabitStore";
import { useGoalStore } from "@/hooks/useGoalStore";
import { HabitDetailView } from "@/components/goals/habit/HabitDetailView";
import { format } from "date-fns";

export default function HabitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { habits, isReady: habitsReady, updateHabit, deleteHabit, toggleHabitLog } = useHabitStore();
  const { goals, isReady: goalsReady } = useGoalStore();

  if (!habitsReady || !goalsReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  const habit = habits.find((h) => h.id === id);
  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-white">
        <p className="text-zinc-400 text-sm">Habit not found</p>
        <button onClick={() => router.push("/goals/habits")} className="text-zinc-900 font-semibold text-sm underline">
          Back to Habits
        </button>
      </div>
    );
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="px-6 pt-6 pb-28 min-h-screen bg-white">
      <HabitDetailView
        habit={habit}
        goals={goals}
        todayStr={todayStr}
        onBack={() => router.back()}
        onEdit={() => {}} // edit handled inside detail view via its own modal
        onDelete={() => { deleteHabit(habit.id); router.back(); }}
        onToggleArchive={() => { updateHabit(habit.id, { is_archived: !habit.is_archived }); router.back(); }}
        onToggleLog={(d) => toggleHabitLog(habit.id, d)}
        onUpdateHabit={(updates) => updateHabit(habit.id, updates)}
      />
    </div>
  );
}
