import { useState } from 'react';
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
  const { settings, categories, updateSetting, addCategory, updateCategory, deleteCategory, clearAll, expenses } = useApp();

  const [budgetInput, setBudgetInput] = useState(String(settings.monthly_budget));
  const [budgetSaved, setBudgetSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({ name: '', icon: '💰', color: '#6366F1' });

  const handleSaveBudget = async () => {
    const val = parseFloat(budgetInput);
    if (!val || val <= 0) return;
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
    if (!categoryForm.name.trim()) return;
    await addCategory(categoryForm);
    setShowAddCategory(false);
    setCategoryForm({ name: '', icon: '💰', color: '#6366F1' });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryForm.name.trim()) return;
    await updateCategory(editingCategory.id, categoryForm);
    setEditingCategory(null);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({ name: cat.name, icon: cat.icon, color: cat.color });
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div>
        <p className="text-xs text-[#6B6B6B] uppercase tracking-widest mb-1">Preferences</p>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </div>

      {/* Budget */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
        <h2 className="text-sm font-semibold text-white mb-4">Monthly Budget</h2>
        <div className="flex gap-3">
          <div className="flex-1 bg-[#0D0D0D] border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-[#6B6B6B] text-sm">$</span>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none"
              placeholder="2000"
              min="0"
              step="100"
            />
          </div>
          <button
            onClick={handleSaveBudget}
            className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              budgetSaved
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-indigo-500 text-white hover:bg-indigo-400'
            }`}
          >
            {budgetSaved ? <><Check size={14} /> Saved</> : 'Save'}
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Categories</h2>
          <button
            onClick={() => { setShowAddCategory(true); setCategoryForm({ name: '', icon: '💰', color: '#6366F1' }); }}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 py-2 group">
              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
              <span className="flex-1 text-sm text-[#A0A0A0]">{cat.name}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditCategory(cat)}
                  className="p-1.5 text-[#6B6B6B] hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-[#6B6B6B] hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Actions */}
      <div className="bg-[#1A1A1A] rounded-2xl p-1 border border-white/5">
        <button
          onClick={handleExport}
          className="w-full flex items-center gap-3 px-3 py-3.5 hover:bg-white/5 rounded-xl transition-colors"
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
          className="w-full flex items-center gap-3 px-3 py-3.5 hover:bg-red-500/5 rounded-xl transition-colors"
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
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-semibold text-white mb-2">Reset All Data?</h3>
            <p className="text-sm text-[#A0A0A0] mb-6">
              This will permanently delete all {expenses.length} expenses, categories, and settings. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-[#A0A0A0] bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-400 transition-colors"
              >
                {resetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {(showAddCategory || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowAddCategory(false); setEditingCategory(null); }} />
          <div className="relative w-full bg-[#111111] rounded-t-3xl p-6 pb-10">
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={() => { setShowAddCategory(false); setEditingCategory(null); }}>
                <X size={18} className="text-[#6B6B6B]" />
              </button>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-xs text-[#6B6B6B] mb-2">Name</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Category name"
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-[#444444] focus:border-indigo-500/50"
                autoFocus
              />
            </div>

            {/* Icon */}
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

            {/* Color */}
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
              disabled={!categoryForm.name.trim()}
              className="w-full py-3.5 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {editingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
