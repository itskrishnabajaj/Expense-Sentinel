import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { InsightsPageSkeleton } from '../components/Skeleton';
import { formatCurrency, getMonthName } from '../utils/formatters';

type View = 'month' | 'week' | 'compare';

export function Insights() {
  const { expenses, categories, settings, loading } = useApp();
  const [view, setView] = useState<View>('month');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const thisMonthExpenses = useMemo(() =>
    expenses.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    }),
    [expenses, currentMonth, currentYear]
  );

  const lastMonthExpenses = useMemo(() =>
    expenses.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === prevMonthYear && d.getMonth() === prevMonth;
    }),
    [expenses, prevMonth, prevMonthYear]
  );

  const thisWeekExpenses = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return expenses.filter((e) => new Date(e.date + 'T00:00:00') >= startOfWeek);
  }, [expenses]);

  const lastWeekExpenses = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - dayOfWeek);
    startOfThisWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
    return expenses.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d >= startOfLastWeek && d < startOfThisWeek;
    });
  }, [expenses]);

  const filteredExpenses = view === 'week' ? thisWeekExpenses : thisMonthExpenses;
  const total = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
  const thisMonthTotal = useMemo(() => thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0), [thisMonthExpenses]);
  const lastMonthTotal = useMemo(() => lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0), [lastMonthExpenses]);
  const thisWeekTotal = useMemo(() => thisWeekExpenses.reduce((sum, e) => sum + e.amount, 0), [thisWeekExpenses]);
  const lastWeekTotal = useMemo(() => lastWeekExpenses.reduce((sum, e) => sum + e.amount, 0), [lastWeekExpenses]);

  const categoryData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([id, amount]) => {
        const cat = categoryMap.get(id) || { id, name: id, icon: '💰', color: '#6B6B6B' };
        return { ...cat, amount, pct: total > 0 ? (amount / total) * 100 : 0 };
      });
  }, [filteredExpenses, categoryMap, total]);

  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      days[e.date] = (days[e.date] || 0) + e.amount;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        amount,
      }));
  }, [filteredExpenses]);

  const highestDay = useMemo(() => {
    if (dailyData.length === 0) return null;
    return dailyData.reduce((max, d) => d.amount > max.amount ? d : max, dailyData[0]);
  }, [dailyData]);

  const highestCategory = categoryData[0] ?? null;

  const monthDelta = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : null;
  const weekDelta = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : null;

  if (loading) {
    return <InsightsPageSkeleton />;
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div>
        <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Analytics</p>
        <h1 className="text-2xl font-bold text-white">Insights</h1>
      </div>

      {/* View Toggle */}
      <div className="flex bg-[#1A1A1A] rounded-xl p-1 border border-white/5">
        {(['month', 'week', 'compare'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              view === v
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-[#6B6B6B]'
            }`}
          >
            {v === 'month' ? getMonthName(currentMonth) : v === 'week' ? 'This Week' : 'Compare'}
          </button>
        ))}
      </div>

      {/* Compare View */}
      {view === 'compare' && (
        <div className="space-y-4">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
            <p className="text-xs text-[#6B6B6B] mb-3 uppercase tracking-wider">Month over Month</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">{getMonthName(prevMonth)}</p>
                <p className="text-xl font-bold text-[#A0A0A0]">{formatCurrency(lastMonthTotal, settings.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">{getMonthName(currentMonth)} (so far)</p>
                <p className="text-xl font-bold text-white">{formatCurrency(thisMonthTotal, settings.currency)}</p>
              </div>
            </div>
            {monthDelta !== null ? (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${
                monthDelta > 0 ? 'bg-red-500/10' : monthDelta < 0 ? 'bg-emerald-500/10' : 'bg-white/5'
              }`}>
                {monthDelta > 0
                  ? <TrendingUp size={16} className="text-red-400 flex-shrink-0" />
                  : monthDelta < 0
                  ? <TrendingDown size={16} className="text-emerald-400 flex-shrink-0" />
                  : <Minus size={16} className="text-[#6B6B6B] flex-shrink-0" />
                }
                <p className={`text-sm font-medium ${
                  monthDelta > 0 ? 'text-red-400' : monthDelta < 0 ? 'text-emerald-400' : 'text-[#6B6B6B]'
                }`}>
                  {monthDelta > 0 ? '+' : ''}{monthDelta.toFixed(1)}% vs last month
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#6B6B6B]">No data for {getMonthName(prevMonth)}</p>
            )}
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
            <p className="text-xs text-[#6B6B6B] mb-3 uppercase tracking-wider">Week over Week</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">Last Week</p>
                <p className="text-xl font-bold text-[#A0A0A0]">{formatCurrency(lastWeekTotal, settings.currency)}</p>
              </div>
              <div>
                <p className="text-xs text-[#6B6B6B] mb-1">This Week</p>
                <p className="text-xl font-bold text-white">{formatCurrency(thisWeekTotal, settings.currency)}</p>
              </div>
            </div>
            {weekDelta !== null ? (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${
                weekDelta > 0 ? 'bg-red-500/10' : weekDelta < 0 ? 'bg-emerald-500/10' : 'bg-white/5'
              }`}>
                {weekDelta > 0
                  ? <TrendingUp size={16} className="text-red-400 flex-shrink-0" />
                  : weekDelta < 0
                  ? <TrendingDown size={16} className="text-emerald-400 flex-shrink-0" />
                  : <Minus size={16} className="text-[#6B6B6B] flex-shrink-0" />
                }
                <p className={`text-sm font-medium ${
                  weekDelta > 0 ? 'text-red-400' : weekDelta < 0 ? 'text-emerald-400' : 'text-[#6B6B6B]'
                }`}>
                  {weekDelta > 0 ? '+' : ''}{weekDelta.toFixed(1)}% vs last week
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#6B6B6B]">No data for last week</p>
            )}
          </div>

          {(thisMonthTotal > 0 || lastMonthTotal > 0) && (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <p className="text-xs text-[#6B6B6B] mb-3 uppercase tracking-wider">Monthly Comparison</p>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: getMonthName(prevMonth).slice(0, 3), amount: lastMonthTotal },
                      { name: getMonthName(currentMonth).slice(0, 3), amount: thisMonthTotal },
                    ]}
                    barSize={40}
                  >
                    <XAxis dataKey="name" tick={{ fill: '#6B6B6B', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                      formatter={(value: number) => [formatCurrency(value, settings.currency), 'Spent']}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      <Cell fill="#374151" />
                      <Cell fill="#6366F1" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Month / Week View */}
      {view !== 'compare' && (
        <>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-4">📊</p>
              <h3 className="text-base font-semibold text-white mb-2">No data yet</h3>
              <p className="text-sm text-[#6B6B6B]">Add expenses to see your insights</p>
            </div>
          ) : (
            <>
              <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
                <p className="text-xs text-[#6B6B6B] mb-1">
                  {view === 'month' ? 'This month' : 'This week'}
                </p>
                <p className="text-3xl font-bold text-white">{formatCurrency(total, settings.currency)}</p>
              </div>

              {categoryData.length > 0 && (
                <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
                  <h2 className="text-sm font-semibold text-white mb-4">By Category</h2>
                  <div className="h-44 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="amount"
                        >
                          {categoryData.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} opacity={0.9} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                          formatter={(value: number) => [formatCurrency(value, settings.currency), '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {categoryData.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-3">
                        <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#A0A0A0]">{cat.name}</span>
                            <span className="text-xs font-medium text-white">
                              {formatCurrency(cat.amount, settings.currency)}
                            </span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                          </div>
                        </div>
                        <span className="text-xs text-[#6B6B6B] w-8 text-right">{cat.pct.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dailyData.length > 1 && (
                <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
                  <h2 className="text-sm font-semibold text-white mb-4">Daily Spending</h2>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyData} barSize={20}>
                        <XAxis dataKey="date" tick={{ fill: '#6B6B6B', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                          formatter={(value: number) => [formatCurrency(value, settings.currency), 'Spent']}
                        />
                        <Bar dataKey="amount" fill="#6366F1" radius={[6, 6, 0, 0]} opacity={0.85} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {highestCategory && (
                  <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-[#6B6B6B] mb-2">Top Category</p>
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryIcon icon={highestCategory.icon} color={highestCategory.color} size="sm" />
                      <span className="text-xs text-[#A0A0A0] truncate">{highestCategory.name}</span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      {formatCurrency(highestCategory.amount, settings.currency)}
                    </p>
                  </div>
                )}
                {highestDay && (
                  <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
                    <p className="text-xs text-[#6B6B6B] mb-2">Highest Day</p>
                    <p className="text-xs text-[#A0A0A0] mb-1">{highestDay.date}</p>
                    <p className="text-sm font-bold text-white">
                      {formatCurrency(highestDay.amount, settings.currency)}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
