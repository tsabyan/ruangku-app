// Finance Module Types

export type InputMethod = 'AI' | 'SCAN' | 'MANUAL';

export interface Transaction {
  id: string;
  type: 'EXPENSE' | 'INCOME';
  amount: number;
  category: string;
  notes: string;
  date: string;
  input_method: InputMethod;
  items?: string[];
  receipt_image?: string;
}

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface UserSettings {
  monthly_budget: number;
  display_name?: string;
}

export type View = 'home' | 'add' | 'analytics' | 'settings' | 'history';
export type FinanceView = View;
