import { getDB } from './db';

export interface AppSettings {
  monthly_budget: number;
  currency: string;
}

const DEFAULTS: AppSettings = {
  monthly_budget: 2000,
  currency: 'USD',
};

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
  const db = await getDB();
  const record = await db.get('settings', key);
  if (!record) return DEFAULTS[key];
  return record.value as AppSettings[K];
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key, value });
}

export async function getAllSettings(): Promise<AppSettings> {
  const budget = await getSetting('monthly_budget');
  const currency = await getSetting('currency');
  return { monthly_budget: budget, currency };
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['expenses', 'categories', 'settings'], 'readwrite');
  await tx.objectStore('expenses').clear();
  await tx.objectStore('categories').clear();
  await tx.objectStore('settings').clear();
  await tx.done;
}
