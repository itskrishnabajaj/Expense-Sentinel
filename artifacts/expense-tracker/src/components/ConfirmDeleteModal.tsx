import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

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

export function ConfirmDeleteModal({
  title,
  description,
  warning,
  confirmLabel = 'Delete',
  confirmingLabel = 'Deleting…',
  confirming = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    const prevOverflow = main?.style.overflow ?? '';
    if (main) main.style.overflow = 'hidden';
    return () => { if (main) main.style.overflow = prevOverflow; };
  }, []);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        outline: 'none',
        border: 'none',
      } as React.CSSProperties}
      onClick={onCancel}
    >
      <div
        className="modal-card modal-card--in"
        style={{
          width: '100%',
          maxWidth: '384px',
          background: '#1C1C1E',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          outline: 'none',
          border: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
        onPointerCancel={(e) => e.stopPropagation()}
      >
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
            onClick={onCancel}
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
      </div>
    </div>,
    document.body
  );
}
