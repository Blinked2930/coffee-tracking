import { useState, useRef, useEffect } from 'react';
import { Coffee, MapPin, Camera, Type } from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import { KafeType, User } from '../types';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { compressImage } from '../lib/imageUtils';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface HomeProps {
  user: User;
  onKafeLogged: () => void;
}

export default function Home({ user, onKafeLogged }: HomeProps) {
  const languageContext = useLanguage();
  const t = languageContext?.t || ((k: string) => k);
  const currentLang = languageContext?.lang || (languageContext as any)?.language || 'en';

  const [selectedType, setSelectedType] = useState<KafeType | null>(null);
  const [isAddingDetails, setIsAddingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'default') {
        const declinedForever = localStorage.getItem('kafe_notifications_declined');
        const dismissedSession = sessionStorage.getItem('kafe_notifications_session');
        if (!declinedForever && !dismissedSession) {
          const timer = setTimeout(() => setShowNotificationPrompt(true), 1500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const handleDismissSession = () => {
    sessionStorage.setItem('kafe_notifications_session', 'true');
    setShowNotificationPrompt(false);
  };

  const handleDeclineForever = () => {
    localStorage.setItem('kafe_notifications_declined', 'true');
    setShowNotificationPrompt(false);
  };

  const kafeOptions: { type: KafeType; icon: string; label: string }[] = [
    { type: 'kafe', icon: '☕️', label: 'Kafe' },
    { type: 'turkish kafe', icon: '🫖', label: t('turkish') || 'Turkish' },
    { type: 'macchiato', icon: '🥛', label: 'Macchiato' },
    { type: 'cappicino', icon: '☁️', label: 'Cappuccino' },
    { type: 'cai', icon: '🍵', label: t('cai') || 'Tea' },
    { type: 'freddo', icon: '🧊', label: t('freddo') || 'Iced' },
    { type: 'canned_coffee', icon: '🥫', label: t('cannedCoffee') || 'Canned Coffee' },
    { type: 'energy_drink', icon: '🔋', label: t('energyDrink') || 'Energy Drink' },
    { type: 'other', icon: '❔', label: t('otherType') },
  ];

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      setShowNotificationPrompt(false);
      if (permission === "granted" && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) return;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        await supabase.from('push_subscriptions').upsert({ 
          user_id: user.id, subscription: JSON.parse(JSON.stringify(subscription)) 
        }, { onConflict: 'user_id' });
      } else if (permission === "denied") {
        localStorage.setItem('kafe_notifications_declined', 'true');
      }
    } catch (error: any) {
      console.error("Push Error:", error.message || error);
    }
  };

  const handleLogKafe = async () => {
    if (!selectedType) return;
    setIsSaving(true);
    let uploadedPhotoUrl = null;
    
    if (photoFile) {
      const compressedFile = await compressImage(photoFile);
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('kafes').upload(fileName, compressedFile);
      if (!uploadError && uploadData) {
        uploadedPhotoUrl = supabase.storage.from('kafes').getPublicUrl(fileName).data.publicUrl;
      }
    }
    
    const { error } = await supabase.from('kafes').insert({
      user_id: user.id, type: selectedType, location: location || null, notes: notes || null, photo_url: uploadedPhotoUrl, rating: rating > 0 ? rating : null
    });
    
    if (error) {
      console.error(error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setShowSuccess(true);
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.45 }, colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'], disableForReducedMotion: true });

    setTimeout(() => {
      setShowSuccess(false); setLocation(''); setNotes(''); setRating(0); setIsAddingDetails(false); setSelectedType(null); setPhotoFile(null); onKafeLogged();
    }, 2500);
  };

  return (
    // BACK IN THE STRAIGHTJACKET: fixed inset-0 completely kills scrolling. pb-[125px] aligns it flawlessly.
    <div className="fixed inset-0 w-full bg-gray-50/30 overflow-hidden flex flex-col pb-[125px]">
      
      {showNotificationPrompt && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 transition-all">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center transform transition-all animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-amber-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
              <span className="text-4xl drop-shadow-sm">🔔</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              {currentLang === 'sq' ? 'Qëndro i Informuar' : 'Stay in the Loop'}
            </h2>
            <p className="text-gray-500 mb-8 text-sm font-medium leading-relaxed">
              {currentLang === 'sq' 
                ? 'Merr njoftime kur dikush rregjistron një kafe.' 
                : 'Get notified instantly when the cohort logs a Kafe.'}
            </p>
            <div className="space-y-3">
              <button onClick={requestNotificationPermission} className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-amber-500/20 text-[11px]">
                {currentLang === 'sq' ? 'Aktivizo Njoftimet' : 'Enable Notifications'}
              </button>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={handleDismissSession} className="w-full py-3.5 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-colors active:scale-95">
                  {currentLang === 'sq' ? 'Ndoshta Më Vonë' : 'Maybe Later'}
                </button>
                <button onClick={handleDeclineForever} className="w-full py-3.5 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-colors active:scale-95">
                  {currentLang === 'sq' ? 'Jo Faleminderit' : 'No Thanks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THE PERFECT CENTER */}
      <div className="flex-1 w-full max-w-sm mx-auto flex flex-col items-center justify-center px-5">
        
        {/* Main Cutesy Button */}
        <div className="flex justify-center w-full mb-5 sm:mb-6 shrink-0">
          <button
            onClick={handleLogKafe}
            disabled={isSaving || showSuccess || !selectedType}
            className={clsx(
              "relative w-44 h-44 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 disabled:opacity-100 shrink-0",
              !selectedType && !showSuccess
                ? "bg-white border-[3px] border-dashed border-gray-200 text-gray-400 scale-95 shadow-sm"
                : showSuccess 
                  ? "bg-gradient-to-tr from-green-400 to-emerald-400 shadow-[0_15px_40px_rgba(52,211,153,0.4)] scale-105 border-0"
                  : "bg-gradient-to-tr from-amber-400 to-amber-300 shadow-[0_15px_40px_rgba(251,191,36,0.35)] hover:shadow-[0_20px_50px_rgba(251,191,36,0.4)] active:scale-95 border-0"
            )}
          >
            {(!isSaving && !showSuccess && selectedType) && (
              <div className="absolute inset-0 rounded-full border-[3px] border-white/40 border-dashed animate-[spin_30s_linear_infinite]" />
            )}

            {(!isSaving && !showSuccess && !selectedType) && (
              <>
                <Coffee size={40} className="text-gray-300 mb-1" />
                <span className="text-gray-400 text-xl font-black tracking-tight leading-none mt-2">
                  {currentLang === 'sq' ? 'Zgjidh Pijen' : 'Select Drink'}
                </span>
              </>
            )}

            {isSaving && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                <Coffee size={40} className="text-white mb-1 drop-shadow-md animate-pulse" />
                <span className="text-white text-xl font-black tracking-wider drop-shadow-md">{t('loggingIn')}</span>
              </>
            )}

            {showSuccess && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/40 border-dashed animate-[spin_10s_linear_infinite]" />
                <span className="text-5xl mb-1 drop-shadow-md animate-bounce">🎉</span>
                <span className="text-white text-2xl font-black tracking-wider drop-shadow-md mt-1">{t('done')}</span>
              </>
            )}

            {(!isSaving && !showSuccess && selectedType) && (
              <>
                <Coffee size={40} className="text-white mb-1 drop-shadow-md" />
                <span className="text-white text-4xl font-black tracking-tight drop-shadow-md leading-none">+1 Kafe</span>
                <span className="text-amber-700/80 font-black uppercase tracking-[0.2em] text-[10px] mt-2">
                  {currentLang === 'sq' ? 'Shtyp Për Të Rregjistruar' : t('tapToLog')}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Squircle Grid */}
        <div className="w-full mb-5 sm:mb-6 shrink-0">
          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {kafeOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={clsx(
                  "rounded-[1.25rem] aspect-square flex flex-col items-center justify-center p-1.5 transition-all overflow-hidden",
                  selectedType === option.type
                    ? "bg-white border-2 border-amber-400 scale-105 shadow-md shadow-amber-500/10"
                    : "bg-white border-2 border-transparent text-gray-500 hover:bg-gray-50 shadow-sm"
                )}
              >
                <span className="text-[28px] leading-none mb-1 transition-transform group-active:scale-95">{option.icon}</span>
                <span className={clsx("text-[9px] leading-tight text-center px-0.5 font-bold line-clamp-2", selectedType === option.type ? "text-amber-600" : "text-gray-400")}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Compact Bottom Controls */}
        <div className="w-full flex flex-col items-center gap-4 shrink-0">
          <div className="w-full flex justify-between px-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <button
                key={num}
                onClick={() => setRating(num === rating ? 0 : num)}
                className={clsx(
                  "text-[20px] transition-all active:scale-75",
                  rating >= num ? "opacity-100 scale-110 drop-shadow-md saturate-150" : "grayscale opacity-25 hover:opacity-60"
                )}
              >
                ☕️
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsAddingDetails(true)}
            className="w-auto px-6 py-3 rounded-full bg-white text-gray-400 hover:text-gray-600 font-bold shadow-sm border border-gray-100 active:scale-95 transition-all text-[10px] uppercase tracking-[0.15em]"
          >
            {t('addDetails')}
          </button>
        </div>

      </div>
      
      {/* Slide-Up Drawer for Add Details */}
      {isAddingDetails && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]" onClick={() => setIsAddingDetails(false)} />
      )}
      
      <div className={clsx(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-[0_-10px_50px_rgba(0,0,0,0.15)] z-[101] transition-transform duration-300 ease-out p-6 sm:p-8 pb-safe border-t border-gray-100 max-w-2xl mx-auto flex flex-col",
        isAddingDetails ? "translate-y-0" : "translate-y-[120%]"
      )}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('lokalDetails')}</h3>
          <button onClick={() => setIsAddingDetails(false)} className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-colors border border-gray-100">{t('done')}</button>
        </div>
        <div className="space-y-4 pb-8">
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-amber-200">
            <MapPin className="text-amber-400" size={20} />
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={t('cafeName')} className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400 font-bold text-sm" />
          </div>
          <div className="flex gap-4">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileInputRef.current?.click()} className={clsx("flex-[0.8] flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-bold active:scale-95 transition-all text-xs border", photoFile ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100")}>
              <Camera size={20} className={photoFile ? "text-amber-500" : "text-gray-300"} /> {photoFile ? t('photoAttached') : t('uploadPhoto')}
            </button>
            <div className="flex-[1.2] flex items-start gap-3 bg-gray-50 p-4 rounded-2xl focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-amber-200">
               <Type className="text-amber-400 shrink-0 mt-0.5" size={18} />
               <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes')} className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400 text-sm font-medium resize-none h-full min-h-[60px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}