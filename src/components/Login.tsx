import React, { useState } from 'react';
import { Coffee, AtSign, AlertTriangle, X } from 'lucide-react';
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

  // Custom Error State
  const [errorConfig, setErrorConfig] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: '',
    message: ''
  });

  const showError = (title: string, message: string) => {
    setErrorConfig({ show: true, title, message });
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 0) return;
    setIsLoading(true);

    if (isSignUp) {
      // Clean and format the username (lowercase, no spaces)
      const formattedUsername = signupUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
      const formattedName = signupName.trim();

      if (!formattedUsername || !formattedName) {
        showError("Missing Data", "Please fill out all fields before joining the cohort.");
        return;
      }

      // Check if username already exists
      const exists = users.find(u => (u as any).username === formattedUsername);
      if (exists) {
        showError("Username Unavailable", "This @username is already taken by another operative. Try another one.");
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
        showError("Database Error", error.message);
        return;
      }

      // Proceed to login (passing Name so App.tsx doesn't break)
      const success = await onLogin(formattedName, pin);
      setIsLoading(false);
      if (!success) {
        setPin('');
        showError("Access Denied", "Invalid PIN or configuration. Please try again.");
      }
      
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
      if (!success) {
        setPin('');
        showError("Access Denied", "Invalid credentials. Ensure your username and PIN are correct.");
      }
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
      
      {/* Custom Error Modal */}
      {errorConfig.show && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border border-red-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <button 
              onClick={() => setErrorConfig({ ...errorConfig, show: false })}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 active:scale-95 transition-all"
            >
              <X size={16} />
            </button>
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-xl font-black text-center text-gray-900 mb-2 tracking-tight">
              {errorConfig.title}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-8 font-medium leading-relaxed px-2">
              {errorConfig.message}
            </p>
            <button 
              onClick={() => setErrorConfig({ ...errorConfig, show: false })}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

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
            className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white font-black py-4 rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center mt-2 uppercase tracking-widest text-xs"
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
            className="text-xs font-black text-amber-600 hover:text-amber-700 transition-colors uppercase tracking-wider"
          >
            {isSignUp ? 'Already have an account? Log In' : 'New here? Create Account'}
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-8 text-center opacity-60">
        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed">
          By accessing Kafe Tracker, you acknowledge this application is intended strictly for entertainment and personal tracking purposes. The developers and Executive Visionary assume no liability for caffeine-induced incidents, data discrepancies, or social ramifications.
        </p>
      </div>
    </div>
  );
}