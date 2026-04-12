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
    <div className="p-6 space-y-4 pb-24">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{t('recentKafes')}</h2>
      {logs.map((log) => {
        const user = getUserMap(log.user_id);
        
        const date = new Date(log.created_at);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

        return (
          <div key={log.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4">
            {/* Avatar block */}
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-lg flex-shrink-0">
              {user?.name.charAt(0) || '?'}
            </div>
            
            {/* Content block */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <p className="font-bold text-gray-900">{user?.name}</p>
                  <div className="flex items-center text-gray-400 text-xs gap-1">
                    <Clock size={12} />
                    <span>{dateStr}, {timeStr}</span>
                  </div>
                </div>
                {currentUser?.id === log.user_id && (
                  <button onClick={() => setEditingLog(log)} className="text-gray-400 hover:text-amber-500 p-2 -mr-3 -mt-2 active:scale-95 transition-transform">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              
              <p className="text-gray-600 text-sm">
                Had a <span className="font-semibold text-amber-600">{log.type}</span>
              </p>

              {log.location && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 font-medium">
                  <MapPin size={12} />
                  <span>{log.location}</span>
                </div>
              )}
              
              {log.notes && (
                <p className="mt-2 text-sm text-gray-500 italic bg-gray-50 p-2 rounded-lg border-l-2 border-amber-200">
                  "{log.notes}"
                </p>
              )}
              
              {log.photo_url && (
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                  <img 
                    src={log.photo_url} 
                    alt="Kafe moment" 
                    className="w-full h-auto max-h-60 object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Actions Footer (Rating & Comments) */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-0.5">
                  {log.rating ? [...Array(log.rating)].map((_, i) => (
                    <span key={i} className="text-lg drop-shadow-sm leading-none">☕️</span>
                  )) : <span className="text-xs text-gray-300 font-medium italic">Unrated</span>}
                </div>
                
                <button 
                  onClick={() => setCommentingOnLog(log)}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-amber-500 transition-colors active:scale-95 px-2 py-1 bg-gray-50 rounded-lg"
                >
                  <MessageCircle size={14} />
                  <span className="text-xs font-bold uppercase tracking-widest">Comment</span>
                </button>
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