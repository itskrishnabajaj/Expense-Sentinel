import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Plus,
  TrendingDown,
  Wallet,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BudgetProgress } from '../components/BudgetProgress';
import { CategoryIcon } from '../components/CategoryIcon';
import { AnimatedCurrency } from '../components/AnimatedCurrency';
import { HomePageSkeleton } from '../components/Skeleton';
import { TxIcon, getTxLabel, TxAmount } from '../components/TransactionDisplay';
import { formatCurrency, getMonthName } from '../utils/formatters';
import { ACCOUNT_TYPE_ICONS } from '../utils/constants';
import { filterByMonth } from '../utils/dateFilters';
import { Transaction, Account, Category } from '../database';

const AccountsStrip = memo(function AccountsStrip({
  accounts,
  netWorth,
  currency,
}: {
  accounts: Account[];
  netWorth: number;
  currency: string;
}) {
  return (
    <div className="-mx-4">
      <div
        className="flex gap-3 px-4 overflow-x-auto"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
      >
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="flex-shrink-0 bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 min-w-[140px] card-press"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
          >
            <div className="text-lg mb-2">{ACCOUNT_TYPE_ICONS[acc.type] ?? '💳'}</div>
            <p className="text-xs text-[#6B6B6B] mb-1 truncate max-w-[120px]">{acc.name}</p>
            <p className="text-base font-bold text-white">{formatCurrency(acc.balance, currency)}</p>
          </div>
        ))}
        {accounts.length > 1 && (
          <div
            className="flex-shrink-0 bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 min-w-[140px] flex flex-col justify-between card-press"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}
          >
            <div className="text-lg mb-2">💼</div>
            <p className="text-xs text-[#6B6B6B] mb-1">Total Balance</p>
            <p className="text-base font-bold text-white">
              <AnimatedCurrency value={netWorth} currency={currency} />
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

const TotalSpentCard = memo(function TotalSpentCard({
  total,
  budget,
  remaining,
  currency,
}: {
  total: number;
  budget: number;
  remaining: number;
  currency: string;
}) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <p className="text-xs text-[#6B6B6B] mb-1">Total spent this month</p>
      <p className="text-4xl font-bold text-white tracking-tight mb-4">
        <AnimatedCurrency value={total} currency={currency} />
      </p>
      <BudgetProgress spent={total} budget={budget} />
      <div className="mt-3 flex items-center justify-between text-xs text-[#6B6B6B]">
        <span>Budget: {formatCurrency(budget, currency)}</span>
        <span className={remaining >= 0 ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
          {remaining >= 0
            ? `${formatCurrency(remaining, currency)} left`
            : `${formatCurrency(Math.abs(remaining), currency)} over`}
        </span>
      </div>
    </div>
  );
});

const StatsRow = memo(function StatsRow({
  monthIncome,
  dailyAvg,
  currency,
}: {
  monthIncome: number;
  dailyAvg: number;
  currency: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
          <TrendingUp size={15} className="text-emerald-400" />
        </div>
        <p className="text-xs text-[#6B6B6B] mb-1">Income this month</p>
        <p className="text-lg font-bold text-emerald-400">
          {formatCurrency(monthIncome, currency)}
        </p>
      </div>
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3">
          <Calendar size={15} className="text-indigo-400" />
        </div>
        <p className="text-xs text-[#6B6B6B] mb-1">Daily average</p>
        <p className="text-lg font-bold text-white">
          {formatCurrency(dailyAvg, currency)}
        </p>
      </div>
    </div>
  );
});

const TopCategoriesCard = memo(function TopCategoriesCard({
  topCategories,
  total,
  currency,
}: {
  topCategories: { category: { id: string; name: string; icon: string; color: string }; amount: number }[];
  total: number;
  currency: string;
}) {
  if (topCategories.length === 0) return null;
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
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
                    {formatCurrency(amount, currency)}
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
  );
});

