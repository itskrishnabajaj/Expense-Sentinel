import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Undo2 } from 'lucide-react';

interface UndoItem {
  id: string;
  label: string;
  execute: () => Promise<void>;
  expiresAt: number;
}

interface UndoContextValue {
  pushUndo: (label: string, execute: () => Promise<void>) => void;
}

const UndoCtx = createContext<UndoContextValue>({ pushUndo: () => {} });
export const useUndo = () => useContext(UndoCtx);

const UNDO_TTL = 5000;
const MAX_STACK = 5;

export function UndoProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<UndoItem[]>([]);
  const [undoing, setUndoing] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoingRef = useRef(false);

  const clearExpired = useCallback(() => {
    const now = Date.now();
    setStack((prev) => prev.filter((item) => item.expiresAt > now));
  }, []);

  useEffect(() => {
    if (stack.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const earliest = Math.min(...stack.map((s) => s.expiresAt));
    const delay = Math.max(0, earliest - Date.now());
    timerRef.current = setTimeout(clearExpired, delay + 50);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stack, clearExpired]);

  const pushUndo = useCallback((label: string, execute: () => Promise<void>) => {
    const item: UndoItem = {
      id: crypto.randomUUID(),
      label,
      execute,
      expiresAt: Date.now() + UNDO_TTL,
    };
    setStack((prev) => [item, ...prev].slice(0, MAX_STACK));
  }, []);

  const handleUndo = useCallback(async (item: UndoItem) => {
    if (undoingRef.current) return;
    undoingRef.current = true;
    setUndoing(item.id);
    try {
      await item.execute();
    } catch (err) {
      console.error('Undo failed:', err);
    } finally {
      undoingRef.current = false;
      setUndoing(null);
      setStack((prev) => prev.filter((s) => s.id !== item.id));
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setStack((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const current = stack[0];

  return (
    <UndoCtx.Provider value={{ pushUndo }}>
      {children}
      {current && createPortal(
        <div
          key={current.id}
          style={{
            position: 'fixed',
            bottom: 88,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#2A2A2E',
            borderRadius: 14,
            padding: '10px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: 'calc(100vw - 48px)',
            animation: 'undo-slide-up 0.25s ease-out',
          }}
        >
          <span style={{ color: '#A0A0A0', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
            {current.label}
          </span>
          <button
            onClick={() => handleUndo(current)}
            disabled={undoing === current.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(99,102,241,0.15)',
              color: '#818CF8',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: undoing === current.id ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            <Undo2 size={14} />
            {undoing === current.id ? 'Undoing…' : 'Undo'}
          </button>
          <button
            onClick={() => dismiss(current.id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6B6B6B',
              fontSize: 16,
              cursor: 'pointer',
              padding: '0 2px',
              lineHeight: 1,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>,
        document.body
      )}
    </UndoCtx.Provider>
  );
}
