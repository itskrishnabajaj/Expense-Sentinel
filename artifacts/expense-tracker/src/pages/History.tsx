import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, Pencil, X, Filter, Search, TrendingUp, ArrowLeftRight, AlertCircle, AlertTriangle, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { GenericPageSkeleton } from '../components/Skeleton';
import { AddExpense } from './AddExpense';
import { EditIncomeModal } from '../components/EditIncomeModal';
import { EditTransferModal } from '../components/EditTransferModal';
import { EditDebtModal } from '../components/EditDebtModal';
import { DebtDetailSheet } from '../components/DebtDetailSheet';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Expense, Transaction, Category } from '../database';

function groupByDate(items: Transaction[]): [string, Transaction[]][] {
  const groups: Record<string, Transaction[]> = {};
  items.forEach((t) => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

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
      return tx.note || 'Transfer';
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

const TxRow = memo(function TxRow({
  tx,
  categoryMap,
  accountMap,
  currency,
  deletingId,
  originalExpense,
  onEdit,
  onEditTx,
  onDelete,
}: {
  tx: Transaction;
  categoryMap: Map<string, Category>;
  accountMap: Map<string, { name: string; type: string }>;
  currency: string;
  deletingId: string | null;
  originalExpense?: Expense;
  onEdit: (e: Expense) => void;
  onEditTx: (t: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
  const amtInfo = txAmountLabel(tx, currency);
  const isExpenseTx = tx.type === 'expense';
  const isEditable = tx.type === 'income' || tx.type === 'transfer';

  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.2)] card-press">
      <TxTypeIcon tx={tx} catIcon={cat?.icon} catColor={cat?.color} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{txTitle(tx, cat?.name)}</p>
        <p className="text-xs text-[#6B6B6B] mt-0.5 truncate">{txSubLabel(tx, accountMap, cat?.name)}</p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <p className="text-sm font-semibold mr-1 flex-shrink-0" style={{ color: amtInfo.color }}>
          {amtInfo.label}
        </p>
        {isExpenseTx && originalExpense && (
          <button
            onClick={() => onEdit(originalExpense)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] rounded-lg flex-shrink-0"
            aria-label="Edit expense"
          >
            <Pencil size={14} />
          </button>
        )}
        {isEditable && (
          <button
            onClick={() => onEditTx(tx)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] rounded-lg flex-shrink-0"
            aria-label={`Edit ${tx.type}`}
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          onClick={() => onDelete(tx)}
          disabled={deletingId === tx.id}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] rounded-lg flex-shrink-0 disabled:opacity-40"
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
});

const DayGroup = memo(function DayGroup({
  date,
  dayTxs,
  categoryMap,
  accountMap,
  expenses,
  currency,
  deletingId,
  onEdit,
  onEditTx,
  onDelete,
}: {
  date: string;
  dayTxs: Transaction[];
  categoryMap: Map<string, Category>;
  accountMap: Map<string, { name: string; type: string }>;
  expenses: Expense[];
  currency: string;
  deletingId: string | null;
  onEdit: (e: Expense) => void;
  onEditTx: (t: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  const dayExpenses = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const dayIncome = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-[#6B6B6B]">{formatDate(date)}</p>
        <div className="flex items-center gap-2">
          {dayIncome > 0 && (
            <p className="text-xs font-medium text-emerald-400">+{formatCurrency(dayIncome, currency)}</p>
          )}
          {dayExpenses > 0 && (
            <p className="text-xs font-medium text-[#A0A0A0]">-{formatCurrency(dayExpenses, currency)}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {dayTxs.map((tx) => {
          const originalExpense = tx.type === 'expense'
            ? expenses.find((e) => e.id === (tx.expenseId ?? tx.id))
            : undefined;
          return (
            <TxRow
              key={tx.id}
              tx={tx}
              categoryMap={categoryMap}
              accountMap={accountMap}
              currency={currency}
              deletingId={deletingId}
              originalExpense={originalExpense}
              onEdit={onEdit}
              onEditTx={onEditTx}
              onDelete={onDelete}
            />
          );
        })}
      </div>
    </div>
  );
});

const DebtRow = memo(function DebtRow({
  tx,
  accountMap,
  currency,
  deletingId,
  onView,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  accountMap: Map<string, { name: string; type: string }>;
  currency: string;
  deletingId: string | null;
  onView: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}) {
  const remaining = tx.remainingAmount ?? tx.amount;
  const total = tx.amount;
  const pct = total > 0 ? Math.max(0, Math.min(100, ((total - remaining) / total) * 100)) : 0;
  const isSettled = tx.status === 'settled' || remaining <= 0;
  const account = tx.accountId ? accountMap.get(tx.accountId) : undefined;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(tx)}
      onKeyDown={(e) => e.key === 'Enter' && onView(tx)}
      className="w-full bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_8px_rgba(0,0,0,0.2)] card-press text-left cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}>
          <AlertCircle size={17} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {tx.note || (tx.debtType === 'taken' ? 'Borrowed' : 'Lent')}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isSettled
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {isSettled ? 'Settled' : 'Active'}
                </span>
                {account && (
                  <p className="text-xs text-[#6B6B6B]">
                    {ACCOUNT_TYPE_ICONS[account.type] ?? '💳'} {account.name}
                  </p>
                )}
                <p className="text-xs text-[#6B6B6B]">{formatDate(tx.date)}</p>
              </div>
            </div>
            <div className="flex items-center flex-shrink-0">
              <span className="text-sm font-semibold mr-1"
                style={{ color: tx.debtType === 'taken' ? '#34D399' : '#F87171' }}>
                {tx.debtType === 'taken' ? '+' : '-'}{formatCurrency(total, currency)}
              </span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => { e.stopPropagation(); onEdit(tx); }}
                onClick={(e) => e.stopPropagation()}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6B6B6B] rounded-lg active:text-white"
                aria-label="Edit debt"
              >
                <Pencil size={13} />
              </button>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => { e.stopPropagation(); if (deletingId !== tx.id) onDelete(tx); }}
                onClick={(e) => e.stopPropagation()}
                disabled={deletingId === tx.id}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6B6B6B] rounded-lg disabled:opacity-40 active:text-white"
                aria-label="Delete debt"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          {!isSettled && (
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B6B6B]">
                  Remaining: {formatCurrency(remaining, currency)}
                </span>
                <span className="text-xs text-[#6B6B6B]">{Math.round(pct)}% paid</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: '#34D399',
                    boxShadow: pct > 0 ? '0 0 6px rgba(52,211,153,0.4)' : 'none',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function DeleteDebtConfirm({
  tx,
  deletingId,
  currency,
  onCancel,
  onConfirm,
}: {
  tx: Transaction;
  deletingId: string | null;
  currency: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    const prevOverflow = main?.style.overflow ?? '';
    if (main) main.style.overflow = 'hidden';
    return () => { if (main) main.style.overflow = prevOverflow; };
  }, []);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as React.CSSProperties}
      onClick={onCancel}
    >
      <div
        className="modal-card modal-card--in"
        style={{
          width: '100%',
          maxWidth: '384px',
          background: '#1C1C1E',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Delete Debt?</p>
              <p className="text-xs text-[#6B6B6B]">
                {formatCurrency(tx.amount, currency)}
                {' '}{tx.debtType === 'taken' ? 'borrowed' : 'lent'}
                {tx.note ? ` — ${tx.note}` : ''}
              </p>
            </div>
          </div>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            This will reverse all balance effects
            {(tx.history ?? []).length > 0
              ? ` including ${tx.history!.length} payment${tx.history!.length > 1 ? 's' : ''}`
              : ''}
            . This cannot be undone.
          </p>
        </div>
        <div className="flex border-t border-white/5">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 text-sm font-medium text-[#A0A0A0] active:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <div className="w-px bg-white/5" />
          <button
            onClick={onConfirm}
            disabled={deletingId === tx.id}
            className="flex-1 py-3.5 text-sm font-semibold text-red-400 active:bg-red-500/10 transition-colors disabled:opacity-40"
          >
            {deletingId === tx.id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
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
  const [editingIncome, setEditingIncome] = useState<Transaction | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<Transaction | null>(null);
  const [editingDebt, setEditingDebt] = useState<Transaction | null>(null);
  const [viewingDebt, setViewingDebt] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteDebt, setConfirmDeleteDebt] = useState<Transaction | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [settledOpen, setSettledOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchDebounced(searchQuery), 250);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

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

  const filteredItems = useMemo(() => {
    if (!searchDebounced) return allItems;
    const q = searchDebounced.toLowerCase();
    return allItems.filter((tx) => {
      if (tx.note?.toLowerCase().includes(q)) return true;
      if (tx.type.includes(q)) return true;
      const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
      if (cat?.name.toLowerCase().includes(q)) return true;
      const accNames = [tx.accountId, tx.fromAccountId, tx.toAccountId]
        .filter(Boolean)
        .map((id) => accountMap.get(id!)?.name?.toLowerCase() ?? '');
      if (accNames.some((n) => n.includes(q))) return true;
      return false;
    });
  }, [searchDebounced, allItems, categoryMap, accountMap]);

  const debtItems = useMemo(() => filteredItems.filter((t) => t.type === 'debt'), [filteredItems]);
  const expenseItems = useMemo(() => filteredItems.filter((t) => t.type === 'expense'), [filteredItems]);
  const incomeItems = useMemo(() => filteredItems.filter((t) => t.type === 'income'), [filteredItems]);
  const transferItems = useMemo(() => filteredItems.filter((t) => t.type === 'transfer'), [filteredItems]);

  const activeDebts = useMemo(
    () => debtItems.filter((t) => t.status !== 'settled' && (t.remainingAmount ?? t.amount) > 0),
    [debtItems]
  );
  const settledDebts = useMemo(
    () => debtItems.filter((t) => t.status === 'settled' || (t.remainingAmount ?? t.amount) <= 0),
    [debtItems]
  );

  const groupedExpenses = useMemo(() => groupByDate(expenseItems), [expenseItems]);
  const groupedIncome = useMemo(() => groupByDate(incomeItems), [incomeItems]);
  const groupedTransfers = useMemo(() => groupByDate(transferItems), [transferItems]);

  const showDebtSection = filterType === 'all' || filterType === 'debt';
  const showExpenseSection = filterType === 'all' || filterType === 'expense';
  const showIncomeSection = filterType === 'all' || filterType === 'income';
  const showTransferSection = filterType === 'all' || filterType === 'transfer';

  const handleDeleteTransaction = useCallback(async (tx: Transaction) => {
    if (tx.type === 'debt') {
      setConfirmDeleteDebt(tx);
      return;
    }
    setDeletingId(tx.id);
    try {
      if (tx.type === 'expense') {
        const expId = tx.expenseId ?? tx.id;
        await deleteExpense(expId);
        try { await deleteTransaction(tx.id); } catch { /* legacy expenses may not have tx record */ }
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
        }
      }
    } finally {
      setDeletingId(null);
    }
  }, [deleteExpense, deleteTransaction, updateAccount, accounts]);

  const executeDebtDelete = useCallback(async (tx: Transaction) => {
    setConfirmDeleteDebt(null);
    setDeletingId(tx.id);
    try {
      const adjustments = new Map<string, number>();
      const adjust = (id: string | undefined, delta: number) => {
        if (!id) return;
        adjustments.set(id, (adjustments.get(id) ?? 0) + delta);
      };

      if (!tx.isOld && tx.accountId) {
        const creationDelta = tx.debtType === 'taken' ? -tx.amount : tx.amount;
        adjust(tx.accountId, creationDelta);
      }

      if (tx.history && tx.history.length > 0) {
        for (const payment of tx.history) {
          const payAccId = tx.isOld ? payment.accountId : (payment.accountId ?? tx.accountId);
          if (!payAccId) continue;
          const paymentReverseDelta = tx.debtType === 'taken' ? payment.amount : -payment.amount;
          adjust(payAccId, paymentReverseDelta);
        }
      }

      for (const [accId, delta] of adjustments) {
        if (delta !== 0) {
          const acc = accounts.find((a) => a.id === accId);
          if (acc) await updateAccount(accId, { balance: acc.balance + delta });
        }
      }

      await deleteTransaction(tx.id);
    } finally {
      setDeletingId(null);
    }
  }, [deleteTransaction, updateAccount, accounts]);

  const handleEditTx = useCallback((tx: Transaction) => {
    if (tx.type === 'income') setEditingIncome(tx);
    else if (tx.type === 'transfer') setEditingTransfer(tx);
  }, []);

  const handleEditDebtFromSheet = useCallback(() => {
    if (viewingDebt) {
      const debtToEdit = viewingDebt;
      setViewingDebt(null);
      setEditingDebt(debtToEdit);
    }
  }, [viewingDebt]);

  const totalFiltered = useMemo(() => {
    const items =
      filterType === 'income' ? incomeItems :
      filterType === 'expense' ? expenseItems :
      filteredItems;
    return items.reduce((sum, t) => {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
      return sum;
    }, 0);
  }, [filterType, filteredItems, incomeItems, expenseItems]);

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

  const hasContent =
    (showDebtSection && debtItems.length > 0) ||
    (showExpenseSection && expenseItems.length > 0) ||
    (showIncomeSection && incomeItems.length > 0) ||
    (showTransferSection && transferItems.length > 0);

  const SectionDivider = () => <div className="h-px bg-white/5" />;

  const renderDayGroups = (groups: [string, Transaction[]][]) =>
    groups.map(([date, dayTxs], i) => (
      <div
        key={date}
        className="animate-fade-up"
        style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
      >
        <DayGroup
          date={date}
          dayTxs={dayTxs}
          categoryMap={categoryMap}
          accountMap={accountMap}
          expenses={expenses}
          currency={settings.currency}
          deletingId={deletingId}
          onEdit={setEditingExpense}
          onEditTx={handleEditTx}
          onDelete={handleDeleteTransaction}
        />
      </div>
    ));

  return (
    <div className="space-y-5 pb-4 animate-page-in">
      <div className="flex items-center justify-between animate-fade-up stagger-1">
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

      <div className="relative animate-fade-up stagger-2">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B6B6B] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search transactions…"
          className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-[#444] outline-none"
          style={{ userSelect: 'text', touchAction: 'auto' }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5">
            <X size={14} className="text-[#6B6B6B]" />
          </button>
        )}
      </div>

      {showFilter && (
        <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-white/5 animate-fade-up">
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

      {(filterType === 'income' || filterType === 'expense') && (
        filterType === 'income' ? incomeItems.length > 0 : expenseItems.length > 0
      ) && (
        <div className="bg-[#1A1A1A] rounded-2xl px-4 py-3 border border-white/5 flex items-center justify-between">
          <span className="text-xs text-[#6B6B6B]">
            {(filterType === 'income' ? incomeItems : expenseItems).length} {TYPE_FILTERS.find((f) => f.key === filterType)?.label}
          </span>
          <span className={`text-sm font-semibold ${filterType === 'income' ? 'text-emerald-400' : 'text-white'}`}>
            {filterType === 'income' ? '+' : '-'}{formatCurrency(Math.abs(totalFiltered), settings.currency)}
          </span>
        </div>
      )}

      {!hasContent ? (
        <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-260px)]">
          <p className="text-4xl mb-4">📭</p>
          <h3 className="text-base font-semibold text-white mb-2">
            {searchDebounced ? `No results for "${searchDebounced}"` : 'No transactions found'}
          </h3>
          <p className="text-sm text-[#6B6B6B]">
            {searchDebounced ? 'Try a different search term' : filterType !== 'all' ? 'Try a different filter' : 'Start recording transactions to see them here'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {showDebtSection && debtItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest">Debts</p>
                <span className="text-xs text-[#6B6B6B]">{activeDebts.length} active</span>
              </div>
              <div className="space-y-2">
                {activeDebts.map((tx, i) => (
                  <div key={tx.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}>
                    <DebtRow tx={tx} accountMap={accountMap} currency={settings.currency} deletingId={deletingId}
                      onView={setViewingDebt} onEdit={setEditingDebt} onDelete={handleDeleteTransaction} />
                  </div>
                ))}
              </div>
              {settledDebts.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setSettledOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-xs text-[#6B6B6B] mb-2 hover:text-[#A0A0A0] transition-colors"
                  >
                    <span className="transition-transform duration-200"
                      style={{ display: 'inline-block', transform: settledOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    {settledDebts.length} settled
                  </button>
                  {settledOpen && (
                    <div className="space-y-2">
                      {settledDebts.map((tx, i) => (
                        <div key={tx.id} className="animate-fade-up opacity-60" style={{ animationDelay: `${Math.min(i * 40, 200)}ms` }}>
                          <DebtRow tx={tx} accountMap={accountMap} currency={settings.currency} deletingId={deletingId}
                            onView={setViewingDebt} onEdit={setEditingDebt} onDelete={handleDeleteTransaction} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showTransferSection && transferItems.length > 0 && (
            <>
              {showDebtSection && debtItems.length > 0 && <SectionDivider />}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest">Transfers</p>
                  <span className="text-xs text-[#6B6B6B]">{transferItems.length}</span>
                </div>
                <div className="space-y-5">
                  {renderDayGroups(groupedTransfers)}
                </div>
              </div>
            </>
          )}

          {showIncomeSection && incomeItems.length > 0 && (
            <>
              {(showDebtSection && debtItems.length > 0) || (showTransferSection && transferItems.length > 0)
                ? <SectionDivider /> : null}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest">Income</p>
                  <span className="text-xs text-emerald-400">+{formatCurrency(incomeItems.reduce((s, t) => s + t.amount, 0), settings.currency)}</span>
                </div>
                <div className="space-y-5">
                  {renderDayGroups(groupedIncome)}
                </div>
              </div>
            </>
          )}

          {showExpenseSection && expenseItems.length > 0 && (
            <>
              {(showDebtSection && debtItems.length > 0) || (showTransferSection && transferItems.length > 0) ||
                (showIncomeSection && incomeItems.length > 0) ? <SectionDivider /> : null}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-widest">Expenses</p>
                  <span className="text-xs text-white">-{formatCurrency(expenseItems.reduce((s, t) => s + t.amount, 0), settings.currency)}</span>
                </div>
                <div className="space-y-5">
                  {renderDayGroups(groupedExpenses)}
                </div>
              </div>
            </>
          )}

        </div>
      )}

      {confirmDeleteDebt && <DeleteDebtConfirm
        tx={confirmDeleteDebt}
        deletingId={deletingId}
        currency={settings.currency}
        onCancel={() => setConfirmDeleteDebt(null)}
        onConfirm={() => executeDebtDelete(confirmDeleteDebt)}
      />}

      {viewingDebt && (
        <DebtDetailSheet
          tx={viewingDebt}
          onClose={() => setViewingDebt(null)}
          onEdit={handleEditDebtFromSheet}
        />
      )}
      {editingIncome && (
        <EditIncomeModal tx={editingIncome} onClose={() => setEditingIncome(null)} />
      )}
      {editingTransfer && (
        <EditTransferModal tx={editingTransfer} onClose={() => setEditingTransfer(null)} />
      )}
      {editingDebt && (
        <EditDebtModal tx={editingDebt} onClose={() => setEditingDebt(null)} />
      )}
    </div>
  );
}
