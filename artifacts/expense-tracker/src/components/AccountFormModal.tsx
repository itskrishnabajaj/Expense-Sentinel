import { X } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { TapButton } from './TapButton';
import { AccountType } from '../database';

export interface AccountFormData {
  name: string;
  type: AccountType;
}

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: string }[] = [
  { type: 'cash', label: 'Cash', icon: '💵' },
  { type: 'bank', label: 'Bank', icon: '🏦' },
  { type: 'savings', label: 'Savings', icon: '💰' },
];

interface AccountFormModalProps {
  isEditing: boolean;
  form: AccountFormData;
  nameError: boolean;
  dupError: boolean;
  onFormChange: (form: AccountFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

function AccountFormInner({
  isEditing,
  form,
  nameError,
  dupError,
  onFormChange,
  onSave,
}: Omit<AccountFormModalProps, 'onClose'>) {
  const close = useModalClose();
  const title = isEditing ? 'Edit Account' : 'Add Account';
  const saveLabel = isEditing ? 'Update Account' : 'Add Account';
  const hasError = nameError || dupError;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>{title}</h2>
        <TapButton
          onTap={close}
          style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', outline: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <X size={16} color="#6B6B6B" />
        </TapButton>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#6B6B6B', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Account Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            placeholder="e.g. HDFC Savings"
            style={{ width: '100%', background: '#111111', border: `1px solid ${hasError ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', padding: '12px 16px', fontSize: '14px', color: '#ffffff', outline: 'none', boxSizing: 'border-box', userSelect: 'text', touchAction: 'auto' }}
          />
          {nameError && (
            <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px', marginLeft: '4px' }}>Account name is required</p>
          )}
          {dupError && (
            <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px', marginLeft: '4px' }}>An account with this name already exists</p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', color: '#6B6B6B', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Account Type
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {ACCOUNT_TYPES.map(({ type, label, icon }) => {
              const selected = form.type === type;
              return (
                <TapButton
                  key={type}
                  onTap={() => onFormChange({ ...form, type })}
                  style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: '12px', border: selected ? '1px solid rgba(99,102,241,0.7)' : '1px solid rgba(255,255,255,0.08)', background: selected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', outline: 'none', transition: 'all 0.12s ease' }}
                >
                  <span style={{ fontSize: '20px' }}>{icon}</span>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: selected ? '#a5b4fc' : '#9CA3AF' }}>{label}</span>
                </TapButton>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 24px 24px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <TapButton
          onTap={onSave}
          style={{ width: '100%', padding: '14px', background: '#6366F1', border: 'none', outline: 'none', borderRadius: '16px', fontSize: '14px', fontWeight: 600, color: '#ffffff', cursor: 'pointer' }}
        >
          {saveLabel}
        </TapButton>
      </div>
    </>
  );
}

export function AccountFormModal({ isEditing, form, nameError, dupError, onFormChange, onSave, onClose }: AccountFormModalProps) {
  return (
    <Modal onClose={onClose}>
      <AccountFormInner
        isEditing={isEditing}
        form={form}
        nameError={nameError}
        dupError={dupError}
        onFormChange={onFormChange}
        onSave={onSave}
      />
    </Modal>
  );
}
