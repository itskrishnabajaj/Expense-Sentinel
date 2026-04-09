import { getDB, generateId, Expense } from './db';

export async function addExpense(data: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
  const db = await getDB();
  const expense: Expense = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };
  await db.put('expenses', expense);
  return expense;
}

export async function getExpenses(): Promise<Expense[]> {
  const db = await getDB();
  const all = await db.getAll('expenses');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getExpenseById(id: string): Promise<Expense | undefined> {
  const db = await getDB();
  return db.get('expenses', id);
}

export async function updateExpense(id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>): Promise<Expense | null> {
  const db = await getDB();
  const existing = await db.get('expenses', id);
  if (!existing) return null;
  const updated = { ...existing, ...data };
  await db.put('expenses', updated);
  return updated;
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
}

export async function getExpensesByMonth(year: number, month: number): Promise<Expense[]> {
  const all = await getExpenses();
  return all.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export async function getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
  const all = await getExpenses();
  return all.filter((e) => e.date >= startDate && e.date <= endDate);
}
