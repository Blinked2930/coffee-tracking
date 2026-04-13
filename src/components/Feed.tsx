import { useState } from 'react';
import { KafeLog, User } from '../types';
import { Coffee, MapPin, Clock, Pencil, MessageCircle } from 'lucide-react';
import EditKafeModal from './EditKafeModal';
import CommentsDrawer from './CommentsDrawer';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedProps {
  logs: KafeLog[];
  getUserMap: (id: string) => User | undefined;
  currentUser: User;
}

export default function Feed({ logs, getUserMap, currentUser }: FeedProps) {
  const { t } = useLanguage();
  const [editingLog, setEditingLog] = useState<KafeLog | null>(null);
  const [commentingOnLog, setCommentingOnLog] = useState<KafeLog | null>(null);

  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Coffee size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{t('emptyFeed')}</h3>
        <p className="text-gray-500 mt-2">{t('beFirst')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-24 overflow-x-hidden bg-gray-50">
      <h2 className="text-2xl font-black text-gray-900 mb-2 px-2">{t('recentKafes')}</h2>
      
      {logs.map((log) => {
        const user = getUserMap(log.user_id);
        
        const date = new Date(log.created_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

        return (
          <div key={log.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80 flex gap-3.5 w-full">
            
            {/* Avatar block */}
            <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-lg flex-shrink-0 border border-amber-100/50">
              {user?.name.charAt(0) || '?'}
            </div>
            
            {/* Content block */}
            <div className="flex-1 min-w-0 pt-0.5">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-1 gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                    {dateStr} at {timeStr}
                  </p>
                </div>
                {currentUser?.id === log.user_id && (
                  <button onClick={() => setEditingLog(log)} className="shrink-0 text-gray-300 hover:text-amber-500 p-1.5 -mr-2 -mt-1.5 active:scale-95 transition-transform">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              
              {/* Drink Type Badge */}
              <div className="inline-block mt-2 mb-2 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-100/50">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                  {log.type.replace(/_/g, ' ')}
                </p>
              </div>

              {/* Location */}
              {log.location && (
                <div className="flex items-center gap-1 mb-2 text-[11px] text-gray-500 font-medium">
                  <MapPin size={12} className="shrink-0 text-gray-400" />
                  <span className="truncate">{log.location}</span>
                </div>
              )}
              
              {/* Notes - Redesigned as a soft bubble */}
              {log.notes && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100/50 leading-relaxed">
                  {log.notes}
                </div>
              )}
              
              {/* Photo */}
              {log.photo_url && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100/80 shadow-sm">
                  <img 
                    src={log.photo_url} 
                    alt="Kafe moment" 
                    className="w-full h-auto max-h-72 object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* REDESIGNED ACTION BAR: Left aligned, grouped, no heavy backgrounds */}
              <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-50">
                
                {/* Comment Button */}
                <button 
                  onClick={() => setCommentingOnLog(log)}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-amber-500 transition-colors active:scale-95 group"
                >
                  <MessageCircle size={18} className="group-hover:fill-amber-50 transition-all" />
                  <span className="text-sm font-bold">{(log as any).comment_count || 0}</span>
                </button>

                {/* Rating Cups */}
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
          </div>
        );
      })}
      
      {editingLog && <EditKafeModal log={editingLog} onClose={() => setEditingLog(null)} />}
      
      {commentingOnLog && (
        <CommentsDrawer 
          log={commentingOnLog} 
          currentUser={currentUser} 
          getUserMap={getUserMap} 
          onClose={() => setCommentingOnLog(null)} 
        />
      )}
    </div>
  );
}