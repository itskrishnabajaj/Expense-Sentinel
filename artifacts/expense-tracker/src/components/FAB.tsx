import { useState } from 'react';
import { Plus, TrendingUp, ArrowLeftRight, AlertCircle, ShoppingBag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IncomeModal } from './IncomeModal';
import { TransferModal } from './TransferModal';
import { DebtModal } from './DebtModal';

type ModalType = 'income' | 'transfer' | 'debt' | null;

interface ActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  index: number;
  isVisible: boolean;
}

function ActionButton({ label, icon, onClick, index, isVisible }: ActionButtonProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
        opacity: isVisible ? 1 : 0,
        transition: `transform 0.22s cubic-bezier(0.34,1.56,0.64,1) ${index * 40}ms, opacity 0.18s ease ${index * 40}ms`,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <span
        style={{
          background: 'rgba(20,20,20,0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 500,
          color: '#e5e7eb',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <button
        onPointerDown={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(26,26,26,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
          outline: 'none',
        }}
      >
        {icon}
      </button>
    </div>
  );
}

export function FAB() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const hiddenPaths = ['/add', '/settings'];
  if (hiddenPaths.some((p) => location.pathname.startsWith(p))) return null;

  const handleAction = (modal: ModalType | 'expense') => {
    setOpen(false);
    if (modal === 'expense') {
      navigate('/add');
    } else {
      setActiveModal(modal);
    }
  };

  const closeModal = () => setActiveModal(null);

  const actions: { label: string; icon: React.ReactNode; modal: ModalType | 'expense' }[] = [
    { label: 'Expense', icon: <ShoppingBag size={18} color="#F87171" />, modal: 'expense' },
    { label: 'Income', icon: <TrendingUp size={18} color="#34D399" />, modal: 'income' },
    { label: 'Transfer', icon: <ArrowLeftRight size={18} color="#60A5FA" />, modal: 'transfer' },
    { label: 'Debt', icon: <AlertCircle size={18} color="#FBBF24" />, modal: 'debt' },
  ];

  return (
    <>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onPointerDown={() => setOpen(false)}
        />
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 14,
        }}
      >
        {actions.map(({ label, icon, modal }, i) => (
          <ActionButton
            key={label}
            label={label}
            icon={icon}
            onClick={() => handleAction(modal)}
            index={i}
            isVisible={open}
          />
        ))}

        <button
          onPointerDown={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#6366F1',
            border: 'none',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            flexShrink: 0,
          }}
        >
          <Plus
            size={24}
            color="#ffffff"
            style={{
              transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          />
        </button>
      </div>

      {activeModal === 'income' && <IncomeModal onClose={closeModal} />}
      {activeModal === 'transfer' && <TransferModal onClose={closeModal} />}
      {activeModal === 'debt' && <DebtModal onClose={closeModal} />}
    </>
  );
}
