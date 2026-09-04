import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type ScientistSceneKey = 'photometer' | 'purification' | 'greeting';

export interface ScientistImageModalData {
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
  url: string;
  modeKey: ScientistSceneKey;
}

interface ScientistImageModalProps {
  data: ScientistImageModalData | null;
  onClose: () => void;
  onSetBanner: (modeKey: ScientistSceneKey) => void;
}

interface BubbleParticle {
  id: number;
  x: number;
  y: number;
  startX: number;
  radius: number;
  vy: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  phase: number;
  opacity: number;
  colorType: 'cyan' | 'pink' | 'emerald' | 'blue';
  maxLifetimeY: number;
}

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export const ScientistImageModal: React.FC<ScientistImageModalProps> = ({
  data,
  onClose,
  onSetBanner,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<BubbleParticle[]>([]);
  const splashRef = useRef<SplashParticle[]>([]);
  const nextIdRef = useRef<number>(1);
  const animIdRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);

  const [poppedCount, setPoppedCount] = useState<number>(0);

  // Sound generator
  const playBloop = useCallback((pitch = 540) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.8, now + 0.08);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio fallback
    }
  }, []);

  const spawnSplash = useCallback(
    (x: number, y: number, color = '#00e5ff') => {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5);
        const spd = 1.5 + Math.random() * 2.5;
        splashRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 0.8,
          radius: 1.5 + Math.random() * 2.5,
          alpha: 1,
          color,
        });
      }
      playBloop(500 + Math.random() * 250);
      setPoppedCount((c) => c + 1);
    },
    [playBloop]
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Bubble animation loop
  useEffect(() => {
    if (!data) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Spawn bubbles continuously in loop
      if (time - lastSpawnRef.current > 65) {
        lastSpawnRef.current = time;

        if (data.modeKey === 'photometer') {
          // Left beaker / flask
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.11 + Math.random() * 0.05),
            y: height * (0.68 + Math.random() * 0.03),
            startX: width * 0.135,
            radius: 2.5 + Math.random() * 5.0,
            vy: -(1.0 + Math.random() * 1.3),
            wobbleSpeed: 0.06,
            wobbleAmp: 4,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.95,
            colorType: 'cyan',
            maxLifetimeY: height * 0.52,
          });

          // Right vertical reactor
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.88 + Math.random() * 0.06),
            y: height * (0.72 + Math.random() * 0.03),
            startX: width * 0.91,
            radius: 3.2 + Math.random() * 7,
            vy: -(1.5 + Math.random() * 2.2),
            wobbleSpeed: 0.05,
            wobbleAmp: 5,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.95,
            colorType: 'cyan',
            maxLifetimeY: height * 0.22,
          });

          // DPD vial in hands
          if (Math.random() > 0.25) {
            bubblesRef.current.push({
              id: nextIdRef.current++,
              x: width * (0.28 + Math.random() * 0.03),
              y: height * (0.43 + Math.random() * 0.03),
              startX: width * 0.29,
              radius: 1.8 + Math.random() * 3.2,
              vy: -(0.9 + Math.random() * 1.1),
              wobbleSpeed: 0.07,
              wobbleAmp: 2.5,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.95,
              colorType: 'pink',
              maxLifetimeY: height * 0.31,
            });
          }
        } else if (data.modeKey === 'purification') {
          // Central purification column
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.58 + Math.random() * 0.09),
            y: height * (0.64 + Math.random() * 0.03),
            startX: width * 0.62,
            radius: 2.8 + Math.random() * 6.5,
            vy: -(1.5 + Math.random() * 2.0),
            wobbleSpeed: 0.06,
            wobbleAmp: 4,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.95,
            colorType: 'cyan',
            maxLifetimeY: height * 0.33,
          });

          // Hand flask receiving water from tap
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.51 + Math.random() * 0.035),
            y: height * (0.63 + Math.random() * 0.02),
            startX: width * 0.525,
            radius: 2.2 + Math.random() * 4.5,
            vy: -(1.0 + Math.random() * 1.4),
            wobbleSpeed: 0.08,
            wobbleAmp: 3,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.95,
            colorType: 'blue',
            maxLifetimeY: height * 0.51,
          });
        } else {
          // Greeting Scene
          // Right hand spherical glass flask
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.27 + Math.random() * 0.05),
            y: height * (0.50 + Math.random() * 0.03),
            startX: width * 0.295,
            radius: 3.0 + Math.random() * 6.5,
            vy: -(1.3 + Math.random() * 1.8),
            wobbleSpeed: 0.05,
            wobbleAmp: 5,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.95,
            colorType: 'cyan',
            maxLifetimeY: height * 0.35,
          });

          // Left aquarium bioreactor
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.13 + Math.random() * 0.07),
            y: height * (0.69 + Math.random() * 0.04),
            startX: width * 0.165,
            radius: 2.5 + Math.random() * 6,
            vy: -(1.4 + Math.random() * 1.9),
            wobbleSpeed: 0.05,
            wobbleAmp: 4,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.9,
            colorType: 'emerald',
            maxLifetimeY: height * 0.38,
          });

          // Right glass cylinder
          if (Math.random() > 0.3) {
            bubblesRef.current.push({
              id: nextIdRef.current++,
              x: width * (0.91 + Math.random() * 0.05),
              y: height * (0.58 + Math.random() * 0.04),
              startX: width * 0.935,
              radius: 2.5 + Math.random() * 6,
              vy: -(1.5 + Math.random() * 2.0),
              wobbleSpeed: 0.05,
              wobbleAmp: 4,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.88,
              colorType: 'cyan',
              maxLifetimeY: height * 0.22,
            });
          }
        }
      }

      // Update and draw bubbles
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        b.y += b.vy;
        b.phase += b.wobbleSpeed;
        b.x += Math.sin(b.phase) * (b.wobbleAmp * 0.06);

        if (b.y <= b.maxLifetimeY || b.opacity <= 0) {
          bubblesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = b.opacity;

        const radGrad = ctx.createRadialGradient(
          b.x - b.radius * 0.35,
          b.y - b.radius * 0.35,
          b.radius * 0.1,
          b.x,
          b.y,
          b.radius
        );

        if (b.colorType === 'pink') {
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.35, 'rgba(255, 105, 180, 0.7)');
          radGrad.addColorStop(1, 'rgba(199, 21, 133, 0.7)');
        } else if (b.colorType === 'emerald') {
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.4, 'rgba(16, 231, 178, 0.7)');
          radGrad.addColorStop(1, 'rgba(0, 103, 125, 0.8)');
        } else {
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.3, 'rgba(180, 248, 255, 0.8)');
          radGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.55)');
          radGrad.addColorStop(1, 'rgba(0, 119, 182, 0.75)');
        }

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(0.8, b.radius * 0.12);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.ellipse(
          b.x - b.radius * 0.38,
          b.y - b.radius * 0.38,
          b.radius * 0.28,
          b.radius * 0.15,
          -Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
      }

      // Splash particles
      for (let j = splashRef.current.length - 1; j >= 0; j--) {
        const p = splashRef.current[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.alpha -= 0.04;

        if (p.alpha <= 0) {
          splashRef.current.splice(j, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animIdRef.current = requestAnimationFrame(render);
    };

    animIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      const dist = Math.hypot(clickX - b.x, clickY - b.y);
      if (dist < b.radius + 18) {
        spawnSplash(b.x, b.y, b.colorType === 'pink' ? '#ff2a85' : '#00e5ff');
        bubblesRef.current.splice(i, 1);
        return;
      }
    }

    spawnSplash(clickX, clickY, '#00e5ff');
  };

  if (!data) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-cyan-300/40 max-w-xl w-full flex flex-col my-auto animate-in zoom-in-95 text-[#151d22]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. MODAL TOP BAR: TITLE & CLOSE BUTTON */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#001f27] to-[#003643] text-white border-b border-cyan-500/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10e7b2] animate-ping" />
            <div>
              <span className="text-[10px] font-hud uppercase tracking-widest text-cyan-300 font-bold block">
                {data.badge} • LOOP & BURBUJAS ACTIVAS
              </span>
              <h2 className="text-[15px] font-hud font-black text-white leading-tight">
                {data.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
            title="Cerrar ventana"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 2. THE COMPLETE CARTOON STAGE: 100% UNCLIPPED & FULLY VISIBLE IN LOOP */}
        <div
          onClick={handleCanvasClick}
          className="relative w-full bg-[#00141a] flex items-center justify-center overflow-hidden cursor-pointer select-none p-2"
          title="Toca para reventar burbujas interactivas"
        >
          {/* Ambient laboratory backdrop glow */}
          <div
            className="absolute inset-0 w-full h-full filter blur-xl opacity-40 scale-105 pointer-events-none"
            style={{
              backgroundImage: `url(${data.url})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />

          {/* Unclipped Image Container: fits 100% inside maximum viewport height without cropping! */}
          <div className="relative z-10 w-full max-h-[50vh] sm:max-h-[56vh] aspect-square flex items-center justify-center animate-scientist-breath">
            {/* The 1024x1024 Complete Illustration */}
            <img
              src={data.url}
              alt={data.title}
              className="w-full h-full max-h-[50vh] sm:max-h-[56vh] object-contain object-center drop-shadow-[0_12px_32px_rgba(0,0,0,0.8)]"
              referrerPolicy="no-referrer"
            />

            {/* Loop Overlays: Hair Motion in Photometer Scene */}
            {data.modeKey === 'photometer' && (
              <>
                <div className="absolute inset-0 w-full h-full pointer-events-none animate-hair-left">
                  <img
                    src="/cloragua_hair_left.png"
                    alt="Cabello animado"
                    className="w-full h-full object-contain object-center opacity-90"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute inset-0 w-full h-full pointer-events-none animate-hair-right">
                  <img
                    src="/cloragua_hair_right.png"
                    alt="Cabello animado"
                    className="w-full h-full object-contain object-center opacity-90"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </>
            )}

            {/* Loop Overlays: Water Stream in Purification Scene */}
            {data.modeKey === 'purification' && (
              <div className="absolute top-[54%] left-[52.4%] w-[2.5px] h-[34px] pointer-events-none overflow-hidden">
                <div className="w-full h-full bg-gradient-to-b from-cyan-200 via-white to-cyan-300 animate-pulse opacity-90 shadow-[0_0_8px_#00e5ff]" />
              </div>
            )}

            {/* Loop Overlays: Glowing Flask Liquid in Greeting Scene */}
            {data.modeKey === 'greeting' && (
              <div className="absolute top-[46%] left-[27%] w-14 h-14 rounded-full bg-cyan-400/25 blur-md pointer-events-none animate-pulse" />
            )}

            {/* HTML5 Canvas overlay for real-time equipment & flask bubbles */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
            />
          </div>

          {/* Popped bubbles feedback counter */}
          {poppedCount > 0 && (
            <div className="absolute bottom-3 right-3 z-30 px-2.5 py-1 rounded-full bg-cyan-500/90 text-white font-hud text-[10px] font-bold shadow-lg backdrop-blur-md animate-bounce">
              🫧 {poppedCount} burbujas explotadas
            </div>
          )}

          {/* Hint overlay */}
          <div className="absolute bottom-3 left-3 z-30 px-2 py-0.5 rounded-full bg-black/60 text-cyan-200 font-hud text-[9px] font-bold border border-cyan-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10e7b2] animate-pulse" />
            <span>Imagen 100% Completa • Toca las burbujas</span>
          </div>
        </div>

        {/* 3. MODAL BODY & ACTIONS */}
        <div className="p-4 sm:p-5 flex flex-col gap-3 bg-white">
          <p className="text-[12.5px] text-[#3d494d] leading-relaxed">
            {data.desc}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSetBanner(data.modeKey);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00677d] hover:from-[#0096c7] hover:to-[#005466] text-white font-hud text-[11px] font-extrabold uppercase flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">view_carousel</span>
                <span>Colocar en Banner Principal</span>
              </button>

              <a
                href={data.url}
                download
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-hud text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Descargar imagen en alta resolución 1024x1024"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span className="hidden sm:inline">Descargar HD</span>
              </a>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-hud text-[11px] font-bold cursor-pointer transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
