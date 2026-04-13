import React, { useRef, useCallback } from 'react';
import { useTap, UseTapOptions } from '../hooks/useTap';

interface TapButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onTap: () => void;
  tapOptions?: UseTapOptions;
}

export function TapButton({ onTap, tapOptions, disabled, children, onClick, ...props }: TapButtonProps) {
  const tap = useTap(disabled ? () => {} : onTap, tapOptions);
  const pointerFiredRef = useRef(false);

  const wrappedPointerUp = useCallback(() => {
    pointerFiredRef.current = true;
    tap.onPointerUp();
    requestAnimationFrame(() => { pointerFiredRef.current = false; });
  }, [tap]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) onClick(e);
    if (pointerFiredRef.current || disabled) return;
    onTap();
  }, [onClick, onTap, disabled]);

  return (
    <button
      {...props}
      disabled={disabled}
      {...tap}
      onPointerUp={wrappedPointerUp}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
