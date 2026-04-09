import { useMemo } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Plus, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BudgetProgress } from '../components/BudgetProgress';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency, getMonthName } from '../utils/formatters';

export function Home() {
  const { expenses, categories, settings, loading } = useApp();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
  }, [expenses, currentMonth, currentYear]);

  const total = useMemo(() => monthExpenses.reduce((sum, e) => sum + e.amount, 0), [monthExpenses]);
  const remaining = settings.monthly_budget - total;

  const daysPassed = now.getDate();
  const dailyAvg = daysPassed > 0 ? total / daysPassed : 0;

  const categoryMap = useMemo(() =>
    new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

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

  const recentExpenses = expenses.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const budgetPct = settings.monthly_budget > 0
    ? Math.min((total / settings.monthly_budget) * 100, 100)
    : 0;

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">
            {getMonthName(currentMonth)} {currentYear}
          </p>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
        </div>
        <Link href="/add" className="w-10 h-10 bg-indigo-500/15 rounded-xl flex items-center justify-center hover:bg-indigo-500/25 transition-colors">
          <Plus size={18} className="text-indigo-400" />
        </Link>
      </div>

      {/* Total Spent Card */}
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
        <p className="text-xs text-[#6B6B6B] mb-1">Total spent this month</p>
        <p className="text-4xl font-bold text-white tracking-tight mb-4">
          {formatCurrency(total, settings.currency)}
        </p>
        <BudgetProgress spent={total} budget={settings.monthly_budget} />
        <div className="mt-3 flex items-center justify-between text-xs text-[#6B6B6B]">
          <span>Budget: {formatCurrency(settings.monthly_budget, settings.currency)}</span>
          <span className={remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {remaining >= 0 ? `${formatCurrency(remaining, settings.currency)} left` : `${formatCurrency(Math.abs(remaining), settings.currency)} over`}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-3">
            <Wallet size={15} className="text-emerald-400" />
          </div>
          <p className="text-xs text-[#6B6B6B] mb-1">Remaining</p>
          <p className={`text-lg font-bold ${remaining >= 0 ? 'text-white' : 'text-red-400'}`}>
            {formatCurrency(Math.max(remaining, 0), settings.currency)}
          </p>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
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
      {budgetPct >= 80 && (
        <div className={`rounded-2xl p-4 border flex items-start gap-3 ${
          budgetPct >= 100
            ? 'bg-red-500/10 border-red-500/20'
            : 'bg-amber-500/10 border-amber-500/20'
        }`}>
          <TrendingDown size={16} className={budgetPct >= 100 ? 'text-red-400 mt-0.5' : 'text-amber-400 mt-0.5'} />
          <div>
            <p className={`text-sm font-medium ${budgetPct >= 100 ? 'text-red-400' : 'text-amber-400'}`}>
              {budgetPct >= 100 ? 'Budget exceeded' : 'Approaching limit'}
            </p>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {budgetPct >= 100
                ? `You've exceeded your budget by ${formatCurrency(Math.abs(remaining), settings.currency)}`
                : `You've used ${budgetPct.toFixed(0)}% of your monthly budget`}
            </p>
          </div>
        </div>
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Top Categories</h2>
            <Link href="/insights" className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors">
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

      {/* Recent Expenses */}
      {recentExpenses.length > 0 && (
        <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent</h2>
            <Link href="/history" className="text-xs text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentExpenses.map((expense) => {
              const cat = categoryMap.get(expense.category) || { id: expense.category, name: expense.category, icon: '💰', color: '#6B6B6B' };
              return (
                <div key={expense.id} className="flex items-center gap-3">
                  <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{expense.note || cat.name}</p>
                    <p className="text-xs text-[#6B6B6B]">{expense.date}</p>
                  </div>
                  <span className="text-sm font-semibold text-white flex-shrink-0">
                    -{formatCurrency(expense.amount, settings.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {expenses.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} className="text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">No expenses yet</h3>
          <p className="text-sm text-[#6B6B6B] mb-6">Start tracking your spending</p>
          <Link href="/add" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-400 transition-colors">
            <Plus size={16} />
            Add first expense
          </Link>
        </div>
      )}
    </div>
  );
}
