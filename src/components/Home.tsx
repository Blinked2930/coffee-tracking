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
  const { t, language } = useLanguage();
  const [selectedType, setSelectedType] = useState<KafeType>('kafe');
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

  const reconnectPushSubscription = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        await supabase
          .from('push_subscriptions')
          .upsert({ 
            user_id: user.id, 
            subscription: JSON.parse(JSON.stringify(subscription)) 
          }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.error("Silent push renewal failed:", error);
    }
  };

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
      } else if (Notification.permission === 'granted') {
        reconnectPushSubscription();
      }
    }
  }, [user.id]);

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
    { type: 'other', icon: '❓', label: t('otherType') },
  ];

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      setShowNotificationPrompt(false);

      if (permission === "granted") {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) return;

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });

          await supabase
            .from('push_subscriptions')
            .upsert({ 
              user_id: user.id, 
              subscription: JSON.parse(JSON.stringify(subscription)) 
            }, { onConflict: 'user_id' });
        }
      } else if (permission === "denied") {
        localStorage.setItem('kafe_notifications_declined', 'true');
      }
    } catch (error: any) {
      console.error("Push Error:", error.message || error);
    }
  };

  const handleLogKafe = async () => {
    setIsSaving(true);
    let uploadedPhotoUrl = null;
    
    if (photoFile) {
      const compressedFile = await compressImage(photoFile);
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kafes')
        .upload(fileName, compressedFile);
        
      if (!uploadError && uploadData) {
        uploadedPhotoUrl = supabase.storage.from('kafes').getPublicUrl(fileName).data.publicUrl;
      }
    }
    
    const { error } = await supabase.from('kafes').insert({
      user_id: user.id,
      type: selectedType,
      location: location || null,
      notes: notes || null,
      photo_url: uploadedPhotoUrl,
      rating: rating > 0 ? rating : null
    });
    
    if (error) {
      console.error(error);
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setShowSuccess(true);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.55 },
      colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'],
      disableForReducedMotion: true
    });

    setTimeout(() => {
      setShowSuccess(false);
      setLocation('');
      setNotes('');
      setRating(0);
      setIsAddingDetails(false);
      setSelectedType('kafe');
      setPhotoFile(null);
      onKafeLogged();
    }, 2500);
  };

  return (
    <div className="flex flex-col h-full min-h-[100dvh] px-5 pt-6 pb-20 overflow-y-auto custom-scrollbar bg-gray-50/30">
      
      {showNotificationPrompt && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6 transition-all">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center transform transition-all animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-amber-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
              <span className="text-4xl drop-shadow-sm">🔔</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
              {language === 'sq' ? 'Qëndro i Informuar' : 'Stay in the Loop'}
            </h2>
            <p className="text-gray-500 mb-8 text-sm font-medium leading-relaxed">
              {language === 'sq' 
                ? 'Merr njoftime kur dikush rregjistron një kafe.' 
                : 'Get notified instantly when the cohort logs a Kafe.'}
            </p>
            <div className="space-y-3">
              <button onClick={requestNotificationPermission} className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-amber-500/20 text-[11px]">
                {language === 'sq' ? 'Aktivizo Njoftimet' : 'Enable Notifications'}
              </button>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={handleDismissSession} className="w-full py-3.5 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-colors active:scale-95">
                  {language === 'sq' ? 'Ndoshta Më Vonë' : 'Maybe Later'}
                </button>
                <button onClick={handleDeclineForever} className="w-full py-3.5 bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-colors active:scale-95">
                  {language === 'sq' ? 'Jo Faleminderit' : 'No Thanks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic top spacer */}
      <div className="flex-1 min-h-[1vh]" />

      <div className="w-full max-w-sm mx-auto flex flex-col items-center">
        
        {/* Main Cutesy Button */}
        <div className="mb-4 flex justify-center w-full shrink-0">
          <button
            onClick={handleLogKafe}
            disabled={isSaving || showSuccess}
            className={clsx(
              "relative w-40 h-40 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-300",
              "active:scale-95 disabled:opacity-90",
              showSuccess 
                ? "bg-gradient-to-tr from-green-400 to-emerald-400 shadow-[0_15px_40px_rgba(52,211,153,0.4)] scale-105"
                : "bg-gradient-to-tr from-amber-400 to-amber-300 shadow-[0_15px_40px_rgba(251,191,36,0.35)]",
              (!showSuccess && !isSaving) && "hover:shadow-[0_20px_50px_rgba(251,191,36,0.4)]"
            )}
          >
            {/* Dashed spinning ring */}
            {(!isSaving && !showSuccess) && (
              <div className="absolute inset-0 rounded-full border-[3px] border-white/40 border-dashed animate-[spin_30s_linear_infinite]" />
            )}

            {isSaving && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                <Coffee size={36} className="text-white mb-1 drop-shadow-md animate-pulse" />
                <span className="text-white text-lg font-black tracking-wider drop-shadow-md">{t('loggingIn')}</span>
              </>
            )}

            {showSuccess && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/40 border-dashed animate-[spin_10s_linear_infinite]" />
                <span className="text-5xl mb-1 drop-shadow-md animate-bounce">🎉</span>
                <span className="text-white text-2xl font-black tracking-wider drop-shadow-md mt-1">{t('done')}</span>
              </>
            )}

            {(!isSaving && !showSuccess) && (
              <>
                <Coffee size={36} className="text-white mb-1 drop-shadow-md" />
                <span className="text-white text-3xl font-black tracking-tight drop-shadow-md leading-none">+1 Kafe</span>
                <span className="text-amber-700/80 font-black uppercase tracking-[0.2em] text-[9px] mt-2">{t('tapToLog')}</span>
              </>
            )}
          </button>
        </div>

        {/* Squircle Grid */}
        <div className="w-full mb-4 shrink-0">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {kafeOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={clsx(
                  "rounded-3xl aspect-square flex flex-col items-center justify-center p-2 transition-all overflow-hidden",
                  selectedType === option.type
                    ? "bg-white border-2 border-amber-400 scale-105 shadow-md shadow-amber-500/10"
                    : "bg-white border-2 border-transparent text-gray-500 hover:bg-gray-50 shadow-sm"
                )}
              >
                <span className="text-[32px] leading-none mb-1.5 transition-transform group-active:scale-95">{option.icon}</span>
                <span className={clsx("text-[10px] leading-tight text-center px-0.5 font-bold line-clamp-2", selectedType === option.type ? "text-amber-600" : "text-gray-400")}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Compact Bottom Controls */}
        <div className="w-full flex flex-col items-center shrink-0">
          
          {/* Floating Rating System (No Bubble) */}
          <div className="w-full flex justify-between px-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <button
                key={num}
                onClick={() => setRating(num === rating ? 0 : num)}
                className={clsx(
                  "text-[24px] transition-all active:scale-75",
                  rating >= num ? "opacity-100 scale-110 drop-shadow-md saturate-150" : "grayscale opacity-25 hover:opacity-60"
                )}
              >
                ☕️
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsAddingDetails(true)}
            className="w-auto px-6 py-2.5 rounded-full bg-white text-gray-400 hover:text-gray-600 font-bold shadow-sm border border-gray-100 active:scale-95 transition-all text-[10px] uppercase tracking-[0.15em]"
          >
            {t('addDetails')}
          </button>
          
        </div>
      </div>

      {/* Dynamic bottom spacer */}
      <div className="flex-1 min-h-[1vh]" />

      {/* Slide-Up Drawer for Add Details */}
      {isAddingDetails && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] transition-opacity" 
          onClick={() => setIsAddingDetails(false)} 
        />
      )}
      
      <div className={clsx(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-[0_-10px_50px_rgba(0,0,0,0.15)] z-[101] transition-transform duration-300 ease-out p-6 sm:p-8 pb-safe border-t border-gray-100 max-w-2xl mx-auto flex flex-col",
        isAddingDetails ? "translate-y-0" : "translate-y-[120%]"
      )}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{t('lokalDetails')}</h3>
          <button 
            onClick={() => setIsAddingDetails(false)} 
            className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest active:scale-95 transition-colors border border-gray-100"
          >
            {t('done')}
          </button>
        </div>
        
        <div className="space-y-4 pb-8">
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-amber-200">
            <MapPin className="text-amber-400" size={20} />
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={t('cafeName')} className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400 font-bold text-sm" />
          </div>
          
          <div className="flex gap-4">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className={clsx(
                "flex-[0.8] flex flex-col items-center justify-center gap-2 p-4 rounded-2xl font-bold active:scale-95 transition-all text-xs border", 
                photoFile 
                  ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm" 
                  : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
              )}
            >
              <Camera size={20} className={photoFile ? "text-amber-500" : "text-gray-300"} /> 
              {photoFile ? t('photoAttached') : t('uploadPhoto')}
            </button>
            
            <div className="flex-[1.2] flex items-start gap-3 bg-gray-50 p-4 rounded-2xl focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-amber-200">
               <Type className="text-amber-400 shrink-0 mt-0.5" size={18} />
               <textarea 
                 value={notes} 
                 onChange={e => setNotes(e.target.value)} 
                 placeholder={t('notes')} 
                 className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400 text-sm font-medium resize-none h-full min-h-[60px]" 
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}