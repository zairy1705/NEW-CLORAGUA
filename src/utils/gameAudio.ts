/**
 * Video Game Sound Engine (Retro 8-Bit / Arcade Web Audio Synthesizer)
 * Synthesizes zero-latency retro video game sound effects using the Web Audio API.
 * Automatically intercepts button interactions to play classic arcade sound effects.
 */

class GameSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Check localStorage preference, default to true (sound enabled)
    try {
      const saved = localStorage.getItem('cloragua_game_sound_enabled');
      if (saved !== null) {
        this.isMuted = saved === 'false';
      }
    } catch {
      this.isMuted = false;
    }
  }

  /**
   * Safe getter for Web Audio Context with auto-resume
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('cloragua_game_sound_enabled', String(!muted));
    } catch {}
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleSound(): boolean {
    this.setMuted(!this.isMuted);
    if (!this.isMuted) {
      this.playCoin();
    }
    return !this.isMuted;
  }

  /**
   * Sound 1: Classic Arcade Coin / Crystal Pickup
   * Iconic dual-frequency arpeggio (B5 -> E6)
   */
  public playCoin(pitchVariance = 0.05, volume = 0.18): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const variation = 1 + (Math.random() - 0.5) * pitchVariance;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Vintage square wave gives that iconic Nintendo/Arcade game feel
      osc.type = 'square';

      // First note: B5 (~987 Hz)
      osc.frequency.setValueAtTime(987.77 * variation, now);
      // Second note: E6 (~1318 Hz) after 75ms
      osc.frequency.setValueAtTime(1318.51 * variation, now + 0.075);

      // Volume envelope: snappy arcade attack and soft decay
      gain.gain.setValueAtTime(volume, now);
      gain.gain.setValueAtTime(volume, now + 0.075);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      // Lowpass filter to smooth harsh harmonics slightly
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(4500, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.33);
    } catch {
      // Best effort audio playback
    }
  }

  /**
   * Sound 2: 8-Bit Laser / Action Blip
   * Rapid downwards frequency slide
   */
  public playBlip(pitchVariance = 0.1, volume = 0.16): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const variation = 1 + (Math.random() - 0.5) * pitchVariance;
      const baseFreq = 880 * variation;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  /**
   * Sound 3: Retro Jump / Spring Sound
   * Upward frequency glide with snappy decay
   */
  public playJump(volume = 0.15): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  /**
   * Sound 4: Power-Up / Level-Up Major Arpeggio
   */
  public playPowerUp(volume = 0.16): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);

        gain.gain.setValueAtTime(volume, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.055 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.19);
      });
    } catch {}
  }

  /**
   * Sound 5: Arcade Select / Menu Navigation Click
   * Crisp, high-tech video game menu tick
   */
  public playMenuSelect(volume = 0.14): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Crisp 1400 Hz arcade confirmation blip with quick octave slide
      osc.frequency.setValueAtTime(900 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.04);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  /**
   * Sound 6: Subtle Hover Chirp (when cursor hovers on buttons)
   */
  public playHoverChirp(volume = 0.04): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + Math.random() * 150, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.025);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /**
   * Global video game sound dispatcher for clicks
   * Chooses the best video game sound depending on context or button role
   */
  public playRandomVideoGameSound(targetElement?: Element | null): void {
    if (this.isMuted) return;

    // Check element text or attributes for context
    const text = (targetElement?.textContent || '').toLowerCase();
    const isSpecialAction =
      text.includes('calcular') ||
      text.includes('guardar') ||
      text.includes('completar') ||
      text.includes('registrar') ||
      text.includes('dosis');

    if (isSpecialAction) {
      // Iconic coin / crystal reward
      this.playCoin(0.08, 0.2);
    } else if (text.includes('saludar') || text.includes('subir') || text.includes('siguiente')) {
      this.playJump(0.16);
    } else {
      // Crisp 8-bit arcade click
      const r = Math.random();
      if (r < 0.45) {
        this.playCoin(0.12, 0.16);
      } else if (r < 0.75) {
        this.playMenuSelect(0.18);
      } else {
        this.playBlip(0.1, 0.16);
      }
    }
  }

  /**
   * Setup global DOM event listeners for buttons
   */
  public setupGlobalListeners(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Helper to find clickable button target
    const findButtonTarget = (el: EventTarget | null): HTMLElement | null => {
      let curr = el as HTMLElement | null;
      let depth = 0;
      while (curr && depth < 6 && curr !== document.body) {
        if (
          curr.tagName === 'BUTTON' ||
          curr.getAttribute('role') === 'button' ||
          curr.classList?.contains('btn') ||
          (curr.tagName === 'A' && curr.getAttribute('href')) ||
          (curr.tagName === 'INPUT' &&
            (curr.getAttribute('type') === 'button' ||
              curr.getAttribute('type') === 'submit' ||
              curr.getAttribute('type') === 'checkbox' ||
              curr.getAttribute('type') === 'radio'))
        ) {
          return curr;
        }
        curr = curr.parentElement;
        depth++;
      }
      return null;
    };

    // 1. Pointerdown/Click: Play retro video game sound!
    window.addEventListener(
      'pointerdown',
      (e: PointerEvent) => {
        // Unlock audio context on interaction
        this.getContext();

        const btn = findButtonTarget(e.target);
        if (btn) {
          // Play video game sound immediately
          this.playRandomVideoGameSound(btn);
        }
      },
      { capture: true, passive: true }
    );

    // 2. Mouseenter: Optional delicate arcade tick on hover
    let lastHoverTime = 0;
    window.addEventListener(
      'mouseover',
      (e: MouseEvent) => {
        const now = Date.now();
        // Debounce hover ticks so rapid movements across nested elements feel pleasant
        if (now - lastHoverTime < 80) return;

        const btn = findButtonTarget(e.target);
        if (btn) {
          lastHoverTime = now;
          this.playHoverChirp(0.03);
        }
      },
      { capture: true, passive: true }
    );
  }
}

export const gameSoundEngine = new GameSoundEngine();
