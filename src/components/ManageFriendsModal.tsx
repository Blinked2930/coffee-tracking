import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { X, Search, UserPlus, Check, Clock, UserMinus } from 'lucide-react';

interface Props {
  currentUser: User;
  onClose: () => void;
}

export default function ManageFriendsModal({ currentUser, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'search' | 'requests'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  
  // Custom Unfriend Confirmation State
  const [userToUnfriend, setUserToUnfriend] = useState<User | null>(null);

  useEffect(() => {
    supabase.from('users').select('*').then(({ data }) => {
      if (data) setAllUsers(data.filter(u => u.id !== currentUser.id && u.name !== 'Ghost' && u.name !== 'TestUser'));
    });
    fetchFriendships();
  }, [currentUser.id]);

  const fetchFriendships = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
    if (data) setFriendships(data);
  };

  const handleSendRequest = async (receiverId: string) => {
    await supabase.from('friendships').insert({
      requester_id: currentUser.id,
      receiver_id: receiverId,
      status: 'pending'
    });
    fetchFriendships();
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    fetchFriendships();
  };

  const executeUnfriend = async () => {
    if (!userToUnfriend) return;
    const rel = friendships.find(f => f.requester_id === userToUnfriend.id || f.receiver_id === userToUnfriend.id);
    if (rel) {
      await supabase.from('friendships').delete().eq('id', rel.id);
      fetchFriendships();
    }
    setUserToUnfriend(null); // Close the popup
  };

  const pendingReceived = friendships.filter(f => f.receiver_id === currentUser.id && f.status === 'pending');
  
  const getFriendshipStatus = (otherUserId: string) => {
    const rel = friendships.find(f => f.requester_id === otherUserId || f.receiver_id === otherUserId);
    if (!rel) return 'none';
    if (rel.status === 'accepted') return 'friends';
    if (rel.requester_id === currentUser.id) return 'sent';
    return 'received';
  };

  const searchLower = searchQuery.toLowerCase();
  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchLower) || 
    ((u as any).username && (u as any).username.toLowerCase().includes(searchLower))
  );

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      
      <div className="bg-gray-50 rounded-t-3xl sm:rounded-3xl w-full max-w-md h-[80vh] sm:h-[600px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* CUSTOM UNFRIEND OVERLAY */}
        {userToUnfriend && (
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <UserMinus size={28} />
              </div>
              <h3 className="text-xl font-black text-center text-gray-900 mb-2 leading-tight">
                Unfriend {userToUnfriend.name}?
              </h3>
              <p className="text-xs text-gray-500 text-center mb-6 font-medium leading-relaxed">
                They will be removed from your leaderboard and feed. They won't be notified.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setUserToUnfriend(null)} 
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold active:scale-95 transition-all text-sm uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeUnfriend} 
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-md shadow-red-200 active:scale-95 transition-all text-sm uppercase tracking-wider"
                >
                  Unfriend
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-black text-gray-900">Friends</h3>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Cohort Network</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-95">
            <X size={20} />
          </button>
        </div>

        <div className="flex p-4 gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'search' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'bg-white text-gray-500 border border-gray-100'}`}
          >
            Find Friends
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all relative ${activeTab === 'requests' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'bg-white text-gray-500 border border-gray-100'}`}
          >
            Requests
            {pendingReceived.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center shadow-sm">
                {pendingReceived.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative p-[2px]">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by name or @username..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500 focus:border-amber-500 text-sm font-medium shadow-sm"
                />
              </div>

              <div className="space-y-2 pt-2">
                {filteredUsers.map(u => {
                  const status = getFriendshipStatus(u.id);
                  const displayUsername = (u as any).username || u.name.toLowerCase().replace(/\s/g, '');
                  
                  return (
                    <div key={u.id} className="bg-white p-3 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-sm shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 leading-tight truncate">{u.name}</p>
                          <p className="text-[11px] font-medium text-gray-400 truncate">@{displayUsername}</p>
                        </div>
                      </div>
                      
                      {status === 'none' && (
                        <button onClick={() => handleSendRequest(u.id)} className="shrink-0 w-9 h-9 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-amber-100 hover:text-amber-600 active:scale-95 transition-all">
                          <UserPlus size={16} />
                        </button>
                      )}
                      {status === 'sent' && (
                        <div className="shrink-0 px-3 py-1 bg-gray-50 rounded-lg text-xs font-bold text-gray-400 flex items-center gap-1 uppercase tracking-wider border border-gray-100">
                          <Clock size={12} /> Sent
                        </div>
                      )}
                      {status === 'received' && (
                        <span className="shrink-0 text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-md">Check Requests</span>
                      )}
                      {status === 'friends' && (
                        <button 
                          onClick={() => setUserToUnfriend(u)}
                          className="shrink-0 w-8 h-8 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors group"
                          title="Unfriend"
                        >
                          <Check size={16} className="group-hover:hidden" />
                          <UserMinus size={16} className="hidden group-hover:block" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {pendingReceived.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-gray-200 rounded-3xl mt-4">
                  <p className="text-gray-400 font-medium text-sm">No pending requests</p>
                </div>
              ) : (
                pendingReceived.map(req => {
                  const sender = allUsers.find(u => u.id === req.requester_id);
                  if (!sender) return null;
                  
                  const displayUsername = (sender as any).username || sender.name.toLowerCase().replace(/\s/g, '');

                  return (
                    <div key={req.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-white font-black flex items-center justify-center text-lg shadow-sm border-2 border-white shrink-0">
                          {sender.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 leading-tight truncate">{sender.name}</p>
                          <p className="text-[11px] text-gray-400 font-medium mb-0.5 truncate">@{displayUsername}</p>
                          <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mt-1">Wants to connect</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAcceptRequest(req.id)}
                        className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-amber-200 active:scale-95 transition-all"
                      >
                        Accept
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}