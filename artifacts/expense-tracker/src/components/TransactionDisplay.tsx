import { TrendingUp, ArrowLeftRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/formatters';
import { Transaction, Category } from '../database';

interface TxIconProps {
  tx: Transaction;
  categoryIcon?: string;
  categoryColor?: string;
  size?: 'sm' | 'md';
}

export function TxIcon({ tx, categoryIcon, categoryColor, size = 'sm' }: TxIconProps) {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 16 : 17;

  switch (tx.type) {
    case 'income':
      return (
        <div className={`${dim} rounded-xl flex items-center justify-center flex-shrink-0`}
          style={{ background: 'rgba(16,185,129,0.12)' }}>
          <TrendingUp size={iconSize} className="text-emerald-400" />
        </div>
      );
    case 'transfer':
      return (
        <div className={`${dim} rounded-xl flex items-center justify-center flex-shrink-0`}
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <ArrowLeftRight size={iconSize} className="text-blue-400" />
        </div>
      );
    case 'debt':
      return (
        <div className={`${dim} rounded-xl flex items-center justify-center flex-shrink-0`}
          style={{ background: 'rgba(245,158,11,0.12)' }}>
          <AlertCircle size={iconSize} className="text-amber-400" />
        </div>
      );
    default:
      if (categoryIcon && categoryColor) {
        return <CategoryIcon icon={categoryIcon} color={categoryColor} size={size} />;
      }
      return (
        <div className={`${dim} rounded-xl flex items-center justify-center flex-shrink-0`}
          style={{ background: 'rgba(239,68,68,0.12)' }}>
          <ShoppingBag size={iconSize} className="text-red-400" />
        </div>
      );
  }
}

export function getTxLabel(
  tx: Transaction,
  accountMap: Map<string, string>,
  categoryMap: Map<string, { name: string; icon: string; color: string }>
): string {
  switch (tx.type) {
    case 'income':
      return tx.note || 'Income';
    case 'expense': {
      const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
      return tx.note || cat?.name || 'Expense';
    }
    case 'transfer': {
      const from = tx.fromAccountId ? accountMap.get(tx.fromAccountId) : '';
      const to = tx.toAccountId ? accountMap.get(tx.toAccountId) : '';
      return `${from || '?'} → ${to || '?'}`;
    }
    case 'debt':
      return tx.note || (tx.debtType === 'taken' ? 'Borrowed' : 'Lent');
  }
}

export function getTxTitle(tx: Transaction, categoryName?: string): string {
  switch (tx.type) {
    case 'income':
      return tx.note || 'Income';
    case 'expense':
      return tx.note || categoryName || 'Expense';
    case 'transfer':
      return tx.note || 'Transfer';
    case 'debt':
      return tx.note || (tx.debtType === 'taken' ? 'Borrowed' : 'Lent');
  }
}

export function TxAmount({ tx, currency }: { tx: Transaction; currency: string }) {
  switch (tx.type) {
    case 'income':
      return <span className="text-sm font-semibold text-emerald-400">+{formatCurrency(tx.amount, currency)}</span>;
    case 'expense':
      return <span className="text-sm font-semibold text-white">-{formatCurrency(tx.amount, currency)}</span>;
    case 'transfer':
      return <span className="text-sm font-semibold text-blue-400">{formatCurrency(tx.amount, currency)}</span>;
    case 'debt':
      return (
        <span className="text-sm font-semibold" style={{ color: tx.debtType === 'taken' ? '#34D399' : '#F87171' }}>
          {tx.debtType === 'taken' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
        </span>
      );
  }
}

export function getTxAmountInfo(tx: Transaction, currency: string): { label: string; color: string } {
  switch (tx.type) {
    case 'income':
      return { label: `+${formatCurrency(tx.amount, currency)}`, color: '#34D399' };
    case 'expense':
      return { label: `-${formatCurrency(tx.amount, currency)}`, color: '#ffffff' };
    case 'transfer':
      return { label: formatCurrency(tx.amount, currency), color: '#60A5FA' };
    case 'debt':
      return {
        label: `${tx.debtType === 'taken' ? '+' : '-'}${formatCurrency(tx.amount, currency)}`,
        color: tx.debtType === 'taken' ? '#34D399' : '#F87171',
      };
  }
}
