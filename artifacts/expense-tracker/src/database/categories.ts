import { getDB, generateId, Category } from './db';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#F97316' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#3B82F6' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#EC4899' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#8B5CF6' },
  { id: 'health', name: 'Health', icon: '💊', color: '#10B981' },
  { id: 'utilities', name: 'Utilities', icon: '⚡', color: '#F59E0B' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#06B6D4' },
  { id: 'education', name: 'Education', icon: '📚', color: '#6366F1' },
  { id: 'personal', name: 'Personal', icon: '👤', color: '#84CC16' },
  { id: 'other', name: 'Other', icon: '💰', color: '#6B7280' },
];

export async function getCategories(): Promise<Category[]> {
  const db = await getDB();
  const categories = await db.getAll('categories');
  if (categories.length === 0) {
    await initDefaultCategories();
    return DEFAULT_CATEGORIES;
  }
  return categories;
}

export async function initDefaultCategories(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  for (const cat of DEFAULT_CATEGORIES) {
    await tx.store.put(cat);
  }
  await tx.done;
}

export async function addCategory(data: Omit<Category, 'id'>): Promise<Category> {
  const db = await getDB();
  const category: Category = { ...data, id: generateId() };
  await db.put('categories', category);
  return category;
}

export async function updateCategory(id: string, data: Partial<Omit<Category, 'id'>>): Promise<Category | null> {
  const db = await getDB();
  const existing = await db.get('categories', id);
  if (!existing) return null;
  const updated = { ...existing, ...data };
  await db.put('categories', updated);
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('categories', id);
}
