import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ChevronLeft, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envPass = process.env.ADMIN_PASSWORD;
    
    if (envPass && password === envPass) {
      localStorage.setItem('admin_session', 'true');
      navigate('/admin');
    } else {
      setError('Access Denied. Incorrect Administrative Credentials.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative">
       <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1920&blur=10" 
          className="w-full h-full object-cover opacity-20" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
      </div>

      <Link to="/" className="absolute top-8 left-8 flex items-center space-x-2 text-gray-500 hover:text-white transition-all z-10 font-black uppercase text-[10px] tracking-widest italic">
        <ChevronLeft className="w-5 h-5" />
        <span>Return to Catalog</span>
      </Link>

      <div className="w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-10 md:p-14 z-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand to-transparent opacity-50" />
        
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand/20 shadow-2xl shadow-brand/10">
            <Lock className="w-8 h-8 text-brand" />
          </div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">STREAMX</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Administrative Gateway</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 block px-2">Encryption Key</label>
            <div className="relative group">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-5 focus:outline-none focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition-all text-lg tracking-widest text-center"
                placeholder="••••••••"
                required
              />
              <ShieldCheck className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-brand transition-colors" />
            </div>
          </div>

          {error && (
            <div className="text-brand text-[10px] text-center font-black uppercase tracking-widest bg-brand/5 py-4 rounded-2xl border border-brand/10 animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-brand hover:bg-brand-dark py-5 rounded-2xl font-black text-white italic tracking-tighter text-xl transition-all shadow-2xl shadow-brand/20 active:scale-95 flex items-center justify-center space-x-3"
          >
            <span>AUTHORIZE ACCESS</span>
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest leading-relaxed">
            Unauthorized access attempts are logged and monitored. <br/> Platform Protected by StreamX Security Core.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;