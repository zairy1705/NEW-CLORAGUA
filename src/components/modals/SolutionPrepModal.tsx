import React, { useState } from 'react';
import { calculateDilution } from '../../utils/calculations';
import { ChlorineProductType } from '../../types';

interface SolutionPrepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardXp: (xp: number, reason: string) => void;
}

export const SolutionPrepModal: React.FC<SolutionPrepModalProps> = ({
  isOpen,
  onClose,
  onRewardXp,
}) => {
  const [tankLiters, setTankLiters] = useState<number>(200);
  const [targetConcentrationPercent, setTargetConcentrationPercent] = useState<number>(1.5);
  const [productType, setProductType] = useState<ChlorineProductType>('calcium_hypochlorite');
  const [stockProductConcentrationPercent, setStockProductConcentrationPercent] = useState<number>(68.0);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const result = calculateDilution(
    stockProductConcentrationPercent,
    targetConcentrationPercent,
    tankLiters
  );

  const isLiquid = productType === 'sodium_hypochlorite';
  const displayAmount = isLiquid
    ? result.commercialProductVolumeL >= 1
      ? `${result.commercialProductVolumeL} L`
      : `${Math.round(result.commercialProductVolumeMl)} mL`
    : `${(result.commercialProductVolumeL * 1000).toFixed(0)} g (${result.commercialProductVolumeL.toFixed(2)} kg)`;

  const handleApply = () => {
    onRewardXp(35, 'Preparación de Solución Madre Registrada');
    setFeedback('¡Protocolo de dilución generado y validado!');
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-[#bcc9ce]/40 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf5fc] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#00b4d8]/15 text-[#00677d] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">science</span>
            </div>
            <div>
              <h3 className="font-extrabold text-[16px] text-[#151d22]">
                Preparación de Solución Madre
              </h3>
              <span className="text-[11px] text-[#3d494d]">
                Tanque de dilución para dosificadores por goteo o bomba
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#edf5fc] text-[#3d494d] flex items-center justify-center hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-[#151d22]">
              Volumen Tanque Solución
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="50"
                value={tankLiters}
                onChange={(e) => setTankLiters(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
              />
              <span className="font-hud text-[12px] text-[#3d494d] font-bold">L</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-[#151d22]">
              Concentración Deseada
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.1"
                value={targetConcentrationPercent}
                onChange={(e) => setTargetConcentrationPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
              />
              <span className="font-hud text-[12px] text-[#3d494d] font-bold">%</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-[#151d22]">Reactivo Comercial</label>
            <select
              value={productType}
              onChange={(e) => {
                const val = e.target.value as ChlorineProductType;
                setProductType(val);
                if (val === 'calcium_hypochlorite') setStockProductConcentrationPercent(68);
                else if (val === 'sodium_hypochlorite') setStockProductConcentrationPercent(12);
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-[#edf5fc] text-[12px] font-medium text-[#151d22] focus:outline-none"
            >
              <option value="calcium_hypochlorite">Hipoclorito de Calcio (Granular)</option>
              <option value="sodium_hypochlorite">Hipoclorito de Sodio (Líquido)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[12px] font-bold text-[#151d22]">Pureza del Cloro Activo</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="1"
                value={stockProductConcentrationPercent}
                onChange={(e) => setStockProductConcentrationPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
              />
              <span className="font-hud text-[12px] text-[#3d494d] font-bold">%</span>
            </div>
          </div>
        </div>

        {/* Quick Tank volume presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-hud text-[#3d494d] font-bold">Tanque habitual:</span>
          {[100, 200, 500, 1000].map((l) => (
            <button
              key={l}
              onClick={() => setTankLiters(l)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-hud font-bold ${
                tankLiters === l ? 'bg-[#00b4d8] text-white' : 'bg-[#edf5fc] text-[#3d494d]'
              }`}
              type="button"
            >
              {l} Litros
            </button>
          ))}
        </div>

        {/* Calculated Result */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00677d] to-[#004e5f] text-white flex flex-col items-center justify-center gap-1 shadow-md">
          <span className="font-hud text-[10px] text-[#b3ebff] uppercase tracking-wider font-bold">
            Cantidad Exacta a Pesar / Medir
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-hud text-[32px] font-extrabold text-white">
              {displayAmount}
            </span>
          </div>
          <span className="text-[12px] text-white/90 text-center">
            Disolver en {result.waterVolumeL} L de agua limpia para obtener {result.finalVolumeL} L al {targetConcentrationPercent}%
          </span>
        </div>

        {/* Recommended Procedure Note */}
        <div className="p-3.5 rounded-2xl bg-[#edf5fc] border border-[#bcc9ce]/40 flex flex-col gap-1.5 text-[12px] text-[#3d494d]">
          <div className="font-bold text-[#151d22] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00677d] text-[18px]">help_outline</span>
            Procedimiento Técnico Oficial (MINSA/DIGESA):
          </div>
          <p className="leading-relaxed">
            {result.explanation}
          </p>
          {productType === 'calcium_hypochlorite' && (
            <div className="mt-1 p-2 rounded-xl bg-[#fff8e1] border border-[#ffe082] text-[#5d4037] text-[11px]">
              ⚠️ <strong>Sedimentación Obligatoria:</strong> Deje reposar la solución al menos 4 horas (idealmente toda la noche) para que precipite el lodo de cal insoluble y trasvase únicamente el sobrenadante claro al tanque dosificador.
            </div>
          )}
        </div>

        {feedback && (
          <div className="p-2.5 rounded-xl bg-[#43fec7]/30 text-[#00513c] text-[12px] font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">task_alt</span>
            <span>{feedback}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[11px] font-bold uppercase hover:bg-[#e1e9f0]"
            type="button"
          >
            Cerrar
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#00677d] text-white font-hud text-[11px] font-bold uppercase shadow-md flex items-center gap-1 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">task_alt</span>
            <span>Aplicar Preparación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
