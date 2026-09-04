import { UserProfileAccount, UserRole, UserGuardianProfile } from '../types';
import { INITIAL_GUARDIAN } from './initialData';

const ACCOUNTS_STORAGE_KEY = 'cloragua_user_accounts';
const ACTIVE_ACCOUNT_ID_KEY = 'cloragua_active_account_id';

export const ROLE_LABELS: Record<UserRole, string> = {
  operador_jass: 'Operador Titular JASS',
  responsable_atm: 'Responsable ATM Municipal',
  inspector_salud: 'Inspector Sanitario (DIGESA / MINSA)',
  administrador_sistema: 'Administrador de Sistema Hídrico',
};

// Simple reversible base64 encoder for client-side stored passwords
export const encodePassword = (pwd: string): string => {
  try {
    return btoa(encodeURIComponent(pwd.trim()));
  } catch {
    return pwd.trim();
  }
};

export const verifyPassword = (rawPassword: string, storedHash: string): boolean => {
  return encodePassword(rawPassword) === storedHash;
};

// Seed initial default accounts
export const INITIAL_ACCOUNTS: UserProfileAccount[] = [
  {
    id: 'user-01',
    email: 'operador@cloragua.pe',
    passwordHash: encodePassword('cloragua2026'),
    fullName: 'Ing. Carlos Mendoza',
    role: 'operador_jass',
    roleLabel: 'Operador Titular JASS',
    organization: 'JASS Sector 1 - Lucma, Gran Chimú',
    phone: '+51 948 123 456',
    createdAt: '2026-01-15T08:00:00.000Z',
    lastLoginAt: new Date().toISOString(),
    guardian: INITIAL_GUARDIAN,
  },
  {
    id: 'user-02',
    email: 'atm@lucma.gob.pe',
    passwordHash: encodePassword('cloragua2026'),
    fullName: 'Tec. Marina Quispe',
    role: 'responsable_atm',
    roleLabel: 'Responsable ATM Municipal',
    organization: 'Área Técnica Municipal - Municipalidad Distrital de Lucma',
    phone: '+51 976 543 210',
    createdAt: '2026-02-01T09:30:00.000Z',
    lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
    guardian: {
      level: 5,
      title: 'Especialista Hídrico ATM',
      currentXp: 3820,
      nextLevelXp: 5000,
      streakDays: 28,
      totalVolumeTreatedLiters: 1450000,
      achievementsUnlocked: 10,
      totalAchievements: 12,
    },
  },
];

export const loadAccounts = (): UserProfileAccount[] => {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error cargando cuentas desde almacenamiento local:', err);
  }
  // Initialize with seed accounts
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
  return INITIAL_ACCOUNTS;
};

export const saveAccounts = (accounts: UserProfileAccount[]): void => {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error guardando cuentas en almacenamiento local:', err);
  }
};

export const getActiveAccount = (): UserProfileAccount => {
  const accounts = loadAccounts();
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
  if (activeId) {
    const found = accounts.find((a) => a.id === activeId);
    if (found) return found;
  }
  // Default to first account
  const fallback = accounts[0] || INITIAL_ACCOUNTS[0];
  localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, fallback.id);
  return fallback;
};

export const setActiveAccount = (account: UserProfileAccount): void => {
  localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, account.id);
  // Update last login
  const accounts = loadAccounts();
  const updated = accounts.map((a) =>
    a.id === account.id ? { ...a, lastLoginAt: new Date().toISOString() } : a
  );
  saveAccounts(updated);
};

export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: UserRole;
  organization: string;
  phone?: string;
}

export const registerAccount = (
  payload: RegisterPayload
): { success: boolean; account?: UserProfileAccount; error?: string } => {
  const trimmedEmail = payload.email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
    return { success: false, error: 'Por favor ingresa un correo electrónico válido (ej: operador@jass.org).' };
  }

  if (!payload.password || payload.password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres por seguridad.' };
  }

  if (payload.password !== payload.confirmPassword) {
    return { success: false, error: 'Las contraseñas no coinciden. Por favor verifica ambos campos.' };
  }

  if (!payload.fullName.trim()) {
    return { success: false, error: 'Por favor ingresa el nombre y apellidos completos del operador.' };
  }

  if (!payload.organization.trim()) {
    return { success: false, error: 'Por favor ingresa la Entidad, JASS o Municipio responsable.' };
  }

  const accounts = loadAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return { success: false, error: `El correo "${trimmedEmail}" ya está registrado con el perfil de ${existing.fullName}. Puedes iniciar sesión directamente.` };
  }

  // Initial guardian profile for new registrant
  const initialNewGuardian: UserGuardianProfile = {
    level: 1,
    title: 'Operador Sanitario Novato',
    currentXp: 100,
    nextLevelXp: 500,
    streakDays: 1,
    totalVolumeTreatedLiters: 0,
    achievementsUnlocked: 1,
    totalAchievements: 12,
  };

  const newAccount: UserProfileAccount = {
    id: `user-${Date.now()}`,
    email: trimmedEmail,
    passwordHash: encodePassword(payload.password),
    fullName: payload.fullName.trim(),
    role: payload.role,
    roleLabel: ROLE_LABELS[payload.role] || 'Operador Sanitario',
    organization: payload.organization.trim(),
    phone: payload.phone?.trim() || '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    guardian: initialNewGuardian,
  };

  const updatedList = [newAccount, ...accounts];
  saveAccounts(updatedList);
  setActiveAccount(newAccount);

  return { success: true, account: newAccount };
};

export const loginAccount = (
  email: string,
  rawPassword: string
): { success: boolean; account?: UserProfileAccount; error?: string } => {
  const trimmedEmail = email.trim().toLowerCase();
  const accounts = loadAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);

  if (!found) {
    return {
      success: false,
      error: `No se encontró ninguna cuenta registrada con el correo "${trimmedEmail}". Puedes registrarte en la pestaña "Registrar Perfil".`,
    };
  }

  if (!verifyPassword(rawPassword, found.passwordHash)) {
    return {
      success: false,
      error: 'Contraseña incorrecta. Por favor verifica tus credenciales.',
    };
  }

  setActiveAccount(found);
  return { success: true, account: found };
};

export const updateAccountProfile = (
  userId: string,
  updates: Partial<UserProfileAccount>,
  newPassword?: string
): UserProfileAccount | null => {
  const accounts = loadAccounts();
  let updatedAccount: UserProfileAccount | null = null;

  const updatedList = accounts.map((acc) => {
    if (acc.id === userId) {
      const merged: UserProfileAccount = {
        ...acc,
        ...updates,
        passwordHash: newPassword && newPassword.length >= 6 ? encodePassword(newPassword) : acc.passwordHash,
      };
      if (updates.role) {
        merged.roleLabel = ROLE_LABELS[updates.role] || merged.roleLabel;
      }
      updatedAccount = merged;
      return merged;
    }
    return acc;
  });

  if (updatedAccount) {
    saveAccounts(updatedList);
  }
  return updatedAccount;
};

export const deleteAccountById = (userId: string): boolean => {
  const accounts = loadAccounts();
  if (accounts.length <= 1) {
    return false; // Don't delete the last remaining account
  }
  const filtered = accounts.filter((a) => a.id !== userId);
  saveAccounts(filtered);
  // If active account was deleted, switch to first available
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
  if (activeId === userId) {
    setActiveAccount(filtered[0]);
  }
  return true;
};
