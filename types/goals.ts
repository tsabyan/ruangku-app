// Goals Module Types

export type GoalStatus = 'ongoing' | 'pending' | 'achieved';

export interface Goal {
  id: string;
  title: string;
  status: GoalStatus;
  achievement_log_text: string;
  created_at: string;
}

// Habit Tracker Types
export type HabitColor = 'emerald' | 'indigo' | 'rose' | 'amber' | 'sky' | 'violet' | 'fuchsia';
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  color: HabitColor;
  frequency_type: HabitFrequency;
  custom_days: number[];      // [0-6] Sun=0
  target_frequency: number;   // 1 for daily, N for weekly/custom
  is_archived: boolean;
  goal_id: string | null;     // null = standalone habit
  created_at: string;
  // Client-side: loaded from habit_logs
  history: string[];          // ['YYYY-MM-DD', ...]
}

export interface HabitLog {
  id: string;
  habit_id: string;
  log_date: string; // 'YYYY-MM-DD'
}

export type GoalView =
  | { type: 'dashboard'; filter: GoalStatus }
  | { type: 'goal_detail'; goalId: string };
