import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { Expense, Category } from '../database';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../database/expenses';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../database/categories';
import { getAllSettings, setSetting, clearAllData, AppSettings, SETTINGS_DEFAULTS } from '../database/settings';

interface AppContextValue {
  expenses: Expense[];
  categories: Category[];
  settings: AppSettings;
  loading: boolean;
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [expData, catData, setData] = await Promise.all([
        getExpenses(),
        getCategories(),
        getAllSettings(),
      ]);
      setExpenses(expData);
      setCategories(catData);
      setSettings(setData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddExpense = useCallback(async (data: Omit<Expense, 'id' | 'createdAt'>) => {
    const expense = await addExpense(data);
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  const handleUpdateExpense = useCallback(async (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    const updated = await updateExpense(id, data);
    if (updated) {
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    }
    return updated;
  }, []);

  const handleDeleteExpense = useCallback(async (id: string) => {
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleAddCategory = useCallback(async (data: Omit<Category, 'id'>) => {
    const cat = await addCategory(data);
    setCategories((prev) => [...prev, cat]);
    return cat;
  }, []);

  const handleUpdateCategory = useCallback(async (id: string, data: Partial<Omit<Category, 'id'>>) => {
    const updated = await updateCategory(id, data);
    if (updated) {
      setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
    return updated;
  }, []);

  const handleDeleteCategory = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleUpdateSetting = useCallback(async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    await setSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearAllData();
    setExpenses([]);
    setCategories([]);
    setSettings(SETTINGS_DEFAULTS);
    await loadAll();
  }, [loadAll]);

  return (
    <AppContext.Provider value={{
      expenses,
      categories,
      settings,
      loading,
      addExpense: handleAddExpense,
      updateExpense: handleUpdateExpense,
      deleteExpense: handleDeleteExpense,
      addCategory: handleAddCategory,
      updateCategory: handleUpdateCategory,
      deleteCategory: handleDeleteCategory,
      updateSetting: handleUpdateSetting,
      clearAll: handleClearAll,
      refresh: loadAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
