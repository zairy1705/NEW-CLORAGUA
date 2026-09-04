import React, { useEffect, useRef, useState } from 'react';

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  amplitude: number;
  speed: number;
  alpha: number;
  color: string;
}

interface Bubble {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  driftX: number;
  phase: number;
  alpha: number;
}

export const InteractiveWaterEngine: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [intensity, setIntensity] = useState<'high' | 'medium' | 'calm'>('medium');
  const [continuousSound, setContinuousSound] = useState<boolean>(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);
  const [volumeLevel, setVolumeLevel] = useState<'soft' | 'medium' | 'full'>('medium');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const continuousSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const continuousGainRef = useRef<GainNode | null>(null);
  const continuousLfoRef = useRef<OscillatorNode | null>(null);
  const bubbleIntervalRef = useRef<number | null>(null);

  // Initialize or resume AudioContext safely
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const getVolumeMultiplier = (): number => {
    return volumeLevel === 'soft' ? 0.12 : volumeLevel === 'medium' ? 0.24 : 0.38;
  };

  // Synthesize realistic soft water droplet chirp
  const playWaterDropletSound = (freq = 650) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.7, ctx.currentTime + 0.08);

      const vol = getVolumeMultiplier() * 0.4;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // ignore
    }
  };

  // Synthesizes a powerful and relaxing burst of running water (arroyo / corriente de agua pura)
  const playRunningWaterRush = (duration = 2.4) => {
    try {
      const ctx = getAudioContext();
      const bufferSize = Math.floor(ctx.sampleRate * (duration + 0.4));
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      let lastL = 0;
      let lastR = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        // Brown noise integration for rich natural liquid density
        lastL = (lastL + 0.045 * whiteL) / 1.045;
        lastR = (lastR + 0.045 * whiteR) / 1.045;
        left[i] = lastL * 3.6;
        right[i] = lastR * 3.6;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Bandpass filter 1: Deep water flow / channel resonance
      const streamFilter = ctx.createBiquadFilter();
      streamFilter.type = 'bandpass';
      streamFilter.frequency.setValueAtTime(460, ctx.currentTime);
      streamFilter.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + duration * 0.35);
      streamFilter.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + duration);
      streamFilter.Q.value = 1.4;

      // Bandpass filter 2: Sparkling water spray & surface shimmer
      const sprayFilter = ctx.createBiquadFilter();
      sprayFilter.type = 'bandpass';
      sprayFilter.frequency.setValueAtTime(1150, ctx.currentTime);
      sprayFilter.frequency.exponentialRampToValueAtTime(1650, ctx.currentTime + duration * 0.45);
      sprayFilter.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + duration);
      sprayFilter.Q.value = 2.1;

      // Lowpass filter: softens any digital harshness
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 2600;

      // Master gain envelope for the rushing stream
      const gainNode = ctx.createGain();
      const peakVol = getVolumeMultiplier();
      gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(peakVol, ctx.currentTime + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(peakVol * 0.7, ctx.currentTime + duration * 0.65);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      noiseSource.connect(streamFilter);
      noiseSource.connect(sprayFilter);
      streamFilter.connect(lowpass);
      sprayFilter.connect(lowpass);
      lowpass.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start();
      noiseSource.stop(ctx.currentTime + duration + 0.05);

      // Micro-droplet bubblers during the running water rush
      for (let k = 0; k < 4; k++) {
        setTimeout(() => {
          if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
            playWaterDropletSound(480 + Math.random() * 320);
          }
        }, 100 + k * 220);
      }
    } catch {
      // ignore
    }
  };

  // Start continuous soothing stream of running water in background
  const startContinuousWaterStream = (targetVol?: number) => {
    try {
      const ctx = getAudioContext();
      if (continuousSourceRef.current) {
        // already active, update volume
        const vol = targetVol ?? getVolumeMultiplier() * 0.85;
        continuousGainRef.current?.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.3);
        return;
      }

      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      let lastL = 0;
      let lastR = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        lastL = (lastL + 0.04 * whiteL) / 1.04;
        lastR = (lastR + 0.04 * whiteR) / 1.04;
        left[i] = lastL * 3.4;
        right[i] = lastR * 3.4;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Resonant channel filters
      const bandpass1 = ctx.createBiquadFilter();
      bandpass1.type = 'bandpass';
      bandpass1.frequency.value = 520;
      bandpass1.Q.value = 1.3;

      const bandpass2 = ctx.createBiquadFilter();
      bandpass2.type = 'bandpass';
      bandpass2.frequency.value = 1250;
      bandpass2.Q.value = 1.8;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 2400;

      // LFO for natural surges in water current
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.35; // Gentle oscillation every ~3 seconds
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 130; // Modulate bandpass frequency +/- 130Hz
      lfo.connect(lfoGain);
      lfoGain.connect(bandpass1.frequency);

      const gain = ctx.createGain();
      const vol = targetVol ?? getVolumeMultiplier() * 0.85;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.8);

      source.connect(bandpass1);
      source.connect(bandpass2);
      bandpass1.connect(lowpass);
      bandpass2.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      source.start();
      lfo.start();

      continuousSourceRef.current = source;
      continuousGainRef.current = gain;
      continuousLfoRef.current = lfo;

      // Organic random bubble sounds while running water is active
      if (bubbleIntervalRef.current) clearInterval(bubbleIntervalRef.current);
      bubbleIntervalRef.current = window.setInterval(() => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== 'running') return;
        try {
          const osc = ctx.createOscillator();
          const bG = ctx.createGain();
          const f = 400 + Math.random() * 420;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(f * 1.6, ctx.currentTime + 0.07);
          const bVol = (getVolumeMultiplier() * 0.3);
          bG.gain.setValueAtTime(bVol, ctx.currentTime);
          bG.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
          osc.connect(bG);
          bG.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.09);
        } catch {}
      }, 1400);
    } catch {
      // ignore
    }
  };

  const stopContinuousWaterStream = () => {
    if (bubbleIntervalRef.current) {
      clearInterval(bubbleIntervalRef.current);
      bubbleIntervalRef.current = null;
    }
    if (continuousGainRef.current && audioCtxRef.current) {
      try {
        const ctx = audioCtxRef.current;
        continuousGainRef.current.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        setTimeout(() => {
          try {
            continuousSourceRef.current?.stop();
            continuousSourceRef.current?.disconnect();
            continuousSourceRef.current = null;
            continuousLfoRef.current?.stop();
            continuousLfoRef.current?.disconnect();
            continuousLfoRef.current = null;
          } catch {}
        }, 550);
      } catch {}
    }
  };

  // Toggle continuous running water stream
  const toggleContinuousSound = () => {
    if (!continuousSound) {
      setContinuousSound(true);
      startContinuousWaterStream();
      playRunningWaterRush(1.8);
    } else {
      setContinuousSound(false);
      stopContinuousWaterStream();
    }
  };

  // Splashes multiple concentric ripples and plays running water sound
  const triggerSplash = (x?: number, y?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const posX = x ?? canvas.width / 2;
    const posY = y ?? canvas.height / 2;

    playRunningWaterRush(2.2);

    const event = new CustomEvent('app-water-splash', {
      detail: { x: posX, y: posY, count: 4 },
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // State collections
    let ripples: Ripple[] = [];
    const bubbles: Bubble[] = [];

    // Initialize floating bubbles
    const bubbleCount = 28;
    for (let i = 0; i < bubbleCount; i++) {
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 2 + Math.random() * 5.5,
        speedY: 0.4 + Math.random() * 0.8,
        driftX: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.3 + Math.random() * 0.5,
      });
    }

    // Resize listener
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Add ripple helper
    const addRipple = (x: number, y: number, amplitude = 1, speed = 2.4, maxRadius = 140) => {
      if (!isActive) return;
      ripples.push({
        x,
        y,
        radius: 4,
        maxRadius,
        amplitude,
        speed,
        alpha: 1,
        color: Math.random() > 0.3 ? 'rgba(255, 255, 255, ' : 'rgba(120, 240, 255, ',
      });
      if (ripples.length > 50) ripples.shift();
    };

    // Global Pointer interaction listeners
    let lastMoveTime = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      const throttleMs = intensity === 'high' ? 60 : intensity === 'medium' ? 120 : 250;
      if (now - lastMoveTime > throttleMs) {
        lastMoveTime = now;
        addRipple(e.clientX, e.clientY, 0.7, 2.0, 90);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      // Big wave on click or tap
      addRipple(e.clientX, e.clientY, 1.3, 3.2, 170);
      setTimeout(() => addRipple(e.clientX, e.clientY, 0.8, 2.4, 130), 80);
      playWaterDropletSound(600 + Math.random() * 200);
    };

    // Custom splash event listener
    const handleCustomSplash = (e: Event) => {
      const customEvent = e as CustomEvent<{ x: number; y: number; count?: number }>;
      const { x, y, count = 3 } = customEvent.detail;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          addRipple(
            x + (Math.random() - 0.5) * 40,
            y + (Math.random() - 0.5) * 40,
            1.2 - i * 0.2,
            2.8 + i * 0.4,
            180 + i * 30
          );
        }, i * 90);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('app-water-splash', handleCustomSplash as EventListener);

    // Natural ambient water drops interval
    const ambientInterval = setInterval(() => {
      if (isActive && Math.random() > 0.3) {
        const randX = Math.random() * width;
        const randY = Math.random() * height;
        addRipple(randX, randY, 0.75, 2.0, 110);
      }
    }, 2800);

    // Main 60fps render loop
    let time = 0;
    const render = () => {
      time += 0.016;

      // 1. Draw Deep Crystal Turquoise Pool Gradient Base
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#009bb8'); // vibrant crystalline cyan
      grad.addColorStop(0.3, '#00b4d8');
      grad.addColorStop(0.7, '#008ba3');
      grad.addColorStop(1, '#005f73');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Procedural Sunlight Caustic Rays & Dancing Waves (Voronoi Caustic Waves)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const waveCount = 5;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const phase = time * (0.8 + w * 0.2) + w * 1.5;
        const yBase = (height / waveCount) * w + ((time * 20) % (height / waveCount));

        ctx.moveTo(0, yBase);
        const segments = 12;
        const segWidth = width / segments;

        for (let s = 0; s <= segments; s++) {
          const px = s * segWidth;
          const py =
            yBase +
            Math.sin(s * 0.8 + phase) * 18 +
            Math.cos(s * 0.5 + phase * 0.7) * 12;
          ctx.lineTo(px, py);
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + Math.sin(phase) * 0.06})`;
        ctx.lineWidth = 14 + Math.sin(phase) * 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      ctx.restore();

      // 4. Render Active Water Ripples
      if (ripples.length > 0) {
        ctx.save();
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.radius += r.speed;
          r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);

          if (r.alpha <= 0.01) {
            ripples.splice(i, 1);
            continue;
          }

          // Draw Crest (Bright sunlight reflection)
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${r.color}${r.alpha * 0.75 * r.amplitude})`;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Draw Inner Trough (Refraction Shadow)
          if (r.radius > 6) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius - 4, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 78, 100, ${r.alpha * 0.35 * r.amplitude})`;
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }

          // Secondary outer harmonic ring
          if (r.radius > 16) {
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius + 7, 0, Math.PI * 2);
            ctx.strokeStyle = `${r.color}${r.alpha * 0.35 * r.amplitude})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // 5. Render Glistening Rising Micro-Bubbles
      ctx.save();
      for (let b of bubbles) {
        b.y -= b.speedY;
        b.x += Math.sin(time + b.phase) * b.driftX;

        // Reset when reaches top
        if (b.y < -10) {
          b.y = height + 10;
          b.x = Math.random() * width;
        }

        // Draw bubble body
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 252, 255, ${b.alpha * 0.35})`;
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.7})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        // Specular white dot highlight on top-right of bubble
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.9})`;
        ctx.fill();
      }
      ctx.restore();

      // 6. Translucent Ambient Overlay for Readability
      // We apply a soft white/cyan wash so all app content, texts and cards maintain crisp AA contrast!
      ctx.save();
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
      overlayGrad.addColorStop(0, 'rgba(240, 250, 255, 0.45)');
      overlayGrad.addColorStop(0.5, 'rgba(230, 247, 255, 0.40)');
      overlayGrad.addColorStop(1, 'rgba(240, 250, 255, 0.50)');
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearInterval(ambientInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('app-water-splash', handleCustomSplash as EventListener);
    };
  }, [isActive, intensity]);

  // Clean up audio resources ONLY when component unmounts
  useEffect(() => {
    return () => {
      stopContinuousWaterStream();
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  // Sync volume changes to active continuous stream
  useEffect(() => {
    if (continuousSound) {
      startContinuousWaterStream();
    }
  }, [volumeLevel]);

  return (
    <>
      {/* 1. Hardware Accelerated Interactive Water Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0 select-none"
        style={{ touchAction: 'none' }}
      />
    </>
  );
};
