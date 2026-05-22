'use client';

import { useState } from 'react';
import { GoalStatus } from '@/types/goals';
import { useGoalStore } from '@/hooks/useGoalStore';
import { GoalDashboard } from '@/components/goals/GoalDashboard';

export default function GoalsPage() {
  const [filter, setFilter] = useState<GoalStatus>('ongoing');
  const { goals, isReady, addGoal, updateGoal } = useGoalStore();

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-400 rounded-full animate-spin" />
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <GoalDashboard
      goals={goals}
      currentFilter={filter}
      onSetFilter={setFilter}
      onAddGoal={addGoal}
      onUpdateGoal={updateGoal}
    />
  );
}
