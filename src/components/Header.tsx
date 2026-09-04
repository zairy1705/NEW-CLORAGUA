import React, { useState } from 'react';
import { UserGuardianProfile, UserProfileAccount } from '../types';
import { gameSoundEngine } from '../utils/gameAudio';

interface HeaderProps {
  currentTabTitle?: string;
  guardian: UserGuardianProfile;
  activeAccount?: UserProfileAccount;
  onOpenProfileAuth?: (initialTab?: 'register' | 'login' | 'saved' | 'profile') => void;
  onOpenNormative?: () => void;
  onOpenCalibrator?: () => void;
  onOpenCalibrate?: () => void;
  onOpenSolutionPrep?: () => void;
  onOpenVolumeCalc?: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabTitle = 'Vigilancia & Dosificación',
  guardian,
  activeAccount,
  onOpenProfileAuth,
  onOpenNormative,
  onOpenCalibrator,
  onOpenCalibrate,
  onOpenSolutionPrep,
  onOpenVolumeCalc,
  onNavigateHome,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => gameSoundEngine.getMuted());

  const handleToggleSound = () => {
    const isNowActive = gameSoundEngine.toggleSound();
    setIsSoundMuted(!isNowActive);
  };

  const handleOpenCalibrator = () => {
    if (onOpenCalibrator) onOpenCalibrator();
    else if (onOpenCalibrate) onOpenCalibrate();
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-white/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,103,125,0.08)] border-b border-white/70">
      <div className="h-20 px-4 max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo and Active View Tag */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={onNavigateHome}
            className={`flex items-center gap-2 ${onNavigateHome ? 'cursor-pointer group' : ''}`}
            title="Ir a Página Principal"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#00b4d8] to-[#00677d] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,180,216,0.35)] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">water_drop</span>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10e7b2] border-2 border-white flex items-center justify-center text-[7px] font-bold text-[#002116]">
                ✓
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[20px] text-[#00677d] tracking-tight leading-none group-hover:text-[#004e5f] transition-colors">
                  CLORAGUA
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#caf300]/40 text-[#334000] border border-[#caf300]">
                  D.S. 031
                </span>
              </div>
              <span className="font-hud text-[11px] text-[#006c51] tracking-wider uppercase leading-none mt-1 font-bold">
                {currentTabTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Guardian Level Badge + Quick Tools Menu */}
        <div className="flex items-center gap-2">
          {/* Guardian Level & Active Account Pill */}
          <button
            onClick={() => onOpenProfileAuth?.('profile')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#edf5fc] hover:bg-[#dbe7f2] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.9)] border border-[#bcc9ce]/40 transition-all cursor-pointer text-left active:scale-95 group"
            type="button"
            title="Ver o gestionar perfiles con correo y contraseña"
          >
            <span className="material-symbols-outlined text-[#006c51] text-[18px] group-hover:scale-110 transition-transform">
              shield_with_heart
            </span>
            <div className="flex flex-col">
              <span className="font-hud text-[9px] text-[#3d494d] uppercase leading-none font-bold truncate max-w-[120px] sm:max-w-[150px]">
                {activeAccount?.fullName || guardian?.title || 'Guardián del Agua'}
              </span>
              <span className="font-hud text-[11px] sm:text-[12px] text-[#00677d] font-bold leading-none mt-0.5">
                LV.{guardian?.level ?? 1} • {guardian?.currentXp ?? 0} XP
              </span>
            </div>
          </button>

          {/* Video Game Sound Effect Toggle Button */}
          <button
            onClick={handleToggleSound}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer relative ${
              !isSoundMuted
                ? 'bg-[#10e7b2]/20 border-[#10e7b2] text-[#006c51] shadow-[0_0_12px_rgba(16,231,178,0.4)]'
                : 'bg-[#edf5fc] hover:bg-[#e1e9f0] border-[#bcc9ce]/40 text-[#71828a]'
            }`}
            title={!isSoundMuted ? 'Sonidos de Videojuego ACTIVADOS (Clic para silenciar)' : 'Sonidos de Videojuego SILENCIADOS (Clic para activar)'}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">
              {!isSoundMuted ? 'sports_esports' : 'volume_off'}
            </span>
            {!isSoundMuted && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10e7b2] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00b4d8]" />
              </span>
            )}
          </button>

          {/* Quick Tools Menu Button */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-[#edf5fc] hover:bg-[#e1e9f0] border border-[#bcc9ce]/40 flex items-center justify-center text-[#00677d] transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Herramientas, Normativa y Perfiles"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">
                {menuOpen ? 'close' : 'apps'}
              </span>
            </button>

            {/* Quick Tools Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-12 w-68 rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_16px_36px_rgba(0,103,125,0.2)] border border-[#bcc9ce]/50 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                
                {/* User Profile Section in Dropdown */}
                <div className="px-3 py-1.5 text-[10px] font-hud uppercase tracking-wider text-[#00677d] font-extrabold border-b border-[#edf5fc] mb-1 flex items-center justify-between">
                  <span>Perfiles y Cuentas</span>
                  <span className="text-[9px] text-slate-400 font-normal">CLORAGUA ID</span>
                </div>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenProfileAuth?.('register');
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-[13px] font-medium text-[#151d22] hover:bg-[#edf5fc] flex items-center gap-2.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[#00b4d8] text-[18px]">
                    person_add
                  </span>
                  <div>
                    <div className="font-bold text-[12px] text-[#00677d]">Registrar Nuevo Perfil</div>
                    <div className="text-[10px] text-[#3d494d]">Mediante correo y contraseña</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenProfileAuth?.('saved');
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-[13px] font-medium text-[#151d22] hover:bg-[#edf5fc] flex items-center gap-2.5 transition-colors cursor-pointer mb-1 border-b border-[#edf5fc]"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[#10e7b2] text-[18px]">
                    switch_account
                  </span>
                  <div>
                    <div className="font-bold text-[12px]">Cambiar / Gestionar Cuentas</div>
                    <div className="text-[10px] text-[#3d494d]">Sesión: {activeAccount?.fullName}</div>
                  </div>
                </button>

                <div className="px-3 py-1.5 text-[10px] font-hud uppercase tracking-wider text-[#3d494d] font-bold border-b border-[#edf5fc] mb-1">
                  Herramientas Técnicas
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenVolumeCalc?.();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-[13px] font-medium text-[#151d22] hover:bg-[#edf5fc] flex items-center gap-2.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[#00b4d8] text-[18px]">
                    view_in_ar
                  </span>
                  <div>
                    <div className="font-bold text-[12px]">Calcular Volumen Tanque</div>
                    <div className="text-[10px] text-[#3d494d]">Cilindros, cisternas, cubos</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleOpenCalibrator();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-[13px] font-medium text-[#151d22] hover:bg-[#edf5fc] flex items-center gap-2.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[#10e7b2] text-[18px]">
                    tune
                  </span>
                  <div>
                    <div className="font-bold text-[12px]">Calibrar Dosificador</div>
                    <div className="text-[10px] text-[#3d494d]">Prueba de aforo y mL/min</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSolutionPrep?.();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-[13px] font-medium text-[#151d22] hover:bg-[#edf5fc] flex items-center gap-2.5 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[#00677d] text-[18px]">
                    science
                  </span>
                  <div>
                    <div className="font-bold text-[12px]">Preparar Solución Cloro</div>
                    <div className="text-[10px] text-[#3d494d]">Dilución C₁·V₁ = C₂·V₂</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenNormative?.();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-[13px] font-medium text-[#151d22] hover:bg-[#edf5fc] flex items-center gap-2.5 transition-colors border-t border-[#edf5fc] mt-1 cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[#93b100] text-[18px]">
                    menu_book
                  </span>
                  <div>
                    <div className="font-bold text-[12px]">Normativa D.S. 031-2010-SA</div>
                    <div className="text-[10px] text-[#3d494d]">LMP y Guías DIGESA/MINSA</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Profile Picture / Avatar button */}
          <button
            onClick={() => onOpenProfileAuth?.('profile')}
            className="relative min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
            title={`Perfil: ${activeAccount?.fullName || 'Operador'} (Clic para ver/registrar)`}
            type="button"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00b4d8] to-[#00677d] text-white flex items-center justify-center font-hud text-[13px] font-bold shadow-[0_0_12px_rgba(0,180,216,0.3)] ring-2 ring-[#4cd6fb]">
              {activeAccount?.fullName ? activeAccount.fullName.charAt(0).toUpperCase() : 'O'}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10e7b2] ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
};
