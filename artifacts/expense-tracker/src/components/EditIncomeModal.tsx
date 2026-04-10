import { useState, useCallback } from 'react';
import { X, ChevronDown, Delete, Check } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { AccountSheet } from './AccountSheet';
import { TapButton } from './TapButton';
import { useApp } from '../context/AppContext';
import { Transaction } from '../database';
import { getTodayString, formatAmountRaw, getCurrencySymbol } from '../utils/formatters';

const NUMPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];
const TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };

function EditIncomeInner({
  tx,
  onCloseClean,
}: {
  tx: Transaction;
  onCloseClean: () => void;
}) {
  const { accounts, settings, updateAccount, updateTransaction } = useApp();
  const close = useModalClose();
  const symbol = getCurrencySymbol(settings.currency);

  const [amount, setAmount] = useState(String(tx.amount));
  const [accountId, setAccountId] = useState(tx.accountId ?? accounts[0]?.id ?? '');
  const [note, setNote] = useState(tx.note ?? '');
  const [date, setDate] = useState(tx.date);
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
    const newAmount = parseFloat(amount);
    if (!newAmount || newAmount <= 0 || !accountId) return;
    setSaving(true);
    try {
      const oldAmount = tx.amount;
      const oldAccountId = tx.accountId;

      const adjustments = new Map<string, number>();
      const adjust = (id: string | undefined, delta: number) => {
        if (!id) return;
        adjustments.set(id, (adjustments.get(id) ?? 0) + delta);
      };

      adjust(oldAccountId, -oldAmount);
      adjust(accountId, newAmount);

      for (const [id, delta] of adjustments) {
        if (delta !== 0) {
          const acc = accounts.find((a) => a.id === id);
          if (acc) await updateAccount(id, { balance: acc.balance + delta });
        }
      }

      await updateTransaction(tx.id, {
        amount: newAmount,
        accountId,
        note: note.trim(),
        date,
      });

      setSuccess(true);
      setTimeout(() => onCloseClean(), 600);
    } finally {
      setSaving(false);
    }
  }, [amount, accountId, note, date, tx, accounts, updateAccount, updateTransaction, onCloseClean]);

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(16,185,129,0.15)' }}>
          <Check size={28} color="#34D399" />
        </div>
        <p className="text-base font-semibold text-white">Income Updated!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Edit Income</h2>
        <TapButton onTap={close} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
          <X size={16} className="text-[#6B6B6B]" />
        </TapButton>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3" style={{ overscrollBehavior: 'contain' }}>
        <div className="bg-[#111111] rounded-2xl p-4 text-center border border-white/5">
          <p className="text-xs text-[#6B6B6B] mb-2 uppercase tracking-widest">Amount</p>
          <div className="h-12 flex items-center justify-center">
            {displayAmount ? (
              <span className="text-4xl font-bold text-emerald-400 tracking-tight">{displayAmount}</span>
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
            placeholder="Source of income"
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
              ? 'bg-emerald-500 active:bg-emerald-600 text-white'
              : 'bg-[#111111] text-[#444] border border-white/5 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : 'Update Income'}
        </TapButton>
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

export function EditIncomeModal({
  tx,
  onClose,
}: {
  tx: Transaction;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <EditIncomeInner tx={tx} onCloseClean={onClose} />
    </Modal>
  );
}
