import React from 'react';
import { KafeLog, User } from '../types';
import { Trophy, Medal, Award } from 'lucide-react';

interface LeaderboardProps {
  logs: KafeLog[];
  users: User[];
}

export default function Leaderboard({ logs, users }: LeaderboardProps) {
  // Aggregate counts
  const counts = logs.reduce((acc, log) => {
    acc[log.user_id] = (acc[log.user_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort users
  const rankedUsers = [...users]
    .map(user => ({ ...user, count: counts[user.id] || 0 }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...rankedUsers.map(u => u.count), 1);

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
          <Trophy size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Leaderboard</h2>
          <p className="text-sm text-gray-500">Who is vibrating the most?</p>
        </div>
      </div>

      <div className="space-y-4">
        {rankedUsers.map((user, index) => {
          const isTop3 = index < 3;
          let RankIcon = null;
          if (index === 0) RankIcon = <Trophy size={20} className="text-yellow-500" />;
          if (index === 1) RankIcon = <Medal size={20} className="text-gray-400" />;
          if (index === 2) RankIcon = <Award size={20} className="text-amber-700" />;

          return (
            <div key={user.id} className="relative group">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 relative z-10 transition-transform active:scale-[0.98]">
                {/* Rank number or icon */}
                <div className="w-8 flex justify-center font-bold text-gray-400">
                  {RankIcon || (index + 1)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                  {user.name.charAt(0)}
                </div>
                
                {/* Name & Bar */}
                <div className="flex-1">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-gray-900">{user.name}</span>
                    <span className="font-black text-amber-600 tabular-nums">{user.count}</span>
                  </div>
                  {/* Visual Bar */}
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(user.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Highlight drop shadow for winner */}
              {index === 0 && (
                <div className="absolute inset-0 bg-yellow-400/20 rounded-2xl blur-xl -z-10" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
