import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTap } from '../hooks/useTap';

const ModalCloseCtx = createContext<() => void>(() => {});
export const useModalClose = () => useContext(ModalCloseCtx);

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ onClose, children, maxWidth = 'max-w-sm' }: ModalProps) {
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closingRef = useRef(false);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    timerRef.current = setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    const prevOverflow = main?.style.overflow ?? '';
    if (main) main.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', handleEsc);

    return () => {
      if (main) main.style.overflow = prevOverflow;
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [requestClose]);

  const backdropTap = useTap(requestClose);

  return createPortal(
    <ModalCloseCtx.Provider value={requestClose}>
      <div
        className={closing ? 'modal-backdrop modal-backdrop--out' : 'modal-backdrop modal-backdrop--in'}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          outline: 'none',
          border: 'none',
        } as React.CSSProperties}
        {...backdropTap}
      >
        <div
          className={closing ? 'modal-card modal-card--out' : 'modal-card modal-card--in'}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: maxWidth === 'max-w-sm' ? '384px' : maxWidth,
            background: '#1C1C1E',
            borderRadius: '24px',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            outline: 'none',
            border: 'none',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onPointerCancel={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ModalCloseCtx.Provider>,
    document.body
  );
}
