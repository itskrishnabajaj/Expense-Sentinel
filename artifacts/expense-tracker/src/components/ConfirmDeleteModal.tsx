import { AlertTriangle } from 'lucide-react';
import { Modal, useModalClose } from './Modal';

interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  warning?: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDeleteContent({
  title,
  description,
  warning,
  confirmLabel = 'Delete',
  confirmingLabel = 'Deleting…',
  confirming = false,
  onConfirm,
}: Omit<ConfirmDeleteModalProps, 'onCancel'>) {
  const close = useModalClose();

  return (
    <>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)' }}>
            <AlertTriangle size={18} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-[#6B6B6B]">{description}</p>
          </div>
        </div>
        {warning && (
          <p className="text-xs text-[#A0A0A0] leading-relaxed">{warning}</p>
        )}
      </div>
      <div className="flex border-t border-white/5">
        <button
          onClick={close}
          className="flex-1 py-3.5 text-sm font-medium text-[#A0A0A0] active:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <div className="w-px bg-white/5" />
        <button
          onClick={onConfirm}
          disabled={confirming}
          className="flex-1 py-3.5 text-sm font-semibold text-red-400 active:bg-red-500/10 transition-colors disabled:opacity-40"
        >
          {confirming ? confirmingLabel : confirmLabel}
        </button>
      </div>
    </>
  );
}

export function ConfirmDeleteModal({
  onCancel,
  ...contentProps
}: ConfirmDeleteModalProps) {
  return (
    <Modal onClose={onCancel}>
      <ConfirmDeleteContent {...contentProps} />
    </Modal>
  );
}
