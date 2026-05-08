import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LeaderboardAnnouncement() {
  const [isVisible, setIsVisible] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    // Expiration date: May 11, 2026 (3 Days from launch)
    const expirationDate = new Date('2026-05-11T23:59:59');
    const now = new Date();
    
    // Check if they've already seen it
    const hasSeen = localStorage.getItem('kafe_lb_announce_seen') === 'true';

    if (hasSeen || now >= expirationDate) return;

    // Smart Scanner: Wait for the screen to be clear of other popups (Notifications, Install Prompts, etc.)
    const checkReadyInterval = setInterval(() => {
      // Look for any full-screen overlays currently active (ignoring our own overlay)
      const blockingOverlays = Array.from(document.querySelectorAll('.fixed.inset-0')).some(
        el => el.id !== 'announcement-overlay' && window.getComputedStyle(el).display !== 'none'
      );
      
      // Look for common notification modal class/id names just to be safe
      const hasNotificationPrompt = !!document.querySelector('[id*="notification"], [class*="notification"]');

      // Only launch the announcement once the screen is totally clear
      if (!blockingOverlays && !hasNotificationPrompt) {
        clearInterval(checkReadyInterval);
        setTimeout(() => setIsVisible(true), 1000);
      }
    }, 500);

    return () => clearInterval(checkReadyInterval);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Mark as seen so it never shows again for this device
    localStorage.setItem('kafe_lb_announce_seen', 'true');
  };

  if (!isVisible) return null;

  return (
    <div id="announcement-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      
      {/* Background Blur - NO onClick handler here! Forces them to use the buttons */}
      <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[3px]" />
      
      <div className="relative bg-white dark:bg-[#1c1c1c] rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />
        
        <button onClick={handleDismiss} className="absolute top-4 right-4 w-8 h-8 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400 transition-colors">
          <X size={16} />
        </button>

        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-5 rotate-3 border border-amber-200 dark:border-amber-900/50 shadow-sm">
          <span className="text-3xl drop-shadow-sm">☕️</span>
        </div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 leading-tight tracking-tight">
          {lang === 'sq' ? 'Kujdes Filxhanët!' : 'Hold Onto Your Mugs!'}
        </h2>

        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          {lang === 'sq' 
            ? 'Sapo shtuam listën e kampionëve për "30 Ditët e Fundit"! Shkoni te Rankings për të parë kush është mbreti i kafeinës këtë muaj.' 
            : "We just dropped a brand new 'Last 30 Days' leaderboard! Go check the Rankings tab to see who the ultimate caffeine champion of the month is."}
        </p>

        <button 
          onClick={handleDismiss}
          className="w-full py-4 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all border border-amber-200 shadow-sm"
        >
          {lang === 'sq' ? 'Super, Puna Mbarë! 🚀' : "Awesome, Let's Brew! 🚀"}
        </button>
      </div>
    </div>
  );
}