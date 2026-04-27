import { useMemo, useState, useEffect } from 'react';
import { User, KafeLog } from '../types';
import { X, Star, Coffee, Clock, MessageCircle, MapPin } from 'lucide-react';
import ReactionBar from './ReactionBar';
import CommentsDrawer from './CommentsDrawer';
import { supabase } from '../lib/supabase';

interface UserProfileDrawerProps {
  user: User;
  currentUser: User;
  getUserMap: (id: string) => User | undefined; // <-- ADDED
  onClose: () => void;
}

export default function UserProfileDrawer({ user, currentUser, getUserMap, onClose }: UserProfileDrawerProps) {
  const [userLogs, setUserLogs] = useState<KafeLog[]>([]);
  const [commentingOnLog, setCommentingOnLog] = useState<KafeLog | null>(null); // <-- ADDED

  useEffect(() => {
    supabase.from('kafes')
      .select('*, comments(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const formatted = data.map((item: any) => ({
            ...item,
            comment_count: item.comments?.[0]?.count || 0
          }));
          setUserLogs(formatted as KafeLog[]);
        }
      });
  }, [user.id]);

  // Instantly updates the local feed
  const handleUpdateCommentCount = (kafeId: string, delta: number) => {
    setUserLogs(prev => prev.map(l => l.id === kafeId ? { ...l, comment_count: Math.max(0, (l.comment_count || 0) + delta) } : l));
  };

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

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
          
          <div className="grid grid-cols-2 gap-3">
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
            <h3 className="text-lg font-black text-gray-900 mb-4 px-2 flex items-center gap-2">
              <Clock size={18} className="text-gray-400" />
              Recent History
            </h3>
            
            <div className="space-y-5 pb-20">
              {userLogs.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400 text-sm font-medium">
                  No kafes logged yet.
                </div>
              ) : (
                userLogs.map((log) => {
                  const date = new Date(log.created_at);
                  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <div key={log.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100/80 flex flex-col w-full">
                      
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-100/50 inline-flex">
                          <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                            {log.type.replace(/_/g, ' ')}
                          </p>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400">
                          {dateStr} at {timeStr}
                        </span>
                      </div>

                      {log.location && (
                        <div className="flex items-center gap-1 mb-4 text-[11px] text-gray-500 font-medium">
                          <MapPin size={12} className="shrink-0 text-gray-400" />
                          <span className="truncate">{log.location}</span>
                        </div>
                      )}

                      {log.photo_url && (
                        <div className="mb-4 overflow-hidden rounded-2xl border border-gray-100/80 shadow-sm">
                          <img 
                            src={log.photo_url} 
                            alt="Kafe moment" 
                            className="w-full h-auto max-h-72 object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {log.notes && (
                        <p className="mb-4 text-sm text-gray-500 italic bg-gray-50 p-3 rounded-xl border-l-2 border-amber-200 leading-relaxed">
                          "{log.notes}"
                        </p>
                      )}

                      {/* EMOJI REACTION BAR */}
                      <ReactionBar kafeId={log.id} currentUser={currentUser} />

                      <div className="flex items-center gap-6 mt-1 pt-4 border-t border-gray-50">
                        
                        {/* CHANGED THIS FROM A DIV TO A BUTTON */}
                        <button 
                          onClick={() => setCommentingOnLog(log)}
                          className="flex items-center gap-1.5 text-gray-400 hover:text-amber-500 transition-colors active:scale-95 group"
                        >
                          <MessageCircle size={18} className="group-hover:fill-amber-50 transition-all" />
                          <span className="text-sm font-bold">{(log as any).comment_count || 0}</span>
                        </button>

                        {log.rating ? (
                          <div className="flex flex-wrap items-center gap-0.5">
                            {[...Array(log.rating)].map((_, i) => (
                              <span key={i} className="text-[1.1rem] drop-shadow-sm leading-none">☕️</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 font-medium italic">Unrated</span>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>

      {/* ADDED THE COMMENTS DRAWER HERE */}
      {commentingOnLog && (
        <CommentsDrawer 
          log={commentingOnLog} 
          currentUser={currentUser} 
          getUserMap={getUserMap} 
          onClose={() => setCommentingOnLog(null)} 
          onUpdateCount={(delta) => handleUpdateCommentCount(commentingOnLog.id, delta)}
        />
      )}
    </>
  );
}