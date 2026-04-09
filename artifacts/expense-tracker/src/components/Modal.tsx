import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

  useEffect(() => {
    const body = document.body;
    const main = document.querySelector('main') as HTMLElement | null;

    const scrollY = window.scrollY;

    const prev = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyTop: body.style.top,
      mainOverflow: main?.style.overflow ?? '',
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.top = `-${scrollY}px`;
    if (main) main.style.overflow = 'hidden';

    return () => {
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.width = prev.bodyWidth;
      body.style.top = prev.bodyTop;
      if (main) main.style.overflow = prev.mainOverflow;
      window.scrollTo(0, scrollY);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    timerRef.current = setTimeout(onClose, 180);
  };

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
        onPointerDown={requestClose}
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
        >
          {children}
        </div>
      </div>
    </ModalCloseCtx.Provider>,
    document.body
  );
}
