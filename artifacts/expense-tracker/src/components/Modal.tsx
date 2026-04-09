import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ onClose, children, maxWidth = 'max-w-sm' }: ModalProps) {
  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    if (main) main.style.overflow = 'hidden';
    return () => { if (main) main.style.overflow = ''; };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-5 animate-modal-bg"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as React.CSSProperties}
    >
      <div className="absolute inset-0" onPointerDown={onClose} />
      <div
        className={`relative w-full ${maxWidth} bg-[#1C1C1E] rounded-[24px] shadow-2xl animate-modal-in`}
        style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
