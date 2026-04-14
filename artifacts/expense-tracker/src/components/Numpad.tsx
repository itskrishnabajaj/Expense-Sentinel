import { useCallback } from 'react';
import { Delete } from 'lucide-react';
import { TapButton } from './TapButton';
import { NUMPAD_KEYS } from '../utils/constants';

export function useNumpadInput(
  setter: React.Dispatch<React.SetStateAction<string>>
) {
  return useCallback((key: string) => {
    setter((prev) => {
      if (key === 'backspace') return prev.slice(0, -1);
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev === '' ? '0.' : prev + '.';
      }
      const next = prev + key;
      const parts = next.split('.');
      if (parts[1] && parts[1].length > 2) return prev;
      if (next.replace('.', '').length > 9) return prev;
      return next;
    });
  }, [setter]);
}

interface NumpadProps {
  onKey: (key: string) => void;
  buttonHeight?: string;
  gap?: string;
  bgColor?: string;
  activeBgColor?: string;
  rounded?: string;
  iconSize?: number;
  textSize?: string;
}

export function Numpad({
  onKey,
  buttonHeight = 'h-12',
  gap = 'gap-1.5',
  bgColor = 'bg-[#111111]',
  activeBgColor = 'active:bg-[#1E1E1E]',
  rounded = 'rounded-xl',
  iconSize = 16,
  textSize = 'text-base',
}: NumpadProps) {
  return (
    <div className={`grid grid-cols-3 ${gap}`}>
      {NUMPAD_KEYS.map((key) => (
        <TapButton
          key={key}
          onTap={() => onKey(key)}
          className={`${buttonHeight} ${bgColor} ${activeBgColor} ${rounded} flex items-center justify-center border border-white/5`}
        >
          {key === 'backspace' ? (
            <Delete size={iconSize} className="text-[#A0A0A0]" />
          ) : (
            <span className={`${textSize} font-medium text-white`}>{key}</span>
          )}
        </TapButton>
      ))}
    </div>
  );
}
