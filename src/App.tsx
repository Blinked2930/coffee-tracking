import { useState, useEffect, lazy, Suspense } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import InstallPrompt from './components/InstallPrompt';
import { User, KafeLog } from './types';
import { supabase } from './lib/supabase';

// Code Splitting retains fast initial boot
const Home = lazy(() => import('./components/Home'));
const Feed = lazy(() => import('./components/Feed'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const Profile = lazy(() => import('./components/Profile'));

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'leaderboard' | 'profile'>('home');
  
  // 👻 THE GHOST LOAD: Instantly load the cached feed from memory before hitting the database
  const [logs, setLogs] = useState<KafeLog[]>(() => {
    const cached = localStorage.getItem('kafe_feed_cache');
    return cached ? JSON.parse(cached) : [];
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
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
        // 💾 Save the fresh first page of the feed to memory for the next time they open the app
        localStorage.setItem('kafe_feed_cache', JSON.stringify(formattedData));
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
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('kafe_user');
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
        <Suspense fallback={
          <div className="flex flex-col h-full w-full items-center justify-center min-h-[60vh] gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-amber-500/20 border-t-amber-500"></div>
          </div>
        }>
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
        </Suspense>
      </Layout>
    </>
  );
}

export default App;