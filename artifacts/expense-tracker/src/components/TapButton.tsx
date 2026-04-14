import React, { useRef, useCallback } from 'react';

interface TapButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onTap: () => void;
  tapOptions?: { stopPropagation?: boolean; preventDefault?: boolean };
}

export function TapButton({ onTap, tapOptions, disabled, children, onClick, type = 'button', ...props }: TapButtonProps) {
  const processingRef = useRef(false);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (tapOptions?.stopPropagation) e.stopPropagation();
    if (tapOptions?.preventDefault) e.preventDefault();
    if (disabled || processingRef.current) return;
    processingRef.current = true;
    if (onClick) onClick(e);
    onTap();
    setTimeout(() => { processingRef.current = false; }, 50);
  }, [onTap, onClick, disabled, tapOptions]);

  return (
    <button
      type={type}
      {...props}
      disabled={disabled}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
