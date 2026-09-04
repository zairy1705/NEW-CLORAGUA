import React from 'react';

export type MainTab = 'inicio' | 'dosis' | 'hud' | 'sistemas' | 'registro';

interface BottomNavigationProps {
  currentTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'inicio' as MainTab,
      label: 'INICIO',
      icon: 'home',
    },
    {
      id: 'dosis' as MainTab,
      label: 'DOSIS',
      icon: 'science',
      badge: '7 PASOS',
    },
    {
      id: 'hud' as MainTab,
      label: 'HUD',
      icon: 'grid_view',
    },
    {
      id: 'sistemas' as MainTab,
      label: 'SISTEMAS',
      icon: 'water',
    },
    {
      id: 'registro' as MainTab,
      label: 'BITÁCORA',
      icon: 'description',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe pointer-events-none px-4 mb-2">
      <nav className="pointer-events-auto mx-auto max-w-md bg-white/90 backdrop-blur-xl rounded-full shadow-[0_12px_32px_-6px_rgba(0,103,125,0.25)] border border-white/80 p-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative min-w-[56px] min-h-[44px] px-3.5 py-1.5 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all ${
                isActive
                  ? 'bg-[#00b4d8] text-white shadow-[0_0_16px_1px_rgba(0,180,216,0.4)] scale-105'
                  : 'text-[#3d494d] hover:text-[#00677d] hover:bg-[#edf5fc]/80 active:scale-95'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {tab.icon}
              </span>
              <span className="font-hud text-[10px] tracking-tight uppercase font-bold">
                {tab.label}
              </span>
              {tab.badge && !isActive && (
                <span className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-[#10e7b2] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
