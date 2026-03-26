import React, { useState } from 'react';
import { Coffee, MapPin, Camera, Type } from 'lucide-react';
import clsx from 'clsx';
import { KafeType, User } from '../types';
import { supabase } from '../lib/supabase';

interface HomeProps {
  user: User;
  onKafeLogged: () => void;
}

export default function Home({ user, onKafeLogged }: HomeProps) {
  const [selectedType, setSelectedType] = useState<KafeType>('standard');
  const [isAddingDetails, setIsAddingDetails] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const kafeOptions: { type: KafeType; icon: string; label: string }[] = [
    { type: 'standard', icon: '☕️', label: 'Standard' },
    { type: 'espresso', icon: '🤌', label: 'Espresso' },
    { type: 'macchiato', icon: '🥛', label: 'Macchiato' },
    { type: 'freddo', icon: '🧊', label: 'Freddo' },
  ];

  const handleLogKafe = async () => {
    setIsAnimating(true);
    
    // Save to Supabase
    const { error } = await supabase.from('kafes').insert({
      user_id: user.id,
      type: selectedType,
      location: location || null,
      notes: notes || null
    });
    
    if (error) {
      console.error(error);
      alert("Failed to save Kafe. Make sure the database schema is running!");
      setIsAnimating(false);
      return;
    }

    // Reset Forms
    setTimeout(() => {
      setIsAnimating(false);
      setLocation('');
      setNotes('');
      setIsAddingDetails(false);
      setSelectedType('standard');
      onKafeLogged();
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full px-6 py-8 relative">
      <div className="flex-1 flex flex-col items-center justify-center -mt-12">
        <button
          onClick={handleLogKafe}
          disabled={isAnimating}
          className={clsx(
            "relative w-64 h-64 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 flex flex-col items-center justify-center shadow-[0_20px_50px_rgba(251,191,36,0.5)] transition-all duration-300",
            "active:scale-95 active:shadow-[0_10px_20px_rgba(251,191,36,0.4)] disabled:opacity-80",
            isAnimating && "animate-[pulse_1s_ease-in-out_1]"
          )}
        >
          <div className="absolute inset-0 rounded-full border-4 border-white/40 border-dashed animate-[spin_30s_linear_infinite]" />
          <Coffee size={64} className="text-white mb-2 drop-shadow-md" />
          <span className="text-white text-4xl font-black tracking-wider drop-shadow-md">+1 Kafe</span>
          <span className="text-amber-700/80 font-medium mt-1 uppercase tracking-widest text-sm">Tap to log</span>
        </button>

        <div className="mt-16 w-full max-w-sm">
          <p className="text-center text-sm font-medium text-gray-500 mb-4 uppercase tracking-widest">Select Type</p>
          <div className="flex justify-between gap-3">
            {kafeOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setSelectedType(option.type)}
                className={clsx(
                  "flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm",
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

        <button 
          onClick={() => setIsAddingDetails(!isAddingDetails)}
          className="mt-8 px-6 py-3 rounded-full bg-white text-gray-600 font-medium shadow-sm border border-gray-100 active:scale-95 transition-all text-sm flex items-center gap-2"
        >
          {isAddingDetails ? 'Hide Details' : 'Add Location & Photo...'}
        </button>
      </div>

      <div className={clsx(
        "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-transform duration-500 ease-in-out p-6",
        isAddingDetails ? "translate-y-0" : "translate-y-[120%]"
      )}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Kafe Details</h3>
        <div className="space-y-4">
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
            <button className="flex-1 flex items-center justify-center gap-2 bg-gray-50 p-4 rounded-xl text-gray-600 font-medium active:scale-95 transition-all">
              <Camera size={20} className="text-amber-500" /> Upload Photo
            </button>
            <div className="flex-1 flex items-center gap-3 bg-gray-50 p-4 rounded-xl focus-within:ring-2 focus-within:ring-amber-500 transition-all">
               <Type className="text-amber-500" size={20} />
               <input 
                 type="text" 
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 placeholder="Notes (optional)" 
                 className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400" 
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
