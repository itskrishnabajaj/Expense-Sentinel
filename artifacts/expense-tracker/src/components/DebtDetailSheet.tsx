import { useState, useCallback } from 'react';
import { X, Delete, Check } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { TapButton } from './TapButton';
import { useApp } from '../context/AppContext';
import { Transaction } from '../database';
import { formatCurrency, formatDate, formatAmountRaw, getCurrencySymbol } from '../utils/formatters';
import { getTodayString } from '../utils/formatters';

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

function DebtDetailInner({
  tx,
  onCloseClean,
  onEdit,
}: {
  tx: Transaction;
  onCloseClean: () => void;
  onEdit: () => void;
}) {
  const { accounts, settings, updateAccount, updateTransaction } = useApp();
  const close = useModalClose();
  const symbol = getCurrencySymbol(settings.currency);

  const [mode, setMode] = useState<'detail' | 'partial'>('detail');
  const [partialAmount, setPartialAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const remaining = tx.remainingAmount ?? tx.amount;
  const total = tx.amount;
  const paid = total - remaining;
  const pct = total > 0 ? Math.max(0, Math.min(100, (paid / total) * 100)) : 0;
  const isSettled = tx.status === 'settled' || remaining <= 0;
  const account = accounts.find((a) => a.id === tx.accountId);

  const handleNumKey = useCallback((key: string) => {
    setPartialAmount((prev) => {
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

  const applyPayment = useCallback(async (paidAmount: number, note: string) => {
    const newRemaining = Math.max(0, parseFloat((remaining - paidAmount).toFixed(2)));
    const newStatus: 'active' | 'settled' = newRemaining === 0 ? 'settled' : 'active';

    if (!tx.isOld && account) {
      const balanceDelta = tx.debtType === 'taken' ? -paidAmount : paidAmount;
      await updateAccount(account.id, { balance: account.balance + balanceDelta });
    }

    const payment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      amount: paidAmount,
      date: getTodayString(),
      note: note || undefined,
      createdAt: Date.now(),
    };

    await updateTransaction(tx.id, {
      remainingAmount: newRemaining,
      status: newStatus,
      history: [...(tx.history ?? []), payment],
    });
  }, [tx, remaining, account, updateAccount, updateTransaction]);

  const handlePayFull = useCallback(async () => {
    if (isSettled || saving || remaining <= 0) return;
    setSaving(true);
    try {
      await applyPayment(remaining, 'Paid in full');
      setSuccessMsg('Debt Settled!');
      setSuccess(true);
      setTimeout(() => onCloseClean(), 700);
    } finally {
      setSaving(false);
    }
  }, [remaining, isSettled, saving, applyPayment, onCloseClean]);

  const handlePayPartial = useCallback(async () => {
    const paid = parseFloat(partialAmount);
    if (!paid || paid <= 0 || paid > remaining || saving) return;
    setSaving(true);
    try {
      await applyPayment(paid, '');
      setSuccessMsg('Payment Recorded!');
      setSuccess(true);
      setTimeout(() => onCloseClean(), 700);
    } finally {
      setSaving(false);
    }
  }, [partialAmount, remaining, saving, applyPayment, onCloseClean]);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Check size={28} color="#FBBF24" />
        </div>
        <p className="text-base font-semibold text-white">{successMsg}</p>
      </div>
    );
  }

  if (mode === 'partial') {
    const partialParsed = parseFloat(partialAmount);
    const partialValid = !isNaN(partialParsed) && partialParsed > 0 && partialParsed <= remaining;
    return (
      <>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
          <TapButton
            onTap={() => { setMode('detail'); setPartialAmount(''); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5"
          >
            <X size={16} className="text-[#6B6B6B]" />
          </TapButton>
          <h2 className="text-base font-semibold text-white">Pay Partial</h2>
          <div className="w-8" />
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          <div className="bg-[#111111] rounded-2xl p-4 text-center border border-white/5">
            <p className="text-xs text-[#6B6B6B] mb-2 uppercase tracking-widest">Amount to Pay</p>
            <div className="h-12 flex items-center justify-center">
              {partialAmount ? (
                <span className="text-4xl font-bold text-amber-400 tracking-tight">
                  {formatAmountRaw(partialAmount, symbol)}
                </span>
              ) : (
                <span className="text-4xl font-bold text-[#2A2A2A] tracking-tight">{symbol}0</span>
              )}
            </div>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Max: {formatCurrency(remaining, settings.currency)}
            </p>
          </div>

          {partialParsed > remaining && (
            <p className="text-xs text-red-400 text-center">Amount exceeds remaining balance</p>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            {NUMPAD_KEYS.map((key) => (
              <TapButton
                key={key}
                onTap={() => handleNumKey(key)}
                tapOptions={{ preventDefault: true }}
                className="h-12 bg-[#111111] active:bg-[#1E1E1E] rounded-xl flex items-center justify-center border border-white/5"
              >
                {key === 'backspace'
                  ? <Delete size={16} className="text-[#A0A0A0]" />
                  : <span className="text-base font-medium text-white">{key}</span>
                }
              </TapButton>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 flex-shrink-0 border-t border-white/5">
          <TapButton
            onTap={handlePayPartial}
            disabled={!partialValid || saving}
            className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
              partialValid && !saving
                ? 'bg-amber-500 active:bg-amber-600 text-white'
                : 'bg-[#111111] text-[#444] border border-white/5 cursor-not-allowed'
            }`}
          >
            {saving ? 'Recording…' : 'Record Payment'}
          </TapButton>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Debt Details</h2>
        <TapButton onTap={close} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
          <X size={16} className="text-[#6B6B6B]" />
        </TapButton>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
        <div className="bg-[#111111] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold uppercase tracking-widest ${tx.debtType === 'taken' ? 'text-emerald-400' : 'text-red-400'}`}>
              {tx.debtType === 'taken' ? '⬇ Borrowed' : '⬆ Lent'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isSettled
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-amber-500/15 text-amber-400'
            }`}>
              {isSettled ? 'Settled' : 'Active'}
            </span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{formatCurrency(total, settings.currency)}</p>
          {tx.note && <p className="text-xs text-[#6B6B6B] mt-1">{tx.note}</p>}
          {account && <p className="text-xs text-[#6B6B6B] mt-0.5">{account.name}</p>}
          <p className="text-xs text-[#444] mt-1">{formatDate(tx.date)}</p>
        </div>

        <div className="bg-[#111111] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#6B6B6B]">Paid</span>
            <span className="text-xs text-[#6B6B6B]">Remaining</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-emerald-400">
              {formatCurrency(paid, settings.currency)}
            </span>
            <span className="text-sm font-semibold text-white">
              {formatCurrency(remaining, settings.currency)}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: '#34D399',
                boxShadow: pct > 0 ? '0 0 8px rgba(52,211,153,0.4)' : 'none',
              }}
            />
          </div>
          <p className="text-xs text-[#6B6B6B] mt-2 text-right">{Math.round(pct)}% paid</p>
        </div>

        {(tx.history ?? []).length > 0 && (
          <div className="bg-[#111111] rounded-2xl p-4 border border-white/5">
            <p className="text-xs font-semibold text-[#A0A0A0] mb-3 uppercase tracking-widest">
              Payment History
            </p>
            <div className="space-y-2.5">
              {[...(tx.history ?? [])].reverse().map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white">{formatDate(p.date)}</p>
                    {p.note && p.note !== 'Paid in full' && (
                      <p className="text-xs text-[#6B6B6B]">{p.note}</p>
                    )}
                    {p.note === 'Paid in full' && (
                      <p className="text-xs text-emerald-400/70">Paid in full</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-emerald-400">
                    +{formatCurrency(p.amount, settings.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 flex-shrink-0 border-t border-white/5 space-y-2">
        {!isSettled && (
          <>
            <TapButton
              onTap={handlePayFull}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-emerald-500 active:bg-emerald-600 text-white disabled:opacity-50"
            >
              {saving ? 'Processing…' : `Pay Full (${formatCurrency(remaining, settings.currency)})`}
            </TapButton>
            <TapButton
              onTap={() => setMode('partial')}
              disabled={saving}
              className="w-full py-3 rounded-2xl text-sm font-medium text-[#A0A0A0] active:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Pay Partial
            </TapButton>
          </>
        )}
        <TapButton
          onTap={onEdit}
          className="w-full py-3 rounded-2xl text-sm font-medium text-[#A0A0A0] active:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          Edit Debt
        </TapButton>
      </div>
    </>
  );
}

export function DebtDetailSheet({
  tx,
  onClose,
  onEdit,
}: {
  tx: Transaction;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <DebtDetailInner tx={tx} onCloseClean={onClose} onEdit={onEdit} />
    </Modal>
  );
}
