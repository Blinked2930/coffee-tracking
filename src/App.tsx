import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Home from './components/Home';
import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import { User, KafeLog } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'leaderboard' | 'profile'>('home');
  const [logs, setLogs] = useState<KafeLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    // 1. Check if they are logged in
    const savedUser = localStorage.getItem('kafe_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    supabase.from('users').select('id, name').then(({ data }) => {
      if (data) setUsers(data);
    });
    
    fetchLogs(0, true);
    
    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kafes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLogs(current => [{ ...payload.new as KafeLog, comment_count: 0 } as any, ...current]);
        } else if (payload.eventType === 'UPDATE') {
          setLogs(current => current.map(l => l.id === payload.new.id ? { ...l, ...payload.new } as any : l));
        } else if (payload.eventType === 'DELETE') {
          setLogs(current => current.filter(l => l.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLogs = async (pageNum = 0, isInitial = false) => {
    const { data } = await supabase
      .from('kafes')
      .select('*, comments(count)')
      .order('created_at', { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
      
    if (data) {
      const formattedData = data.map((item: any) => ({
        ...item,
        comment_count: item.comments?.[0]?.count || 0
      }));

      if (isInitial || pageNum === 0) {
        setLogs(formattedData as KafeLog[]);
      } else {
        setLogs(prev => [...prev, ...(formattedData as KafeLog[])]);
      }
      
      setHasMore(data.length === PAGE_SIZE);
    }
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchLogs(next);
  };

  const handleLogin = async (name: string, pin: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .eq('pin', pin)
      .single();

    if (data && !error) {
      setCurrentUser(data);
      localStorage.setItem('kafe_user', JSON.stringify(data));
      return true;
    } else {
      alert("Invalid PIN or user not configured.");
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kafe_user');
    setActiveTab('home');
  };

  // Instantly updates the count in the Feed when a user comments/deletes
  const handleUpdateCommentCount = (kafeId: string, delta: number) => {
    setLogs(prev => prev.map(l => l.id === kafeId ? { ...l, comment_count: Math.max(0, (l.comment_count || 0) + delta) } : l));
  };

  if (!currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  const getUserMap = (id: string) => users.find(u => u.id === id);

  return (
    <Layout 
      user={currentUser} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      {activeTab === 'home' && <Home user={currentUser} onKafeLogged={() => fetchLogs(0, true)} />}
      
      {activeTab === 'feed' && (
        <Feed 
          logs={logs} 
          getUserMap={getUserMap} 
          currentUser={currentUser} 
          onLoadMore={handleLoadMore} 
          hasMore={hasMore} 
          onUpdateCommentCount={handleUpdateCommentCount}
        />
      )}
      
      {/* Passed getUserMap down to profiles so comments can display names */}
      {activeTab === 'leaderboard' && <Leaderboard currentUser={currentUser} getUserMap={getUserMap} />}
      {activeTab === 'profile' && <Profile user={currentUser} getUserMap={getUserMap} onLogout={handleLogout} />}
    </Layout>
  );
}

export default App;