import React, { useState } from 'react';
import { UserProfileAccount, UserRole } from '../../types';
import {
  ROLE_LABELS,
  registerAccount,
  loginAccount,
  updateAccountProfile,
  deleteAccountById,
  loadAccounts,
} from '../../utils/authStorage';
import confetti from 'canvas-confetti';

interface UserProfileAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAccount: UserProfileAccount;
  onAccountChange: (account: UserProfileAccount) => void;
  initialTab?: 'register' | 'login' | 'saved' | 'profile';
}

export const UserProfileAuthModal: React.FC<UserProfileAuthModalProps> = ({
  isOpen,
  onClose,
  activeAccount,
  onAccountChange,
  initialTab = 'register',
}) => {
  const [tab, setTab] = useState<'register' | 'login' | 'saved' | 'profile'>(initialTab);
  const [accounts, setAccounts] = useState<UserProfileAccount[]>(() => loadAccounts());

  // Registration form states
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('operador_jass');
  const [regOrg, setRegOrg] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Edit profile states
  const [editName, setEditName] = useState(activeAccount.fullName);
  const [editOrg, setEditOrg] = useState(activeAccount.organization);
  const [editRole, setEditRole] = useState<UserRole>(activeAccount.role);
  const [editPhone, setEditPhone] = useState(activeAccount.phone || '');
  const [editNewPassword, setEditNewPassword] = useState('');

  // Status message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshAccounts = () => {
    setAccounts(loadAccounts());
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = registerAccount({
      email: regEmail,
      password: regPassword,
      confirmPassword: regConfirmPassword,
      fullName: regFullName,
      role: regRole,
      organization: regOrg,
      phone: regPhone,
    });

    if (!result.success || !result.account) {
      setErrorMsg(result.error || 'Error al registrar el perfil.');
      return;
    }

    refreshAccounts();
    onAccountChange(result.account);
    setSuccessMsg(`¡Perfil de "${result.account.fullName}" creado con éxito! Sesión iniciada.`);

    // Reset fields
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegFullName('');
    setRegOrg('');
    setRegPhone('');

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00b4d8', '#10e7b2', '#00677d', '#caf300'],
    });

    setTimeout(() => {
      setSuccessMsg(null);
      setTab('profile');
    }, 1800);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const result = loginAccount(loginEmail, loginPassword);
    if (!result.success || !result.account) {
      setErrorMsg(result.error || 'Credenciales no válidas.');
      return;
    }

    refreshAccounts();
    onAccountChange(result.account);
    setSuccessMsg(`¡Bienvenido de nuevo, ${result.account.fullName}!`);
    setLoginPassword('');

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00b4d8', '#10e7b2'],
    });

    setTimeout(() => {
      setSuccessMsg(null);
      setTab('profile');
    }, 1200);
  };

  const handleQuickLogin = (email: string, samplePass: string) => {
    setLoginEmail(email);
    setLoginPassword(samplePass);
    const result = loginAccount(email, samplePass);
    if (result.success && result.account) {
      refreshAccounts();
      onAccountChange(result.account);
      setSuccessMsg(`Sesión cambiada a ${result.account.fullName}`);
      setTimeout(() => {
        setSuccessMsg(null);
        setTab('profile');
      }, 1000);
    }
  };

  const handleSwitchAccount = (target: UserProfileAccount) => {
    setErrorMsg(null);
    setSuccessMsg(`Cambiando sesión a ${target.fullName}...`);
    onAccountChange(target);
    refreshAccounts();
    setTimeout(() => {
      setSuccessMsg(null);
      setTab('profile');
    }, 600);
  };

  const handleDeleteAccount = (targetId: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el perfil de "${name}" de este dispositivo?`)) {
      const ok = deleteAccountById(targetId);
      if (ok) {
        refreshAccounts();
        setSuccessMsg(`Perfil eliminado.`);
        setTimeout(() => setSuccessMsg(null), 2000);
      } else {
        setErrorMsg('No se puede eliminar el único perfil disponible.');
      }
    }
  };

  const handleSaveProfileEdits = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const updated = updateAccountProfile(
      activeAccount.id,
      {
        fullName: editName.trim() || activeAccount.fullName,
        organization: editOrg.trim() || activeAccount.organization,
        role: editRole,
        phone: editPhone.trim(),
      },
      editNewPassword.trim() ? editNewPassword.trim() : undefined
    );

    if (updated) {
      onAccountChange(updated);
      refreshAccounts();
      setEditNewPassword('');
      setSuccessMsg('¡Datos de perfil actualizados con éxito!');
      setTimeout(() => setSuccessMsg(null), 2500);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Vacía', color: 'bg-slate-200', pct: 0 };
    if (pwd.length < 6) return { label: 'Muy corta (mín. 6 car.)', color: 'bg-rose-500', pct: 25 };
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    const score = (pwd.length >= 8 ? 1 : 0) + (hasLetters ? 1 : 0) + (hasNumbers ? 1 : 0) + (hasSpecial ? 1 : 0);

    if (score <= 2) return { label: 'Básica', color: 'bg-amber-500', pct: 50 };
    if (score === 3) return { label: 'Segura', color: 'bg-cyan-500', pct: 75 };
    return { label: 'Óptima', color: 'bg-emerald-500', pct: 100 };
  };

  const pwdStrength = getPasswordStrength(regPassword);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_24px_50px_-12px_rgba(0,103,125,0.3)] border border-white flex flex-col max-h-[92vh] overflow-hidden text-[#151d22]">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#edf5fc] flex items-center justify-between bg-gradient-to-r from-[#f0f9ff] via-[#e6f4fa] to-[#f0fdf9]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00b4d8] to-[#00677d] flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
            </div>
            <div className="flex flex-col">
              <span className="font-hud text-[10px] text-[#00677d] uppercase tracking-widest font-bold">
                CLORAGUA ID • Saneamiento Rural
              </span>
              <h2 className="text-[17px] sm:text-[19px] font-extrabold text-[#151d22] font-hud leading-tight">
                Registro y Gestión de Perfiles
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-[#f8fafc] border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-hud text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              tab === 'register'
                ? 'bg-[#00b4d8] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Registrar Perfil</span>
          </button>

          <button
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-hud text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              tab === 'login'
                ? 'bg-[#00b4d8] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">login</span>
            <span>Iniciar Sesión</span>
          </button>

          <button
            onClick={() => {
              setTab('saved');
              refreshAccounts();
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-hud text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              tab === 'saved'
                ? 'bg-[#00b4d8] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">switch_account</span>
            <span>Perfiles ({accounts.length})</span>
          </button>

          <button
            onClick={() => {
              setTab('profile');
              setEditName(activeAccount.fullName);
              setEditOrg(activeAccount.organization);
              setEditRole(activeAccount.role);
              setEditPhone(activeAccount.phone || '');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`px-3 py-1.5 rounded-xl font-hud text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ml-auto ${
              tab === 'profile'
                ? 'bg-[#00677d] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">badge</span>
            <span>Mi Perfil</span>
          </button>
        </div>

        {/* Global Error / Success Messages */}
        {errorMsg && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[12px] flex items-start gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">
              error
            </span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] flex items-start gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">
              check_circle
            </span>
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(92vh-180px)] space-y-4">
          
          {/* TAB 1: REGISTRAR NUEVO PERFIL */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3 rounded-2xl bg-[#f0f9ff] border border-cyan-100 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#00677d] text-[22px]">
                  info
                </span>
                <p className="text-[12px] text-[#004e5f] leading-relaxed">
                  Registra tu perfil con <strong>correo institucional o personal y contraseña</strong>. Podrás guardar tus bitácoras de vigilancia, firmar reportes oficiales y asociar tus sistemas de agua.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d] mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ej: operador.jass@gmail.com o jass@comunidad.pe"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d]">
                      Contraseña *
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Mínimo 6 car.</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                      lock
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showRegPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {/* Strength bar */}
                  {regPassword && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${pwdStrength.color} transition-all duration-300`}
                          style={{ width: `${pwdStrength.pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-hud font-bold text-slate-500">
                        {pwdStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d] mb-1">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                      lock_reset
                    </span>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                    />
                    {regConfirmPassword && regConfirmPassword === regPassword && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-emerald-500 text-[18px]">
                        check_circle
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d] mb-1">
                  Nombre y Apellidos del Operador / Especialista *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="ej: Ing. Roberto Huamán o Juan Pérez"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                  />
                </div>
              </div>

              {/* Role and Organization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d] mb-1">
                    Cargo / Rol Institucional *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8] cursor-pointer"
                  >
                    <option value="operador_jass">{ROLE_LABELS.operador_jass}</option>
                    <option value="responsable_atm">{ROLE_LABELS.responsable_atm}</option>
                    <option value="inspector_salud">{ROLE_LABELS.inspector_salud}</option>
                    <option value="administrador_sistema">{ROLE_LABELS.administrador_sistema}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d] mb-1">
                    Entidad / JASS / Municipio *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                      apartment
                    </span>
                    <input
                      type="text"
                      required
                      value={regOrg}
                      onChange={(e) => setRegOrg(e.target.value)}
                      placeholder="ej: JASS San Jerónimo o ATM Lucma"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d] mb-1">
                  Teléfono / WhatsApp de Contacto (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                    phone
                  </span>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00b4d8] via-[#00677d] to-[#004e5f] text-white font-hud text-[13px] font-extrabold shadow-[0_4px_16px_rgba(0,180,216,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    person_add
                  </span>
                  <span>Registrar y Crear Perfil de Operador</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: INICIAR SESIÓN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-3 rounded-2xl bg-[#f0fdf9] border border-emerald-100 flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-700 text-[22px]">
                  verified_user
                </span>
                <p className="text-[12px] text-emerald-900 leading-relaxed">
                  Ingresa con tu correo y contraseña registrados para acceder a tu historial personalizado y nivel de Guardián del Agua.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d] mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="operador@cloragua.pe"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d] mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">
                    lock
                  </span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:outline-none focus:ring-2 focus:ring-[#00b4d8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showLoginPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#00b4d8] to-[#00677d] text-white font-hud text-[13px] font-extrabold shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span>Iniciar Sesión</span>
                </button>
              </div>

              {/* Demo Accounts Quick Access */}
              <div className="pt-3 border-t border-slate-100">
                <span className="block text-[10px] font-hud uppercase tracking-wider font-bold text-slate-500 mb-2">
                  Cuentas de Demostración Rápidas (1 Clic):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('operador@cloragua.pe', 'cloragua2026')}
                    className="p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/70 hover:bg-cyan-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[12px] text-[#00677d]">Ing. Carlos Mendoza</div>
                    <div className="text-[10px] text-slate-600">operador@cloragua.pe (JASS)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('atm@lucma.gob.pe', 'cloragua2026')}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-[12px] text-emerald-800">Tec. Marina Quispe</div>
                    <div className="text-[10px] text-slate-600">atm@lucma.gob.pe (ATM)</div>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: PERFILES GUARDADOS EN EL TERMINAL */}
          {tab === 'saved' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-hud uppercase tracking-wider font-bold text-slate-500">
                  Perfiles Registrados en este Dispositivo ({accounts.length})
                </span>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="text-[11px] font-hud font-bold text-[#00b4d8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Nuevo Perfil</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {accounts.map((acc) => {
                  const isActive = acc.id === activeAccount.id;
                  return (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#f0f9ff] to-[#f0fdf9] border-[#00b4d8] shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00b4d8] to-[#00677d] text-white flex items-center justify-center font-hud text-[16px] font-extrabold shadow-sm shrink-0">
                          {acc.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[13px] text-[#151d22]">
                              {acc.fullName}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-[#10e7b2]/20 text-[#00677d] border border-[#10e7b2]/50 text-[9px] font-hud font-extrabold uppercase">
                                Activo
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#00677d] font-semibold">
                            {acc.roleLabel} • {acc.organization}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {acc.email} • DNI: {acc.dni || 'Registrado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => handleSwitchAccount(acc)}
                            className="px-3 py-1.5 rounded-xl bg-[#edf5fc] hover:bg-[#00b4d8] hover:text-white text-[#00677d] font-hud text-[11px] font-bold transition-all cursor-pointer border border-[#bcc9ce]/40 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              swap_horiz
                            </span>
                            <span>Usar Perfil</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-hud text-emerald-600 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            <span>Sesión Actual</span>
                          </span>
                        )}

                        {accounts.length > 1 && !isActive && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.id, acc.fullName)}
                            className="w-8 h-8 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Eliminar perfil guardado"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MI PERFIL ACTUAL (EDITAR O REVISAR) */}
          {tab === 'profile' && (
            <div className="space-y-4">
              {/* Profile Card Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#003643] via-[#004e5f] to-[#001f27] text-white flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00b4d8] to-[#10e7b2] text-[#002116] flex items-center justify-center font-hud text-[24px] font-black shadow-lg">
                  {activeAccount.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-[16px] sm:text-[18px] font-extrabold font-hud">
                      {activeAccount.fullName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#10e7b2]/20 text-cyan-200 border border-cyan-400/40 text-[10px] font-hud uppercase font-bold">
                      {activeAccount.roleLabel}
                    </span>
                  </div>
                  <div className="text-[12px] text-cyan-100 font-medium mt-0.5">
                    {activeAccount.email} • {activeAccount.organization}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 text-[11px] font-hud text-cyan-300">
                    <span>{activeAccount.guardian.title}</span>
                    <span>•</span>
                    <span>DNI: {activeAccount.dni || '72948102'}</span>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <form onSubmit={handleSaveProfileEdits} className="space-y-3 pt-2">
                <span className="block text-[11px] font-hud uppercase tracking-wider font-bold text-[#3d494d]">
                  Editar Datos de Operador
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-hud uppercase font-bold text-[#3d494d] mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:ring-2 focus:ring-[#00b4d8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-hud uppercase font-bold text-[#3d494d] mb-1">
                      Entidad / JASS
                    </label>
                    <input
                      type="text"
                      value={editOrg}
                      onChange={(e) => setEditOrg(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:ring-2 focus:ring-[#00b4d8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-hud uppercase font-bold text-[#3d494d] mb-1">
                      Cargo / Rol
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:ring-2 focus:ring-[#00b4d8]"
                    >
                      <option value="operador_jass">{ROLE_LABELS.operador_jass}</option>
                      <option value="responsable_atm">{ROLE_LABELS.responsable_atm}</option>
                      <option value="inspector_salud">{ROLE_LABELS.inspector_salud}</option>
                      <option value="administrador_sistema">{ROLE_LABELS.administrador_sistema}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-hud uppercase font-bold text-[#3d494d] mb-1">
                      Teléfono / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:ring-2 focus:ring-[#00b4d8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-hud uppercase font-bold text-[#3d494d] mb-1">
                    Cambiar Contraseña (Opcional)
                  </label>
                  <input
                    type="password"
                    value={editNewPassword}
                    onChange={(e) => setEditNewPassword(e.target.value)}
                    placeholder="Dejar vacío para conservar la contraseña actual"
                    className="w-full px-3 py-2 rounded-xl border border-[#bcc9ce]/60 bg-white text-[13px] font-medium text-[#151d22] focus:ring-2 focus:ring-[#00b4d8]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#00677d] hover:bg-[#005162] text-white font-hud text-[12px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[17px]">save</span>
                    <span>Guardar Cambios</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTab('login');
                      setErrorMsg(null);
                      setSuccessMsg('Sesión cerrada. Inicia sesión con otro perfil o regístrate.');
                    }}
                    className="py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-hud text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[17px]">logout</span>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 bg-[#f8fafc] border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-hud">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Perfil Activo: <strong>{activeAccount.fullName}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-hud font-bold text-[11px] cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
