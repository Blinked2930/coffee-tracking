import { useState, useEffect } from 'react';
import { Users, Search, UserPlus, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export default function UpdateAnnouncement({ currentUser }: { currentUser: User }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      // 1. If they've already seen it, bail out immediately
      if (localStorage.getItem('v2_update_seen') === 'true') return;

      // 2. Fetch their exact creation date from the database
      const { data } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        const createdDate = new Date(data.created_at);
        // CUTOFF: Midnight going into April 30th, 2026
        const cutoffDate = new Date('2026-04-30T00:00:00Z'); 

        if (createdDate < cutoffDate) {
          setShow(true);
        } else {
          // If they are a new user, quietly mark it as seen so it never checks again
          localStorage.setItem('v2_update_seen', 'true');
        }
      }
    };

    checkEligibility();
  }, [currentUser.id]);

  const handleAcknowledge = () => {
    localStorage.setItem('v2_update_seen', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col items-center">
        
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
          <Users size={28} className="text-amber-600" />
        </div>
        
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 text-center tracking-tight">
          Protocol Upgrade:<br/>The Cohort Network
        </h2>
        
        <p className="text-gray-500 text-center text-sm font-medium mb-8 leading-relaxed">
          The system now supports multi-user synchronization. You can now recruit coworkers and friends into your telemetry feed.
        </p>

        <div className="w-full bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">How to initialize:</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <Users size={14} className="text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Tap the <strong className="text-gray-900">Users Icon</strong> in your Feed or Leaderboard.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <Search size={14} className="text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Query their <strong className="text-amber-600">@username</strong> in the search bar.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                <UserPlus size={14} className="text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-700">Transmit a connection request.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleAcknowledge}
          className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
        >
          <CheckCircle2 size={18} /> Acknowledge Update
        </button>
      </div>
    </div>
  );
}