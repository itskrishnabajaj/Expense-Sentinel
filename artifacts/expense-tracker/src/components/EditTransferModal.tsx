import { useState, useCallback, useRef } from 'react';
import { X, ChevronDown, Delete, Check, ArrowDown } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { AccountSheet } from './AccountSheet';
import { TapButton } from './TapButton';
import { useApp } from '../context/AppContext';
import { Transaction, atomicBatch, AtomicOp } from '../database';
import { formatAmountRaw, getCurrencySymbol, formatCurrency, getTodayString } from '../utils/formatters';

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];
const TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

function EditTransferInner({
  tx,
  onCloseClean,
}: {
  tx: Transaction;
  onCloseClean: () => void;
}) {
  const { accounts, settings, refresh } = useApp();
  const close = useModalClose();
  const symbol = getCurrencySymbol(settings.currency);

  const [amount, setAmount] = useState(String(tx.amount));
  const [fromId, setFromId] = useState(tx.fromAccountId ?? accounts[0]?.id ?? '');
  const [toId, setToId] = useState(tx.toAccountId ?? accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [note, setNote] = useState(tx.note ?? '');
  const [date, setDate] = useState(tx.date);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showFromSheet, setShowFromSheet] = useState(false);
  const [showToSheet, setShowToSheet] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saveError, setSaveError] = useState('');
  const savingRef = useRef(false);

  const fromAccount = accounts.find((a) => a.id === fromId) ?? accounts[0];
  const toAccount = accounts.find((a) => a.id === toId);
  const displayAmount = formatAmountRaw(amount, symbol);
  const parsed = parseFloat(amount);
  const isValid = parsed > 0 && !!fromId && !!toId && fromId !== toId;

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

  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
    const newAmount = parseFloat(amount);
    if (!newAmount || newAmount <= 0 || !fromId || !toId || fromId === toId) return;

    const fromAcc = accounts.find((a) => a.id === fromId);
    if (fromAcc) {
      const reversal = tx.fromAccountId === fromId ? tx.amount : 0;
      const availableBalance = fromAcc.balance + reversal;
      if (newAmount > availableBalance) {
        setValidationError(`Insufficient balance in ${fromAcc.name} (available: ${formatCurrency(availableBalance, settings.currency)})`);
        return;
      }
    }

    setValidationError('');
    setSaveError('');
    setSaving(true);
    savingRef.current = true;
    try {
      const adjustments = new Map<string, number>();
      const adjust = (id: string | undefined, delta: number) => {
        if (!id) return;
        adjustments.set(id, (adjustments.get(id) ?? 0) + delta);
      };

      adjust(tx.fromAccountId, +tx.amount);
      adjust(tx.toAccountId, -tx.amount);
      adjust(fromId, -newAmount);
      adjust(toId, +newAmount);

      const ops: AtomicOp[] = [];
      for (const [id, delta] of adjustments) {
        if (delta !== 0) {
          const acc = accounts.find((a) => a.id === id);
          if (acc) ops.push({ store: 'accounts', type: 'put', value: { ...acc, balance: acc.balance + delta } });
        }
      }
      ops.push({
        store: 'transactions',
        type: 'put',
        value: { ...tx, amount: newAmount, fromAccountId: fromId, toAccountId: toId, note: note.trim(), date },
      });

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
  }, [amount, fromId, toId, note, date, tx, accounts, refresh, onCloseClean, settings.currency]);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.15)' }}>
          <Check size={28} color="#60A5FA" />
        </div>
        <p className="text-base font-semibold text-white">Transfer Updated!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Edit Transfer</h2>
        <TapButton onTap={close} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
          <X size={16} className="text-[#6B6B6B]" />
        </TapButton>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3" style={{ overscrollBehavior: 'contain' }}>
        <div className="bg-[#111111] rounded-2xl p-4 text-center border border-white/5">
          <p className="text-xs text-[#6B6B6B] mb-2 uppercase tracking-widest">Amount</p>
          <div className="h-12 flex items-center justify-center">
            {displayAmount ? (
              <span className="text-4xl font-bold text-blue-400 tracking-tight">{displayAmount}</span>
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

        <div className="space-y-1">
          <TapButton
            onTap={() => setShowFromSheet(true)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl p-3.5 flex items-center gap-3 active:bg-[#1A1A1A]"
          >
            <span className="text-lg">{TYPE_ICONS[fromAccount?.type ?? 'cash'] ?? '💳'}</span>
            <div className="flex-1 text-left">
              <p className="text-xs text-[#6B6B6B]">From</p>
              <p className="text-sm font-medium text-white">{fromAccount?.name ?? 'Select account'}</p>
            </div>
            <ChevronDown size={16} className="text-[#6B6B6B]" />
          </TapButton>

          <div className="flex justify-center py-0.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.05)' }}>
              <ArrowDown size={12} className="text-[#6B6B6B]" />
            </div>
          </div>

          <TapButton
            onTap={() => setShowToSheet(true)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl p-3.5 flex items-center gap-3 active:bg-[#1A1A1A]"
          >
            <span className="text-lg">{TYPE_ICONS[toAccount?.type ?? 'cash'] ?? '💳'}</span>
            <div className="flex-1 text-left">
              <p className="text-xs text-[#6B6B6B]">To</p>
              <p className="text-sm font-medium text-white">{toAccount?.name ?? 'Select account'}</p>
            </div>
            <ChevronDown size={16} className="text-[#6B6B6B]" />
          </TapButton>
        </div>

        {fromId === toId && fromId && (
          <p className="text-xs text-amber-400 text-center">From and To accounts must be different</p>
        )}
        {validationError && (
          <p className="text-xs text-red-400 text-center">{validationError}</p>
        )}
        {saveError && (
          <p className="text-xs text-red-400 text-center">{saveError}</p>
        )}

        <div className="bg-[#111111] border border-white/5 rounded-xl p-3.5">
          <label className="block text-xs text-[#6B6B6B] mb-1.5">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is this transfer for?"
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
      </div>

      <div className="px-5 py-4 flex-shrink-0 border-t border-white/5">
        <TapButton
          onTap={handleSave}
          disabled={!isValid || saving}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            isValid && !saving
              ? 'bg-blue-500 active:bg-blue-600 text-white'
              : 'bg-[#111111] text-[#444] border border-white/5 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : 'Update Transfer'}
        </TapButton>
      </div>

      {showFromSheet && (
        <AccountSheet
          accounts={accounts}
          currentAccountId={fromId}
          title="From Account"
          currency={settings.currency}
          onConfirm={(id) => { setFromId(id); setShowFromSheet(false); }}
          onClose={() => setShowFromSheet(false)}
        />
      )}
      {showToSheet && (
        <AccountSheet
          accounts={accounts}
          currentAccountId={toId}
          title="To Account"
          currency={settings.currency}
          onConfirm={(id) => { setToId(id); setShowToSheet(false); }}
          onClose={() => setShowToSheet(false)}
        />
      )}
    </>
  );
}

export function EditTransferModal({
  tx,
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <EditTransferInner tx={tx} onCloseClean={onClose} />
    </Modal>
  );
}
