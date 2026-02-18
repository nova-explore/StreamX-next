import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ShieldAlert, Database, Key, Lock, RefreshCcw } from 'lucide-react';

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
      <h1 className="text-3xl font-black italic uppercase tracking-tighter">System Unlock Failed</h1>
      <p className="text-gray-500 text-sm font-medium leading-relaxed">
        The application is missing secure environment variables. 
        Please configure the following in your platform dashboard:
      </p>
    </div>
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {missing.includes('DB') && (
        <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-2xl text-left space-y-2">
          <div className="flex items-center space-x-3">
            <Database className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Turso Database</span>
          </div>
          <p className="text-[9px] text-gray-500 italic font-mono">TURSO_DATABASE_URL & TURSO_AUTH_TOKEN</p>
        </div>
      )}
      {missing.includes('API') && (
        <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-2xl text-left space-y-2">
          <div className="flex items-center space-x-3">
            <Key className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">GenAI Engine</span>
          </div>
          <p className="text-[9px] text-gray-500 italic font-mono">API_KEY</p>
        </div>
      )}
      {missing.includes('PWD') && (
        <div className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-2xl text-left space-y-2">
          <div className="flex items-center space-x-3">
            <Lock className="w-4 h-4 text-red-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Security Gate</span>
          </div>
          <p className="text-[9px] text-gray-500 italic font-mono">ADMIN_PASSWORD or ADMIN_PASS</p>
        </div>
      )}
    </div>
    <div className="flex flex-col items-center space-y-4">
      <button 
        onClick={() => window.location.reload()}
        className="flex items-center space-x-3 text-white bg-brand px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark transition-all shadow-2xl shadow-brand/20 active:scale-95"
      >
        <RefreshCcw className="w-4 h-4" />
        <span>Re-Verify Security</span>
      </button>
      <p className="text-[9px] text-gray-700 uppercase font-bold tracking-tighter">Note: New secrets require a fresh redeployment to take effect.</p>
    </div>
  </div>
);

if (container) {
  const missingVars = [];
  const env = process.env || {};
  
  const hasDb = env.TURSO_DATABASE_URL && env.TURSO_AUTH_TOKEN;
  const hasApi = env.API_KEY;
  const hasPwd = env.ADMIN_PASSWORD || env.ADMIN_PASS;

  if (!hasDb) missingVars.push('DB');
  if (!hasApi) missingVars.push('API');
  if (!hasPwd) missingVars.push('PWD');

  const root = createRoot(container);
  
  if (missingVars.length > 0) {
    root.render(<MissingConfigScreen missing={missingVars} />);
    hideLoader();
  } else {
    try {
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
      window.addEventListener('load', () => setTimeout(hideLoader, 500));
      // Fallback for fast networks
      setTimeout(hideLoader, 3000);
    } catch (error) {
      console.error("Secure Mount Failure:", error);
    }
  }
}