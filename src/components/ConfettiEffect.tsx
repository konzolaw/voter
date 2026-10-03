import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  opacity: number;
  createdAt: number;
}

export default function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Luxury palette: Metallic Gold, Bright Champagne, Sunlight Gold, Brilliant White, Emerald Accent
    const colors = [
      '#E5C07B', // Gold
      '#F3D99E', // Bright Champagne
      '#FFE8A3', // Sunlight Gold
      '#FFFFFF', // Diamond White
      '#10B981', // Emerald Victory
      '#34D399', // Mint Accent
      '#F59E0B', // Amber
    ];

    const particles: Particle[] = [];

    // Helper to fire a single celebratory cannon burst
    const spawnCannonBurst = () => {
      const burstSize = 120;
      const now = performance.now();
      for (let i = 0; i < burstSize; i++) {
        const fromLeft = Math.random() < 0.5;
        particles.push({
          x: fromLeft
            ? width * 0.08 + Math.random() * (width * 0.3)
            : width * 0.62 + Math.random() * (width * 0.3),
          y: -15 - Math.random() * 60,
          w: 6 + Math.random() * 7,
          h: 4 + Math.random() * 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 8 + (fromLeft ? 3.5 : -3.5),
          vy: 2.2 + Math.random() * 5.2,
          angle: Math.random() * Math.PI * 2,
          angularVelocity: (Math.random() - 0.5) * 0.22,
          opacity: 1,
          createdAt: now,
        });
      }
    };

    // Burst 1: Immediately at 0s
    spawnCannonBurst();

    // Burst 2: After 5 seconds
    const timer1 = setTimeout(() => {
      spawnCannonBurst();
    }, 5000);

    // Burst 3: After 10 seconds (5s after burst 2)
    const timer2 = setTimeout(() => {
      spawnCannonBurst();
    }, 10000);

    let animationFrameId: number;
    const particleLifetime = 4500; // each particle lives for 4.5s
    const totalDuration = 10000 + particleLifetime; // finishes ~14.5s

    const startTime = performance.now();

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      let activeCount = 0;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const age = now - p.createdAt;

        // Apply physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity
        p.vx *= 0.99; // drag
        p.angle += p.angularVelocity;

        // Graceful fade out in the last 1.5 seconds of particle life
        if (age > particleLifetime - 1500) {
          p.opacity = Math.max(0, (particleLifetime - age) / 1500);
        }

        if (p.opacity <= 0 || p.y > height + 80) {
          // Remove dead particle
          particles.splice(i, 1);
          continue;
        }

        activeCount++;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < totalDuration || activeCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
