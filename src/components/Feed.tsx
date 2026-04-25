import { useState } from 'react';
import { KafeLog, User } from '../types';
import { Coffee, MapPin, Pencil, MessageCircle } from 'lucide-react';
import EditKafeModal from './EditKafeModal';
import CommentsDrawer from './CommentsDrawer';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedProps {
  logs: KafeLog[];
  getUserMap: (id: string) => User | undefined;
  currentUser: User;
  onLoadMore: () => void;
  hasMore: boolean;
}

export default function Feed({ logs, getUserMap, currentUser, onLoadMore, hasMore }: FeedProps) {
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
          <div key={log.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100/80 flex flex-col w-full">
            
            <div className="flex justify-between items-center mb-4 gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-lg flex-shrink-0 border border-amber-100/50">
                  {user?.name.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate leading-tight">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 font-medium truncate mt-0.5">
                    {dateStr} at {timeStr}
                  </p>
                </div>
              </div>
              
              {currentUser?.id === log.user_id && (
                <button onClick={() => setEditingLog(log)} className="shrink-0 text-gray-300 hover:text-amber-500 p-2 -mt-2 -mr-2 active:scale-95 transition-transform">
                  <Pencil size={14} />
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-100/50 inline-flex">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                  {log.type.replace(/_/g, ' ')}
                </p>
              </div>
              
              {log.location && (
                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                  <MapPin size={12} className="shrink-0 text-gray-400" />
                  <span className="truncate">{log.location}</span>
                </div>
              )}
            </div>
            
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
            
            <div className="flex items-center gap-6 mt-1 pt-4 border-t border-gray-50">
              
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
      })}

      {/* LOAD MORE BUTTON */}
      {hasMore && (
        <button 
          onClick={onLoadMore}
          className="w-full py-4 mt-6 bg-white rounded-3xl font-black text-amber-600 shadow-sm border border-amber-100/50 active:scale-[0.98] transition-transform uppercase tracking-widest text-xs"
        >
          Load Older Kafes
        </button>
      )}
      
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