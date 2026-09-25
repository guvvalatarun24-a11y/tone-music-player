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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E5E7EB] bg-white/90 px-4 py-2 pb-safe backdrop-blur-xl shadow-[0_-8px_20px_rgba(15,23,42,0.04)]"
    >
      <div className="mx-auto flex max-w-[420px] items-center justify-around gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex min-h-[54px] min-w-[80px] flex-col items-center justify-center rounded-2xl px-2 py-1.5 transition-all duration-200 ${
                isActive
                  ? 'bg-[#ECFDF5] text-[#00C98B] shadow-[0_8px_18px_rgba(0,201,139,0.12)]'
                  : 'text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111111]'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} />
                {tab.count !== null && tab.count > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-[#00C98B]/30 bg-[#ECFDF5] px-1 text-[10px] font-bold text-[#00C98B]">
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
