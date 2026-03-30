import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowRight } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed');
      
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground font-sans overflow-hidden relative">
      {/* Cinematic Background Layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2]"></div>
        
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-screen" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        
        {/* Ambient Center Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
        
        {/* Bottom Cinematic Glow (Orange/White) */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(255,120,50,0.2)_0%,rgba(255,255,255,0.02)_30%,transparent_70%)] blur-[80px] mix-blend-screen"></div>
      </div>

      <div className="w-full max-w-md relative z-10 px-6">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="font-bold text-3xl tracking-tight text-orange-500 lowercase font-logo">
              vapbot<span className="text-orange-500">.</span>
            </span>
          </Link>
          <h1 className="text-2xl font-medium mt-6 text-foreground">Create an account</h1>
          <p className="text-muted-foreground mt-2 font-light">Join us to start building AI bots today</p>
        </div>

        <div className="relative p-[1px] rounded-2xl bg-gradient-to-b from-foreground/20 to-foreground/5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] group">
          <div className="absolute inset-0 rounded-2xl bg-background/80 backdrop-blur-2xl"></div>
          
          <div className="relative p-8 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] bg-accent/5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground ml-1">Email</label>
                <input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="name@example.com"
                  className="w-full bg-accent/5 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-light"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-muted-foreground ml-1">Password</label>
                <input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                  className="w-full bg-accent/5 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all font-light"
                />
              </div>

              <button 
                type="submit" 
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#e52e71] text-white font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,138,0,0.3)] hover:shadow-[0_0_30px_rgba(255,138,0,0.5)] hover:scale-[1.02] transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
                <span className="relative z-10">Sign Up</span>
                <ArrowRight className="w-4 h-4 relative z-10" />
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-8 text-muted-foreground text-sm font-light">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:text-orange-400 font-medium transition-colors">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
