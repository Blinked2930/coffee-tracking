import { useState, useEffect } from 'react';
import { Share, PlusSquare, MoreVertical, Smartphone, Apple, X } from 'lucide-react';
import clsx from 'clsx';

export default function InstallPrompt({ onBypass }: { onBypass: () => void }) {
  const [device, setDevice] = useState<'none' | 'ios' | 'android'>('none');
  const [isStandalone, setIsStandalone] = useState(true); // Default to true so it doesn't flash before checking

  useEffect(() => {
    // Check if running as a PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone || 
                  document.referrer.includes('android-app://');
    
    // Check if they already bypassed it this session
    const hasBypassed = sessionStorage.getItem('bypassed_install') === 'true';

    setIsStandalone(isPWA || hasBypassed);
  }, []);

  const handleBypass = () => {
    sessionStorage.setItem('bypassed_install', 'true');
    setIsStandalone(true);
    onBypass();
  };

  if (isStandalone) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 z-[9999] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-gray-800 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-gray-700">
        <Smartphone size={32} className="text-amber-500" />
      </div>
      
      <h1 className="text-3xl font-black text-white mb-3 tracking-tight">Install Protocol</h1>
      <p className="text-gray-400 text-center text-sm font-medium leading-relaxed max-w-xs mb-10">
        To ensure maximum telemetry reliability and native performance, this tool must be installed directly to your device.
      </p>

      {device === 'none' ? (
        <div className="w-full max-w-xs space-y-4">
          <button 
            onClick={() => setDevice('ios')}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-2xl p-4 flex items-center justify-center gap-3 font-bold active:scale-95 transition-all"
          >
            <Apple size={20} /> I have an iPhone
          </button>
          <button 
            onClick={() => setDevice('android')}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-2xl p-4 flex items-center justify-center gap-3 font-bold active:scale-95 transition-all"
          >
            <Smartphone size={20} /> I have an Android
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-3xl p-6 relative animate-in slide-in-from-bottom-4 duration-300">
          <button 
            onClick={() => setDevice('none')}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 active:scale-95"
          >
            <X size={16} />
          </button>
          
          <h2 className="text-xl font-bold text-white mb-2">
            {device === 'ios' ? 'iOS Installation' : 'Android Installation'}
          </h2>
          
          {device === 'ios' ? (
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-6">Must be in Safari Browser</p>
          ) : (
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6">Must be in Chrome Browser</p>
          )}

          <div className="space-y-6 text-gray-300 text-sm font-medium mb-8">
            {device === 'ios' ? (
              <>
                <div className="flex items-start gap-4">
                  <Share size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p>Tap the <strong className="text-white">Share</strong> icon at the bottom of the Safari menu.</p>
                </div>
                <div className="flex items-start gap-4">
                  <PlusSquare size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <MoreVertical size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p>Tap the <strong className="text-white">3-dot menu</strong> in the top right corner of Chrome.</p>
                </div>
                <div className="flex items-start gap-4">
                  <PlusSquare size={20} className="text-amber-500 shrink-0 mt-0.5" />
                  <p>Tap <strong className="text-white">Add to Home screen</strong> or <strong className="text-white">Install app</strong>.</p>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => setDevice('none')}
            className="w-full py-3 bg-gray-700 text-white rounded-xl font-bold active:scale-95 transition-all"
          >
            Back
          </button>
        </div>
      )}

      <button 
        onClick={handleBypass}
        className="mt-8 text-xs font-bold text-gray-500 underline underline-offset-4 hover:text-gray-400 transition-colors"
      >
        Continue in browser (Not Recommended)
      </button>
    </div>
  );
}