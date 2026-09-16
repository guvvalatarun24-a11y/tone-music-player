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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/85 px-4 py-2 pb-safe backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-md items-center justify-around gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex min-h-[52px] min-w-[72px] flex-col items-center justify-center rounded-2xl px-2 py-1.5 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-b from-emerald-500/20 to-transparent text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.18)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                {tab.count !== null && tab.count > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-500/20 px-1 text-[10px] font-bold text-emerald-200">
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </div>
              <span className="mt-1 text-[11px] font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
