import { useMemo } from 'react';
import { User, KafeLog } from '../types';
import { X, Star, Coffee, Clock } from 'lucide-react';

interface UserProfileDrawerProps {
  user: User;
  allLogs: KafeLog[];
  onClose: () => void;
}

export default function UserProfileDrawer({ user, allLogs, onClose }: UserProfileDrawerProps) {
  const userLogs = useMemo(() => {
    return allLogs
      .filter(log => log.user_id === user.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allLogs, user.id]);

  const insights = useMemo(() => {
    const total = userLogs.length;

    const typeCounts = userLogs.reduce((acc, log) => {
      acc[log.type] = (acc[log.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    const ratedLogs = userLogs.filter(l => l.rating && l.rating > 0);
    const avgRating = ratedLogs.length 
      ? (ratedLogs.reduce((sum, l) => sum + l.rating!, 0) / ratedLogs.length).toFixed(1) 
      : null;

    return { total, favoriteType, avgRating };
  }, [userLogs]);

  return (
    <>
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 rounded-t-[2.5rem] shadow-2xl z-50 transition-transform duration-300 ease-out flex flex-col h-[85vh] max-h-[800px] w-full max-w-2xl mx-auto border-t border-gray-100 overflow-hidden">
        
        <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0 relative z-10 rounded-t-[2.5rem]">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black flex items-center justify-center text-3xl shadow-md border-4 border-white">
                {user.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900 leading-tight">{user.name}</h2>
                <p className="text-sm font-bold text-amber-600 tracking-wider uppercase">Kafe Log</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
                <Coffee size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Top Choice</p>
                <p className="font-black text-gray-800 capitalize leading-tight">{insights.favoriteType}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center gap-2">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                <Star size={20} className="fill-amber-500" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Avg Rating</p>
                <p className="font-black text-gray-800 capitalize leading-tight">
                  {insights.avgRating ? `${insights.avgRating} / 8` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              Recent History
            </h3>
            
            <div className="space-y-4">
              {userLogs.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 text-sm font-medium">
                  No kafes logged yet.
                </div>
              ) : (
                userLogs.map((log) => {
                  const date = new Date(log.created_at);
                  return (
                    <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-800 capitalize">{log.type}</span>
                        <span className="text-xs font-bold text-gray-400">
                          {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      
                      {log.rating && (
                        <div className="flex items-center gap-0.5 mb-2">
                          {[...Array(log.rating)].map((_, i) => (
                            <span key={i} className="text-sm drop-shadow-sm leading-none">☕️</span>
                          ))}
                        </div>
                      )}

                      {/* NEW: Display Photo in Public Profiles too */}
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
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}