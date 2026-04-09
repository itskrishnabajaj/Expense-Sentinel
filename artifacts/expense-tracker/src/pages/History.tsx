import { useState, useMemo } from 'react';
import { Trash2, Pencil, X, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { GenericPageSkeleton } from '../components/Skeleton';
import { AddExpense } from './AddExpense';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Expense } from '../database';

export function History() {
  const { expenses, categories, settings, deleteExpense, loading } = useApp();
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filtered = useMemo(() => {
    if (filterCategory === 'all') return expenses;
    return expenses.filter((e) => e.category === filterCategory);
  }, [expenses, filterCategory]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    filtered.forEach((e) => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteExpense(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <GenericPageSkeleton />;
  }

  if (editingExpense) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingExpense(null)}
            className="p-2 -ml-2 text-[#6B6B6B]"
          >
            <X size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Edit Expense</h1>
        </div>
        <AddExpense expense={editingExpense} onDone={() => setEditingExpense(null)} />
      </div>
    );
  }

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
            filterCategory !== 'all'
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              : 'bg-[#1A1A1A] border-white/5 text-[#6B6B6B]'
          }`}
        >
          <Filter size={14} />
          {filterCategory === 'all' ? 'Filter' : categoryMap.get(filterCategory)?.name || 'Filter'}
        </button>
      </div>

      {/* Filter Sheet */}
      {showFilter && (
        <div className="bg-[#1A1A1A] rounded-2xl p-3 border border-white/5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFilterCategory('all'); setShowFilter(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterCategory === 'all'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/5 text-[#A0A0A0]'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setFilterCategory(cat.id); setShowFilter(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  filterCategory === cat.id
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-[#A0A0A0]'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📭</p>
          <h3 className="text-base font-semibold text-white mb-2">No expenses found</h3>
          <p className="text-sm text-[#6B6B6B]">
            {filterCategory !== 'all' ? 'Try a different filter' : 'Start adding expenses to see them here'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByDate.map(([date, dayExpenses]) => {
            const dayTotal = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-[#6B6B6B]">{formatDate(date)}</p>
                  <p className="text-xs font-medium text-[#A0A0A0]">
                    {formatCurrency(dayTotal, settings.currency)}
                  </p>
                </div>
                <div className="space-y-2">
                  {dayExpenses.map((expense) => {
                    const cat = categoryMap.get(expense.category) || {
                      id: expense.category,
                      name: expense.category,
                      icon: '💰',
                      color: '#6B6B6B',
                    };
                    return (
                      <div
                        key={expense.id}
                        className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 flex items-center gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                      >
                        <CategoryIcon icon={cat.icon} color={cat.color} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {expense.note || cat.name}
                          </p>
                          <p className="text-xs text-[#6B6B6B] mt-0.5">{cat.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-white">
                            -{formatCurrency(expense.amount, settings.currency)}
                          </p>
                          <button
                            onClick={() => setEditingExpense(expense)}
                            className="p-1.5 text-[#6B6B6B] rounded-lg flex-shrink-0"
                            aria-label="Edit expense"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            disabled={deletingId === expense.id}
                            className="p-1.5 text-[#6B6B6B] rounded-lg flex-shrink-0 disabled:opacity-40"
                            aria-label="Delete expense"
                          >
                            <Trash2 size={13} />
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
