import { openDB, IDBPDatabase } from 'idb';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Settings {
  key: string;
  value: string | number;
}

export type AccountType = 'cash' | 'bank' | 'savings';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer' | 'debt';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  categoryId?: string;
  note?: string;
  date: string;
  debtType?: 'taken' | 'given';
  isOld?: boolean;
  createdAt: number;
}

const DB_NAME = 'expense-tracker-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase | null = null;
let dbError: Error | null = null;
let needsMigrationV2 = false;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbError) throw dbError;
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('by-date', 'date');
          expenseStore.createIndex('by-category', 'category');
          expenseStore.createIndex('by-createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-type', 'type');
          txStore.createIndex('by-createdAt', 'createdAt');
        }
        if (oldVersion < 2) {
          needsMigrationV2 = true;
        }
      },
      blocked() {
        dbInstance = null;
      },
      blocking() {
        dbInstance?.close();
        dbInstance = null;
      },
      terminated() {
        dbInstance = null;
      },
    });

    if (needsMigrationV2 && dbInstance) {
      await runMigrationV2(dbInstance);
      needsMigrationV2 = false;
    }
  } catch (err) {
    dbError = err instanceof Error ? err : new Error('IndexedDB unavailable');
    throw dbError;
  }

  return dbInstance;
}

async function runMigrationV2(db: IDBPDatabase): Promise<void> {
  const existingAccounts = await db.getAll('accounts');
  if (existingAccounts.length > 0) {
    return;
  }

  const cashAccount: Account = {
    id: generateId(),
    name: 'Cash',
    type: 'cash',
    balance: 0,
    createdAt: Date.now(),
  };

  const existingExpenses: Expense[] = await db.getAll('expenses');

  const tx = db.transaction(['accounts', 'transactions'], 'readwrite');
  await tx.objectStore('accounts').put(cashAccount);

  for (const expense of existingExpenses) {
    const transaction: Transaction = {
      id: expense.id,
      type: 'expense',
      amount: expense.amount,
      accountId: cashAccount.id,
      categoryId: expense.category,
      note: expense.note,
      date: expense.date,
      createdAt: expense.createdAt,
    };
    await tx.objectStore('transactions').put(transaction);
  }

  await tx.done;
}

export function resetDB(): void {
  dbInstance = null;
  dbError = null;
  needsMigrationV2 = false;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
