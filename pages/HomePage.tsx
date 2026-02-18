
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DetailsModal from '../components/DetailsModal';
import { storageService } from '../services/storageService';
import { Media, StorageKey, AppSettings } from '../types';
import { Play, Info, ChevronRight, Plus, Check, ShieldAlert } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);
  const [featured, setFeatured] = useState<Media | null>(null);
  const [activeFilter, setActiveFilter] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [myListIds, setMyListIds] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const navigate = useNavigate();

  const isAdmin = localStorage.getItem('admin_session') === 'true';

  useEffect(() => {
    const data = storageService.getMedia();
    setAllMedia(data);
    setFilteredMedia(data);
    if (data.length > 0) {
      setFeatured(data[0]);
    }

    const savedList = localStorage.getItem(StorageKey.MY_LIST);
    if (savedList) {
      setMyListIds(JSON.parse(savedList));
    }
    
    setSettings(storageService.getSettings());
  }, []);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setSearchQuery(''); 
    
    if (filter === 'home') {
      setFilteredMedia(allMedia);
    } else if (filter === 'series' || filter === 'movie') {
      setFilteredMedia(allMedia.filter(m => m.type === filter));
    } else if (filter === 'new') {
      const sorted = [...allMedia].sort((a, b) => b.createdAt - a.createdAt);
      setFilteredMedia(sorted);
    } else if (filter === 'mylist') {
      setFilteredMedia(allMedia.filter(m => myListIds.includes(m.id)));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query) {
      handleFilterChange(activeFilter);
      return;
    }
    const results = allMedia.filter(m => 
      m.title.toLowerCase().includes(query.toLowerCase()) || 
      m.genre.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredMedia(results);
  };

  const toggleMyList = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    let newList = [...myListIds];
    if (newList.includes(id)) {
      newList = newList.filter(itemId => itemId !== id);
    } else {
      newList.push(id);
    }
    setMyListIds(newList);
    localStorage.setItem(StorageKey.MY_LIST, JSON.stringify(newList));
  };

  const renderRow = (title: string, items: Media[]) => {
    if (items.length === 0) return null;
    return (
      <div className="py-6 md:py-10 space-y-4 md:space-y-6">
        <div className="flex items-center justify-between px-6 md:px-16">
          <h2 className="text-xl md:text-3xl font-black text-white tracking-tight hover:text-brand transition-colors cursor-pointer group flex items-center">
            {title}
            <ChevronRight className="w-6 h-6 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand" />
          </h2>
        </div>
        
        <div className="flex overflow-x-auto overflow-y-hidden scrollbar-hide px-6 md:px-16 space-x-4 md:space-x-6 pb-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedMedia(item)}
              className="flex-none w-[200px] md:w-[380px] aspect-video relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-105 hover:z-10 shadow-2xl bg-[#121212]"
            >
              <img 
                src={item.thumbnailUrl} 
                alt={item.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                <div className="flex items-center space-x-2 mb-2 scale-75 md:scale-100 origin-left opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/watch/${item.id}`); }}
                    className="p-2 md:p-3 bg-white rounded-full shadow-lg hover:bg-brand hover:text-white"
                  >
                    <Play className="w-4 h-4 fill-black text-black hover:fill-white" />
                  </button>
                  <button 
                    onClick={(e) => toggleMyList(item.id, e)}
                    className="p-2 md:p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20"
                  >
                    {myListIds.includes(item.id) ? <Check className="w-4 h-4 text-brand-light" /> : <Plus className="w-4 h-4 text-white" />}
                  </button>
                  <button 
                    className="p-2 md:p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20"
                    onClick={() => setSelectedMedia(item)}
                  >
                    <ChevronRight className="w-4 h-4 text-white rotate-90" />
                  </button>
                </div>
                <h3 className="font-black text-sm md:text-xl text-white truncate drop-shadow-lg">{item.title}</h3>
                <div className="flex items-center space-x-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-1 text-gray-300">
                  <span className="text-brand">{item.rating} Rating</span>
                  <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-gray-600 rounded-full" />
                  <span className="truncate">{item.genre}</span>
                  <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-gray-600 rounded-full" />
                  <span>{item.year}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (settings.isMaintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center space-y-8">
         <ShieldAlert className="w-32 h-32 text-orange-500 animate-pulse" />
         <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">Maintenance Mode</h1>
            <p className="text-gray-400 font-medium leading-relaxed">Platform access is currently restricted. We will be back shortly.</p>
         </div>
         <Link to="/login" className="text-brand text-xs font-black uppercase tracking-widest hover:underline decoration-brand/50 underline-offset-8">Admin Login</Link>
      </div>
    );
  }

  const getPageTitle = () => {
    if (searchQuery) return `Results for "${searchQuery}"`;
    if (activeFilter === 'mylist') return "My List";
    if (activeFilter === 'movie') return "Movies";
    if (activeFilter === 'series') return "TV Shows";
    if (activeFilter === 'new') return "New & Popular";
    return "";
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar isAdmin={isAdmin} onFilterChange={handleFilterChange} onSearch={handleSearch} activeFilter={activeFilter} />
      
      {activeFilter === 'home' && !searchQuery && featured && (
        <div className="relative w-full h-[70vh] md:h-screen overflow-hidden">
          <div className="absolute inset-0">
            <img src={featured.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          </div>
          
          <div className="relative h-full flex flex-col justify-center px-6 md:px-16 max-w-4xl space-y-4 md:space-y-6">
            <span className="px-3 py-1 bg-brand/20 text-brand rounded-lg text-xs font-black tracking-widest uppercase border border-brand/30 w-fit">Trending Now</span>
            <h1 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl leading-[0.9]">{featured.title}</h1>
            <p className="text-base md:text-xl text-gray-300 max-w-2xl font-medium leading-relaxed line-clamp-3">{featured.description}</p>
            <div className="flex items-center flex-wrap gap-4 pt-4">
              <button onClick={() => navigate(`/watch/${featured.id}`)} className="flex items-center space-x-3 bg-white text-black px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-brand hover:text-white transition-all font-black shadow-2xl active:scale-95"><Play className="w-5 h-5 md:w-6 md:h-6 fill-current" /><span>WATCH NOW</span></button>
              <button onClick={() => setSelectedMedia(featured)} className="flex items-center space-x-3 bg-white/10 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl hover:bg-white/20 transition-all font-black backdrop-blur-xl border border-white/10 active:scale-95"><Info className="w-5 h-5 md:w-6 md:h-6" /><span>DETAILS</span></button>
            </div>
          </div>
        </div>
      )}

      <div className={`${activeFilter === 'home' && !searchQuery ? '-mt-20 md:-mt-40' : 'pt-24 md:pt-32'} relative z-10 pb-20`}>
        {getPageTitle() && <h2 className="px-6 md:px-16 text-2xl md:text-4xl font-black mb-8 uppercase italic tracking-tighter border-l-4 border-brand pl-4">{getPageTitle()}</h2>}
        {(activeFilter === 'home' && !searchQuery) ? (
          <>
            {renderRow("Editor's Choice", allMedia.slice(0, 5))}
            {renderRow("Trending Series", allMedia.filter(m => m.type === 'series'))}
            {renderRow("Blockbuster Movies", allMedia.filter(m => m.type === 'movie'))}
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-6 md:px-16">
            {filteredMedia.map((item) => (
              <div key={item.id} onClick={() => setSelectedMedia(item)} className="aspect-video relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-500 hover:scale-105 hover:z-10 shadow-xl bg-[#121212]">
                <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-bold text-sm text-white truncate">{item.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMedia && <DetailsModal item={selectedMedia} onClose={() => setSelectedMedia(null)} isInList={myListIds.includes(selectedMedia.id)} onToggleList={() => toggleMyList(selectedMedia.id)} />}
    </div>
  );
};

export default HomePage;
