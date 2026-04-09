import { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import { Expense, Category, Account, Transaction } from '../database';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../database/expenses';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../database/categories';
import { getAllSettings, setSetting, clearAllData, AppSettings, SETTINGS_DEFAULTS } from '../database/settings';
import {
  getAccounts,
  addAccount as dbAddAccount,
  updateAccount as dbUpdateAccount,
  deleteAccount as dbDeleteAccount,
  ensureDefaultAccount,
} from '../database/accounts';
import {
  getTransactions,
  addTransaction as dbAddTransaction,
  updateTransaction as dbUpdateTransaction,
  deleteTransaction as dbDeleteTransaction,
} from '../database/transactions';

interface AppContextValue {
  expenses: Expense[];
  categories: Category[];
  settings: AppSettings;
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  dbUnavailable: boolean;
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<void>;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  addAccount: (data: Omit<Account, 'id' | 'createdAt'>) => Promise<Account>;
  updateAccount: (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => Promise<Account | null>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => Promise<Transaction | null>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(SETTINGS_DEFAULTS);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbUnavailable, setDbUnavailable] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await ensureDefaultAccount();
      const [expData, catData, setData, accData, txData] = await Promise.all([
        getExpenses(),
        getCategories(),
        getAllSettings(),
        getAccounts(),
        getTransactions(),
      ]);
      setExpenses(expData);
      setCategories(catData);
      setSettings(setData);
      setAccounts(accData);
      setTransactions(txData);
      setDbUnavailable(false);
    } catch {
      setDbUnavailable(true);
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

  const handleAddAccount = useCallback(async (data: Omit<Account, 'id' | 'createdAt'>) => {
    const account = await dbAddAccount(data);
    setAccounts((prev) => [...prev, account]);
    return account;
  }, []);

  const handleUpdateAccount = useCallback(async (id: string, data: Partial<Omit<Account, 'id' | 'createdAt'>>) => {
    const updated = await dbUpdateAccount(id, data);
    if (updated) {
      setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    }
    return updated;
  }, []);

  const handleDeleteAccount = useCallback(async (id: string) => {
    await dbDeleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleAddTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const tx = await dbAddTransaction(data);
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  }, []);

  const handleUpdateTransaction = useCallback(async (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    const updated = await dbUpdateTransaction(id, data);
    if (updated) {
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    }
    return updated;
  }, []);

  const handleDeleteTransaction = useCallback(async (id: string) => {
    await dbDeleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearAllData();
    setExpenses([]);
    setCategories([]);
    setSettings(SETTINGS_DEFAULTS);
    setAccounts([]);
    setTransactions([]);
    await loadAll();
  }, [loadAll]);

  const contextValue = useMemo(() => ({
    expenses,
    categories,
    settings,
    accounts,
    transactions,
    loading,
    dbUnavailable,
    addExpense: handleAddExpense,
    updateExpense: handleUpdateExpense,
    deleteExpense: handleDeleteExpense,
    addCategory: handleAddCategory,
    updateCategory: handleUpdateCategory,
    deleteCategory: handleDeleteCategory,
    updateSetting: handleUpdateSetting,
    addAccount: handleAddAccount,
    updateAccount: handleUpdateAccount,
    deleteAccount: handleDeleteAccount,
    addTransaction: handleAddTransaction,
    updateTransaction: handleUpdateTransaction,
    deleteTransaction: handleDeleteTransaction,
    clearAll: handleClearAll,
    refresh: loadAll,
  }), [
    expenses, categories, settings, accounts, transactions, loading, dbUnavailable,
    handleAddExpense, handleUpdateExpense, handleDeleteExpense,
    handleAddCategory, handleUpdateCategory, handleDeleteCategory,
    handleUpdateSetting,
    handleAddAccount, handleUpdateAccount, handleDeleteAccount,
    handleAddTransaction, handleUpdateTransaction, handleDeleteTransaction,
    handleClearAll, loadAll,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
