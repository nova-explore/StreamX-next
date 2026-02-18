import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ChevronLeft } from 'lucide-react';

const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      localStorage.setItem('admin_session', 'true');
      navigate('/admin');
    } else {
      setError('Invalid admin credentials. For demo use "admin123"');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative">
       <div className="absolute inset-0 z-0">
        <img 
          src="https://picsum.photos/seed/bg/1920/1080?blur=5" 
          className="w-full h-full object-cover opacity-30" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/20" />
      </div>

      <Link to="/" className="absolute top-8 left-8 flex items-center space-x-2 text-gray-400 hover:text-white transition-all z-10">
        <ChevronLeft className="w-5 h-5" />
        <span>Back to Home</span>
      </Link>

      <div className="w-full max-w-md bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 z-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-brand italic tracking-tighter mb-2">STREAMX</h1>
          <p className="text-gray-400">Admin Authentication</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Admin Passcode</label>
            <div className="relative">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 focus:outline-none focus:border-brand transition-all text-lg tracking-widest"
                placeholder="••••••••"
                required
              />
              <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
            </div>
          </div>

          {error && <p className="text-brand text-sm text-center font-medium bg-brand/10 py-2 rounded-lg">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-brand hover:bg-brand-dark py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-brand/30"
          >
            Unlock Dashboard
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-sm text-gray-500">Only authorized administrators can access this portal.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;