import { useState, useMemo, useCallback } from 'react';
import { Trash2, Pencil, X, Filter, TrendingUp, ArrowLeftRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { GenericPageSkeleton } from '../components/Skeleton';
import { AddExpense } from './AddExpense';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Expense, Transaction } from '../database';

const TYPE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Income' },
  { key: 'transfer', label: 'Transfers' },
  { key: 'debt', label: 'Debts' },
] as const;

type FilterKey = typeof TYPE_FILTERS[number]['key'];

const ACCOUNT_TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

function TxTypeIcon({ tx, catIcon, catColor }: { tx: Transaction; catIcon?: string; catColor?: string }) {
  switch (tx.type) {
    case 'income':
      return (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)' }}>
          <TrendingUp size={17} className="text-emerald-400" />
        </div>
      );
    case 'transfer':
      return (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <ArrowLeftRight size={17} className="text-blue-400" />
        </div>
      );
    case 'debt':
      return (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}>
          <AlertCircle size={17} className="text-amber-400" />
        </div>
      );
    default:
      if (catIcon && catColor) {
        return <CategoryIcon icon={catIcon} color={catColor} size="md" />;
      }
      return (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.12)' }}>
          <ShoppingBag size={17} className="text-red-400" />
        </div>
      );
  }
}

function txSubLabel(tx: Transaction, accountMap: Map<string, { name: string; type: string }>, catName?: string) {
  switch (tx.type) {
    case 'income': {
      const acc = tx.accountId ? accountMap.get(tx.accountId) : undefined;
      return acc ? `${ACCOUNT_TYPE_ICONS[acc.type] ?? '💳'} ${acc.name}` : 'Income';
    }
    case 'expense':
      return catName || 'Expense';
    case 'transfer': {
      const from = tx.fromAccountId ? accountMap.get(tx.fromAccountId) : undefined;
      const to = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;
      return `${from?.name || '?'} → ${to?.name || '?'}`;
    }
    case 'debt':
      return tx.debtType === 'taken' ? 'Borrowed' : 'Lent';
  }
}

function txTitle(tx: Transaction, catName?: string) {
  switch (tx.type) {
    case 'income':
      return tx.note || 'Income';
    case 'expense':
      return tx.note || catName || 'Expense';
    case 'transfer':
      return 'Transfer';
    case 'debt':
      return tx.note || (tx.debtType === 'taken' ? 'Borrowed' : 'Lent');
  }
}

function txAmountLabel(tx: Transaction, currency: string) {
  switch (tx.type) {
    case 'income':
      return { label: `+${formatCurrency(tx.amount, currency)}`, color: '#34D399' };
    case 'expense':
      return { label: `-${formatCurrency(tx.amount, currency)}`, color: '#ffffff' };
    case 'transfer':
      return { label: formatCurrency(tx.amount, currency), color: '#60A5FA' };
    case 'debt':
      return {
        label: `${tx.debtType === 'taken' ? '+' : '-'}${formatCurrency(tx.amount, currency)}`,
        color: tx.debtType === 'taken' ? '#34D399' : '#F87171',
      };
  }
}

