import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toggleBgm, isBgmActive, subscribeBgmState } from '../utils/tropicalBgmSynthesizer';

export type ScientistSceneKey = 'animated_scientist' | 'photometer' | 'purification' | 'greeting' | 'cartoon_classic';

export interface SceneConfig {
  key: ScientistSceneKey;
  title: string;
  subtitle: string;
  image: string;
  video?: string;
  aspect: 'square' | 'wide';
  badge: string;
  speechText: string;
}

export const SCIENTIST_SCENES: Record<ScientistSceneKey, SceneConfig> = {
  animated_scientist: {
    key: 'animated_scientist',
    title: 'Científica Principal CLORAGUA',
    subtitle: 'Agua segura, comunidades más saludables',
    image: '/cloragua_scientist_animated_poster.jpg',
    video: '/cloragua_scientist_animated.mp4',
    aspect: 'wide',
    badge: 'ANIMACIÓN OFICIAL',
    speechText: '«¡Hola! Soy la Científica de CLORAGUA. Te acompaño en la dosificación de hipoclorito, el control fotométrico de cloro libre residual y la vigilancia de calidad del agua para garantizar salud en tu comunidad.»',
  },
  photometer: {
    key: 'photometer',
    title: 'Medición Fotométrica & Reactivo DPD',
    subtitle: 'Fotómetro Digital Portátil (0.50 - 2.00 ppm)',
    image: '/cloragua_photometer_chemist.jpg',
    aspect: 'square',
    badge: 'FOTÓMETRO DPD',
    speechText: '«¡Hola! Analizo el cloro libre residual con reactivo DPD en mi fotómetro digital. ¡Toca mi cabello para sentir la brisa o toca los equipos para ver burbujas!»',
  },
  purification: {
    key: 'purification',
    title: 'Columna de Purificación & Dosificación Continua',
    subtitle: 'Flujo Constante & Calibración de Gotero',
    image: '/cloragua_purification_column.jpg',
    aspect: 'square',
    badge: 'COLUMNA DE FLUJO',
    speechText: '«Controlando la columna de purificación para desinfección continua en el reservorio. ¡Agua segura para toda la comunidad!»',
  },
  greeting: {
    key: 'greeting',
    title: 'Guardiana de Agua Segura',
    subtitle: 'Vigilancia Sanitaria D.S. 031-2010-SA',
    image: '/cloragua_guardian_greeting.jpg',
    aspect: 'square',
    badge: 'GUARDIANA CLORAGUA',
    speechText: '«¡Bienvenido al centro de monitoreo CLORAGUA! Juntos garantizamos agua potable con calidad de laboratorio.»',
  },
  cartoon_classic: {
    key: 'cartoon_classic',
    title: 'Laboratorio de Desinfección Clásico',
    subtitle: 'Reacción Química & Contacto de 30 min',
    image: '/cloragua_scientist_cartoon.jpg',
    aspect: 'wide',
    badge: 'LABORATORIO CLÁSICO',
    speechText: '«¡Mira las burbujas subiendo de mi matraz! Toca mi mano para saludarte o toca el matraz para lanzar burbujas.»',
  },
};

