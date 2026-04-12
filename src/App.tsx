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

  useEffect(() => {
    const savedUser = localStorage.getItem('kafe_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    supabase.from('users').select('id, name').then(({ data }) => {
      if (data) setUsers(data);
    });
    
    fetchLogs();
    
    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kafes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Default new logs to 0 comments
          setLogs(current => [{ ...payload.new as KafeLog, comment_count: 0 } as any, ...current]);
        } else if (payload.eventType === 'UPDATE') {
          // Merge payload with existing log to preserve the comment count
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

  const fetchLogs = async () => {
    // NEW: Ask Supabase for the comment count!
    const { data } = await supabase
      .from('kafes')
      .select('*, comments(count)')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (data) {
      // Format the data so the count sits directly on the log object
      const formattedData = data.map((item: any) => ({
        ...item,
        comment_count: item.comments?.[0]?.count || 0
      }));
      setLogs(formattedData as KafeLog[]);
    }
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
      {activeTab === 'home' && <Home user={currentUser} onKafeLogged={fetchLogs} />}
      {activeTab === 'feed' && <Feed logs={logs} getUserMap={getUserMap} currentUser={currentUser} />}
      {activeTab === 'leaderboard' && <Leaderboard logs={logs} users={users} />}
      {activeTab === 'profile' && <Profile user={currentUser} logs={logs} onLogout={handleLogout} />}
    </Layout>
  );
}

export default App;