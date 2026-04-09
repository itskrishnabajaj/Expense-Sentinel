import { useState, useCallback } from 'react';
import { X, ChevronDown, Delete, Check, ArrowDown } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { AccountSheet } from './AccountSheet';
import { useApp } from '../context/AppContext';
import { formatAmountRaw, getCurrencySymbol, formatCurrency, getTodayString } from '../utils/formatters';

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];
const TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

function TransferInner({ onCloseClean }: { onCloseClean: () => void }) {
  const { accounts, settings, updateAccount, addTransaction } = useApp();
  const close = useModalClose();
  const symbol = getCurrencySymbol(settings.currency);

  const [amount, setAmount] = useState('');
  const [fromId, setFromId] = useState(accounts[0]?.id ?? '');
  const [toId, setToId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showFromSheet, setShowFromSheet] = useState(false);
  const [showToSheet, setShowToSheet] = useState(false);
  const [validationError, setValidationError] = useState('');

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
    const p = parseFloat(amount);
    if (!p || p <= 0 || !fromId || !toId || fromId === toId) return;

    const fromAcc = accounts.find((a) => a.id === fromId);
    const toAcc = accounts.find((a) => a.id === toId);

    if (fromAcc && fromAcc.balance < p) {
      setValidationError(`Insufficient balance in ${fromAcc.name} (${formatCurrency(fromAcc.balance, settings.currency)})`);
      return;
    }

    setValidationError('');
    setSaving(true);
    try {
      if (fromAcc) await updateAccount(fromId, { balance: fromAcc.balance - p });
      if (toAcc) await updateAccount(toId, { balance: toAcc.balance + p });
      await addTransaction({
        type: 'transfer',
        amount: p,
        fromAccountId: fromId,
        toAccountId: toId,
        note: note.trim(),
        date,
      });
      setSuccess(true);
      setTimeout(() => { onCloseClean(); }, 600);
    } finally {
      setSaving(false);
    }
  }, [amount, fromId, toId, note, date, accounts, updateAccount, addTransaction, onCloseClean, settings.currency]);

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={28} color="#60A5FA" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>Transfer Done!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Transfer</h2>
        <button onPointerDown={(e) => { e.stopPropagation(); close(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
          <X size={16} className="text-[#6B6B6B]" />
        </button>
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
            <button
              key={key}
              onPointerDown={(e) => { e.preventDefault(); handleNumKey(key); }}
              className="h-12 bg-[#111111] active:bg-[#1E1E1E] rounded-xl flex items-center justify-center border border-white/5"
            >
              {key === 'backspace' ? <Delete size={16} className="text-[#A0A0A0]" /> : <span className="text-base font-medium text-white">{key}</span>}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <button
            onPointerDown={(e) => { e.preventDefault(); setShowFromSheet(true); }}
            className="w-full bg-[#111111] border border-white/5 rounded-xl p-3.5 flex items-center gap-3 active:bg-[#1A1A1A]"
          >
            <span className="text-lg">{TYPE_ICONS[fromAccount?.type ?? 'cash'] ?? '💳'}</span>
            <div className="flex-1 text-left">
              <p className="text-xs text-[#6B6B6B]">From</p>
              <p className="text-sm font-medium text-white">{fromAccount?.name ?? 'Select account'}</p>
            </div>
            <ChevronDown size={16} className="text-[#6B6B6B]" />
          </button>

          <div className="flex justify-center py-0.5">
            <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center">
              <ArrowDown size={12} className="text-[#6B6B6B]" />
            </div>
          </div>

          <button
            onPointerDown={(e) => { e.preventDefault(); setShowToSheet(true); }}
            className="w-full bg-[#111111] border border-white/5 rounded-xl p-3.5 flex items-center gap-3 active:bg-[#1A1A1A]"
          >
            <span className="text-lg">{TYPE_ICONS[toAccount?.type ?? 'cash'] ?? '💳'}</span>
            <div className="flex-1 text-left">
              <p className="text-xs text-[#6B6B6B]">To</p>
              <p className="text-sm font-medium text-white">{toAccount?.name ?? 'Select account'}</p>
            </div>
            <ChevronDown size={16} className="text-[#6B6B6B]" />
          </button>
        </div>

        {fromId === toId && fromId && (
          <p className="text-xs text-amber-400 text-center">From and To accounts must be different</p>
        )}
        {validationError && (
          <p className="text-xs text-red-400 text-center">{validationError}</p>
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
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            isValid && !saving ? 'bg-blue-500 active:bg-blue-600 text-white' : 'bg-[#111111] text-[#444] border border-white/5 cursor-not-allowed'
          }`}
        >
          {saving ? 'Transferring…' : 'Transfer'}
        </button>
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

export function TransferModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <TransferInner onCloseClean={onClose} />
    </Modal>
  );
}
