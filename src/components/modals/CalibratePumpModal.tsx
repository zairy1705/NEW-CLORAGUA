import React, { useState } from 'react';
import { calculatePumpCalibration } from '../../utils/calculations';

interface CalibratePumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardXp: (xp: number, reason: string) => void;
}

export const CalibratePumpModal: React.FC<CalibratePumpModalProps> = ({
  isOpen,
  onClose,
  onRewardXp,
}) => {
  const [theoreticalFlowMlMin, setTheoreticalFlowMlMin] = useState<number>(100);
  const [measuredVolumeMl, setMeasuredVolumeMl] = useState<number>(102);
  const [testTimeSeconds, setTestTimeSeconds] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const result = calculatePumpCalibration(
    theoreticalFlowMlMin,
    measuredVolumeMl,
    testTimeSeconds
  );

  const flowLitersPerHour = Number(((result.observedFlowMlMin * 60) / 1000).toFixed(2));

  const startTestTimer = () => {
    setIsTimerRunning(true);
    setTimerSeconds(0);
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev >= 59) {
          clearInterval(interval);
          setIsTimerRunning(false);
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleSaveCalibration = () => {
    onRewardXp(40, 'Calibración de Bomba Dosificadora Realizada');
    setFeedback('¡Calibración verificada y guardada con éxito en los parámetros de la bomba!');
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-[#bcc9ce]/40 flex flex-col gap-4 relative">
        <div className="flex items-center justify-between border-b border-[#edf5fc] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#00b4d8]/15 text-[#00677d] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </div>
            <div>
              <h3 className="font-extrabold text-[16px] text-[#151d22]">
                Calibración de Bomba Dosificadora
              </h3>
              <span className="text-[11px] text-[#3d494d]">
                Método de probeta graduada en tiempo real
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

        {/* Stopwatch assistance */}
        <div className="p-3.5 rounded-2xl bg-[#edf5fc] border border-[#00b4d8]/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#00677d] text-[24px]">timer</span>
            <div>
              <div className="text-[12px] font-bold text-[#151d22]">Cronómetro de Aforo (60s)</div>
              <div className="text-[11px] text-[#3d494d]">
                Mida en probeta el volumen entregado durante 1 minuto
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-hud text-[20px] font-bold text-[#00677d]">
              {timerSeconds}s
            </span>
            <button
              onClick={startTestTimer}
              disabled={isTimerRunning}
              className="px-3 py-1 rounded-full bg-[#00b4d8] text-white font-hud text-[11px] font-bold uppercase disabled:opacity-50 cursor-pointer"
              type="button"
            >
              {isTimerRunning ? 'Midiendo...' : 'Iniciar'}
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#151d22]">
              Flujo Teórico
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="5"
                value={theoreticalFlowMlMin}
                onChange={(e) => setTheoreticalFlowMlMin(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-2 rounded-xl bg-[#edf5fc] font-hud text-[14px] font-bold text-[#00677d] focus:outline-none"
              />
              <span className="font-hud text-[10px] text-[#3d494d] font-bold">mL/m</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#151d22]">
              Vol. en Probeta
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="5"
                value={measuredVolumeMl}
                onChange={(e) => setMeasuredVolumeMl(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-2 rounded-xl bg-[#edf5fc] font-hud text-[14px] font-bold text-[#00677d] focus:outline-none"
              />
              <span className="font-hud text-[10px] text-[#3d494d] font-bold">mL</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#151d22]">
              Tiempo Prueba
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="5"
                value={testTimeSeconds}
                onChange={(e) => setTestTimeSeconds(parseFloat(e.target.value) || 1)}
                className="w-full px-2 py-2 rounded-xl bg-[#edf5fc] font-hud text-[14px] font-bold text-[#00677d] focus:outline-none"
              />
              <span className="font-hud text-[10px] text-[#3d494d] font-bold">seg</span>
            </div>
          </div>
        </div>

        {/* Calibration Results Output */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#edf5fc] via-white to-[#edf5fc] border border-[#bcc9ce]/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-hud text-[10px] text-[#00677d] uppercase font-bold tracking-wider">
              Caudal Real Entregado por la Bomba
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-hud font-bold uppercase ${
                result.isCalibrated
                  ? 'bg-[#43fec7]/30 text-[#00513c]'
                  : 'bg-[#ffdad6] text-[#93000a]'
              }`}
            >
              {result.isCalibrated ? 'CALIBRADA (±5%)' : 'DESVIADA'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-[#3d494d] block">Caudal Observado:</span>
              <span className="font-hud text-[20px] font-extrabold text-[#00677d]">
                {result.observedFlowMlMin} mL/min
              </span>
              <span className="text-[10px] text-[#3d494d] block">
                Error: {result.errorPercentage > 0 ? `+${result.errorPercentage}` : result.errorPercentage}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-[#3d494d] block">Caudal Horario:</span>
              <span className="font-hud text-[20px] font-extrabold text-[#006c51]">
                {flowLitersPerHour} L/h
              </span>
            </div>
          </div>
          <div className="text-[11px] text-[#3d494d] border-t border-[#bcc9ce]/30 pt-1.5 mt-1">
            {result.recommendation}
          </div>
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
            onClick={handleSaveCalibration}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#00677d] text-white font-hud text-[11px] font-bold uppercase shadow-md flex items-center gap-1 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>Confirmar Calibración (+40 XP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
