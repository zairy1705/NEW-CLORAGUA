import React from 'react';
import { TankType } from '../types';
import { VolumeResult } from '../utils/calculations';

interface TankVisualizerProps {
  tankType: TankType;
  volumeResult: VolumeResult;
  tankName?: string;
}

export const TankVisualizer: React.FC<TankVisualizerProps> = ({
  tankType,
  volumeResult,
  tankName,
}) => {
  const { totalVolumeLiters, totalVolumeM3, waterVolumeLiters, waterVolumeM3, fillPercentage, hasInconsistency, errorMessage } = volumeResult;
  const availableLiters = Math.max(0, totalVolumeLiters - waterVolumeLiters);
  const availableM3 = Math.max(0, totalVolumeM3 - waterVolumeM3);

  const getTypeName = () => {
    switch (tankType) {
      case 'cylindrical_vertical':
        return 'Tanque Cilíndrico Vertical';
      case 'rectangular_cistern':
        return 'Cisterna Rectangular';
      case 'cubic':
        return 'Tanque Cúbico';
      case 'cylindrical_horizontal':
        return 'Tanque Cilíndrico Horizontal';
      case 'direct_volume':
        return 'Capacidad Directa';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_8px_24px_-4px_rgba(0,180,216,0.12)] border border-[#bcc9ce]/30">
      {/* Upper header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00677d] text-[20px]">
            water_damage
          </span>
          <div>
            <div className="font-hud text-[11px] text-[#00677d] uppercase tracking-wider font-bold">
              {tankName || getTypeName()}
            </div>
            <div className="text-[10px] text-[#3d494d]">
              Simulación Hidráulica en Tiempo Real
            </div>
          </div>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-hud font-bold uppercase tracking-wider ${
          fillPercentage > 95
            ? 'bg-[#caf300]/40 text-[#334000]'
            : fillPercentage < 30
            ? 'bg-[#ffdad6] text-[#93000a]'
            : 'bg-[#43fec7]/30 text-[#00513c]'
        }`}>
          {fillPercentage}% Lleno
        </div>
      </div>

      {hasInconsistency && (
        <div className="mb-3 p-2.5 rounded-xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#93000a] text-[12px] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">warning</span>
          <span>⚠️ {errorMessage || 'Los datos ingresados no son físicamente posibles.'}</span>
        </div>
      )}

      {/* Main visualization row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Physical 3D/Isometric SVG Simulation */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-[#edf5fc] to-[#f5faff] border border-[#bcc9ce]/20">
          <div className="relative w-28 h-40 flex items-center justify-center">
            {tankType === 'cylindrical_horizontal' ? (
              // Horizontal Cylinder Simulation
              <div className="relative w-36 h-20 rounded-2xl bg-[#dbe4ea] overflow-hidden border-2 border-[#00677d]/30 shadow-inner flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-[#00677d] via-[#00b4d8] to-[#43fec7] transition-all duration-700 relative"
                  style={{ height: `${Math.min(100, Math.max(0, fillPercentage))}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/50 blur-[1px] animate-pulse" />
                  <div className="absolute bottom-2 left-3 w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-hud font-bold text-white text-[15px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {fillPercentage}%
                  </span>
                </div>
              </div>
            ) : tankType === 'rectangular_cistern' ? (
              // Rectangular Cistern Box Simulation
              <div className="relative w-24 h-32 rounded-xl bg-[#dbe4ea] overflow-hidden border-2 border-[#00677d]/30 shadow-inner flex flex-col justify-end">
                <div
                  className="w-full bg-gradient-to-t from-[#004e5f] via-[#00b4d8] to-[#43fec7] transition-all duration-700 relative"
                  style={{ height: `${Math.min(100, Math.max(0, fillPercentage))}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/50 blur-[1px]" />
                  <div className="absolute bottom-3 left-4 w-1.5 h-1.5 rounded-full bg-white/80 animate-ping" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-hud font-bold text-white text-[15px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {fillPercentage}%
                  </span>
                </div>
              </div>
            ) : (
              // Vertical Cylinder Simulation
              <div className="relative w-24 h-36 rounded-2xl bg-[#dbe4ea] overflow-hidden border-2 border-[#00677d]/30 shadow-inner flex flex-col justify-end">
                {/* Upper rim */}
                <div className="absolute top-0 left-0 right-0 h-3 bg-white/40 border-b border-[#bcc9ce]/50 rounded-t-2xl z-10" />
                {/* Water Liquid Body */}
                <div
                  className="w-full bg-gradient-to-t from-[#00677d] via-[#00b4d8] to-[#43fec7] transition-all duration-700 relative"
                  style={{ height: `${Math.min(100, Math.max(0, fillPercentage))}%` }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/60 blur-[1px]" />
                  <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce" />
                  <div className="absolute bottom-4 right-3 w-2 h-2 rounded-full bg-white/50" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-hud font-bold text-white text-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    {fillPercentage}%
                  </span>
                </div>
              </div>
            )}
          </div>
          <span className="font-hud text-[10px] text-[#3d494d] mt-2 font-bold uppercase">
            {fillPercentage}% Nivel Operativo
          </span>
        </div>

        {/* Volume Metric Cards Grid */}
        <div className="sm:col-span-7 grid grid-cols-2 gap-2">
          {/* Real Water Volume (Used for Dosing) */}
          <div className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-[#00677d]/10 via-[#00b4d8]/15 to-transparent border border-[#00b4d8]/30">
            <div className="flex items-center justify-between">
              <span className="font-hud text-[10px] uppercase text-[#00677d] font-bold tracking-wider">
                Volumen Real de Agua (Para Dosis)
              </span>
              <span className="material-symbols-outlined text-[#00b4d8] text-[16px]">
                verified
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-hud text-[24px] font-extrabold text-[#00677d] tracking-tight">
                {waterVolumeLiters.toLocaleString('es-PE')}
              </span>
              <span className="font-hud text-[12px] font-bold text-[#3d494d]">LITROS</span>
              <span className="text-[12px] text-[#006c51] font-bold">
                ({waterVolumeM3.toFixed(2)} m³)
              </span>
            </div>
            <div className="text-[10px] text-[#3d494d] mt-0.5">
              * Volumen de agua actualmente almacenado que recibirá la dosificación.
            </div>
          </div>

          {/* Total Capacity */}
          <div className="p-2.5 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/30">
            <span className="font-hud text-[9px] uppercase text-[#3d494d] font-bold block">
              Capacidad Total
            </span>
            <div className="font-hud text-[16px] font-bold text-[#151d22] mt-0.5">
              {totalVolumeLiters.toLocaleString('es-PE')} L
            </div>
            <div className="text-[10px] text-[#3d494d]">{totalVolumeM3.toFixed(2)} m³</div>
          </div>

          {/* Available / Free Volume */}
          <div className="p-2.5 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/30">
            <span className="font-hud text-[9px] uppercase text-[#3d494d] font-bold block">
              Volumen Disponible
            </span>
            <div className="font-hud text-[16px] font-bold text-[#006c51] mt-0.5">
              {availableLiters.toLocaleString('es-PE')} L
            </div>
            <div className="text-[10px] text-[#3d494d]">{availableM3.toFixed(2)} m³ libre</div>
          </div>
        </div>
      </div>
    </div>
  );
};
