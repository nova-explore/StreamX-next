import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LayoutDashboard, LogOut, Menu, X, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { AppNotification } from '../types';

interface NavbarProps {
  isAdmin?: boolean;
  onFilterChange?: (filter: string) => void;
  onSearch?: (query: string) => void;
  activeFilter?: string;
}

const Navbar: React.FC<NavbarProps> = ({ isAdmin = false, onFilterChange, onSearch, activeFilter = 'home' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (showNotifications) {
      storageService.getNotifications().then(setNotifications);
    }
  }, [showNotifications]);

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleClearNotifications = async () => {
    await storageService.clearNotifications();
    setNotifications([]);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'series', label: 'TV Shows' },
    { id: 'movie', label: 'Movies' },
    { id: 'new', label: 'New & Popular' },
    { id: 'mylist', label: 'My List' },
  ];

  const formatRelativeTime = (ts: number) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled || isSearchOpen ? 'bg-[#141414] py-2' : 'bg-transparent bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4'}`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-4 md:space-x-8">
          <Link to="/" onClick={() => onFilterChange?.('home')} className="text-brand text-xl md:text-3xl font-bold tracking-tighter uppercase italic shrink-0">StreamX</Link>
          <div className="hidden lg:flex items-center space-x-5 text-sm font-medium">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => onFilterChange?.(item.id)} className={`transition-colors font-bold ${activeFilter === item.id ? 'text-white' : 'text-gray-300 hover:text-white'}`}>{item.label}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-6 relative">
          <div className={`flex items-center bg-black/50 border transition-all duration-300 ${isSearchOpen ? 'w-48 md:w-64 border-white/40 px-3' : 'w-10 border-transparent'} h-10 rounded-full overflow-hidden`}>
            <Search className="w-5 h-5 cursor-pointer shrink-0 text-white" onClick={handleSearchToggle} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Titles, people, genres"
              className={`bg-transparent border-none outline-none text-sm text-white px-2 w-full transition-opacity ${isSearchOpen ? 'opacity-100' : 'opacity-0'}`}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); onSearch?.(e.target.value); }}
            />
          </div>

          <div className="relative">
            <button className="p-1 hover:bg-white/10 rounded-full transition-colors" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="w-5 h-5 cursor-pointer" />
              {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full border border-black" />}
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-4 w-80 bg-black/95 border border-white/10 rounded-2xl shadow-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200 z-[100] backdrop-blur-3xl">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <h4 className="font-black uppercase italic tracking-tighter text-sm">Activity</h4>
                  {notifications.length > 0 && (
                    <button onClick={handleClearNotifications} className="text-[9px] text-gray-500 hover:text-red-500 font-bold uppercase flex items-center">
                      <Trash2 className="w-3 h-3 mr-1" /> Clear
                    </button>
                  )}
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center py-8">No new activity</p>
                  ) : notifications.map(n => (
                    <div key={n.id} className="flex space-x-4 group">
                      {n.thumbnailUrl ? (
                        <img src={n.thumbnailUrl} className="w-12 h-16 object-cover rounded-lg border border-white/5" />
                      ) : (
                        <div className="w-12 h-16 bg-white/5 rounded-lg flex items-center justify-center"><Bell className="w-4 h-4 text-gray-700" /></div>
                      )}
                      <div className="flex-1">
                        <p className="text-[11px] text-white font-black uppercase tracking-tight">{n.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium leading-tight mt-1">{n.message}</p>
                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-2">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {isAdmin ? (
            <Link to="/admin" className="flex items-center space-x-2 bg-brand px-3 py-1.5 rounded-lg hover:bg-brand-dark transition-all font-black text-xs uppercase italic">
              <LayoutDashboard className="w-4 h-4" /> <span>Dashboard</span>
            </Link>
          ) : (
            <Link to="/login" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"><User className="w-5 h-5" /></Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;