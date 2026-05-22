// Goals Module Types

export type GoalStatus = 'ongoing' | 'pending' | 'achieved';

export interface Goal {
  id: string;
  title: string;
  status: GoalStatus;
  achievement_log_text: string;
  created_at: string;
}

export interface Task {
  id: string;
  goal_id: string;
  title: string;
  is_completed: boolean;
  current_due_date: string; // YYYY-MM-DD
  recurring_days: number[]; // 0-6 (Sun-Sat)
  last_generated: string | null; // YYYY-MM-DD
  created_at: string;
}

export type GoalView =
  | { type: 'dashboard'; filter: GoalStatus }
  | { type: 'goal_detail'; goalId: string };
