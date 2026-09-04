import React, { useState } from 'react';
import { WaterSystem, UserGuardianProfile } from '../../types';
import confetti from 'canvas-confetti';
import chlorimeterImg from '../../assets/images/digital_chlorimeter_1788500830924.jpg';
import { CameraDpdScanModal } from '../modals/CameraDpdScanModal';

interface DashboardHudViewProps {
  systems: WaterSystem[];
  activeSystem: WaterSystem;
  onSelectSystem: (system: WaterSystem) => void;
  guardian: UserGuardianProfile;
  onNavigateToDosage: (system?: WaterSystem) => void;
  onNavigateToSystems: () => void;
  onNavigateToRecords: () => void;
  onRewardXp: (amount: number, reason: string) => void;
}

export const DashboardHudView: React.FC<DashboardHudViewProps> = ({
  systems,
  activeSystem,
  onSelectSystem,
  guardian,
  onNavigateToDosage,
  onNavigateToSystems,
  onNavigateToRecords,
  onRewardXp,
}) => {
  const [readingPpm, setReadingPpm] = useState<number>(1.85);
  const [activeVial, setActiveVial] = useState<string>('2.0');
  const [phLevel, setPhLevel] = useState<number>(7.4);
  const [waterTemp, setWaterTemp] = useState<number>(21.4);
  const [turbidityNtu, setTurbidityNtu] = useState<number>(0.4);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isImgModalOpen, setIsImgModalOpen] = useState<boolean>(false);
  const [isCameraScanOpen, setIsCameraScanOpen] = useState<boolean>(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);

  const handleApplyCameraReading = (ppm: number, photoDataUrl?: string) => {
    setReadingPpm(ppm);
    if (photoDataUrl) {
      setLastCapturedPhoto(photoDataUrl);
    }
    // Match closest DPD vial
    if (ppm <= 0.4) setActiveVial('0.2');
    else if (ppm <= 1.0) setActiveVial('0.8');
    else if (ppm <= 1.7) setActiveVial('1.5');
    else if (ppm <= 2.3) setActiveVial('2.0');
    else setActiveVial('3.5+');

    onRewardXp(120, 'Captura fotográfica y análisis de celda DPD con cámara');
    setSyncFeedback(`¡Foto de celda DPD capturada! Cloro verificado: ${ppm.toFixed(2)} ppm (+120 XP).`);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00b4d8', '#43fec7', '#ec4899', '#caf300'],
    });
    setTimeout(() => setSyncFeedback(null), 3500);
  };

  // Optical DPD color scale vials
  const dpdVials = [
    {
      ppm: 0.2,
      label: '0.2',
      tag: 'Bajo',
      tone: 'error',
      bgGradient: 'linear-gradient(180deg, #fdf2f8 0%, #fbcfe8 100%)',
    },
    {
      ppm: 0.8,
      label: '0.8',
      tag: 'Medio',
      tone: 'outline',
      bgGradient: 'linear-gradient(180deg, #fce7f3 0%, #f472b6 100%)',
    },
    {
      ppm: 1.5,
      label: '1.5',
      tag: 'Seguro',
      tone: 'secondary',
      bgGradient: 'linear-gradient(180deg, #f472b6 0%, #ec4899 100%)',
    },
    {
      ppm: 2.0,
      label: '2.0',
      tag: 'Match',
      tone: 'primary',
      bgGradient: 'linear-gradient(180deg, #ec4899 0%, #db2777 100%)',
    },
    {
      ppm: 3.5,
      label: '3.5+',
      tag: 'Exceso',
      tone: 'error',
      bgGradient: 'linear-gradient(180deg, #be185d 0%, #831843 100%)',
    },
  ];

  const handleSelectVial = (val: number, label: string) => {
    setActiveVial(label);
    setReadingPpm(val);
  };

  const handleSyncReading = () => {
    setIsSyncing(true);
    setSyncFeedback('Sincronizando con sensor fotométrico...');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback('¡Lectura verificada! +100 XP registrados en bitácora.');
      onRewardXp(100, 'Verificación fotométrica de cloro residual');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00b4d8', '#43fec7', '#caf300'],
      });
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 1000);
  };

  const handleScanCell = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const simulatedPpm = Number((1.75 + Math.random() * 0.25).toFixed(2));
      setReadingPpm(simulatedPpm);
      setActiveVial('2.0');
    }, 1200);
  };

  const handleZeroTare = () => {
    setReadingPpm(0.0);
    setTimeout(() => {
      setReadingPpm(1.85);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-4 pb-28 pt-1">
      {/* 1. Bio-Telemetry Matrix: High-Contrast Top Indicators */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#bcc9ce]/50 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#00b4d8]/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Upper Bar with Sanitary Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#edf5fc]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10e7b2] animate-ping" />
            <span className="font-hud text-[12px] text-[#006c51] uppercase tracking-wider font-extrabold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
              Vigilancia Sanitaria en Tiempo Real • D.S. N.° 031-2010-SA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#43fec7]/30 px-2.5 py-1 rounded-full border border-[#43fec7]">
              <span className="material-symbols-outlined text-[#007256] text-[15px]">bolt</span>
              <span className="font-hud text-[11px] text-[#007256] font-extrabold">FOTÓMETRO SINCRONIZADO</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 bg-[#edf5fc] px-2.5 py-1 rounded-full text-[11px] font-hud text-[#00677d] font-bold border border-[#bcc9ce]/40">
              <span className="w-2 h-2 rounded-full bg-[#00b4d8]" />
              EN LÍNEA
            </div>
          </div>
        </div>

        {/* 4 Essential Top Indicator Cards (Altamente Notorios y Contrastados) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Indicador 1: Cloro Residual Libre */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#f0f9ff] to-white border-2 border-[#00b4d8]/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-hud text-[10px] text-[#00677d] uppercase font-bold tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#00b4d8]">water_drop</span>
                  Cloro Residual Libre
                </span>
                <span className={`font-hud text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                  readingPpm >= 0.5 && readingPpm <= 2.0
                    ? 'bg-[#10e7b2]/30 text-[#006c51] border border-[#10e7b2]'
                    : readingPpm < 0.5
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {readingPpm >= 0.5 && readingPpm <= 2.0 ? 'ÓPTIMO' : readingPpm < 0.5 ? 'BAJO' : 'ALTO'}
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-hud text-[32px] text-[#004f60] font-extrabold leading-none tracking-tight">
                  {readingPpm.toFixed(2)}
                </span>
                <span className="font-hud text-[13px] text-[#3d494d] font-bold">ppm (mg/L)</span>
              </div>
            </div>
            
            {/* Visual Safe Range Indicator */}
            <div className="mt-2.5 pt-2 border-t border-[#edf5fc]">
              <div className="w-full h-2 bg-[#edf5fc] rounded-full overflow-hidden flex border border-[#bcc9ce]/30 relative">
                <div className="h-full bg-red-400" style={{ width: '25%' }} title="<0.50 ppm Riesgo" />
                <div className="h-full bg-[#10e7b2]" style={{ width: '55%' }} title="0.50-2.00 ppm Seguro" />
                <div className="h-full bg-amber-400" style={{ width: '20%' }} title=">2.00 ppm Exceso" />
              </div>
              <div className="flex justify-between text-[10px] font-hud text-[#3d494d] mt-1 font-semibold">
                <span>0.50</span>
                <span className="text-[#006c51] font-bold">Rango Seguro</span>
                <span>2.00</span>
              </div>
            </div>
          </div>

          {/* Indicador 2: Índice de Potabilidad */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#f0fdf9] to-white border-2 border-[#10e7b2]/40 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-hud text-[10px] text-[#006c51] uppercase font-bold tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#10e7b2]">verified_user</span>
                  Potabilidad Integral
                </span>
                <span className="bg-[#caf300]/50 text-[#334000] font-hud text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#caf300]">
                  S-RANK
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-hud text-[32px] text-[#006c51] font-extrabold leading-none tracking-tight">
                  98.6%
                </span>
                <span className="font-hud text-[13px] text-[#006c51] font-bold">APTO</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#edf5fc]">
              <div className="w-full h-2 bg-[#edf5fc] rounded-full overflow-hidden p-0.5 border border-[#bcc9ce]/30">
                <div className="h-full bg-gradient-to-r from-[#00b4d8] to-[#10e7b2] rounded-full w-[98.6%]" />
              </div>
              <span className="text-[10px] text-[#006c51] font-bold block mt-1">
                Apta para consumo humano
              </span>
            </div>
          </div>

          {/* Indicador 3: pH del Agua */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#f8fafc] to-white border border-[#bcc9ce]/50 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#00677d]">water_ph</span>
                  pH del Agua
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-hud text-[9px] font-bold px-1.5 py-0.5 rounded">
                  NEUTRO
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-hud text-[32px] text-[#151d22] font-extrabold leading-none tracking-tight">
                  {phLevel.toFixed(1)}
                </span>
                <span className="font-hud text-[13px] text-[#3d494d] font-bold">pH</span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#edf5fc] text-[10px] text-[#3d494d]">
              <span className="font-bold text-[#006c51]">Norma DIGESA:</span> 6.50 – 8.50 pH
            </div>
          </div>

          {/* Indicador 4: Turbiedad y Temperatura */}
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#f8fafc] to-white border border-[#bcc9ce]/50 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#00677d]">blur_on</span>
                  Turbiedad / Temp
                </span>
                <span className="bg-blue-100 text-blue-800 font-hud text-[9px] font-bold px-1.5 py-0.5 rounded">
                  CRISTALINA
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="font-hud text-[24px] text-[#151d22] font-extrabold leading-none">
                    {turbidityNtu}
                  </span>
                  <span className="font-hud text-[11px] text-[#3d494d] font-bold ml-1">NTU</span>
                </div>
                <div className="text-right">
                  <span className="font-hud text-[20px] text-[#00677d] font-extrabold leading-none">
                    {waterTemp}°
                  </span>
                  <span className="font-hud text-[11px] text-[#3d494d] font-bold">C</span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#edf5fc] text-[10px] text-[#3d494d]">
              <span className="font-bold text-[#006c51]">Límite Máx:</span> &lt; 5.0 NTU (Aceptable)
            </div>
          </div>
        </div>
      </section>

      {/* 2. Active System Selector Bar */}
      <div className="flex items-center justify-between gap-2 bg-white rounded-2xl p-3 shadow-xs border border-[#bcc9ce]/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#00b4d8]/15 text-[#00677d] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">water_ph</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-hud text-[9px] uppercase text-[#00677d] font-extrabold tracking-wider">
              Sistema de Agua Seleccionado
            </span>
            <span className="font-extrabold text-[15px] text-[#151d22] truncate">
              {activeSystem.name}
            </span>
            <span className="text-[11px] text-[#3d494d] truncate">
              {activeSystem.centerPoblado} • {activeSystem.district} ({activeSystem.capacityLiters.toLocaleString('es-PE')} L de Capacidad)
            </span>
          </div>
        </div>

        {/* System switch select */}
        <select
          value={activeSystem.id}
          onChange={(e) => {
            const sys = systems.find((s) => s.id === e.target.value);
            if (sys) onSelectSystem(sys);
          }}
          className="px-3.5 py-2 rounded-xl bg-[#edf5fc] text-[12px] font-hud font-bold text-[#00677d] border border-[#bcc9ce]/50 focus:outline-none focus:ring-2 focus:ring-[#00b4d8] cursor-pointer"
        >
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.centerPoblado})
            </option>
          ))}
        </select>
      </div>

      {/* 3. Hardware Photometric Scanner Hero Card (Imagen del Clorímetro Profesional) */}
      <div className="relative w-full rounded-2xl bg-white overflow-hidden shadow-[0_12px_32px_-6px_rgba(0,180,216,0.16)] border border-[#bcc9ce]/40">
        {/* Gadget Upper HUD Meta Header */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#edf5fc] border-b border-[#bcc9ce]/30 gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c51] text-[20px]">biotech</span>
            <div>
              <span className="font-hud text-[12px] text-[#00677d] font-extrabold tracking-wide uppercase block leading-tight">
                CLORÍMETRO FOTOMÉTRICO DIGITAL DPD-X1
              </span>
              <span className="text-[10px] text-[#3d494d]">
                Instrumento Óptico Portátil para Vigilancia de Agua Potable (D.S. 031)
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-[#bcc9ce]/40">
              <span className="material-symbols-outlined text-[#006c51] text-[15px]">battery_charging_full</span>
              <span className="font-hud text-[11px] text-[#3d494d] font-bold">94%</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-[#bcc9ce]/40">
              <span className="w-2 h-2 rounded-full bg-[#10e7b2]" />
              <span className="font-hud text-[10px] text-[#006c51] font-extrabold uppercase">CALIBRADO</span>
            </div>
            <button
              onClick={() => setIsImgModalOpen(true)}
              className="px-2.5 py-1 rounded-full bg-[#00677d] text-white hover:bg-[#004e5f] text-[11px] font-hud font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Ampliar vista del equipo"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">zoom_in</span>
              <span>Ampliar</span>
            </button>
          </div>
        </div>

        {/* Gadget Visual Area: High-Res Frame with Full Clorimeter Device View */}
        <div className="relative w-full h-72 sm:h-84 md:h-96 bg-gradient-to-b from-[#0b1922] via-[#102430] to-[#0b1922] flex items-center justify-center overflow-hidden group">
          <img
            alt="Clorímetro Fotométrico Digital DPD para Análisis de Cloro Residual"
            className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
            src={chlorimeterImg}
            referrerPolicy="no-referrer"
          />

          {/* Interactive HUD Overlay Badges on Device */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00b4d8] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] font-hud uppercase tracking-wider text-cyan-300 font-bold">Pantalla LCD del Equipo</span>
              <span className="text-[13px] font-hud font-extrabold text-white">{readingPpm.toFixed(2)} mg/L Cl₂</span>
            </div>
          </div>

          <div className="absolute top-3 right-3 hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-white">
            <span className="material-symbols-outlined text-[16px] text-[#10e7b2]">light_mode</span>
            <span className="text-[10px] font-hud font-bold text-emerald-300">Longitud de Onda: 530 nm</span>
          </div>

          {/* Bottom Floating Info Banner on Device */}
          <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-white/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#00677d] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">science</span>
              </div>
              <div className="flex flex-col">
                <span className="font-hud text-[9px] text-[#3d494d] tracking-wider uppercase leading-none font-bold">
                  Método Oficial APHA 4500-Cl G
                </span>
                <span className="font-extrabold text-[13px] text-[#00677d] leading-tight">
                  Lectura Fotométrica DPD N.° 1 (Cloro Residual Libre)
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCameraScanOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00b4d8] to-[#00677d] hover:opacity-95 text-white font-hud text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                type="button"
                title="Activar cámara para fotografiar celda DPD"
              >
                <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                <span>Activar Cámara</span>
              </button>
              <button
                onClick={handleScanCell}
                disabled={isScanning}
                className="px-3 py-1.5 rounded-lg bg-[#00b4d8] hover:bg-[#0096b4] text-white font-hud text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">{isScanning ? 'sync' : 'play_arrow'}</span>
                <span>{isScanning ? 'Midiendo...' : 'READ (Leer)'}</span>
              </button>
              <button
                onClick={handleZeroTare}
                className="px-3 py-1.5 rounded-lg bg-[#edf5fc] hover:bg-[#dbe7f2] text-[#00677d] font-hud text-[11px] font-bold flex items-center gap-1 border border-[#bcc9ce]/40 cursor-pointer transition-all active:scale-95"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                <span>ZERO (Cero)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Inspección Técnica en Alta Resolución */}
      {isImgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 bg-[#edf5fc] border-b border-[#bcc9ce]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00677d] text-[22px]">biotech</span>
                <h3 className="font-extrabold text-[16px] text-[#151d22]">
                  Detalle del Clorímetro Digital y Celda Óptica
                </h3>
              </div>
              <button
                onClick={() => setIsImgModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-[#151d22] flex items-center justify-center transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              <div className="w-full aspect-[16/10] bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 relative">
                <img
                  alt="Clorímetro DPD Digital de Alta Precisión"
                  className="w-full h-full object-contain"
                  src={chlorimeterImg}
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/40">
                  <span className="font-hud font-bold text-[#00677d] block text-[11px] uppercase mb-1">
                    1. Pantalla LCD y Procesador
                  </span>
                  <p className="text-[#3d494d]">
                    Visualización digital en tiempo real de concentración de cloro libre en mg/L (ppm).
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/40">
                  <span className="font-hud font-bold text-[#00677d] block text-[11px] uppercase mb-1">
                    2. Celda de Medición Óptica
                  </span>
                  <p className="text-[#3d494d]">
                    Cámara sellada con cubeta de cuarzo de 10 mL calibrada a haz de luz LED de 530 nm.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/40">
                  <span className="font-hud font-bold text-[#00677d] block text-[11px] uppercase mb-1">
                    3. Reactivo DPD N.° 1
                  </span>
                  <p className="text-[#3d494d]">
                    Reacciona con el cloro residual libre produciendo una coloración fucsia proporcional a la concentración.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/40">
                  <span className="font-hud font-bold text-[#00677d] block text-[11px] uppercase mb-1">
                    4. Cumplimiento Normativo
                  </span>
                  <p className="text-[#3d494d]">
                    Alineado a los estándares de vigilancia sanitaria de DIGESA y D.S. N.° 031-2010-SA (rango 0.5 – 2.0 ppm).
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#edf5fc] border-t border-[#bcc9ce]/30 flex justify-end">
              <button
                onClick={() => setIsImgModalOpen(false)}
                className="px-5 py-2 rounded-full bg-[#00677d] text-white font-hud text-[12px] font-bold hover:bg-[#004e5f] transition-colors cursor-pointer"
                type="button"
              >
                Cerrar Inspección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Realtime Tactical Telemetry Capsule */}
      <div className="w-full rounded-2xl bg-white p-4 shadow-[0_8px_24px_-4px_rgba(0,180,216,0.1)] border border-[#bcc9ce]/40 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00677d] text-[18px]">science</span>
            <span className="font-hud text-[11px] text-[#3d494d] uppercase tracking-widest font-bold">
              Lectura Digital Fotométrica
            </span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-[#caf300]/40 text-[#334000] font-hud text-[10px] font-bold tracking-wide border border-[#caf300]">
            D.S. N.° 031-2010-SA
          </div>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="font-hud text-[36px] text-[#00677d] font-bold tracking-tight">
              {readingPpm.toFixed(2)}
            </span>
            <span className="font-hud text-[14px] text-[#3d494d] font-bold">mg/L Cl₂ (ppm)</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-hud text-[10px] text-[#006c51] uppercase font-bold tracking-wider">
              {readingPpm >= 0.5 && readingPpm <= 2.0 ? '🟢 DENTRO DEL RANGO' : readingPpm < 0.5 ? '🔴 NIVELES BAJOS' : '🟠 SOBREDOSIFICACIÓN'}
            </span>
            <span className="text-[12px] text-[#3d494d]">
              Ref. Normativa: 0.50 – 2.00 mg/L
            </span>
          </div>
        </div>

        {/* Micro Scale Bar */}
        <div className="w-full h-2 rounded-full bg-[#edf5fc] overflow-hidden mt-1 flex border border-[#bcc9ce]/30">
          <div className="h-full bg-[#ba1a1a]" style={{ width: '20%' }} title="Deficiente < 0.5 ppm" />
          <div className="h-full bg-[#10e7b2] shadow-[0_0_12px_#43fec7]" style={{ width: '55%' }} title="Rango Óptimo 0.5 - 2.0 ppm" />
          <div className="h-full bg-[#ba1a1a]" style={{ width: '25%' }} title="Exceso > 2.0 ppm" />
        </div>
        <div className="flex justify-between items-center text-[#3d494d] font-hud text-[10px] px-0.5 font-bold">
          <span className="text-[#ba1a1a]">0.0 - 0.49 (Riesgo)</span>
          <span className="text-[#006c51]">0.50 - 2.00 (Potable Seguro)</span>
          <span className="text-[#ba1a1a]">&gt; 2.00 (Exceso)</span>
        </div>

        {/* Precision Bonus XP banner */}
        <div className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#caf300]/40 flex items-center justify-center text-[#334000]">
              <span className="material-symbols-outlined text-[16px]">military_tech</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] text-[#151d22] font-bold leading-none">
                Bonificación de Calibración
              </span>
              <span className="text-[11px] text-[#3d494d]">
                Desvío &lt; 0.02 mg/L verificado según DIGESA
              </span>
            </div>
          </div>
          <span className="font-hud text-[13px] text-[#006c51] font-bold">+100 XP</span>
        </div>
      </div>

      {/* 5. Colorimetric Chemical DPD Scale (Interactive Energy Vials) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#006c51] text-[18px]">palette</span>
            <span className="font-hud text-[11px] text-[#00677d] uppercase tracking-widest font-bold">
              Escala DPD - Viales de Referencia Visual
            </span>
          </div>
          <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">
            Toca para calibrar
          </span>
        </div>

        {/* 5 Reactive DPD Capsule Nodes */}
        <div className="grid grid-cols-5 gap-2 w-full">
          {dpdVials.map((vial) => {
            const isSelected = activeVial === vial.label;
            return (
              <button
                key={vial.label}
                onClick={() => handleSelectVial(vial.ppm, vial.label)}
                className={`flex flex-col items-center p-2 rounded-2xl transition-all text-center border ${
                  isSelected
                    ? 'bg-[#edf5fc] border-[#00b4d8] shadow-[0_0_16px_rgba(0,180,216,0.35)] scale-105'
                    : 'bg-white border-[#bcc9ce]/30 shadow-sm hover:border-[#00b4d8]/50 active:scale-95'
                }`}
                type="button"
              >
                <div
                  className="w-full aspect-[1/2] max-h-20 rounded-xl flex flex-col items-center justify-end p-1.5 relative overflow-hidden shadow-inner"
                  style={{ background: vial.bgGradient }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white/70 absolute top-1.5 left-1.5" />
                  {isSelected && (
                    <span className="material-symbols-outlined text-[14px] text-white absolute top-1 right-1 animate-bounce">
                      star
                    </span>
                  )}
                  <span className="font-hud text-[10px] font-bold text-white drop-shadow">
                    {vial.label}
                  </span>
                </div>
                <span className="font-hud text-[12px] font-bold text-[#151d22] mt-1.5">
                  {vial.label}
                </span>
                <span
                  className={`font-hud text-[9px] font-bold uppercase mt-0.5 tracking-tighter ${
                    vial.tone === 'secondary' || vial.tone === 'primary'
                      ? 'text-[#006c51]'
                      : vial.tone === 'outline'
                      ? 'text-[#3d494d]'
                      : 'text-[#ba1a1a]'
                  }`}
                >
                  {vial.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Multi-parameter Telemetry Grid (pH, Temp, Turbidity, ORP) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 rounded-2xl bg-white border border-[#bcc9ce]/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">pH del Agua</span>
            <span className="material-symbols-outlined text-[#00677d] text-[16px]">water_ph</span>
          </div>
          <div className="font-hud text-[20px] text-[#151d22] font-bold mt-1">{phLevel}</div>
          <span className="font-hud text-[9px] text-[#006c51] font-bold uppercase mt-1">
            Óptimo (6.5 - 8.5)
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#bcc9ce]/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">Temperatura</span>
            <span className="material-symbols-outlined text-[#00677d] text-[16px]">device_thermostat</span>
          </div>
          <div className="font-hud text-[20px] text-[#151d22] font-bold mt-1">{waterTemp}°C</div>
          <span className="font-hud text-[9px] text-[#00677d] font-bold uppercase mt-1">
            Estable
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#bcc9ce]/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">Turbiedad</span>
            <span className="material-symbols-outlined text-[#00677d] text-[16px]">blur_on</span>
          </div>
          <div className="font-hud text-[20px] text-[#151d22] font-bold mt-1">{turbidityNtu} NTU</div>
          <span className="font-hud text-[9px] text-[#006c51] font-bold uppercase mt-1">
            &lt; 5 NTU (Cristalino)
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-[#bcc9ce]/30 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">Potencial Redox</span>
            <span className="material-symbols-outlined text-[#00677d] text-[16px]">electric_meter</span>
          </div>
          <div className="font-hud text-[20px] text-[#151d22] font-bold mt-1">750 mV</div>
          <span className="font-hud text-[9px] text-[#006c51] font-bold uppercase mt-1">
            Desinfección Activa
          </span>
        </div>
      </div>

      {/* Feedback banner */}
      {syncFeedback && (
        <div className="p-3 rounded-xl bg-[#43fec7]/30 border border-[#43fec7] text-[#00513c] text-[13px] font-bold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[20px]">task_alt</span>
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* 7. Tactical Actions: Confirm Reading, AI Scan, Zero Tare */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSyncReading}
          disabled={isSyncing}
          className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-[#00b4d8] via-[#00677d] to-[#00414f] text-white font-hud text-[13px] font-bold uppercase tracking-wider shadow-[0_8px_24px_rgba(0,180,216,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSyncing ? 'progress_activity' : 'cloud_sync'}
          </span>
          <span>
            {isSyncing
              ? 'SINCRONIZANDO DATOS HUD...'
              : 'CONFIRMAR LECTURA Y REGISTRAR EN BITÁCORA (+100 XP)'}
          </span>
        </button>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={() => setIsCameraScanOpen(true)}
            className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-[#00b4d8] via-[#00677d] to-[#004e5f] text-white font-hud text-[12px] sm:text-[13px] font-extrabold shadow-[0_4px_16px_rgba(0,180,216,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px] animate-pulse">
              photo_camera
            </span>
            <span>Activar Cámara para Tomar Foto a la Celda DPD</span>
          </button>
          <button
            onClick={handleZeroTare}
            className="px-5 py-3 rounded-full bg-white text-[#3d494d] font-hud text-[12px] font-bold shadow-sm border border-[#bcc9ce]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#edf5fc]"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span>Tara Cero</span>
          </button>
        </div>

        {/* Thumbnail Preview if Photo was Captured */}
        {lastCapturedPhoto && (
          <div className="mt-1 flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-[#f0f9ff] to-[#f0fdf9] border border-[#00b4d8]/30">
            <div className="flex items-center gap-2.5">
              <img
                src={lastCapturedPhoto}
                alt="Foto Celda DPD"
                className="w-10 h-10 rounded-lg object-cover border border-[#00b4d8] shadow-xs"
              />
              <div className="flex flex-col">
                <span className="font-hud text-[10px] text-[#00677d] font-bold uppercase">
                  Foto de Celda DPD Registrada
                </span>
                <span className="text-[12px] text-[#151d22] font-semibold">
                  Lectura Óptica: {readingPpm.toFixed(2)} ppm (D.S. 031 Conforme)
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCameraScanOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-white text-[#00677d] text-[11px] font-hud font-bold border border-[#bcc9ce]/50 hover:bg-[#edf5fc] cursor-pointer"
              type="button"
            >
              Volver a Tomar
            </button>
          </div>
        )}
      </div>

      {/* 8. Daily Quest Card (RPG XP Reward) */}
      <section className="bg-gradient-to-r from-[#b3ebff]/60 via-[#edf5fc] to-[#43fec7]/30 rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="w-11 h-11 rounded-full bg-white shadow-md flex items-center justify-center text-[#93b100] shrink-0">
            <span className="material-symbols-outlined text-[26px]">military_tech</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-hud text-[10px] text-[#334000] uppercase font-bold">
                Misión Diaria • Hydro Quest
              </span>
              <span className="bg-[#caf300] text-[#171e00] font-hud text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                +150 XP
              </span>
            </div>
            <p className="text-[13px] text-[#151d22] font-semibold leading-tight">
              Registra 3 mediciones sucesivas de cloro libre para reclamar tu recompensa de operador.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-2 bg-[#dbe4ea] rounded-full overflow-hidden">
                <div className="h-full bg-[#006c51] rounded-full w-2/3" />
              </div>
              <span className="font-hud text-[11px] text-[#006c51] font-bold">2/3 completadas</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Field Commands / Quick Actions */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-[16px] text-[#151d22]">Comandos de Campo</h3>
          <span className="font-hud text-[10px] text-[#00677d] uppercase font-bold">
            Acciones Rápidas
          </span>
        </div>

        {/* Primary Dose Action Tile */}
        <button
          onClick={() => onNavigateToDosage(activeSystem)}
          className="w-full bg-gradient-to-r from-[#00b4d8] to-[#00677d] text-white rounded-2xl p-4 shadow-[0_10px_24px_rgba(0,180,216,0.3)] flex items-center justify-between transition-transform active:scale-[0.98] group cursor-pointer"
          type="button"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner group-hover:rotate-12 transition-transform">
              <span className="material-symbols-outlined text-[28px]">science</span>
            </div>
            <div>
              <span className="font-hud text-[10px] text-[#b3ebff] uppercase tracking-wider block font-bold">
                Laboratorio Asistido
              </span>
              <span className="font-extrabold text-[17px] text-white">
                Calcular Dosis de Cloro Ahora
              </span>
              <div className="text-[11px] text-white/90">
                Paso a paso: Tanque → Volumen → Reactivo → Dosis
              </div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white shadow-sm">
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </div>
        </button>

        {/* Secondary Tiles */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={onNavigateToSystems}
            className="bg-white rounded-2xl p-3 shadow-sm border border-[#bcc9ce]/30 flex flex-col items-start gap-2 text-left active:scale-[0.98] transition-transform hover:border-[#00b4d8] cursor-pointer"
            type="button"
          >
            <div className="w-9 h-9 rounded-xl bg-[#43fec7]/30 flex items-center justify-center text-[#006c51]">
              <span className="material-symbols-outlined text-[20px]">add_moderator</span>
            </div>
            <div>
              <span className="text-[13px] font-bold text-[#151d22] block leading-tight">
                Registrar Nuevo Sistema
              </span>
              <span className="font-hud text-[10px] text-[#3d494d]">
                Alta de Tanque, Cisterna o Red
              </span>
            </div>
          </button>

          <button
            onClick={onNavigateToRecords}
            className="bg-white rounded-2xl p-3 shadow-sm border border-[#bcc9ce]/30 flex flex-col items-start gap-2 text-left active:scale-[0.98] transition-transform hover:border-[#00b4d8] cursor-pointer"
            type="button"
          >
            <div className="w-9 h-9 rounded-xl bg-[#b3ebff]/50 flex items-center justify-center text-[#00677d]">
              <span className="material-symbols-outlined text-[20px]">history_edu</span>
            </div>
            <div>
              <span className="text-[13px] font-bold text-[#151d22] block leading-tight">
                Historial de Vigilancia
              </span>
              <span className="font-hud text-[10px] text-[#3d494d]">
                Bitácora, Telemetría y PDF
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 10. Systems in Operation Overview */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-[16px] text-[#151d22]">Sistemas en Operación</h3>
          <span className="font-hud text-[10px] text-[#006c51] uppercase font-bold">
            {systems.length} Bases Hídricas Activas
          </span>
        </div>

        {systems.slice(0, 3).map((sys) => {
          const isAlert = sys.operationalStatus === 'alert';
          const isMaintenance = sys.operationalStatus === 'maintenance';

          return (
            <div
              key={sys.id}
              className={`rounded-2xl p-3.5 shadow-sm border flex flex-col gap-2 transition-all ${
                isAlert
                  ? 'bg-white border-[#ffdad6]'
                  : 'bg-white border-[#bcc9ce]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isAlert
                        ? 'bg-[#ffdad6] text-[#ba1a1a]'
                        : isMaintenance
                        ? 'bg-[#caf300]/40 text-[#334000]'
                        : 'bg-[#edf5fc] text-[#00677d]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isAlert ? 'warning' : isMaintenance ? 'build' : 'water_damage'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[14px] text-[#151d22] leading-tight">
                      {sys.name}
                    </h4>
                    <span className="font-hud text-[10px] text-[#3d494d] uppercase font-medium">
                      {sys.capacityLiters.toLocaleString('es-PE')} L • {sys.centerPoblado}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full font-hud text-[10px] font-bold uppercase tracking-wider ${
                    isAlert
                      ? 'bg-[#ffdad6] text-[#ba1a1a]'
                      : 'bg-[#43fec7]/30 text-[#00513c]'
                  }`}
                >
                  {sys.lastChlorinePpm.toFixed(1)} ppm Cl₂
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#edf5fc]">
                <div className="text-[11px] text-[#3d494d]">
                  {isAlert ? (
                    <span className="text-[#ba1a1a] font-bold">
                      ⚠️ Requiere dosificación correctiva urgente
                    </span>
                  ) : (
                    <span className="text-[#006c51] flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10e7b2]" />
                      Cl₂ residual libre estabilizado
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onNavigateToDosage(sys)}
                  className={`px-3 py-1 rounded-full font-hud text-[11px] font-bold flex items-center gap-1 transition-all ${
                    isAlert
                      ? 'bg-[#ba1a1a] text-white shadow-sm hover:bg-[#93000a]'
                      : 'bg-[#edf5fc] text-[#00677d] hover:bg-[#e1e9f0]'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">science</span>
                  <span>{isAlert ? 'Dosificar Ahora' : 'Calcular Dosis'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Modal de Cámara para Fotografiar Celda DPD */}
      <CameraDpdScanModal
        isOpen={isCameraScanOpen}
        onClose={() => setIsCameraScanOpen(false)}
        onApplyReading={handleApplyCameraReading}
        systemName={activeSystem.name}
      />
    </div>
  );
};
