import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Clock, Settings } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home', end: true },
  { path: '/insights', icon: BarChart2, label: 'Insights', end: false },
  { path: '/history', icon: Clock, label: 'History', end: false },
  { path: '/settings', icon: Settings, label: 'Settings', end: false },
];

export const BottomNav = memo(function BottomNav() {
  return (
    <nav className="flex-shrink-0 bg-[#111111] border-t border-white/5 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl"
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-indigo-500/15' : ''
                  }`}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={isActive ? 'text-indigo-400' : 'text-[#6B6B6B]'}
                    style={{
                      transform: isActive ? 'scale(1.12)' : 'scale(1)',
                      transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), color 0.15s ease',
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] transition-colors duration-150 ${
                    isActive ? 'text-indigo-400 font-semibold' : 'text-[#6B6B6B] font-medium'
                  }`}
                >
                  {label}
                </span>
                <div
                  style={{
                    height: 3,
                    width: isActive ? 20 : 0,
                    borderRadius: 2,
                    background: '#818CF8',
                    transition: 'width 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                    marginTop: 2,
                    boxShadow: isActive ? '0 0 6px rgba(129,140,248,0.7)' : 'none',
                  }}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
});
