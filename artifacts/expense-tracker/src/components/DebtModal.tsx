import { useState, useCallback } from 'react';
import { X, ChevronDown, Delete, Check } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { AccountSheet } from './AccountSheet';
import { useApp } from '../context/AppContext';
import { getTodayString, formatAmountRaw, getCurrencySymbol } from '../utils/formatters';

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];
const TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

function DebtInner({ onCloseClean }: { onCloseClean: () => void }) {
  const { accounts, settings, updateAccount, addTransaction } = useApp();
  const close = useModalClose();
  const symbol = getCurrencySymbol(settings.currency);

  const [debtType, setDebtType] = useState<'taken' | 'given'>('taken');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [isOld, setIsOld] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const displayAmount = formatAmountRaw(amount, symbol);
  const isValid = parseFloat(amount) > 0 && !!accountId;

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
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !accountId) return;
    setSaving(true);
    try {
      if (!isOld) {
        const acc = accounts.find((a) => a.id === accountId);
        if (acc) {
          const delta = debtType === 'taken' ? parsed : -parsed;
          await updateAccount(accountId, { balance: acc.balance + delta });
        }
      }
      await addTransaction({
        type: 'debt',
        amount: parsed,
        accountId,
        note: note.trim(),
        date,
        debtType,
        isOld,
      });
      setSuccess(true);
      setTimeout(() => { onCloseClean(); }, 600);
    } finally {
      setSaving(false);
    }
  }, [amount, accountId, note, date, debtType, isOld, accounts, updateAccount, addTransaction, onCloseClean]);

  const debtColor = debtType === 'taken' ? '#34D399' : '#F87171';

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={28} color="#FBBF24" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>Debt Recorded!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Record Debt</h2>
        <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
          <X size={16} className="text-[#6B6B6B]" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3" style={{ overscrollBehavior: 'contain' }}>
        <div className="grid grid-cols-2 gap-2">
          {(['taken', 'given'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setDebtType(t)}
              className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                debtType === t
                  ? t === 'taken'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    : 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'bg-[#111111] border-white/5 text-[#6B6B6B]'
              }`}
            >
              {t === 'taken' ? '⬇ Borrowed' : '⬆ Lent'}
            </button>
          ))}
        </div>

        <div className="bg-[#111111] rounded-2xl p-4 text-center border border-white/5">
          <p className="text-xs text-[#6B6B6B] mb-2 uppercase tracking-widest">Amount</p>
          <div className="h-12 flex items-center justify-center">
            {displayAmount ? (
              <span className="text-4xl font-bold tracking-tight" style={{ color: debtColor }}>{displayAmount}</span>
            ) : (
              <span className="text-4xl font-bold text-[#2A2A2A] tracking-tight">{symbol}0</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {NUMPAD_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => handleNumKey(key)}
              className="h-12 bg-[#111111] active:bg-[#1E1E1E] rounded-xl flex items-center justify-center border border-white/5"
            >
              {key === 'backspace' ? <Delete size={16} className="text-[#A0A0A0]" /> : <span className="text-base font-medium text-white">{key}</span>}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAccountSheet(true)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl p-3.5 flex items-center gap-3 active:bg-[#1A1A1A]"
        >
          <span className="text-lg">{TYPE_ICONS[selectedAccount?.type ?? 'cash'] ?? '💳'}</span>
          <div className="flex-1 text-left">
            <p className="text-xs text-[#6B6B6B]">Account</p>
            <p className="text-sm font-medium text-white">{selectedAccount?.name ?? 'Select account'}</p>
          </div>
          <ChevronDown size={16} className="text-[#6B6B6B]" />
        </button>

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

        <button
          onClick={() => setIsOld(!isOld)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
            isOld ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#111111] border-white/5'
          }`}
        >
          <div className="text-left">
            <p className={`text-sm font-medium ${isOld ? 'text-amber-400' : 'text-white'}`}>Old Debt</p>
            <p className="text-xs text-[#6B6B6B]">Does not affect account balance</p>
          </div>
          <div className={`w-10 h-5.5 rounded-full transition-all relative ${isOld ? 'bg-amber-500' : 'bg-[#333]'}`} style={{ minWidth: 40, height: 22 }}>
            <div className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all" style={{ width: 18, height: 18, top: 2, left: isOld ? 20 : 2, transition: 'left 0.15s ease' }} />
          </div>
        </button>
      </div>

      <div className="px-5 py-4 flex-shrink-0 border-t border-white/5">
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-all ${
            isValid && !saving ? 'bg-amber-500 active:bg-amber-600 text-white' : 'bg-[#111111] text-[#444] border border-white/5 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : 'Record Debt'}
        </button>
      </div>

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

export function DebtModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <DebtInner onCloseClean={onClose} />
    </Modal>
  );
}
