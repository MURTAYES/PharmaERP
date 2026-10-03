import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  width: number;
  height: number;
  type: 'capsule' | 'tablet' | 'cross' | 'bubble';
  color1: string;
  color2: string;
  alpha: number;
  scale: number;
  targetScale: number;
}

function InteractiveCapsuleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const mouse = {
      x: width / 2,
      y: height / 2,
      prevX: width / 2,
      prevY: height / 2,
      vx: 0,
      vy: 0,
      isHovered: false,
      radius: 160,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.isHovered = true;
      mouse.vx = e.clientX - mouse.x;
      mouse.vy = e.clientY - mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
    };

    // Color palettes matching Dashboard design
    const colorPairs = [
      { c1: '#002F34', c2: '#97D8D0' }, // Spruce & Mint
      { c1: '#002F34', c2: '#D7F1B5' }, // Spruce & Lime
      { c1: '#F1B5B9', c2: '#FFFFFF' }, // Pastel Coral & White
      { c1: '#97D8D0', c2: '#FFFFFF' }, // Mint & White
      { c1: '#00A887', c2: '#D7F1B5' }, // Teal & Lime
      { c1: '#B5BFF1', c2: '#002F34' }, // Lavender & Spruce
      { c1: '#FAD6A5', c2: '#97D8D0' }, // Peach & Mint
    ];

    const particles: Particle[] = [];
    const count = Math.min(24, Math.max(14, Math.floor((width * height) / 45000)));

    for (let i = 0; i < count; i++) {
      const pair = colorPairs[i % colorPairs.length];
      const types: Particle['type'][] = ['capsule', 'capsule', 'capsule', 'tablet', 'cross', 'bubble'];
      const type = types[Math.floor(Math.random() * types.length)];
      const size = type === 'capsule' ? 44 + Math.random() * 26 : 28 + Math.random() * 18;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
        width: size,
        height: type === 'capsule' ? size * 0.42 : size,
        type,
        color1: pair.c1,
        color2: pair.c2,
        alpha: 0.75 + Math.random() * 0.25,
        scale: 1,
        targetScale: 1,
      });
    }

    // Interactive Shockwave on click
    const shockwaves: { x: number; y: number; r: number; maxR: number; alpha: number }[] = [];

    const handleClick = (e: MouseEvent) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        r: 10,
        maxR: 280,
        alpha: 0.6,
      });

      // Impulse to particles
      particles.forEach((p) => {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300 && dist > 1) {
          const force = (300 - dist) / 300;
          p.vx += (dx / dist) * force * 10;
          p.vy += (dy / dist) * force * 10;
          p.vRot += (Math.random() - 0.5) * 0.15;
          p.scale = 1.35;
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle ambient glow gradients
      const grad1 = ctx.createRadialGradient(width * 0.2, height * 0.2, 50, width * 0.2, height * 0.2, 450);
      grad1.addColorStop(0, 'rgba(151, 216, 208, 0.25)');
      grad1.addColorStop(1, 'rgba(243, 247, 246, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const grad2 = ctx.createRadialGradient(width * 0.8, height * 0.75, 50, width * 0.8, height * 0.75, 480);
      grad2.addColorStop(0, 'rgba(215, 241, 181, 0.25)');
      grad2.addColorStop(1, 'rgba(243, 247, 246, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      const grad3 = ctx.createRadialGradient(width * 0.5, height * 0.9, 30, width * 0.5, height * 0.9, 380);
      grad3.addColorStop(0, 'rgba(241, 181, 185, 0.18)');
      grad3.addColorStop(1, 'rgba(243, 247, 246, 0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      // Render & update shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.r += 9;
        sw.alpha *= 0.94;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 168, 135, ${sw.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        if (sw.r > sw.maxR || sw.alpha < 0.01) {
          shockwaves.splice(i, 1);
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        // Natural float
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;

        // Friction dampening
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.vRot *= 0.985;

        // Maintain minimum gentle floating velocity
        if (Math.abs(p.vx) < 0.25) p.vx += (Math.random() - 0.5) * 0.08;
        if (Math.abs(p.vy) < 0.25) p.vy += (Math.random() - 0.5) * 0.08;
        if (Math.abs(p.vRot) < 0.005) p.vRot += (Math.random() - 0.5) * 0.002;

        // Bounce on edges
        const pad = 60;
        if (p.x < -pad) p.x = width + pad;
        if (p.x > width + pad) p.x = -pad;
        if (p.y < -pad) p.y = height + pad;
        if (p.y > height + pad) p.y = -pad;

        // Mouse interaction (Repel / Parallax)
        if (mouse.isHovered) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force * 1.5;
            p.vy += Math.sin(angle) * force * 1.5;
            p.vRot += (Math.random() - 0.5) * 0.04;
            p.targetScale = 1.15;
          } else {
            p.targetScale = 1;
          }
        } else {
          p.targetScale = 1;
        }

        // Smooth scale transition
        p.scale += (p.targetScale - p.scale) * 0.1;

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = p.alpha;

        if (p.type === 'capsule') {
          // 3D Two-Tone Pill Capsule
          const w = p.width;
          const h = p.height;
          const r = h / 2;

          // Soft drop shadow
          ctx.shadowColor = 'rgba(0, 47, 52, 0.12)';
          ctx.shadowBlur = 12;
          ctx.shadowOffsetY = 6;

          // Left Half (Color 1)
          ctx.beginPath();
          ctx.arc(-w / 2 + r, 0, r, Math.PI / 2, (Math.PI * 3) / 2);
          ctx.lineTo(0, -r);
          ctx.lineTo(0, r);
          ctx.closePath();
          ctx.fillStyle = p.color1;
          ctx.fill();

          // Right Half (Color 2)
          ctx.beginPath();
          ctx.arc(w / 2 - r, 0, r, (Math.PI * 3) / 2, Math.PI / 2);
          ctx.lineTo(0, r);
          ctx.lineTo(0, -r);
          ctx.closePath();
          ctx.fillStyle = p.color2;
          ctx.fill();

          // Reset shadow for details
          ctx.shadowColor = 'transparent';

          // Capsule Center Seam
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(0, r);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 3D Glass Specular Reflection Highlight
          ctx.beginPath();
          ctx.ellipse(-w / 8, -r * 0.35, w * 0.32, r * 0.22, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.fill();
        } else if (p.type === 'tablet') {
          // Round Split Tablet
          const r = p.width / 2;

          ctx.shadowColor = 'rgba(0, 47, 52, 0.1)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = p.color1 === '#002F34' ? '#D7F1B5' : p.color1;
          ctx.fill();

          ctx.shadowColor = 'transparent';

          // Tablet score/division groove
          ctx.beginPath();
          ctx.moveTo(-r * 0.7, 0);
          ctx.lineTo(r * 0.7, 0);
          ctx.strokeStyle = 'rgba(0, 47, 52, 0.18)';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Highlight
          ctx.beginPath();
          ctx.arc(-r * 0.3, -r * 0.3, r * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fill();
        } else if (p.type === 'cross') {
          // Medical Cross icon
          const s = p.width * 0.4;
          const t = s * 0.36;

          ctx.fillStyle = p.color2 === '#FFFFFF' ? '#97D8D0' : p.color2;
          ctx.beginPath();
          ctx.roundRect(-t / 2, -s, t, s * 2, 3);
          ctx.roundRect(-s, -t / 2, s * 2, t, 3);
          ctx.fill();
        } else if (p.type === 'bubble') {
          // Soft Glowing Bubble
          const r = p.width * 0.3;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(151, 216, 208, 0.28)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 168, 135, 0.25)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" />;
}

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F7F6] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Interactive Floating Capsule & Tablet Physics Canvas */}
      <InteractiveCapsuleCanvas />


      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-[420px] bg-white/90 backdrop-blur-2xl rounded-[32px] p-8 sm:p-9 shadow-2xl border border-white/80 flex flex-col z-20 relative transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,47,52,0.18)]">
        {/* Header Hero Branding with Clean Logo */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="flex items-center justify-center p-2 rounded-2xl bg-[#F3F7F6]/60 transition-transform hover:scale-105 duration-200">
            <img src="/logo.png" alt="PharmaERP Logo" className="h-12 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#002F34] tracking-tight">PharmaERP</h1>
            <p className="text-xs font-semibold text-[#5F7D7A] mt-1">
              Pharmacy Point of Sale & Clinical ERP
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#5F7D7A] px-1">
              Username or ID
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#5F7D7A] text-[19px] pointer-events-none">
                person
              </span>
              <input
                type="text"
                placeholder="e.g. admin or pharmacist"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
                className="w-full h-11 pl-10 pr-4 bg-[#F3F7F6] focus:bg-white rounded-2xl text-xs font-bold text-[#002F34] placeholder:text-slate-400 placeholder:font-normal border-2 border-transparent focus:border-[#002F34] transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <label className="text-[11px] font-black uppercase tracking-wider text-[#5F7D7A] px-1">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#5F7D7A] text-[19px] pointer-events-none">
                lock
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 pl-10 pr-4 bg-[#F3F7F6] focus:bg-white rounded-2xl text-xs font-bold text-[#002F34] placeholder:text-slate-400 placeholder:font-normal border-2 border-transparent focus:border-[#002F34] transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2.5 w-full h-12 bg-[#002F34] hover:bg-[#012428] text-white rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-[#002F34]/20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Quick Switcher Pills */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-center">
          <span className="font-black uppercase tracking-widest text-[9px] text-[#5F7D7A]">
            Quick Demo Access:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('admin');
                setPassword('admin123');
              }}
              className="px-3 py-2 bg-[#D7F1B5]/40 hover:bg-[#D7F1B5] border border-[#D7F1B5] rounded-xl transition-all text-[#002F34] font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#002F34]" />
              <span>Owner</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('pharmacist');
                setPassword('pharma123');
              }}
              className="px-3 py-2 bg-[#97D8D0]/35 hover:bg-[#97D8D0] border border-[#97D8D0] rounded-xl transition-all text-[#002F34] font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-[#00A887]" />
              <span>Pharmacist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Navigation Links */}
      <div className="mt-6 z-20 flex items-center gap-4 text-xs font-bold text-[#5F7D7A]">
        <Link to="/privacy" className="hover:text-[#002F34] transition-colors hover:underline">
          Privacy Policy
        </Link>
        <span className="text-slate-300">•</span>
        <Link to="/contact" className="hover:text-[#002F34] transition-colors hover:underline">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
