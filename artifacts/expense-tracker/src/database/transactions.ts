import { getDB, generateId, Transaction, DebtPayment } from './db';

export async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const db = await getDB();
  const tx: Transaction = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };
  await db.put('transactions', tx);
  return tx;
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAll('transactions');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<Transaction | null> {
  const db = await getDB();
  const existing = await db.get('transactions', id);
  if (!existing) return null;
  const updated = { ...existing, ...data };
  await db.put('transactions', updated);
  return updated;
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

export async function getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
  const all = await getTransactions();
  return all.filter(
    (t) =>
      t.accountId === accountId ||
      t.fromAccountId === accountId ||
      t.toAccountId === accountId
  );
}

export async function addDebtPayment(
  debtId: string,
  payment: Omit<DebtPayment, 'id' | 'createdAt'>,
  newRemainingAmount: number,
  newStatus: 'active' | 'settled'
): Promise<Transaction | null> {
  const db = await getDB();
  const existing = await db.get('transactions', debtId);
  if (!existing) return null;

  const newPayment: DebtPayment = {
    ...payment,
    id: generateId(),
    createdAt: Date.now(),
  };

  const updated: Transaction = {
    ...existing,
    remainingAmount: newRemainingAmount,
    status: newStatus,
    history: [...(existing.history ?? []), newPayment],
  };

  await db.put('transactions', updated);
  return updated;
}
