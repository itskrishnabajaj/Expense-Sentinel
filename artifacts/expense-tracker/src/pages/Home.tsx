import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  TrendingDown,
  Wallet,
  Calendar,
  TrendingUp,
  ArrowLeftRight,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BudgetProgress } from '../components/BudgetProgress';
import { CategoryIcon } from '../components/CategoryIcon';
import { HomePageSkeleton } from '../components/Skeleton';
import { formatCurrency, getMonthName } from '../utils/formatters';
import { useCountUp } from '../hooks/useCountUp';
import { Transaction } from '../database';

const ACCOUNT_TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

function txIcon(tx: Transaction, categoryIcon?: string, categoryColor?: string) {
  switch (tx.type) {
    case 'income':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(16,185,129,0.12)' }}>
          <TrendingUp size={16} className="text-emerald-400" />
        </div>
      );
    case 'transfer':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <ArrowLeftRight size={16} className="text-blue-400" />
        </div>
      );
    case 'debt':
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(245,158,11,0.12)' }}>
          <AlertCircle size={16} className="text-amber-400" />
        </div>
      );
    default:
      if (categoryIcon && categoryColor) {
        return <CategoryIcon icon={categoryIcon} color={categoryColor} size="sm" />;
      }
      return (
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(239,68,68,0.12)' }}>
          <ShoppingBag size={16} className="text-red-400" />
        </div>
      );
  }
}

