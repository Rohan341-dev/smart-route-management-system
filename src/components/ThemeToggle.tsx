import { useState, useRef, useEffect } from 'react';
import { useStore, Theme } from '../store/useStore';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

const themes: { value: Theme; label: string; icon: typeof Sun; desc: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, desc: 'Clean, bright interface' },
  { value: 'dark', label: 'Dark', icon: Moon, desc: 'Premium dark appearance' },
  { value: 'system', label: 'System', icon: Monitor, desc: 'Match device preference' },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = themes.find(t => t.value === theme) || themes[2];
  const Icon = current.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl dark:bg-navy-700/50 bg-surface-100 dark:hover:bg-navy-600/50 hover:bg-surface-200 transition-all duration-200"
      >
        <Icon className="w-4 h-4 dark:text-gray-300 text-surface-600" />
        <span className="hidden lg:inline text-xs font-medium dark:text-gray-300 text-surface-600">
          {current.label}
        </span>
        <ChevronDown className={`w-3 h-3 dark:text-gray-400 text-surface-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 dark:bg-navy-800 bg-white border dark:border-white/10 border-surface-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2">
            {themes.map((t) => {
              const ThemeIcon = t.icon;
              const isActive = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => { setTheme(t.value); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'dark:bg-electric-600/20 bg-electric-50 dark:text-electric-400 text-electric-600'
                      : 'dark:text-gray-300 text-surface-700 dark:hover:bg-white/5 hover:bg-surface-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive
                      ? 'dark:bg-electric-600/30 bg-electric-100'
                      : 'dark:bg-navy-700 bg-surface-100'
                  }`}>
                    <ThemeIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{t.label}</p>
                    <p className="text-[10px] dark:text-gray-400 text-surface-400">{t.desc}</p>
                  </div>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-electric-500"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
