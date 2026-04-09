import React from 'react';
import { useTap, UseTapOptions } from '../hooks/useTap';

interface TapButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onTap: () => void;
  tapOptions?: UseTapOptions;
}

export function TapButton({ onTap, tapOptions, disabled, children, ...props }: TapButtonProps) {
  const tap = useTap(disabled ? () => {} : onTap, tapOptions);
  return (
    <button {...props} disabled={disabled} {...tap}>
      {children}
    </button>
  );
}
