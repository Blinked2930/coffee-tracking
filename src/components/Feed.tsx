import React from 'react';
import { KafeLog, User } from '../types';
import { Coffee, MapPin, Clock } from 'lucide-react';

interface FeedProps {
  logs: KafeLog[];
  getUserMap: (id: string) => User | undefined;
}

export default function Feed({ logs, getUserMap }: FeedProps) {
  if (logs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Coffee size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No Kafes yet!</h3>
        <p className="text-gray-500 mt-2">Be the first to log a coffee date.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Kafes</h2>
      {logs.map((log) => {
        const user = getUserMap(log.user_id);
        
        // Simple mock formatting since we don't have date-fns installed
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
                <p className="font-bold text-gray-900">{user?.name}</p>
                <div className="flex items-center text-gray-400 text-xs gap-1">
                  <Clock size={12} />
                  <span>{dateStr}, {timeStr}</span>
                </div>
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
