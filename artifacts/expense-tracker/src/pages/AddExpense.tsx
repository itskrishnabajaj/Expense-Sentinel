import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronDown, Clock, Delete } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { getTodayString } from '../utils/formatters';
import { Expense } from '../database';

const RECENT_CATS_KEY = 'expense_recent_categories';
const MAX_RECENT = 3;

function getRecentCategories(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_CATS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentCategory(id: string) {
  const recents = getRecentCategories().filter((r) => r !== id);
  recents.unshift(id);
  localStorage.setItem(RECENT_CATS_KEY, JSON.stringify(recents.slice(0, MAX_RECENT)));
}

function formatAmountDisplay(raw: string, currencySymbol: string): string {
  if (!raw) return '';
  const parts = raw.split('.');
  const intPart = parseInt(parts[0] || '0', 10);
  const formattedInt = isNaN(intPart) ? '0' : intPart.toLocaleString('en-IN');
  if (parts.length === 2) {
    return `${currencySymbol}${formattedInt}.${parts[1]}`;
  }
  return `${currencySymbol}${formattedInt}`;
}

interface CategorySheetProps {
  categories: { id: string; name: string; icon: string; color: string }[];
  currentCategoryId: string;
  onConfirm: (id: string) => void;
  onClose: () => void;
}

function CategorySheet({ categories, currentCategoryId, onConfirm, onClose }: CategorySheetProps) {
  const [pending, setPending] = useState(currentCategoryId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onPointerDown={onClose}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative w-full bg-[#111111] rounded-t-3xl p-6 pb-8 max-h-[80vh] flex flex-col"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5 flex-shrink-0" />
        <h2 className="text-base font-semibold text-white mb-4 flex-shrink-0">Select Category</h2>
        <div className="overflow-y-auto scroll-native flex-1">
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onPointerDown={(e) => { e.stopPropagation(); setPending(cat.id); }}
                className={`aspect-square flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:opacity-70 ${
                  pending === cat.id
                    ? 'border-indigo-500/60 bg-indigo-500/12'
                    : 'border-white/5 bg-[#1A1A1A]'
                }`}
              >
                <span className="text-2xl leading-none">{cat.icon}</span>
                <span className="text-[11px] text-white leading-tight truncate w-full text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
        <button
          onPointerDown={(e) => { e.stopPropagation(); onConfirm(pending); }}
          disabled={!pending}
          className="mt-4 flex-shrink-0 w-full py-3.5 bg-indigo-500 active:bg-indigo-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

interface EditExpenseProps {
  expense?: Expense;
  onDone?: () => void;
}

export function AddExpense({ expense: editingExpense, onDone }: EditExpenseProps) {
  const { addExpense, updateExpense, categories, settings } = useApp();
  const navigate = useNavigate();

  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : '');
  const [categoryId, setCategoryId] = useState(editingExpense?.category || '');
  const [date, setDate] = useState(editingExpense?.date || getTodayString());
  const [note, setNote] = useState(editingExpense?.note || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [recentCategoryIds] = useState<string[]>(getRecentCategories);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const selectedCategory = categories.find((c) => c.id === categoryId) || categories[0];
  const currencySymbol = settings.currency === 'INR' ? '₹' : '$';

  const recentCategories = recentCategoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter(Boolean) as typeof categories;

  const handleNumKey = useCallback((key: string) => {
    setAmount((prev) => {
      if (key === 'backspace') return prev.slice(0, -1);
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      const next = prev + key;
      const parts = next.split('.');
      if (parts[1] && parts[1].length > 2) return prev;
      if (next.replace('.', '').length > 9) return prev;
      return next;
    });
  }, []);

  const handleSelectCategory = useCallback((id: string) => {
    setCategoryId(id);
    saveRecentCategory(id);
    setShowCategorySheet(false);
  }, []);

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
        saveRecentCategory(categoryId);
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
  const displayAmount = formatAmountDisplay(amount, currencySymbol);

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
    <div className="space-y-5 pb-4">
      {!editingExpense && (
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-[#6B6B6B]">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-white">Add Expense</h1>
        </div>
      )}
      {editingExpense && (
        <h1 className="text-lg font-bold text-white">Edit Expense</h1>
      )}

      {/* Amount Display */}
      <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 text-center shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <p className="text-xs text-[#6B6B6B] mb-3 uppercase tracking-widest">Amount</p>
        <div className="h-16 flex items-center justify-center">
          {displayAmount ? (
            <span className="text-5xl font-bold text-white tracking-tight">{displayAmount}</span>
          ) : (
            <span className="text-5xl font-bold text-[#2A2A2A] tracking-tight">{currencySymbol}0</span>
          )}
        </div>
      </div>

      {/* Custom Numpad — system keyboard never opens */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
          <button
            key={key}
            onPointerDown={(e) => {
              e.preventDefault();
              handleNumKey(key);
            }}
            className="h-14 bg-[#1A1A1A] active:bg-[#252525] rounded-2xl flex items-center justify-center border border-white/5"
          >
            {key === 'backspace' ? (
              <Delete size={18} className="text-[#A0A0A0]" />
            ) : (
              <span className="text-lg font-medium text-white">{key}</span>
            )}
          </button>
        ))}
      </div>

      {/* Recently Used Quick Picks */}
      {recentCategories.length > 0 && !editingExpense && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={12} className="text-[#6B6B6B]" />
            <p className="text-xs text-[#6B6B6B] uppercase tracking-wider">Recent</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {recentCategories.map((cat) => (
              <button
                key={cat.id}
                onPointerDown={(e) => { e.preventDefault(); handleSelectCategory(cat.id); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  categoryId === cat.id
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-white/5 bg-[#1A1A1A]'
                }`}
              >
                <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                <span className="text-xs text-white">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Selector */}
      <button
        onPointerDown={(e) => { e.preventDefault(); setShowCategorySheet(true); }}
        className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 flex items-center gap-3 active:bg-[#222222] transition-colors"
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
          style={{ userSelect: 'text', touchAction: 'auto' }}
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
          style={{ userSelect: 'text', touchAction: 'auto' }}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!isValid || saving}
        className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${
          isValid && !saving
            ? 'bg-indigo-500 active:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'bg-[#1A1A1A] text-[#444444] border border-white/5 cursor-not-allowed'
        }`}
      >
        {saving ? 'Saving…' : editingExpense ? 'Update Expense' : 'Save Expense'}
      </button>

      {/* Category Bottom Sheet */}
      {showCategorySheet && (
        <CategorySheet
          categories={categories}
          currentCategoryId={categoryId}
          onConfirm={handleSelectCategory}
          onClose={() => setShowCategorySheet(false)}
        />
      )}
    </div>
  );
}
