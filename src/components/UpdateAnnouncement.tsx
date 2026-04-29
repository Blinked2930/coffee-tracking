import { useState, useEffect } from 'react';
import { Users, ShieldCheck, Link as LinkIcon, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export default function UpdateAnnouncement({ currentUser }: { currentUser: User }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      if (localStorage.getItem('v2_update_seen') === 'true') return;

      const { data } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', currentUser.id)
        .single();

      if (data) {
        const createdDate = new Date(data.created_at);
        // UPDATED CUTOFF: Pinpointed to exactly when the update went live (April 29)
        const cutoffDate = new Date('2026-04-29T12:00:00Z'); 

        if (createdDate < cutoffDate) {
          setShow(true);
        } else {
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
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] overflow-hidden border border-white/20">
        <div className="flex-1 overflow-y-auto p-8 pt-10 relative">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[2rem] flex items-center justify-center shadow-lg shadow-amber-500/30 rotate-3">
              <Users size={36} className="text-white drop-shadow-md" />
            </div>
          </div>

          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-3 border border-amber-100">
              Legacy Release
            </span>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
              Executive<br/>Communiqué
            </h3>
          </div>

          <div className="space-y-8">
            <p className="text-sm text-gray-500 leading-relaxed text-center font-medium">
              Attention, esteemed founding member. The <strong className="text-gray-900">Cohort Network</strong> is officially live.
            </p>
            
            <div className="relative bg-gray-900 rounded-3xl p-6 text-center shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />
              <Sparkles className="absolute -bottom-2 -right-2 text-white/5 w-24 h-24" />
              
              <p className="text-amber-400 font-black text-lg uppercase tracking-tight mb-2 relative z-10">
                Network Gates Open.
              </p>
              
              <p className="text-gray-400 text-[11px] font-medium leading-relaxed relative z-10">
                You are now authorized to recruit anyone to join your telemetry feed.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3">
                Expansion Link
              </p>
              <div className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-2xl border border-gray-100 shadow-sm font-black text-amber-600 text-sm">
                <LinkIcon size={16} />
                kafe.emmettfrett.com
              </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-gray-400 font-bold uppercase tracking-[0.1em] text-[8px] mb-1">
                Distinguished Regards,
              </p>
              <p className="text-gray-900 font-black text-lg tracking-tight">
                Emmett R. Frett
              </p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                Executive Visionary & Architect
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 bg-white/80 backdrop-blur-sm border-t border-gray-50">
          <button
            onClick={handleAcknowledge}
            className="w-full py-5 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all active:scale-[0.97] shadow-xl flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
          >
            <ShieldCheck size={18} className="text-amber-500" /> 
            Acknowledge & Appreciate
          </button>
        </div>
      </div>
    </div>
  );
}