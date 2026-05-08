import { useState, useEffect } from 'react';
import { User } from '../types';
import { Trophy, Medal, Award, Users, Lock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import UserProfileDrawer from './UserProfileDrawer';
import ManageFriendsModal from './ManageFriendsModal';
import { supabase } from '../lib/supabase';

interface LeaderboardProps {
  currentUser: User;
  getUserMap: (id: string) => User | undefined; 
}

export default function Leaderboard({ currentUser, getUserMap }: LeaderboardProps) {
  const { t } = useLanguage();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [globalScores, setGlobalScores] = useState<any[]>([]);
  const [monthlyScores, setMonthlyScores] = useState<any[]>([]);
  
  const [viewMode, setViewMode] = useState<'friends' | 'monthly' | 'global'>('friends');
  const [friendships, setFriendships] = useState<any[]>([]);
  const [showFriendsModal, setShowFriendsModal] = useState(false);

  const fetchData = async () => {
    // 1. Fetch All-Time Global Scores
    const { data: scores } = await supabase
      .from('leaderboard_scores')
      .select('*')
      .order('total_kafes', { ascending: false });
      
    if (scores) {
      setGlobalScores(scores.filter(user => user.name !== 'Ghost' && user.name !== 'TestUser'));
    }

    // 2. Fetch Rolling 30-Day Global Scores
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentKafes } = await supabase
      .from('kafes')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentKafes && recentKafes.length > 0) {
      const counts: Record<string, number> = {};
      recentKafes.forEach(log => {
        counts[log.user_id] = (counts[log.user_id] || 0) + 1;
      });

      const userIds = Object.keys(counts);
      const { data: usersData } = await supabase.from('users').select('id, name').in('id', userIds);
      const userMap = new Map(usersData?.map(u => [u.id, u.name]) || []);

      const monthlyRanked = userIds.map(uid => ({
        user_id: uid,
        total_kafes: counts[uid],
        name: userMap.get(uid) || 'Unknown'
      }))
      .filter(u => u.name !== 'Unknown' && u.name !== 'Ghost' && u.name !== 'TestUser')
      .sort((a, b) => b.total_kafes - a.total_kafes);

      setMonthlyScores(monthlyRanked);
    }

    // 3. Fetch Friendships
    const { data: friends } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
      
    if (friends) setFriendships(friends);
  };

  useEffect(() => {
    fetchData();
  }, [currentUser.id, showFriendsModal]);

  const acceptedFriendIds = friendships
    .filter(f => f.status === 'accepted')
    .map(f => f.requester_id === currentUser.id ? f.receiver_id : f.requester_id);

  let visibleUsers = [];
  if (viewMode === 'friends') {
    visibleUsers = globalScores.filter(u => acceptedFriendIds.includes(u.user_id) || u.user_id === currentUser.id);
  } else if (viewMode === 'monthly') {
    visibleUsers = monthlyScores.slice(0, 5);
  } else {
    visibleUsers = globalScores.slice(0, 5);
  }

  const maxCount = Math.max(...visibleUsers.map(u => Number(u.total_kafes) || 0), 1);

  return (
    <div className="p-4 sm:p-6 pb-24">
      
      <div className="mb-6 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">{t('leaderboard')}</h2>
            <p className="text-sm text-gray-500">{t('leaderboardSub')}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowFriendsModal(true)}
          className="w-12 h-12 bg-white border border-gray-100 text-gray-600 rounded-2xl flex flex-col items-center justify-center shadow-sm hover:border-amber-200 active:scale-95 transition-all relative shrink-0"
        >
          <Users size={20} />
          {friendships.some(f => f.receiver_id === currentUser.id && f.status === 'pending') && (
            <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      <div className="flex bg-gray-200/50 p-1 rounded-xl mb-6">
        <button
          onClick={() => setViewMode('friends')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewMode === 'friends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          My Friends
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Rolling 30
        </button>
        <button
          onClick={() => setViewMode('global')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${viewMode === 'global' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All-Time
        </button>
      </div>

      <div className="space-y-3 pb-20">
        {visibleUsers.length === 0 && viewMode === 'friends' && (
          <div className="text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200">
            <Users size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium text-sm">You haven't added any friends yet.</p>
            <button onClick={() => setShowFriendsModal(true)} className="mt-4 text-amber-600 font-bold text-sm">Find Friends</button>
          </div>
        )}

        {visibleUsers.length === 0 && viewMode === 'monthly' && (
          <div className="text-center p-8 bg-white rounded-3xl border border-dashed border-gray-200">
            <Trophy size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium text-sm">No kafes logged in the last 30 days!</p>
          </div>
        )}

        {visibleUsers.map((user, index) => {
          let RankIcon = null;
          if (index === 0) RankIcon = <Trophy size={20} className="text-yellow-500" />;
          if (index === 1) RankIcon = <Medal size={20} className="text-gray-400" />;
          if (index === 2) RankIcon = <Award size={20} className="text-amber-700" />;

          const isFriendOrMe = acceptedFriendIds.includes(user.user_id) || user.user_id === currentUser.id;

          return (
            <div 
              key={user.user_id} 
              className="relative group cursor-pointer" 
              onClick={() => {
                if (isFriendOrMe) {
                  setSelectedUser({ id: user.user_id, name: user.name, pin: '' } as User);
                }
              }}
            >
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 relative z-10 transition-transform active:scale-[0.98] hover:border-amber-200">
                <div className="w-8 flex justify-center font-bold text-gray-400">
                  {RankIcon || (index + 1)}
                </div>

                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-bold flex items-center justify-center text-sm flex-shrink-0">
                  {user.name?.charAt(0) || '?'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-1 gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-gray-900 truncate">{user.name}</span>
                      
                      {/* ADDED 'YOU' BADGE */}
                      {user.user_id === currentUser.id && (
                        <span className="ml-1 text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                          You
                        </span>
                      )}
                      
                      {!isFriendOrMe && <Lock size={14} strokeWidth={2.5} className="text-gray-400 shrink-0" />}
                    </div>
                    <span className="font-black text-amber-600 tabular-nums shrink-0">{Number(user.total_kafes)}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(Number(user.total_kafes) / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {index === 0 && (
                <div className="absolute inset-0 bg-yellow-400/20 rounded-2xl blur-xl -z-10" />
              )}
            </div>
          );
        })}
      </div>

      {selectedUser && (
        <UserProfileDrawer 
          user={selectedUser} 
          currentUser={currentUser}
          getUserMap={getUserMap} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

      {showFriendsModal && (
        <ManageFriendsModal 
          currentUser={currentUser} 
          onClose={() => setShowFriendsModal(false)} 
        />
      )}
    </div>
  );
}