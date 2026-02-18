import React, { useState, useRef } from 'react';
import { X, Play, Plus, Check, ThumbsUp, Star, Clock, Share2, PlayCircle, CheckCircle2 } from 'lucide-react';
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = Math.min(target.scrollTop / 400, 1);
    setScrollProgress(progress);
  };

  const getEpisodeProgress = (id: string) => {
    return storageService.getWatchedProgress(id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 lg:p-10 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="relative bg-[#0a0a0a] w-full max-w-6xl md:rounded-[2.5rem] overflow-y-auto overflow-x-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 fade-in duration-500 flex flex-col h-full md:h-[90vh] scroll-smooth"
      >
        <div 
          className="fixed md:absolute top-0 left-0 right-0 z-[110] px-6 py-4 flex items-center justify-between transition-all duration-300"
          style={{ backgroundColor: `rgba(10, 10, 10, ${scrollProgress})` }}
        >
          <div className={`transition-opacity duration-300 ${scrollProgress > 0.5 ? 'opacity-100' : 'opacity-0'}`}>
             <h3 className="text-xl font-black uppercase italic tracking-tighter">{item.title}</h3>
          </div>
          <div className="flex items-center space-x-3">
            <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/10 transition-all">
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-3 bg-white/10 hover:bg-brand rounded-full backdrop-blur-md border border-white/10 transition-all group"
            >
              <X className="w-5 h-5 group-hover:scale-110" />
            </button>
          </div>
        </div>

        <div className="relative w-full aspect-[16/9] md:aspect-video shrink-0 overflow-hidden">
          <div 
            className="absolute inset-0 transition-transform duration-100 ease-out"
            style={{ transform: `translateY(${scrollProgress * 150}px) scale(${1 + scrollProgress * 0.1})` }}
          >
            {item.backdropUrl ? (
                <>
                  <img src={item.backdropUrl} className="w-full h-full object-cover" alt={item.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
                </>
            ) : (
                <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-[#050505]">
                  {/* Layer 1: Extreme Stunning Cinematic Blur Background */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                      src={item.thumbnailUrl} 
                      className="w-full h-full object-cover scale-[2.5] blur-[120px] contrast-125 saturate-200 opacity-70" 
                      alt="" 
                    />
                    
                    {/* Layer 2: Vibrant Color Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand/40 via-transparent to-brand/20 mix-blend-color-dodge animate-pulse duration-[10s]" />
                    
                    {/* Layer 3: Stunning Animated Radial Gradient (Breathing Effect) */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#0a0a0a_90%)] opacity-90" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(41,168,41,0.2)_0%,_transparent_60%)] animate-breathe" />
                    
                    {/* Dark Mask for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/40" />
                  </div>

                  {/* Centered Poster as Focal Point with Stunning Border */}
                  <div className="relative z-10 w-48 md:w-72 aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] border-2 border-white/10 translate-y-[-10%] md:translate-y-[-20%] group">
                     <img src={item.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[10s]" alt={item.title} />
                     <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl" />
                  </div>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent opacity-80" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 space-y-8 z-20">
            <div className="flex items-center space-x-3 animate-in slide-in-from-left-4 duration-700">
                <span className="bg-brand px-3 py-1 rounded-full text-[10px] font-black italic tracking-widest uppercase">StreamX Exclusive</span>
                <span className="flex items-center text-brand-light text-xs font-black uppercase tracking-widest">
                  < Star className="w-3 h-3 mr-1 fill-current" /> {Math.round(item.rating * 10)}% Match
                </span>
            </div>
            
            <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] leading-[0.85] animate-in slide-in-from-left-6 duration-700 delay-75 max-w-4xl">
              {item.title}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 animate-in slide-in-from-bottom-4 duration-700 delay-150">
              <button 
                onClick={() => navigate(`/watch/${item.id}`)}
                className="flex items-center space-x-4 bg-white text-black px-12 py-5 rounded-[1.5rem] hover:bg-brand hover:text-white transition-all font-black text-lg shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 group"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>START WATCHING</span>
              </button>
              
              <button 
                onClick={onToggleList}
                className={`p-5 backdrop-blur-xl border border-white/20 rounded-[1.5rem] transition-all active:scale-95 ${isInList ? 'bg-white/20 text-brand' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                {isInList ? <Check className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
              </button>
              
              <button className="p-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] hover:bg-white/20 transition-all active:scale-95">
                <ThumbsUp className="w-7 h-7" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-16 pt-12 space-y-20 relative z-10 bg-[#0a0a0a]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-8 space-y-10">
              <div className="flex items-center flex-wrap gap-6 text-sm font-bold tracking-widest uppercase text-gray-400">
                <span className="text-white">{item.year}</span>
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                <span className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-xl text-[10px] text-gray-300 font-black tracking-widest uppercase">{item.type}</span>
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                <span>4K Ultra HD</span>
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                <span>Dolby Atmos</span>
              </div>
              
              <p className="text-2xl md:text-3xl text-gray-300 leading-[1.4] font-medium tracking-tight">
                {item.description}
              </p>

              <div className="flex flex-wrap gap-3">
                {item.genre.split(',').map(g => (
                    <span key={g} className="bg-[#1a1a1a] border border-white/5 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-brand/20 hover:border-brand/30 transition-all cursor-default">
                      {g.trim()}
                    </span>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
               <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-8 sticky top-24 shadow-2xl">
                  <div>
                    <span className="text-gray-600 font-black uppercase text-[10px] tracking-widest mb-3 block">Featured Cast</span>
                    <p className="text-sm text-gray-400 leading-relaxed font-medium">Michael B. Jordan, Anya Taylor-Joy, Oscar Isaac, Florence Pugh</p>
                  </div>
                  <div>
                    <span className="text-gray-600 font-black uppercase text-[10px] tracking-widest mb-3 block">Audio & Subs</span>
                    <p className="text-sm text-gray-400 font-medium">English (Original), Spanish, French, Japanese, Hindi</p>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Maturity Rating</span>
                        <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-lg text-xs font-black">18+</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          {item.type === 'series' && item.seasons && (
            <div className="space-y-12 animate-in fade-in duration-1000">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/10 pb-10">
                <div className="space-y-2">
                  <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">Episodes</h3>
                  <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Season {selectedSeason?.seasonNumber} • {selectedSeason?.episodes.length} Parts</p>
                </div>
                
                <div className="flex items-center gap-3 p-2 bg-white/[0.03] rounded-[2rem] border border-white/5 overflow-x-auto scrollbar-hide">
                  {item.seasons.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeason(s)}
                      className={`whitespace-nowrap px-8 py-3 rounded-[1.5rem] font-black uppercase italic tracking-widest text-[10px] transition-all ${selectedSeason?.id === s.id ? 'bg-white text-black shadow-xl' : 'text-gray-600 hover:text-white hover:bg-white/5'}`}
                    >
                      Season {s.seasonNumber}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {selectedSeason?.episodes.map((ep, index) => {
                  const progress = getEpisodeProgress(ep.id);
                  const isCompleted = progress >= 100;
                  
                  return (
                    <div 
                      key={ep.id}
                      onClick={() => navigate(`/watch/${item.id}`)}
                      className="group flex flex-col md:flex-row items-stretch space-y-6 md:space-y-0 md:space-x-10 p-8 rounded-[3rem] transition-all bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-brand/30 cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      <div className="flex items-center space-x-6 shrink-0 md:w-80">
                        <div className={`text-5xl font-black italic transition-colors w-16 text-center ${isCompleted ? 'text-brand' : 'text-gray-800/30 group-hover:text-white/20'}`}>
                          {index + 1}
                        </div>
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                          <img src={item.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60" alt="" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                             <PlayCircle className="w-16 h-16 text-white drop-shadow-2xl" />
                          </div>
                          
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                            <div 
                              className="h-full bg-brand transition-all duration-500 shadow-[0_0_100px_rgba(41,168,41,0.5)]" 
                              style={{ width: `${progress}%` }} 
                            />
                          </div>

                          {isCompleted && (
                            <div className="absolute top-3 right-3 p-1.5 bg-brand rounded-full shadow-lg animate-in zoom-in duration-300">
                               <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-2xl md:text-3xl font-black italic uppercase tracking-tight transition-colors ${isCompleted ? 'text-brand' : 'text-gray-400 group-hover:text-white'}`}>
                            {ep.title}
                          </h4>
                          <div className="flex items-center space-x-3 text-gray-500 font-black text-[10px] tracking-widest uppercase bg-white/5 px-4 py-2 rounded-xl">
                             <Clock className="w-3 h-3" />
                             <span>{ep.duration || '45m'}</span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-lg line-clamp-2 font-medium italic group-hover:text-gray-300 transition-colors">
                          {ep.description || 'Secrets of the void begin to unravel as the team faces a decision that will define the fate of the galaxy forever.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-12">
              <h3 className="text-3xl font-black italic tracking-tighter uppercase border-l-8 border-brand pl-6">Recommended For You</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[1,2,3,4].map(i => (
                      <div key={i} className="group aspect-[2/3] bg-white/[0.02] rounded-[2rem] border border-white/5 overflow-hidden relative cursor-pointer hover:border-white/20 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                            <button className="bg-white text-black w-full py-3 rounded-xl font-black uppercase italic tracking-widest text-[10px]">View Details</button>
                        </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>

        <div className="h-24 shrink-0 bg-[#0a0a0a]" />
      </div>
    </div>
  );
};

export default DetailsModal;