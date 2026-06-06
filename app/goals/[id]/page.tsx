'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGoalStore } from '@/hooks/useGoalStore';
import { useHabitStore } from '@/hooks/useHabitStore';
import { GoalDetail } from '@/components/goals/GoalDetail';

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { goals, isReady: goalsReady, updateGoal, deleteGoal } = useGoalStore();
  const { habits, isReady: habitsReady, addHabit, toggleHabitLog } = useHabitStore();

  if (!goalsReady || !habitsReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  const goal = goals.find((g) => g.id === id);
  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-white">
        <p className="text-zinc-400 text-sm">Goal tidak ditemukan</p>
        <button onClick={() => router.push('/goals')} className="text-zinc-900 font-semibold text-sm underline">
          Kembali ke Goals
        </button>
      </div>
    );
  }

  const goalHabits = habits.filter((h) => h.goal_id === id);

  return (
    <GoalDetail
      goal={goal}
      goals={goals}
      habits={goalHabits}
      onUpdateGoal={(updates) => updateGoal(id, updates)}
      onDeleteGoal={() => { deleteGoal(id); router.push('/goals'); }}
      onAddHabit={addHabit}
      onToggleHabitLog={toggleHabitLog}
    />
  );
}
