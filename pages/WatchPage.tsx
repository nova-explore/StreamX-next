
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storageService } from '../services/storageService';
import { Media, Episode, Season } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import { 
  ChevronRight, 
  Play, 
  LayoutGrid, 
  ChevronDown, 
  ListMusic, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Layers
} from 'lucide-react';

const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Media | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSeasonSelectorOpen, setIsSeasonSelectorOpen] = useState(false);
  const navigate = useNavigate();

  // Fix: storageService.getMedia is async and must be awaited inside an async function within useEffect.
  // Added await storageService.init() to ensure database connectivity for deep-linked entries.
  useEffect(() => {
    const loadItem = async () => {
      if (id) {
        await storageService.init();
        const data = await storageService.getMedia();
        const found = data.find(m => m.id === id);
        if (found) {
          setItem(found);
          if (found.type === 'series' && found.seasons?.length) {
            setCurrentSeason(found.seasons[0]);
            if (found.seasons[0].episodes?.length) {
              setCurrentEpisode(found.seasons[0].episodes[0]);
            }
          } else if (found.type === 'movie') {
            // Track movie progress
            storageService.setWatchedProgress(found.id, 100);
          }
        } else {
          navigate('/');
        }
      }
    };
    loadItem();
  }, [id, navigate]);

  // Mark episode as watched when it changes
  useEffect(() => {
    if (currentEpisode) {
      storageService.setWatchedProgress(currentEpisode.id, 100);
    }
  }, [currentEpisode]);

  const nextUp = useMemo(() => {
    if (!currentSeason || !currentEpisode) return null;
    const currentIndex = currentSeason.episodes.findIndex(e => e.id === currentEpisode.id);
    if (currentIndex < currentSeason.episodes.length - 1) {
      return currentSeason.episodes[currentIndex + 1];
    }
    const currentSeasonIndex = item?.seasons?.findIndex(s => s.id === currentSeason.id) ?? -1;
    if (item?.seasons && currentSeasonIndex < item.seasons.length - 1) {
      return item.seasons[currentSeasonIndex + 1].episodes[0];
    }
    return null;
  }, [currentSeason, currentEpisode, item]);

  const handleNextEpisode = () => {
    if (nextUp) {
      // Logic to find if nextUp is in current season or next
      const isNextInCurrent = currentSeason?.episodes.some(e => e.id === nextUp.id);
      if (isNextInCurrent) {
        setCurrentEpisode(nextUp);
      } else if (item?.seasons) {
        const nextSeason = item.seasons.find(s => s.episodes.some(e => e.id === nextUp.id));
        if (nextSeason) {
          setCurrentSeason(nextSeason);
          setCurrentEpisode(nextUp);
        }
      }
    }
  };

  if (!item) return null;

  const activeVideoUrl = item.type === 'movie' ? item.videoUrl : currentEpisode?.videoUrl;
  const activeTitle = item.type === 'movie' ? item.title : `${item.title}: ${currentEpisode?.title}`;

  return (
    <div className="bg-[#050505] min-h-screen flex flex-col overflow-hidden selection:bg-brand/30">
      <div className="flex-1 flex flex-col lg:flex-row relative">
        
        {/* Main Theater View */}
        <div className={`flex-1 bg-black relative transition-all duration-1000 ease-[cubic-bezier(0.2,1,0.2,1)] ${
          item.type === 'series' && isSidebarVisible ? 'lg:scale-[0.96] lg:translate-x-[-2%] lg:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]' : 'scale-100 translate-x-0'
        }`}>
          {activeVideoUrl ? (
            <VideoPlayer url={activeVideoUrl} title={activeTitle || ''} />
          ) : (
            <div className="h-screen flex flex-col items-center justify-center space-y-8">
               <div className="relative">
                  <div className="w-24 h-24 border-2 border-brand/10 rounded-full" />
                  <div className="absolute inset-0 w-24 h-24 border-t-2 border-brand rounded-full animate-spin" />
               </div>
               <p className="text-gray-500 font-black uppercase tracking-[0.5em] text-[10px] italic animate-pulse">Initializing Stream</p>
            </div>
          )}
          
          {/* Floating Sidebar Trigger */}
          {item.type === 'series' && !isSidebarVisible && (
            <button 
                onClick={() => setIsSidebarVisible(true)}
                className="absolute top-1/2 right-8 -translate-y-1/2 p-6 bg-white/5 backdrop-blur-3xl rounded-full border border-white/10 hover:bg-brand hover:border-brand transition-all z-20 group hover:scale-110 active:scale-95 shadow-2xl"
            >
                <ListMusic className="w-6 h-6 text-white group-hover:text-black transition-colors" />
            </button>
          )}
        </div>

        {/* Minimalist Sidebar */}
        {item.type === 'series' && item.seasons && (
          <aside className={`fixed top-0 right-0 bottom-0 w-full lg:w-[420px] bg-black/40 backdrop-blur-2xl z-50 flex flex-col transition-all duration-1000 ease-[cubic-bezier(0.2,1,0.2,1)] ${
            isSidebarVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
          }`}>
            
            {/* Header: Series Context */}
            <div className="p-10 pb-6">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center space-x-3 text-brand">
                  <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  <span className="font-black uppercase tracking-[0.4em] text-[9px] italic">Series Hub</span>
                </div>
                <button 
                  onClick={() => setIsSidebarVisible(false)}
                  className="p-3 hover:bg-white/10 rounded-2xl transition-all group"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              {/* Ultra-Sleek Season Toggle */}
              <div className="relative">
                <button 
                  onClick={() => setIsSeasonSelectorOpen(!isSeasonSelectorOpen)}
                  className="flex items-center space-x-4 w-full p-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 rounded-full transition-all group"
                >
                  <div className="w-12 h-12 bg-white/10 group-hover:bg-brand rounded-full flex items-center justify-center font-black italic text-sm transition-colors duration-500">
                    {currentSeason?.seasonNumber}
                  </div>
                  <div className="flex-1 text-left">
                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Season {currentSeason?.seasonNumber}</h2>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{currentSeason?.episodes.length} Episodes</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 mr-4 text-gray-600 transition-transform duration-500 ${isSeasonSelectorOpen ? 'rotate-180 text-brand' : ''}`} />
                </button>

                {isSeasonSelectorOpen && (
                  <div className="absolute top-full left-0 right-0 mt-4 bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-[0_40px_100px_rgba(0,0,0,1)] py-4 z-50 animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-3xl">
                    {item.seasons.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setCurrentSeason(s);
                          setIsSeasonSelectorOpen(false);
                          if (s.episodes.length > 0) setCurrentEpisode(s.episodes[0]);
                        }}
                        className={`w-full text-left px-8 py-5 hover:bg-brand/10 transition-all font-black uppercase italic tracking-tighter text-sm flex items-center justify-between ${currentSeason?.id === s.id ? 'text-brand' : 'text-gray-500 hover:text-white'}`}
                      >
                        <span>Season {s.seasonNumber}</span>
                        {currentSeason?.id === s.id && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Episode Scroll: Minimal Cards */}
            <div className="flex-1 overflow-y-auto px-8 space-y-3 scrollbar-hide py-4">
              {currentSeason?.episodes?.map((ep, idx) => {
                const isActive = currentEpisode?.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setCurrentEpisode(ep);
                      if (window.innerWidth < 1024) setIsSidebarVisible(false);
                    }}
                    className={`w-full group relative flex flex-col p-6 rounded-[2rem] transition-all duration-500 border overflow-hidden text-left ${
                      isActive 
                        ? 'bg-brand/5 border-brand/30 shadow-[0_20px_40px_rgba(41,168,41,0.05)]' 
                        : 'bg-transparent border-transparent hover:bg-white/[0.03] active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center space-x-6 relative z-10">
                      <div className={`shrink-0 text-3xl font-black italic tracking-tighter transition-all duration-700 ${isActive ? 'text-brand opacity-100 scale-110' : 'text-white/5 group-hover:text-white/20'}`}>
                        {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-black uppercase tracking-widest transition-all duration-500 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>
                          {ep.title}
                        </h4>
                        <div className="flex items-center space-x-3 mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                           <span className="text-[8px] font-black uppercase tracking-[0.3em]">Part {idx + 1}</span>
                           <span className="w-1 h-1 bg-white/20 rounded-full" />
                           <span className="text-[8px] font-black uppercase tracking-[0.3em] flex items-center">
                             <Clock className="w-3 h-3 mr-1" /> {ep.duration || '45m'}
                           </span>
                        </div>
                      </div>
                      {isActive && <Play className="w-4 h-4 text-brand fill-brand animate-pulse" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Footer: Quick Controls */}
            <div className="p-10 pt-4 space-y-6">
                {nextUp && (
                  <button 
                    onClick={handleNextEpisode}
                    className="w-full group flex items-center justify-between p-5 bg-white text-black rounded-[2rem] transition-all hover:bg-brand hover:text-white active:scale-95 shadow-2xl"
                  >
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4 fill-current" />
                       </div>
                       <div className="text-left">
                          <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Next Segment</p>
                          <h5 className="text-[10px] font-black uppercase truncate max-w-[140px] tracking-tight">{nextUp.title}</h5>
                       </div>
                    </div>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </button>
                )}

                <div className="flex items-center justify-between px-2">
                   <button 
                      onClick={() => navigate('/')}
                      className="flex items-center space-x-3 text-gray-500 hover:text-white transition-all font-black uppercase text-[9px] tracking-[0.3em]"
                   >
                      <LayoutGrid className="w-4 h-4" />
                      <span>The Hub</span>
                   </button>
                   <button 
                      className="flex items-center space-x-3 text-gray-500 hover:text-white transition-all font-black uppercase text-[9px] tracking-[0.3em]"
                   >
                      <Layers className="w-4 h-4" />
                      <span>Details</span>
                   </button>
                </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default WatchPage;
