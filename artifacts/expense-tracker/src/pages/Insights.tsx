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
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { formatCurrency, getMonthName } from '../utils/formatters';

type Period = 'month' | 'week';

export function Insights() {
  const { expenses, categories, settings, loading } = useApp();
  const [period, setPeriod] = useState<Period>('month');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filteredExpenses = useMemo(() => {
    if (period === 'month') {
      return expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      return expenses.filter((e) => new Date(e.date + 'T00:00:00') >= startOfWeek);
    }
  }, [expenses, period, currentMonth, currentYear]);

  const total = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

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
        date: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount,
      }));
  }, [filteredExpenses]);

  const highestDay = useMemo(() => {
    if (dailyData.length === 0) return null;
    return dailyData.reduce((max, d) => d.amount > max.amount ? d : max, dailyData[0]);
  }, [dailyData]);

  const highestCategory = categoryData[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div>
        <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Analytics</p>
        <h1 className="text-2xl font-bold text-white">Insights</h1>
      </div>

      {/* Period Toggle */}
      <div className="flex bg-[#1A1A1A] rounded-xl p-1 border border-white/5">
        {(['month', 'week'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              period === p
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-[#6B6B6B] hover:text-white'
            }`}
          >
            {p === 'month' ? `${getMonthName(currentMonth)}` : 'This Week'}
          </button>
        ))}
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📊</p>
          <h3 className="text-base font-semibold text-white mb-2">No data yet</h3>
          <p className="text-sm text-[#6B6B6B]">Add expenses to see your insights</p>
        </div>
      ) : (
        <>
          {/* Total */}
          <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
            <p className="text-xs text-[#6B6B6B] mb-1">
              {period === 'month' ? 'This month' : 'This week'}
            </p>
            <p className="text-3xl font-bold text-white">{formatCurrency(total, settings.currency)}</p>
          </div>

          {/* Category Breakdown */}
          {categoryData.length > 0 && (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <h2 className="text-sm font-semibold text-white mb-4">By Category</h2>

              {/* Pie Chart */}
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
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white',
                      }}
                      formatter={(value: number) => [formatCurrency(value, settings.currency), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
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
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-[#6B6B6B] w-8 text-right">{cat.pct.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Spending Chart */}
          {dailyData.length > 1 && (
            <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
              <h2 className="text-sm font-semibold text-white mb-4">Daily Spending</h2>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData} barSize={20}>
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6B6B6B', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: 'white',
                      }}
                      formatter={(value: number) => [formatCurrency(value, settings.currency), 'Spent']}
                    />
                    <Bar dataKey="amount" fill="#6366F1" radius={[6, 6, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Highlights */}
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
    </div>
  );
}
