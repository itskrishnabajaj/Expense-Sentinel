import { getDB, generateId, Account } from './db';

export async function getAccounts(): Promise<Account[]> {
  const db = await getDB();
  const accounts = await db.getAll('accounts');
  return accounts.sort((a, b) => a.createdAt - b.createdAt);
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  const db = await getDB();
  return db.get('accounts', id);
}

export async function addAccount(data: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
  const db = await getDB();
  const account: Account = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
  };
  await db.put('accounts', account);
  return account;
}

export async function updateAccount(id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>): Promise<Account | null> {
  const db = await getDB();
  const existing = await db.get('accounts', id);
  if (!existing) return null;
  const updated = { ...existing, ...data };
  await db.put('accounts', updated);
  return updated;
}

export async function deleteAccount(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('accounts', id);
}

export async function ensureDefaultAccount(): Promise<Account> {
  const db = await getDB();
  const accounts = await db.getAll('accounts');
  if (accounts.length > 0) {
    return accounts.sort((a, b) => a.createdAt - b.createdAt)[0];
  }
  const cash: Account = {
    id: generateId(),
    name: 'Cash',
    type: 'cash',
    balance: 0,
    createdAt: Date.now(),
  };
  await db.put('accounts', cash);
  return cash;
}
