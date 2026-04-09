import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronDown, Clock, Delete, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { Modal, useModalClose } from '../components/Modal';
import { AccountSheet } from '../components/AccountSheet';
import { TapButton } from '../components/TapButton';
import { getTodayString, getCurrencySymbol, formatAmountRaw } from '../utils/formatters';
import { Expense } from '../database';

const RECENT_CATS_KEY = 'expense_recent_categories';
const MAX_RECENT = 3;
const TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

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

interface CategorySheetProps {
  categories: { id: string; name: string; icon: string; color: string }[];
  currentCategoryId: string;
  onConfirm: (id: string) => void;
  onClose: () => void;
}

function CategorySheetInner({
  categories,
  currentCategoryId,
  onConfirm,
}: {
  categories: { id: string; name: string; icon: string; color: string }[];
  currentCategoryId: string;
  onConfirm: (id: string) => void;
}) {
  const [pending, setPending] = useState(currentCategoryId);
  const close = useModalClose();

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Select Category</h2>
        <TapButton
          onTap={close}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5"
        >
          <X size={16} className="text-[#6B6B6B]" />
        </TapButton>
      </div>

      <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
        {categories.map((cat) => (
          <TapButton
            key={cat.id}
            onTap={() => setPending(cat.id)}
            className={`w-full flex items-center gap-4 px-6 py-4 transition-colors active:bg-white/5 border-b border-white/5 last:border-0 ${
              pending === cat.id ? 'bg-indigo-500/10' : ''
            }`}
          >
            <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
            <span className={`flex-1 text-sm text-left font-medium ${pending === cat.id ? 'text-indigo-400' : 'text-white'}`}>
              {cat.name}
            </span>
            {pending === cat.id && <Check size={16} className="text-indigo-400 flex-shrink-0" />}
          </TapButton>
        ))}
      </div>

      <div className="px-6 py-5 flex-shrink-0 border-t border-white/5">
        <TapButton
          onTap={() => onConfirm(pending)}
          disabled={!pending}
          className="w-full py-3.5 bg-indigo-500 active:bg-indigo-600 text-white text-sm font-semibold rounded-2xl disabled:opacity-40"
        >
          Confirm
        </TapButton>
      </div>
    </>
  );
}

function CategorySheet({ categories, currentCategoryId, onConfirm, onClose }: CategorySheetProps) {
  return (
    <Modal onClose={onClose}>
      <CategorySheetInner
        categories={categories}
        currentCategoryId={currentCategoryId}
        onConfirm={onConfirm}
      />
    </Modal>
  );
}

interface EditExpenseProps {
  expense?: Expense;
  onDone?: () => void;
}

