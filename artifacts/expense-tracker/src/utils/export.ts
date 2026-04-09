import { Expense } from '../database';
import { Category } from '../database';

export function exportToCSV(expenses: Expense[], categories: Category[]): void {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = ['Date', 'Amount', 'Category', 'Note'];
  const rows = expenses.map((e) => [
    e.date,
    e.amount.toFixed(2),
    categoryMap.get(e.category) || e.category,
    e.note || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
