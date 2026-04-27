import { useState, useEffect, useRef } from 'react';
import { KafeLog, User, Comment } from '../types';
import { supabase } from '../lib/supabase';
import { X, Send } from 'lucide-react';
import clsx from 'clsx';

interface CommentsDrawerProps {
  log: KafeLog;
  currentUser: User;
  getUserMap: (id: string) => User | undefined;
  onClose: () => void;
  onUpdateCount?: (delta: number) => void;
}

export default function CommentsDrawer({ log, currentUser, getUserMap, onClose, onUpdateCount }: CommentsDrawerProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const logOwner = getUserMap(log.user_id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Fetch initial comments
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('kafe_id', log.id)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setComments(data);
      }
    };
    fetchComments();

    // 2. Listen for real-time comments from other users
    const channel = supabase.channel(`comments_for_${log.id}`)
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `kafe_id=eq.${log.id}` }, 
        (payload) => {
          setComments((current) => {
            if (current.find(c => c.id === payload.new.id)) return current;
            return [...current, payload.new as Comment];
          });
        }
      )
      .on(
        'postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `kafe_id=eq.${log.id}` }, 
        (payload) => {
          setComments((current) => current.filter(c => c.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: `kafe_id=eq.${log.id}` }, 
        (payload) => {
          setComments((current) => current.map(c => c.id === payload.new.id ? payload.new as Comment : c));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [log.id]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || isSubmitting) return;
    
    setIsSubmitting(true);
    setNewComment('');

    // OPTIMISTIC UI: Instantly add the comment to the screen
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId as any,
      kafe_id: log.id,
      user_id: currentUser.id,
      content: content,
      created_at: new Date().toISOString()
    };
    
    setComments(prev => [...prev, optimisticComment]);
    
    // Instantly update the counter on the Feed behind the drawer
    if (onUpdateCount) onUpdateCount(1); 

    // Background sync with database
    const { data, error } = await supabase.from('comments').insert({
      kafe_id: log.id,
      user_id: currentUser.id,
      content: content
    }).select().single();

    if (!error && data) {
      setComments(prev => prev.map(c => c.id === tempId ? data : c));
    } else {
      setComments(prev => prev.filter(c => c.id !== tempId));
      if (onUpdateCount) onUpdateCount(-1);
    }
    
    setIsSubmitting(false);
  };

  const handleEdit = async (comment: Comment) => {
    // Remove the flag so they edit the raw text
    const rawText = comment.content.replace(' (edited)', '');
    const editedContent = window.prompt("Edit your comment:", rawText);
    
    if (editedContent && editedContent.trim() !== "" && editedContent.trim() !== rawText) {
      // Append the flag secretly to the string so the database saves it
      const newContent = editedContent.trim() + " (edited)";
      
      setComments(prev => prev.map(c => c.id === comment.id ? { ...c, content: newContent } : c));
      await supabase.from('comments').update({ content: newContent }).eq('id', comment.id);
    }
  };

  const handleDelete = async (id: string) => {
    setComments(prev => prev.filter(c => c.id !== id));
    if (onUpdateCount) onUpdateCount(-1); 
    await supabase.from('comments').delete().eq('id', id);
  };

  return (
    <>
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] transition-opacity" onClick={onClose} />
      
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 rounded-t-[2.5rem] shadow-2xl z-[70] flex flex-col h-[75vh] w-full max-w-2xl mx-auto border-t border-gray-100 overflow-hidden animate-in slide-in-from-bottom-full duration-300">
        
        {/* Header */}
        <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-black text-gray-900">Comments</h3>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-95">
              <X size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            On {logOwner?.name}'s {log.type.replace(/_/g, ' ')}
          </p>
        </div>

        {/* Comment List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
          {comments.length === 0 ? (
            <div className="text-center text-gray-400 text-sm font-medium pt-10">
              Be the first to comment!
            </div>
          ) : (
            comments.map(comment => {
              const user = getUserMap(comment.user_id);
              const isMe = comment.user_id === currentUser.id;
              
              // Logic to extract the edited flag
              const isEdited = comment.content.endsWith(' (edited)');
              const displayContent = isEdited ? comment.content.replace(' (edited)', '') : comment.content;
              
              return (
                <div key={comment.id} className={clsx("flex gap-3 max-w-[85%]", isMe ? "ml-auto flex-row-reverse" : "")}>
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs shrink-0 mt-1">
                    {user?.name.charAt(0) || '?'}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className={clsx("px-3 py-2.5 rounded-2xl text-sm", isMe ? "bg-amber-500 text-white rounded-tr-sm shadow-sm" : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm")}>
                      {!isMe && <p className="font-bold text-[11px] mb-0.5 opacity-60">{user?.name}</p>}
                      <p className="leading-snug">
                        {displayContent}
                        {isEdited && (
                          <span className={clsx("text-[10px] ml-1.5 italic", isMe ? "text-amber-200" : "text-gray-400")}>
                            edited
                          </span>
                        )}
                      </p>
                    </div>
                    
                    {/* Sleek Action Buttons */}
                    {isMe && (
                      <div className="flex gap-2 justify-end mt-1 px-1">
                        <button 
                          onClick={() => handleEdit(comment)} 
                          className="text-[10px] text-gray-400/70 hover:text-amber-500 font-medium lowercase tracking-wide transition-colors active:scale-95"
                        >
                          edit
                        </button>
                        <span className="text-[10px] text-gray-300/50">•</span>
                        <button 
                          onClick={() => handleDelete(comment.id as string)} 
                          className="text-[10px] text-gray-400/70 hover:text-red-500 font-medium lowercase tracking-wide transition-colors active:scale-95"
                        >
                          delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-t border-gray-100 pb-safe shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-gray-100 rounded-full px-5 py-3 pr-12 outline-none text-sm focus:ring-2 focus:ring-amber-500 transition-all"
            />
            <button 
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="absolute right-1 top-1 bottom-1 aspect-square bg-amber-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-all active:scale-95"
            >
              <Send size={16} className="-ml-0.5 mt-0.5" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}