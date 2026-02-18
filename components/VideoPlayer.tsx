import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, Volume2, Volume1, VolumeX, Maximize, ArrowLeft, 
  RotateCcw, RotateCw, Settings, Check, Gauge, Monitor, 
  MonitorPlay, Badge
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VideoPlayerProps {
  url: string;
  title: string;
}

type MenuType = 'root' | 'speed' | 'quality';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(0.5); // Initial volume at 50%
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [activeMenu, setActiveMenu] = useState<MenuType>('root');
  const [showSettings, setShowSettings] = useState(false);

  // Set initial volume on video load
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, []);

  useEffect(() => {
    let timeout: any;
    const handleInteraction = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying && !showSettings) setShowControls(false);
      }, 3000);
    };
    
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    
    return () => {
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      clearTimeout(timeout);
    };
  }, [isPlaying, showSettings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSettings) {
        if (e.key === 'Escape') setShowSettings(false);
        return;
      }
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowleft':
          skip(-10);
          break;
        case 'arrowright':
          skip(10);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, showSettings]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setDuration(total);
      const prog = (current / total) * 100;
      setProgress(isNaN(prog) ? 0 : prog);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && containerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
      setIsMuted(v === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setActiveMenu('root');
  };

  const changeQuality = (q: string) => {
    setQuality(q);
    setActiveMenu('root');
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    setActiveMenu('root');
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-8 h-8 text-brand" />;
    if (volume < 0.5) return <Volume1 className="w-8 h-8" />;
    return <Volume2 className="w-8 h-8" />;
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center group select-none"
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        src={url}
        className="max-h-full w-full object-contain cursor-none"
        onTimeUpdate={handleProgress}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
        playsInline
      />

      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-1000 flex flex-col justify-between p-8 md:p-16 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Minimal Top Bar */}
        <div className="flex items-start justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center space-x-6 text-white/40 hover:text-white transition-all"
          >
            <div className="p-3 bg-white/5 rounded-full border border-white/5 group-hover:bg-white/10 group-hover:border-white/20 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand opacity-80 mb-1 italic">StreamX Cinema</p>
              <h1 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter truncate max-w-[200px] md:max-w-2xl">{title}</h1>
            </div>
          </button>
          
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-3 bg-brand/10 border border-brand/20 px-5 py-2 rounded-full shadow-lg shadow-brand/10">
              {/* Fix: Replaced non-existent 'BadgeHd' icon with 'Badge' from 'lucide-react' */}
              <Badge className="w-4 h-4 text-brand" />
              <span className="text-[9px] font-black uppercase tracking-widest italic text-brand">Ultra HD 4K Active</span>
            </div>
            <MonitorPlay className="w-8 h-8 text-white/20" />
          </div>
        </div>

        {/* Cinematic Center Controls */}
        <div className="absolute inset-0 flex items-center justify-center space-x-12 md:space-x-32 pointer-events-none">
          <button 
            onClick={(e) => { e.stopPropagation(); skip(-10); }}
            className="p-8 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-3xl pointer-events-auto transition-all active:scale-90 border border-white/5 group/skip opacity-0 group-hover:opacity-100 duration-500"
          >
            <RotateCcw className="w-10 h-10 text-white/60 group-hover/skip:rotate-[-45deg] transition-transform" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="p-12 md:p-16 bg-white text-black rounded-full pointer-events-auto transition-all hover:scale-110 active:scale-95 shadow-[0_0_100px_rgba(255,255,255,0.1)] group/play"
          >
            {isPlaying ? <Pause className="w-14 h-14 fill-current" /> : <Play className="w-14 h-14 fill-current translate-x-1" />}
          </button>

          <button 
            onClick={(e) => { e.stopPropagation(); skip(10); }}
            className="p-8 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-3xl pointer-events-auto transition-all active:scale-90 border border-white/5 group/skip opacity-0 group-hover:opacity-100 duration-500"
          >
            <RotateCw className="w-10 h-10 text-white/60 group-hover/skip:rotate-[45deg] transition-transform" />
          </button>
        </div>

        {/* Minimal Bottom Bar */}
        <div className="space-y-10" onClick={(e) => e.stopPropagation()}>
          {/* Progress Bar: Elegant Line */}
          <div className="group/progress relative w-full h-1.5 bg-white/10 rounded-full cursor-pointer transition-all hover:h-2.5" onClick={seek}>
            <div 
              className="absolute h-full bg-brand rounded-full transition-all duration-100 ease-linear shadow-[0_0_20px_rgba(41,168,41,0.8)]"
              style={{ width: `${progress}%` }}
            />
            {/* Seeker Head */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-2xl border-2 border-brand"
              style={{ left: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 md:space-x-10">
              <button onClick={togglePlay} className="hover:scale-125 transition-transform">
                {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white" />}
              </button>
              
              <div className="flex items-center space-x-4 group/vol relative">
                <button onClick={toggleMute} className="hover:scale-125 transition-transform text-white/60 hover:text-white">
                  {getVolumeIcon()}
                </button>
                <div className="w-24 md:w-0 group-hover/vol:w-40 transition-all duration-500 overflow-hidden flex items-center ml-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1 bg-white/20 appearance-none accent-brand cursor-pointer rounded-full hover:bg-white/40"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>
              </div>

              {/* Persistent Time Display */}
              <div className="flex items-center space-x-3 md:space-x-4 text-[10px] md:text-sm font-black italic tracking-[0.15em] md:tracking-[0.2em] select-none">
                <span className="text-white drop-shadow-md">{formatTime(currentTime)}</span>
                <span className="text-white/20">/</span>
                <span className="text-white/40 drop-shadow-md">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-6 md:space-x-12 relative">
              <div className="relative">
                <button 
                  onClick={toggleSettings}
                  className={`p-3 rounded-full hover:bg-white/10 transition-all ${showSettings ? 'text-brand scale-110' : 'text-white/60 hover:text-white'}`}
                >
                  <Settings className="w-8 h-8" />
                </button>
                
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-10 bg-[#0a0a0a]/95 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] py-6 w-64 animate-in fade-in slide-in-from-bottom-6 duration-300 backdrop-blur-3xl z-[120]">
                    {activeMenu === 'root' && (
                      <div className="space-y-1">
                        <p className="px-8 py-3 text-[9px] font-black text-white/20 uppercase tracking-[0.5em] mb-4 border-b border-white/5">Playback Config</p>
                        
                        <button 
                          onClick={() => setActiveMenu('quality')}
                          className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/5 transition-all group"
                        >
                          <div className="flex items-center space-x-4">
                            <Monitor className="w-4 h-4 text-gray-500 group-hover:text-brand transition-colors" />
                            <span className="text-sm font-black uppercase italic tracking-tighter text-white/60 group-hover:text-white">Resolution</span>
                          </div>
                          <span className="text-brand text-[10px] font-black bg-brand/10 px-2 py-0.5 rounded-md">{quality}</span>
                        </button>

                        <button 
                          onClick={() => setActiveMenu('speed')}
                          className="w-full flex items-center justify-between px-8 py-5 hover:bg-white/5 transition-all group"
                        >
                          <div className="flex items-center space-x-4">
                            <Gauge className="w-4 h-4 text-gray-500 group-hover:text-brand transition-colors" />
                            <span className="text-sm font-black uppercase italic tracking-tighter text-white/60 group-hover:text-white">Playback Speed</span>
                          </div>
                          <span className="text-brand text-[10px] font-black bg-brand/10 px-2 py-0.5 rounded-md">{playbackRate}x</span>
                        </button>
                      </div>
                    )}

                    {activeMenu === 'speed' && (
                      <div className="space-y-1">
                        <button onClick={() => setActiveMenu('root')} className="w-full px-8 py-3 text-[9px] font-black text-brand uppercase tracking-[0.5em] mb-4 flex items-center hover:bg-white/5">
                           <ArrowLeft className="w-3 h-3 mr-2" /> Speed Control
                        </button>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => changePlaybackRate(rate)}
                            className={`w-full text-left px-8 py-3.5 hover:bg-white/5 text-xs font-black uppercase italic tracking-tighter transition-all flex items-center justify-between ${playbackRate === rate ? 'text-brand' : 'text-white/40'}`}
                          >
                            <span>{rate === 1 ? 'Neutral (1x)' : `${rate}x`}</span>
                            {playbackRate === rate && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeMenu === 'quality' && (
                      <div className="space-y-1">
                        <button onClick={() => setActiveMenu('root')} className="w-full px-8 py-3 text-[9px] font-black text-brand uppercase tracking-[0.5em] mb-4 flex items-center hover:bg-white/5">
                           <ArrowLeft className="w-3 h-3 mr-2" /> Video Quality
                        </button>
                        {['4K Ultra', 'Full HD', '720p', 'Auto'].map((q) => (
                          <button
                            key={q}
                            onClick={() => changeQuality(q)}
                            className={`w-full text-left px-8 py-3.5 hover:bg-white/5 text-xs font-black uppercase italic tracking-tighter transition-all flex items-center justify-between ${quality === q ? 'text-brand' : 'text-white/40'}`}
                          >
                            <span>{q}</span>
                            {quality === q && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="p-3 text-white/40 hover:text-white transition-all">
                <Maximize className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #29A829;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 15px rgba(41, 168, 41, 0.8);
          transition: transform 0.2s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
      `}</style>
    </div>
  );
};

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default VideoPlayer;