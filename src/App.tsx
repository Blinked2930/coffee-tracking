import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Home from './components/Home';
import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import InstallPrompt from './components/InstallPrompt';
import { User, KafeLog } from './types';
import { supabase } from './lib/supabase';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'leaderboard' | 'profile'>('home');
  const [logs, setLogs] = useState<KafeLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const savedUser = localStorage.getItem('kafe_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      
      // 🚀 INSTANT LOAD CACHING (Stale-While-Revalidate)
      // Load cached data immediately so the UI is fully populated at 0ms
      const cachedUsers = localStorage.getItem('kafe_users_cache');
      if (cachedUsers) setUsers(JSON.parse(cachedUsers));
      
      const cachedLogs = localStorage.getItem('kafe_logs_cache');
      if (cachedLogs) setLogs(JSON.parse(cachedLogs));
      
      // Then, silently fetch the freshest data from Supabase in the background
      supabase.from('users').select('id, name').then(({ data }) => {
        if (data) {
          setUsers(data);
          localStorage.setItem('kafe_users_cache', JSON.stringify(data));
        }
      });
      fetchLogs(0, true);
    }
    
    // Real-time subscription so new Kafes pop in live
    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kafes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLogs(current => {
            const newLogs = [{ ...payload.new as KafeLog, comment_count: 0 } as any, ...current];
            localStorage.setItem('kafe_logs_cache', JSON.stringify(newLogs.slice(0, PAGE_SIZE)));
            return newLogs;
          });
        } else if (payload.eventType === 'UPDATE') {
          setLogs(current => {
            const updated = current.map(l => l.id === payload.new.id ? { ...l, ...payload.new } as any : l);
            localStorage.setItem('kafe_logs_cache', JSON.stringify(updated.slice(0, PAGE_SIZE)));
            return updated;
          });
        } else if (payload.eventType === 'DELETE') {
          setLogs(current => {
            const filtered = current.filter(l => l.id !== payload.old.id);
            localStorage.setItem('kafe_logs_cache', JSON.stringify(filtered.slice(0, PAGE_SIZE)));
            return filtered;
          });
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
        // Update the cache with the freshest Page 1 data
        localStorage.setItem('kafe_logs_cache', JSON.stringify(formattedData));
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
      
      // Kick off initial fetches and populate cache on fresh login
      supabase.from('users').select('id, name').then(({ data: userData }) => { 
        if (userData) {
          setUsers(userData);
          localStorage.setItem('kafe_users_cache', JSON.stringify(userData));
        }
      });
      fetchLogs(0, true);
      
      return true;
    } else {
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kafe_user');
    // Clear the cache so a new user doesn't briefly see the old user's feed
    localStorage.removeItem('kafe_logs_cache');
    localStorage.removeItem('kafe_users_cache');
    setActiveTab('home');
  };

  const handleUpdateCommentCount = (kafeId: string, delta: number) => {
    setLogs(prev => prev.map(l => l.id === kafeId ? { ...l, comment_count: Math.max(0, (l.comment_count || 0) + delta) } : l));
  };

  if (!currentUser) {
    return (
      <>
        <InstallPrompt onBypass={() => {}} />
        <Login users={users} onLogin={handleLogin} />
      </>
    );
  }

  const getUserMap = (id: string) => users.find(u => u.id === id);

  return (
    <>
      <InstallPrompt onBypass={() => {}} />
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
        
        {activeTab === 'leaderboard' && <Leaderboard currentUser={currentUser} getUserMap={getUserMap} />}
        {activeTab === 'profile' && <Profile user={currentUser} getUserMap={getUserMap} onLogout={handleLogout} />}
      </Layout>
    </>
  );
}

export default App;