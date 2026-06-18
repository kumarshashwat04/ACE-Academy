"use client";

import { useEffect, useRef } from "react";

/**
 * BackgroundFX — global ambient visual effects ported from the legacy index.html.
 *  • particleCanvas: drifting, twinkling, mouse-attracted particles in the content area
 *  • cursorGlow: a soft glow that trails the cursor
 *
 * Purely presentational; mounted once in the root layout so it applies to every page.
 */
export default function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);

  // ──── PARTICLE CANVAS ────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let rafId = 0;

    // Offset particles to the right of the sidebar (if one is present on this page).
    const sidebarWidth = () => {
      const sb = document.querySelector(".sidebar") as HTMLElement | null;
      return sb ? sb.getBoundingClientRect().width : 0;
    };
    let SIDEBAR = sidebarWidth();

    const COLORS = [
      [109, 82, 232], [109, 82, 232], [109, 82, 232],
      [167, 139, 250], [167, 139, 250],
      [14, 165, 201],
      [16, 185, 129],
      [255, 107, 0],
      [103, 232, 249],
    ];

    function resize() {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      SIDEBAR = sidebarWidth();
    }
    resize();
    window.addEventListener("resize", resize);

    const randX = () => SIDEBAR + Math.random() * (W - SIDEBAR);
    const randY = () => Math.random() * H;

    class Particle {
      r = 0; g = 0; b = 0;
      x = 0; y = 0; vx = 0; vy = 0;
      size = 0; baseAlpha = 0; alpha = 0;
      tw = 0; twOffset = 0; life = 0; age = 0;
      constructor() { this.init(true); }
      init(scatter: boolean) {
        const c = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.r = c[0]; this.g = c[1]; this.b = c[2];
        this.x = scatter ? randX() : SIDEBAR + Math.random() * (W - SIDEBAR);
        this.y = scatter ? randY() : randY();
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2.2 + 0.6;
        this.baseAlpha = Math.random() * 0.3 + 0.08;
        this.tw = Math.random() * 0.025 + 0.006;
        this.twOffset = Math.random() * Math.PI * 2;
        this.life = Math.random() * 500 + 300;
        this.age = 0;
      }
      update(t: number) {
        this.x += this.vx; this.y += this.vy; this.age++;
        this.alpha = this.baseAlpha * (0.55 + 0.45 * Math.sin(t * this.tw + this.twOffset));
        // soft-wall: nudge back into content area instead of hard reset
        if (this.x < SIDEBAR + 10) this.vx += 0.04;
        if (this.x > W - 10) this.vx -= 0.04;
        if (this.y < 10) this.vy += 0.04;
        if (this.y > H - 10) this.vy -= 0.04;
        this.vx *= 0.99; this.vy *= 0.99;
        if (this.age > this.life) this.init(false);
      }
      draw() {
        if (!ctx) return;
        // outer glow halo
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 5);
        g.addColorStop(0, `rgba(${this.r},${this.g},${this.b},${this.alpha * 0.4})`);
        g.addColorStop(0.4, `rgba(${this.r},${this.g},${this.b},${this.alpha * 0.1})`);
        g.addColorStop(1, `rgba(${this.r},${this.g},${this.b},0)`);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 5, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        // bright core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${Math.min(this.alpha * 1.4, 0.8)})`;
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < 90; i++) particles.push(new Particle());

    const mouse = { x: -9999, y: -9999 };
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMove);

    let t = 0;
    function loop() {
      if (!ctx) return;
      t++;
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        // mouse attraction (gentle pull toward cursor when nearby)
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 0) {
          const f = (1 - dist / 180) * 0.012;
          p.vx += (dx / dist) * f; p.vy += (dy / dist) * f;
        }
        p.update(t);
        p.draw();
      });
      rafId = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  // ──── CURSOR GLOW ────
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;
    let rafId = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener("mousemove", onMove);
    function loop() {
      cx += (mx - cx) * 0.08; cy += (my - cy) * 0.08;
      glow!.style.left = cx + "px";
      glow!.style.top = cy + "px";
      rafId = requestAnimationFrame(loop);
    }
    loop();
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <canvas id="particleCanvas" ref={canvasRef}></canvas>
      <div className="cursor-glow" id="cursorGlow" ref={glowRef}></div>
    </>
  );
}
