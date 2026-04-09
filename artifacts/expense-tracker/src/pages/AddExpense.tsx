import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Check, ChevronLeft, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { getTodayString, formatCurrency } from '../utils/formatters';
import { Expense } from '../database';

interface EditExpenseProps {
  expense?: Expense;
  onDone?: () => void;
}

export function AddExpense({ expense: editingExpense, onDone }: EditExpenseProps) {
  const { addExpense, updateExpense, categories, settings } = useApp();
  const [, navigate] = useLocation();

  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : '');
  const [categoryId, setCategoryId] = useState(editingExpense?.category || categories[0]?.id || '');
  const [date, setDate] = useState(editingExpense?.date || getTodayString());
  const [note, setNote] = useState(editingExpense?.note || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const selectedCategory = categories.find((c) => c.id === categoryId) || categories[0];

  const handleAmountKey = (key: string) => {
    if (key === 'backspace') {
      setAmount((prev) => prev.slice(0, -1));
    } else if (key === 'clear') {
      setAmount('');
    } else if (key === '.' && amount.includes('.')) {
      return;
    } else {
      const next = amount + key;
      const parts = next.split('.');
      if (parts[1] && parts[1].length > 2) return;
      setAmount(next);
    }
  };

  const handleSave = useCallback(async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !categoryId) return;

    setSaving(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          amount: parsed,
          category: categoryId,
          date,
          note: note.trim(),
        });
      } else {
        await addExpense({
          amount: parsed,
          category: categoryId,
          date,
          note: note.trim(),
        });
      }
      setSuccess(true);
      setTimeout(() => {
        if (onDone) onDone();
        else navigate('/');
      }, 600);
    } finally {
      setSaving(false);
    }
  }, [amount, categoryId, date, note, addExpense, updateExpense, editingExpense, navigate, onDone]);

  const isValid = parseFloat(amount) > 0 && !!categoryId;

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center animate-scale-in">
          <Check size={28} className="text-emerald-400" />
        </div>
        <p className="text-white font-semibold">
          {editingExpense ? 'Updated!' : 'Saved!'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      {!editingExpense && (
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-[#6B6B6B] hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Add Expense</h1>
        </div>
      )}
      {editingExpense && (
        <h1 className="text-lg font-bold text-white">Edit Expense</h1>
      )}

      {/* Amount Display */}
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 text-center">
        <p className="text-xs text-[#6B6B6B] mb-2 uppercase tracking-widest">Amount</p>
        <div className="text-5xl font-bold text-white tracking-tight min-h-[60px] flex items-center justify-center">
          {amount ? formatCurrency(parseFloat(amount) || 0, settings.currency) : (
            <span className="text-[#333333]">{settings.currency === 'USD' ? '$' : settings.currency} 0.00</span>
          )}
        </div>
        {/* Hidden actual input for mobile keyboard fallback */}
        <input
          ref={amountRef}
          type="number"
          inputMode="decimal"
          className="sr-only"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
          <button
            key={key}
            onClick={() => handleAmountKey(key)}
            className="h-14 bg-[#1A1A1A] hover:bg-[#252525] active:bg-[#2A2A2A] rounded-2xl flex items-center justify-center transition-colors border border-white/5"
          >
            {key === 'backspace' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#A0A0A0]">
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
            ) : (
              <span className="text-lg font-medium text-white">{key}</span>
            )}
          </button>
        ))}
      </div>

      {/* Category Selector */}
      <button
        onClick={() => setShowCategorySheet(true)}
        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 flex items-center gap-3 hover:border-white/10 transition-colors"
      >
        {selectedCategory && (
          <CategoryIcon icon={selectedCategory.icon} color={selectedCategory.color} size="md" />
        )}
        <div className="flex-1 text-left">
          <p className="text-xs text-[#6B6B6B]">Category</p>
          <p className="text-sm font-medium text-white">{selectedCategory?.name || 'Select category'}</p>
        </div>
        <ChevronDown size={16} className="text-[#6B6B6B]" />
      </button>

      {/* Date */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4">
        <label className="block text-xs text-[#6B6B6B] mb-2">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={getTodayString()}
          className="w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]"
        />
      </div>

      {/* Note */}
      <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4">
        <label className="block text-xs text-[#6B6B6B] mb-2">Note (optional)</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was this for?"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#444444]"
          maxLength={100}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!isValid || saving}
        className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${
          isValid && !saving
            ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20'
            : 'bg-[#1A1A1A] text-[#444444] border border-white/5 cursor-not-allowed'
        }`}
      >
        {saving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
      </button>

      {/* Category Bottom Sheet */}
      {showCategorySheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowCategorySheet(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full bg-[#111111] rounded-t-3xl p-6 pb-8 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            <h2 className="text-base font-semibold text-white mb-4">Category</h2>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryId(cat.id); setShowCategorySheet(false); }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    categoryId === cat.id
                      ? 'border-indigo-500/50 bg-indigo-500/10'
                      : 'border-white/5 bg-[#1A1A1A] hover:border-white/10'
                  }`}
                >
                  <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                  <span className="text-sm text-white">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
