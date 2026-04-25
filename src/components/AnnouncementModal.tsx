import { Wrench } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function AnnouncementModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
        
        {/* Playful overlapping icon header */}
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm -mt-12 relative z-10">
          <Wrench size={28} className="text-amber-600" />
        </div>

        <h3 className="text-xl font-black text-center text-gray-900 mb-3">
          Official Bulletin
        </h3>

        <div className="bg-gray-50 rounded-2xl p-4 border border-amber-100/50 mb-6 shadow-inner">
          <p className="text-sm text-gray-600 leading-relaxed text-center italic">
            "Apologies all. Our advanced tech team with international support received complaints of inaccurate data across multiple users. We are working around the clock to ensure that our users are satisfied as always. We have pinpointed the problem and are working on it currently."
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-2xl transition-all active:scale-[0.98] shadow-sm uppercase tracking-widest text-sm"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}