import { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import Home from './components/Home';
import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import { User, KafeLog } from './types';
import { supabase } from './lib/supabase';
import { useLanguage } from './contexts/LanguageContext';
import { LogOut, Globe } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'feed' | 'leaderboard' | 'profile'>('home');
  const [logs, setLogs] = useState<KafeLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Bring language context here for the new settings hub
  const { lang, toggleLang } = useLanguage();

  useEffect(() => {
    const savedUser = localStorage.getItem('kafe_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    // Fetch users for reference
    supabase.from('users').select('id, name').then(({ data }) => {
      if (data) setUsers(data);
    });
    
    fetchLogs();
    
    // Subscribe to new kafes
    const channel = supabase.channel('custom-all-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kafes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLogs(current => [payload.new as KafeLog, ...current]);
        } else if (payload.eventType === 'UPDATE') {
          setLogs(current => current.map(l => l.id === payload.new.id ? payload.new as KafeLog : l));
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
    const { data } = await supabase
      .from('kafes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (data) {
      setLogs(data as KafeLog[]);
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
      
      {/* Profile & Settings Hub */}
      {activeTab === 'profile' && (
        <div className="flex flex-col items-center h-full text-gray-800 px-6 pt-12 animate-in fade-in zoom-in duration-300">
           <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-4xl shadow-inner mb-4">
             {currentUser.name.charAt(0)}
           </div>
           <h1 className="text-3xl font-black text-gray-900 mb-1 tracking-tight">{currentUser.name}</h1>
           <p className="font-medium text-gray-500 mb-12">The Profile & Stats hub is under construction!</p>

           <div className="w-full max-w-sm space-y-4">
             <button 
               onClick={toggleLang}
               className="w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-100 shadow-sm rounded-2xl active:scale-95 transition-all"
             >
               <span className="font-bold text-gray-700">Language</span>
               <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wider text-sm bg-amber-50 px-3 py-1 rounded-full">
                 {lang} <Globe size={16} />
               </div>
             </button>

             <button 
               onClick={handleLogout}
               className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-50 text-red-600 rounded-2xl font-bold uppercase tracking-wider active:scale-95 transition-all"
             >
               <LogOut size={18} /> Log Out
             </button>
           </div>
        </div>
      )}
    </Layout>
  );
}

export default App;