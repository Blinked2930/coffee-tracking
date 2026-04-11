import React from 'react';
import { Home as HomeIcon, List, Trophy, LogOut, Globe } from 'lucide-react';
import clsx from 'clsx';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  user: User;
  activeTab: 'home' | 'feed' | 'leaderboard' | 'profile' | string;
  onTabChange: (tab: any) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function Layout({ user, activeTab, onTabChange, onLogout, children }: LayoutProps) {
  const { t, lang, toggleLang } = useLanguage();
  
  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
      
      {/* Header - NOW HIDDEN ON HOME TAB */}
      {activeTab !== 'home' && (
        <header className="bg-white px-6 py-4 flex items-center justify-between shadow-sm z-10 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-lg shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">{t('welcomeBack')}</p>
              <h2 className="text-font font-bold text-gray-900 leading-tight">{user.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-1 p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
            >
              <span className="text-xs font-bold uppercase">{lang}</span>
              <Globe size={18} />
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              aria-label="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-3 pb-safe flex justify-between items-center z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
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
        
        {/* NEW: Profile Button (Avatar) */}
        <button
          onClick={() => onTabChange('profile')}
          className={clsx(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === 'profile' ? "scale-105" : "opacity-80 hover:opacity-100"
          )}
        >
          <div className={clsx(
            "w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-sm transition-all",
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
      </nav>
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center gap-1 transition-all",
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