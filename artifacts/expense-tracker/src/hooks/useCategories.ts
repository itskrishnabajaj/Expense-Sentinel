import { useState, useEffect, useCallback } from 'react';
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  Category,
} from '../database';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (data: Omit<Category, 'id'>) => {
    const category = await addCategory(data);
    setCategories((prev) => [...prev, category]);
    return category;
  }, []);

  const update = useCallback(async (id: string, data: Partial<Omit<Category, 'id'>>) => {
    const updated = await updateCategory(id, data);
    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, loading, add, update, remove, refresh: load };
}
