import { useMemo } from 'react';

interface BudgetProgressProps {
  spent: number;
  budget: number;
  showLabel?: boolean;
}

export function BudgetProgress({ spent, budget, showLabel = true }: BudgetProgressProps) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  const { color, bgColor, label } = useMemo(() => {
    if (pct >= 100) return {
      color: 'bg-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Over budget',
    };
    if (pct >= 80) return {
      color: 'bg-amber-500',
      bgColor: 'bg-amber-500/10',
      label: 'Almost there',
    };
    return {
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-500/10',
      label: 'On track',
    };
  }, [pct]);

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#6B6B6B]">{label}</span>
          <span className="text-xs font-medium text-[#A0A0A0]">{pct.toFixed(0)}%</span>
        </div>
      )}
      <div className={`h-2 rounded-full ${bgColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
