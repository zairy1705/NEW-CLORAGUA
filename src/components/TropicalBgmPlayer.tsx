import React, { useState, useEffect } from 'react';
import {
  toggleBgm,
  setBgmVolume,
  getBgmVolume,
  isBgmActive,
  subscribeBgmState,
} from '../utils/tropicalBgmSynthesizer';

interface TropicalBgmPlayerProps {
  compact?: boolean;
}

export const TropicalBgmPlayer: React.FC<TropicalBgmPlayerProps> = ({ compact = false }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(() => isBgmActive());
  const [volume, setVolume] = useState<number>(() => getBgmVolume());
  const [beat, setBeat] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeBgmState((playing, vol, currentBeat) => {
      setIsPlaying(playing);
      setVolume(vol);
      setBeat(currentBeat);
    });
    return unsub;
  }, []);

  const handleToggle = () => {
    toggleBgm();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setBgmVolume(newVol);
  };

  const step = beat % 32;

  if (compact) {
    return (
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={handleToggle}
          className={`h-10 px-3 rounded-full border flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer select-none ${
            isPlaying
              ? 'bg-gradient-to-r from-[#10e7b2]/20 to-[#00b4d8]/20 border-[#10e7b2] text-[#00677d] shadow-[0_0_14px_rgba(16,231,178,0.35)]'
              : 'bg-[#edf5fc] hover:bg-[#e1e9f0] border-[#bcc9ce]/40 text-[#5f747e]'
          }`}
          title={isPlaying ? 'Pausar BGM Calypso Tropical' : 'Reproducir BGM Calypso Tropical (Sintetizador en Vivo)'}
        >
          <span className={`material-symbols-outlined text-[19px] ${isPlaying ? 'animate-bounce text-[#00b4d8]' : ''}`}>
            {isPlaying ? 'music_note' : 'music_off'}
          </span>
          <span className="font-hud text-[10px] font-extrabold uppercase tracking-wider hidden sm:inline">
            {isPlaying ? 'Calypso ON' : 'Calypso'}
          </span>
          {isPlaying && (
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-1 bg-[#10e7b2] rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2.5" />
              <span className="w-1 bg-[#00b4d8] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3.5" />
              <span className="w-1 bg-[#10e7b2] rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-2" />
            </div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-[#002b36] via-[#001f29] to-[#00141a] text-white rounded-3xl p-4 sm:p-5 shadow-2xl border border-cyan-500/30 overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-cyan-400/10 filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-emerald-400/10 filter blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#10e7b2] to-[#00b4d8] flex items-center justify-center text-[#00141a] shadow-[0_0_20px_rgba(16,231,178,0.4)]">
            <span className="material-symbols-outlined text-[26px]">
              {isPlaying ? 'graphic_eq' : 'music_note'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-hud text-[15px] sm:text-[16px] font-black tracking-wide text-cyan-200 uppercase">
                BGM Calypso Tropical
              </h3>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Sintetizador Web Audio
              </span>
            </div>
            <p className="text-[11px] sm:text-[12px] text-cyan-100/70">
              Generador armónico en tiempo real sin archivos MP3 externos
            </p>
          </div>
        </div>

        {/* Play/Pause Main Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            className={`px-5 py-2.5 rounded-2xl font-hud text-[12px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
              isPlaying
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white shadow-red-500/30'
                : 'bg-gradient-to-r from-[#10e7b2] to-[#00b4d8] hover:from-[#2bfac7] hover:to-[#22d3ee] text-[#00141a] shadow-cyan-400/40'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
            <span>{isPlaying ? 'Pausar Música' : 'Iniciar Calypso'}</span>
          </button>
        </div>
      </div>

      {/* Volume slider & Live beat indicators */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center bg-black/30 rounded-2xl p-3 border border-cyan-900/40">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-cyan-400 text-[20px]">
            {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full accent-[#10e7b2] cursor-pointer h-1.5 bg-cyan-950 rounded-lg"
          />
          <span className="font-hud text-[11px] text-cyan-300 font-bold min-w-[36px] text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Live Audio Visualizer Bars */}
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-[10px] font-hud uppercase tracking-wider text-cyan-400/80 mr-1">
            Tempo 120 BPM:
          </span>
          {Array.from({ length: 16 }).map((_, i) => {
            const isCurrent = isPlaying && (step % 16) === i;
            return (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  isCurrent
                    ? 'h-6 bg-[#10e7b2] shadow-[0_0_8px_#10e7b2]'
                    : i % 4 === 0
                    ? 'h-3 bg-cyan-700/60'
                    : 'h-2 bg-cyan-900/40'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
