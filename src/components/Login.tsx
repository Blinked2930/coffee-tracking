import React, { useState } from 'react';
import { Coffee } from 'lucide-react';

import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  users: User[];
  onLogin: (name: string, pin: string) => Promise<boolean>;
}

export default function Login({ users, onLogin }: LoginProps) {
  const { t } = useLanguage();
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && pin.length > 0) {
      setIsLoading(true);
      const success = await onLogin(selectedUser, pin);
      setIsLoading(false);
      if (!success) setPin('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <Coffee size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('welcomeBack')}</h1>
          <p className="text-gray-500 mt-2 text-center">Kafe Tracker</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectName').replace('...', '')}</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              required
            >
              <option value="" disabled>{t('selectName')}</option>
              {users.map((user) => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center tracking-[0.5em] text-xl font-mono"
              placeholder={t('enterPin')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={!selectedUser || !pin || isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-amber-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
          >
            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : t('enter')}
          </button>
        </form>
      </div>
    </div>
  );
}
