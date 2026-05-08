import { useState, useEffect } from 'react';
import { Trophy, X, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function LeaderboardAnnouncement() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(1);
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
      // Look for any full-screen overlays currently active (ignoring our own tour overlay)
      const blockingOverlays = Array.from(document.querySelectorAll('.fixed.inset-0')).some(
        el => el.id !== 'tour-overlay' && window.getComputedStyle(el).display !== 'none'
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

  // Listen for clicks during Step 2 to advance to Step 3
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const tooltip = document.getElementById('tour-step-2-tooltip');
      
      // If they click anywhere outside our tooltip (i.e., clicking the actual Rankings tab)
      if (tooltip && !tooltip.contains(e.target as Node)) {
        // Wait 400ms to allow the app to actually render the Leaderboard screen, then point to the top tab
        setTimeout(() => setStep(3), 400); 
      }
    };

    if (isVisible && step === 2) {
      // 100ms delay before adding listener so the initial 'Show Me' click doesn't accidentally trigger it
      const timer = setTimeout(() => {
        document.addEventListener('click', handleGlobalClick);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleGlobalClick);
      };
    }
  }, [isVisible, step]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Mark as seen so it never shows again for this device
    localStorage.setItem('kafe_lb_announce_seen', 'true');
  };

  if (!isVisible) return null;

  return (
    <div id="tour-overlay" className="fixed inset-0 z-[9999] flex flex-col items-center pointer-events-none">
      
      {/* STEP 1: Welcome Intro */}
      {step === 1 && (
        <>
          {/* Solid blur that blocks clicks for the initial popup */}
          <div 
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[3px] pointer-events-auto transition-opacity duration-300" 
            onClick={handleDismiss} 
          />
          <div className="relative m-auto bg-white dark:bg-[#1c1c1c] rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden mx-4 pointer-events-auto">
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
                ? 'Sapo shtuam listën e kampionëve për "30 Ditët e Fundit"! Doni një tur të shkurtër për ta gjetur?' 
                : "We just dropped a brand new 'Last 30 Days' leaderboard! Want a quick tour on where to find it?"}
            </p>

            <div className="flex gap-3">
              <button 
                onClick={handleDismiss}
                className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-xl font-bold uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all"
              >
                {lang === 'sq' ? 'Kalo' : 'Skip'}
              </button>
              <button 
                onClick={() => setStep(2)}
                className="flex-[2] py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-amber-200 shadow-sm"
              >
                {lang === 'sq' ? 'Më Trego' : 'Show Me'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* STEP 2: Pointing down to the Trophy Navigation Icon */}
      {step === 2 && (
        <>
          {/* Light blur that ALLOWS clicks through to the actual app */}
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] pointer-events-none" />
          
          {/* NOTE: Adjust the left-[50%] below to move the tooltip further left or right to align with your tab */}
          <div id="tour-step-2-tooltip" className="absolute bottom-24 left-[50%] -translate-x-1/2 w-64 bg-white dark:bg-[#1c1c1c] rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 border-2 border-amber-400 pointer-events-auto">
            {/* Arrow pointing down */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-[#1c1c1c] border-b-2 border-r-2 border-amber-400 transform rotate-45" />
            
            <h3 className="font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              {lang === 'sq' ? 'Hapi 1: Arena' : 'Step 1: The Arena'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-4">
              {lang === 'sq' 
                ? 'Shtypni ikonën e trofeut këtu poshtë për të hyrë tek Renditjet.' 
                : 'Tap the Trophy icon down here in your menu to enter the Rankings tab.'}
            </p>
          </div>
        </>
      )}

      {/* STEP 3: Pointing up to the Top Tab Selector */}
      {step === 3 && (
        <>
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px] pointer-events-none" />

          <div className="absolute top-[8.5rem] left-1/2 -translate-x-1/2 w-72 max-w-[90vw] bg-white dark:bg-[#1c1c1c] rounded-3xl p-5 shadow-2xl animate-in slide-in-from-top-8 duration-300 border-2 border-amber-400 pointer-events-auto">
            {/* Arrow pointing up */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-[#1c1c1c] border-t-2 border-l-2 border-amber-400 transform rotate-45" />
            
            <h3 className="font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <span className="text-lg leading-none">🔥</span>
              {lang === 'sq' ? 'Hapi 2: Lavdia Mujore' : 'Step 2: Monthly Glory'}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-4">
              {lang === 'sq' 
                ? 'Pasi të jeni aty, zgjidhni treguesin "30 Ditët e Fundit" sipër për të parë kampionët e këtij muaji!' 
                : "Now that you're here, just tap 'The Last 30 Days' at the top to see who is dominating this month!"}
            </p>
            <button 
              onClick={handleDismiss}
              className="w-full py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all border border-amber-200 shadow-sm"
            >
              {lang === 'sq' ? 'Super, Puna Mbarë! 🚀' : "Awesome, Let's Brew! 🚀"}
            </button>
          </div>
        </>
      )}

    </div>
  );
}