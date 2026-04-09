import { useState, useEffect } from 'react';
import {
  Download,
  Trash2,
  Plus,
  Pencil,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { CategoryFormModal, type CategoryFormData } from '../components/CategoryFormModal';
import { AccountFormModal, type AccountFormData } from '../components/AccountFormModal';
import { GenericPageSkeleton } from '../components/Skeleton';
import { exportToCSV } from '../utils/export';
import { Category, Account } from '../database';
import { formatCurrency } from '../utils/formatters';

const TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

export function SettingsPage() {
  const {
    settings, categories, accounts, loading,
    updateSetting, addCategory, updateCategory, deleteCategory,
    addAccount, updateAccount, deleteAccount,
    clearAll, expenses,
  } = useApp();

  const [budgetInput, setBudgetInput] = useState(String(settings.monthly_budget));
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ name: '', icon: '💰', color: '#6366F1' });
  const [categoryNameError, setCategoryNameError] = useState(false);

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accountForm, setAccountForm] = useState<AccountFormData>({ name: '', type: 'cash' });
  const [accountNameError, setAccountNameError] = useState(false);
  const [accountDupError, setAccountDupError] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState<Account | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  useEffect(() => {
    setBudgetInput(String(settings.monthly_budget));
  }, [settings.monthly_budget]);

  const closeCategoryModal = () => { setShowAddCategory(false); setEditingCategory(null); setCategoryNameError(false); };
  const closeAccountModal = () => { setShowAddAccount(false); setEditingAccount(null); setAccountNameError(false); setAccountDupError(false); };

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) return;
    await updateSetting('monthly_budget', val);
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  };

  const handleExport = () => { exportToCSV(expenses, categories); };

  const handleReset = async () => {
    setResetting(true);
    try {
      await clearAll();
      setShowResetConfirm(false);
    } finally {
      setResetting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) { setCategoryNameError(true); return; }
    await addCategory(categoryForm);
    setShowAddCategory(false);
    setCategoryNameError(false);
    setCategoryForm({ name: '', icon: '💰', color: '#6366F1' });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryForm.name.trim()) { setCategoryNameError(true); return; }
    await updateCategory(editingCategory.id, categoryForm);
    setEditingCategory(null);
    setCategoryNameError(false);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setCategoryNameError(false);
  };

  const validateAccountName = (name: string, excludeId?: string): { nameError: boolean; dupError: boolean } => {
    if (!name.trim()) return { nameError: true, dupError: false };
    const dup = accounts.some((a) => a.name.toLowerCase() === name.trim().toLowerCase() && a.id !== excludeId);
    return { nameError: false, dupError: dup };
  };

  const handleAddAccount = async () => {
    const { nameError, dupError } = validateAccountName(accountForm.name);
    setAccountNameError(nameError);
    setAccountDupError(dupError);
    if (nameError || dupError) return;
    await addAccount({ name: accountForm.name.trim(), type: accountForm.type, balance: 0 });
    closeAccountModal();
    setAccountForm({ name: '', type: 'cash' });
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;
    const { nameError, dupError } = validateAccountName(accountForm.name, editingAccount.id);
    setAccountNameError(nameError);
    setAccountDupError(dupError);
    if (nameError || dupError) return;
    await updateAccount(editingAccount.id, { name: accountForm.name.trim(), type: accountForm.type });
    closeAccountModal();
  };

  const openEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setAccountForm({ name: acc.name, type: acc.type });
    setAccountNameError(false);
    setAccountDupError(false);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!confirmDeleteAccount) return;
    setDeletingAccountId(confirmDeleteAccount.id);
    try {
      await deleteAccount(confirmDeleteAccount.id);
    } finally {
      setConfirmDeleteAccount(null);
      setDeletingAccountId(null);
    }
  };

  if (loading) {
    return <GenericPageSkeleton />;
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Preferences</p>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Budget */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <h2 className="text-sm font-semibold text-white mb-3">Monthly Budget</h2>
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="text-[#6B6B6B] text-sm">₹</span>
          <input
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none"
            placeholder="20000"
            min="0"
            step="1000"
            style={{ userSelect: 'text', touchAction: 'auto' }}
          />
        </div>
        <button
          onClick={handleSaveBudget}
          className={`mt-3 w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            budgetSaved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-indigo-500 text-white'
          }`}
        >
          {budgetSaved ? <><Check size={14} /> Saved</> : 'Save'}
        </button>
      </div>

      {/* Accounts */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Accounts</h2>
          <button
            onClick={() => { setShowAddAccount(true); setAccountForm({ name: '', type: 'cash' }); setAccountNameError(false); setAccountDupError(false); }}
            className="flex items-center gap-1 text-xs text-indigo-400"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-xs text-[#6B6B6B] text-center py-3">No accounts yet. Add one to track balances.</p>
        ) : (
          <div className="space-y-1">
            {accounts.map((acc) => (
              <div key={acc.id} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-base flex-shrink-0">
                  {TYPE_ICONS[acc.type] ?? '💳'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#A0A0A0] truncate">{acc.name}</p>
                  <p className="text-xs text-[#6B6B6B]">{formatCurrency(acc.balance, settings.currency)}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => openEditAccount(acc)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] rounded-lg"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => accounts.length > 1 ? setConfirmDeleteAccount(acc) : undefined}
                    disabled={accounts.length <= 1 || deletingAccountId === acc.id}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-opacity ${
                      accounts.length <= 1 ? 'text-[#333333] cursor-not-allowed opacity-40' : 'text-[#6B6B6B]'
                    }`}
                    title={accounts.length <= 1 ? 'Cannot delete the last account' : 'Delete account'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Categories</h2>
          <button
            onClick={() => { setShowAddCategory(true); setCategoryForm({ name: '', icon: '💰', color: '#6366F1' }); setCategoryNameError(false); }}
            className="flex items-center gap-1 text-xs text-indigo-400"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        <div className="space-y-1">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 py-2.5">
              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
              <span className="flex-1 text-sm text-[#A0A0A0] truncate">{cat.name}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => openEditCategory(cat)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] rounded-lg"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#6B6B6B] rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Actions */}
      <div className="bg-[#1A1A1A] rounded-2xl p-1 border border-white/5 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl active:bg-white/5 transition-colors"
        >
          <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
            <Download size={15} className="text-indigo-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-white">Export Data</p>
            <p className="text-xs text-[#6B6B6B]">{expenses.length} expenses as CSV</p>
          </div>
          <ChevronRight size={15} className="text-[#6B6B6B]" />
        </button>
        <div className="h-px bg-white/5 mx-3" />
        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl active:bg-red-500/5 transition-colors"
        >
          <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
            <Trash2 size={15} className="text-red-400" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-red-400">Reset All Data</p>
            <p className="text-xs text-[#6B6B6B]">Permanently delete everything</p>
          </div>
          <ChevronRight size={15} className="text-[#6B6B6B]" />
        </button>
      </div>

      <div className="text-center py-4">
        <p className="text-xs text-[#444444]">Expense Tracker v2.0</p>
        <p className="text-xs text-[#333333] mt-1">All data stored locally on your device</p>
      </div>

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70 animate-fade-overlay" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <h3 className="text-base font-semibold text-white mb-2">Reset All Data?</h3>
            <p className="text-sm text-[#A0A0A0] mb-6">
              This will permanently delete all {expenses.length} expenses, categories, accounts, and settings. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-[#A0A0A0] bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-red-500 disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {(showAddCategory || editingCategory) && (
        <CategoryFormModal
          isEditing={!!editingCategory}
          form={categoryForm}
          nameError={categoryNameError}
          onFormChange={(f) => { setCategoryForm(f); setCategoryNameError(false); }}
          onSave={editingCategory ? handleUpdateCategory : handleAddCategory}
          onClose={closeCategoryModal}
        />
      )}

      {/* Add/Edit Account Modal */}
      {(showAddAccount || editingAccount) && (
        <AccountFormModal
          isEditing={!!editingAccount}
          form={accountForm}
          nameError={accountNameError}
          dupError={accountDupError}
          onFormChange={(f) => { setAccountForm(f); setAccountNameError(false); setAccountDupError(false); }}
          onSave={editingAccount ? handleUpdateAccount : handleAddAccount}
          onClose={closeAccountModal}
        />
      )}

      {/* Delete Account Confirmation */}
      {confirmDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70 animate-fade-overlay" onClick={() => setConfirmDeleteAccount(null)} />
          <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <h3 className="text-base font-semibold text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-[#A0A0A0] mb-6">
              Delete <span className="text-white font-medium">{confirmDeleteAccount.name}</span>?
              {confirmDeleteAccount.balance !== 0 && (
                <span className="block mt-1 text-amber-400 text-xs">
                  This account has a balance of {formatCurrency(confirmDeleteAccount.balance, settings.currency)}. Deleting it will remove this balance.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteAccount(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-[#A0A0A0] bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={!!deletingAccountId}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-red-500 disabled:opacity-50"
              >
                {deletingAccountId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
