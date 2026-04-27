import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface Props {
  kafeId: string;
  currentUser: User;
}

const EMOJIS = ['🔥', '🙌', '☕️', '💯'];

export default function ReactionBar({ kafeId, currentUser }: Props) {
  const [reactions, setReactions] = useState<{ emoji: string; user_id: string }[]>([]);

  useEffect(() => {
    supabase.from('reactions')
      .select('emoji, user_id')
      .eq('kafe_id', kafeId)
      .then(({ data }) => {
        if (data) setReactions(data);
      });

    const channel = supabase.channel(`rxn_${kafeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions', filter: `kafe_id=eq.${kafeId}` }, (payload) => {
          setReactions(prev => {
            const exists = prev.some(r => r.emoji === payload.new.emoji && r.user_id === payload.new.user_id);
            if (exists) return prev;
            return [...prev, payload.new as any];
          });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reactions', filter: `kafe_id=eq.${kafeId}` }, (payload) => {
          setReactions(prev => prev.filter(r => !(r.emoji === payload.old.emoji && r.user_id === payload.old.user_id)));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kafeId]);

  const handleReact = async (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji && r.user_id === currentUser.id);

    if (existingReaction) {
      // UN-REACT (Optimistic Delete)
      setReactions(prev => prev.filter(r => !(r.emoji === emoji && r.user_id === currentUser.id)));
      await supabase.from('reactions')
        .delete()
        .eq('kafe_id', kafeId)
        .eq('user_id', currentUser.id)
        .eq('emoji', emoji);
    } else {
      // REACT (Optimistic Insert)
      setReactions(prev => [...prev, { emoji, user_id: currentUser.id }]);
      await supabase.from('reactions').insert({ 
        kafe_id: kafeId, 
        user_id: currentUser.id, 
        emoji 
      });
    }
  };

  const counts = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-wrap gap-2 mt-3 mb-1">
      {EMOJIS.map(emoji => {
        const count = counts[emoji] || 0;
        const iReacted = reactions.some(r => r.emoji === emoji && r.user_id === currentUser.id);
        
        return (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
              iReacted 
                ? 'bg-amber-100 text-amber-800 border border-amber-200 shadow-sm' 
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <span className="text-sm">{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}