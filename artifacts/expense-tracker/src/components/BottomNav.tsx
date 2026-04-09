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
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-150"
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-150 ${
                  isActive ? 'bg-indigo-500/15' : ''
                }`}>
                  <Icon
                    size={20}
                    className={`transition-colors duration-150 ${
                      isActive ? 'text-indigo-400' : 'text-[#6B6B6B]'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-medium transition-colors duration-150 ${
                  isActive ? 'text-indigo-400' : 'text-[#6B6B6B]'
                }`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
});
