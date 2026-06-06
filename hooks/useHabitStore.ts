'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { Habit, HabitColor, HabitFrequency } from '@/types/goals';

// ─── Streak Helper ────────────────────────────────────────────────────────────

export function getStreaks(history: string[]): { current: number; best: number } {
  if (history.length === 0) return { current: 0, best: 0 };

  const uniqueDates = Array.from(new Set(history))
    .map((d) => parseISO(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDates.length === 0) return { current: 0, best: 0 };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const today = parseISO(todayStr);

  const latestDate = uniqueDates[0];
  const diffFromToday = differenceInCalendarDays(today, latestDate);

  let current = 0;
  if (diffFromToday <= 1) {
    current = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const diff = differenceInCalendarDays(uniqueDates[i], uniqueDates[i + 1]);
      if (diff === 1) current++;
      else if (diff > 1) break;
    }
  }

  const ascDates = [...uniqueDates].reverse();
  let best = 0, tempStreak = 0;
  for (let i = 0; i < ascDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const diff = differenceInCalendarDays(ascDates[i], ascDates[i - 1]);
      if (diff === 1) tempStreak++;
      else if (diff > 1) { best = Math.max(best, tempStreak); tempStreak = 1; }
    }
  }
  best = Math.max(best, tempStreak);

  return { current, best };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHabitStore() {
  const supabase = createClient();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsReady(true); return; }
      setUserId(user.id);

      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habit_logs').select('*').eq('user_id', user.id),
      ]);

      const logsByHabit: Record<string, string[]> = {};
      for (const log of logsRes.data ?? []) {
        if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = [];
        logsByHabit[log.habit_id].push(log.log_date);
      }

      const loadedHabits: Habit[] = (habitsRes.data ?? []).map((h) => ({
        id: h.id,
        user_id: h.user_id,
        name: h.name,
        description: h.description ?? '',
        icon: h.icon ?? '✨',
        color: h.color as HabitColor,
        frequency_type: h.frequency_type as HabitFrequency,
        custom_days: h.custom_days ?? [],
        target_frequency: h.target_frequency ?? 1,
        is_archived: h.is_archived ?? false,
        goal_id: h.goal_id ?? null,
        created_at: h.created_at,
        history: logsByHabit[h.id] ?? [],
      }));

      setHabits(loadedHabits);
      setIsReady(true);
    };
    init();
  }, []);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const addHabit = useCallback(async (
    name: string,
    description: string,
    icon: string,
    color: HabitColor,
    frequency_type: HabitFrequency,
    custom_days: number[],
    target_frequency: number,
    goal_id?: string | null,
  ) => {
    if (!userId) return;

    const { data, error } = await supabase.from('habits').insert({
      user_id: userId,
      name,
      description,
      icon: icon || '✨',
      color,
      frequency_type,
      custom_days: frequency_type === 'custom' ? custom_days : [],
      target_frequency: frequency_type === 'daily' ? 1 : target_frequency,
      is_archived: false,
      goal_id: goal_id ?? null,
    }).select().single();

    if (!error && data) {
      const newHabit: Habit = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        description: data.description ?? '',
        icon: data.icon ?? '✨',
        color: data.color as HabitColor,
        frequency_type: data.frequency_type as HabitFrequency,
        custom_days: data.custom_days ?? [],
        target_frequency: data.target_frequency ?? 1,
        is_archived: data.is_archived ?? false,
        goal_id: data.goal_id ?? null,
        created_at: data.created_at,
        history: [],
      };
      setHabits((prev) => [newHabit, ...prev]);
    }
  }, [userId]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    const { history: _h, ...dbUpdates } = updates as Partial<Habit> & { history?: string[] };
    await supabase.from('habits').update(dbUpdates).eq('id', id);
  }, []);

  const deleteHabit = useCallback(async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await supabase.from('habits').delete().eq('id', id);
  }, []);

  // ── Log Toggle ────────────────────────────────────────────────────────────

  const toggleHabitLog = useCallback(async (habitId: string, dateStr: string) => {
    if (!userId) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const alreadyLogged = habit.history.includes(dateStr);

    setHabits((prev) => prev.map((h) => {
      if (h.id !== habitId) return h;
      const newHistory = alreadyLogged
        ? h.history.filter((d) => d !== dateStr)
        : [...h.history, dateStr];
      return { ...h, history: newHistory };
    }));

    if (alreadyLogged) {
      await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('log_date', dateStr);
    } else {
      await supabase.from('habit_logs').insert({ habit_id: habitId, user_id: userId, log_date: dateStr });
    }
  }, [habits, userId]);

  return { habits, isReady, addHabit, updateHabit, deleteHabit, toggleHabitLog };
}
