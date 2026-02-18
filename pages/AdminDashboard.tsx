
import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { Media, ContentType, Episode, Season, AppSettings } from '../types';
import { 
  Plus, Trash2, Edit, X, Search, 
  BarChart3, Film, Tv, Menu,
  ChevronRight, Image as ImageIcon,
  PlayCircle, Database, Settings as SettingsIcon,
  ShieldAlert, LogOut, Save
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

type AdminTab = 'overview' | 'settings';

const AdminDashboard: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());

  const [formData, setFormData] = useState<any>({
    title: '',
    type: 'movie' as ContentType,
    thumbnailUrl: '',
    backdropUrl: '',
    videoUrl: '',
    description: '',
    genre: '',
    year: new Date().getFullYear(),
    rating: 8.0,
    seasons: [] as Season[]
  });

  const navigate = useNavigate();

  const loadMedia = useCallback(() => {
    const data = storageService.getMedia();
    setMedia([...data]); 
  }, []);

  useEffect(() => {
    loadMedia();
    if (localStorage.getItem('admin_session') !== 'true') {
      navigate('/login');
    }
  }, [navigate, loadMedia]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    
    if (dataToSave.type === 'movie') {
      delete dataToSave.seasons;
    } else {
      delete dataToSave.videoUrl;
    }

    if (isEditing) {
      storageService.updateMedia(dataToSave as Media);
    } else {
      storageService.addMedia(dataToSave as any);
    }
    
    loadMedia();
    setIsAdding(false);
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'movie',
      thumbnailUrl: '',
      backdropUrl: '',
      videoUrl: '',
      description: '',
      genre: '',
      year: new Date().getFullYear(),
      rating: 8.0,
      seasons: []
    });
    setActiveStep(1);
    setIsEditing(false);
  };

  const handleEdit = (item: Media) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsAdding(true);
    setActiveStep(1);
  };

  const handleDelete = (id: string) => {
    if (!id) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this title? This cannot be undone.");
    if (confirmDelete) {
      const updatedList = storageService.deleteMedia(id);
      setMedia([...updatedList]);
    }
  };

  const handleAddSeason = () => {
    const nextSeasonNum = (formData.seasons?.length || 0) + 1;
    const newSeason: Season = {
      id: Math.random().toString(36).substring(2, 11),
      seasonNumber: nextSeasonNum,
      episodes: []
    };
    setFormData({ ...formData, seasons: [...(formData.seasons || []), newSeason] });
  };

  const removeSeason = (seasonId: string) => {
    setFormData({ ...formData, seasons: formData.seasons.filter((s: Season) => s.id !== seasonId) });
  };

  const handleAddEpisode = (seasonId: string) => {
    const newSeasons = formData.seasons.map((s: Season) => {
      if (s.id === seasonId) {
        const order = s.episodes.length + 1;
        const newEp: Episode = {
          id: Math.random().toString(36).substring(2, 11),
          title: `Episode ${order}`,
          videoUrl: '',
          order,
          duration: '45m'
        };
        return { ...s, episodes: [...s.episodes, newEp] };
      }
      return s;
    });
    setFormData({ ...formData, seasons: newSeasons });
  };

  const removeEpisode = (seasonId: string, episodeId: string) => {
    const newSeasons = formData.seasons.map((s: Season) => {
      if (s.id === seasonId) {
        return { ...s, episodes: s.episodes.filter(e => e.id !== episodeId) };
      }
      return s;
    });
    setFormData({ ...formData, seasons: newSeasons });
  };

  const updateEpisode = (seasonId: string, episodeId: string, field: keyof Episode, value: any) => {
    const newSeasons = formData.seasons.map((s: Season) => {
      if (s.id === seasonId) {
        const newEps = s.episodes.map(e => {
          if (e.id === episodeId) {
            return { ...e, [field]: value };
          }
          return e;
        });
        return { ...s, episodes: newEps };
      }
      return s;
    });
    setFormData({ ...formData, seasons: newSeasons });
  };

  const autoEnhance = async () => {
    if (!formData.title) return alert('Enter a title first');
    setLoadingAI(true);
    const enhanced = await aiService.enhanceMediaMetadata(formData.title, formData.type);
    if (enhanced) {
      setFormData((prev: any) => ({
        ...prev,
        title: enhanced.title || prev.title,
        description: enhanced.description || prev.description,
        genre: enhanced.genre || prev.genre,
        rating: enhanced.rating || prev.rating,
        year: enhanced.year || prev.year,
        thumbnailUrl: enhanced.posterUrl || prev.thumbnailUrl,
        backdropUrl: enhanced.backdropUrl || prev.backdropUrl
      }));
    }
    setLoadingAI(false);
  };

  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    storageService.updateSettings(updated);
  };

  const filteredMedia = media.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand/30">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex">
        <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-[#0c0c0c] border-r border-white/5 z-[70] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-12">
              <Link to="/" className="text-brand text-3xl font-black tracking-tighter italic">STREAMX</Link>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            
            <nav className="flex-1 space-y-3">
              <button 
                onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl font-semibold transition-all ${activeTab === 'overview' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Catalog</span>
              </button>
              <button 
                onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Settings</span>
              </button>
            </nav>

            <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center space-x-3 px-5">
                 <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-[10px] font-black italic">ADM</div>
                 <div className="overflow-hidden">
                    <p className="text-xs font-black truncate">Administrator</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Master Control</p>
                 </div>
              </div>
              <button 
                onClick={() => { localStorage.removeItem('admin_session'); navigate('/'); }}
                className="w-full flex items-center space-x-3 px-5 py-3 text-sm text-gray-500 hover:text-brand transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-12 space-y-10 w-full overflow-hidden">
          {activeTab === 'overview' ? (
            <>
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><Menu className="w-6 h-6" /></button>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic leading-none">Management</h1>
                    <p className="text-gray-500 font-medium tracking-wide">Manage movies and series entries</p>
                  </div>
                </div>
                <button 
                  onClick={() => { resetForm(); setIsAdding(true); }}
                  className="bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-3xl flex items-center justify-center space-x-3 transition-all shadow-2xl shadow-brand/30 font-bold w-full md:w-auto active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                  <span>New Content</span>
                </button>
              </header>

              <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h3 className="font-bold text-2xl uppercase italic tracking-tighter">Media Catalog</h3>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input 
                      type="text" 
                      placeholder="Search items..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all w-full"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="text-gray-600 text-xs uppercase tracking-widest font-bold border-b border-white/5 bg-white/[0.01]">
                        <th className="px-8 py-5">Item</th>
                        <th className="px-8 py-5">Type</th>
                        <th className="px-8 py-5">Year</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredMedia.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <img src={item.thumbnailUrl} className="w-16 h-10 object-cover rounded-xl border border-white/5" alt="" />
                              <div>
                                <span className="font-bold text-white block truncate max-w-[200px]">{item.title}</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">{item.genre}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider ${item.type === 'movie' ? 'bg-indigo-600/10 text-indigo-400' : 'bg-brand/10 text-brand'}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-gray-400 font-medium">{item.year}</td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                type="button" 
                                onClick={() => handleEdit(item)} 
                                className="p-3 hover:bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all" 
                                title="Edit Content"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleDelete(item.id)} 
                                className="p-3 hover:bg-brand/10 text-brand rounded-2xl transition-all group/del" 
                                title="Delete Content"
                              >
                                <Trash2 className="w-5 h-5 group-hover/del:scale-110 transition-transform" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <h1 className="text-4xl font-black tracking-tight uppercase italic leading-none">Global Settings</h1>
               <div className="bg-[#0c0c0c] p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-orange-500/10 rounded-2xl"><ShieldAlert className="w-8 h-8 text-orange-500" /></div>
                    <div>
                        <h4 className="font-black uppercase italic tracking-tighter text-xl">Maintenance Panel</h4>
                        <p className="text-xs text-gray-500 font-medium">Control platform visibility</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-8 bg-black/40 rounded-[2rem] border border-white/5">
                    <div className="space-y-1">
                        <span className="font-bold text-lg tracking-wide block">Maintenance Mode</span>
                        <p className="text-xs text-gray-500 italic font-medium">Block public access while updating the library.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => updateAppSettings({ isMaintenanceMode: !settings.isMaintenanceMode })}
                      className={`w-16 h-9 rounded-full transition-all relative shrink-0 ${settings.isMaintenanceMode ? 'bg-brand' : 'bg-gray-800'}`}
                    >
                        <div className={`absolute top-1 w-7 h-7 rounded-full bg-white transition-all shadow-lg ${settings.isMaintenanceMode ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="pt-4 flex items-center justify-end">
                    <button type="button" className="flex items-center space-x-3 bg-brand px-10 py-4 rounded-2xl font-black uppercase italic tracking-tighter shadow-2xl shadow-brand/20 active:scale-95 transition-all">
                        <Save className="w-5 h-5" />
                        <span>Save Config</span>
                    </button>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsAdding(false)} />
          <div className="relative bg-[#0c0c0c] border border-white/5 w-full max-w-5xl md:rounded-[3rem] shadow-[0_0_100px_rgba(41,168,41,0.15)] flex flex-col max-h-[100vh] md:max-h-[95vh] overflow-hidden">
            <div className="p-6 md:p-10 border-b border-white/5 shrink-0 bg-[#0c0c0c]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">{isEditing ? 'Modify Content' : 'Add New Content'}</h2>
                  <p className="text-gray-500 font-medium tracking-wide mt-2">{activeStep === 1 ? 'Step 1: Metadata' : 'Step 2: Distribution'}</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-white/5 rounded-3xl transition-all border border-white/5"><X className="w-7 h-7" /></button>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-3 pb-3 border-b-2 transition-all duration-500 ${activeStep === 1 ? 'border-brand text-white' : 'border-transparent text-gray-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${activeStep === 1 ? 'bg-brand' : 'bg-gray-800'}`}>1</div>
                  <span className="font-black uppercase italic tracking-tighter text-sm">General</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-800" />
                <div className={`flex items-center space-x-3 pb-3 border-b-2 transition-all duration-500 ${activeStep === 2 ? 'border-brand text-white' : 'border-transparent text-gray-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${activeStep === 2 ? 'bg-brand' : 'bg-gray-800'}`}>2</div>
                  <span className="font-black uppercase italic tracking-tighter text-sm">Videos</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
              <form onSubmit={handleSubmit} className="h-full">
                {activeStep === 1 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Poster Artwork</label>
                        <div className="aspect-[2/3] w-full bg-white/[0.03] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col items-center justify-center relative group shadow-2xl">
                          {formData.thumbnailUrl ? <img src={formData.thumbnailUrl} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-16 h-16 text-gray-800 mx-auto" />}
                        </div>
                        <input required value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} placeholder="Poster URL (2:3 aspect)..." className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium text-sm" />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Backdrop Artwork (Optional)</label>
                        <div className="aspect-video w-full bg-white/[0.03] rounded-[2rem] border border-white/5 overflow-hidden flex flex-col items-center justify-center relative group shadow-2xl">
                          {formData.backdropUrl ? <img src={formData.backdropUrl} className="w-full h-full object-cover" alt="" /> : <ImageIcon className="w-12 h-12 text-gray-800 mx-auto" />}
                        </div>
                        <input value={formData.backdropUrl} onChange={e => setFormData({...formData, backdropUrl: e.target.value})} placeholder="Cinematic Backdrop URL (16:9)..." className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium text-sm" />
                      </div>
                    </div>
                    <div className="lg:col-span-8 space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Official Title</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="flex-1 bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-black text-2xl italic tracking-tighter" placeholder="e.g. AVATAR" />
                          {!isEditing && <button type="button" onClick={autoEnhance} disabled={loadingAI} className="flex items-center justify-center space-x-3 bg-brand text-white px-8 py-5 rounded-[1.5rem] transition-all disabled:opacity-50 whitespace-nowrap text-xs font-black shadow-xl shadow-brand/30">{loadingAI ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Database className="w-4 h-4" />}<span>SYNC DATA</span></button>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Content Type</label>
                          <div className={`flex bg-white/[0.03] p-1.5 rounded-[1.5rem] border border-white/5 ${isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
                            <button type="button" onClick={() => setFormData({...formData, type: 'movie'})} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all uppercase italic tracking-tighter ${formData.type === 'movie' ? 'bg-brand text-white shadow-lg' : 'text-gray-600'}`}>Movie</button>
                            <button type="button" onClick={() => setFormData({...formData, type: 'series'})} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all uppercase italic tracking-tighter ${formData.type === 'series' ? 'bg-brand text-white shadow-lg' : 'text-gray-600'}`}>Series</button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Genre</label>
                          <input value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} placeholder="ACTION, DRAMA..." className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-6 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-black italic uppercase text-sm" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Synopsis</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-6 py-5 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium resize-none leading-relaxed text-gray-300" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {formData.type === 'movie' ? (
                      <div className="max-w-2xl mx-auto space-y-8 py-10">
                        <div className="text-center space-y-4">
                           <PlayCircle className="w-20 h-20 text-gray-800 mx-auto" />
                           <h5 className="font-black text-xl uppercase italic tracking-tighter">Movie Video Link</h5>
                        </div>
                        <input required value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="Direct mkv/mp4 URL..." className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-8 py-6 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-mono text-sm" />
                      </div>
                    ) : (
                      <div className="space-y-12">
                        <div className="flex items-center justify-between"><h3 className="font-black text-2xl uppercase italic tracking-tighter">Series Seasons</h3><button type="button" onClick={handleAddSeason} className="bg-brand px-6 py-3 rounded-2xl font-black text-xs uppercase italic">New Season</button></div>
                        <div className="space-y-8">
                          {formData.seasons?.map((season: Season) => (
                            <div key={season.id} className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden">
                              <div className="p-6 bg-white/[0.03] flex items-center justify-between"><span className="font-black italic text-lg uppercase tracking-widest">Season {season.seasonNumber}</span><div className="flex items-center space-x-2"><button type="button" onClick={() => handleAddEpisode(season.id)} className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase italic">Add Episode</button><button type="button" onClick={() => removeSeason(season.id)} className="p-2 text-gray-500 hover:text-brand"><X className="w-4 h-4" /></button></div></div>
                              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {season.episodes.map((ep, idx) => (
                                  <div key={ep.id} className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between"><input value={ep.title} onChange={(e) => updateEpisode(season.id, ep.id, 'title', e.target.value)} className="bg-transparent border-none text-sm font-black italic uppercase p-0 focus:ring-0" /><button type="button" onClick={() => removeEpisode(season.id, ep.id)} className="text-gray-700 hover:text-red-500"><X className="w-4 h-4" /></button></div>
                                    <input placeholder="mkv/mp4 link" value={ep.videoUrl} onChange={(e) => updateEpisode(season.id, ep.id, 'videoUrl', e.target.value)} className="w-full bg-white/5 rounded-lg px-3 py-2 text-[10px] font-mono border border-white/5" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
            <div className="p-8 border-t border-white/5 flex items-center justify-between shrink-0 bg-[#0c0c0c]">
              <button type="button" onClick={() => activeStep === 1 ? setIsAdding(false) : setActiveStep(1)} className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase italic text-xs tracking-widest">{activeStep === 1 ? 'Discard' : 'Back'}</button>
              <button type="button" onClick={(e) => activeStep === 1 ? setActiveStep(2) : handleSubmit(e as any)} className="px-10 py-4 rounded-2xl bg-brand hover:bg-brand-dark text-white font-black uppercase italic text-xs tracking-widest shadow-2xl active:scale-95">{activeStep === 1 ? 'Next' : (isEditing ? 'Save' : 'Publish')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
