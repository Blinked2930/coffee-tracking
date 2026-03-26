import { useState, useRef } from 'react';
import { Coffee, MapPin, Camera, Type } from 'lucide-react';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import { KafeType, User } from '../types';
import { supabase } from '../lib/supabase';

interface HomeProps {
  user: User;
  onKafeLogged: () => void;
}

export default function Home({ user, onKafeLogged }: HomeProps) {
  const [selectedType, setSelectedType] = useState<KafeType>('kafe');
  const [isAddingDetails, setIsAddingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const kafeOptions: { type: KafeType; icon: string; label: string }[] = [
    { type: 'dublo', icon: '☕️', label: 'Dublo' },
    { type: 'kafe', icon: '☕️', label: 'Kafe' },
    { type: 'turkish kafe', icon: '🫖', label: 'Turkish' },
    { type: 'macchiato', icon: '🥛', label: 'Macchiato' },
    { type: 'cappicino', icon: '☁️', label: 'Cappicino' },
    { type: 'freddo', icon: '🧊', label: 'Freddo' },
  ];

  const handleLogKafe = async () => {
    setIsSaving(true);
    
    let uploadedPhotoUrl = null;
    if (photoFile) {
      const fileExt = photoFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kafes')
        .upload(fileName, photoFile);
        
      if (!uploadError && uploadData) {
        uploadedPhotoUrl = supabase.storage.from('kafes').getPublicUrl(fileName).data.publicUrl;
      } else {
        console.error("Image upload failed:", uploadError);
      }
    }
    
    // Save to Supabase
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
    
    // Fire celebratory confetti!
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'],
      disableForReducedMotion: true
    });

    // Reset Forms and redirect to feed after celebration
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
    <div className="flex flex-col min-h-[100%] px-6 py-4 pb-8 relative">
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={handleLogKafe}
          disabled={isSaving || showSuccess}
          className={clsx(
            "relative w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-300",
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
              <Coffee size={48} className="text-white mb-2 drop-shadow-md animate-pulse" />
              <span className="text-white text-2xl font-black tracking-wider drop-shadow-md">Brewing...</span>
            </>
          )}

          {showSuccess && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-white/40 border-dashed animate-[spin_10s_linear_infinite]" />
              <span className="text-6xl mb-2 drop-shadow-md animate-bounce">🎉</span>
              <span className="text-white text-3xl font-black tracking-wider drop-shadow-md mt-2">Logged!</span>
            </>
          )}

          {(!isSaving && !showSuccess) && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-white/40 border-dashed animate-[spin_30s_linear_infinite]" />
              <Coffee size={56} className="text-white mb-2 drop-shadow-md" />
              <span className="text-white text-4xl font-black tracking-wider drop-shadow-md">+1 Kafe</span>
              <span className="text-amber-700/80 font-medium mt-1 uppercase tracking-widest text-sm">Tap to log</span>
            </>
          )}
        </button>

        <div className="mt-8 w-full max-w-sm">
          <p className="text-center text-sm font-medium text-gray-500 mb-4 uppercase tracking-widest">Select Type</p>
          <div className="grid grid-cols-3 gap-3">
            {kafeOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={clsx(
                  "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-sm",
                  selectedType === option.type
                    ? "bg-white border-2 border-amber-500 scale-105 shadow-md"
                    : "bg-white/60 border-2 border-transparent text-gray-500 hover:bg-white"
                )}
              >
                <span className="text-3xl">{option.icon}</span>
                <span className={clsx("text-xs font-semibold", selectedType === option.type ? "text-amber-600" : "text-gray-400")}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Rating row directly on the homescreen */}
        <div className="mt-6 w-full max-w-sm flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
             <div className="h-px w-8 bg-gray-200" />
             <p className="text-center text-xs font-bold text-gray-300 uppercase tracking-widest">Rating</p>
             <div className="h-px w-8 bg-gray-200" />
          </div>
          <div className="flex justify-between w-full px-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <button
                key={num}
                onClick={() => setRating(num === rating ? 0 : num)}
                className={clsx(
                  "text-2xl transition-all active:scale-75",
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
          className="mt-6 px-6 py-2.5 rounded-full bg-white text-gray-500 font-medium shadow-sm border border-gray-100 active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center justify-center"
        >
          Add Details
        </button>
      </div>

      {/* Modal Overlay */}
      {isAddingDetails && (
        <div 
          className="fixed inset-0 bg-gray-900/20 z-40 transition-opacity" 
          onClick={() => setIsAddingDetails(false)}
        />
      )}

      {/* Details drawer (Fixed Bottom Sheet) */}
      <div className={clsx(
        "fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-in-out p-6 border-t border-gray-100",
        isAddingDetails ? "translate-y-0" : "translate-y-[120%]"
      )}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Lokal Details</h3>
          <button 
            onClick={() => setIsAddingDetails(false)}
            className="px-4 py-2 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest active:scale-95"
          >
            Done
          </button>
        </div>
        <div className="space-y-4 mb-2">
          {/* Location */}
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl focus-within:ring-2 focus-within:ring-amber-500 transition-all">
            <MapPin className="text-amber-500" size={20} />
            <input 
              type="text" 
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Cafe Name or Location" 
              className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400" 
            />
          </div>
          <div className="flex gap-4">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={e => setPhotoFile(e.target.files?.[0] || null)}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-medium active:scale-95 transition-all text-sm",
                photoFile ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-600"
              )}
            >
              <Camera size={18} className="text-amber-500 flex-shrink-0" /> 
              {photoFile ? 'Photo Attached' : 'Upload Photo'}
            </button>
            <div className="flex-[1.5] flex items-center gap-3 bg-gray-50 p-4 rounded-xl focus-within:ring-2 focus-within:ring-amber-500 transition-all">
               <Type className="text-amber-500 flex-shrink-0" size={18} />
               <input 
                 type="text" 
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 placeholder="Notes" 
                 className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400 text-sm" 
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
