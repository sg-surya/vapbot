import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mic, Bot, Cpu, Zap, MessageSquare, Sparkles, Brain, Code, Database, Globe, Shield, Zap as ZapIcon, Layers, Command, Sun, Moon } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const NeuralNetwork = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = 80;
    const connectionDistance = 150;
    const mouseRadius = 200;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;

      constructor(isDark: boolean) {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.color = isDark ? 'rgba(249, 115, 22, 0.4)' : 'rgba(249, 115, 22, 0.6)';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;

        // Mouse interaction
        const dx = mouse.current.x - this.x;
        const dy = mouse.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius;
          this.x -= dx * force * 0.02;
          this.y -= dy * force * 0.02;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const init = () => {
      const isDark = document.documentElement.classList.contains('dark');
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(isDark));
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(249, 115, 22, ${0.15 * (1 - distance / connectionDistance)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-0 pointer-events-none opacity-40"
    />
  );
};

const BentoCard = ({ title, description, icon: Icon, className, delay }: { title: string, description: string, icon: any, className?: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={`relative group p-8 rounded-3xl bg-card border border-border backdrop-blur-sm overflow-hidden hover:bg-accent/5 transition-all duration-500 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
        <Icon className="w-6 h-6 text-orange-500" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-orange-500 transition-colors">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full group-hover:bg-orange-500/10 transition-colors duration-500"></div>
  </motion.div>
);

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const scrollProgress = useMotionValue(0);

  const springX = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const springY = useSpring(mouseY, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.set(window.scrollY / totalScroll);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX / innerWidth - 0.5) * 50);
      mouseY.set((clientY / innerHeight - 0.5) * 50);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/30 font-sans overflow-x-hidden p-[3px]">
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 to-orange-600 z-[100] origin-left"
        style={{ scaleX: scrollProgress }}
      />

      {/* Navbar */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'pt-4 px-4' : 'pt-0 px-0'}`}>
        <nav className={`mx-auto transition-all duration-500 flex items-center justify-between ${
          isScrolled 
            ? 'max-w-5xl bg-background/70 backdrop-blur-xl border border-border/50 h-16 px-8 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]' 
            : 'max-w-7xl bg-transparent h-24 px-10'
        }`}>
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-2xl tracking-tighter text-foreground lowercase font-logo">
                vapbot<span className="text-orange-500">.</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-10 text-sm font-medium text-muted-foreground/80">
              <a href="#" className="hover:text-orange-500 transition-colors">Features</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Pricing</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Showcase</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Docs</a>
            </div>

            <div className="flex items-center gap-6">
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-accent/5 hover:bg-accent/10 text-muted-foreground hover:text-foreground transition-all border border-border/50"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {user ? (
                <Link to="/dashboard" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-105 transition-transform">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Sign in
                  </Link>
                  <Link to="/signup">
                    <button className={`px-6 py-2.5 text-sm font-semibold transition-all duration-300 ${
                      isScrolled 
                        ? 'bg-foreground text-background rounded-full hover:opacity-90 shadow-lg' 
                        : 'bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20'
                    }`}>
                      Get Started
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>

      {/* Hero Container - Rounded only for Hero */}
      <div className="h-[97vh] w-full bg-background rounded-b-[64px] border-b border-border relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <main className="relative h-full z-10">
          {/* Hero Section */}
          <section className="relative h-full flex flex-col items-center justify-center pt-24 pb-12 px-6 text-center overflow-hidden">
          
          {/* Neural Network Background */}
          <NeuralNetwork />

          {/* Cinematic Background Layers */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Base Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.3] dark:opacity-[0.1]"></div>
            
            {/* Ambient Center Glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-500/10 dark:bg-orange-600/5 blur-[120px] rounded-full"></div>
            
            {/* Dynamic Spotlight */}
            <motion.div 
              className="absolute w-[600px] h-[600px] bg-orange-500/15 dark:bg-orange-500/10 blur-[120px] rounded-full pointer-events-none"
              style={{
                x: springX,
                y: springY,
                left: 'calc(50% - 300px)',
                top: 'calc(40% - 300px)',
              }}
            />
          </div>
          
          <div className="max-w-5xl mx-auto relative z-10">
            {/* Premium Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-border/50 text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-10 backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Vasudev AI Builder 2.0</span>
            </motion.div>
            
            {/* Cinematic Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-[88px] font-bold tracking-tight mb-8 leading-[0.95] text-foreground"
            >
              Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-orange-400 bg-[length:200%_auto] animate-gradient relative inline-block font-stomic">
                AI Bots
              </span><br/>
              That Talk Like Humans
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-14 leading-relaxed font-light"
            >
              Design, test, and deploy intelligent conversational workflows visually — without writing a single line of code.
            </motion.p>

            {/* Hyper-Realistic Glass Input Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative max-w-2xl mx-auto p-[1px] rounded-2xl bg-gradient-to-b from-foreground/10 to-foreground/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] group"
            >
              {/* Glass Backdrop */}
              <div className="absolute inset-0 rounded-2xl bg-background/60 backdrop-blur-3xl"></div>
              
              {/* Inner Content */}
              <div className="relative flex items-center gap-3 p-3 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] bg-accent/5">
                
                {/* Input */}
                <input 
                  type="text" 
                  placeholder="Create a Whatsapp bot for cold messaging..." 
                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/60 px-5 py-3 text-lg font-light"
                />
                
                {/* Right Actions */}
                <div className="flex items-center gap-3 pr-1">
                  <button className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent/10 hover:bg-accent/20 border border-border/50 text-muted-foreground transition-all">
                    <Mic className="w-5 h-5" />
                  </button>
                  <Link to={user ? "/dashboard" : "/signup"}>
                    <button className="w-12 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-all duration-300">
                      <ArrowRight className="w-6 h-6 text-white" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
          </section>
        </main>
      </div>

      {/* Bento Grid Features Section - Outside the rounded container */}
      <section className="max-w-7xl mx-auto px-6 py-32 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-semibold mb-6 text-foreground">Built for the next generation</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to build, scale and manage your AI workforce.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BentoCard 
              delay={0.1}
              title="Visual Workflow"
              description="Drag and drop nodes to create complex conversational paths. No coding required."
              icon={Layers}
              className="md:col-span-2 md:row-span-1"
            />
            <BentoCard 
              delay={0.2}
              title="Global Scale"
              description="Deploy to WhatsApp, Telegram, and Web in seconds."
              icon={Globe}
            />
            <BentoCard 
              delay={0.3}
              title="Lightning Fast"
              description="Sub-100ms response times for a natural feel."
              icon={ZapIcon}
            />
            <BentoCard 
              delay={0.4}
              title="Enterprise Security"
              description="Bank-grade encryption for all your data and conversations."
              icon={Shield}
              className="md:col-span-2"
            />
            <BentoCard 
              delay={0.5}
              title="Smart Integration"
              description="Connect with 1000+ apps via Zapier and webhooks."
              icon={Command}
            />
          </div>
      </section>
    </div>
  );
}
