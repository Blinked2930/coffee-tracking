import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface Props {
  kafeId: string;
  currentUser: User;
}

// You can change these to whatever emojis fit the cohort vibe!
const EMOJIS = ['🔥', '🙌', '☕️', '💯'];

export default function ReactionBar({ kafeId, currentUser }: Props) {
  const [reactions, setReactions] = useState<{ emoji: string; user_id: string }[]>([]);

  useEffect(() => {
    // 1. Fetch initial reactions for this specific kafe
    supabase.from('reactions')
      .select('emoji, user_id')
      .eq('kafe_id', kafeId)
      .then(({ data }) => {
        if (data) setReactions(data);
      });

    // 2. Listen for real-time reactions from other users
    const channel = supabase.channel(`rxn_${kafeId}`)
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'reactions', filter: `kafe_id=eq.${kafeId}` }, 
        (payload) => {
          setReactions(prev => {
            // Prevent duplicates if we already optimistic-loaded it
            const exists = prev.some(r => r.emoji === payload.new.emoji && r.user_id === payload.new.user_id);
            if (exists) return prev;
            return [...prev, payload.new as any];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [kafeId]);

  const handleReact = async (emoji: string) => {
    // Check if user already reacted with this specific emoji
    const hasReacted = reactions.some(r => r.emoji === emoji && r.user_id === currentUser.id);
    if (hasReacted) return; 

    // OPTIMISTIC UI: Show it instantly
    setReactions(prev => [...prev, { emoji, user_id: currentUser.id }]);

    // Background sync
    await supabase.from('reactions').insert({ 
      kafe_id: kafeId, 
      user_id: currentUser.id, 
      emoji 
    });
  };

  // Group and count reactions
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