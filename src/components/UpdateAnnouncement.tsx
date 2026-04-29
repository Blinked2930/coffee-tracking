import { useState, useEffect } from 'react';
import { Users, ShieldCheck, Link as LinkIcon, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-500 overflow-hidden">
        
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-50 to-white -z-10" />

        {/* The Golden Icon of Authority */}
        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-sm shadow-amber-500/10 -mt-12 relative z-10">
          <Users size={28} className="text-amber-600 drop-shadow-sm" />
        </div>

        <div className="text-center mb-6">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1.5">
            Official Release
          </p>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            Executive Communiqué
          </h3>
        </div>

        <div className="space-y-6">
          
          <p className="text-sm text-gray-600 leading-relaxed text-center font-medium px-2">
            Attention, esteemed founding member. The <strong className="text-gray-900 font-black">Cohort Network</strong> is officially live.
          </p>
          
          {/* High-Contrast "Wow" Banner */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-center shadow-lg overflow-hidden transform transition-all hover:scale-[1.02]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
            <Sparkles className="absolute -bottom-4 -right-4 text-amber-500/10 w-24 h-24 rotate-12" />
            
            <p className="text-amber-400 font-black text-lg sm:text-xl uppercase tracking-wider leading-tight drop-shadow-md mb-3 relative z-10">
              You can now invite anyone to join.
            </p>
            
            <p className="text-gray-300 text-xs font-medium leading-relaxed relative z-10">
              Full authorization granted to recruit colleagues, associates, and subordinate coffee consumers into your telemetry feed.
            </p>
          </div>
          
          {/* Actionable Link Section */}
          <div className="flex flex-col items-center justify-center p-5 bg-amber-50/50 border border-amber-100/60 rounded-2xl">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">
              Direct targets to:
            </p>
            <a 
              href="https://kafe.emmettfrett.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-base font-black text-amber-600 hover:text-amber-700 active:scale-95 transition-all bg-white px-5 py-3 rounded-xl shadow-sm border border-amber-100"
            >
              <LinkIcon size={18} />
              kafe.emmettfrett.com
            </a>
          </div>

          {/* Signature Block */}
          <div className="pt-6 border-t border-gray-100">
            <p className="text-center text-gray-400 font-bold uppercase tracking-[0.15em] text-[8px] mb-2">
              With Distinguished Regards,
            </p>
            <p className="text-center text-gray-900 font-black text-base tracking-tight">
              Emmett R. Frett
            </p>
            <p className="text-center text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Executive Visionary & Lead Architect
            </p>
          </div>

        </div>

        <button
          onClick={handleAcknowledge}
          className="w-full mt-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black rounded-xl transition-all active:scale-95 shadow-md shadow-amber-500/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
        >
          <ShieldCheck size={18} className="opacity-80" /> 
          Acknowledge & Appreciate
        </button>
      </div>
    </div>
  );
}