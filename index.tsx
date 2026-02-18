import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ShieldAlert, Database, Key, Lock } from 'lucide-react';

const container = document.getElementById('root');

const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      if (loader.parentNode) loader.remove();
    }, 500);
  }
};

const MissingConfigScreen = ({ missing }: { missing: string[] }) => (
  <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center space-y-10">
    <div className="relative">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
        <ShieldAlert className="w-10 h-10 text-red-500" />
      </div>
      <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full" />
    </div>
    <div className="space-y-4 max-w-lg">
      <h1 className="text-3xl font-black italic uppercase tracking-tighter">Environment Missing</h1>
      <p className="text-gray-500 text-sm font-medium leading-relaxed">The following cloud environment variables must be configured in your Vercel/Platform dashboard to proceed:</p>
    </div>
    <div className="flex flex-col gap-3 w-full max-w-xs">
      {missing.includes('DATABASE_URL') && (
        <div className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Database className="w-4 h-4 text-red-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400">DATABASE_URL</span>
        </div>
      )}
      {missing.includes('API_KEY') && (
        <div className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Key className="w-4 h-4 text-red-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400">API_KEY (Gemini)</span>
        </div>
      )}
      {missing.includes('ADMIN_PASSWORD') && (
        <div className="flex items-center space-x-3 p-4 bg-white/5 border border-white/10 rounded-2xl">
          <Lock className="w-4 h-4 text-red-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-red-400">ADMIN_PASSWORD</span>
        </div>
      )}
    </div>
    <button 
      onClick={() => window.location.reload()}
      className="text-white bg-white/10 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
    >
      Retry Connection
    </button>
  </div>
);

if (container) {
  const missingVars = [];
  if (!process.env.DATABASE_URL) missingVars.push('DATABASE_URL');
  if (!process.env.API_KEY) missingVars.push('API_KEY');
  if (!process.env.ADMIN_PASSWORD) missingVars.push('ADMIN_PASSWORD');

  const root = createRoot(container);
  
  if (missingVars.length > 0) {
    root.render(<MissingConfigScreen missing={missingVars} />);
    hideLoader();
  } else {
    try {
      (window as any).React = React;
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      window.addEventListener('load', () => setTimeout(hideLoader, 500));
      setTimeout(hideLoader, 3000);
    } catch (error) {
      console.error("Mount Failure:", error);
    }
  }
}