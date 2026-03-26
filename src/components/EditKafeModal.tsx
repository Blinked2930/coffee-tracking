import { useState } from 'react';
import { KafeLog } from '../types';
import { supabase } from '../lib/supabase';
import { MapPin, Type, Trash2, X } from 'lucide-react';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  log: KafeLog;
  onClose: () => void;
}

export default function EditKafeModal({ log, onClose }: Props) {
  const { t } = useLanguage();
  const [location, setLocation] = useState(log.location || '');
  const [notes, setNotes] = useState(log.notes || '');
  const [rating, setRating] = useState(log.rating || 0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await supabase.from('kafes').update({
      location: location || null,
      notes: notes || null,
      rating: rating > 0 ? rating : null
    }).eq('id', log.id);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this Kafe?")) {
      await supabase.from('kafes').delete().eq('id', log.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-2">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-6">{t('editKafe')}</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-xl flex flex-col items-center gap-3 border border-amber-100/50 shadow-inner">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('rateKafe')}</span>
            <div className="flex justify-between w-full px-1">
              {[1,2,3,4,5,6,7,8].map(num => (
                <button 
                  key={num} 
                  onClick={() => setRating(num === rating ? 0 : num)} 
                  className={clsx(
                    "text-2xl transition-all active:scale-75", 
                    rating >= num ? "opacity-100 scale-110 drop-shadow-sm saturate-150" : "grayscale opacity-30 hover:opacity-60"
                  )}
                >
                  ☕️
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl focus-within:ring-2 focus-within:ring-amber-500 transition-all">
            <MapPin className="text-amber-500" size={20} />
            <input 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              placeholder={t('cafeName')} 
              className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400" 
            />
          </div>
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl focus-within:ring-2 focus-within:ring-amber-500 transition-all">
            <Type className="text-amber-500" size={20} />
            <input 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder={t('notes')} 
              className="bg-transparent outline-none w-full text-gray-800 placeholder:text-gray-400" 
            />
          </div>
          
          <div className="pt-4 flex gap-3">
            <button 
              onClick={handleDelete} 
              className="flex-1 p-4 rounded-xl bg-red-50 text-red-600 font-bold active:scale-95 transition-all flex justify-center items-center"
            >
              <Trash2 size={20}/>
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="flex-[3] p-4 rounded-xl bg-amber-400 text-amber-900 font-bold active:scale-95 transition-all shadow-sm"
            >
              {isSaving ? '...' : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
