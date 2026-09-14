import React from 'react';
import { Home, Library, Settings } from 'lucide-react';
import { ActiveTab } from '../types/music';

interface BottomNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  songCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  songCount,
}) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home, count: null },
    { id: 'library' as ActiveTab, label: 'Library', icon: Library, count: songCount },
    { id: 'settings' as ActiveTab, label: 'Settings', icon: Settings, count: null },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/80 px-4 py-2 pb-safe shadow-sm dark:shadow-none transition-colors duration-200"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-3 py-1 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                />
                {tab.count !== null && tab.count > 0 && (
                  <span className="absolute -top-1 -right-2.5 min-w-[16px] h-4 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold px-1 flex items-center justify-center">
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
