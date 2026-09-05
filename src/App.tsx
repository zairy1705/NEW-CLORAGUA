import React, { useState, useEffect } from 'react';
import {
  WaterSystem,
  SurveillanceRecord,
  UserGuardianProfile,
  NormativeParameters,
  UserProfileAccount,
} from './types';
import {
  INITIAL_SYSTEMS,
  INITIAL_RECORDS,
  INITIAL_GUARDIAN,
  INITIAL_NORMATIVE,
} from './utils/initialData';
import {
  getActiveAccount,
  setActiveAccount,
  updateAccountProfile,
} from './utils/authStorage';
import { Header } from './components/Header';
import { BottomNavigation, MainTab } from './components/BottomNavigation';
import { DashboardHudView } from './components/views/DashboardHudView';
import { DosifierWizardView } from './components/views/DosifierWizardView';
import { SystemsView } from './components/views/SystemsView';
import { RecordsView } from './components/views/RecordsView';
import { HomeView } from './components/views/HomeView';
import { NormativeModal } from './components/modals/NormativeModal';
import { CalibratePumpModal } from './components/modals/CalibratePumpModal';
import { SolutionPrepModal } from './components/modals/SolutionPrepModal';
import { SystemFormModal } from './components/modals/SystemFormModal';
import { UserProfileAuthModal } from './components/modals/UserProfileAuthModal';
import { CameraDpdScanModal } from './components/modals/CameraDpdScanModal';
import { InteractiveWaterEngine } from './components/InteractiveWaterEngine';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentTab, setCurrentTab] = useState<MainTab>('inicio');

  // Accounts and active profile authentication state
  const [activeAccount, setActiveAccountState] = useState<UserProfileAccount>(() => getActiveAccount());
  const [isProfileAuthOpen, setIsProfileAuthOpen] = useState<boolean>(false);
  const [profileAuthInitialTab, setProfileAuthInitialTab] = useState<'register' | 'login' | 'saved' | 'profile'>('register');

  // Persistence with localStorage
  const [systems, setSystems] = useState<WaterSystem[]>(() => {
    const saved = localStorage.getItem('cloragua_systems');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_SYSTEMS;
  });

  const [activeSystemId, setActiveSystemId] = useState<string>(() => {
    return systems[0]?.id || 'sys-1';
  });

  const [records, setRecords] = useState<SurveillanceRecord[]>(() => {
    const saved = localStorage.getItem('cloragua_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_RECORDS;
  });

  const [guardian, setGuardian] = useState<UserGuardianProfile>(() => {
    return activeAccount?.guardian || INITIAL_GUARDIAN;
  });

  const [normative] = useState<NormativeParameters>(INITIAL_NORMATIVE);

  // Modals state
  const [isNormativeOpen, setIsNormativeOpen] = useState<boolean>(false);
  const [isCalibrateOpen, setIsCalibrateOpen] = useState<boolean>(false);
  const [isSolutionPrepOpen, setIsSolutionPrepOpen] = useState<boolean>(false);
  const [isSystemFormOpen, setIsSystemFormOpen] = useState<boolean>(false);
  const [systemFormMode, setSystemFormMode] = useState<'create' | 'edit'>('create');
  const [systemToEdit, setSystemToEdit] = useState<WaterSystem | null>(null);
  const [isCameraScanOpen, setIsCameraScanOpen] = useState<boolean>(false);

  // Handle active account changes (Registration, Login, Switch)
  const handleAccountChange = (newAccount: UserProfileAccount) => {
    setActiveAccountState(newAccount);
    setActiveAccount(newAccount);
    if (newAccount.guardian) {
      setGuardian(newAccount.guardian);
    }
  };

  const handleOpenProfileAuth = (tab: 'register' | 'login' | 'saved' | 'profile' = 'register') => {
    setProfileAuthInitialTab(tab);
    setIsProfileAuthOpen(true);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('cloragua_systems', JSON.stringify(systems));
  }, [systems]);

  useEffect(() => {
    localStorage.setItem('cloragua_records', JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem('cloragua_guardian', JSON.stringify(guardian));
    // Also sync with active account guardian
    if (activeAccount?.id) {
      updateAccountProfile(activeAccount.id, { guardian });
    }
  }, [guardian, activeAccount?.id]);

  const activeSystem = systems.find((s) => s.id === activeSystemId) || systems[0] || INITIAL_SYSTEMS[0];

  const handleRewardXp = (amount: number, reason: string) => {
    setGuardian((prev) => {
      let newXp = prev.currentXp + amount;
      let newLevel = prev.level;
      let newNextXp = prev.nextLevelXp;
      let newRank = prev.title;

      if (newXp >= prev.nextLevelXp) {
        newLevel += 1;
        newNextXp = Math.round(prev.nextLevelXp * 1.5);
        if (newLevel >= 15) newRank = 'Maestro Supervisor Regional DIGESA';
        else if (newLevel >= 10) newRank = 'Especialista en Cloración y Desinfección';
        else if (newLevel >= 5) newRank = 'Guardián del Agua Certificado';

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.4 },
          colors: ['#00b4d8', '#43fec7', '#caf300', '#ffffff'],
        });
      }

      return {
        ...prev,
        level: newLevel,
        currentXp: newXp,
        nextLevelXp: newNextXp,
        title: newRank,
      };
    });
  };

  const handleSaveRecord = (recordData: Omit<SurveillanceRecord, 'id' | 'timestamp'>) => {
    const postPpm = recordData.postChlorinePpm ?? recordData.targetChlorinePpm;
    const newRecord: SurveillanceRecord = {
      ...recordData,
      id: `rec-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };

    setRecords((prev) => [newRecord, ...prev]);

    // Update system's last chlorine ppm & inspection
    setSystems((prev) =>
      prev.map((s) =>
        s.id === newRecord.systemId
          ? {
              ...s,
              lastChlorinePpm: postPpm,
              operationalStatus:
                postPpm >= normative.minFreeChlorine &&
                postPpm <= normative.maxFreeChlorine
                  ? 'active'
                  : 'alert',
              lastInspectionDate: 'Hoy',
            }
          : s
      )
    );
  };

  const handleOpenCreateSystem = () => {
    setSystemFormMode('create');
    setSystemToEdit(null);
    setIsSystemFormOpen(true);
  };

  const handleOpenEditSystem = (sys: WaterSystem) => {
    setSystemFormMode('edit');
    setSystemToEdit(sys);
    setIsSystemFormOpen(true);
  };

  const handleSaveSystem = (systemData: WaterSystem) => {
    if (systemFormMode === 'create') {
      setSystems((prev) => [systemData, ...prev]);
      setActiveSystemId(systemData.id);
      handleRewardXp(60, 'Nuevo Sistema de Agua Registrado');
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00b4d8', '#43fec7', '#caf300'],
      });
    } else {
      setSystems((prev) =>
        prev.map((s) => (s.id === systemData.id ? systemData : s))
      );
      handleRewardXp(30, 'Parámetros del Sistema Actualizados');
    }
  };

  const handleDeleteSystem = (id: string) => {
    if (systems.length <= 1) return;
    const remaining = systems.filter((s) => s.id !== id);
    setSystems(remaining);
    if (activeSystemId === id) {
      setActiveSystemId(remaining[0].id);
    }
  };

  const handleApplyCameraReading = (ppm: number, _photoDataUrl?: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const status =
      ppm >= normative.minFreeChlorine && ppm <= normative.maxFreeChlorine
        ? 'optimal'
        : ppm < normative.minFreeChlorine
        ? 'danger'
        : 'warning';

    handleSaveRecord({
      systemId: activeSystem.id,
      systemName: activeSystem.name,
      centerPoblado: activeSystem.centerPoblado,
      measurementPoint: 'Salida de Reservorio / Celda Fotométrica DPD',
      volumeLiters: activeSystem.currentVolumeLiters,
      productName: 'Hipoclorito de Calcio 70%',
      concentrationPercent: 70,
      initialChlorinePpm: activeSystem.lastChlorinePpm,
      targetChlorinePpm: ppm,
      postChlorinePpm: ppm,
      calculatedDoseValue: 0,
      calculatedDoseUnit: 'g',
      contactTimeMinutes: 30,
      status,
      ph: 7.2,
      turbidityNtu: 1.1,
      responsible: activeAccount?.fullName || guardian.name || 'Operador en Turno',
      observations: `Medición analizada y capturada mediante Escáner Óptico de Cámara DPD (${ppm.toFixed(2)} ppm Cl₂ libre residual).`,
      xpEarned: 50,
      isAudited: true,
      dateStr,
      timeStr,
    });
    handleRewardXp(50, 'Escaneo DPD con Cámara Registrado');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#00b4d8', '#10e7b2', '#ff4081', '#caf300'],
    });
  };

  return (
    <div className="min-h-screen bg-transparent text-[#151d22] flex flex-col font-sans selection:bg-[#00b4d8] selection:text-white relative overflow-x-hidden">
      {/* 0. Realtime Interactive Water Engine (Active across all pages) */}
      <InteractiveWaterEngine />

      {/* Institutional Top Header */}
      <Header
        currentTabTitle={
          currentTab === 'inicio'
            ? 'Portal Principal'
            : currentTab === 'hud'
            ? 'Bio-Telemetría HUD'
            : currentTab === 'dosis'
            ? 'Asistente de Dosificación'
            : currentTab === 'sistemas'
            ? 'Red de Sistemas'
            : 'Bitácora Oficial'
        }
        guardian={guardian}
        activeAccount={activeAccount}
        onOpenProfileAuth={handleOpenProfileAuth}
        onOpenNormative={() => setIsNormativeOpen(true)}
        onOpenCalibrator={() => setIsCalibrateOpen(true)}
        onOpenCalibrate={() => setIsCalibrateOpen(true)}
        onOpenSolutionPrep={() => setIsSolutionPrepOpen(true)}
        onOpenVolumeCalc={() => setCurrentTab('dosis')}
        onNavigateHome={() => setCurrentTab('inicio')}
        onOpenDpdCamera={() => setIsCameraScanOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 relative z-10">
        {currentTab === 'inicio' && (
          <HomeView
            systems={systems}
            guardian={guardian}
            activeAccount={activeAccount}
            records={records}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSelectSystemForDosage={(sys) => {
              setActiveSystemId(sys.id);
              setCurrentTab('dosis');
            }}
            onOpenNormative={() => setIsNormativeOpen(true)}
            onOpenCalibrate={() => setIsCalibrateOpen(true)}
            onOpenSolutionPrep={() => setIsSolutionPrepOpen(true)}
            onOpenProfileAuth={handleOpenProfileAuth}
            onAddNewSystem={handleOpenCreateSystem}
            onOpenDpdCamera={() => setIsCameraScanOpen(true)}
          />
        )}

        {currentTab === 'hud' && (
          <DashboardHudView
            systems={systems}
            activeSystem={activeSystem}
            onSelectSystem={(sys) => setActiveSystemId(sys.id)}
            guardian={guardian}
            onNavigateToDosage={(sys) => {
              if (sys) setActiveSystemId(sys.id);
              setCurrentTab('dosis');
            }}
            onNavigateToSystems={() => setCurrentTab('sistemas')}
            onNavigateToRecords={() => setCurrentTab('registro')}
            onRewardXp={handleRewardXp}
          />
        )}

        {currentTab === 'dosis' && (
          <DosifierWizardView
            activeSystem={activeSystem}
            onSwitchSystem={(sys) => setActiveSystemId(sys.id)}
            systems={systems}
            normative={normative}
            onSaveRecord={handleSaveRecord}
            onRewardXp={handleRewardXp}
          />
        )}

        {currentTab === 'sistemas' && (
          <SystemsView
            systems={systems}
            activeSystem={activeSystem}
            onSelectSystem={(sys) => setActiveSystemId(sys.id)}
            onNavigateToDosage={(sys) => {
              setActiveSystemId(sys.id);
              setCurrentTab('dosis');
            }}
            onAddNewSystem={handleOpenCreateSystem}
            onEditSystem={handleOpenEditSystem}
            onDeleteSystem={handleDeleteSystem}
          />
        )}

        {currentTab === 'registro' && (
          <RecordsView
            records={records}
            onOpenNormative={() => setIsNormativeOpen(true)}
          />
        )}
      </main>

      {/* Persistent Tactile Bottom Navigation */}
      <BottomNavigation
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
      />

      {/* Technical Modals */}
      <NormativeModal
        isOpen={isNormativeOpen}
        onClose={() => setIsNormativeOpen(false)}
      />
      <CalibratePumpModal
        isOpen={isCalibrateOpen}
        onClose={() => setIsCalibrateOpen(false)}
        onRewardXp={handleRewardXp}
      />
      <SolutionPrepModal
        isOpen={isSolutionPrepOpen}
        onClose={() => setIsSolutionPrepOpen(false)}
        onRewardXp={handleRewardXp}
      />
      <SystemFormModal
        isOpen={isSystemFormOpen}
        mode={systemFormMode}
        systemToEdit={systemToEdit}
        onClose={() => setIsSystemFormOpen(false)}
        onSave={handleSaveSystem}
      />
      <UserProfileAuthModal
        isOpen={isProfileAuthOpen}
        onClose={() => setIsProfileAuthOpen(false)}
        activeAccount={activeAccount}
        onAccountChange={handleAccountChange}
        initialTab={profileAuthInitialTab}
      />
      <CameraDpdScanModal
        isOpen={isCameraScanOpen}
        onClose={() => setIsCameraScanOpen(false)}
        onApplyReading={handleApplyCameraReading}
        systemName={activeSystem.name}
      />
    </div>
  );
}