function txAmount(tx: Transaction, currency: string) {
  switch (tx.type) {
    case 'income':
      return <span className="text-sm font-semibold text-emerald-400">+{formatCurrency(tx.amount, currency)}</span>;
    case 'expense':
      return <span className="text-sm font-semibold text-white">-{formatCurrency(tx.amount, currency)}</span>;
    case 'transfer':
      return <span className="text-sm font-semibold text-blue-400">{formatCurrency(tx.amount, currency)}</span>;
    case 'debt':
      return (
        <span className="text-sm font-semibold" style={{ color: tx.debtType === 'taken' ? '#34D399' : '#F87171' }}>
          {tx.debtType === 'taken' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
        </span>
      );
  }
}

function txLabel(tx: Transaction, accountMap: Map<string, string>, categoryMap: Map<string, { name: string; icon: string; color: string }>) {
  switch (tx.type) {
    case 'income':
      return tx.note || 'Income';
    case 'expense': {
      const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
      return tx.note || cat?.name || 'Expense';
    }
    case 'transfer': {
      const from = tx.fromAccountId ? accountMap.get(tx.fromAccountId) : '';
      const to = tx.toAccountId ? accountMap.get(tx.toAccountId) : '';
      return `${from || '?'} → ${to || '?'}`;
    }
    case 'debt':
      return tx.note || (tx.debtType === 'taken' ? 'Borrowed' : 'Lent');
  }
}

export function Home() {
  const { expenses, transactions, categories, accounts, settings, loading } = useApp();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const accountMap = useMemo(
    () => new Map(accounts.map((a) => [a.id, a.name])),
    [accounts]
  );

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [expenses, currentMonth, currentYear]);

  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [transactions, currentMonth, currentYear]);

  const monthIncome = useMemo(
    () => monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );

  const total = useMemo(() => monthExpenses.reduce((sum, e) => sum + e.amount, 0), [monthExpenses]);
  const animatedTotal = useCountUp(total, 500);

  const netWorth = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);
  const animatedNetWorth = useCountUp(netWorth, 500);

  const budget = settings.monthly_budget;
  const remaining = budget - total;
  const budgetPct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;

  const daysPassed = Math.max(now.getDate(), 1);
  const dailyAvg = monthExpenses.length > 0 ? total / daysPassed : 0;

  const topCategories = useMemo(() => {
    const byCategory: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, amount]) => ({
        category: categoryMap.get(id) || { id, name: id, icon: '💰', color: '#6B6B6B' },
        amount,
      }));
  }, [monthExpenses, categoryMap]);

  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return <HomePageSkeleton />;
  }

  const hasAccounts = accounts.length > 0;

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="animate-fade-in">
        <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">
          {getMonthName(currentMonth)} {currentYear}
        </p>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
      </div>

      {/* Accounts Strip */}
      {hasAccounts && (
        <div className="animate-fade-in delay-50 -mx-4">
          <div
            className="flex gap-3 px-4 overflow-x-auto"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex-shrink-0 bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 min-w-[140px]"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
              >
                <div className="text-lg mb-2">{ACCOUNT_TYPE_ICONS[acc.type] ?? '💳'}</div>
                <p className="text-xs text-[#6B6B6B] mb-1 truncate max-w-[120px]">{acc.name}</p>
                <p className="text-base font-bold text-white">{formatCurrency(acc.balance, settings.currency)}</p>
              </div>
            ))}
            {accounts.length > 1 && (
              <div
                className="flex-shrink-0 bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 min-w-[140px] flex flex-col justify-between"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
              >
                <div className="text-lg mb-2">💼</div>
                <p className="text-xs text-[#6B6B6B] mb-1">Net Worth</p>
                <p className="text-base font-bold text-white">{formatCurrency(animatedNetWorth, settings.currency)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Total Spent Card */}
      <div className="animate-fade-in delay-50 bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <p className="text-xs text-[#6B6B6B] mb-1">Total spent this month</p>
        <p className="text-4xl font-bold text-white tracking-tight mb-4">
          {formatCurrency(animatedTotal, settings.currency)}
        </p>
        <BudgetProgress spent={total} budget={budget} />
        <div className="mt-3 flex items-center justify-between text-xs text-[#6B6B6B]">
          <span>Budget: {formatCurrency(budget, settings.currency)}</span>
          <span className={remaining >= 0 ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
            {remaining >= 0
              ? `${formatCurrency(remaining, settings.currency)} left`
              : `${formatCurrency(Math.abs(remaining), settings.currency)} over`}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="animate-fade-in delay-100 grid grid-cols-2 gap-3">
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={15} className="text-emerald-400" />
          </div>
          <p className="text-xs text-[#6B6B6B] mb-1">Income this month</p>
          <p className="text-lg font-bold text-emerald-400">
            {formatCurrency(monthIncome, settings.currency)}
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3">
            <Calendar size={15} className="text-indigo-400" />
          </div>
          <p className="text-xs text-[#6B6B6B] mb-1">Daily average</p>
          <p className="text-lg font-bold text-white">
            {formatCurrency(dailyAvg, settings.currency)}
          </p>
        </div>
      </div>

      {/* Budget Alert */}
      {budget > 0 && budgetPct >= 80 && (
        <div className={`animate-fade-in delay-150 rounded-2xl p-4 border flex items-start gap-3 ${
          budgetPct >= 100
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          <TrendingDown size={16} className={budgetPct >= 100 ? 'text-red-400 mt-0.5 flex-shrink-0' : 'text-amber-400 mt-0.5 flex-shrink-0'} />
          <div>
            <p className={`text-sm font-medium ${budgetPct >= 100 ? 'text-red-400' : 'text-amber-400'}`}>
              {budgetPct >= 100 ? 'Budget exceeded' : 'Approaching limit'}
            </p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {budgetPct >= 100
                ? `Exceeded by ${formatCurrency(Math.abs(remaining), settings.currency)}`
                : `${budgetPct.toFixed(0)}% of monthly budget used`}
            </p>
          </div>
        </div>
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="animate-fade-in delay-150 bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Top Categories</h2>
            <Link to="/insights" className="text-xs text-indigo-400 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {topCategories.map(({ category, amount }) => {
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <div key={category.id} className="flex items-center gap-3">
                  <CategoryIcon icon={category.icon} color={category.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#A0A0A0] truncate">{category.name}</span>
                      <span className="text-sm font-medium text-white ml-2 flex-shrink-0">
                        {formatCurrency(amount, settings.currency)}
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: category.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="animate-fade-in delay-200 bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent</h2>
            <Link to="/history" className="text-xs text-indigo-400 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTransactions.map((tx) => {
              const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
              return (
                <div key={tx.id} className="flex items-center gap-3">
                  {txIcon(tx, cat?.icon, cat?.color)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{txLabel(tx, accountMap, categoryMap)}</p>
                    <p className="text-xs text-[#6B6B6B]">{tx.date}</p>
                  </div>
                  {txAmount(tx, settings.currency)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && expenses.length === 0 && (
        <div className="animate-fade-in delay-200 flex flex-col items-center justify-center text-center min-h-[40vh]">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} className="text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">No transactions yet</h3>
          <p className="text-sm text-[#6B6B6B] mb-6">Tap the + button to record income, expenses or more</p>
          <Link
            to="/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl"
          >
            <Plus size={16} />
            Add first expense
          </Link>
        </div>
      )}
    </div>
  );
}
