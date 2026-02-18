import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';
import { Media, ContentType, AppSettings } from '../types';
import { Plus, Trash2, Edit, X, Search, BarChart3, Menu, Database, Settings as SettingsIcon, ShieldAlert, LogOut, RefreshCcw } from 'lucide-react';
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
    title: '', type: 'movie', thumbnailUrl: '', backdropUrl: '', videoUrl: '',
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
    if (localStorage.getItem('admin_session') !== 'true') navigate('/login');
    else loadMedia();
  }, [navigate, loadMedia]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (dataToSave.type === 'movie') delete dataToSave.seasons;
    else delete dataToSave.videoUrl;

    if (isEditing) {
      await storageService.updateMedia(dataToSave as Media);
    } else {
      const added = await storageService.addMedia(dataToSave as any);
      if (added) {
        await storageService.addNotification({
          title: 'New Release',
          message: `${added.title} is now available to stream in 4K.`,
          thumbnailUrl: added.thumbnailUrl
        });
      }
    }
    
    await loadMedia();
    setIsAdding(false);
    setIsEditing(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ title: '', type: 'movie', thumbnailUrl: '', backdropUrl: '', videoUrl: '', description: '', genre: '', year: new Date().getFullYear(), rating: 8.0, seasons: [] });
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
    if (window.confirm("Confirm deletion?")) {
      await storageService.deleteMedia(id);
      await loadMedia();
    }
  };

  const autoEnhance = async () => {
    if (!formData.title) return alert('Enter a title');
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
        <aside className={`fixed lg:sticky top-0 h-screen w-72 bg-[#0c0c0c] border-r border-white/5 z-40 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex flex-col h-full p-8">
            <Link to="/" className="text-brand text-3xl font-black italic mb-12">STREAMX</Link>
            <nav className="flex-1 space-y-2">
              <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white'}`}>
                <BarChart3 className="w-5 h-5" /> <span>Catalog</span>
              </button>
              <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-5 py-3 rounded-2xl font-bold transition-all ${activeTab === 'settings' ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white'}`}>
                <SettingsIcon className="w-5 h-5" /> <span>Security</span>
              </button>
            </nav>
            <button onClick={() => { localStorage.removeItem('admin_session'); navigate('/'); }} className="flex items-center space-x-3 px-5 py-3 text-sm text-gray-500 hover:text-brand transition-all mt-auto border-t border-white/5 pt-8">
              <LogOut className="w-4 h-4" /> <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-12 space-y-10">
          <header className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Admin Core</h1>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Production Control Center</p>
            </div>
            <div className="flex space-x-4">
              <button onClick={loadMedia} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><RefreshCcw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
              <button onClick={() => { resetForm(); setIsAdding(true); }} className="bg-brand px-8 py-4 rounded-2xl font-black flex items-center space-x-3 shadow-2xl shadow-brand/20">
                <Plus className="w-6 h-6" /> <span>ADD ENTRY</span>
              </button>
            </div>
          </header>

          <div className="bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between gap-6">
               <h3 className="text-xl font-black italic tracking-tighter">Database Records ({filteredMedia.length})</h3>
               <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input type="text" placeholder="Search entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs" />
               </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-gray-600 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                        <th className="px-8 py-5">Item</th>
                        <th className="px-8 py-5">Type</th>
                        <th className="px-8 py-5">Year</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {filteredMedia.map(item => (
                       <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="px-8 py-5">
                             <div className="flex items-center space-x-4">
                                <img src={item.thumbnailUrl} className="w-12 h-16 object-cover rounded-lg" />
                                <span className="font-bold">{item.title}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5"><span className="text-[10px] font-black uppercase text-brand">{item.type}</span></td>
                          <td className="px-8 py-5 text-gray-500 font-bold">{item.year}</td>
                          <td className="px-8 py-5 text-right">
                             <button onClick={() => handleEdit(item)} className="p-2 hover:text-brand"><Edit className="w-4 h-4" /></button>
                             <button onClick={() => handleDelete(item.id)} className="p-2 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        </main>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsAdding(false)} />
          <div className="relative bg-[#0c0c0c] border border-white/5 w-full max-w-4xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Catalog Entry</h2>
                <button onClick={() => setIsAdding(false)}><X className="w-8 h-8" /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Title</label>
                      <div className="flex space-x-2">
                         <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm" />
                         <button type="button" onClick={autoEnhance} disabled={loadingAI} className="bg-brand px-4 rounded-xl">
                            <Database className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
                         </button>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Content Type</label>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm">
                         <option value="movie">Movie</option>
                         <option value="series">Series</option>
                      </select>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Description</label>
                   <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm h-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Poster URL</label>
                      <input required value={formData.thumbnailUrl} onChange={e => setFormData({...formData, thumbnailUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600">Video URL (Direct link)</label>
                      <input required value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm" />
                   </div>
                </div>
                <button type="submit" className="w-full bg-brand py-5 rounded-2xl font-black italic tracking-tighter text-xl shadow-2xl shadow-brand/20">SAVE RECORD</button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;