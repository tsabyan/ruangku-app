"use client";

import { useState } from "react";
import { useHabitStore } from "@/hooks/useHabitStore";
import { useGoalStore } from "@/hooks/useGoalStore";
import { HabitTracker } from "@/components/goals/HabitTracker";
import FloatNav from "@/components/ui/FloatNav";
import { useRouter } from "next/navigation";
import { Target, Flame } from "lucide-react";

export default function HabitsPage() {
  const { habits, isReady: habitsReady, addHabit, updateHabit, deleteHabit, toggleHabitLog } = useHabitStore();
  const { goals, isReady: goalsReady } = useGoalStore();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  if (!habitsReady || !goalsReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <HabitTracker
        habits={habits}
        goals={goals}
        isCreating={isCreating}
        onCreatingClose={() => setIsCreating(false)}
        onAddHabit={addHabit}
        onUpdateHabit={updateHabit}
        onDeleteHabit={deleteHabit}
        onToggleHabitLog={toggleHabitLog}
      />
      <FloatNav
        onPlus={() => setIsCreating(true)}
        gridItems={[
          { label: "Goals", icon: <Target size={22} />, onClick: () => router.push("/goals"), active: false },
          { label: "Habits", icon: <Flame size={22} />, onClick: () => router.push("/goals/habits"), active: true },
        ]}
      />
    </>
  );
}
