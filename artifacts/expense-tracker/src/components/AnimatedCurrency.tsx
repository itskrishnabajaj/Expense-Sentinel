import { memo } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import { formatCurrency } from '../utils/formatters';

interface AnimatedCurrencyProps {
  value: number;
  currency: string;
  durationMs?: number;
  className?: string;
}

export const AnimatedCurrency = memo(function AnimatedCurrency({
  value,
  currency,
  durationMs = 400,
  className,
}: AnimatedCurrencyProps) {
  const animated = useCountUp(value, durationMs);
  return <span className={className}>{formatCurrency(animated, currency)}</span>;
});
