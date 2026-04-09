interface CategoryIconProps {
  icon: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-7 h-7 text-sm',
  md: 'w-9 h-9 text-base',
  lg: 'w-12 h-12 text-xl',
};

export function CategoryIcon({ icon, color, size = 'md' }: CategoryIconProps) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ backgroundColor: `${color}20` }}
    >
      <span>{icon}</span>
    </div>
  );
}
