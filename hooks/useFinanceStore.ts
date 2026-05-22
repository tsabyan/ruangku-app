'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Transaction, CategoryBudget } from '@/types/finance';

const DEFAULT_CAT_BUDGETS: CategoryBudget[] = [
  { category: 'F&B', limit: 1500000 },
  { category: 'Transport', limit: 800000 },
  { category: 'Groceries', limit: 1000000 },
  { category: 'Shopping', limit: 500000 },
  { category: 'Entertainment', limit: 500000 },
  { category: 'Other', limit: 700000 },
];

export function useFinanceStore() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetLimit, setBudgetLimitState] = useState<number>(5000000);
  const [categoryBudgets, setCategoryBudgetsState] = useState<CategoryBudget[]>(DEFAULT_CAT_BUDGETS);
  const [isLoading, setIsLoading] = useState(true);

  // Get user + fetch all data
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }
      setUserId(user.id);

      const [txRes, settingsRes, catRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
        supabase.from('category_budgets').select('*').eq('user_id', user.id),
      ]);

      if (txRes.data) {
        setTransactions(txRes.data.map((t) => ({
          id: t.id,
          type: t.type as 'EXPENSE' | 'INCOME',
          amount: t.amount,
          category: t.category,
          notes: t.notes ?? '',
          date: t.date,
          input_method: t.input_method as 'AI' | 'SCAN' | 'MANUAL',
        })));
      }

      if (settingsRes.data) {
        setBudgetLimitState(settingsRes.data.monthly_budget ?? 5000000);
      }

      if (catRes.data && catRes.data.length > 0) {
        setCategoryBudgetsState(
          catRes.data.map((cb) => ({ category: cb.category, limit: cb.budget_limit }))
        );
      } else {
        // Seed default category budgets for new user
        await supabase.from('category_budgets').insert(
          DEFAULT_CAT_BUDGETS.map((cb) => ({
            user_id: user.id,
            category: cb.category,
            budget_limit: cb.limit,
          }))
        );
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const totalExpense = useMemo(() => {
    const now = new Date();
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'EXPENSE' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const budgetRemaining = budgetLimit - totalExpense;

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'date'>) => {
    if (!userId) return;
    const { data, error } = await supabase.from('transactions').insert({
      user_id: userId,
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      notes: tx.notes,
      input_method: tx.input_method,
      date: new Date().toISOString(),
    }).select().single();

    if (!error && data) {
      const newTx: Transaction = {
        id: data.id,
        type: data.type,
        amount: data.amount,
        category: data.category,
        notes: data.notes ?? '',
        date: data.date,
        input_method: data.input_method,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  }, [userId]);

  const setBudgetLimit = useCallback(async (amount: number) => {
    if (!userId) return;
    setBudgetLimitState(amount);
    await supabase.from('user_settings').upsert({
      user_id: userId,
      monthly_budget: amount,
      updated_at: new Date().toISOString(),
    });
  }, [userId]);

  const updateCategoryBudget = useCallback(async (category: string, amount: number) => {
    if (!userId) return;
    setCategoryBudgetsState((prev) =>
      prev.map((cb) => cb.category === category ? { ...cb, limit: amount } : cb)
    );
    await supabase.from('category_budgets').upsert({
      user_id: userId,
      category,
      budget_limit: amount,
    }, { onConflict: 'user_id,category' });
  }, [userId]);

  return {
    transactions, totalExpense, budgetLimit, budgetRemaining, categoryBudgets,
    isLoading,
    addTransaction, setBudgetLimit, updateCategoryBudget,
  };
}
