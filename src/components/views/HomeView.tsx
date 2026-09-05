import React, { useState, useRef } from 'react';
import { WaterSystem, UserGuardianProfile, SurveillanceRecord, UserProfileAccount } from '../../types';
import { MainTab } from '../BottomNavigation';
import { ScientistCartoonStage } from '../ScientistCartoonStage';
import { ShowcaseCardAnimation } from '../ShowcaseCardAnimation';
import { ScientistImageModal, ScientistImageModalData } from '../modals/ScientistImageModal';
import { TropicalBgmPlayer } from '../TropicalBgmPlayer';

interface HomeViewProps {
  systems: WaterSystem[];
  guardian: UserGuardianProfile;
  activeAccount?: UserProfileAccount;
  records: SurveillanceRecord[];
  onNavigateTab: (tab: MainTab) => void;
  onSelectSystemForDosage: (sys: WaterSystem) => void;
  onOpenNormative: () => void;
  onOpenCalibrate: () => void;
  onOpenSolutionPrep: () => void;
  onOpenProfileAuth?: (tab?: 'register' | 'login' | 'saved' | 'profile') => void;
  onAddNewSystem?: () => void;
  onOpenDpdCamera?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  systems,
  guardian,
  activeAccount,
  records,
  onNavigateTab,
  onSelectSystemForDosage,
  onOpenNormative,
  onOpenCalibrate,
  onOpenSolutionPrep,
  onOpenProfileAuth,
  onAddNewSystem,
  onOpenDpdCamera,
}) => {
  // Video & Water hero state
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [heroMode, setHeroMode] = useState<'cartoon_animation' | 'photometer' | 'purification' | 'greeting' | 'custom_video'>('photometer');
  const [selectedImageModal, setSelectedImageModal] = useState<ScientistImageModalData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const totalWaterVolume = systems.reduce((acc, s) => acc + s.currentVolumeLiters, 0);
  const activeSystemsCount = systems.filter((s) => s.operationalStatus === 'active').length;
  const alertSystemsCount = systems.filter((s) => s.operationalStatus === 'alert').length;

  const triggerHeroWaterSplash = (e?: React.MouseEvent) => {
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : 260;
    const event = new CustomEvent('app-water-splash', {
      detail: { x, y, count: 5 },
    });
    window.dispatchEvent(event);
  };

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomVideoUrl(url);
      setHeroMode('custom_video');
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-6 pb-28 pt-2">
      {/* 1. HERO BANNER WITH CLORAGUA CARTOON SCIENTIST ANIMATION */}
      <section className="relative w-full rounded-3xl overflow-hidden shadow-[0_16px_40px_-10px_rgba(0,103,125,0.30)] border border-white/60 bg-gradient-to-b from-[#003643] via-[#004e5f] to-[#001f27] text-white">
        {heroMode === 'custom_video' && customVideoUrl ? (
          <div className="relative w-full aspect-video sm:max-h-[520px] overflow-hidden flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              src={customVideoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
              poster="/cloragua_hero.jpg"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {/* Overlay video controls */}
            <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
              <button
                type="button"
                onClick={handleVideoToggle}
                className="text-white hover:text-cyan-300 transition-colors"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleMuteToggle}
                className="text-white hover:text-cyan-300 transition-colors"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setHeroMode('photometer')}
                className="text-white/80 hover:text-white text-[11px] font-hud font-bold transition-colors ml-1"
              >
                Volver a Caricatura
              </button>
            </div>
          </div>
        ) : (
          /* High-Fidelity Animated Cartoon Water Scientist Stage */
          <ScientistCartoonStage
            activeSceneKey={
              heroMode === 'photometer'
                ? 'photometer'
                : heroMode === 'purification'
                ? 'purification'
                : heroMode === 'greeting'
                ? 'greeting'
                : heroMode === 'cartoon_animation'
                ? 'cartoon_classic'
                : 'photometer'
            }
            onSceneChange={(sc) => {
              if (sc === 'cartoon_classic') setHeroMode('cartoon_animation');
              else setHeroMode(sc);
            }}
            onSplashRequest={triggerHeroWaterSplash}
            onOpenDosage={() => onNavigateTab('dosis')}
            onOpenDpdCamera={onOpenDpdCamera}
            className="w-full"
          />
        )}

        {/* Hero Bottom Bar & PROMINENT CLORAGUA TITLE */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#002833]/95 backdrop-blur-md border-t border-cyan-500/20">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center flex-wrap gap-2.5">
              <span className="text-[28px] sm:text-[34px] font-black tracking-tight text-white font-hud bg-gradient-to-r from-white via-cyan-100 to-[#10e7b2] bg-clip-text text-transparent drop-shadow-[0_2px_14px_rgba(0,180,216,0.6)]">
                CLORAGUA
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#10e7b2]/20 border border-[#10e7b2]/60 text-[#10e7b2] font-hud text-[11px] font-extrabold uppercase tracking-wider">
                D.S. 031-2010-SA
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-900/60 text-cyan-200 border border-cyan-500/30 text-[10px] font-hud font-bold">
                Vigilancia & Cloración
              </span>
            </div>
            <p className="text-[12.5px] text-cyan-100/90 max-w-xl leading-relaxed">
              Plataforma guiada paso a paso para cálculo de volumen, dosificación teórica de hipoclorito, control fotométrico de cloro residual libre y emisión de reportes técnicos oficiales.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            {onOpenDpdCamera && (
              <button
                onClick={onOpenDpdCamera}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-200 border border-cyan-400/50 font-hud text-[12px] font-extrabold uppercase shadow-sm active:scale-95 transition-all cursor-pointer"
                type="button"
                title="Abrir Cámara Escáner DPD"
              >
                <span className="material-symbols-outlined text-[18px] text-[#10e7b2]">photo_camera</span>
                <span>Escanear con Cámara DPD</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('dosis')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#10e7b2] hover:opacity-95 text-[#002116] font-hud text-[12px] font-extrabold uppercase shadow-[0_4px_16px_rgba(0,180,216,0.35)] active:scale-95 transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Calcular Dosis Ahora</span>
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CARTOON SCIENTIST COMPANION BANNER */}
      <section className="bg-gradient-to-r from-[#004e5f]/15 via-white to-cyan-50/50 rounded-2xl p-4 sm:p-5 shadow-sm border border-cyan-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#00b4d8] shadow-md shrink-0 bg-[#001f27] group cursor-pointer"
            onClick={() => setHeroMode('greeting')}
            title="Ver imagen de la científica guardiana"
          >
            <img
              src="/cloragua_guardian_greeting.jpg"
              alt="Científica Guardiana CLORAGUA"
              className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#10e7b2] border-2 border-white animate-pulse" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-hud text-[13px] sm:text-[14px] font-extrabold text-[#00677d]">
                Científica Virtual CLORAGUA
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#00b4d8]/15 text-[#0077b6] text-[10px] font-hud font-bold border border-[#00b4d8]/40 uppercase">
                Asistente de Calidad
              </span>
            </div>
            <p className="text-[12px] text-slate-600 mt-1 max-w-xl leading-relaxed">
              «¡Hola, Operador y Guardián del Agua! Te acompaño en la preparación de la solución madre, el cálculo de hipoclorito y la vigilancia sanitaria para garantizar agua 100% segura (0.5 a 2.0 ppm).»
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto flex-wrap">
          {onOpenDpdCamera && (
            <button
              onClick={onOpenDpdCamera}
              className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#10e7b2] text-[#00212b] font-hud text-[11px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 hover:opacity-95"
              type="button"
              title="Abrir escáner con cámara para fotómetro DPD"
            >
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              <span>Cámara DPD</span>
            </button>
          )}
          <button
            onClick={() => onOpenSolutionPrep()}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-white hover:bg-cyan-50/80 text-[#00677d] border border-cyan-200 font-hud text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            <span>Solución Madre</span>
          </button>
          <button
            onClick={() => onOpenCalibrate()}
            className="flex-1 md:flex-none px-3.5 py-2 rounded-xl bg-[#00677d] hover:bg-[#005263] text-white font-hud text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Calibrar Gotero</span>
          </button>
        </div>
      </section>

      {/* TROPICAL BGM SYNTHESIZER (WEB AUDIO EN TIEMPO REAL) */}
      <section className="w-full">
        <TropicalBgmPlayer />
      </section>

      {/* 3 IMAGES SHOWCASE: LABORATORIO & OPERACIONES DE LA CIENTÍFICA CLORAGUA */}
      <section className="flex flex-col gap-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00b4d8] to-[#00677d] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">science</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[16px] text-[#151d22] font-hud">
                Laboratorio & Operaciones de la Científica CLORAGUA
              </h2>
              <p className="text-[11.5px] text-[#3d494d]">
                Inspección fotométrica in situ, dosificación continua en reservorios y vigilancia sanitaria
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-cyan-100/70 text-[#00677d] font-hud text-[10px] font-extrabold uppercase tracking-wide">
            3 Módulos de Operación
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Fotómetro Digital DPD con Animación Loop y Burbujas */}
          <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-[#bcc9ce]/40 hover:border-[#00b4d8] transition-all flex flex-col justify-between">
            <ShowcaseCardAnimation
              scene="photometer"
              title="Control Fotométrico Digital"
              badgeText="0.50 - 2.00 PPM"
              badgeGradient="bg-gradient-to-r from-pink-500 to-rose-600"
              onOpenModal={() =>
                setSelectedImageModal({
                  title: 'Medición Fotométrica & Reactivo DPD',
                  subtitle: 'Fotómetro Digital Portátil (0.50 - 2.00 ppm)',
                  desc: 'Inspección óptica de precisión con tubo de ensayo y reactivo DPD en polvo. La reacción cromática rosada cuantifica el cloro residual libre activo protegiendo la salud comunitaria.',
                  url: '/cloragua_photometer_chemist.jpg',
                  badge: 'FOTÓMETRO DPD',
                  modeKey: 'photometer',
                })
              }
              onSetBanner={() => {
                setHeroMode('photometer');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[#00677d]">
                  <span className="material-symbols-outlined text-[16px]">biotech</span>
                  <span className="text-[11px] font-hud font-extrabold uppercase">Análisis Colorimétrico</span>
                </div>
                <h3 className="font-extrabold text-[15px] text-[#151d22] mt-0.5 group-hover:text-[#00677d] transition-colors">
                  Control Fotométrico Digital
                </h3>
                <p className="text-[12px] text-[#3d494d] mt-1 leading-relaxed">
                  Lectura directa en pantalla de cloro libre residual (mg/L). Previene sub-cloración y exceso organoléptico.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#edf5fc]">
                <button
                  type="button"
                  onClick={() => onNavigateTab('hud')}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#0077b6] text-white font-hud text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">sensors</span>
                  <span>Bio-Telemetría</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageModal({
                      title: 'Medición Fotométrica & Reactivo DPD',
                      subtitle: 'Fotómetro Digital Portátil (0.50 - 2.00 ppm)',
                      desc: 'Inspección óptica de precisión con tubo de ensayo y reactivo DPD en polvo. La reacción cromática rosada cuantifica el cloro residual libre activo protegiendo la salud comunitaria.',
                      url: '/cloragua_photometer_chemist.jpg',
                      badge: 'FOTÓMETRO DPD',
                      modeKey: 'photometer',
                    })
                  }
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                  title="Ampliar imagen"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Columna de Purificación y Dosificación con Animación Loop y Burbujas */}
          <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-[#bcc9ce]/40 hover:border-[#00b4d8] transition-all flex flex-col justify-between">
            <ShowcaseCardAnimation
              scene="purification"
              title="Purificación & Cloración Continua"
              badgeText="FLUJO CONSTANTE"
              badgeGradient="bg-gradient-to-r from-[#00b4d8] to-[#0077b6]"
              onOpenModal={() =>
                setSelectedImageModal({
                  title: 'Purificación & Dosificación Continua',
                  subtitle: 'Columna de Cloración & Muestreo In Situ',
                  desc: 'Columna de contacto hidrostático y dosificador de hipoclorito a flujo constante por goteo calibrado. Asegura desinfección homogénea de reservorios y redes comunitarias.',
                  url: '/cloragua_purification_column.jpg',
                  badge: 'COLUMNA DE FLUJO',
                  modeKey: 'purification',
                })
              }
              onSetBanner={() => {
                setHeroMode('purification');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[#00677d]">
                  <span className="material-symbols-outlined text-[16px]">water</span>
                  <span className="text-[11px] font-hud font-extrabold uppercase">Desinfección Hídrica</span>
                </div>
                <h3 className="font-extrabold text-[15px] text-[#151d22] mt-0.5 group-hover:text-[#00677d] transition-colors">
                  Purificación & Cloración Continua
                </h3>
                <p className="text-[12px] text-[#3d494d] mt-1 leading-relaxed">
                  Calibración de goteros y carga de hipoclorito en tanque de solución madre para desinfección permanente.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#edf5fc]">
                <button
                  type="button"
                  onClick={() => onNavigateTab('dosis')}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00677d] text-white font-hud text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">calculate</span>
                  <span>Calcular Dosis</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageModal({
                      title: 'Purificación & Dosificación Continua',
                      subtitle: 'Columna de Cloración & Muestreo In Situ',
                      desc: 'Columna de contacto hidrostático y dosificador de hipoclorito a flujo constante por goteo calibrado. Asegura desinfección homogénea de reservorios y redes comunitarias.',
                      url: '/cloragua_purification_column.jpg',
                      badge: 'COLUMNA DE FLUJO',
                      modeKey: 'purification',
                    })
                  }
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                  title="Ampliar imagen"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Guardiana y Asistente Científica con Animación Loop y Burbujas */}
          <div className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-[#bcc9ce]/40 hover:border-[#00b4d8] transition-all flex flex-col justify-between">
            <ShowcaseCardAnimation
              scene="greeting"
              title="Guardián de Agua Segura"
              badgeText="ASISTENTE OFICIAL"
              badgeGradient="bg-gradient-to-r from-emerald-500 to-teal-600"
              onOpenModal={() =>
                setSelectedImageModal({
                  title: 'Guardián & Asistente Científica',
                  subtitle: 'Vigilancia Sanitaria Oficial D.S. 031-2010-SA',
                  desc: 'Supervisión técnica paso a paso para operadores comunales JASS: fórmulas normativas de hipoclorito de calcio (65-70%) y sodio, tiempo de contacto y registro de bitácora.',
                  url: '/cloragua_guardian_greeting.jpg',
                  badge: 'CIENTÍFICA VIRTUAL',
                  modeKey: 'greeting',
                })
              }
              onSetBanner={() => {
                setHeroMode('greeting');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-[#00677d]">
                  <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  <span className="text-[11px] font-hud font-extrabold uppercase">Acompañamiento JASS</span>
                </div>
                <h3 className="font-extrabold text-[15px] text-[#151d22] mt-0.5 group-hover:text-[#00677d] transition-colors">
                  Guardián de Agua Segura
                </h3>
                <p className="text-[12px] text-[#3d494d] mt-1 leading-relaxed">
                  Asistente inteligente para la preparación exacta de soluciones, aforo de fuentes y certificación en bitácora.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#edf5fc]">
                <button
                  type="button"
                  onClick={() => onOpenSolutionPrep()}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-hud text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[15px]">science</span>
                  <span>Solución Madre</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageModal({
                      title: 'Guardián & Asistente Científica',
                      subtitle: 'Vigilancia Sanitaria Oficial D.S. 031-2010-SA',
                      desc: 'Supervisión técnica paso a paso para operadores comunales JASS: fórmulas normativas de hipoclorito de calcio (65-70%) y sodio, tiempo de contacto y registro de bitácora.',
                      url: '/cloragua_guardian_greeting.jpg',
                      badge: 'CIENTÍFICA VIRTUAL',
                      modeKey: 'greeting',
                    })
                  }
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                  title="Ampliar imagen"
                >
                  <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OPERATOR PROFILE & REGISTRATION BAR */}
      <section className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#00b4d8] to-[#00677d] text-white flex items-center justify-center font-hud text-[18px] font-black shadow-md shrink-0">
            {activeAccount?.fullName ? activeAccount.fullName.charAt(0).toUpperCase() : 'O'}
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14px] font-bold text-[#151d22]">
                {activeAccount?.fullName || 'Operador Titular'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#10e7b2]/20 text-[#00677d] border border-[#10e7b2]/50 text-[10px] font-hud font-extrabold uppercase">
                {activeAccount?.roleLabel || 'Operador JASS'}
              </span>
              <span className="text-[11px] font-hud font-bold text-[#00677d]">
                {activeAccount?.dni ? `DNI: ${activeAccount.dni}` : guardian.title}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span>{activeAccount?.email || 'operador@cloragua.pe'}</span>
              <span>•</span>
              <span className="truncate max-w-[200px] sm:max-w-xs">{activeAccount?.organization || 'JASS Comunidad'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onOpenProfileAuth?.('register')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00677d] hover:opacity-95 text-white font-hud text-[11px] font-extrabold uppercase shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Registrar Perfil</span>
          </button>

          <button
            onClick={() => onOpenProfileAuth?.('saved')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#edf5fc] hover:bg-[#e1e9f0] text-[#00677d] border border-[#bcc9ce]/40 font-hud text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">switch_account</span>
            <span>Cambiar Cuenta</span>
          </button>
        </div>
      </section>

      {/* 2. REAL-TIME NATIONAL MONITORING SUMMARY (KPI CARDS) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/30 flex flex-col gap-1">
          <span className="text-[10px] font-hud text-[#3d494d] uppercase font-bold">
            Sistemas Monitoreados
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-hud text-[24px] font-extrabold text-[#00677d]">
              {systems.length}
            </span>
            <span className="text-[11px] text-[#006c51] font-bold">
              ({activeSystemsCount} activos)
            </span>
          </div>
          <span className="text-[10px] text-[#3d494d]">Reservorios y redes activas</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/30 flex flex-col gap-1">
          <span className="text-[10px] font-hud text-[#3d494d] uppercase font-bold">
            Volumen Total Almacenado
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-hud text-[24px] font-extrabold text-[#151d22]">
              {Math.round(totalWaterVolume / 1000).toLocaleString('es-PE')}
            </span>
            <span className="text-[11px] font-hud text-[#00677d] font-bold">m³</span>
          </div>
          <span className="text-[10px] text-[#3d494d]">
            {totalWaterVolume.toLocaleString('es-PE')} Litros en custodia
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/30 flex flex-col gap-1">
          <span className="text-[10px] font-hud text-[#3d494d] uppercase font-bold">
            Eventos en Bitácora
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-hud text-[24px] font-extrabold text-[#006c51]">
              {records.length}
            </span>
            <span className="text-[11px] text-[#006c51] font-bold">certificados</span>
          </div>
          <span className="text-[10px] text-[#3d494d]">Historial legal inmutable</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/30 flex flex-col gap-1">
          <span className="text-[10px] font-hud text-[#3d494d] uppercase font-bold">
            Estado de Seguridad
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-hud text-[24px] font-extrabold ${
                alertSystemsCount > 0 ? 'text-[#ba1a1a]' : 'text-[#006c51]'
              }`}
            >
              {alertSystemsCount === 0 ? '100%' : `${systems.length - alertSystemsCount}/${systems.length}`}
            </span>
          </div>
          <span className="text-[10px] text-[#3d494d]">
            {alertSystemsCount === 0 ? 'Todos con cloro conforme' : `${alertSystemsCount} en alerta`}
          </span>
        </div>
      </section>

      {/* 3. FUNCTIONAL APPLICATION MODULES (INTERACTIVE WORKSPACES) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00677d] text-[20px]">widgets</span>
            <h2 className="font-extrabold text-[16px] text-[#151d22]">
              Hojas Funcionales y Módulos de Operación
            </h2>
          </div>
          <span className="text-[11px] text-[#3d494d]">
            Navegue directamente a cualquier herramienta
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Module 1: Dosifier Wizard (PASO 1 AL 7) */}
          <div
            onClick={() => onNavigateTab('dosis')}
            className="group bg-white rounded-3xl p-5 shadow-sm border border-[#bcc9ce]/30 hover:border-[#00b4d8] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00b4d8] to-[#00677d] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[26px]">science</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[16px] text-[#151d22] group-hover:text-[#00677d] transition-colors">
                      Asistente de Dosificación
                    </h3>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#caf300]/40 text-[#334000] border border-[#caf300]">
                      7 PASOS
                    </span>
                  </div>
                  <p className="text-[12px] text-[#3d494d] mt-0.5">
                    Guía estructurada: Tanque → Volumen Real → Producto de Cloro → Cloro Residual → Dosificación → Verificación → Bitácora.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#edf5fc] text-[11px]">
              <span className="text-[#006c51] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Modo Estándar y Técnico Continuo
              </span>
              <span className="text-[#00677d] font-hud font-bold uppercase flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <span>Abrir Asistente</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Module 2: Bio-Telemetry HUD & Photometer */}
          <div
            onClick={() => onNavigateTab('hud')}
            className="group bg-white rounded-3xl p-5 shadow-sm border border-[#bcc9ce]/30 hover:border-[#00b4d8] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10e7b2] to-[#006c51] text-[#002116] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[26px]">grid_view</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[16px] text-[#151d22] group-hover:text-[#00677d] transition-colors">
                      Bio-Telemetría HUD
                    </h3>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#43fec7]/30 text-[#00513c]">
                      DPD-X1
                    </span>
                  </div>
                  <p className="text-[12px] text-[#3d494d] mt-0.5">
                    Escáner óptico fotométrico con 5 viales reactivos DPD in situ, telemetría multiparámetro (pH, turbiedad, temperatura y ORP).
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#edf5fc] text-[11px]">
              <span className="text-[#00677d] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">sensors</span>
                Lectura Instantánea de Grifo
              </span>
              <span className="text-[#00677d] font-hud font-bold uppercase flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <span>Ver Pantalla HUD</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Module 3: Systems Management (SISTEMAS) */}
          <div
            onClick={() => onNavigateTab('sistemas')}
            className="group bg-white rounded-3xl p-5 shadow-sm border border-[#bcc9ce]/30 hover:border-[#00b4d8] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00677d] to-[#003643] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[26px]">water</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[16px] text-[#151d22] group-hover:text-[#00677d] transition-colors">
                      Red de Sistemas y Reservorios
                    </h3>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#edf5fc] text-[#00677d]">
                      {systems.length} FUENTES
                    </span>
                  </div>
                  <p className="text-[12px] text-[#3d494d] mt-0.5">
                    Inventario de reservorios apoyados, tanques elevados, pozos y cisternas. Alta de nuevas fuentes y control operativo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#edf5fc] text-[11px]">
              <span className="text-[#3d494d] font-bold">
                Urbano (EPS) y Rural (JASS / ATM)
              </span>
              <span className="text-[#00677d] font-hud font-bold uppercase flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <span>Gestionar Sistemas</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>

          {/* Module 4: Official Surveillance Records & PDF (REGISTRO) */}
          <div
            onClick={() => onNavigateTab('registro')}
            className="group bg-white rounded-3xl p-5 shadow-sm border border-[#bcc9ce]/30 hover:border-[#00b4d8] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#93b100] to-[#607600] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[26px]">description</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-[16px] text-[#151d22] group-hover:text-[#00677d] transition-colors">
                      Bitácora Oficial & Reportes PDF
                    </h3>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#caf300]/40 text-[#334000]">
                      PDF / CSV
                    </span>
                  </div>
                  <p className="text-[12px] text-[#3d494d] mt-0.5">
                    Historial inmutable de cloración, análisis de tendencias y generación de reportes técnicos oficiales para DIGESA/DIRESA.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#edf5fc] text-[11px]">
              <span className="text-[#006c51] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                Exportación con Sellos y Firmas
              </span>
              <span className="text-[#00677d] font-hud font-bold uppercase flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                <span>Ver Bitácora</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COMPLEMENTARY TECHNICAL UTILITIES */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-[#bcc9ce]/30 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#00b4d8]/15 text-[#00677d] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">build_circle</span>
            </div>
            <div>
              <h3 className="font-extrabold text-[15px] text-[#151d22]">
                Herramientas Técnicas Auxiliares
              </h3>
              <span className="text-[11px] text-[#3d494d]">
                Módulos de apoyo para preparación de reactivos y aforo de bombas
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Tool A: Dilution / Mother Solution */}
          <button
            onClick={onOpenSolutionPrep}
            className="p-3.5 rounded-2xl bg-[#edf5fc] hover:bg-[#e1e9f0] border border-[#bcc9ce]/30 text-left flex flex-col gap-1 transition-all cursor-pointer"
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-[#00677d] text-[22px]">science</span>
              <span className="text-[10px] font-hud font-bold text-[#00677d] uppercase">C₁·V₁ = C₂·V₂</span>
            </div>
            <div className="font-bold text-[13px] text-[#151d22] mt-1">Preparación Solución Madre</div>
            <p className="text-[11px] text-[#3d494d]">
              Tanques de 100L a 1000L con tiempo de sedimentación para hipoclorito de calcio.
            </p>
          </button>

          {/* Tool B: Pump Calibration */}
          <button
            onClick={onOpenCalibrate}
            className="p-3.5 rounded-2xl bg-[#edf5fc] hover:bg-[#e1e9f0] border border-[#bcc9ce]/30 text-left flex flex-col gap-1 transition-all cursor-pointer"
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-[#006c51] text-[22px]">tune</span>
              <span className="text-[10px] font-hud font-bold text-[#006c51] uppercase">Aforo 60s</span>
            </div>
            <div className="font-bold text-[13px] text-[#151d22] mt-1">Calibración de Dosificador</div>
            <p className="text-[11px] text-[#3d494d]">
              Prueba con probeta graduada, cronómetro integrado y recomendación de ajuste.
            </p>
          </button>

          {/* Tool C: Normative Reference */}
          <button
            onClick={onOpenNormative}
            className="p-3.5 rounded-2xl bg-[#edf5fc] hover:bg-[#e1e9f0] border border-[#bcc9ce]/30 text-left flex flex-col gap-1 transition-all cursor-pointer"
            type="button"
          >
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-[#93b100] text-[22px]">menu_book</span>
              <span className="text-[10px] font-hud font-bold text-[#607600] uppercase">MINSA / DIGESA</span>
            </div>
            <div className="font-bold text-[13px] text-[#151d22] mt-1">Guía D.S. N.° 031-2010-SA</div>
            <p className="text-[11px] text-[#3d494d]">
              Límites Máximos Permisibles (LMP), protocolo de muestreo y bioseguridad EPP.
            </p>
          </button>
        </div>
      </section>

      {/* 5. QUICK ACCESS: ACTIVE RESERVOIRS FOR DIRECT ACTION */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-[#bcc9ce]/30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00677d] text-[20px]">water_damage</span>
            <h3 className="font-extrabold text-[15px] text-[#151d22]">
              Reservorios con Prioridad de Atención
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onAddNewSystem && (
              <button
                onClick={onAddNewSystem}
                className="text-[11px] font-hud font-bold text-[#00677d] hover:bg-[#edf5fc] px-2.5 py-1 rounded-full border border-[#00677d]/30 flex items-center gap-1 cursor-pointer transition-colors"
                type="button"
                title="Registrar nuevo sistema de agua"
              >
                <span className="material-symbols-outlined text-[15px]">add_circle</span>
                <span>+ Nuevo Sistema</span>
              </button>
            )}
            <button
              onClick={() => onNavigateTab('sistemas')}
              className="text-[11px] font-hud font-bold text-[#00677d] hover:underline cursor-pointer"
              type="button"
            >
              Ver todos ({systems.length}) →
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#edf5fc]">
          {systems.slice(0, 3).map((sys) => {
            const isAlert = sys.operationalStatus === 'alert';
            return (
              <div key={sys.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-hud text-[12px] font-bold ${
                      isAlert
                        ? 'bg-[#ffdad6] text-[#ba1a1a]'
                        : 'bg-[#43fec7]/30 text-[#00513c]'
                    }`}
                  >
                    {sys.lastChlorinePpm.toFixed(1)}
                  </div>
                  <div>
                    <div className="font-bold text-[13px] text-[#151d22]">{sys.name}</div>
                    <div className="text-[11px] text-[#3d494d]">
                      {sys.centerPoblado} • {sys.capacityLiters.toLocaleString('es-PE')} L • {sys.responsible}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelectSystemForDosage(sys)}
                  className="px-3 py-1.5 rounded-full bg-[#00b4d8] hover:bg-[#00677d] text-white font-hud text-[10px] font-bold uppercase transition-all shadow-sm cursor-pointer"
                  type="button"
                >
                  Dosificar
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. FULL-SCREEN IMAGE LIGHTBOX MODAL WITH 100% UNCLIPPED IMAGE & BUBBLE LOOP */}
      <ScientistImageModal
        data={selectedImageModal}
        onClose={() => setSelectedImageModal(null)}
        onSetBanner={(mode) => {
          setHeroMode(mode);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};
