import { useState, useEffect, useCallback } from 'react';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  getExpensesByMonth,
  Expense,
} from '../database';

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    const expense = await addExpense(data);
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  const update = useCallback(async (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    const updated = await updateExpense(id, data);
    if (updated) {
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    }
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getMonthExpenses = useCallback(async (year: number, month: number) => {
    return getExpensesByMonth(year, month);
  }, []);

  return { expenses, loading, add, update, remove, getMonthExpenses, refresh: load };
}

export function useMonthExpenses(year: number, month: number) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getExpensesByMonth(year, month).then((data) => {
      setExpenses(data);
      setLoading(false);
    });
  }, [year, month]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const byDay = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + e.amount;
    return acc;
  }, {});

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const daysPassed = year === today.getFullYear() && month === today.getMonth()
    ? today.getDate()
    : daysInMonth;

  const dailyAvg = daysPassed > 0 ? total / daysPassed : 0;

  return { expenses, loading, total, byCategory, byDay, dailyAvg };
}
