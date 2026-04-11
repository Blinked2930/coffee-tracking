import React from 'react';
import { Home as HomeIcon, List, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  user: User;
  activeTab: 'home' | 'feed' | 'leaderboard' | 'profile' | string;
  onTabChange: (tab: any) => void;
  children: React.ReactNode;
}

export default function Layout({ user, activeTab, onTabChange, children }: LayoutProps) {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-28 pt-4">
        {children}
      </main>

      {/* Bottom Navigation - Increased bottom padding to 20px to lift it higher off the bottom edge */}
      <nav 
        className="fixed bottom-0 w-full bg-white border-t border-gray-100 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
      >
        <div className="flex justify-around items-center px-2 pt-3 pb-1 max-w-md mx-auto">
          <NavButton 
            icon={<HomeIcon size={24} />} 
            label={t('home')} 
            isActive={activeTab === 'home'} 
            onClick={() => onTabChange('home')} 
          />
          <NavButton 
            icon={<List size={24} />} 
            label={t('feed')} 
            isActive={activeTab === 'feed'} 
            onClick={() => onTabChange('feed')} 
          />
          <NavButton 
            icon={<Trophy size={24} />} 
            label={t('rankings')} 
            isActive={activeTab === 'leaderboard'} 
            onClick={() => onTabChange('leaderboard')} 
          />
          
          {/* Profile Button (Avatar) */}
          <button
            onClick={() => onTabChange('profile')}
            className={clsx(
              "flex flex-col items-center gap-1 transition-all",
              activeTab === 'profile' ? "scale-105" : "opacity-80 hover:opacity-100"
            )}
          >
            <div className={clsx(
              "w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-sm transition-all mb-0.5",
              activeTab === 'profile' 
                ? "bg-amber-500 text-white shadow-md ring-4 ring-amber-50" 
                : "bg-gray-100 text-gray-600 border border-gray-200"
            )}>
              {user.name.charAt(0)}
            </div>
            <span className={clsx(
              "text-[10px] font-medium tracking-wide", 
              activeTab === 'profile' ? "font-bold text-amber-600" : "text-gray-400"
            )}>
              {user.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-1 transition-all w-16",
        isActive ? "text-amber-500 scale-105" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <div className={clsx("p-1.5 rounded-xl transition-colors", isActive && "bg-amber-50 text-amber-500")}>
        {icon}
      </div>
      <span className={clsx("text-[10px] font-medium tracking-wide", isActive && "font-bold")}>{label}</span>
    </button>
  );
}