interface Bubble {
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
  type: 'left_flask' | 'left_pipe' | 'right_reactor' | 'right_beaker' | 'dpd_tube' | 'ambient';
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

interface ScientistCartoonStageProps {
  onSplashRequest?: () => void;
  onOpenDosage?: () => void;
  activeSceneKey?: ScientistSceneKey;
  onSceneChange?: (scene: ScientistSceneKey) => void;
  onOpenDpdCamera?: () => void;
  className?: string;
}

export const ScientistCartoonStage: React.FC<ScientistCartoonStageProps> = ({
  onSplashRequest,
  onOpenDosage,
  activeSceneKey = 'animated_scientist',
  onSceneChange,
  onOpenDpdCamera,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Scene state
  const [selectedScene, setSelectedScene] = useState<ScientistSceneKey>(activeSceneKey);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [bubbleDensity, setBubbleDensity] = useState<'normal' | 'lively' | 'magical'>('lively');
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [bubbleCountPopped, setBubbleCountPopped] = useState(0);
  const [isHairBreeze, setIsHairBreeze] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(() => isBgmActive());

  useEffect(() => {
    const unsub = subscribeBgmState((playing) => {
      setIsBgmPlaying(playing);
    });
    return unsub;
  }, []);

  // Synchronize with external activeSceneKey if provided
  useEffect(() => {
    if (activeSceneKey && activeSceneKey !== selectedScene) {
      setSelectedScene(activeSceneKey);
    }
  }, [activeSceneKey, selectedScene]);

  const sceneConfig = SCIENTIST_SCENES[selectedScene] || SCIENTIST_SCENES.photometer;

  // Audio Context & Physics Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const splashParticlesRef = useRef<SplashParticle[]>([]);
  const nextBubbleIdRef = useRef<number>(1);
  const animFrameIdRef = useRef<number | null>(null);
  const lastBubbleSpawnRef = useRef<number>(0);

  // Initialize Web Audio API safely
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Synthesize realistic water bubble sound ("glu / bloop")
  const playBubbleSound = useCallback(
    (basePitch = 540, volume = 0.14) => {
      if (!isAudioEnabled) return;
      try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const freq = basePitch * (0.85 + Math.random() * 0.35);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * (1.75 + Math.random() * 0.55), now + 0.08);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
      } catch {
        // Audio best effort
      }
    },
    [getAudioContext, isAudioEnabled]
  );

