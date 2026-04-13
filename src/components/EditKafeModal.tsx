import { useState, useRef } from 'react';
import { KafeLog } from '../types';
import { supabase } from '../lib/supabase';
import { compressImage } from '../lib/imageUtils';
import { MapPin, Type, Trash2, X, Camera, AlertTriangle } from 'lucide-react';
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [deletePhoto, setDeletePhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    let finalPhotoUrl = deletePhoto ? null : log.photo_url;
    
    if (photoFile) {
      const compressedFile = await compressImage(photoFile);
      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${log.user_id}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('kafes')
        .upload(fileName, compressedFile);
        
      if (!uploadError && uploadData) {
        finalPhotoUrl = supabase.storage.from('kafes').getPublicUrl(fileName).data.publicUrl;
      }
    }

    await supabase.from('kafes').update({
      location: location || null,
      notes: notes || null,
      rating: rating > 0 ? rating : null,
      photo_url: finalPhotoUrl
    }).eq('id', log.id);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    await supabase.from('kafes').delete().eq('id', log.id);
    onClose();
  };

  return (
    {/* The dark backdrop: Clicking here triggers onClose */}
    <div 
      className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity"
      onClick={onClose}
    >
      {/* The white modal box: stopPropagation prevents the click from reaching the dark backdrop */}
      <div 
        className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-2">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-gray-900 mb-6">{t('editKafe')}</h3>
        
        {showDeleteConfirm ? (
          <div className="animate-in fade-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-1">
                <AlertTriangle size={26} className="text-red-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">Delete this Kafe?</p>
              <p className="text-sm text-gray-400">This can't be undone.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 p-4 rounded-xl bg-gray-100 text-gray-600 font-bold active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 p-4 rounded-xl bg-red-500 text-white font-bold active:scale-95 transition-all shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
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

            {(!deletePhoto && log.photo_url && !photoFile) ? (
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <img src={log.photo_url} className="w-10 h-10 object-cover rounded-lg border border-gray-200" alt="Kafe" />
                 <span className="text-sm text-gray-600 font-medium flex-1">{t('photoAttached')}</span>
                 <button 
                   onClick={() => setDeletePhoto(true)} 
                   className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
            ) : (
              <div className="flex gap-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={e => {
                    setPhotoFile(e.target.files?.[0] || null);
                    setDeletePhoto(false);
                  }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl font-medium active:scale-95 transition-all text-sm",
                    photoFile ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-gray-600"
                  )}
                >
                  <Camera size={18} className="text-amber-500 flex-shrink-0" /> 
                  {photoFile ? t('photoAttached') : t('uploadPhoto')}
                </button>
              </div>
            )}
            
            <div className="pt-4 flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
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
        )}
      </div>
    </div>
  );
}