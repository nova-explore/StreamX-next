import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { Media, ContentType, Episode, Season, AppSettings } from '../types';
import { 
  Plus, Trash2, Edit, X, Search, 
  BarChart3, Film, Tv, Menu,
  ChevronRight, Image as ImageIcon,
  PlayCircle, Database, Settings as SettingsIcon,
  ShieldAlert, LogOut, Save, RefreshCcw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({ isMaintenanceMode: false });
  const [formData, setFormData] = useState<any>({
    title: '', type: 'movie' as ContentType, thumbnailUrl: '', backdropUrl: '', videoUrl: '',
    description: '', genre: '', year: new Date().getFullYear(), rating: 8.0, seasons: []
  });

  const navigate = useNavigate();

  const loadMedia = useCallback(async () => {
    setIsRefreshing(true);
    const data = await storageService.getMedia();
    const sets = await storageService.getSettings();
    setMedia(data);
    setSettings(sets);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('admin_session') !== 'true') {
      navigate('/login');
    } else {
      loadMedia();
    }
  }, [navigate, loadMedia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    
    if (dataToSave.type === 'movie') {
      delete dataToSave.seasons;
    } else {
      delete dataToSave.videoUrl;
    }

    if (isEditing) {
      await storageService.updateMedia(dataToSave as Media);
    } else {
      await storageService.addMedia(dataToSave as any);
    }
    
    await loadMedia();
    setIsAdding(false);
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '', type: 'movie', thumbnailUrl: '', backdropUrl: '', videoUrl: '',
      description: '', genre: '', year: new Date().getFullYear(), rating: 8.0, seasons: []
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Confirm deletion? This is irreversible in production.")) {
      await storageService.deleteMedia(id);
      await loadMedia();
    }
  };

  const updateAppSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await storageService.updateSettings(updated);
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

  const filteredMedia = media.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.genre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-brand/30">
      <div className="flex">
        <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-[#0c0c0c] border-r border-white/5 z-[70] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full p-8">
            <div className="flex items-center justify-between mb-12">
              <Link to="/" className="text-brand text-3xl font-black tracking-tighter italic">STREAMX</Link>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2"><X className="w-6 h-6" /></button>
            </div>
            <nav className="flex-1 space-y-3">
              <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl font-semibold transition-all ${activeTab === 'overview' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white'}`}>
                <BarChart3 className="w-5 h-5" /> <span>Catalog</span>
              </button>
              <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white'}`}>
                <SettingsIcon className="w-5 h-5" /> <span>Settings</span>
              </button>
            </nav>
            <div className="mt-auto pt-8 border-t border-white/5 space-y-4">
              <button onClick={() => { localStorage.removeItem('admin_session'); navigate('/'); }} className="w-full flex items-center space-x-3 px-5 py-3 text-sm text-gray-500 hover:text-brand transition-all">
                <LogOut className="w-4 h-4" /> <span>Logout Session</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-12 space-y-10 w-full overflow-hidden">
          {activeTab === 'overview' ? (
            <>
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center space-x-5">
                  <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-white/5 rounded-2xl"><Menu className="w-6 h-6" /></button>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic leading-none">Catalog Hub</h1>
                    <p className="text-gray-500 font-medium tracking-wide">Production Database Status: Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button onClick={loadMedia} className={`p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all ${isRefreshing ? 'animate-spin' : ''}`}><RefreshCcw className="w-5 h-5" /></button>
                  <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-3xl flex items-center justify-center space-x-3 transition-all font-bold">
                    <Plus className="w-6 h-6" /> <span>New Entry</span>
                  </button>
                </div>
              </header>

              <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h3 className="font-bold text-2xl uppercase italic tracking-tighter">Database Records</h3>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input type="text" placeholder="Filter records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all w-full" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr className="text-gray-600 text-xs uppercase tracking-widest font-bold border-b border-white/5 bg-white/[0.01]">
                        <th className="px-8 py-5">Metadata</th>
                        <th className="px-8 py-5">Modality</th>
                        <th className="px-8 py-5">Released</th>
                        <th className="px-8 py-5 text-right">Control</th>
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
                              <button onClick={() => handleEdit(item)} className="p-3 hover:bg-white/5 rounded-2xl text-gray-400 hover:text-white transition-all"><Edit className="w-5 h-5" /></button>
                              <button onClick={() => handleDelete(item.id)} className="p-3 hover:bg-brand/10 text-brand rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
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
               <h1 className="text-4xl font-black tracking-tight uppercase italic leading-none">Security & Status</h1>
               <div className="bg-[#0c0c0c] p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-2xl">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-orange-500/10 rounded-2xl"><ShieldAlert className="w-8 h-8 text-orange-500" /></div>
                    <div>
                        <h4 className="font-black uppercase italic tracking-tighter text-xl">Operational Guard</h4>
                        <p className="text-xs text-gray-500 font-medium">Platform reachability and synchronization</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-8 bg-black/40 rounded-[2rem] border border-white/5">
                    <div className="space-y-1">
                        <span className="font-bold text-lg tracking-wide block">Lockdown Mode</span>
                        <p className="text-xs text-gray-500 italic font-medium">Restricts all public access to the StreamX catalog.</p>
                    </div>
                    <button 
                      onClick={() => updateAppSettings({ isMaintenanceMode: !settings.isMaintenanceMode })}
                      className={`w-16 h-9 rounded-full transition-all relative shrink-0 ${settings.isMaintenanceMode ? 'bg-brand' : 'bg-gray-800'}`}
                    >
                        <div className={`absolute top-1 w-7 h-7 rounded-full bg-white transition-all shadow-lg ${settings.isMaintenanceMode ? 'left-8' : 'left-1'}`} />
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
          <div className="relative bg-[#0c0c0c] border border-white/5 w-full max-w-5xl md:rounded-[3rem] shadow-2xl flex flex-col max-h-[100vh] md:max-h-[95vh] overflow-hidden">
             {/* ... Modal content similar to previous version but calling async storageService ... */}
             <div className="p-6 md:p-10 border-b border-white/5 shrink-0 bg-[#0c0c0c]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">{isEditing ? 'Modify Catalog Record' : 'Create Catalog Record'}</h2>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-white/5 rounded-3xl transition-all border border-white/5"><X className="w-7 h-7" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
              <form onSubmit={handleSubmit} className="h-full">
                {activeStep === 1 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Poster URL</label>
                        <input required value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all font-medium text-sm" />
                      </div>
                    </div>
                    <div className="lg:col-span-8 space-y-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Title</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="flex-1 bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-6 py-5 font-black text-2xl italic tracking-tighter" />
                          <button type="button" onClick={autoEnhance} disabled={loadingAI} className="bg-brand text-white px-8 py-5 rounded-[1.5rem] flex items-center space-x-2 font-black text-xs">
                             {loadingAI ? <RefreshCcw className="animate-spin w-4 h-4" /> : <Database className="w-4 h-4" />}
                             <span>SYNC METADATA</span>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Overview</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={4} className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-6 py-5 font-medium resize-none leading-relaxed text-gray-300" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Master Video Resource</label>
                    <input required value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="Direct mp4/mkv link" className="w-full bg-white/[0.03] border border-white/5 rounded-[1.5rem] px-8 py-6 font-mono text-sm" />
                  </div>
                )}
              </form>
            </div>
            <div className="p-8 border-t border-white/5 flex items-center justify-between shrink-0 bg-[#0c0c0c]">
              <button type="button" onClick={() => activeStep === 1 ? setIsAdding(false) : setActiveStep(1)} className="px-8 py-4 rounded-2xl bg-white/5 text-white font-black uppercase italic text-xs tracking-widest">{activeStep === 1 ? 'Cancel' : 'Back'}</button>
              <button type="button" onClick={(e) => activeStep === 1 ? setActiveStep(2) : handleSubmit(e as any)} className="px-10 py-4 rounded-2xl bg-brand hover:bg-brand-dark text-white font-black uppercase italic text-xs tracking-widest">{activeStep === 1 ? 'Next Phase' : 'Commit Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;