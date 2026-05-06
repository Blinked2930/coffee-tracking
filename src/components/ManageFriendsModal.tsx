import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { X, Search, UserPlus, Check, UserMinus, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

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

  const handleCancelRequest = async (receiverId: string) => {
    const rel = friendships.find(f => f.requester_id === currentUser.id && f.receiver_id === receiverId && f.status === 'pending');
    if (rel) {
      await supabase.from('friendships').delete().eq('id', rel.id);
      fetchFriendships();
    }
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
    setUserToUnfriend(null);
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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      
      <div className="bg-gray-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md h-[85dvh] sm:h-[700px] flex flex-col shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 relative overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* CUSTOM UNFRIEND OVERLAY */}
        {userToUnfriend && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-500" />
              
              <div className="flex justify-center mb-5 mt-2">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm border border-red-100 rotate-3">
                  <ShieldAlert size={32} />
                </div>
              </div>

              <h3 className="text-xl font-black text-center text-gray-900 mb-2 leading-tight">
                Remove Friend?
              </h3>
              <p className="text-xs text-gray-500 text-center mb-6 font-medium leading-relaxed px-2">
                <strong className="text-gray-900">{userToUnfriend.name}</strong> will be removed from your friends list. They won't be notified.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setUserToUnfriend(null)} 
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-black active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeUnfriend} 
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-500/20 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                >
                  Unfriend
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0 shadow-sm relative z-10">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Friends</h3>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Coffee Buddies</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 active:scale-95 transition-all border border-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex p-4 gap-2 shrink-0 bg-white">
          <button 
            onClick={() => setActiveTab('search')}
            className={clsx(
              "flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'search' ? "bg-gray-900 text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            )}
          >
            Find Friends
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={clsx(
              "flex-1 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all relative",
              activeTab === 'requests' ? "bg-gray-900 text-white shadow-md" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            )}
          >
            Requests
            {pendingReceived.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center shadow-sm border-2 border-white">
                {pendingReceived.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2 custom-scrollbar">
          {activeTab === 'search' && (
            <div className="space-y-5">
              <div className="relative">
                <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by name or @username..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-transparent focus:border-amber-200 rounded-2xl py-4 pl-12 pr-5 outline-none focus:ring-4 focus:ring-amber-500/10 text-sm font-medium shadow-sm transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-3 pt-2">
                {filteredUsers.map(u => {
                  const status = getFriendshipStatus(u.id);
                  const displayUsername = (u as any).username || u.name.toLowerCase().replace(/\s/g, '');
                  
                  return (
                    <div key={u.id} className="bg-white p-3.5 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:border-amber-100/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 font-black flex items-center justify-center text-lg shrink-0 border border-gray-200 shadow-inner">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-gray-900 leading-tight truncate text-sm">{u.name}</p>
                          <p className="text-[11px] font-bold text-gray-400 truncate mt-0.5 tracking-wide">@{displayUsername}</p>
                        </div>
                      </div>
                      
                      {status === 'none' && (
                        <button onClick={() => handleSendRequest(u.id)} className="shrink-0 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-amber-100 hover:text-amber-700 active:scale-95 transition-all border border-gray-100">
                          <UserPlus size={14} /> Add
                        </button>
                      )}
                      
                      {/* TOUCH-FRIENDLY UNSEND BUTTON */}
                      {status === 'sent' && (
                        <button 
                          onClick={() => handleCancelRequest(u.id)}
                          className="shrink-0 px-4 py-2.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl text-[10px] font-black transition-all border border-gray-200 hover:border-red-200 flex items-center gap-1.5 active:scale-95 uppercase tracking-widest shadow-sm"
                        >
                          <X size={14} /> Cancel
                        </button>
                      )}

                      {status === 'received' && (
                        <span className="shrink-0 text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 shadow-sm">Review</span>
                      )}
                      
                      {status === 'friends' && (
                        <button 
                          onClick={() => setUserToUnfriend(u)}
                          className="shrink-0 px-4 py-2.5 rounded-xl bg-green-50 text-green-600 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-95 transition-all border border-green-100"
                        >
                          <Check size={14} /> Friends
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
                <div className="text-center p-10 border-2 border-dashed border-gray-100 rounded-[2rem] mt-4 bg-gray-50/50">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100">
                    <Check size={24} className="text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-black text-sm tracking-tight">No Pending Requests</p>
                </div>
              ) : (
                pendingReceived.map(req => {
                  const sender = allUsers.find(u => u.id === req.requester_id);
                  if (!sender) return null;
                  
                  const displayUsername = (sender as any).username || sender.name.toLowerCase().replace(/\s/g, '');

                  return (
                    <div key={req.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-lg shadow-gray-200/40 border border-amber-100">
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-amber-400 to-amber-500 text-white font-black flex items-center justify-center text-lg shadow-md shadow-amber-500/20 border border-amber-300 shrink-0">
                          {sender.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-gray-900 leading-tight truncate">{sender.name}</p>
                          <p className="text-[11px] text-gray-400 font-bold mb-0.5 truncate tracking-wide">@{displayUsername}</p>
                          <p className="text-[8px] uppercase tracking-[0.2em] text-amber-600 font-black mt-1">Wants to connect</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAcceptRequest(req.id)}
                        className="shrink-0 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 px-5 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
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