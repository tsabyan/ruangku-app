'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Goal, GoalStatus } from '@/types/goals';

export function useGoalStore() {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsReady(true); return; }
      setUserId(user.id);

      const goalsRes = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      const loadedGoals: Goal[] = (goalsRes.data ?? []).map((g) => ({
        id: g.id,
        title: g.title,
        status: g.status as GoalStatus,
        achievement_log_text: g.achievement_log_text ?? '',
        created_at: g.created_at,
      }));

      setGoals(loadedGoals);
      setIsReady(true);
    };
    init();
  }, []);

  const addGoal = useCallback(async (title: string) => {
    if (!userId) return;
    const { data, error } = await supabase.from('goals').insert({
      user_id: userId,
      title,
      status: 'ongoing',
      achievement_log_text: '',
    }).select().single();

    if (!error && data) {
      setGoals((prev) => [...prev, {
        id: data.id,
        title: data.title,
        status: data.status as GoalStatus,
        achievement_log_text: data.achievement_log_text ?? '',
        created_at: data.created_at,
      }]);
    }
  }, [userId]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, ...updates } : g));
    await supabase.from('goals').update(updates).eq('id', goalId);
  }, []);

  const deleteGoal = useCallback(async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    await supabase.from('goals').delete().eq('id', goalId);
    // habits with goal_id = goalId will have goal_id SET NULL via DB cascade
  }, []);

  return { goals, isReady, addGoal, updateGoal, deleteGoal };
}
