import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { Modal, useModalClose } from './Modal';
import { TapButton } from './TapButton';
import { Account } from '../database';
import { formatCurrency } from '../utils/formatters';

const TYPE_ICONS: Record<string, string> = { cash: '💵', bank: '🏦', savings: '💰' };
const TYPE_LABELS: Record<string, string> = { cash: 'Cash', bank: 'Bank', savings: 'Savings' };

interface AccountSheetProps {
  accounts: Account[];
  currentAccountId: string;
  title?: string;
  currency: string;
  onConfirm: (id: string) => void;
  onClose: () => void;
}

function AccountSheetInner({
  accounts,
  currentAccountId,
  title = 'Select Account',
  currency,
  onConfirm,
}: Omit<AccountSheetProps, 'onClose'>) {
  const [pending, setPending] = useState(currentAccountId || (accounts[0]?.id ?? ''));
  const close = useModalClose();

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <TapButton
          onTap={close}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5"
        >
          <X size={16} className="text-[#6B6B6B]" />
        </TapButton>
      </div>

      <div className="overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
        {accounts.map((acc) => {
          const selected = pending === acc.id;
          return (
            <TapButton
              key={acc.id}
              onTap={() => setPending(acc.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-colors active:bg-white/5 border-b border-white/5 last:border-0 ${selected ? 'bg-indigo-500/10' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {TYPE_ICONS[acc.type] ?? '💳'}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-medium truncate ${selected ? 'text-indigo-400' : 'text-white'}`}>{acc.name}</p>
                <p className="text-xs text-[#6B6B6B]">{TYPE_LABELS[acc.type] ?? acc.type}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-[#A0A0A0]">{formatCurrency(acc.balance, currency)}</span>
                {selected && <Check size={16} className="text-indigo-400" />}
              </div>
            </TapButton>
          );
        })}
      </div>

      <div className="px-6 py-5 flex-shrink-0 border-t border-white/5">
        <TapButton
          onTap={() => onConfirm(pending)}
          disabled={!pending}
          className="w-full py-3.5 bg-indigo-500 active:bg-indigo-600 text-white text-sm font-semibold rounded-2xl disabled:opacity-40"
        >
          Confirm
        </TapButton>
      </div>
    </>
  );
}

export function AccountSheet({ accounts, currentAccountId, title, currency, onConfirm, onClose }: AccountSheetProps) {
  return (
    <Modal onClose={onClose}>
      <AccountSheetInner
        accounts={accounts}
        currentAccountId={currentAccountId}
        title={title}
        currency={currency}
        onConfirm={onConfirm}
      />
    </Modal>
  );
}
