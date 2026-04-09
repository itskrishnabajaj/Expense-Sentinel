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

const DB_NAME = 'expense-tracker-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;
let dbError: Error | null = null;

export async function getDB(): Promise<IDBPDatabase> {
  if (dbError) throw dbError;
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
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
  } catch (err) {
    dbError = err instanceof Error ? err : new Error('IndexedDB unavailable');
    throw dbError;
  }

  return dbInstance;
}

export function resetDB(): void {
  dbInstance = null;
  dbError = null;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
