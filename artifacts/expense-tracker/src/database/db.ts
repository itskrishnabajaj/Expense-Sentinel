import { openDB, IDBPDatabase } from 'idb';

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  note: string;
  createdAt: number;
  countInBudget?: boolean;
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

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  createdAt: number;
}

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
  expenseId?: string;
  createdAt: number;
  remainingAmount?: number;
  status?: 'active' | 'settled';
  history?: DebtPayment[];
}

export const APP_VERSION = '1.2.0';

const DB_NAME = 'expense-tracker-db';
const DB_VERSION = 3;

let dbInstance: IDBPDatabase | null = null;
let dbError: Error | null = null;
let needsMigrationV2 = false;
let needsMigrationV3 = false;

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
        if (oldVersion < 3) {
          needsMigrationV3 = true;
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
    if (needsMigrationV3 && dbInstance) {
      await runMigrationV3(dbInstance);
      needsMigrationV3 = false;
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

async function runMigrationV3(db: IDBPDatabase): Promise<void> {
  const allTransactions: Transaction[] = await db.getAll('transactions');
  const needsPatch = allTransactions.filter(
    (t) =>
      t.type === 'debt' &&
      (t.remainingAmount === undefined || t.status === undefined || t.history === undefined)
  );

  if (needsPatch.length === 0) return;

  const idbTx = db.transaction('transactions', 'readwrite');
  for (const debt of needsPatch) {
    const patched: Transaction = {
      ...debt,
      remainingAmount: debt.remainingAmount ?? debt.amount,
      status: debt.status ?? 'active',
      history: debt.history ?? [],
    };
    await idbTx.objectStore('transactions').put(patched);
  }
  await idbTx.done;

  await db.put('settings', { key: 'appVersion', value: APP_VERSION });
}

export async function migrateIfNeeded(): Promise<boolean> {
  const db = await getDB();

  const versionRecord = await db.get('settings', 'appVersion');
  const storedVersion = versionRecord?.value as string | undefined;

  if (storedVersion === APP_VERSION) {
    return false;
  }

  const allTransactions: Transaction[] = await db.getAll('transactions');
  const needsPatch = allTransactions.filter(
    (t) =>
      t.type === 'debt' &&
      (t.remainingAmount === undefined || t.status === undefined || t.history === undefined)
  );

  let migrated = false;
  if (needsPatch.length > 0) {
    const idbTx = db.transaction('transactions', 'readwrite');
    for (const debt of needsPatch) {
      const patched: Transaction = {
        ...debt,
        remainingAmount: debt.remainingAmount ?? debt.amount,
        status: debt.status ?? 'active',
        history: debt.history ?? [],
      };
      await idbTx.objectStore('transactions').put(patched);
    }
    await idbTx.done;
    migrated = true;
  }

  await db.put('settings', { key: 'appVersion', value: APP_VERSION });
  return migrated;
}

export function resetDB(): void {
  dbInstance = null;
  dbError = null;
  needsMigrationV2 = false;
  needsMigrationV3 = false;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
