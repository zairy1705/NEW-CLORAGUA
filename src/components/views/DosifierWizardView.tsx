import React, { useState, useMemo } from 'react';
import { WaterSystem, TankType, TankDimensions, ChlorineProduct, ChlorineProductType, SurveillanceRecord, NormativeParameters } from '../../types';
import { calculateTankVolume, calculateChlorineDosage, calculateAdvancedTechnical } from '../../utils/calculations';
import { COMMON_PRODUCTS } from '../../utils/initialData';
import { TankVisualizer } from '../TankVisualizer';
import confetti from 'canvas-confetti';

interface DosifierWizardViewProps {
  activeSystem: WaterSystem;
  onSwitchSystem: (sys: WaterSystem) => void;
  systems: WaterSystem[];
  normative: NormativeParameters;
  onSaveRecord: (record: Omit<SurveillanceRecord, 'id' | 'timestamp'>) => void;
  onRewardXp: (xp: number, reason: string) => void;
}

export const DosifierWizardView: React.FC<DosifierWizardViewProps> = ({
  activeSystem,
  onSwitchSystem,
  systems,
  normative,
  onSaveRecord,
  onRewardXp,
}) => {
  // Wizard active step: 1 to 7 or direct view
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [advancedMode, setAdvancedMode] = useState<boolean>(false);

  // Step 1 & 2: Tank and dimensions state
  const [tankType, setTankType] = useState<TankType>(activeSystem.tankType);
  const [diameterMeters, setDiameterMeters] = useState<number>(4.0);
  const [radiusMeters, setRadiusMeters] = useState<number>(2.0);
  const [useRadius, setUseRadius] = useState<boolean>(false);
  const [totalHeightMeters, setTotalHeightMeters] = useState<number>(3.0);
  const [waterHeightMeters, setWaterHeightMeters] = useState<number>(2.5);

  // Rectangular
  const [lengthMeters, setLengthMeters] = useState<number>(8.0);
  const [widthMeters, setWidthMeters] = useState<number>(5.0);

  // Cubic
  const [sideMeters, setSideMeters] = useState<number>(3.0);

  // Cylindrical horizontal
  const [horizLengthMeters, setHorizLengthMeters] = useState<number>(6.0);
  const [horizDiameterMeters, setHorizDiameterMeters] = useState<number>(2.5);
  const [horizWaterLevelMeters, setHorizWaterLevelMeters] = useState<number>(1.8);

  // Direct volume
  const [directValue, setDirectValue] = useState<number>(activeSystem.capacityLiters);
  const [directUnit, setDirectUnit] = useState<'L' | 'm3'>('L');

  // Step 3: Product state
  const [selectedProductType, setSelectedProductType] = useState<ChlorineProductType>('sodium_hypochlorite');
  const [concentrationPercent, setConcentrationPercent] = useState<number>(12.0);
  const [isCustomProduct, setIsCustomProduct] = useState<boolean>(false);

  // Step 4: Chlorine residual measurements
  const [currentResidualPpm, setCurrentResidualPpm] = useState<number>(0.6);
  const [targetResidualPpm, setTargetResidualPpm] = useState<number>(2.0);
  const [chlorineDemandPpm, setChlorineDemandPpm] = useState<number>(0.2);

  // Advanced mode parameters
  const [flowRateLps, setFlowRateLps] = useState<number>(10.0); // L/s
  const [contactTimeMinutes, setContactTimeMinutes] = useState<number>(30);
  const [phLevel, setPhLevel] = useState<number>(7.2);
  const [turbidityNtu, setTurbidityNtu] = useState<number>(0.4);
  const [temperatureC, setTemperatureC] = useState<number>(21.4);

  // Step 6: Post-dosing verification
  const [measuredPostResidualPpm, setMeasuredPostResidualPpm] = useState<number>(1.9);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Step 7: Record operator notes
  const [responsibleName, setResponsibleName] = useState<string>(activeSystem.responsible || 'Operador Sanitario');
  const [observationNotes, setObservationNotes] = useState<string>('');
  const [hasRegistered, setHasRegistered] = useState<boolean>(false);

  // Build tank dimensions object
  const dimensions: TankDimensions = useMemo(() => {
    return {
      type: tankType,
      diameterMeters: useRadius ? radiusMeters * 2 : diameterMeters,
      radiusMeters: useRadius ? radiusMeters : diameterMeters / 2,
      totalHeightMeters,
      waterHeightMeters,
      lengthMeters,
      widthMeters,
      sideMeters,
      horizontalLengthMeters: horizLengthMeters,
      horizontalDiameterMeters: horizDiameterMeters,
      horizontalWaterLevelMeters: horizWaterLevelMeters,
      directValue,
      directUnit,
    };
  }, [
    tankType,
    diameterMeters,
    radiusMeters,
    useRadius,
    totalHeightMeters,
    waterHeightMeters,
    lengthMeters,
    widthMeters,
    sideMeters,
    horizLengthMeters,
    horizDiameterMeters,
    horizWaterLevelMeters,
    directValue,
    directUnit,
  ]);

  // Calculate volume
  const volumeResult = useMemo(() => {
    return calculateTankVolume(dimensions);
  }, [dimensions]);

  // Selected product object
  const currentProduct: ChlorineProduct = useMemo(() => {
    if (selectedProductType === 'sodium_hypochlorite') {
      return {
        type: 'sodium_hypochlorite',
        name: 'Hipoclorito de Sodio Líquido',
        form: 'liquid',
        concentrationPercent,
        description: `Hipoclorito de Sodio al ${concentrationPercent}% de cloro activo`,
      };
    }
    if (selectedProductType === 'calcium_hypochlorite') {
      return {
        type: 'calcium_hypochlorite',
        name: 'Hipoclorito de Calcio Granular',
        form: 'granular',
        concentrationPercent,
        description: `Hipoclorito de Calcio granular concentrado (${concentrationPercent}%)`,
      };
    }
    if (selectedProductType === 'trichlor') {
      return {
        type: 'trichlor',
        name: 'Pastillas de Tricloro',
        form: 'tablets',
        concentrationPercent,
        description: 'Pastillas de lenta disolución (90% pureza)',
      };
    }
    return {
      type: 'custom',
      name: 'Producto Clorado Personalizado',
      form: concentrationPercent > 30 ? 'granular' : 'liquid',
      concentrationPercent,
      description: `Reactivo personalizado al ${concentrationPercent}%`,
    };
  }, [selectedProductType, concentrationPercent]);

  // Calculate Dosage
  const dosageResult = useMemo(() => {
    const waterVol = volumeResult.waterVolumeLiters > 0 ? volumeResult.waterVolumeLiters : activeSystem.currentVolumeLiters;
    return calculateChlorineDosage(
      waterVol,
      currentProduct,
      currentResidualPpm,
      targetResidualPpm,
      chlorineDemandPpm
    );
  }, [volumeResult.waterVolumeLiters, activeSystem.currentVolumeLiters, currentProduct, currentResidualPpm, targetResidualPpm, chlorineDemandPpm]);

  // Advanced technical calculation
  const advancedResult = useMemo(() => {
    return calculateAdvancedTechnical(
      flowRateLps,
      targetResidualPpm,
      concentrationPercent,
      contactTimeMinutes,
      volumeResult.waterVolumeM3
    );
  }, [flowRateLps, targetResidualPpm, concentrationPercent, contactTimeMinutes, volumeResult.waterVolumeM3]);

  // Quick volume selector helper
  const handleQuickVolume = (liters: number) => {
    setTankType('direct_volume');
    setDirectValue(liters);
    setDirectUnit('L');
  };

  // Quick ppm adjustments
  const adjustActual = (delta: number) => {
    setCurrentResidualPpm((prev) => Math.max(0, Math.min(4.0, Number((prev + delta).toFixed(2)))));
  };

  const adjustTarget = (delta: number) => {
    setTargetResidualPpm((prev) => Math.max(0.5, Math.min(4.0, Number((prev + delta).toFixed(2)))));
  };

  // Product selector helper
  const handleSelectReagentType = (type: ChlorineProductType, defaultConc: number) => {
    setSelectedProductType(type);
    setConcentrationPercent(defaultConc);
    setIsCustomProduct(false);
  };

  // Execution & Registration handler
  const handleApplyDoseAndRegister = () => {
    onRewardXp(50, 'Dosificación de Cloro Ejecutada');
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00b4d8', '#43fec7', '#caf300'],
    });

    // Advance to Step 6: Verificación
    setCurrentStep(6);
  };

  const handleConfirmVerificationAndSave = () => {
    const now = new Date();
    const dateStr = 'Hoy';
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let status: 'optimal' | 'warning' | 'danger' = 'optimal';
    if (measuredPostResidualPpm < normative.minFreeChlorine) {
      status = 'danger';
    } else if (measuredPostResidualPpm > normative.maxFreeChlorine) {
      status = 'warning';
    }

    onSaveRecord({
      dateStr,
      timeStr,
      systemId: activeSystem.id,
      systemName: activeSystem.name,
      centerPoblado: activeSystem.centerPoblado,
      measurementPoint: 'Salida de Reservorio / Red',
      volumeLiters: volumeResult.waterVolumeLiters > 0 ? volumeResult.waterVolumeLiters : activeSystem.currentVolumeLiters,
      productName: currentProduct.name,
      concentrationPercent: currentProduct.concentrationPercent,
      initialChlorinePpm: currentResidualPpm,
      targetChlorinePpm: targetResidualPpm,
      calculatedDoseValue: dosageResult.productAmount,
      calculatedDoseUnit: dosageResult.productUnit,
      postChlorinePpm: measuredPostResidualPpm,
      contactTimeMinutes,
      status,
      ph: phLevel,
      turbidityNtu,
      temperatureC,
      responsible: responsibleName,
      observations: observationNotes || `Dosificación aplicada de ${dosageResult.productAmount} ${dosageResult.productUnit} de ${currentProduct.name}. Cloro final verificado: ${measuredPostResidualPpm.toFixed(2)} ppm.`,
      xpEarned: 50,
      isAudited: true,
    });

    setHasRegistered(true);
    setVerificationFeedback('¡Bitácora oficial de cloración actualizada y certificada con éxito!');
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#00b4d8', '#43fec7', '#caf300'],
    });
  };

  const stepsList = [
    { num: 1, title: 'Tanque' },
    { num: 2, title: 'Volumen' },
    { num: 3, title: 'Producto' },
    { num: 4, title: 'Cloro' },
    { num: 5, title: 'Dosis' },
    { num: 6, title: 'Verificar' },
    { num: 7, title: 'Registro' },
  ];

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-4 pb-28 pt-2">
      {/* Upper Alquimia Operativa Ribbon */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="font-hud text-[11px] text-[#00677d] uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#10e7b2] shadow-[0_0_8px_#43fec7] animate-pulse" />
            Alquimia Operativa • Control Sanitario
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-hud font-bold border transition-all ${
                advancedMode
                  ? 'bg-[#caf300] text-[#171e00] border-[#93b100] shadow-sm'
                  : 'bg-white text-[#00677d] border-[#bcc9ce]/40 hover:bg-[#edf5fc]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">settings</span>
              <span>{advancedMode ? '⚙️ MODO TÉCNICO ACTIVO' : '⚙️ MODO TÉCNICO'}</span>
            </button>
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm border border-[#bcc9ce]/40">
              <span className="material-symbols-outlined text-[#006c51] text-[14px]">
                auto_awesome
              </span>
              <span className="font-hud text-[10px] text-[#006c51] font-bold">
                FORMULA v2.4
              </span>
            </div>
          </div>
        </div>

        <h2 className="font-extrabold text-[24px] text-[#151d22] tracking-tight leading-none mt-1">
          Laboratorio de Dosificación Cl₂
        </h2>
        <p className="text-[13px] text-[#3d494d]">
          Calcula y dosifica con precisión técnica tus reactivos según D.S. N.° 031-2010-SA.
        </p>
      </div>

      {/* Interactive 7-Step Horizontal Stepper */}
      <div className="w-full bg-white rounded-2xl p-2.5 shadow-sm border border-[#bcc9ce]/40 overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[420px] gap-1 px-1">
          {stepsList.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                onClick={() => setCurrentStep(step.num)}
                className={`flex-1 py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                  isActive
                    ? 'bg-[#00b4d8] text-white font-bold shadow-[0_2px_8px_rgba(0,180,216,0.35)]'
                    : isCompleted
                    ? 'bg-[#edf5fc] text-[#006c51] font-semibold'
                    : 'text-[#3d494d] hover:bg-[#edf5fc]/60'
                }`}
                type="button"
              >
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-hud font-bold flex items-center justify-center shrink-0 ${
                    isActive
                      ? 'bg-white text-[#00677d]'
                      : isCompleted
                      ? 'bg-[#43fec7] text-[#002116]'
                      : 'bg-[#dbe4ea] text-[#3d494d]'
                  }`}
                >
                  {isCompleted ? '✓' : step.num}
                </span>
                <span className="font-hud text-[10px] uppercase tracking-tight whitespace-nowrap">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active System Pill Pod */}
      <div className="bg-white rounded-2xl p-3 shadow-[0_8px_24px_-4px_rgba(0,180,216,0.1)] border border-[#bcc9ce]/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#b3ebff] flex items-center justify-center shrink-0 text-[#00677d] shadow-inner">
            <span className="material-symbols-outlined text-[22px]">water_ph</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-hud text-[10px] text-[#00677d] font-bold uppercase tracking-wider">
              Unidad Activa
            </span>
            <span className="font-bold text-[14px] text-[#151d22] truncate">
              {activeSystem.name}
            </span>
            <span className="text-[11px] text-[#3d494d]">
              Capacidad: {volumeResult.waterVolumeLiters.toLocaleString('es-PE')} Litros en cálculo
            </span>
          </div>
        </div>

        {/* Switch dropdown */}
        <select
          value={activeSystem.id}
          onChange={(e) => {
            const sys = systems.find((s) => s.id === e.target.value);
            if (sys) onSwitchSystem(sys);
          }}
          className="w-10 h-10 rounded-full bg-[#edf5fc] flex items-center justify-center text-[#00677d] border border-[#bcc9ce]/40 hover:bg-[#e1e9f0] cursor-pointer text-center text-[0px]"
          title="Cambiar de reservorio"
        >
          {systems.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* WIZARD CONTENT BASED ON STEP */}
      {currentStep === 1 && (
        /* STEP 1: TANQUE */
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#edf5fc] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00677d] text-[22px]">
                view_in_ar
              </span>
              <div>
                <h3 className="font-bold text-[16px] text-[#151d22]">
                  Paso 1: ¿Qué tipo de tanque o reservorio tiene?
                </h3>
                <p className="text-[12px] text-[#3d494d]">
                  Seleccione la geometría física para calcular el volumen real de agua.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#edf5fc] font-hud text-[10px] font-bold text-[#00677d]">
              GEOMETRÍA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              {
                id: 'cylindrical_vertical' as TankType,
                title: 'A. Tanque Cilíndrico Vertical',
                sub: 'V = π × r² × h (Reservorios apoyados y elevados)',
                icon: 'cylinder',
              },
              {
                id: 'rectangular_cistern' as TankType,
                title: 'B. Cisterna Rectangular',
                sub: 'V = Largo × Ancho × Altura de agua',
                icon: 'crop_landscape',
              },
              {
                id: 'cubic' as TankType,
                title: 'C. Tanque Cúbico',
                sub: 'V = Lado² × Altura disponible',
                icon: 'crop_square',
              },
              {
                id: 'cylindrical_horizontal' as TankType,
                title: 'D. Tanque Cilíndrico Horizontal',
                sub: 'Opción avanzada con cálculo de segmento circular',
                icon: 'view_stream',
              },
              {
                id: 'direct_volume' as TankType,
                title: 'E. Ingresar Volumen Directamente',
                sub: 'Ingreso rápido en Litros o m³ conocidos',
                icon: 'pin',
              },
            ].map((opt) => {
              const isSelected = tankType === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTankType(opt.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-[#edf5fc] border-[#00b4d8] shadow-[0_0_12px_rgba(0,180,216,0.25)]'
                      : 'bg-white border-[#bcc9ce]/30 hover:border-[#00b4d8]/50'
                  }`}
                  type="button"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-[#00b4d8] text-white' : 'bg-[#edf5fc] text-[#00677d]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] text-[#151d22]">{opt.title}</div>
                    <div className="text-[11px] text-[#3d494d] mt-0.5">{opt.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-6 rounded-full bg-[#00b4d8] hover:bg-[#00677d] text-white font-hud text-[12px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span>Continuar a Dimensiones</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        /* STEP 2: VOLUMEN Y DIMENSIONES */
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#edf5fc] pb-2">
            <div>
              <h3 className="font-bold text-[16px] text-[#151d22]">
                Paso 2: Dimensiones y Nivel Actual de Agua
              </h3>
              <p className="text-[12px] text-[#3d494d]">
                Ingrese las medidas físicas. Para la dosificación se utiliza el volumen real de agua, no la altura total.
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-[11px] font-hud font-bold text-[#00677d] hover:underline"
              type="button"
            >
              Cambiar Tanque
            </button>
          </div>

          {/* Form fields based on tankType */}
          {tankType === 'cylindrical_vertical' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#151d22]">
                    {useRadius ? 'Radio (r)' : 'Diámetro (d)'}
                  </label>
                  <button
                    onClick={() => setUseRadius(!useRadius)}
                    className="text-[10px] font-hud font-bold text-[#00677d] hover:underline cursor-pointer"
                    type="button"
                  >
                    {useRadius ? 'Usar Diámetro' : 'Usar Radio'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={useRadius ? radiusMeters : diameterMeters}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (useRadius) setRadiusMeters(val);
                      else setDiameterMeters(val);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none focus:border-[#00b4d8]"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">metros</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#151d22]">Altura Total del Tanque</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={totalHeightMeters}
                    onChange={(e) => setTotalHeightMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none focus:border-[#00b4d8]"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">metros</span>
                </div>
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-[#edf5fc] border border-[#00b4d8]/40 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#00677d] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">waves</span>
                    Altura Actual del Agua (Nivel Operativo)
                  </label>
                  <span className="text-[10px] text-[#3d494d]">Medido con sonda o flotador</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max={totalHeightMeters}
                    value={waterHeightMeters}
                    onChange={(e) => setWaterHeightMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[16px] font-bold text-[#00677d] focus:outline-none focus:border-[#00b4d8]"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">metros</span>
                </div>
              </div>
            </div>
          )}

          {tankType === 'rectangular_cistern' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Largo (L)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={lengthMeters}
                    onChange={(e) => setLengthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Ancho (A)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={widthMeters}
                    onChange={(e) => setWidthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Altura Total Cisterna</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={totalHeightMeters}
                    onChange={(e) => setTotalHeightMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#edf5fc] border border-[#00b4d8]/40 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#00677d]">Altura Actual del Agua</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={waterHeightMeters}
                    onChange={(e) => setWaterHeightMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>
            </div>
          )}

          {tankType === 'cubic' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Largo del Lado</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={sideMeters}
                    onChange={(e) => setSideMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#edf5fc] border border-[#00b4d8]/40 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#00677d]">Altura Actual del Agua</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={waterHeightMeters}
                    onChange={(e) => setWaterHeightMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>
            </div>
          )}

          {tankType === 'cylindrical_horizontal' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Diámetro (d)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={horizDiameterMeters}
                    onChange={(e) => setHorizDiameterMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Longitud (L)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={horizLengthMeters}
                    onChange={(e) => setHorizLengthMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#edf5fc] border border-[#00b4d8]/40 flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#00677d]">Nivel Actual del Agua (h)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={horizWaterLevelMeters}
                    onChange={(e) => setHorizWaterLevelMeters(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[15px] font-bold text-[#00677d] focus:outline-none"
                  />
                  <span className="font-hud text-[12px] text-[#3d494d] font-bold">m</span>
                </div>
              </div>
            </div>
          )}

          {tankType === 'direct_volume' && (
            <div className="p-4 rounded-xl bg-[#edf5fc] border border-[#00b4d8]/40 flex flex-col gap-3">
              <label className="text-[13px] font-bold text-[#00677d]">
                Ingresar Volumen Directo de Agua Almacenada
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="100"
                  min="1"
                  value={directValue}
                  onChange={(e) => setDirectValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[20px] font-bold text-[#00677d] focus:outline-none"
                />
                <div className="flex rounded-xl bg-white p-1 border border-[#bcc9ce]/40">
                  <button
                    onClick={() => setDirectUnit('L')}
                    className={`px-3 py-1 rounded-lg text-[12px] font-hud font-bold transition-all cursor-pointer ${
                      directUnit === 'L' ? 'bg-[#00b4d8] text-white' : 'text-[#3d494d]'
                    }`}
                    type="button"
                  >
                    Litros (L)
                  </button>
                  <button
                    onClick={() => setDirectUnit('m3')}
                    className={`px-3 py-1 rounded-lg text-[12px] font-hud font-bold transition-all cursor-pointer ${
                      directUnit === 'm3' ? 'bg-[#00b4d8] text-white' : 'text-[#3d494d]'
                    }`}
                    type="button"
                  >
                    m³
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-[#3d494d]">
                Ejemplo de conversión: 10 m³ = 10,000 Litros
              </div>
            </div>
          )}

          {/* Quick Volume Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            <span className="text-[11px] font-hud font-bold text-[#3d494d] whitespace-nowrap mr-1">
              Acceso Rápido:
            </span>
            <button
              onClick={() => handleQuickVolume(10000)}
              className="px-3 py-1 rounded-full bg-[#edf5fc] hover:bg-[#b3ebff] text-[11px] font-hud font-bold text-[#00677d] transition-colors"
              type="button"
            >
              10,000 L (10 m³)
            </button>
            <button
              onClick={() => handleQuickVolume(50000)}
              className="px-3 py-1 rounded-full bg-[#edf5fc] hover:bg-[#b3ebff] text-[11px] font-hud font-bold text-[#00677d] transition-colors"
              type="button"
            >
              50,000 L (50 m³)
            </button>
            <button
              onClick={() => handleQuickVolume(100000)}
              className="px-3 py-1 rounded-full bg-[#edf5fc] hover:bg-[#b3ebff] text-[11px] font-hud font-bold text-[#00677d] transition-colors"
              type="button"
            >
              100,000 L (100 m³)
            </button>
            <button
              onClick={() => handleQuickVolume(120000)}
              className="px-3 py-1 rounded-full bg-[#00b4d8] text-white text-[11px] font-hud font-bold shadow-sm"
              type="button"
            >
              120,000 L (MAX)
            </button>
          </div>

          {/* Real-time Tank Visualizer representation */}
          <TankVisualizer tankType={tankType} volumeResult={volumeResult} />

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="py-2.5 px-4 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[12px] font-bold uppercase hover:bg-[#e1e9f0]"
              type="button"
            >
              Atrás
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="py-2.5 px-6 rounded-full bg-[#00b4d8] hover:bg-[#00677d] text-white font-hud text-[12px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span>Continuar a Producto de Cloro</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        /* STEP 3: PRODUCTO DE CLORO */
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#edf5fc] pb-2">
            <div>
              <h3 className="font-bold text-[16px] text-[#151d22]">
                Paso 3: ¿Qué producto de cloro utilizará?
              </h3>
              <p className="text-[12px] text-[#3d494d]">
                Verifique que la concentración corresponda al cloro activo declarado por el fabricante y sea apto para agua de consumo humano.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#43fec7]/30 text-[#00513c] font-hud text-[10px] font-bold uppercase">
              REACTIVO
            </span>
          </div>

          {/* Product selection cards matching mockup */}
          <div className="flex flex-col gap-2">
            {/* Reagent 1: Hipoclorito de Sodio Líquido */}
            <div
              onClick={() => handleSelectReagentType('sodium_hypochlorite', 12.0)}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                selectedProductType === 'sodium_hypochlorite' && !isCustomProduct
                  ? 'bg-[#b3ebff]/30 border-[#00b4d8] shadow-[0_0_12px_rgba(0,180,216,0.25)]'
                  : 'bg-[#edf5fc] border-transparent hover:border-[#bcc9ce]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#00b4d8] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[22px]">opacity</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-[#00677d]">
                    Hipoclorito de Sodio (Líquido)
                  </span>
                  <span className="text-[11px] text-[#3d494d]">
                    Líquido estándar para desinfección (10% - 13% cloro activo)
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#00677d] text-[22px]">
                {selectedProductType === 'sodium_hypochlorite' && !isCustomProduct
                  ? 'check_circle'
                  : 'radio_button_unchecked'}
              </span>
            </div>

            {/* Reagent 2: Hipoclorito de Calcio Granular */}
            <div
              onClick={() => handleSelectReagentType('calcium_hypochlorite', 68.0)}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                selectedProductType === 'calcium_hypochlorite' && !isCustomProduct
                  ? 'bg-[#b3ebff]/30 border-[#00b4d8] shadow-[0_0_12px_rgba(0,180,216,0.25)]'
                  : 'bg-[#edf5fc] border-transparent hover:border-[#bcc9ce]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#43fec7] text-[#002116] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">grain</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-[#151d22]">
                    Hipoclorito de Calcio (Granular)
                  </span>
                  <span className="text-[11px] text-[#3d494d]">
                    Granular concentrado de alta pureza (65% - 70%)
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#00677d] text-[22px]">
                {selectedProductType === 'calcium_hypochlorite' && !isCustomProduct
                  ? 'check_circle'
                  : 'radio_button_unchecked'}
              </span>
            </div>

            {/* Reagent 3: Pastillas de Tricloro */}
            <div
              onClick={() => handleSelectReagentType('trichlor', 90.0)}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                selectedProductType === 'trichlor' && !isCustomProduct
                  ? 'bg-[#b3ebff]/30 border-[#00b4d8] shadow-[0_0_12px_rgba(0,180,216,0.25)]'
                  : 'bg-[#edf5fc] border-transparent hover:border-[#bcc9ce]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#caf300] text-[#171e00] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">circle</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-[#151d22]">
                    Pastillas de Tricloro
                  </span>
                  <span className="text-[11px] text-[#3d494d]">
                    Disolución lenta para dosificador de erosión (90% pureza)
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#00677d] text-[22px]">
                {selectedProductType === 'trichlor' && !isCustomProduct
                  ? 'check_circle'
                  : 'radio_button_unchecked'}
              </span>
            </div>

            {/* Reagent 4: Personalizado */}
            <div
              onClick={() => {
                setSelectedProductType('custom');
                setIsCustomProduct(true);
              }}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                isCustomProduct
                  ? 'bg-[#b3ebff]/30 border-[#00b4d8] shadow-[0_0_12px_rgba(0,180,216,0.25)]'
                  : 'bg-[#edf5fc] border-transparent hover:border-[#bcc9ce]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-[#00677d] border border-[#bcc9ce]/40 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">tune</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-[14px] text-[#151d22]">
                    Otro Producto / Concentración Personalizada
                  </span>
                  <span className="text-[11px] text-[#3d494d]">
                    Ingrese manualmente el porcentaje según la etiqueta o ficha técnica
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#00677d] text-[22px]">
                {isCustomProduct ? 'check_circle' : 'radio_button_unchecked'}
              </span>
            </div>
          </div>

          {/* Concentration Input Field & Quick Chips */}
          <div className="p-3.5 rounded-2xl bg-[#edf5fc] border border-[#00b4d8]/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-[#00677d]">
                Concentración de Cloro Activo Declarada:
              </label>
              <span className="font-hud text-[14px] font-extrabold text-[#00677d]">
                {concentrationPercent}% Cl₂
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                min="0.1"
                max="100"
                value={concentrationPercent}
                onChange={(e) => setConcentrationPercent(parseFloat(e.target.value) || 0)}
                className="w-32 px-3 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[18px] font-extrabold text-[#00677d] focus:outline-none"
              />
              <span className="text-[13px] font-semibold text-[#151d22]">% de Cloro Activo</span>

              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto justify-end">
                {[5.0, 7.5, 10.0, 12.0, 65.0, 70.0, 90.0].map((c) => (
                  <button
                    key={c}
                    onClick={() => setConcentrationPercent(c)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-hud font-bold transition-all cursor-pointer ${
                      concentrationPercent === c
                        ? 'bg-[#00b4d8] text-white shadow-sm'
                        : 'bg-white text-[#3d494d] hover:bg-[#b3ebff]/40'
                    }`}
                    type="button"
                  >
                    {c}%
                  </button>
                ))}
              </div>
            </div>

            {/* Official Safety Warning */}
            <div className="mt-2 p-2.5 rounded-xl bg-[#fff8e1] border border-[#ffecb3] text-[#5d4037] text-[11px] flex items-start gap-2">
              <span className="material-symbols-outlined text-[#ff8f00] text-[18px] shrink-0 mt-0.5">
                warning
              </span>
              <span>
                <strong>ADVERTENCIA TÉCNICA:</strong> Verifique que la concentración ingresada corresponda a la concentración de cloro activo declarada por el fabricante en la ficha técnica y que el producto cuente con Registro Sanitario de DIGESA para agua de consumo humano.
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="py-2.5 px-4 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[12px] font-bold uppercase hover:bg-[#e1e9f0]"
              type="button"
            >
              Atrás
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="py-2.5 px-6 rounded-full bg-[#00b4d8] hover:bg-[#00677d] text-white font-hud text-[12px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span>Continuar a Cloro Residual</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        /* STEP 4: MEDICIÓN DE CLORO RESIDUAL */
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#edf5fc] pb-2">
            <div>
              <h3 className="font-bold text-[16px] text-[#151d22]">
                Paso 4: Medición y Objetivo de Cloro Residual Libre
              </h3>
              <p className="text-[12px] text-[#3d494d]">
                Tomando como referencia el <strong>D.S. N.° 031-2010-SA</strong> (Rango normativo: 0.50 a 2.00 mg/L).
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#caf300]/40 text-[#334000] font-hud text-[10px] font-bold uppercase">
              MINSA/DIGESA
            </span>
          </div>

          {/* Double Potency Capsule: Actual vs Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Current Chlorine Capsule */}
            <div className="bg-[#edf5fc] rounded-2xl p-4 flex flex-col justify-between border border-[#bcc9ce]/40 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-hud text-[11px] text-[#3d494d] uppercase font-bold">
                  Cloro Residual Libre Actual
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-ping ${
                    currentResidualPpm < 0.5
                      ? 'bg-[#ba1a1a]'
                      : currentResidualPpm > 2.0
                      ? 'bg-[#ba1a1a]'
                      : 'bg-[#10e7b2]'
                  }`}
                />
              </div>

              <div className="my-3 flex items-baseline justify-center gap-1">
                <span
                  className={`font-hud text-[36px] font-extrabold ${
                    currentResidualPpm < 0.5 ? 'text-[#ba1a1a]' : 'text-[#00677d]'
                  }`}
                >
                  {currentResidualPpm.toFixed(2)}
                </span>
                <span className="font-hud text-[13px] text-[#3d494d] font-bold">mg/L (ppm)</span>
              </div>

              {/* Status Badge */}
              <div
                className={`rounded-full py-1 px-3 flex items-center justify-center gap-1 shadow-sm text-[11px] font-hud font-bold uppercase ${
                  currentResidualPpm < 0.5
                    ? 'bg-[#ffdad6] text-[#93000a]'
                    : currentResidualPpm > 2.0
                    ? 'bg-[#ffdad6] text-[#93000a]'
                    : 'bg-[#43fec7]/30 text-[#00513c]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {currentResidualPpm >= 0.5 && currentResidualPpm <= 2.0
                    ? 'verified'
                    : 'warning'}
                </span>
                <span>
                  {currentResidualPpm < 0.5
                    ? '🔴 REQUIERE AJUSTE: NIVEL BAJO'
                    : currentResidualPpm > 2.0
                    ? '🟠 FUERA DE RANGO: ELEVADO'
                    : '🟢 DENTRO DEL RANGO PERMITIDO'}
                </span>
              </div>

              {/* Stepper buttons */}
              <div className="mt-3 flex items-center justify-between bg-white rounded-full p-1 shadow-inner border border-[#bcc9ce]/40">
                <button
                  onClick={() => adjustActual(-0.1)}
                  className="w-8 h-8 rounded-full bg-[#edf5fc] text-[#151d22] font-bold hover:bg-[#ba1a1a] hover:text-white transition-colors cursor-pointer"
                  type="button"
                >
                  -
                </button>
                <span className="font-hud text-[11px] text-[#3d494d] font-bold">AJUSTAR</span>
                <button
                  onClick={() => adjustActual(0.1)}
                  className="w-8 h-8 rounded-full bg-[#edf5fc] text-[#151d22] font-bold hover:bg-[#006c51] hover:text-white transition-colors cursor-pointer"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            {/* Target Chlorine Capsule */}
            <div className="bg-[#b3ebff]/25 rounded-2xl p-4 flex flex-col justify-between border border-[#00b4d8]/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-hud text-[11px] text-[#00677d] font-bold uppercase">
                  Cloro Residual Libre Objetivo
                </span>
                <span className="material-symbols-outlined text-[#00677d] text-[16px]">
                  track_changes
                </span>
              </div>

              <div className="my-3 flex items-baseline justify-center gap-1">
                <span className="font-hud text-[36px] text-[#00677d] font-extrabold">
                  {targetResidualPpm.toFixed(2)}
                </span>
                <span className="font-hud text-[13px] text-[#00677d] font-bold">mg/L (ppm)</span>
              </div>

              {/* Target Quality Tag */}
              <div className="bg-[#006c51] text-white rounded-full py-1 px-3 flex items-center justify-center gap-1 shadow-sm text-[11px] font-hud font-bold uppercase tracking-tight">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                <span>Rango Quirúrgico / Preventivo</span>
              </div>

              {/* Stepper buttons */}
              <div className="mt-3 flex items-center justify-between bg-white rounded-full p-1 shadow-inner border border-[#00b4d8]/30">
                <button
                  onClick={() => adjustTarget(-0.1)}
                  className="w-8 h-8 rounded-full bg-[#edf5fc] text-[#00677d] font-bold hover:bg-[#00b4d8] hover:text-white transition-colors cursor-pointer"
                  type="button"
                >
                  -
                </button>
                <span className="font-hud text-[11px] text-[#00677d] font-bold">TARGET</span>
                <button
                  onClick={() => adjustTarget(0.1)}
                  className="w-8 h-8 rounded-full bg-[#edf5fc] text-[#00677d] font-bold hover:bg-[#00b4d8] hover:text-white transition-colors cursor-pointer"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Chlorine Demand Field (Demanda de Cloro del Agua) */}
          <div className="p-3.5 rounded-2xl bg-[#edf5fc] border border-[#bcc9ce]/40 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-[#151d22]">
                Demanda de Cloro Estimada del Agua
              </span>
              <span className="text-[11px] text-[#3d494d]">
                Consumo de cloro por materia orgánica o hierro presente en la fuente cruda
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.05"
                min="0"
                max="5"
                value={chlorineDemandPpm}
                onChange={(e) => setChlorineDemandPpm(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[14px] font-bold text-[#00677d] text-center"
              />
              <span className="font-hud text-[11px] font-bold text-[#3d494d]">mg/L</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="py-2.5 px-4 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[12px] font-bold uppercase hover:bg-[#e1e9f0]"
              type="button"
            >
              Atrás
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="py-2.5 px-6 rounded-full bg-[#00b4d8] hover:bg-[#00677d] text-white font-hud text-[12px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span>Ver Cálculo de Dosificación</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {currentStep === 5 && (
        /* STEP 5: RESULTADO DE LA DOSIFICACIÓN */
        <div className="flex flex-col gap-4 animate-in fade-in">
          {/* Main High-Impact Result Card matching Image 1 */}
          <div className="bg-gradient-to-br from-[#00677d] via-[#004e5f] to-[#151d22] rounded-3xl p-5 text-white shadow-[0_16px_36px_-6px_rgba(0,103,125,0.4)] flex flex-col gap-3 relative overflow-hidden">
            {/* Bioluminescent Glow Accents */}
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#43fec7]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-[#4cd6fb]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <span className="font-hud text-[11px] text-[#43fec7] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[18px]">biotech</span>
                Fórmula de Dosificación Resultante
              </span>
              <span className="font-hud text-[10px] bg-white/10 text-white px-2.5 py-0.5 rounded-full backdrop-blur-sm font-bold">
                ΔCl = +{dosageResult.deltaClPpm.toFixed(2)} ppm
              </span>
            </div>

            {/* Huge Dosage Number Display */}
            <div className="flex flex-col items-center justify-center py-3 relative z-10">
              <span className="font-hud text-[11px] text-[#b3ebff] uppercase tracking-widest leading-tight font-bold">
                Dosis Exacta Requerida de Producto
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-hud text-[46px] sm:text-[54px] text-white font-extrabold tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
                  {dosageResult.productAmount.toLocaleString('es-PE')}
                </span>
                <span className="font-hud text-[24px] text-[#43fec7] font-bold tracking-tight">
                  {dosageResult.productUnit}
                </span>
              </div>
              <span className="text-[13px] text-[#4cd6fb] font-medium mt-0.5">
                de {currentProduct.name} ({currentProduct.concentrationPercent}%)
                {dosageResult.secondaryDisplay && ` • Equivalente a ${dosageResult.secondaryDisplay}`}
              </span>
            </div>

            {/* Telemetry Badges (Contact Time & Pathogen Impact) */}
            <div className="grid grid-cols-2 gap-2 relative z-10">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center gap-2.5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-[#43fec7]/20 flex items-center justify-center shrink-0 text-[#43fec7]">
                  <span className="material-symbols-outlined text-[18px]">timer</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-hud text-[9px] text-white/70 uppercase font-bold">
                    Tiempo de Contacto CT
                  </span>
                  <span className="font-hud text-[13px] text-white font-bold leading-tight">
                    {contactTimeMinutes} minutos (Mínimo)
                  </span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center gap-2.5 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-[#43fec7]/20 flex items-center justify-center shrink-0 text-[#43fec7]">
                  <span className="material-symbols-outlined text-[18px]">sanitizer</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-hud text-[9px] text-white/70 uppercase font-bold">
                    Efectividad Desinfección
                  </span>
                  <span className="font-hud text-[13px] text-white font-bold leading-tight">
                    99.9% Patógenos (Coliformes)
                  </span>
                </div>
              </div>
            </div>

            {/* Projected Certificate Note */}
            <div className="bg-black/25 rounded-full px-3 py-1.5 flex items-center justify-center gap-2 relative z-10 text-center">
              <span className="w-2 h-2 rounded-full bg-[#43fec7]" />
              <span className="text-[12px] text-white/95">
                Efecto proyectado: Cloro libre residual en{' '}
                <strong className="text-[#43fec7] font-bold">{targetResidualPpm.toFixed(2)} ppm</strong>{' '}
                certificado bajo D.S. 031.
              </span>
            </div>
          </div>

          {/* Explanation Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col gap-2">
            <h4 className="font-bold text-[14px] text-[#00677d] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">functions</span>
              Memoria Técnica de Cálculo Oficial
            </h4>
            <p className="text-[12px] text-[#3d494d] leading-relaxed">
              {dosageResult.explanation}
            </p>
            <div className="p-2.5 rounded-xl bg-[#edf5fc] font-hud text-[11px] text-[#00677d] font-semibold">
              Fórmula DIGESA: P = (Dosis neta [mg/L] × Volumen [L]) / (% Cloro Activo × 10)
            </div>
          </div>

          {/* Advanced Mode Output if enabled */}
          {advancedMode && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#caf300] flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-[#edf5fc] pb-2">
                <span className="font-hud text-[12px] font-bold text-[#334000] uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  Resultados del Modo Técnico Continuo (Dosificador en Línea)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#caf300]/40 text-[#334000] text-[10px] font-hud font-bold">
                  Q = {flowRateLps} L/s
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 rounded-xl bg-[#edf5fc] flex flex-col">
                  <span className="font-hud text-[9px] text-[#3d494d] uppercase font-bold">Caudal Dosificación</span>
                  <span className="font-hud text-[16px] text-[#00677d] font-bold mt-0.5">
                    {advancedResult.dosingFlowMlMin} mL/min
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#edf5fc] flex flex-col">
                  <span className="font-hud text-[9px] text-[#3d494d] uppercase font-bold">Consumo Hora</span>
                  <span className="font-hud text-[16px] text-[#00677d] font-bold mt-0.5">
                    {advancedResult.dosingFlowLHour} L/h
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#edf5fc] flex flex-col">
                  <span className="font-hud text-[9px] text-[#3d494d] uppercase font-bold">Cloro Puro Activo</span>
                  <span className="font-hud text-[16px] text-[#006c51] font-bold mt-0.5">
                    {advancedResult.activeChlorineGramHour} g/h
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#edf5fc] flex flex-col">
                  <span className="font-hud text-[9px] text-[#3d494d] uppercase font-bold">Valor CT (Conc × T)</span>
                  <span className="font-hud text-[16px] text-[#00677d] font-bold mt-0.5">
                    {advancedResult.ctValue} mg·min/L
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Primary Gamified Action Button with Floating XP Reward Badge matching Image 1 */}
          <button
            onClick={handleApplyDoseAndRegister}
            className="relative w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#00b4d8] via-[#00677d] to-[#004e5f] text-white font-hud text-[14px] font-bold uppercase tracking-wider shadow-[0_12px_28px_rgba(0,180,216,0.35)] active:scale-95 transition-all overflow-hidden flex items-center justify-center gap-2 group cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">science_off</span>
            <span>Aplicar Dosis y Pasar a Verificación en Campo</span>
            <span className="absolute right-3.5 top-2.5 bg-[#caf300] text-[#171e00] font-hud text-[10px] px-2.5 py-0.5 rounded-full font-extrabold shadow-sm flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[12px]">bolt</span>
              +50 XP
            </span>
          </button>

          {/* Safety Card matching Image 1 */}
          <div className="bg-[#edf5fc] rounded-2xl p-3.5 flex items-center gap-3 shadow-sm border border-[#bcc9ce]/40">
            <div className="w-10 h-10 rounded-full bg-[#caf300]/40 text-[#334000] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">masks</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-hud text-[10px] text-[#334000] font-bold uppercase">
                Protocolo Guardián de Seguridad Ocupacional
              </span>
              <span className="text-[12px] text-[#3d494d]">
                Usa siempre guantes de nitrilo, gafas protectoras y mascarilla para gases antes de manipular hipoclorito concentrado.
              </span>
            </div>
          </div>
        </div>
      )}

      {currentStep === 6 && (
        /* STEP 6: MÓDULO DE VERIFICACIÓN EN CAMPO */
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#edf5fc] pb-2">
            <div>
              <h3 className="font-bold text-[16px] text-[#151d22]">
                Paso 6: 🔬 Verificación Posterior en Campo
              </h3>
              <p className="text-[12px] text-[#3d494d]">
                Realice la medición del cloro residual después del tiempo de contacto correspondiente (mínimo 30 minutos).
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#43fec7]/30 text-[#00513c] font-hud text-[10px] font-bold uppercase">
              POST-DOSIS
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#edf5fc] border border-[#00b4d8]/30 flex flex-col gap-3">
            <label className="text-[13px] font-bold text-[#00677d]">
              Cloro Residual Libre Obtenido en la Medición:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.05"
                min="0"
                max="5"
                value={measuredPostResidualPpm}
                onChange={(e) => setMeasuredPostResidualPpm(parseFloat(e.target.value) || 0)}
                className="w-32 px-4 py-2 rounded-xl bg-white border border-[#bcc9ce]/40 font-hud text-[24px] font-extrabold text-[#00677d] text-center focus:outline-none"
              />
              <span className="font-hud text-[14px] font-bold text-[#3d494d]">mg/L (ppm)</span>

              {/* Status Pill */}
              <div
                className={`ml-auto px-4 py-1.5 rounded-full font-hud text-[12px] font-bold flex items-center gap-1.5 uppercase ${
                  measuredPostResidualPpm >= 0.5 && measuredPostResidualPpm <= 2.0
                    ? 'bg-[#43fec7]/30 text-[#00513c] border border-[#43fec7]'
                    : measuredPostResidualPpm < 0.5
                    ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]'
                    : 'bg-[#fff8e1] text-[#b78103] border border-[#ffe082]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {measuredPostResidualPpm >= 0.5 && measuredPostResidualPpm <= 2.0
                    ? 'check_circle'
                    : 'warning'}
                </span>
                <span>
                  {measuredPostResidualPpm >= 0.5 && measuredPostResidualPpm <= 2.0
                    ? '🟢 Adecuado (En Norma)'
                    : measuredPostResidualPpm < 0.5
                    ? '🔴 Requiere Acción Correctiva'
                    : '🟡 Revisar (Nivel Alto)'}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations checklist if out of range */}
          {(measuredPostResidualPpm < 0.5 || measuredPostResidualPpm > 2.0) && (
            <div className="p-3.5 rounded-2xl bg-[#ffdad6]/40 border border-[#ba1a1a]/30 text-[#93000a] flex flex-col gap-2">
              <div className="font-bold text-[13px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">checklist</span>
                Recomendaciones Generales de Verificación Sanitaria:
              </div>
              <ul className="text-[12px] list-disc list-inside space-y-1">
                <li>Revisar la concentración real del producto (el cloro líquido se degrada con luz y calor).</li>
                <li>Verificar el funcionamiento y caudal del dosificador.</li>
                <li>Revisar el volumen real de agua almacenada en el reservorio.</li>
                <li>Revisar el tiempo de contacto hidráulico (mínimo 30 minutos antes de ingresar a la red).</li>
                <li>Verificar la calibración del equipo fotométrico o fecha de vencimiento de las pastillas DPD-1.</li>
                <li>Evaluar nuevamente la demanda de cloro crudo del agua.</li>
              </ul>
              <p className="text-[11px] font-semibold text-[#5d4037] mt-1">
                * No asuma que una única medición confirma la seguridad microbiológica sin vigilancia continua.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(5)}
              className="py-2.5 px-4 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[12px] font-bold uppercase hover:bg-[#e1e9f0]"
              type="button"
            >
              Atrás
            </button>
            <button
              onClick={() => setCurrentStep(7)}
              className="py-2.5 px-6 rounded-full bg-[#00b4d8] hover:bg-[#00677d] text-white font-hud text-[12px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span>Continuar a Registro Oficial</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {currentStep === 7 && (
        /* STEP 7: REGISTRO Y TARJETA RESUMEN FINAL */
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#edf5fc] pb-2">
            <div>
              <h3 className="font-bold text-[16px] text-[#151d22]">
                Paso 7: Registro Oficial en Bitácora Sanitaria
              </h3>
              <p className="text-[12px] text-[#3d494d]">
                Guarda los datos técnicos del ciclo completo para auditorías de DIGESA, SUNASS o JASS.
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#43fec7]/30 text-[#00513c] font-hud text-[10px] font-bold uppercase">
              CERTIFICADO
            </span>
          </div>

          {/* Final Summary Card requested in section 17 */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#edf5fc] to-white border-2 border-[#00b4d8]/40 shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#bcc9ce]/30 pb-2">
              <span className="font-hud text-[14px] font-extrabold text-[#00677d] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px]">water_drop</span>
                💧 TARJETA RESUMEN DE CLORACIÓN
              </span>
              <span className="font-hud text-[11px] text-[#006c51] font-bold uppercase bg-[#43fec7]/30 px-2 py-0.5 rounded-full">
                {measuredPostResidualPpm >= 0.5 && measuredPostResidualPpm <= 2.0 ? 'ESTADO: ÓPTIMO' : 'ESTADO: VERIFICAR'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[12px]">
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Volumen:</span>
                <span className="font-bold text-[#151d22]">
                  {volumeResult.waterVolumeLiters.toLocaleString('es-PE')} Litros
                </span>
              </div>
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Producto:</span>
                <span className="font-bold text-[#151d22]">{currentProduct.name}</span>
              </div>
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Concentración:</span>
                <span className="font-bold text-[#151d22]">{currentProduct.concentrationPercent}% Cl₂</span>
              </div>
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Cloro Inicial:</span>
                <span className="font-bold text-[#ba1a1a]">{currentResidualPpm.toFixed(2)} mg/L</span>
              </div>
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Cloro Objetivo:</span>
                <span className="font-bold text-[#00677d]">{targetResidualPpm.toFixed(2)} mg/L</span>
              </div>
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Dosis Teórica:</span>
                <span className="font-bold text-[#00677d]">
                  {dosageResult.productAmount} {dosageResult.productUnit}
                </span>
              </div>
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Cloro Verificado:</span>
                <span className="font-bold text-[#006c51]">{measuredPostResidualPpm.toFixed(2)} mg/L</span>
              </div>
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Tiempo Contacto:</span>
                <span className="font-bold text-[#151d22]">{contactTimeMinutes} minutos</span>
              </div>
              <div>
                <span className="text-[#3d494d] font-hud text-[10px] uppercase font-bold block">Normativa:</span>
                <span className="font-bold text-[#00677d]">D.S. 031-2010-SA</span>
              </div>
            </div>
          </div>

          {/* Responsible and observations form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#151d22]">Responsable del Registro</label>
              <input
                type="text"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/40 text-[13px] font-medium text-[#151d22] focus:outline-none"
                placeholder="Nombre del técnico u operador"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#151d22]">Observaciones de Campo</label>
              <input
                type="text"
                value={observationNotes}
                onChange={(e) => setObservationNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] border border-[#bcc9ce]/40 text-[13px] font-medium text-[#151d22] focus:outline-none"
                placeholder="ej. Muestra tomada en grifo piloto tras purga de 2 minutos"
              />
            </div>
          </div>

          {verificationFeedback && (
            <div className="p-3 rounded-xl bg-[#43fec7]/30 border border-[#43fec7] text-[#00513c] text-[13px] font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
              <span>{verificationFeedback}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setCurrentStep(6)}
              className="py-2.5 px-4 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[12px] font-bold uppercase hover:bg-[#e1e9f0]"
              type="button"
            >
              Atrás
            </button>
            <button
              onClick={handleConfirmVerificationAndSave}
              disabled={hasRegistered}
              className={`py-3.5 px-6 rounded-full font-hud text-[13px] font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                hasRegistered
                  ? 'bg-[#006c51] text-white'
                  : 'bg-gradient-to-r from-[#00b4d8] to-[#00677d] text-white hover:opacity-95'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">
                {hasRegistered ? 'task_alt' : 'save'}
              </span>
              <span>{hasRegistered ? '¡Evento Registrado!' : 'Confirmar y Guardar en Bitácora (+50 XP)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
