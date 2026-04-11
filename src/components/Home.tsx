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
  const { t } = useLanguage();
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
    { type: 'turkish kafe', icon: '🫖', label: 'Turkish' },
    { type: 'macchiato', icon: '🥛', label: 'Macchiato' },
    { type: 'cappicino', icon: '☁️', label: 'Cappicino' },
    { type: 'cai', icon: '🍵', label: 'Çai' },
    { type: 'freddo', icon: '🧊', label: 'Freddo' },
    { type: 'canned_coffee', icon: '🥫', label: 'Canned Coffee' },
    { type: 'energy_drink', icon: '🔋', label: 'Energy Drink' },
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
          if (!vapidPublicKey) {
            console.error("VITE_VAPID_PUBLIC_KEY is missing!");
            return;
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });

          const { error } = await supabase
            .from('push_subscriptions')
            .upsert({ 
              user_id: user.id, 
              subscription: JSON.parse(JSON.stringify(subscription)) 
            }, { onConflict: 'user_id' });

          if (error) {
            console.error("Supabase Error:", error.message);
          } else {
            new Notification("Awesome! You will now get Kafe updates.");
          }
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
      } else {
        console.error("Image upload failed:", uploadError);
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
      alert("Failed to save Kafe. Make sure the database schema is running!");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    setShowSuccess(true);
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'],
      disableForReducedMotion: true
    });

    if ("Notification" in window && permissionStatus === "granted") {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);

      if (isIOS) {
        try {
          new Notification("Kafe Logged! ☕️", {
            body: `You successfully logged a ${selectedType}.`,
            icon: '/vite.svg' 
          });
        } catch (e) {
          console.error("iOS local notification failed:", e);
        }
      } else if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification("Kafe Logged! ☕️", {
            body: `You successfully logged a ${selectedType}.`,
            icon: '/vite.svg',
            vibrate: [200, 100, 200]
          });
        }).catch((err) => {
          console.log("Service Worker notification failed:", err);
        });
      }
    }

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
    <div className="flex flex-col h-full px-4 relative overflow-hidden">
      
      {showNotificationPrompt && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 transition-all">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center transform transition-all animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-4xl drop-shadow-sm">🔔</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Stay in the Loop</h2>
            <p className="text-gray-500 mb-8 text-sm font-medium leading-relaxed">
              Get notified instantly when the cohort logs a Kafe so you never miss a moment.
            </p>
            <div className="space-y-3">
              <button onClick={requestNotificationPermission} className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white rounded-xl font-bold uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-amber-500/20">
                Enable Notifications
              </button>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button onClick={handleDismissSession} className="w-full py-3 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors active:scale-95">
                  Maybe Later
                </button>
                <button onClick={handleDeclineForever} className="w-full py-3 bg-gray-50 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors active:scale-95">
                  No Thanks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-5 sm:gap-6 w-full max-w-sm mx-auto min-h-0 py-2">
        
        <button
          onClick={handleLogKafe}
          disabled={isSaving || showSuccess}
          className={clsx(
            "relative w-48 h-48 sm:w-52 sm:h-52 rounded-full flex flex-col items-center justify-center transition-all duration-300 shrink-0",
            "active:scale-95 disabled:opacity-90",
            showSuccess 
              ? "bg-gradient-to-tr from-green-400 to-emerald-400 shadow-[0_20px_50px_rgba(52,211,153,0.5)] scale-105"
              : "bg-gradient-to-tr from-amber-400 to-amber-300 shadow-[0_20px_50px_rgba(251,191,36,0.5)]",
            (!showSuccess && !isSaving) && "active:shadow-[0_10px_20px_rgba(251,191,36,0.4)]"
          )}
        >
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

          {(!isSaving && !showSuccess) && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-white/40 border-dashed animate-[spin_30s_linear_infinite]" />
              <Coffee size={40} className="text-white mb-1.5 drop-shadow-md" />
              <span className="text-white text-3xl font-black tracking-wider drop-shadow-md">+1 Kafe</span>
              <span className="text-amber-700/80 font-medium mt-0.5 uppercase tracking-widest text-[10px]">{t('tapToLog')}</span>
            </>
          )}
        </button>

        {/* ALIGNED GRID: Swapped px-6 for px-1 so it naturally spans the exact same width as the rating cups below it */}
        <div className="w-full px-1">
          <div className="grid grid-cols-3 gap-3">
            {kafeOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={clsx(
                  "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-sm",
                  selectedType === option.type
                    ? "bg-white border-2 border-amber-500 scale-105 shadow-md"
                    : "bg-white/60 border-2 border-transparent text-gray-500 hover:bg-white"
                )}
              >
                {/* RESTORED BIG ICONS: text-3xl sm:text-4xl */}
                <span className="text-3xl sm:text-4xl">{option.icon}</span>
                <span className={clsx("text-[10px] sm:text-[11px] leading-tight text-center px-1 font-semibold", selectedType === option.type ? "text-amber-600" : "text-gray-400")}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* The Rating Cups */}
        <div className="w-full flex flex-col items-center shrink-0">
          <div className="flex justify-between w-full px-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <button
                key={num}
                onClick={() => setRating(num === rating ? 0 : num)}
                className={clsx(
                  "text-xl sm:text-2xl transition-all active:scale-75",
                  rating >= num ? "opacity-100 scale-110 drop-shadow-md saturate-150" : "grayscale opacity-30 hover:opacity-60"
                )}
              >
                ☕️
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setIsAddingDetails(true)}
          className="px-6 py-2.5 rounded-full bg-white text-gray-500 font-bold shadow-sm border border-gray-100 active:scale-95 transition-all text-[11px] uppercase tracking-wider flex items-center justify-center shrink-0"
        >
          {t('addDetails')}
        </button>
      </div>

      {/* Modal Overlay & Drawer */}
      {isAddingDetails && <div className="fixed inset-0 bg-gray-900/20 z-40 transition-opacity" onClick={() => setIsAddingDetails(false)} />}
      <div className={clsx(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-in-out p-6 pb-8 border-t border-gray-100 max-w-2xl mx-auto",
        isAddingDetails ? "translate-y-0" : "translate-y-[120%]"
      )}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">{t('lokalDetails')}</h3>
          <button onClick={() => setIsAddingDetails(false)} className="px-4 py-2 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest active:scale-95">
            {t('done')}
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl focus-within:ring-2 focus-within:ring-amber-500 transition-all">
            <MapPin className="text-amber-500" size={20} />
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder={t('cafeName')} className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400" />
          </div>
          <div className="flex gap-4">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileInputRef.current?.click()} className={clsx("flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-medium active:scale-95 transition-all text-sm", photoFile ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-600")}>
              <Camera size={18} className="text-amber-500 shrink-0" /> {photoFile ? t('photoAttached') : t('uploadPhoto')}
            </button>
            <div className="flex-[1.5] flex items-center gap-3 bg-gray-50 p-4 rounded-xl focus-within:ring-2 focus-within:ring-amber-500 transition-all">
               <Type className="text-amber-500 shrink-0" size={18} />
               <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes')} className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400 text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}