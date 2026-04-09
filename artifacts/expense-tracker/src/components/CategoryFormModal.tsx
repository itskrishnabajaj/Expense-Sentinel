import { X } from 'lucide-react';
import { Modal, useModalClose } from './Modal';
import { TapButton } from './TapButton';

export const CATEGORY_ICONS = [
  '🍽️', '🚗', '🛍️', '🎬', '💊', '⚡', '✈️', '📚',
  '👤', '💰', '🏠', '🎮', '☕', '🐾', '💪', '🎵',
  '🌿', '🎨', '💼', '🧴',
];

export const CATEGORY_COLORS = [
  '#F97316', '#3B82F6', '#EC4899', '#8B5CF6',
  '#10B981', '#F59E0B', '#06B6D4', '#6366F1',
  '#84CC16', '#6B7280', '#EF4444', '#14B8A6',
];

export interface CategoryFormData {
  name: string;
  icon: string;
  color: string;
}

interface CategoryFormModalProps {
  isEditing: boolean;
  form: CategoryFormData;
  nameError: boolean;
  onFormChange: (form: CategoryFormData) => void;
  onSave: () => void;
  onClose: () => void;
}

function CategoryFormInner({
  title,
  saveLabel,
  form,
  nameError,
  onFormChange,
  onSave,
}: {
  title: string;
  saveLabel: string;
  form: CategoryFormData;
  nameError: boolean;
  onFormChange: (form: CategoryFormData) => void;
  onSave: () => void;
}) {
  const close = useModalClose();

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 24px 16px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff', margin: 0 }}>
          {title}
        </h2>
        <TapButton
          onTap={close}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            outline: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <X size={16} color="#6B6B6B" />
        </TapButton>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              color: '#6B6B6B',
              marginBottom: '8px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            placeholder="Category name"
            style={{
              width: '100%',
              background: '#111111',
              border: `1px solid ${nameError ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              color: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box',
              userSelect: 'text',
              touchAction: 'auto',
            }}
          />
          {nameError && (
            <p style={{ fontSize: '12px', color: '#f87171', marginTop: '6px', marginLeft: '4px' }}>
              Name is required
            </p>
          )}
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              color: '#6B6B6B',
              marginBottom: '8px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Icon
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORY_ICONS.map((icon) => (
              <TapButton
                key={icon}
                onTap={() => onFormChange({ ...form, icon })}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  background: form.icon === icon ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  border: form.icon === icon ? '1px solid rgba(99,102,241,0.7)' : '1px solid transparent',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.12s ease, border-color 0.12s ease',
                }}
              >
                {icon}
              </TapButton>
            ))}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              color: '#6B6B6B',
              marginBottom: '8px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Color
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {CATEGORY_COLORS.map((color) => (
              <TapButton
                key={color}
                onTap={() => onFormChange({ ...form, color })}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  backgroundColor: color,
                  border: 'none',
                  outline: form.color === color ? '2px solid rgba(255,255,255,0.6)' : 'none',
                  outlineOffset: '2px',
                  cursor: 'pointer',
                  transition: 'outline 0.1s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '16px 24px 24px',
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <TapButton
          onTap={onSave}
          style={{
            width: '100%',
            padding: '14px',
            background: '#6366F1',
            border: 'none',
            outline: 'none',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          {saveLabel}
        </TapButton>
      </div>
    </>
  );
}

export function CategoryFormModal({
  isEditing,
  form,
  nameError,
  onFormChange,
  onSave,
  onClose,
}: CategoryFormModalProps) {
  const title = isEditing ? 'Edit Category' : 'Add Category';
  const saveLabel = isEditing ? 'Update Category' : 'Add Category';

  return (
    <Modal onClose={onClose}>
      <CategoryFormInner
        title={title}
        saveLabel={saveLabel}
        form={form}
        nameError={nameError}
        onFormChange={onFormChange}
        onSave={onSave}
      />
    </Modal>
  );
}