export function AddExpense({ expense: editingExpense, onDone }: EditExpenseProps) {
  const { addExpense, updateExpense, categories, accounts, transactions, settings, updateAccount, addTransaction, updateTransaction } = useApp();
  const navigate = useNavigate();

  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : '');
  const [categoryId, setCategoryId] = useState(editingExpense?.category || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [date, setDate] = useState(editingExpense?.date || getTodayString());
  const [note, setNote] = useState(editingExpense?.note || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [recentCategoryIds] = useState<string[]>(getRecentCategories);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  const selectedCategory = categories.find((c) => c.id === categoryId) || categories[0];
  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const symbol = getCurrencySymbol(settings.currency);

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

        const linkedTx = transactions.find(
          (t) => t.type === 'expense' && (t.expenseId === editingExpense.id || t.id === editingExpense.id)
        );
        if (linkedTx) {
          await updateTransaction(linkedTx.id, {
            amount: parsed,
            categoryId,
            note: note.trim(),
            date,
          });

          if (linkedTx.accountId && parsed !== editingExpense.amount) {
            const acc = accounts.find((a) => a.id === linkedTx.accountId);
            if (acc) {
              const balanceDelta = editingExpense.amount - parsed;
              await updateAccount(linkedTx.accountId, { balance: acc.balance + balanceDelta });
            }
          }
        }
      } else {
        const savedExpense = await addExpense({
          amount: parsed,
          category: categoryId,
          date,
          note: note.trim(),
        });
        saveRecentCategory(categoryId);

        if (accountId) {
          const acc = accounts.find((a) => a.id === accountId);
          if (acc) {
            await updateAccount(accountId, { balance: acc.balance - parsed });
          }
          await addTransaction({
            type: 'expense',
            amount: parsed,
            accountId,
            categoryId,
            note: note.trim(),
            date,
            expenseId: savedExpense.id,
          });
        }
      }
      setSuccess(true);
      setTimeout(() => {
        if (onDone) onDone();
        else navigate('/');
      }, 600);
    } finally {
      setSaving(false);
    }
  }, [amount, categoryId, accountId, date, note, addExpense, updateExpense, updateTransaction, editingExpense, navigate, onDone, accounts, transactions, updateAccount, addTransaction]);

  const isValid = parseFloat(amount) > 0 && !!categoryId;
  const displayAmount = formatAmountRaw(amount, symbol);

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
          <TapButton onTap={() => navigate('/')} className="p-2 -ml-2 text-[#6B6B6B]">
            <ChevronLeft size={20} />
          </TapButton>
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
            <span className="text-5xl font-bold text-[#2A2A2A] tracking-tight">{symbol}0</span>
          )}
        </div>
      </div>

      {/* Custom Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
          <TapButton
            key={key}
            onTap={() => handleNumKey(key)}
            tapOptions={{ preventDefault: true }}
            className="h-14 bg-[#1A1A1A] active:bg-[#252525] rounded-2xl flex items-center justify-center border border-white/5"
          >
            {key === 'backspace' ? (
              <Delete size={18} className="text-[#A0A0A0]" />
            ) : (
              <span className="text-lg font-medium text-white">{key}</span>
            )}
          </TapButton>
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
              <TapButton
                key={cat.id}
                onTap={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                  categoryId === cat.id
                    ? 'border-indigo-500/50 bg-indigo-500/10'
                    : 'border-white/5 bg-[#1A1A1A]'
                }`}
              >
                <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                <span className="text-xs text-white">{cat.name}</span>
              </TapButton>
            ))}
          </div>
        </div>
      )}

      {/* Category Selector */}
      <TapButton
        onTap={() => setShowCategorySheet(true)}
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
      </TapButton>

      {/* Account Selector (for new expenses only) */}
      {!editingExpense && accounts.length > 0 && (
        <TapButton
          onTap={() => setShowAccountSheet(true)}
          className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 flex items-center gap-3 active:bg-[#222222] transition-colors"
        >
          <span className="text-xl">{TYPE_ICONS[selectedAccount?.type ?? 'cash'] ?? '💳'}</span>
          <div className="flex-1 text-left">
            <p className="text-xs text-[#6B6B6B]">Account</p>
            <p className="text-sm font-medium text-white">{selectedAccount?.name ?? 'Select account'}</p>
          </div>
          <ChevronDown size={16} className="text-[#6B6B6B]" />
        </TapButton>
      )}

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
      <TapButton
        onTap={handleSave}
        disabled={!isValid || saving}
        className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-200 ${
          isValid && !saving
            ? 'bg-indigo-500 active:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
            : 'bg-[#1A1A1A] text-[#444444] border border-white/5 cursor-not-allowed'
        }`}
      >
        {saving ? 'Saving…' : editingExpense ? 'Update Expense' : 'Save Expense'}
      </TapButton>

      {/* Category Bottom Sheet */}
      {showCategorySheet && (
        <CategorySheet
          categories={categories}
          currentCategoryId={categoryId}
          onConfirm={handleSelectCategory}
          onClose={() => setShowCategorySheet(false)}
        />
      )}

      {/* Account Bottom Sheet */}
      {showAccountSheet && (
        <AccountSheet
          accounts={accounts}
          currentAccountId={accountId}
          currency={settings.currency}
          onConfirm={(id) => { setAccountId(id); setShowAccountSheet(false); }}
          onClose={() => setShowAccountSheet(false)}
        />
      )}
    </div>
  );
}
