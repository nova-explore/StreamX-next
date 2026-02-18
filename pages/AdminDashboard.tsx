
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { Media, AppSettings } from '../types';
import { 
  Plus, Trash2, Edit, X, Search, BarChart3, 
  Database, Settings as SettingsIcon, ShieldAlert, 
  LogOut, RefreshCcw, AlertTriangle, Cloud, 
  Server, ShieldCheck, ToggleLeft, ToggleRight,
  CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [media, setMedia] = useState<Media[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({ isMaintenanceMode: false });
  const [formData, setFormData] = useState<any>({
    title: '', type: 'movie', thumbnailUrl: '', backdropUrl: '', videoUrl: '',
    description: '', genre: '', year: new Date().getFullYear(), rating: 8.0, seasons: []
  });

  const navigate = useNavigate();

  const loadMedia = useCallback(async () => {
    setIsRefreshing(true);
    await storageService.init();
    const data = await storageService.getMedia();
    const sets = await storageService.getSettings();
    setMedia(data);
    setSettings(sets);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('admin_session') !== 'true') navigate('/login');
    else loadMedia();
  }, [navigate, loadMedia]);

  const toggleMaintenance = async () => {
    const newState = !settings.isMaintenanceMode;
    await storageService.setMaintenanceMode(newState);
    setSettings({ ...settings, isMaintenanceMode: newState });
  };

  const productionStatus = useMemo(() => ({
    turso: !!process.env.TURSO_DATABASE_URL,
    gemini: !!process.env.API_KEY,
    auth: !!(process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS)
  }), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      await storageService.updateMedia(formData as Media);
    } else {
      await storageService.addMedia(formData);
    }
    await loadMedia();
    setIsAdding(false);
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ title: '', type: 'movie', thumbnailUrl: '', backdropUrl: '', videoUrl: '', description: '', genre: '', year: new Date().getFullYear(), rating: 8.0, seasons: [] });
    setIsEditing(false);
  };

  const handleEdit = (item: Media) => {
    setFormData({ ...item });
    setIsEditing(true);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete record permanently?")) {
      await storageService.deleteMedia(id);
      await loadMedia();
    }
  };

  const autoEnhance = async () => {
    if (!formData.title) return alert('Entry title required for AI synthesis.');
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
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed lg:sticky top-0 h-screen w-72 bg-[#0c0c0c] border-r border-white/5 z-40 p-8 flex flex-col">
          <Link to="/" className="text-brand text-3xl font-black italic mb-12 flex items-center gap-3">
             <Server className="w-8 h-8" /> STREAMX
          </Link>
          <nav className="flex-1 space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white'}`}>
              <BarChart3 className="w-5 h-5" /> <span>Catalog Control</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white'}`}>
              <SettingsIcon className="w-5 h-5" /> <span>Security Hub</span>
            </button>
          </nav>
          
          <div className="mt-auto space-y-4">
            <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
               <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-3">System Health</p>
               <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                     <span className="text-gray-400">Database</span>
                     {productionStatus.turso ? <CheckCircle2 className="w-3 h-3 text-brand" /> : <AlertTriangle className="w-3 h-3 text-orange-500" />}
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                     <span className="text-gray-400">Gemini AI</span>
                     {productionStatus.gemini ? <CheckCircle2 className="w-3 h-3 text-brand" /> : <AlertTriangle className="w-3 h-3 text-orange-500" />}
                  </div>
               </div>
            </div>
            <button onClick={() => { localStorage.removeItem('admin_session'); navigate('/'); }} className="w-full flex items-center space-x-3 px-5 py-3 text-sm text-gray-500 hover:text-red-500 transition-all">
              <LogOut className="w-4 h-4" /> <span>System Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-12 space-y-10">
          {activeTab === 'overview' ? (
            <>
              <header className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter">Production Grid</h1>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Real-time content management</p>
                </div>
                <div className="flex space-x-4">
                  <button onClick={loadMedia} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all shadow-xl"><RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
                  <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-brand px-8 py-4 rounded-2xl font-black flex items-center space-x-3 shadow-2xl shadow-brand/20 hover:scale-[1.02] active:scale-98 transition-all">
                    <Plus className="w-6 h-6" /> <span>PUBLISH ENTRY</span>
                  </button>
                </div>
              </header>

              {!productionStatus.turso && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6 flex items-center gap-6 animate-pulse">
                   <Cloud className="w-10 h-10 text-orange-500" />
                   <div>
                      <h4 className="font-black uppercase italic tracking-tighter text-orange-500">Demo Environment Active</h4>
                      <p className="text-orange-500/60 text-xs font-bold uppercase tracking-widest">Database credentials not detected. Changes are volatile.</p>
                   </div>
                </div>
              )}

              <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between gap-6 items-center">
                   <div className="flex items-center space-x-4">
                     <Database className="w-6 h-6 text-brand" />
                     <h3 className="text-xl font-black italic tracking-tighter uppercase">Catalog Archive</h3>
                   </div>
                   <div className="relative w-full md:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input type="text" placeholder="Filter by title or genre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-xs focus:border-brand transition-all outline-none" />
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-gray-600 text-[10px] uppercase font-black tracking-[0.2em] border-b border-white/5">
                            <th className="px-8 py-6">Identity</th>
                            <th className="px-8 py-6">Format</th>
                            <th className="px-8 py-6 text-right">Directives</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {filteredMedia.map(item => (
                           <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6">
                                 <div className="flex items-center space-x-5">
                                    <div className="relative group/poster">
                                       <img src={item.thumbnailUrl} className="w-14 h-20 object-cover rounded-xl border border-white/5 group-hover/poster:border-brand transition-all shadow-lg" />
                                       <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover/poster:opacity-100 transition-opacity rounded-xl" />
                                    </div>
                                    <div>
                                      <p className="font-black uppercase italic tracking-tighter text-lg leading-tight group-hover:text-brand transition-colors">{item.title}</p>
                                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">{item.year} • {item.genre}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6">
                                 <span className="text-[10px] font-black uppercase text-brand tracking-widest bg-brand/5 border border-brand/10 px-4 py-1.5 rounded-full">{item.type}</span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                 <button onClick={() => handleEdit(item)} className="p-4 text-gray-600 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Edit className="w-5 h-5" /></button>
                                 <button onClick={() => handleDelete(item.id)} className="p-4 text-gray-600 hover:text-red-500 hover:bg-red-500/5 rounded-2xl transition-all"><Trash2 className="w-5 h-5" /></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter">Security & Global</h1>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1 italic">Configure core platform behavior</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#0c0c0c] p-10 rounded-[2.5rem] border border-white/5 space-y-6">
                     <div className="flex items-center space-x-4 mb-4">
                        <ShieldAlert className="w-8 h-8 text-brand" />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Maintenance</h3>
                     </div>
                     <p className="text-gray-500 text-sm font-medium leading-relaxed">Toggle restricted access mode. When active, only authorized administrators can access the primary catalog.</p>
                     <button onClick={toggleMaintenance} className="flex items-center space-x-4 group">
                        {settings.isMaintenanceMode ? <ToggleRight className="w-12 h-12 text-brand" /> : <ToggleLeft className="w-12 h-12 text-gray-700" />}
                        <span className={`text-xs font-black uppercase tracking-widest ${settings.isMaintenanceMode ? 'text-brand' : 'text-gray-500'}`}>
                           {settings.isMaintenanceMode ? 'Active Restriction' : 'Public Access'}
                        </span>
                     </button>
                  </div>

                  <div className="bg-[#0c0c0c] p-10 rounded-[2.5rem] border border-white/5 space-y-6">
                     <div className="flex items-center space-x-4 mb-4">
                        <ShieldCheck className="w-8 h-8 text-brand" />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Environment</h3>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Secure Database</span>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${productionStatus.turso ? 'text-brand' : 'text-orange-500'}`}>
                              {productionStatus.turso ? 'Online' : 'Volatile'}
                           </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Synthesis Engine</span>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${productionStatus.gemini ? 'text-brand' : 'text-orange-500'}`}>
                              {productionStatus.gemini ? 'Ready' : 'Offline'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setIsAdding(false)} />
          <div className="relative bg-[#0c0c0c] border border-white/10 w-full max-w-4xl rounded-[3rem] p-10 md:p-14 max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] scrollbar-hide animate-in zoom-in-95 duration-500">
             <div className="flex justify-between items-center mb-12">
                <div>
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter">{isEditing ? 'Sync Record' : 'Create Entry'}</h2>
                   <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1 italic">StreamX Content Injection Protocol</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-white/5 rounded-full transition-all group"><X className="w-8 h-8 group-hover:scale-110" /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3">Primary Identity</label>
                      <div className="flex gap-3">
                         <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand outline-none transition-all shadow-inner text-lg" placeholder="e.g. Inception" />
                         <button 
                           type="button" 
                           onClick={autoEnhance} 
                           disabled={loadingAI || !productionStatus.gemini} 
                           className={`bg-brand text-white px-8 rounded-2xl hover:bg-brand-dark transition-all disabled:opacity-20 flex items-center justify-center shadow-xl shadow-brand/20 ${loadingAI ? 'animate-pulse' : 'hover:scale-105 active:scale-95'}`}
                         >
                            {loadingAI ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Cloud className="w-6 h-6" />}
                         </button>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3">Format Protocol</label>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:border-brand outline-none transition-all appearance-none cursor-pointer text-lg uppercase font-black italic tracking-tighter">
                         <option value="movie">Feature Film</option>
                         <option value="series">Episodic Series</option>
                      </select>
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3">Narrative Synopsis</label>
                   <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-8 py-6 h-40 focus:border-brand outline-none transition-all text-gray-300 leading-relaxed font-medium" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3">Visual Key (Poster)</label>
                      <input required value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:border-brand outline-none" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-3">Cloud Origin (Stream Link)</label>
                      <input required value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:border-brand outline-none" placeholder="https://cdn.example.com/movie.mp4" />
                   </div>
                </div>

                <button type="submit" className="w-full bg-brand py-8 rounded-[2.5rem] font-black italic tracking-tighter text-3xl shadow-[0_20px_60px_rgba(41,168,41,0.3)] hover:scale-[1.01] active:scale-98 transition-all uppercase">
                  {isEditing ? 'Execute Sync' : 'Initialize Protocol'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