const RecentTransactionsCard = memo(function RecentTransactionsCard({
  transactions,
  categoryMap,
  accountMap,
  currency,
}: {
  transactions: Transaction[];
  categoryMap: Map<string, Category>;
  accountMap: Map<string, string>;
  currency: string;
}) {
  if (transactions.length === 0) return null;
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Recent</h2>
        <Link to="/history" className="text-xs text-indigo-400 flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="space-y-3">
        {transactions.map((tx) => {
          const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
          return (
            <div key={tx.id} className="flex items-center gap-3">
              <TxIcon tx={tx} categoryIcon={cat?.icon} categoryColor={cat?.color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{getTxLabel(tx, accountMap, categoryMap)}</p>
                <p className="text-xs text-[#6B6B6B]">{tx.date}</p>
              </div>
              <TxAmount tx={tx} currency={currency} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

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

  const monthExpenses = useMemo(
    () => filterByMonth(expenses, currentMonth, currentYear),
    [expenses, currentMonth, currentYear]
  );

  const monthTransactions = useMemo(
    () => filterByMonth(transactions, currentMonth, currentYear),
    [transactions, currentMonth, currentYear]
  );

  const monthIncome = useMemo(
    () => monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );

  const budgetMonthExpenses = useMemo(
    () => monthExpenses.filter((e) => e.countInBudget !== false),
    [monthExpenses]
  );

  const total = useMemo(() => budgetMonthExpenses.reduce((sum, e) => sum + e.amount, 0), [budgetMonthExpenses]);

  const netWorth = useMemo(() => accounts.reduce((s, a) => s + a.balance, 0), [accounts]);

  const budget = settings.monthly_budget;
  const remaining = budget - total;
  const budgetPct = budget > 0 ? Math.min((total / budget) * 100, 100) : 0;

  const daysPassed = Math.max(now.getDate(), 1);
  const dailyAvg = budgetMonthExpenses.length > 0 ? total / daysPassed : 0;

  const topCategories = useMemo(() => {
    const byCategory: Record<string, number> = {};
    budgetMonthExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, amount]) => ({
        category: categoryMap.get(id) || { id, name: id, icon: '💰', color: '#6B6B6B' },
        amount,
      }));
  }, [budgetMonthExpenses, categoryMap]);

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  if (loading) {
    return <HomePageSkeleton />;
  }

  const hasAccounts = accounts.length > 0;

  return (
    <div className="space-y-5 pb-4 animate-page-in">
      {/* Header */}
      <div className="animate-fade-up stagger-1">
        <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">
          {getMonthName(currentMonth)} {currentYear}
        </p>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
      </div>

      {/* Accounts Strip */}
      {hasAccounts && (
        <div className="animate-fade-up stagger-2">
          <AccountsStrip
            accounts={accounts}
            netWorth={netWorth}
            currency={settings.currency}
          />
        </div>
      )}

      {/* Total Spent Card */}
      <div className="animate-fade-up stagger-3">
        <TotalSpentCard
          total={total}
          budget={budget}
          remaining={remaining}
          currency={settings.currency}
        />
      </div>

      {/* Stats Row */}
      <div className="animate-fade-up stagger-4">
        <StatsRow
          monthIncome={monthIncome}
          dailyAvg={dailyAvg}
          currency={settings.currency}
        />
      </div>

      {/* Budget Alert */}
      {budget > 0 && budgetPct >= 80 && (
        <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
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
      <div className="animate-fade-up stagger-5">
        <TopCategoriesCard
          topCategories={topCategories}
          total={total}
          currency={settings.currency}
        />
      </div>

      {/* Recent Transactions */}
      <div className="animate-fade-up stagger-6">
        <RecentTransactionsCard
          transactions={recentTransactions}
          categoryMap={categoryMap}
          accountMap={accountMap}
          currency={settings.currency}
        />
      </div>

      {/* Empty State */}
      {transactions.length === 0 && expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center min-h-[40vh]">
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
