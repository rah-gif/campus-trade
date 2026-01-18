import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { supabase } from '../services/supabaseClient';
import { LogOut, ShoppingBag, PlusCircle, MessageCircle, User, Moon, Sun } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    if (user) {
      getAvatar();
    }
  }, [user]);

  const getAvatar = async () => {
    const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).single();
    if (data) setAvatarUrl(data.avatar_url);
  };

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);
      
      if (!error) setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('unread_cnt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => {
         fetchUnread();
      })
      .subscribe();

    const handleMessageRead = () => {
        fetchUnread();
    };
    window.addEventListener('messages-read', handleMessageRead);

    return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('messages-read', handleMessageRead);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow transition-colors duration-200 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/" className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 tracking-tight">
                CampusTrade
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
                Marketplace
              </Link>
              <Link to="/sell" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">
                Become a Seller
              </Link>
              <Link to="/chat" className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white relative">
                Messages
                {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User Profile / Sign In Link */}
            <div className="flex items-center space-x-4">
                <Link 
                  to={user ? "/profile" : "/login"} 
                  className="flex items-center space-x-2 text-sm text-gray-700 hover:text-indigo-600 dark:text-gray-200 dark:hover:text-indigo-400"
                >
                  {user && avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
                  ) : (
                      <div className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                        <User className="h-6 w-6" />
                      </div>
                  )}
                  {user && <span className="hidden sm:block">{user.email}</span>}
                  {!user && <span className="hidden sm:block text-xs font-medium">Sign In</span>}
                </Link>

                {/* Desktop Logout Button Removed as per User Request (Available in Profile) */}
            </div>
          </div>
        </div>
      </div>
       {/* Mobile Menu */}
       <div className="sm:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 bottom-0 fixed w-full flex justify-around p-2 shadow-inner z-50">
          <Link to="/" className="flex flex-col items-center text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"><ShoppingBag size={20}/><span className="text-xs">Buy</span></Link>
          <Link to="/sell" className="flex flex-col items-center text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"><PlusCircle size={20}/><span className="text-xs">Sell</span></Link>
          <Link to="/chat" className="flex flex-col items-center text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 relative">
              <MessageCircle size={20}/>
              {unreadCount > 0 && <span className="absolute top-0 right-4 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              <span className="text-xs">Chat</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"><User size={20}/><span className="text-xs">Profile</span></Link>
       </div>
    </nav>
  );
}
