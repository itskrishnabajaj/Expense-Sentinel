import { useState, useEffect } from 'react';
import {
  Download,
  Trash2,
  Plus,
  Pencil,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { GenericPageSkeleton } from '../components/Skeleton';
import { exportToCSV } from '../utils/export';
import { Category } from '../database';

const CATEGORY_ICONS = ['🍽️', '🚗', '🛍️', '🎬', '💊', '⚡', '✈️', '📚', '👤', '💰', '🏠', '🎮', '☕', '🐾', '💪', '🎵', '🌿', '🎨', '💼', '🧴'];
const CATEGORY_COLORS = ['#F97316', '#3B82F6', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#06B6D4', '#6366F1', '#84CC16', '#6B7280', '#EF4444', '#14B8A6'];

interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
}

export function SettingsPage() {
  const { settings, categories, loading, updateSetting, addCategory, updateCategory, deleteCategory, clearAll, expenses } = useApp();

  const [budgetInput, setBudgetInput] = useState(String(settings.monthly_budget));
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ name: '', icon: '💰', color: '#6366F1' });
  const [categoryNameError, setCategoryNameError] = useState(false);

  useEffect(() => {
    setBudgetInput(String(settings.monthly_budget));
  }, [settings.monthly_budget]);

  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    const isOpen = showAddCategory || !!editingCategory;
    if (main) main.style.overflow = isOpen ? 'hidden' : '';
    return () => { if (main) main.style.overflow = ''; };
  }, [showAddCategory, editingCategory]);

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (isNaN(val) || val <= 0) return;
    await updateSetting('monthly_budget', val);
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
  };

  const handleExport = () => {
    exportToCSV(expenses, categories);
  };

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

  if (loading) {
    return <GenericPageSkeleton />;
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
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
            budgetSaved
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-indigo-500 text-white'
          }`}
        >
          {budgetSaved ? <><Check size={14} /> Saved</> : 'Save'}
        </button>
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
              <span className="flex-1 text-sm text-[#A0A0A0]">{cat.name}</span>
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

      {/* App Info */}
      <div className="text-center py-4">
        <p className="text-xs text-[#444444]">Expense Tracker v1.0</p>
        <p className="text-xs text-[#333333] mt-1">All data stored locally on your device</p>
      </div>

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/70 animate-fade-overlay" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
            <h3 className="text-base font-semibold text-white mb-2">Reset All Data?</h3>
            <p className="text-sm text-[#A0A0A0] mb-6">
              This will permanently delete all {expenses.length} expenses, categories, and settings. This cannot be undone.
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
        <div className="fixed inset-0 z-50 flex items-end outline-none" tabIndex={-1}>
          <div className="absolute inset-0 bg-black/60 animate-fade-overlay" onClick={() => { setShowAddCategory(false); setEditingCategory(null); setCategoryNameError(false); }} />
          <div className="relative w-full bg-[#111111] rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto scroll-native overscroll-contain animate-slide-up">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => { setShowAddCategory(false); setEditingCategory(null); setCategoryNameError(false); }}>
                <X size={18} className="text-[#6B6B6B]" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-[#6B6B6B] mb-2">Name</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => { setCategoryForm((p) => ({ ...p, name: e.target.value })); setCategoryNameError(false); }}
                placeholder="Category name"
                className={`w-full bg-[#1A1A1A] border rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-[#444444] ${
                  categoryNameError ? 'border-red-500/60' : 'border-white/10 focus:border-indigo-500/50'
                }`}
                style={{ userSelect: 'text', touchAction: 'auto' }}
              />
              {categoryNameError && (
                <p className="text-xs text-red-400 mt-1.5 ml-1">Name is required</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs text-[#6B6B6B] mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setCategoryForm((p) => ({ ...p, icon }))}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                      categoryForm.icon === icon ? 'bg-indigo-500/20 ring-1 ring-indigo-500' : 'bg-[#1A1A1A]'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-[#6B6B6B] mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCategoryForm((p) => ({ ...p, color }))}
                    className={`w-8 h-8 rounded-xl transition-all ${
                      categoryForm.color === color ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-[#111111]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
              className="w-full py-3.5 bg-indigo-500 text-white text-sm font-semibold rounded-xl"
            >
              {editingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
