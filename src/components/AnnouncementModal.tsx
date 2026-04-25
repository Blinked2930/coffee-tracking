import { Wrench } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function AnnouncementModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
        
        {/* The Golden Wrench of Authority */}
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm -mt-12 relative z-10">
          <Wrench size={28} className="text-amber-600" />
        </div>

        <h3 className="text-xl font-black text-center text-gray-900 mb-3 uppercase tracking-tighter">
          Executive Communiqué
        </h3>

        <div className="bg-gray-50 rounded-2xl p-5 border border-amber-100/50 mb-6 shadow-inner">
          <div className="space-y-4 text-xs text-gray-600 leading-relaxed font-medium">
            <p>
              We deeply regret any minor disturbance to your prestigious data-logging experience. Our elite architectural consultants and global infrastructure specialists have identified a localized anomaly in the proprietary coffee-tracking algorithms.
            </p>
            <p>
              We have since mobilized our full executive resources to rectify this suboptimal event. Rest assured, your data remains as secure as my own reputation. Please accept this formal acknowledgment as a gesture of our continued commitment to your excellence.
            </p>
            <p className="text-center pt-2 text-gray-400 font-bold uppercase tracking-widest text-[9px]">
              With Distinguished Regards,
            </p>
            <p className="text-center text-amber-600 font-black text-sm tracking-tight">
              Emmett R. Frett
            </p>
            <p className="text-center text-[9px] text-gray-400 font-bold uppercase -mt-2">
              Executive Visionary & Lead Architect
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-2xl transition-all active:scale-[0.98] shadow-sm uppercase tracking-widest text-xs"
        >
          Acknowledge & Appreciate
        </button>
      </div>
    </div>
  );
}