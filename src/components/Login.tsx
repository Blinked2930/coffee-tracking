import React, { useState } from 'react';
import { Coffee, AtSign } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface LoginProps {
  users: User[];
  onLogin: (name: string, pin: string) => Promise<boolean>;
}

export default function Login({ users, onLogin }: LoginProps) {
  const { t } = useLanguage();
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState(''); 
  
  // Signup State
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 0) return;
    setIsLoading(true);

    if (isSignUp) {
      // Clean and format the username (lowercase, no spaces)
      const formattedUsername = signupUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
      const formattedName = signupName.trim();

      if (!formattedUsername || !formattedName) {
        alert("Please fill out all fields.");
        setIsLoading(false);
        return;
      }

      // Check if username already exists
      const exists = users.find(u => (u as any).username === formattedUsername);
      if (exists) {
        alert("This @username is already taken. Try another one!");
        setIsLoading(false);
        return;
      }

      // Create new account
      const { error } = await supabase.from('users').insert({
        name: formattedName,
        username: formattedUsername,
        pin: pin
      });

      if (error) {
        console.error("Signup Error:", error);
        alert(`Database Error: ${error.message}`);
        setIsLoading(false);
        return;
      }

      // Proceed to login (passing Name so App.tsx doesn't break)
      const success = await onLogin(formattedName, pin);
      setIsLoading(false);
      if (!success) setPin('');
      
    } else {
      // Login Flow
      const searchVal = loginIdentifier.trim().toLowerCase();
      if (!searchVal) {
        setIsLoading(false);
        return;
      }

      // Clever hack: Look up the user by their @username OR their Name
      const match = users.find(u => 
        ((u as any).username && (u as any).username.toLowerCase() === searchVal) || 
        u.name.toLowerCase() === searchVal
      );

      // If we found them by username, pass their real name to App.tsx
      const nameToPass = match ? match.name : loginIdentifier.trim();
      
      const success = await onLogin(nameToPass, pin);
      setIsLoading(false);
      if (!success) setPin('');
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

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {isSignUp ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium"
                  placeholder="e.g. Emmett Frett"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium"
                    placeholder="emmett"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Username or Name
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-medium"
                placeholder="e.g. @emmett"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center tracking-[0.5em] text-xl font-mono"
              placeholder="••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || pin.length === 0 || (isSignUp ? (!signupName || !signupUsername) : !loginIdentifier)}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center mt-2"
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
            onClick={() => {
              setIsSignUp(!isSignUp);
              setPin('');
            }}
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