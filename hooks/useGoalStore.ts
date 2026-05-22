'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, getDay } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { Goal, Task, GoalStatus } from '@/types/goals';

export function useGoalStore() {
  const supabase = createClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsReady(true); return; }
      setUserId(user.id);

      const [goalsRes, tasksRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('user_id', user.id),
      ]);

      let loadedGoals: Goal[] = goalsRes.data?.map((g) => ({
        id: g.id,
        title: g.title,
        status: g.status as GoalStatus,
        achievement_log_text: g.achievement_log_text ?? '',
        created_at: g.created_at,
      })) ?? [];

      let loadedTasks: Task[] = tasksRes.data?.map((t) => ({
        id: t.id,
        goal_id: t.goal_id,
        title: t.title,
        is_completed: t.is_completed,
        current_due_date: t.current_due_date,
        recurring_days: t.recurring_days ?? [],
        last_generated: t.last_generated,
        created_at: t.created_at,
      })) ?? [];

      // Client-side: rollover + recurring logic
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayDay = getDay(new Date());

      const rolledTasks = loadedTasks.map((t) =>
        !t.is_completed && t.current_due_date < todayStr
          ? { ...t, current_due_date: todayStr }
          : t
      );

      const newInstances: Task[] = [];
      const updatedTasks = rolledTasks.map((t) => {
        const isRecurringToday = t.recurring_days.includes(todayDay);
        const wasAlreadyGeneratedToday = t.last_generated === todayStr;
        if (isRecurringToday && !wasAlreadyGeneratedToday) {
          newInstances.push({
            ...t,
            id: crypto.randomUUID(),
            is_completed: false,
            current_due_date: todayStr,
            last_generated: todayStr,
            created_at: new Date().toISOString(),
          });
          return { ...t, last_generated: todayStr };
        }
        return t;
      });

      // Persist rollover changes
      if (newInstances.length > 0) {
        await supabase.from('tasks').insert(
          newInstances.map((t) => ({
            id: t.id,
            goal_id: t.goal_id,
            user_id: user.id,
            title: t.title,
            is_completed: t.is_completed,
            current_due_date: t.current_due_date,
            recurring_days: t.recurring_days,
            last_generated: t.last_generated,
          }))
        );
      }

      setGoals(loadedGoals);
      setTasks([...updatedTasks, ...newInstances]);
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
      const newGoal: Goal = {
        id: data.id,
        title: data.title,
        status: data.status as GoalStatus,
        achievement_log_text: data.achievement_log_text ?? '',
        created_at: data.created_at,
      };
      setGoals((prev) => [...prev, newGoal]);
    }
  }, [userId]);

  const updateGoal = useCallback(async (goalId: string, updates: Partial<Goal>) => {
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, ...updates } : g));
    await supabase.from('goals').update(updates).eq('id', goalId);
  }, []);

  const deleteGoal = useCallback(async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setTasks((prev) => prev.filter((t) => t.goal_id !== goalId));
    await supabase.from('goals').delete().eq('id', goalId);
    // tasks cascade deleted via FK
  }, []);

  const addTask = useCallback(async (goalId: string, title: string, recurring_days: number[]) => {
    if (!userId) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase.from('tasks').insert({
      user_id: userId,
      goal_id: goalId,
      title,
      is_completed: false,
      current_due_date: todayStr,
      recurring_days,
      last_generated: recurring_days.length > 0 ? todayStr : null,
    }).select().single();

    if (!error && data) {
      const newTask: Task = {
        id: data.id,
        goal_id: data.goal_id,
        title: data.title,
        is_completed: data.is_completed,
        current_due_date: data.current_due_date,
        recurring_days: data.recurring_days ?? [],
        last_generated: data.last_generated,
        created_at: data.created_at,
      };
      setTasks((prev) => [...prev, newTask]);
    }
  }, [userId]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, ...updates } : t));
    await supabase.from('tasks').update(updates).eq('id', taskId);
  }, []);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newVal = !task.is_completed;
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, is_completed: newVal } : t));
    await supabase.from('tasks').update({ is_completed: newVal }).eq('id', taskId);
  }, [tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  }, []);

  return {
    goals, tasks, isReady,
    addGoal, updateGoal, deleteGoal,
    addTask, updateTask, toggleTask, deleteTask,
  };
}
