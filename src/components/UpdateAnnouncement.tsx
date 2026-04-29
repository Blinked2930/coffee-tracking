import { useState, useEffect } from 'react';
import { Users, Search, UserPlus, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
        
        {/* The Golden Icon of Authority */}
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm -mt-12 relative z-10">
          <Users size={28} className="text-amber-600" />
        </div>

        <h3 className="text-xl font-black text-center text-gray-900 mb-3 uppercase tracking-tighter">
          Executive Communiqué
        </h3>

        <div className="bg-gray-50 rounded-2xl p-5 border border-amber-100/50 mb-6 shadow-inner">
          <div className="space-y-4 text-xs text-gray-600 leading-relaxed font-medium">
            <p>
              Attention, esteemed founding member. Our global infrastructure specialists have successfully deployed an unprecedented architectural expansion to your prestigious telemetry suite.
            </p>
            <p>
              The system now supports seamless multi-user synchronization, officially classified as <strong>The Cohort Network</strong>. You are now authorized to recruit colleagues, associates, and subordinate coffee consumers into your localized feed.
            </p>
            
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mt-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">
                Execution Protocol:
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users size={14} className="text-amber-600 shrink-0" />
                  <p className="text-[11px] text-gray-700">Access the <strong className="text-gray-900">Network Node</strong> (Users Icon) in your Feed.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Search size={14} className="text-amber-600 shrink-0" />
                  <p className="text-[11px] text-gray-700">Query your target via their unique <strong className="text-gray-900">@username</strong>.</p>
                </div>
                <div className="flex items-center gap-3">
                  <UserPlus size={14} className="text-amber-600 shrink-0" />
                  <p className="text-[11px] text-gray-700">Transmit a formalized <strong className="text-gray-900">Connection Request</strong>.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-center text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                With Distinguished Regards,
              </p>
              <p className="text-center text-amber-600 font-black text-sm tracking-tight mt-1">
                Emmett R. Frett
              </p>
              <p className="text-center text-[9px] text-gray-400 font-bold uppercase -mt-1">
                Executive Visionary & Lead Architect
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleAcknowledge}
          className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-2xl transition-all active:scale-[0.98] shadow-sm uppercase tracking-widest text-xs flex items-center justify-center gap-2"
        >
          <ShieldCheck size={16} /> Acknowledge & Appreciate
        </button>
      </div>
    </div>
  );
}