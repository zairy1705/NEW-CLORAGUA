import React, { useRef, useEffect, useState, useCallback } from 'react';

export type ShowcaseScene = 'photometer' | 'purification' | 'greeting';

interface ShowcaseCardAnimationProps {
  scene: ShowcaseScene;
  title: string;
  badgeText: string;
  badgeGradient: string;
  onOpenModal: () => void;
  onSetBanner: () => void;
  className?: string;
}

interface CardBubble {
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
  type: 'flask' | 'reactor' | 'column' | 'tap_drip' | 'dpd' | 'ambient';
  colorType: 'cyan' | 'pink' | 'emerald' | 'blue';
  maxLifetimeY: number;
}

interface SplashDot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export const ShowcaseCardAnimation: React.FC<ShowcaseCardAnimationProps> = ({
  scene,
  title,
  badgeText,
  badgeGradient,
  onOpenModal,
  onSetBanner,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const bubblesRef = useRef<CardBubble[]>([]);
  const splashRef = useRef<SplashDot[]>([]);
  const nextIdRef = useRef<number>(1);
  const animIdRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);

  const [isHovered, setIsHovered] = useState(false);
  const [bubblePopCount, setBubblePopCount] = useState(0);

  // Synthesize soft arcade bubble sound on interaction
  const playBloop = useCallback((pitch = 560) => {
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
      osc.frequency.setValueAtTime(pitch * (0.9 + Math.random() * 0.25), now);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.8, now + 0.07);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch {
      // Audio best effort
    }
  }, []);

  // Spawn pop particles
  const spawnPopAt = useCallback(
    (x: number, y: number, color = '#00e5ff', count = 7) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
        const speed = 1.2 + Math.random() * 2.8;
        splashRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          radius: 1.5 + Math.random() * 2.5,
          alpha: 0.95,
          color,
        });
      }
      playBloop(480 + Math.random() * 280);
    },
    [playBloop]
  );

  // Main Continuous Particle Loop Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 360);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Dynamic spawn rate: Faster and livelier
    const spawnInterval = isHovered ? 45 : 75;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // 1. CONTINUOUS BUBBLE SPAWNING IN LOOP FOR EQUIPMENT & FLASKS
      if (time - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = time;

        if (scene === 'photometer') {
          // A. Matraz / Vaso izquierdo en mesón (X: ~13.5%, Y: ~67%)
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.11 + Math.random() * 0.05),
            y: height * (0.68 + Math.random() * 0.03),
            startX: width * 0.135,
            radius: 2.2 + Math.random() * 4.8,
            vy: -(0.9 + Math.random() * 1.3),
            wobbleSpeed: 0.06,
            wobbleAmp: 4 + Math.random() * 4,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.9,
            type: 'flask',
            colorType: 'cyan',
            maxLifetimeY: height * 0.52,
          });

          // B. Reactor vertical derecho de vidrio con agua a presión (X: ~91%, Y: ~73%)
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.88 + Math.random() * 0.06),
            y: height * (0.72 + Math.random() * 0.03),
            startX: width * 0.91,
            radius: 3 + Math.random() * 7.5,
            vy: -(1.6 + Math.random() * 2.2),
            wobbleSpeed: 0.05,
            wobbleAmp: 5,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.95,
            type: 'reactor',
            colorType: 'cyan',
            maxLifetimeY: height * 0.22,
          });

          // C. Tubo DPD en la mano (X: ~29%, Y: ~44%) - Reactivo rosado efervescente
          if (Math.random() > 0.25) {
            bubblesRef.current.push({
              id: nextIdRef.current++,
              x: width * (0.28 + Math.random() * 0.03),
              y: height * (0.43 + Math.random() * 0.03),
              startX: width * 0.29,
              radius: 1.5 + Math.random() * 3.2,
              vy: -(0.8 + Math.random() * 1.1),
              wobbleSpeed: 0.07,
              wobbleAmp: 2.5,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.95,
              type: 'dpd',
              colorType: 'pink',
              maxLifetimeY: height * 0.31,
            });
          }

          // D. Ambient laboratory sparkling bubble floating upward
          if (Math.random() < 0.2) {
            bubblesRef.current.push({
              id: nextIdRef.current++,
              x: width * (0.15 + Math.random() * 0.75),
              y: height * 0.75,
              startX: width * 0.5,
              radius: 4 + Math.random() * 9,
              vy: -(0.7 + Math.random() * 1.1),
              wobbleSpeed: 0.04,
              wobbleAmp: 8,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.8,
              type: 'ambient',
              colorType: 'blue',
              maxLifetimeY: -20,
            });
          }
        } else if (scene === 'purification') {
          // A. Gran Columna cilíndrica de purificación central (X: ~59% to 67%, Y: ~65% to 35%)
          // Intensa corriente de burbujas en el cilindro
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.58 + Math.random() * 0.09),
            y: height * (0.64 + Math.random() * 0.03),
            startX: width * 0.62,
            radius: 2.5 + Math.random() * 6.5,
            vy: -(1.5 + Math.random() * 2.0),
            wobbleSpeed: 0.06,
            wobbleAmp: 4,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.95,
            type: 'column',
            colorType: 'cyan',
            maxLifetimeY: height * 0.33,
          });

          // B. Grifo y Matraz que sostiene la científica (X: ~51% to 54%, Y: ~56% to 64%)
          // Chorro de agua que entra al matraz y produce burbujas en el cuello
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.51 + Math.random() * 0.035),
            y: height * (0.63 + Math.random() * 0.02),
            startX: width * 0.525,
            radius: 2 + Math.random() * 4.5,
            vy: -(1.0 + Math.random() * 1.4),
            wobbleSpeed: 0.08,
            wobbleAmp: 3,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.92,
            type: 'flask',
            colorType: 'blue',
            maxLifetimeY: height * 0.51,
          });

          // C. Tubería lateral y columnas de fondo (X: ~15% to 20%, Y: ~68%)
          if (Math.random() > 0.4) {
            bubblesRef.current.push({
              id: nextIdRef.current++,
              x: width * (0.15 + Math.random() * 0.06),
              y: height * (0.68 + Math.random() * 0.03),
              startX: width * 0.18,
              radius: 2 + Math.random() * 4,
              vy: -(1.1 + Math.random() * 1.3),
              wobbleSpeed: 0.05,
              wobbleAmp: 3,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.85,
              type: 'reactor',
              colorType: 'cyan',
              maxLifetimeY: height * 0.42,
            });
          }

          // D. Ambient sparkling drops
          if (Math.random() < 0.22) {
            bubblesRef.current.push({
              id: nextIdRef.current++,
              x: width * (0.4 + Math.random() * 0.4),
              y: height * 0.55,
              startX: width * 0.55,
              radius: 3 + Math.random() * 8,
              vy: -(0.9 + Math.random() * 1.3),
              wobbleSpeed: 0.04,
              wobbleAmp: 7,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.85,
              type: 'ambient',
              colorType: 'cyan',
              maxLifetimeY: -20,
            });
          }
        } else {
          // SCENE: GREETING (Guardiana de Agua Segura con Matraz en Mano Derecha y Saludo)
          // A. Matraz esférico de vidrio en su mano derecha (X: ~27% to 32%, Y: ~48%)
          // Burbujas emergiendo enérgicamente del matraz azul
          bubblesRef.current.push({
            id: nextIdRef.current++,
            x: width * (0.27 + Math.random() * 0.05),
            y: height * (0.50 + Math.random() * 0.03),
            startX: width * 0.295,
            radius: 2.8 + Math.random() * 6.5,
            vy: -(1.3 + Math.random() * 1.8),
            wobbleSpeed: 0.05,
            wobbleAmp: 5,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.95,
            type: 'flask',
            colorType: 'cyan',
            maxLifetimeY: height * 0.35,
          });

          // B. Gran reactor/cilindro acuático izquierdo con plantas y biosensores (X: ~14% to 20%, Y: ~68%)
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
            type: 'reactor',
            colorType: 'emerald',
            maxLifetimeY: height * 0.38,
          });

          // C. Cilindro vertical derecho transparente (X: ~91% to 96%, Y: ~55%)
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
              type: 'column',
              colorType: 'cyan',
              maxLifetimeY: height * 0.22,
            });
          }

          // D. Ambient bubbles floating up past the greeting hand (X: ~60% to 80%)
          if (Math.random() < 0.24) {
            bubblesRef.current.push({
              id: nextIdRef.current++,
              x: width * (0.62 + Math.random() * 0.18),
              y: height * (0.45 + Math.random() * 0.2),
              startX: width * 0.7,
              radius: 4 + Math.random() * 9,
              vy: -(1.0 + Math.random() * 1.4),
              wobbleSpeed: 0.04,
              wobbleAmp: 8,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.85,
              type: 'ambient',
              colorType: 'blue',
              maxLifetimeY: -20,
            });
          }
        }
      }

      // 2. UPDATE AND DRAW BUBBLES
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        b.y += b.vy;
        b.phase += b.wobbleSpeed;
        b.x += Math.sin(b.phase) * (b.wobbleAmp * 0.06);

        // Check if reaching max lifetime or surface
        if (b.y <= b.maxLifetimeY) {
          // Pop into micro splash particles
          if (b.y > 0 && b.radius > 3.0 && Math.random() < 0.45) {
            const popColor =
              b.colorType === 'pink'
                ? '#ff2a85'
                : b.colorType === 'emerald'
                ? '#10e7b2'
                : '#00e5ff';
            for (let k = 0; k < 4; k++) {
              splashRef.current.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 2.2,
                vy: -Math.random() * 2.2 - 0.5,
                radius: 1.5,
                alpha: 0.9,
                color: popColor,
              });
            }
          }
          bubblesRef.current.splice(i, 1);
          continue;
        }

        // Fade near top
        if (b.y < height * 0.12) {
          b.opacity -= 0.035;
        }

        if (b.opacity <= 0 || b.y < -25) {
          bubblesRef.current.splice(i, 1);
          continue;
        }

        // Render Bubble Body with Liquid Gradient & Glossy Reflection
        ctx.save();
        ctx.globalAlpha = Math.max(0, b.opacity);

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
          radGrad.addColorStop(0.7, 'rgba(255, 20, 147, 0.5)');
          radGrad.addColorStop(1, 'rgba(199, 21, 133, 0.7)');
        } else if (b.colorType === 'emerald') {
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.4, 'rgba(16, 231, 178, 0.65)');
          radGrad.addColorStop(1, 'rgba(0, 103, 125, 0.75)');
        } else if (b.colorType === 'blue') {
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.4, 'rgba(0, 180, 216, 0.65)');
          radGrad.addColorStop(1, 'rgba(0, 119, 182, 0.8)');
        } else {
          // Cyan default
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.3, 'rgba(180, 248, 255, 0.8)');
          radGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.5)');
          radGrad.addColorStop(1, 'rgba(0, 119, 182, 0.75)');
        }

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Edge glow ring
        ctx.strokeStyle =
          b.colorType === 'pink' ? 'rgba(255, 192, 203, 0.9)' : 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(0.8, b.radius * 0.12);
        ctx.stroke();

        // Top-left Specular crescent glint
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

      // 3. UPDATE & DRAW SPLASH PARTICLES
      for (let j = splashRef.current.length - 1; j >= 0; j--) {
        const p = splashRef.current[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
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
  }, [isHovered, scene]);

  // Click handler to interact with bubbles or open modal
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked near an existing bubble to pop it
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      const dist = Math.hypot(clickX - b.x, clickY - b.y);
      if (dist < b.radius + 18) {
        spawnPopAt(b.x, b.y, b.colorType === 'pink' ? '#ff2a85' : '#00e5ff', 9);
        bubblesRef.current.splice(i, 1);
        setBubblePopCount((c) => c + 1);
        return;
      }
    }

    // Otherwise create water ripple burst
    spawnPopAt(clickX, clickY, '#00e5ff', 8);
    setBubblePopCount((c) => c + 1);

    // Open detail modal if clicked in center area
    onOpenModal();
  };

  const imageSrc =
    scene === 'photometer'
      ? '/cloragua_photometer_chemist.jpg'
      : scene === 'purification'
      ? '/cloragua_purification_column.jpg'
      : '/cloragua_guardian_greeting.jpg';

  return (
    <div
      ref={containerRef}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative aspect-square w-full overflow-hidden bg-gradient-to-b from-[#001f27] to-[#003643] cursor-pointer select-none rounded-t-3xl ${className}`}
      title="¡Animación en LOOP activo! Toca para interactuar o ver detalles."
    >
      {/* 1. CHARACTER LOOP MOTION WRAPPER: Breathing, Floating & Gentle Organic Sway in Continuous Loop */}
      <div className="relative w-full h-full animate-scientist-breath overflow-hidden">
        {/* Base Character & Laboratory Image */}
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover object-top filter brightness-95 group-hover:brightness-105 group-hover:scale-105 transition-all duration-700"
          referrerPolicy="no-referrer"
        />

        {/* 2. SPECIFIC LOOP ANIMATIONS PER SCENE */}

        {/* SCENE 1: Photometer Chemist Hair Sway in Loop */}
        {scene === 'photometer' && (
          <>
            {/* Hair Left Flowing Lock Overlay (Animated in Continuous Loop) */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none animate-hair-left"
              style={{
                willChange: 'transform',
                transformOrigin: '43% 15%',
              }}
            >
              <img
                src="/cloragua_hair_left.png"
                alt="Cabello izquierdo animado"
                className="w-full h-full object-cover object-top opacity-90"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Hair Right Flowing Lock Overlay (Animated in Continuous Loop) */}
            <div
              className="absolute inset-0 w-full h-full pointer-events-none animate-hair-right"
              style={{
                willChange: 'transform',
                transformOrigin: '58% 15%',
              }}
            >
              <img
                src="/cloragua_hair_right.png"
                alt="Cabello derecho animado"
                className="w-full h-full object-cover object-top opacity-90"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Glowing DPD test tube aura pulse in hands */}
            <div className="absolute top-[42%] left-[27%] w-10 h-10 rounded-full bg-pink-500/20 blur-md pointer-events-none animate-pulse" />

            {/* Specular Glint sweeping across safety goggles in loop */}
            <div className="absolute top-[30%] left-[36%] w-24 h-6 -rotate-12 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-pulse duration-1000" />
          </>
        )}

        {/* SCENE 2: Purification Column - Water Tap Flow & Aeration Churn Loop */}
        {scene === 'purification' && (
          <>
            {/* Animated Stream of Pure Water flowing from Tap to Flask in loop */}
            <div className="absolute top-[54%] left-[52.4%] w-[2.5px] h-[34px] pointer-events-none overflow-hidden">
              <div className="w-full h-full bg-gradient-to-b from-cyan-200 via-white to-cyan-300 animate-pulse opacity-90 shadow-[0_0_8px_#00e5ff]" />
            </div>

            {/* Water splash ripples at the mouth of the flask */}
            <div className="absolute top-[62.5%] left-[51.5%] w-3 h-1 rounded-full bg-cyan-200/90 blur-[1px] pointer-events-none animate-ping duration-700" />

            {/* Glowing Pressurized Column Aeration Glow in loop */}
            <div className="absolute top-[36%] left-[58%] w-16 h-28 bg-cyan-400/15 rounded-2xl blur-lg pointer-events-none animate-pulse" />

            {/* LED Status Display blink: "99.8% OK" */}
            <div className="absolute top-[25%] left-[68%] pointer-events-none flex items-center gap-1 bg-black/75 px-1.5 py-0.5 rounded-sm border border-emerald-400/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[7.5px] font-hud font-bold text-emerald-300">PURIF. ACTIVE</span>
            </div>
          </>
        )}

        {/* SCENE 3: Greeting Scientist - Waving Hand Loop & Swirling Flask Aura */}
        {scene === 'greeting' && (
          <>
            {/* Round flask blue bioluminescent liquid glow in loop */}
            <div className="absolute top-[46%] left-[27%] w-14 h-14 rounded-full bg-cyan-400/25 blur-md pointer-events-none animate-pulse" />

            {/* Greeting Hand Sparkling Aura Loop */}
            <div className="absolute top-[28%] left-[70%] w-12 h-12 rounded-full bg-cyan-300/20 blur-md pointer-events-none animate-ping duration-1000" />

            {/* Friendly Hand Wave Motion Shimmer */}
            <div className="absolute top-[24%] left-[68%] pointer-events-none animate-bounce duration-1000">
              <span className="text-[13px] drop-shadow">✨</span>
            </div>

            {/* Bioluminescent column glow on the left */}
            <div className="absolute top-[50%] left-[13%] w-12 h-24 bg-teal-400/20 rounded-full blur-lg pointer-events-none animate-pulse" />
          </>
        )}
      </div>

      {/* 3. CONTINUOUS CANVAS BUBBLE OVERLAY (100% TRANSPARENT, HARDWARE ACCELERATED) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* 4. SHADOW VIGNETTE GRADIENT */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-80 group-hover:opacity-60 transition-opacity pointer-events-none z-10" />

      {/* 5. TOP BADGES: CATEGORY & LOOP ACTIVE STATUS */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <span
          className={`px-2.5 py-1 rounded-full text-white font-hud text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 ${badgeGradient}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          {badgeText}
        </span>

        {/* Live Loop Status Indicator Badge */}
        <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-cyan-400/40 text-[9px] font-hud font-bold text-cyan-300 flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10e7b2] animate-ping" />
          LOOP ACTIVO
        </span>
      </div>

      {/* 6. BOTTOM ACTION BUTTON: "VER EN BANNER" */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-20 pointer-events-auto">
        {bubblePopCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/80 text-white font-hud text-[9px] font-bold backdrop-blur-md animate-bounce">
            🫧 {bubblePopCount}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetBanner();
          }}
          className="px-2.5 py-1 rounded-full bg-black/65 hover:bg-[#00b4d8] text-white text-[10px] font-hud font-bold backdrop-blur-md flex items-center gap-1 transition-all border border-white/25 shadow-md cursor-pointer hover:border-cyan-300"
          title="Poner esta caricatura en el banner principal interactivo"
        >
          <span className="material-symbols-outlined text-[14px]">visibility</span>
          <span>Ver en Banner</span>
        </button>
      </div>
    </div>
  );
};