  // Cheerful chime when interacting with the hair or character
  const playChimeSound = useCallback(() => {
    if (!isAudioEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.07);
        gain.gain.setValueAtTime(0.1, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.29);
      });
    } catch {
      // Audio best effort
    }
  }, [getAudioContext, isAudioEnabled]);

  // Burst bubbles particle creation
  const createBurstAt = useCallback(
    (x: number, y: number, count = 10, colorHex = '#00e5ff') => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
        const speed = 1.6 + Math.random() * 3.8;
        splashParticlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          radius: 2 + Math.random() * 3.5,
          alpha: 1,
          color: Math.random() > 0.3 ? colorHex : '#ffffff',
        });
      }
      playBubbleSound(440 + Math.random() * 320, 0.2);
    },
    [playBubbleSound]
  );

  // Trigger gentle hair breeze animation
  const handleTriggerHairBreeze = () => {
    setIsHairBreeze(true);
    playChimeSound();
    if (onSplashRequest) onSplashRequest();
    setTimeout(() => {
      setIsHairBreeze(false);
    }, 2500);
  };

  // Trigger photometer chemical reading animation
  const handleTriggerPhotometerReading = () => {
    setIsAnalyzing(true);
    playChimeSound();
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      // Burst pink DPD bubbles at the photometer tube
      createBurstAt(w * 0.29, h * 0.38, 14, '#ff2a85');
    }
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2800);
  };

  // Change scene handler
  const handleSelectScene = (key: ScientistSceneKey) => {
    setSelectedScene(key);
    if (onSceneChange) onSceneChange(key);
    playBubbleSound(580, 0.16);
  };

  // Main Canvas Particle Bubble Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const spawnInterval = bubbleDensity === 'magical' ? 45 : bubbleDensity === 'lively' ? 80 : 130;

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Coordinate anchors adapted to image aspect ratio
      const isPhotometer = selectedScene === 'photometer';
      const isClassic = selectedScene === 'cartoon_classic';

      // 1. SPAWN BUBBLES IN BACKGROUND EQUIPMENT
      if (time - lastBubbleSpawnRef.current > spawnInterval) {
        lastBubbleSpawnRef.current = time;

        if (isPhotometer) {
          // A. Left Flask / Beaker with Cyan Water (X ~11% to 16%, Y ~68%)
          bubblesRef.current.push({
            id: nextBubbleIdRef.current++,
            x: width * (0.11 + Math.random() * 0.05),
            y: height * (0.69 + Math.random() * 0.04),
            startX: width * 0.135,
            radius: 2.5 + Math.random() * 5.5,
            vy: -(0.9 + Math.random() * 1.5),
            wobbleSpeed: 0.05 + Math.random() * 0.05,
            wobbleAmp: 4 + Math.random() * 6,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.85,
            type: 'left_flask',
            colorType: 'cyan',
            maxLifetimeY: height * 0.55,
          });

          // B. Left Distillation Column / Vertical Pipes (X ~21% to 24%, Y ~76%)
          if (Math.random() > 0.3) {
            bubblesRef.current.push({
              id: nextBubbleIdRef.current++,
              x: width * (0.21 + Math.random() * 0.035),
              y: height * (0.76 + Math.random() * 0.04),
              startX: width * 0.225,
              radius: 1.8 + Math.random() * 4,
              vy: -(1.4 + Math.random() * 1.8),
              wobbleSpeed: 0.06,
              wobbleAmp: 3,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.8,
              type: 'left_pipe',
              colorType: 'blue',
              maxLifetimeY: height * 0.38,
            });
          }

          // C. Right Vertical Glass Reactor Column (X ~88% to 94%, Y ~70%)
          // Energetic stream of shiny bubbling water
          bubblesRef.current.push({
            id: nextBubbleIdRef.current++,
            x: width * (0.88 + Math.random() * 0.06),
            y: height * (0.71 + Math.random() * 0.04),
            startX: width * 0.91,
            radius: 3 + Math.random() * 9,
            vy: -(1.8 + Math.random() * 2.4),
            wobbleSpeed: 0.04,
            wobbleAmp: 5 + Math.random() * 7,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.9,
            type: 'right_reactor',
            colorType: 'cyan',
            maxLifetimeY: height * 0.22,
          });

          // D. Right Bench Beaker (X ~84% to 88%, Y ~68%)
          if (Math.random() > 0.45) {
            bubblesRef.current.push({
              id: nextBubbleIdRef.current++,
              x: width * (0.84 + Math.random() * 0.04),
              y: height * (0.68 + Math.random() * 0.04),
              startX: width * 0.86,
              radius: 2 + Math.random() * 4.5,
              vy: -(0.8 + Math.random() * 1.2),
              wobbleSpeed: 0.05,
              wobbleAmp: 3,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.75,
              type: 'right_beaker',
              colorType: 'emerald',
              maxLifetimeY: height * 0.54,
            });
          }

          // E. Photometer DPD Test Tube in her hands (X ~27.5% to 30.5%, Y ~44%)
          // Effervescent pink reactive bubbles
          if (Math.random() > 0.2) {
            bubblesRef.current.push({
              id: nextBubbleIdRef.current++,
              x: width * (0.275 + Math.random() * 0.03),
              y: height * (0.43 + Math.random() * 0.03),
              startX: width * 0.29,
              radius: 1.5 + Math.random() * 3.5,
              vy: -(0.7 + Math.random() * 1.1),
              wobbleSpeed: 0.07,
              wobbleAmp: 2.5,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.92,
              type: 'dpd_tube',
              colorType: 'pink',
              maxLifetimeY: height * 0.32,
            });
          }

          // F. Ambient Floating Bubbles that drift into the lab
          if (Math.random() < 0.18) {
            const spawnX = Math.random() > 0.5 ? width * 0.14 : width * 0.91;
            bubblesRef.current.push({
              id: nextBubbleIdRef.current++,
              x: spawnX,
              y: height * 0.35,
              startX: spawnX,
              radius: 5 + Math.random() * 14,
              vy: -(0.8 + Math.random() * 1.4),
              wobbleSpeed: 0.03,
              wobbleAmp: 10 + Math.random() * 15,
              phase: Math.random() * Math.PI * 2,
              opacity: 0.8,
              type: 'ambient',
              colorType: 'cyan',
              maxLifetimeY: -30,
            });
          }
        } else if (isClassic) {
          // Classic 16:9 Flask bubbles
          const flaskMouthX = width * 0.692;
          const flaskMouthY = height * 0.485;
          bubblesRef.current.push({
            id: nextBubbleIdRef.current++,
            x: flaskMouthX + (Math.random() - 0.5) * (width * 0.04),
            y: flaskMouthY,
            startX: flaskMouthX,
            radius: 4 + Math.random() * 10,
            vy: -(1.2 + Math.random() * 1.8),
            wobbleSpeed: 0.04,
            wobbleAmp: 8,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.85,
            type: 'ambient',
            colorType: 'cyan',
            maxLifetimeY: -20,
          });
        } else {
          // Purification / Greeting scenes general bubbling
          bubblesRef.current.push({
            id: nextBubbleIdRef.current++,
            x: width * (0.15 + Math.random() * 0.7),
            y: height * 0.8,
            startX: width * 0.5,
            radius: 3 + Math.random() * 8,
            vy: -(1.1 + Math.random() * 1.6),
            wobbleSpeed: 0.04,
            wobbleAmp: 6,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.8,
            type: 'ambient',
            colorType: 'cyan',
            maxLifetimeY: height * 0.2,
          });
        }

        // Play subtle sound occasionally
        if (Math.random() < 0.2) {
          playBubbleSound(480 + Math.random() * 260, 0.08);
        }
      }

      // 2. UPDATE & DRAW BUBBLES
      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i];
        b.y += b.vy;
        b.phase += b.wobbleSpeed;
        b.x += Math.sin(b.phase) * (b.wobbleAmp * 0.05);

        // Check if reaching equipment liquid meniscus
        if (b.y <= b.maxLifetimeY) {
          // If within view, pop with tiny particle burst
          if (b.y > 0 && b.radius > 3.5 && Math.random() < 0.35) {
            const popColor =
              b.colorType === 'pink'
                ? '#ff2a85'
                : b.colorType === 'emerald'
                ? '#10e7b2'
                : '#00e5ff';
            for (let k = 0; k < 4; k++) {
              splashParticlesRef.current.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 0.5,
                radius: 1.5,
                alpha: 0.9,
                color: popColor,
              });
            }
          }
          bubblesRef.current.splice(i, 1);
          continue;
        }

        // Fade near sky
        if (b.y < height * 0.1) {
          b.opacity -= 0.03;
        }

        if (b.opacity <= 0 || b.y < -30) {
          bubblesRef.current.splice(i, 1);
          continue;
        }

        // Render Bubble Body with Liquid Gradient
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
          radGrad.addColorStop(0.7, 'rgba(255, 20, 147, 0.45)');
          radGrad.addColorStop(1, 'rgba(199, 21, 133, 0.65)');
        } else if (b.colorType === 'emerald') {
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.4, 'rgba(16, 231, 178, 0.6)');
          radGrad.addColorStop(1, 'rgba(0, 103, 125, 0.7)');
        } else if (b.colorType === 'blue') {
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.4, 'rgba(0, 180, 216, 0.6)');
          radGrad.addColorStop(1, 'rgba(0, 119, 182, 0.75)');
        } else {
          // Default cyan
          radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          radGrad.addColorStop(0.3, 'rgba(180, 248, 255, 0.75)');
          radGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.45)');
          radGrad.addColorStop(1, 'rgba(0, 119, 182, 0.7)');
        }

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing outer boundary ring
        ctx.strokeStyle =
          b.colorType === 'pink' ? 'rgba(255, 192, 203, 0.9)' : 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(0.8, b.radius * 0.1);
        ctx.stroke();

        // Top-left Specular Crescent Glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.ellipse(
          b.x - b.radius * 0.38,
          b.y - b.radius * 0.38,
          b.radius * 0.28,
          b.radius * 0.16,
          -Math.PI / 4,
          0,
          Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
      }

      // 3. UPDATE & DRAW SPLASH PARTICLES
      for (let j = splashParticlesRef.current.length - 1; j >= 0; j--) {
        const p = splashParticlesRef.current[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14; // Gravity
        p.alpha -= 0.038;

        if (p.alpha <= 0) {
          splashParticlesRef.current.splice(j, 1);
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

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [bubbleDensity, playBubbleSound, selectedScene]);

  // Handle stage click
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const relX = clickX / rect.width;
    const relY = clickY / rect.height;

    // Check if clicked near scientist's hair / head (X ~35% to 65%, Y ~2% to 32%)
    if (relX >= 0.32 && relX <= 0.68 && relY <= 0.34) {
      handleTriggerHairBreeze();
      createBurstAt(clickX, clickY, 12, '#10e7b2');
      return;
    }

    // Check if clicked near photometer & DPD tube (X ~22% to 42%, Y ~32% to 60%)
    if (selectedScene === 'photometer' && relX >= 0.22 && relX <= 0.42 && relY >= 0.32 && relY <= 0.62) {
      handleTriggerPhotometerReading();
      return;
    }

    // Check if clicked near right reactor column (X ~84% to 98%, Y ~20% to 75%)
    if (relX >= 0.82 && relY >= 0.2) {
      createBurstAt(clickX, clickY, 16, '#00e5ff');
      setBubbleCountPopped((c) => c + 4);
      return;
    }

    // Check if clicked near left flask / glassware (X ~8% to 28%, Y ~50% to 80%)
    if (relX <= 0.28 && relY >= 0.5) {
      createBurstAt(clickX, clickY, 14, '#00b4d8');
      setBubbleCountPopped((c) => c + 3);
      return;
    }

    // Try popping existing bubble
    for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
      const b = bubblesRef.current[i];
      const dist = Math.hypot(clickX - b.x, clickY - b.y);
      if (dist < b.radius + 20) {
        createBurstAt(b.x, b.y, 8, b.colorType === 'pink' ? '#ff2a85' : '#00e5ff');
        bubblesRef.current.splice(i, 1);
        setBubbleCountPopped((c) => c + 1);
        return;
      }
    }

    // Default pleasant ripple
    createBurstAt(clickX, clickY, 7);
  };

  return (
    <>
      {/* 1. SVG Filter for Organic Hair Displacement Wave */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <defs>
          <filter id="scientistHairFlow" x="-15%" y="-15%" width="130%" height="130%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.014 0.028"
              numOctaves="3"
              result="turbulence"
            >
              <animate
                attributeName="baseFrequency"
                dur="6s"
                values="0.012 0.024; 0.022 0.038; 0.016 0.028; 0.012 0.024"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale={isHairBreeze ? 14 : 7}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* 2. Main Stage Container: Sized to ensure the COMPLETE character is 100% visible */}
      <div
        ref={containerRef}
        onClick={handleStageClick}
        className={`relative w-full ${className ? className : 'min-h-[440px] sm:min-h-[520px] md:min-h-[600px] max-h-[700px]'} overflow-hidden select-none cursor-pointer bg-[#00141a] rounded-3xl flex items-center justify-center`}
        title="¡Toca el cabello para sentir la brisa, el fotómetro para medir o los equipos para hacer burbujas!"
      >
        {/* A. Ambient Blurred Laboratory Backdrop Extension (Fills wide aspect ratios gracefully without black bars) */}
        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 filter blur-2xl scale-110 opacity-60"
          style={{
            backgroundImage: `url(${sceneConfig.image})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#00141a] via-transparent to-[#00141a]/40 z-0 pointer-events-none" />

        {/* B. Center Stage: Displaying the FULL ANIMATED SCIENTIST VIDEO OR CARTOON (100% height and width framed without cropping) */}
        <div className={`relative z-1 h-full w-full ${sceneConfig.aspect === 'wide' ? 'max-w-4xl aspect-video' : 'max-w-2xl aspect-square'} flex items-center justify-center ${selectedScene === 'animated_scientist' ? '' : 'animate-scientist-breath'}`}>
          {sceneConfig.video ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.6)] border border-cyan-500/30 bg-black flex items-center justify-center">
              <video
                src={sceneConfig.video}
                poster={sceneConfig.image}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover sm:object-contain object-center filter brightness-105"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#00141a]/40 via-transparent to-transparent" />
            </div>
          ) : (
            /* Base Character & Laboratory Image */
            <img
              src={sceneConfig.image}
              alt={sceneConfig.title}
              className="w-full h-full object-contain object-center filter brightness-100 drop-shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
              referrerPolicy="no-referrer"
            />
          )}

          {/* C. ANIMATED HAIR LAYERS (Specifically for the Photometer Chemist Cartoon) */}
          {selectedScene === 'photometer' && (
            <>
              {/* Left flowing hair lock overlay */}
              <div
                className={`absolute inset-0 w-full h-full pointer-events-none ${
                  isHairBreeze ? 'animate-hair-puff-left' : 'animate-hair-left'
                }`}
                style={{
                  filter: 'url(#scientistHairFlow)',
                  willChange: 'transform, filter',
                }}
              >
                <img
                  src="/cloragua_hair_left.png"
                  alt="Mechón izquierdo animado"
                  className="w-full h-full object-contain object-center"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right flowing hair lock overlay */}
              <div
                className={`absolute inset-0 w-full h-full pointer-events-none ${
                  isHairBreeze ? 'animate-hair-puff-right' : 'animate-hair-right'
                }`}
                style={{
                  filter: 'url(#scientistHairFlow)',
                  willChange: 'transform, filter',
                }}
              >
                <img
                  src="/cloragua_hair_right.png"
                  alt="Mechón derecho animado"
                  className="w-full h-full object-contain object-center"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Hair Interactive Aura Glow Sparkle (when breezy) */}
              {isHairBreeze && (
                <div className="absolute top-[8%] left-[45%] -translate-x-1/2 pointer-events-none flex items-center gap-1 bg-cyan-400/30 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-cyan-300 text-cyan-200 text-[10px] font-hud font-bold animate-bounce shadow-lg">
                  <span className="material-symbols-outlined text-[14px] text-cyan-200 animate-spin">
                    air
                  </span>
                  <span>¡Brisa de Laboratorio!</span>
                </div>
              )}

              {/* Photometer Chemical Active Glow when analyzed */}
              {isAnalyzing && (
                <div className="absolute top-[35%] left-[28%] pointer-events-none flex flex-col items-center">
                  <span className="px-2 py-0.5 rounded-full bg-pink-600/90 text-white font-hud text-[10px] font-black tracking-wider animate-pulse shadow-[0_0_15px_#ff2a85]">
                    2.5 ppm PASS
                  </span>
                  <span className="text-[10px] text-pink-200 font-hud font-bold drop-shadow">
                    DPD Óptimo
                  </span>
                </div>
              )}
            </>
          )}

          {/* D. Classic Cartoon Waving Hand Layer (if classic scene selected) */}
          {selectedScene === 'cartoon_classic' && (
            <div
              style={{
                position: 'absolute',
                left: '25.8%',
                top: '42.2%',
                width: '14.2%',
                height: '28.5%',
                transformOrigin: '50% 90%',
                pointerEvents: 'auto',
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerHairBreeze();
              }}
              className="cursor-pointer animate-hand-wave-idle"
              title="¡Toca para saludar!"
            >
              <img
                src="/hand_feathered.png"
                alt="Mano saludando"
                className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,180,216,0.35)]"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* E. HTML5 Canvas 60 FPS Particle Bubble Engine (Bubbles in Equipment) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none w-full h-full z-10"
          />
        </div>

        {/* 3. Top Badges & Controls Bar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          {/* Active Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400/40 text-[10px] font-hud uppercase tracking-widest text-cyan-300 font-bold shadow-md">
            <span className="w-2 h-2 rounded-full bg-[#10e7b2] animate-pulse" />
            <span>CLORAGUA • {sceneConfig.badge}</span>
          </div>

          {/* Top Quick Actions (Sound, Density, Hair Breeze, Fullscreen) */}
          <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-md">
            {/* Tropical Calypso BGM Quick Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleBgm();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-hud font-bold transition-all cursor-pointer select-none ${
                isBgmPlaying
                  ? 'bg-gradient-to-r from-[#10e7b2] to-[#00b4d8] text-[#002116] shadow-sm font-black'
                  : 'text-white/80 hover:text-white bg-white/10'
              }`}
              title={isBgmPlaying ? 'Pausar música Calypso' : 'Reproducir música tropical Calypso en vivo'}
            >
              <span className={`material-symbols-outlined text-[13px] ${isBgmPlaying ? 'animate-bounce text-[#002116]' : ''}`}>
                {isBgmPlaying ? 'music_note' : 'music_off'}
              </span>
              <span className="hidden sm:inline">
                {isBgmPlaying ? 'Calypso On' : 'Calypso Off'}
              </span>
            </button>

            {/* Quick Camera DPD Scanner Button */}
            {onOpenDpdCamera && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDpdCamera();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-hud font-bold transition-all cursor-pointer select-none bg-gradient-to-r from-[#00b4d8] to-[#10e7b2] hover:opacity-95 text-[#00212b] shadow-sm font-black active:scale-95"
                title="Abrir Cámara Escáner DPD (Fotómetro en Vivo)"
              >
                <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                <span className="hidden sm:inline">Cámara DPD</span>
              </button>
            )}

            {/* Audio Toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsAudioEnabled(!isAudioEnabled);
                if (!isAudioEnabled) playChimeSound();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-hud font-bold transition-all cursor-pointer ${
                isAudioEnabled
                  ? 'bg-[#10e7b2] text-[#002116] shadow-xs'
                  : 'text-white/80 hover:text-white bg-white/10'
              }`}
              title={isAudioEnabled ? 'Sonido de burbujas activo' : 'Activar sonido de burbujas'}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isAudioEnabled ? 'volume_up' : 'volume_off'}
              </span>
              <span className="hidden sm:inline">
                {isAudioEnabled ? 'Sonido On' : 'Sonido Off'}
              </span>
            </button>

            {/* Hair breeze trigger button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerHairBreeze();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-hud font-bold bg-cyan-500 hover:bg-cyan-400 text-[#00141a] transition-all cursor-pointer shadow-xs"
              title="Hacer mover el cabello con brisa"
            >
              <span className="material-symbols-outlined text-[13px]">air</span>
              <span>Mover Cabello</span>
            </button>

            {/* Bubble Density Selector */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setBubbleDensity((cur) =>
                  cur === 'normal' ? 'lively' : cur === 'lively' ? 'magical' : 'normal'
                );
                playBubbleSound(620, 0.18);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-hud font-bold bg-[#00b4d8] text-white hover:bg-[#0096c7] cursor-pointer shadow-xs"
              title="Intensidad de burbujeo en equipos"
            >
              <span className="material-symbols-outlined text-[13px]">bubble_chart</span>
              <span className="capitalize">{bubbleDensity}</span>
            </button>

            {/* Expand Fullscreen Modal Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullscreenModal(true);
              }}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Ver imagen completa en pantalla gigante"
            >
              <span className="material-symbols-outlined text-[14px]">fullscreen</span>
            </button>
          </div>
        </div>

        {/* 4. Interactive Dialogue Bubble */}
        {showSpeechBubble && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleTriggerHairBreeze();
            }}
            className="absolute top-14 left-3 sm:left-5 z-20 max-w-[280px] sm:max-w-xs p-3.5 rounded-2xl bg-[#00212b]/95 backdrop-blur-md border border-cyan-400/50 shadow-[0_12px_32px_rgba(0,25,35,0.7)] text-white animate-in fade-in cursor-pointer hover:border-cyan-300 transition-colors pointer-events-auto"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="flex items-center gap-1 text-[11px] font-hud font-extrabold text-[#10e7b2] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]">science</span>
                Científica CLORAGUA
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeechBubble(false);
                }}
                className="text-white/60 hover:text-white text-[15px] leading-none"
                type="button"
                title="Cerrar mensaje"
              >
                ×
              </button>
            </div>
            <p className="text-[12px] text-cyan-50 font-medium leading-relaxed">
              {sceneConfig.speechText}
            </p>
            <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-cyan-500/20 text-[10px] font-hud text-cyan-300">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10e7b2] animate-pulse" />
                Toca el cabello o equipos
              </span>
              {bubbleCountPopped > 0 && (
                <span className="text-[#caf300] font-bold">
                  {bubbleCountPopped} burbujas explotadas
                </span>
              )}
            </div>
          </div>
        )}

        {/* 5. Bottom Navigation & Scene Selector Dock */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col sm:flex-row sm:items-end justify-between gap-2 pointer-events-none">
          {/* Scene Title & Subtitle */}
          <div className="flex flex-col bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 max-w-md pointer-events-auto">
            <span className="font-hud text-[11px] text-cyan-300 font-extrabold uppercase tracking-wider drop-shadow">
              {sceneConfig.subtitle}
            </span>
            <span className="text-[13px] text-white font-bold drop-shadow">
              {sceneConfig.title}
            </span>
          </div>

          {/* Quick Scene Switcher Buttons */}
          <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 pointer-events-auto shadow-md overflow-x-auto no-scrollbar">
            {(Object.keys(SCIENTIST_SCENES) as ScientistSceneKey[]).map((key) => {
              const sc = SCIENTIST_SCENES[key];
              const isCurrent = selectedScene === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectScene(key);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-hud text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-gradient-to-r from-[#00b4d8] to-[#10e7b2] text-[#002116] shadow-sm font-extrabold'
                      : 'text-white/80 hover:text-white bg-white/10 hover:bg-white/20'
                  }`}
                  title={sc.title}
                >
                  <span className="material-symbols-outlined text-[13px]">
                    {key === 'animated_scientist'
                      ? 'movie'
                      : key === 'photometer'
                      ? 'biotech'
                      : key === 'purification'
                      ? 'water'
                      : key === 'greeting'
                      ? 'waving_hand'
                      : 'science'}
                  </span>
                  <span>{sc.badge}</span>
                </button>
              );
            })}

            {onOpenDosage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDosage();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-hud text-[10px] font-extrabold uppercase shadow-sm cursor-pointer flex items-center gap-1 hover:brightness-110"
              >
                <span className="material-symbols-outlined text-[13px]">calculate</span>
                <span>Dosis</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6. FULLSCREEN HIGH-DEFINITION CARTOON MODAL (For viewing 100% full scale on any screen) */}
      {isFullscreenModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in"
            onClick={() => setIsFullscreenModal(false)}
          >
            <div
              className="relative bg-[#00141a] rounded-3xl overflow-hidden border border-cyan-400/40 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center text-white p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="w-full flex items-center justify-between p-3 border-b border-cyan-900/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10e7b2] animate-ping" />
                  <span className="font-hud text-[13px] font-extrabold text-cyan-300 uppercase">
                    {sceneConfig.title} • Vista Completa 100%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFullscreenModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Modal Media Display */}
              <div className={`relative w-full ${sceneConfig.aspect === 'wide' ? 'max-w-4xl aspect-video' : 'max-w-2xl aspect-square'} flex items-center justify-center my-auto overflow-hidden rounded-2xl bg-black`}>
                {sceneConfig.video ? (
                  <video
                    src={sceneConfig.video}
                    poster={sceneConfig.image}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-contain object-center filter brightness-105"
                  />
                ) : (
                  <img
                    src={sceneConfig.image}
                    alt={sceneConfig.title}
                    className="w-full h-full object-contain object-center filter brightness-100"
                  />
                )}

                {/* Overlaid Animated Hair in Modal */}
                {selectedScene === 'photometer' && (
                  <>
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none animate-hair-left"
                      style={{ filter: 'url(#scientistHairFlow)' }}
                    >
                      <img
                        src="/cloragua_hair_left.png"
                        alt="Cabello animado"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none animate-hair-right"
                      style={{ filter: 'url(#scientistHairFlow)' }}
                    >
                      <img
                        src="/cloragua_hair_right.png"
                        alt="Cabello animado"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="w-full p-3 border-t border-cyan-900/50 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] text-cyan-100/90 font-medium">
                  Ilustración de alta fidelidad: Científica Oficial CLORAGUA con cabello animado y burbujeo en equipos.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerHairBreeze}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#00141a] font-hud text-[11px] font-bold cursor-pointer"
                  >
                    Brisa en Cabello
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreenModal(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-hud text-[11px] font-bold cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
