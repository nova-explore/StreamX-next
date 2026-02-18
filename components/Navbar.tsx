import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'series', label: 'TV Shows' },
    { id: 'movie', label: 'Movies' },
    { id: 'new', label: 'New & Popular' },
    { id: 'mylist', label: 'My List' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled || isSearchOpen ? 'bg-[#141414] py-2' : 'bg-transparent bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4'}`}>
      <div className="max-w-[1400px] mx-auto px-4 md:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-4 md:space-x-8">
          <Link to="/" onClick={() => onFilterChange?.('home')} className="text-brand text-xl md:text-3xl font-bold tracking-tighter uppercase italic shrink-0">StreamX</Link>
          
          <div className="hidden lg:flex items-center space-x-5 text-sm font-medium">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onFilterChange?.(item.id)}
                className={`transition-colors font-bold ${activeFilter === item.id ? 'text-white' : 'text-gray-300 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="lg:hidden">
            <button className="text-white text-xs font-bold flex items-center space-x-1">
              <span>Browse</span>
              <Menu className="w-3 h-3 fill-white" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-6 relative">
          <div className={`flex items-center bg-black/50 border transition-all duration-300 ${isSearchOpen ? 'w-48 md:w-64 border-white/40 px-3' : 'w-10 border-transparent'} h-10 rounded-full overflow-hidden`}>
            <Search 
              className="w-5 h-5 cursor-pointer shrink-0 text-white" 
              onClick={handleSearchToggle} 
            />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Titles, people, genres"
              className={`bg-transparent border-none outline-none text-sm text-white px-2 w-full transition-opacity ${isSearchOpen ? 'opacity-100' : 'opacity-0'}`}
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {isSearchOpen && <X className="w-4 h-4 cursor-pointer text-gray-500 hover:text-white" onClick={() => setIsSearchOpen(false)} />}
          </div>

          <div className="relative">
            <button 
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 cursor-pointer" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full border border-black" />
            </button>

            {showNotifications && (
              <div className="absolute top-full right-0 mt-4 w-72 bg-black/90 border border-white/10 rounded-lg shadow-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                <h4 className="font-bold text-sm mb-3 text-white border-b border-white/10 pb-2">Recent Activity</h4>
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <img src="https://picsum.photos/seed/1/40/60" className="w-10 h-14 object-cover rounded" />
                    <div>
                      <p className="text-xs text-white font-bold">New Episode Available</p>
                      <p className="text-[10px] text-gray-400">"Neon Nights" Season 2 is now streaming.</p>
                      <p className="text-[9px] text-gray-600 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex space-x-3 opacity-60">
                    <div className="w-10 h-14 bg-white/5 rounded flex items-center justify-center"><Bell className="w-4 h-4" /></div>
                    <div>
                      <p className="text-xs text-white font-bold">System Update</p>
                      <p className="text-[10px] text-gray-400">StreamX library has been updated with 5 new titles.</p>
                      <p className="text-[9px] text-gray-600 mt-1">Yesterday</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {isAdmin ? (
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link to="/admin" className="flex items-center space-x-1 text-[10px] md:text-sm bg-brand px-2 md:px-3 py-1 rounded hover:bg-brand-dark transition-all font-bold shadow-lg shadow-brand/20">
                <LayoutDashboard className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden xs:inline">Admin</span>
              </Link>
              <button 
                onClick={() => { localStorage.removeItem('admin_session'); navigate('/login'); }} 
                className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center justify-center p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-all">
              <User className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;