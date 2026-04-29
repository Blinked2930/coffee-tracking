import React, { useState } from 'react';
import { Coffee, AtSign, ShieldAlert, X, Globe } from 'lucide-react';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';

interface LoginProps {
  users: User[];
  onLogin: (name: string, pin: string) => Promise<boolean>;
}

export default function Login({ users, onLogin }: LoginProps) {
  // We grab what we can from Context, but use local state for guaranteed UI updates
  const languageContext = useLanguage(); 
  const t = languageContext?.t || ((key: string) => key);
  
  const [localLang, setLocalLang] = useState<'en' | 'sq'>('en');
  
  const handleLanguageToggle = () => {
    const newLang = localLang === 'en' ? 'sq' : 'en';
    setLocalLang(newLang);
    // Try to update global context if it exists
    if (languageContext?.setLanguage) {
      languageContext.setLanguage(newLang);
    }
  };
  
  const [loginIdentifier, setLoginIdentifier] = useState(''); 
  const [signupName, setSignupName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);

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
      const formattedUsername = signupUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
      const formattedName = signupName.trim();

      if (!formattedUsername || !formattedName) {
        showError(
          localLang === 'sq' ? "Mungojnë Të Dhëna" : "Incomplete Protocol", 
          localLang === 'sq' ? "Të gjitha fushat duhet të plotësohen." : "All identification fields must be populated."
        );
        return;
      }

      const exists = users.find(u => (u as any).username === formattedUsername);
      if (exists) {
        showError(
          localLang === 'sq' ? "Përdoruesi Ekziston" : "Identity Conflict", 
          localLang === 'sq' ? "Ky emër përdoruesi është marrë." : "This @username is already registered."
        );
        return;
      }

      const { error } = await supabase.from('users').insert({
        name: formattedName,
        username: formattedUsername,
        pin: pin
      });

      if (error) {
        console.error("Signup Error:", error);
        showError("System Failure", error.message);
        return;
      }

      const success = await onLogin(formattedName, pin);
      setIsLoading(false);
      if (!success) {
        setPin('');
        showError(
          localLang === 'sq' ? "Qasje e Refuzuar" : "Access Denied", 
          localLang === 'sq' ? "PIN-i është i pasaktë." : "Credentials rejected by the mainframe."
        );
      }
      
    } else {
      const searchVal = loginIdentifier.trim().toLowerCase();
      if (!searchVal) {
        setIsLoading(false);
        return;
      }

      const match = users.find(u => 
        ((u as any).username && (u as any).username.toLowerCase() === searchVal) || 
        u.name.toLowerCase() === searchVal
      );

      const nameToPass = match ? match.name : loginIdentifier.trim();
      
      const success = await onLogin(nameToPass, pin);
      setIsLoading(false);
      if (!success) {
        setPin('');
        showError(
          localLang === 'sq' ? "Qasje e Refuzuar" : "Security Breach", 
          localLang === 'sq' ? "Të dhënat janë të pasakta." : "Invalid credentials. You do not have authorization."
        );
      }
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center bg-gray-50 p-6 relative overflow-y-auto custom-scrollbar">
      
      {/* Floating Language Toggle - Fixed position so it never gets buried */}
      <button 
        onClick={handleLanguageToggle}
        className="fixed top-6 right-6 z-[100] px-4 py-2.5 bg-white/90 backdrop-blur-md border border-gray-100 shadow-sm hover:bg-gray-50 text-gray-600 rounded-full font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2"
      >
        <Globe size={14} className="text-amber-500" />
        {localLang === 'en' ? 'SHQIP' : 'ENGLISH'}
      </button>

      {/* Error Modal */}
      {errorConfig.show && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />
            <button 
              onClick={() => setErrorConfig({ ...errorConfig, show: false })}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 active:scale-95 transition-all"
            >
              <X size={16} />
            </button>
            <div className="flex justify-center mb-5 mt-2">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm border border-red-100 rotate-3">
                <ShieldAlert size={32} />
              </div>
            </div>
            <h3 className="text-2xl font-black text-center text-gray-900 mb-2 tracking-tight leading-none">
              {errorConfig.title}
            </h3>
            <p className="text-sm text-gray-500 text-center mb-8 font-medium leading-relaxed px-2">
              {errorConfig.message}
            </p>
            <button 
              onClick={() => setErrorConfig({ ...errorConfig, show: false })}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black shadow-xl shadow-gray-900/20 active:scale-[0.98] transition-all text-xs uppercase tracking-widest"
            >
              {localLang === 'sq' ? 'Kuptoj' : 'Acknowledge'}
            </button>
          </div>
        </div>
      )}

      {/* Spacer to push card down naturally */}
      <div className="my-auto w-full flex flex-col items-center justify-center py-12">
        {/* Main Login Interface */}
        <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 z-10 border border-gray-100 shrink-0">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[1.5rem] flex items-center justify-center mb-5 shadow-inner">
              <Coffee size={36} className="drop-shadow-sm" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">
              {isSignUp ? (localLang === 'sq' ? 'Bashkohu' : 'Join Cohort') : t('welcomeBack')}
            </h2>
            <p className="text-amber-600/80 font-bold text-[10px] uppercase tracking-[0.2em]">Kafe Tracker</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    {localLang === 'sq' ? 'Emri Ekranit' : 'Display Name'}
                  </label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-amber-200 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                    placeholder={localLang === 'sq' ? 'psh. Emmett Frett' : 'e.g. Emmett Frett'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    {localLang === 'sq' ? 'Përdoruesi' : 'Username'}
                  </label>
                  <div className="relative">
                    <AtSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-amber-200 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                      placeholder="emmett"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                  {localLang === 'sq' ? 'Përdoruesi ose Emri' : 'Username or Name'}
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-amber-200 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all font-medium text-gray-900 placeholder:text-gray-400"
                  placeholder={localLang === 'sq' ? 'psh. @emmett' : 'e.g. @emmett'}
                  required
                />
              </div>
            )}

            <div className="pt-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1 text-center">
                {localLang === 'sq' ? 'PIN-i i Sigurisë' : 'Security PIN'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-amber-200 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all text-center tracking-[1em] text-2xl font-black text-gray-900 placeholder:text-gray-300"
                placeholder="••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.length === 0 || (isSignUp ? (!signupName || !signupUsername) : !loginIdentifier)}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black py-4.5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center mt-4 uppercase tracking-[0.15em] text-xs h-14"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-950/20 border-t-amber-950"></div>
              ) : (
                isSignUp ? (localLang === 'sq' ? 'Krijo Llogari' : 'Create Account') : t('enter')
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
              className="text-[10px] font-black text-gray-400 hover:text-amber-600 transition-colors uppercase tracking-widest border-b border-transparent hover:border-amber-600 pb-0.5"
            >
              {isSignUp 
                ? (localLang === 'sq' ? 'Keni llogari? Hyni' : 'Already have an account? Log In') 
                : (localLang === 'sq' ? 'I ri këtu? Bashkohu!' : 'New here? Come join!')}
            </button>
          </div>
        </div>

        {/* In-flow disclaimer, never gets cut off */}
        <div className="w-full max-w-xs text-center opacity-60 mt-8 shrink-0">
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.15em] leading-relaxed">
            {localLang === 'sq' 
              ? 'Duke hyrë këtu, ju pranoni që ky aplikacion është rreptësisht për argëtim. Zhvilluesi nuk mban përgjegjësi për incidentet e shkaktuara nga kafeina.' 
              : 'By accessing this node, you acknowledge this application is intended strictly for telemetry tracking. The Executive Visionary assumes no liability for caffeine-induced incidents.'}
          </p>
        </div>
      </div>
    </div>
  );
}