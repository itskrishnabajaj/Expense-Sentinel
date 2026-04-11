export function formatCurrency(amount: number, _currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatAmountRaw(raw: string, symbol: string): string {
  if (!raw) return '';
  const parts = raw.split('.');
  const intPart = parseInt(parts[0] || '0', 10);
  const formattedInt = isNaN(intPart) ? '0' : intPart.toLocaleString('en-IN');
  if (parts.length === 2) return `${symbol}${formattedInt}.${parts[1]}`;
  return `${symbol}${formattedInt}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthName(month: number): string {
  return new Date(2024, month, 1).toLocaleString('en-IN', { month: 'long' });
}

export function getCurrencySymbol(_currency = 'INR'): string {
  return '₹';
}
