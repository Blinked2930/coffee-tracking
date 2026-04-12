import { useMemo } from 'react';
import { User, KafeLog } from '../types';
import { LogOut, Globe, Coffee, Wallet, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileProps {
  user: User;
  logs: KafeLog[];
  onLogout: () => void;
}

export default function Profile({ user, logs, onLogout }: ProfileProps) {
  const { lang, toggleLang } = useLanguage();

  // 1. Filter logs to ONLY this user
  const userLogs = useMemo(() => {
    return logs
      .filter(log => log.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [logs, user.id]);

  // 2. The Personal Insights Engine
  const insights = useMemo(() => {
    const total = userLogs.length;

    // Calculate favorite Kafe type
    const typeCounts = userLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Lek Ledger: Assuming ~100 Lek per Kafe on average
    const lekSpent = total * 100;

    return { total, favoriteType, lekSpent };
  }, [userLogs]);

  return (
    <div className="flex flex-col h-full px-6 pt-8 pb-6">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-8 shrink-0">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black flex items-center justify-center text-4xl shadow-md border-4 border-white mb-4">
          {user.name.charAt(0)}
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}</h1>
        <p className="font-bold text-amber-600 uppercase tracking-widest text-xs mt-1">
          {insights.total} Kafes Logged
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8 shrink-0">
        {/* Top Choice */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <Coffee size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Top Choice</p>
            <p className="font-black text-gray-800 capitalize leading-tight">{insights.favoriteType}</p>
          </div>
        </div>

        {/* Lek Ledger */}
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Lek Ledger</p>
            <p className="font-black text-gray-800 capitalize leading-tight">~{insights.lekSpent.toLocaleString()} L</p>
          </div>
        </div>
      </div>

      {/* Settings (Moved above history so it's always accessible) */}
      <div className="space-y-3 mb-8 shrink-0">
        <button 
          onClick={toggleLang}
          className="w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-100 shadow-sm rounded-2xl active:scale-95 transition-all"
        >
          <span className="font-bold text-gray-700">Language</span>
          <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wider text-sm bg-amber-50 px-3 py-1 rounded-full">
            {lang} <Globe size={16} />
          </div>
        </button>

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-bold uppercase tracking-wider active:scale-95 transition-all"
        >
          <LogOut size={18} /> Log Out
        </button>
      </div>

      {/* History */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2 shrink-0">
          <Clock size={18} className="text-gray-400" />
          My Recent History
        </h3>
        <div className="overflow-y-auto space-y-3 pb-20">
          {userLogs.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 text-sm font-medium">
              Go log your first Kafe!
            </div>
          ) : (
            userLogs.slice(0, 10).map((log) => {
              const date = new Date(log.created_at);
              return (
                <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-800 capitalize">{log.type}</span>
                    <span className="text-xs font-bold text-gray-400">
                      {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {log.rating && (
                    <div className="flex items-center gap-0.5">
                      {[...Array(log.rating)].map((_, i) => (
                        <span key={i} className="text-sm drop-shadow-sm leading-none">☕️</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}