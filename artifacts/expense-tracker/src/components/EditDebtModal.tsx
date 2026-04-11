import { useState, useCallback, useMemo, useRef } from 'react';
import { X, ChevronDown, Delete, Check, AlertTriangle } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { AccountSheet } from './AccountSheet';
import { TapButton } from './TapButton';
import { useApp } from '../context/AppContext';
import { Transaction, atomicBatch, AtomicOp } from '../database';
import { getTodayString, formatAmountRaw, getCurrencySymbol } from '../utils/formatters';

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];
const TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

function EditDebtInner({
  tx,
  onCloseClean,
}: {
  tx: Transaction;
  onCloseClean: () => void;
}) {
  const { accounts, settings, refresh } = useApp();
  const close = useModalClose();
  const symbol = getCurrencySymbol(settings.currency);

  const [debtType, setDebtType] = useState<'taken' | 'given'>(tx.debtType ?? 'taken');
  const [amount, setAmount] = useState(String(tx.amount));
  const [accountId, setAccountId] = useState(tx.accountId ?? accounts[0]?.id ?? '');
  const [note, setNote] = useState(tx.note ?? '');
  const [date, setDate] = useState(tx.date);
  const [isOld, setIsOld] = useState(tx.isOld ?? false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);

  const hasPayments = (tx.history ?? []).length > 0;
  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const displayAmount = formatAmountRaw(amount, symbol);
  const isValid = parseFloat(amount) > 0 && !!accountId;
  const debtColor = debtType === 'taken' ? '#34D399' : '#F87171';

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

  const financialAmountsChanged = useMemo(() => {
    const newAmount = parseFloat(amount);
    return (
      newAmount !== tx.amount ||
      debtType !== tx.debtType ||
      accountId !== tx.accountId
    );
  }, [amount, debtType, accountId, tx]);

  const isOldChanged = useMemo(() => isOld !== (tx.isOld ?? false), [isOld, tx.isOld]);

  const financialFieldsChanged = financialAmountsChanged || isOldChanged;

  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
    const newAmount = parseFloat(amount);
    if (!newAmount || newAmount <= 0 || !accountId) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    try {
      const ops: AtomicOp[] = [];

      if (financialFieldsChanged) {
        const adjustments = new Map<string, number>();
        const adjust = (id: string | undefined, delta: number) => {
          if (!id) return;
          adjustments.set(id, (adjustments.get(id) ?? 0) + delta);
        };

        if (financialAmountsChanged) {
          if (!tx.isOld && tx.accountId) {
            const creationReverse = tx.debtType === 'taken' ? -tx.amount : tx.amount;
            adjust(tx.accountId, creationReverse);
          }

          if (tx.history && tx.history.length > 0) {
            for (const payment of tx.history) {
              const payAccId = tx.isOld ? payment.accountId : (payment.accountId ?? tx.accountId);
              if (!payAccId) continue;
              const paymentReverse = tx.debtType === 'taken' ? payment.amount : -payment.amount;
              adjust(payAccId, paymentReverse);
            }
          }

          if (!isOld) {
            const applyDelta = debtType === 'taken' ? newAmount : -newAmount;
            adjust(accountId, applyDelta);
          }
        } else {
          if (!tx.isOld && tx.accountId) {
            const creationReverse = tx.debtType === 'taken' ? -tx.amount : tx.amount;
            adjust(tx.accountId, creationReverse);
          }
          if (!isOld) {
            const applyDelta = tx.debtType === 'taken' ? tx.amount : -tx.amount;
            adjust(tx.accountId, applyDelta);
          }
        }

        for (const [id, delta] of adjustments) {
          if (delta !== 0) {
            const acc = accounts.find((a) => a.id === id);
            if (acc) ops.push({ store: 'accounts', type: 'put', value: { ...acc, balance: acc.balance + delta } });
          }
        }

        if (financialAmountsChanged) {
          ops.push({
            store: 'transactions',
            type: 'put',
            value: {
              ...tx,
              amount: newAmount,
              accountId,
              note: note.trim(),
              date,
              debtType,
              isOld,
              remainingAmount: newAmount,
              status: 'active' as const,
              history: [],
            },
          });
        } else {
          ops.push({
            store: 'transactions',
            type: 'put',
            value: { ...tx, note: note.trim(), date, isOld },
          });
        }
      } else {
        ops.push({
          store: 'transactions',
          type: 'put',
          value: { ...tx, note: note.trim(), date, isOld },
        });
      }

      await atomicBatch(ops);
      await refresh();

      setSuccess(true);
      setTimeout(() => onCloseClean(), 600);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [amount, accountId, note, date, debtType, isOld, tx, accounts, refresh, onCloseClean, financialFieldsChanged, financialAmountsChanged]);

  const handleSaveOrConfirm = useCallback(() => {
    if (hasPayments && financialAmountsChanged && !confirmingReset) {
      setConfirmingReset(true);
      return;
    }
    handleSave();
  }, [hasPayments, financialAmountsChanged, confirmingReset, handleSave]);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Check size={28} color="#FBBF24" />
        </div>
        <p className="text-base font-semibold text-white">Debt Updated!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Edit Debt</h2>
        <TapButton onTap={close} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
          <X size={16} className="text-[#6B6B6B]" />
        </TapButton>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3" style={{ overscrollBehavior: 'contain' }}>
        {hasPayments && financialAmountsChanged && !confirmingReset && (
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-3">
            <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              This debt has {tx.history!.length} payment{tx.history!.length > 1 ? 's' : ''} recorded.
              Changing financial details will clear payment history and reset the remaining amount.
            </p>
          </div>
        )}
        {confirmingReset && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-3.5 py-3 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed font-medium">
                Permanently clear {tx.history!.length} payment record{tx.history!.length > 1 ? 's' : ''}? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <TapButton
                onTap={() => setConfirmingReset(false)}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-[#A0A0A0] border border-white/10"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                Cancel
              </TapButton>
              <TapButton
                onTap={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500 active:bg-red-600 text-white"
              >
                {saving ? 'Saving…' : 'Reset & Save'}
              </TapButton>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {(['taken', 'given'] as const).map((t) => (
            <TapButton
              key={t}
              onTap={() => setDebtType(t)}
              className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                debtType === t
                  ? t === 'taken'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'bg-[#111111] border-white/5 text-[#6B6B6B]'
              }`}
            >
              {t === 'taken' ? '⬇ Borrowed' : '⬆ Lent'}
            </TapButton>
          ))}
        </div>

        <div className="bg-[#111111] rounded-2xl p-4 text-center border border-white/5">
          <p className="text-xs text-[#6B6B6B] mb-2 uppercase tracking-widest">Amount</p>
          <div className="h-12 flex items-center justify-center">
            {displayAmount ? (
              <span className="text-4xl font-bold tracking-tight" style={{ color: debtColor }}>
                {displayAmount}
              </span>
            ) : (
              <span className="text-4xl font-bold text-[#2A2A2A] tracking-tight">{symbol}0</span>
            )}
          </div>
        </div>

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

        <TapButton
          onTap={() => setShowAccountSheet(true)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl p-3.5 flex items-center gap-3 active:bg-[#1A1A1A]"
        >
          <span className="text-lg">{TYPE_ICONS[selectedAccount?.type ?? 'cash'] ?? '💳'}</span>
          <div className="flex-1 text-left">
            <p className="text-xs text-[#6B6B6B]">Account</p>
            <p className="text-sm font-medium text-white">{selectedAccount?.name ?? 'Select account'}</p>
          </div>
          <ChevronDown size={16} className="text-[#6B6B6B]" />
        </TapButton>

        <div className="bg-[#111111] border border-white/5 rounded-xl p-3.5">
          <label className="block text-xs text-[#6B6B6B] mb-1.5">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Who / what for?"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#444]"
            maxLength={100}
            style={{ userSelect: 'text', touchAction: 'auto' }}
          />
        </div>

        <div className="bg-[#111111] border border-white/5 rounded-xl p-3.5">
          <label className="block text-xs text-[#6B6B6B] mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getTodayString()}
            className="w-full bg-transparent text-sm text-white outline-none [color-scheme:dark]"
            style={{ userSelect: 'text', touchAction: 'auto' }}
          />
        </div>

        <TapButton
          onTap={() => setIsOld(!isOld)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
            isOld ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#111111] border-white/5'
          }`}
        >
          <div className="text-left">
            <p className={`text-sm font-medium ${isOld ? 'text-amber-400' : 'text-white'}`}>Old Debt</p>
            <p className="text-xs text-[#6B6B6B]">Does not affect account balance</p>
          </div>
          <div
            className="rounded-full transition-all relative flex-shrink-0"
            style={{ width: 40, height: 22, background: isOld ? '#F59E0B' : '#333333' }}
          >
            <div
              className="absolute rounded-full bg-white transition-all"
              style={{ width: 18, height: 18, top: 2, left: isOld ? 20 : 2, transition: 'left 0.15s ease' }}
            />
          </div>
        </TapButton>

        {saveError && (
          <p className="text-xs text-red-400 text-center">{saveError}</p>
        )}
      </div>

      {!confirmingReset && (
        <div className="px-5 py-4 flex-shrink-0 border-t border-white/5">
          <TapButton
            onTap={handleSaveOrConfirm}
            disabled={!isValid || saving}
            className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
              isValid && !saving
                ? 'bg-amber-500 active:bg-amber-600 text-white'
                : 'bg-[#111111] text-[#444] border border-white/5 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : (hasPayments && financialAmountsChanged) ? 'Update & Reset Payments' : 'Update Debt'}
          </TapButton>
        </div>
      )}

      {showAccountSheet && (
        <AccountSheet
          accounts={accounts}
          currentAccountId={accountId}
          currency={settings.currency}
          onConfirm={(id) => { setAccountId(id); setShowAccountSheet(false); }}
          onClose={() => setShowAccountSheet(false)}
        />
      )}
    </>
  );
}

export function EditDebtModal({
  tx,
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <EditDebtInner tx={tx} onCloseClean={onClose} />
    </Modal>
  );
}
