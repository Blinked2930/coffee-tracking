import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface LoginProps {
  users: User[];
  onLogin: (name: string, pin: string) => Promise<boolean>;
}

export default function Login({ users, onLogin }: LoginProps) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = username.trim();
    if (formattedName && pin.length > 0) {
      setIsLoading(true);

      if (isSignUp) {
        // Check if name already exists
        const exists = users.find(u => u.name.toLowerCase() === formattedName.toLowerCase());
        if (exists) {
          alert("This name is already taken. Try logging in instead!");
          setIsLoading(false);
          return;
        }

        // Create new account
        const { error } = await supabase.from('users').insert({
          name: formattedName,
          pin: pin
        });

        if (error) {
          console.error("Signup Error:", error);
          alert(`Database Error: ${error.message}`); // This will tell us exactly why it failed!
          setIsLoading(false);
          return;
        }
      }

      // Proceed to login
      const success = await onLogin(formattedName, pin);
      setIsLoading(false);
      if (!success) {
        setPin('');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 z-10">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Coffee size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">
            {isSignUp ? 'Join the Cohort' : t('welcomeBack')}
          </h2>
          <p className="text-gray-500 font-medium text-center">Kafe Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type your name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              placeholder="e.g. Emmett"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4} // Locked to 4 digits
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center tracking-[0.5em] text-xl font-mono"
              placeholder="••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!username || !pin || isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              isSignUp ? 'Create Account' : t('enter')
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            {isSignUp ? 'Already have an account? Log In' : 'New here? Create Account'}
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-8 text-center opacity-60">
        <p className="text-[10px] text-gray-400 font-medium leading-tight">
          By accessing Kafe Tracker, you acknowledge this application is intended strictly for entertainment and personal tracking purposes. The developers and Executive Visionary assume no liability for caffeine-induced incidents, data discrepancies, or social ramifications.
        </p>
      </div>
    </div>
  );
}