export function History() {
  const {
    expenses,
    transactions,
    categories,
    accounts,
    settings,
    deleteExpense,
    deleteTransaction,
    updateAccount,
    loading,
  } = useApp();

  const [filterType, setFilterType] = useState<FilterKey>('all');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, { name: a.name, type: a.type }])),
    [accounts]
  );

  const allItems = useMemo((): Transaction[] => {
    if (transactions.length > 0) {
      return transactions;
    }
    return expenses.map((e): Transaction => ({
      id: e.id,
      type: 'expense',
      amount: e.amount,
      categoryId: e.category,
      note: e.note,
      date: e.date,
      createdAt: e.createdAt,
    }));
  }, [transactions, expenses]);

  const filtered = useMemo(() => {
    if (filterType === 'all') return allItems;
    return allItems.filter((t) => t.type === filterType);
  }, [allItems, filterType]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleDeleteTransaction = useCallback(async (tx: Transaction) => {
    setDeletingId(tx.id);
    try {
      if (tx.type === 'expense') {
        const expId = tx.expenseId ?? tx.id;
        await deleteExpense(expId);
        try { await deleteTransaction(tx.id); } catch { /* tx record may not exist for legacy expenses */ }
        if (tx.accountId) {
          const acc = accounts.find((a) => a.id === tx.accountId);
          if (acc) await updateAccount(tx.accountId, { balance: acc.balance + tx.amount });
        }
      } else {
        await deleteTransaction(tx.id);
        if (tx.type === 'income' && tx.accountId) {
          const acc = accounts.find((a) => a.id === tx.accountId);
          if (acc) await updateAccount(tx.accountId, { balance: acc.balance - tx.amount });
        } else if (tx.type === 'transfer') {
          const from = tx.fromAccountId ? accounts.find((a) => a.id === tx.fromAccountId) : undefined;
          const to = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : undefined;
          if (from && tx.fromAccountId) await updateAccount(tx.fromAccountId, { balance: from.balance + tx.amount });
          if (to && tx.toAccountId) await updateAccount(tx.toAccountId, { balance: to.balance - tx.amount });
        } else if (tx.type === 'debt' && !tx.isOld && tx.accountId) {
          const acc = accounts.find((a) => a.id === tx.accountId);
          if (acc) {
            const delta = tx.debtType === 'taken' ? -tx.amount : tx.amount;
            await updateAccount(tx.accountId, { balance: acc.balance + delta });
          }
        }
      }
    } finally {
      setDeletingId(null);
    }
  }, [deleteExpense, deleteTransaction, updateAccount, accounts]);

  if (loading) {
    return <GenericPageSkeleton />;
  }

  if (editingExpense) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditingExpense(null)} className="p-2 -ml-2 text-[#6B6B6B]">
            <X size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Edit Expense</h1>
        </div>
        <AddExpense expense={editingExpense} onDone={() => setEditingExpense(null)} />
      </div>
    );
  }

  const totalFiltered = filtered.reduce((sum, t) => {
    if (t.type === 'income') return sum + t.amount;
    if (t.type === 'expense') return sum - t.amount;
    return sum;
  }, 0);

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Records</p>
          <h1 className="text-2xl font-bold text-white">History</h1>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
            filterType !== 'all'
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              : 'bg-[#1A1A1A] border-white/5 text-[#6B6B6B]'
          }`}
        >
          <Filter size={14} />
          {filterType === 'all' ? 'Filter' : TYPE_FILTERS.find((f) => f.key === filterType)?.label || 'Filter'}
        </button>
      </div>

      {/* Filter Pills */}
      {showFilter && (
        <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-white/5">
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setFilterType(key); setShowFilter(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filterType === key ? 'bg-indigo-500 text-white' : 'bg-white/5 text-[#A0A0A0]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary line when filtered */}
      {filterType !== 'all' && filtered.length > 0 && (filterType === 'income' || filterType === 'expense') && (
        <div className="bg-[#1A1A1A] rounded-2xl px-4 py-3 border border-white/5 flex items-center justify-between">
          <span className="text-xs text-[#6B6B6B]">{filtered.length} {TYPE_FILTERS.find((f) => f.key === filterType)?.label}</span>
          <span className={`text-sm font-semibold ${totalFiltered >= 0 ? 'text-emerald-400' : 'text-white'}`}>
            {totalFiltered >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalFiltered), settings.currency)}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-260px)]">
          <p className="text-4xl mb-4">📭</p>
          <h3 className="text-base font-semibold text-white mb-2">No transactions found</h3>
          <p className="text-sm text-[#6B6B6B]">
            {filterType !== 'all' ? 'Try a different filter' : 'Start recording transactions to see them here'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByDate.map(([date, dayTxs]) => {
            const dayExpenses = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const dayIncome = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#6B6B6B]">{formatDate(date)}</p>
                  <div className="flex items-center gap-2">
                    {dayIncome > 0 && (
                      <p className="text-xs font-medium text-emerald-400">+{formatCurrency(dayIncome, settings.currency)}</p>
                    )}
                    {dayExpenses > 0 && (
                      <p className="text-xs font-medium text-[#A0A0A0]">-{formatCurrency(dayExpenses, settings.currency)}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayTxs.map((tx) => {
                    const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
                    const amtInfo = txAmountLabel(tx, settings.currency);
                    const isExpenseTx = tx.type === 'expense';
                    const originalExpense = isExpenseTx
                      ? expenses.find((e) => e.id === (tx.expenseId ?? tx.id))
                      : undefined;

                    return (
                      <div
                        key={tx.id}
                        className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      >
                        <TxTypeIcon tx={tx} catIcon={cat?.icon} catColor={cat?.color} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{txTitle(tx, cat?.name)}</p>
                          <p className="text-xs text-[#6B6B6B] mt-0.5">{txSubLabel(tx, accountMap, cat?.name)}</p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <p className="text-sm font-semibold mr-1 flex-shrink-0" style={{ color: amtInfo.color }}>
                            {amtInfo.label}
                          </p>
                          {isExpenseTx && originalExpense && (
                            <button
                              onClick={() => setEditingExpense(originalExpense)}
                              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] rounded-lg flex-shrink-0"
                              aria-label="Edit expense"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTransaction(tx)}
                            disabled={deletingId === tx.id}
                            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] rounded-lg flex-shrink-0 disabled:opacity-40"
                            aria-label="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
