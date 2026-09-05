import React, { useState } from 'react';
import { MainTab } from './BottomNavigation';

export interface AdviceTip {
  id: string;
  tag: string;
  speechText: string;
  actionLabel?: string;
  actionTab?: MainTab;
  onCustomAction?: () => void;
}

interface ScientistAdvicePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: MainTab) => void;
  onOpenDpdCamera?: () => void;
  onOpenSolutionPrep?: () => void;
  onOpenCalibrate?: () => void;
  position?: 'bottom-right' | 'bottom-left';
  onTogglePosition?: () => void;
  className?: string;
}

export const ScientistAdvicePopup: React.FC<ScientistAdvicePopupProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenDpdCamera,
  onOpenSolutionPrep,
  onOpenCalibrate,
  position = 'bottom-right',
  onTogglePosition,
  className = '',
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips: AdviceTip[] = [
    {
      id: 'welcome',
      tag: 'Presentación Oficial',
      speechText:
        '«¡Hola! Soy la Científica CLORAGUA, tu asistente técnica y guardiana del agua. Te acompaño paso a paso en el cálculo de dosis de hipoclorito, calibración de equipos y vigilancia de cloro libre residual (0.50 a 2.00 ppm) según la norma D.S. 031-2010-SA.»',
      actionLabel: 'Ver Consejos',
    },
    {
      id: 'systems',
      tag: 'Consejo 1: Registro de Tanque',
      speechText:
        '«En la pestaña "Sistemas" puedes registrar tus reservorios, captaciones o tanques comunitarios con sus dimensiones en metros o volumen en litros para tener los cálculos listos.»',
      actionLabel: 'Ver Sistemas',
      actionTab: 'sistemas',
    },
    {
      id: 'dosage',
      tag: 'Consejo 2: Dosificación Exacta',
      speechText:
        '«En "Dosificación" calculas los gramos exactos de hipoclorito de calcio (al 65% o 70%) o solución líquida. Evitas la sub-cloración bacteriana y el exceso organoléptico.»',
      actionLabel: 'Calcular Dosis',
      actionTab: 'dosis',
    },
    {
      id: 'dpd',
      tag: 'Consejo 3: Escáner de Fotómetro',
      speechText:
        '«¡Usa el botón "Escanear Fotómetro" o "Cámara DPD"! Al reaccionar tu muestra de agua con la pastilla DPD-1, la cámara escanea el tono rosado y valida si está en el rango seguro de 0.5 a 2.0 ppm.»',
      actionLabel: 'Abrir Cámara DPD',
      onCustomAction: onOpenDpdCamera,
    },
    {
      id: 'solution',
      tag: 'Consejo 4: Solución Madre y Gotero',
      speechText:
        '«Usa el botón "Solución Madre" para calcular cuántos kilos de hipoclorito diluir en tu tanque de carga, y "Calibrar Gotero" para medir el caudal por goteo en mililitros o gotas por minuto.»',
      actionLabel: 'Solución Madre',
      onCustomAction: onOpenSolutionPrep,
    },
    {
      id: 'registry',
      tag: 'Consejo 5: Bitácora y Reportes',
      speechText:
        '«Guarda cada monitoreo diario en la "Bitácora". Podrás generar reportes técnicos oficiales en PDF listos para firmar y presentar ante la JASS, MINSA o DIGESA.»',
      actionLabel: 'Ir a Bitácora',
      actionTab: 'registro',
    },
  ];

  if (!isOpen) return null;

  const activeTip = tips[currentTipIndex];

  const handleNext = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
  };

  const handlePrev = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  const handleAction = () => {
    if (activeTip.onCustomAction) {
      activeTip.onCustomAction();
    } else if (activeTip.actionTab && onNavigateTab) {
      onNavigateTab(activeTip.actionTab);
    } else {
      handleNext();
    }
  };

  return (
    <div
      className={`max-w-[310px] sm:max-w-sm p-3.5 sm:p-4 rounded-2xl bg-[#00212b]/95 backdrop-blur-md border border-cyan-400/50 shadow-[0_12px_32px_rgba(0,25,35,0.7)] text-white transition-all animate-in fade-in duration-200 select-none ${className}`}
      id="scientist-advice-window"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-[#10e7b2]">science</span>
          <span className="font-hud text-[11px] sm:text-[12px] font-extrabold text-[#10e7b2] uppercase tracking-wider">
            CIENTÍFICA CLORAGUA
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onTogglePosition && (
            <button
              onClick={onTogglePosition}
              className="text-white/60 hover:text-[#10e7b2] p-0.5 rounded transition-colors cursor-pointer flex items-center"
              type="button"
              title={position === 'bottom-right' ? 'Mover a la izquierda' : 'Mover a la derecha'}
              id="toggle-scientist-advice-position"
            >
              <span className="material-symbols-outlined text-[15px]">swap_horiz</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-[18px] leading-none transition-colors p-0.5 rounded cursor-pointer"
            type="button"
            title="Cerrar ventanita"
            id="close-scientist-advice"
          >
            ×
          </button>
        </div>
      </div>

      {/* Tip Tag */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10e7b2] animate-pulse" />
        <span className="text-[10px] font-hud font-bold text-cyan-300 uppercase tracking-wide">
          {activeTip.tag}
        </span>
      </div>

      {/* Speech Text */}
      <p className="text-[12px] sm:text-[12.5px] text-cyan-50 font-medium leading-relaxed">
        {activeTip.speechText}
      </p>

      {/* Footer Navigation and Action */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-cyan-500/20 text-[10px] sm:text-[11px] font-hud text-cyan-300">
        {/* Carousel / Navigation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            className="w-5 h-5 rounded flex items-center justify-center bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/30 transition-colors cursor-pointer"
            title="Consejo anterior"
          >
            <span className="material-symbols-outlined text-[13px]">chevron_left</span>
          </button>
          <span className="text-cyan-200/90 font-bold text-[10px]">
            {currentTipIndex + 1}/{tips.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="w-5 h-5 rounded flex items-center justify-center bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/30 transition-colors cursor-pointer"
            title="Consejo siguiente"
          >
            <span className="material-symbols-outlined text-[13px]">chevron_right</span>
          </button>
        </div>

        {/* Action Button */}
        {activeTip.actionLabel && (
          <button
            type="button"
            onClick={handleAction}
            className="px-2.5 py-1 rounded-full bg-[#10e7b2]/20 hover:bg-[#10e7b2]/30 text-[#10e7b2] border border-[#10e7b2]/50 font-hud text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
            title={activeTip.actionLabel}
          >
            <span>{activeTip.actionLabel}</span>
            <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
          </button>
        )}
      </div>
    </div>
  );
};
