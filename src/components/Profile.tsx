import { useMemo, useState } from 'react';
import { User, KafeLog } from '../types';
import { LogOut, Globe, Coffee, Clock, Zap, MessageCircle, Pencil } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import EditKafeModal from './EditKafeModal';

interface ProfileProps {
  user: User;
  logs: KafeLog[];
  onLogout: () => void;
}

export default function Profile({ user, logs, onLogout }: ProfileProps) {
  const { lang, toggleLang } = useLanguage();
  const [editingLog, setEditingLog] = useState<KafeLog | null>(null);

  const userLogs = useMemo(() => {
    return logs
      .filter(log => log.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [logs, user.id]);

  const insights = useMemo(() => {
    const total = userLogs.length;

    const typeCounts = userLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    const hourCounts = userLogs.reduce((acc, log) => {
      const date = new Date(log.created_at);
      const hour = date.getHours(); 
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    let peakHourStr = '--:--';
    if (Object.keys(hourCounts).length > 0) {
      const peakHour = parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]);
      const ampm = peakHour >= 12 ? 'PM' : 'AM';
      const formattedHour = peakHour % 12 || 12;
      peakHourStr = `${formattedHour}:00 ${ampm}`;
    }

    return { total, favoriteType, peakHourStr };
  }, [userLogs]);

  return (
    <div className="px-6 pt-8 pb-24 max-w-lg mx-auto">
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black flex items-center justify-center text-4xl shadow-md border-4 border-white mb-4">
          {user.name.charAt(0)}
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}</h1>
        <p className="font-bold text-amber-600 uppercase tracking-widest text-xs mt-1">
          {insights.total} Kafes Logged
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <Coffee size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Top Choice</p>
            <p className="font-black text-gray-800 capitalize leading-tight">{insights.favoriteType.replace(/_/g, ' ')}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2">
          <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
            <Zap size={20} className="fill-purple-500 text-purple-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Power Hour</p>
            <p className="font-black text-gray-800 capitalize leading-tight">{insights.peakHourStr}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-8">
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

      <div>
        <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-gray-400" />
          My Recent History
        </h3>
        
        <div className="space-y-4">
          {userLogs.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 text-sm font-medium">
              Go log your first Kafe!
            </div>
          ) : (
            userLogs.slice(0, 10).map((log) => {
              const date = new Date(log.created_at);
              return (
                // NEW: Made card clickable to edit!
                <div 
                  key={log.id} 
                  onClick={() => setEditingLog(log)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-amber-200 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800 capitalize">{log.type.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-bold text-gray-400">
                      {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
                  {log.rating && (
                    <div className="flex flex-wrap items-center gap-0.5 mb-2">
                      {[...Array(log.rating)].map((_, i) => (
                        <span key={i} className="text-sm drop-shadow-sm leading-none">☕️</span>
                      ))}
                    </div>
                  )}

                  {log.photo_url && (
                    <div className="mt-3 mb-2 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                      <img 
                        src={log.photo_url} 
                        alt="Kafe moment" 
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {log.notes && (
                    <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-xl mt-2">
                      "{log.notes}"
                    </p>
                  )}

                  {/* NEW: Stats & Edit Footer */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <MessageCircle size={14} />
                      <span className="text-xs font-bold">{(log as any).comment_count || 0}</span>
                    </div>
                    <div className="text-gray-300 group-hover:text-amber-500 transition-colors">
                      <Pencil size={14} />
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Include the edit modal outside the map loop */}
      {editingLog && <EditKafeModal log={editingLog} onClose={() => setEditingLog(null)} />}
    </div>
  );
}