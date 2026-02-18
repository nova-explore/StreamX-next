import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Plus, Check, ThumbsUp, Star, Clock, Share2, CheckCircle2 } from 'lucide-react';
import { Media, Season } from '../types';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';

interface DetailsModalProps {
  item: Media;
  onClose: () => void;
  isInList: boolean;
  onToggleList: () => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({ item, onClose, isInList, onToggleList }) => {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(
    item.type === 'series' && item.seasons && item.seasons.length > 0 ? item.seasons[0] : null
  );
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    storageService.getMedia().then(all => {
      const filtered = all
        .filter(m => m.id !== item.id && m.genre.split(',').some(g => item.genre.includes(g.trim())))
        .slice(0, 4);
      setRecommendations(filtered);
    });
  }, [item.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollProgress(Math.min(e.currentTarget.scrollTop / 400, 1));
  };

  const getEpisodeProgress = (id: string) => storageService.getWatchedProgress(id);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-10 overflow-hidden">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="relative bg-[#0a0a0a] w-full max-w-6xl md:rounded-[2.5rem] overflow-y-auto shadow-2xl animate-in zoom-in-95 h-full md:h-[90vh] scrollbar-hide"
      >
        <div className="fixed md:absolute top-0 left-0 right-0 z-[110] px-6 py-4 flex items-center justify-between transition-all" style={{ backgroundColor: `rgba(10, 10, 10, ${scrollProgress})` }}>
          <h3 className={`text-xl font-black uppercase italic tracking-tighter transition-opacity duration-300 ${scrollProgress > 0.5 ? 'opacity-100' : 'opacity-0'}`}>{item.title}</h3>
          <div className="flex items-center space-x-3">
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all"><Share2 className="w-5 h-5" /></button>
            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-brand rounded-full border border-white/10 transition-all group"><X className="w-5 h-5 group-hover:scale-110" /></button>
          </div>
        </div>

        <div className="relative w-full aspect-[16/9] md:aspect-video shrink-0 overflow-hidden">
          <div className="absolute inset-0 transition-transform duration-100" style={{ transform: `translateY(${scrollProgress * 150}px) scale(${1 + scrollProgress * 0.05})` }}>
            {item.backdropUrl ? (
              <>
                <img src={item.backdropUrl} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full bg-[#050505] flex items-center justify-center p-20">
                <img src={item.thumbnailUrl} className="w-full max-w-xs aspect-[2/3] object-cover rounded-2xl shadow-2xl border border-white/10" alt="" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(41,168,41,0.1)_0%,_transparent_70%)]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent opacity-80" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 space-y-8 z-20">
            <div className="flex items-center space-x-3 font-black uppercase italic text-[10px] tracking-widest text-brand animate-in slide-in-from-left-4">
              <Star className="w-3 h-3 fill-current" /> <span>High Fidelity Stream Active</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter drop-shadow-2xl leading-[0.85] animate-in slide-in-from-left-6">{item.title}</h2>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(`/watch/${item.id}`)} className="flex items-center space-x-4 bg-white text-black px-10 py-4 rounded-2xl hover:bg-brand hover:text-white transition-all font-black shadow-xl active:scale-95 group">
                <Play className="w-6 h-6 fill-current" /> <span>PLAY NOW</span>
              </button>
              <button onClick={onToggleList} className={`p-4 border rounded-2xl transition-all ${isInList ? 'bg-brand/20 border-brand text-brand' : 'bg-white/10 border-white/10 text-white'}`}>
                {isInList ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
              </button>
              <button className="p-4 bg-white/10 border border-white/10 rounded-2xl hover:bg-white/20 transition-all"><ThumbsUp className="w-6 h-6" /></button>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-16 pt-12 space-y-20 bg-[#0a0a0a]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center gap-4 text-xs font-black tracking-widest uppercase text-gray-500">
                <span className="text-white">{item.year}</span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-brand">{item.type}</span>
                <span className="text-brand-light">{Math.round(item.rating * 10)}% Match</span>
                <span>4K ULTRA HD</span>
              </div>
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-medium">{item.description}</p>
              <div className="flex flex-wrap gap-2">
                {item.genre.split(',').map(g => (
                  <span key={g} className="bg-white/5 border border-white/5 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400">{g.trim()}</span>
                ))}
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-6">
                <div><span className="text-gray-600 font-black uppercase text-[9px] tracking-widest block mb-2">Network</span><p className="text-sm font-bold text-gray-400">StreamX Originals</p></div>
                <div><span className="text-gray-600 font-black uppercase text-[9px] tracking-widest block mb-2">Resolution</span><p className="text-sm font-bold text-gray-400">Ultra High Definition 2160p</p></div>
                <div><span className="text-gray-600 font-black uppercase text-[9px] tracking-widest block mb-2">Maturity Rating</span><p className="text-sm font-bold text-brand">R (18+)</p></div>
              </div>
            </div>
          </div>

          {item.type === 'series' && item.seasons && (
            <div className="space-y-10">
              <div className="flex items-center justify-between border-b border-white/10 pb-8">
                <h3 className="text-3xl font-black italic uppercase">Episodes</h3>
                <div className="flex gap-2">
                  {item.seasons.map(s => (
                    <button key={s.id} onClick={() => setSelectedSeason(s)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedSeason?.id === s.id ? 'bg-brand text-white' : 'bg-white/5 text-gray-500'}`}>S{s.seasonNumber}</button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4">
                {selectedSeason?.episodes.map((ep, idx) => {
                  const progress = getEpisodeProgress(ep.id);
                  const isWatched = progress >= 100;

                  return (
                    <div 
                      key={ep.id} 
                      onClick={() => navigate(`/watch/${item.id}`)} 
                      className="group relative flex items-center space-x-6 p-6 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 rounded-3xl transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="text-3xl font-black italic text-white/10 group-hover:text-brand w-12 text-center transition-colors duration-500">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                            {ep.title}
                          </h4>
                          {isWatched && <CheckCircle2 className="w-3 h-3 text-brand" />}
                        </div>
                        <div className="flex items-center space-x-3 mt-1 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> <span>{ep.duration || '45m'}</span>
                          {isWatched ? (
                            <span className="text-brand">Completed</span>
                          ) : progress > 0 ? (
                            <span className="text-brand-light">In Progress</span>
                          ) : null}
                        </div>
                      </div>

                      {/* Subtle Progress Bar */}
                      {progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
                          <div 
                            className="h-full bg-brand shadow-[0_0_10px_rgba(41,168,41,0.5)] transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-10">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">More Like This</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recommendations.map(r => (
                  <div key={r.id} onClick={() => { onClose(); setTimeout(() => navigate(`/watch/${r.id}`), 100); }} className="aspect-[2/3] rounded-2xl overflow-hidden relative group cursor-pointer border border-white/5">
                    <img src={r.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                      <p className="text-[10px] font-black uppercase text-white tracking-widest">{r.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;