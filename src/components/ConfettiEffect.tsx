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

    // Luxury palette: Metallic Gold, Bright Champagne, Platinum White, Emerald Accent
    const colors = [
      '#E5C07B', // Gold
      '#F3D99E', // Bright Champagne
      '#FFE8A3', // Sunlight Gold
      '#FFFFFF', // Brilliant Diamond White
      '#10B981', // Emerald Victory Accent
      '#34D399', // Mint Accent
      '#F59E0B', // Amber
    ];

    const particleCount = 140;
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Launch from top quadrants with parabolic spread
      const fromLeft = Math.random() < 0.5;
      particles.push({
        x: fromLeft ? width * 0.15 + Math.random() * (width * 0.2) : width * 0.65 + Math.random() * (width * 0.2),
        y: -20 - Math.random() * 80,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 8 + (fromLeft ? 3 : -3),
        vy: 2 + Math.random() * 5,
        angle: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    let animationFrameId: number;
    let startTime = performance.now();
    const totalDuration = 6000; // 6 seconds celebration

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      let activeParticles = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Apply physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // subtle gravity
        p.vx *= 0.99; // air resistance
        p.angle += p.angularVelocity;

        // Fade out gracefully near the end
        if (elapsed > totalDuration * 0.6) {
          p.opacity = Math.max(0, 1 - (elapsed - totalDuration * 0.6) / (totalDuration * 0.4));
        }

        if (p.y < height + 50 && p.opacity > 0) {
          activeParticles++;

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
      }

      if (activeParticles > 0 && elapsed < totalDuration) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
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
