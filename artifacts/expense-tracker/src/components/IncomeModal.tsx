import { useState, useCallback, useRef } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { AccountSheet } from './AccountSheet';
import { TapButton } from './TapButton';
import { Numpad, useNumpadInput } from './Numpad';
import { useApp } from '../context/AppContext';
import { getTodayString, formatAmountRaw, getCurrencySymbol } from '../utils/formatters';
import { ACCOUNT_TYPE_ICONS } from '../utils/constants';

function IncomeInner({ onCloseClean }: { onCloseClean: () => void }) {
  const { accounts, settings, updateAccount, addTransaction } = useApp();
  const close = useModalClose();
  const symbol = getCurrencySymbol(settings.currency);

  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const savingRef = useRef(false);

  const selectedAccount = accounts.find((a) => a.id === accountId) ?? accounts[0];
  const displayAmount = formatAmountRaw(amount, symbol);
  const isValid = parseFloat(amount) > 0 && !!accountId;

  const handleNumKey = useNumpadInput(setAmount);

  const handleSave = useCallback(async () => {
    if (savingRef.current) return;
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !accountId) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const acc = accounts.find((a) => a.id === accountId);
      if (acc) await updateAccount(accountId, { balance: acc.balance + parsed });
      await addTransaction({
        type: 'income',
        amount: parsed,
        accountId,
        note: note.trim(),
        date,
      });
      setSuccess(true);
      setTimeout(() => { onCloseClean(); }, 600);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [amount, accountId, note, date, accounts, updateAccount, addTransaction, onCloseClean]);

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={28} color="#34D399" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', margin: 0 }}>Income Added!</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">Add Income</h2>
        <TapButton onTap={close} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5">
          <X size={16} className="text-[#6B6B6B]" />
        </TapButton>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
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

        <Numpad onKey={handleNumKey} />

        <TapButton
          onTap={() => setShowAccountSheet(true)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl p-3.5 flex items-center gap-3 active:bg-[#1A1A1A]"
        >
          <span className="text-lg">{ACCOUNT_TYPE_ICONS[selectedAccount?.type ?? 'cash'] ?? '💳'}</span>
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
            isValid && !saving ? 'bg-emerald-500 active:bg-emerald-600 text-white' : 'bg-[#111111] text-[#444] border border-white/5 cursor-not-allowed'
          }`}
        >
          {saving ? 'Saving…' : 'Add Income'}
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

export function IncomeModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <IncomeInner onCloseClean={onClose} />
    </Modal>
  );
}
