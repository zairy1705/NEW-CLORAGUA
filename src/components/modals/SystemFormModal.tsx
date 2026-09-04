import React, { useState, useEffect } from 'react';
import { WaterSystem, TankType } from '../../types';

interface SystemFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  systemToEdit?: WaterSystem | null;
  onClose: () => void;
  onSave: (system: WaterSystem) => void;
}

export const SystemFormModal: React.FC<SystemFormModalProps> = ({
  isOpen,
  mode,
  systemToEdit,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [tankType, setTankType] = useState<TankType>('cylindrical_vertical');
  const [capacityLiters, setCapacityLiters] = useState<number>(25000);
  const [currentVolumeLiters, setCurrentVolumeLiters] = useState<number>(20000);
  const [centerPoblado, setCenterPoblado] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [department, setDepartment] = useState('Cusco');
  const [waterSource, setWaterSource] = useState('Manantial de Ladera concentrado');
  const [responsible, setResponsible] = useState('JASS / Operador Comunal');
  const [disinfectionMethod, setDisinfectionMethod] = useState(
    'Dosificador por Goteo con Carga Constante'
  );
  const [operationalStatus, setOperationalStatus] = useState<'active' | 'maintenance' | 'alert'>('active');
  const [lastChlorinePpm, setLastChlorinePpm] = useState<number>(1.2);
  const [ph, setPh] = useState<number>(7.2);
  const [turbidityNtu, setTurbidityNtu] = useState<number>(0.5);
  const [observations, setObservations] = useState('');

  // Populate or reset form whenever isOpen or systemToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && systemToEdit) {
        setName(systemToEdit.name);
        setTankType(systemToEdit.tankType);
        setCapacityLiters(systemToEdit.capacityLiters);
        setCurrentVolumeLiters(systemToEdit.currentVolumeLiters);
        setCenterPoblado(systemToEdit.centerPoblado);
        setDistrict(systemToEdit.district);
        setProvince(systemToEdit.province || 'Provincia');
        setDepartment(systemToEdit.department || 'Cusco');
        setWaterSource(systemToEdit.waterSource || 'Manantial');
        setResponsible(systemToEdit.responsible);
        setDisinfectionMethod(systemToEdit.disinfectionMethod || 'Dosificación Asistida');
        setOperationalStatus(systemToEdit.operationalStatus);
        setLastChlorinePpm(systemToEdit.lastChlorinePpm);
        setPh(systemToEdit.ph ?? 7.2);
        setTurbidityNtu(systemToEdit.turbidityNtu ?? 0.5);
        setObservations(systemToEdit.observations || '');
      } else {
        // Reset defaults for create mode
        setName('');
        setTankType('cylindrical_vertical');
        setCapacityLiters(25000);
        setCurrentVolumeLiters(20000);
        setCenterPoblado('');
        setDistrict('');
        setProvince('');
        setDepartment('Cusco');
        setWaterSource('Manantial de Ladera concentrado');
        setResponsible('JASS / Operador Comunal');
        setDisinfectionMethod('Dosificador por Goteo con Carga Constante');
        setOperationalStatus('active');
        setLastChlorinePpm(1.2);
        setPh(7.2);
        setTurbidityNtu(0.5);
        setObservations('');
      }
    }
  }, [isOpen, mode, systemToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const systemData: WaterSystem = {
      id: mode === 'edit' && systemToEdit ? systemToEdit.id : `sys-${Date.now()}`,
      name: name.trim(),
      centerPoblado: centerPoblado.trim() || 'Sector Centro',
      district: district.trim() || 'Distrito',
      province: province.trim() || 'Provincia',
      department: department.trim() || 'Departamento',
      tankType,
      capacityLiters: Number(capacityLiters) || 1000,
      currentVolumeLiters:
        Number(currentVolumeLiters) > 0 ? Number(currentVolumeLiters) : Math.round(Number(capacityLiters) * 0.8),
      waterSource: waterSource.trim() || 'Manantial',
      responsible: responsible.trim() || 'Operador JASS',
      lastChlorinePpm: Number(lastChlorinePpm) || 0,
      ph: Number(ph) || 7.2,
      turbidityNtu: Number(turbidityNtu) || 0.5,
      operationalStatus,
      disinfectionMethod: disinfectionMethod.trim() || 'Dosificación Asistida',
      observations: observations.trim() || (mode === 'create' ? 'Nuevo sistema registrado en CLORAGUA.' : 'Datos actualizados.'),
      updatedAt: 'Hoy',
      tier: systemToEdit?.tier || 'TIER II',
    };

    onSave(systemData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-[#bcc9ce]/40 flex flex-col gap-4 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#edf5fc] pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                mode === 'edit'
                  ? 'bg-gradient-to-br from-[#00b4d8] to-[#00677d]'
                  : 'bg-gradient-to-br from-[#10e7b2] to-[#006c51]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {mode === 'edit' ? 'edit_note' : 'add_moderator'}
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-[17px] text-[#151d22] leading-tight">
                {mode === 'edit' ? 'Editar Sistema de Agua' : 'Registrar Nuevo Sistema de Agua'}
              </h3>
              <span className="text-[11px] text-[#3d494d]">
                {mode === 'edit'
                  ? `Modificando datos técnicos de ${systemToEdit?.name || 'reservorio'}`
                  : 'Alta de infraestructura hídrica en CLORAGUA (D.S. 031-2010-SA)'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section: Identificación */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-hud text-[#00677d] uppercase font-bold tracking-wider">
              1. Identificación y Ubicación Geográfica
            </span>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#151d22]">
                Nombre del Reservorio / Tanque *
              </label>
              <input
                type="text"
                required
                placeholder="ej. Reservorio Apoyado R-1 (Sector Alto)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Centro Poblado / Sector</label>
                <input
                  type="text"
                  placeholder="ej. Vista Alegre"
                  value={centerPoblado}
                  onChange={(e) => setCenterPoblado(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Distrito</label>
                <input
                  type="text"
                  placeholder="ej. Urubamba"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Provincia</label>
                <input
                  type="text"
                  placeholder="ej. Urubamba"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Región / Departamento</label>
                <input
                  type="text"
                  placeholder="ej. Cusco"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>
            </div>
          </div>

          {/* Section: Capacidad y Geometría */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#edf5fc]">
            <span className="text-[11px] font-hud text-[#00677d] uppercase font-bold tracking-wider">
              2. Capacidad y Tipo de Estructura
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Tipo de Tanque</label>
                <select
                  value={tankType}
                  onChange={(e) => setTankType(e.target.value as TankType)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#edf5fc] text-[12px] font-medium text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                >
                  <option value="cylindrical_vertical">Cilíndrico Vertical (Apoyado/Elevado)</option>
                  <option value="rectangular_cistern">Cisterna Rectangular</option>
                  <option value="cubic">Cúbico</option>
                  <option value="cylindrical_horizontal">Cilíndrico Horizontal</option>
                  <option value="direct_volume">Entrada de Volumen Directo</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Capacidad Total (Litros) *</label>
                <input
                  type="number"
                  step="500"
                  min="100"
                  required
                  value={capacityLiters}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setCapacityLiters(val);
                    if (currentVolumeLiters > val) setCurrentVolumeLiters(val);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] font-bold text-[#00677d] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8] font-hud"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Volumen Actual de Agua (L)</label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  max={capacityLiters}
                  value={currentVolumeLiters}
                  onChange={(e) => setCurrentVolumeLiters(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] font-bold text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8] font-hud"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Fuente de Agua</label>
                <input
                  type="text"
                  placeholder="ej. Manantial ladera / Pozo"
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>
            </div>
          </div>

          {/* Section: Operación y Calidad Sanitaria */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#edf5fc]">
            <span className="text-[11px] font-hud text-[#00677d] uppercase font-bold tracking-wider">
              3. Gestión Sanitaria y Calidad In Situ
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Estado Operativo</label>
                <select
                  value={operationalStatus}
                  onChange={(e) =>
                    setOperationalStatus(e.target.value as 'active' | 'maintenance' | 'alert')
                  }
                  className="w-full px-2.5 py-2 rounded-xl bg-[#edf5fc] text-[12px] font-bold text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                >
                  <option value="active">🟢 Activo / Cloración Conforme</option>
                  <option value="maintenance">🟡 En Mantenimiento / Lavado</option>
                  <option value="alert">🔴 Alerta / Requiere Cloración</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Cloro Residual (ppm Cl₂)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="5.0"
                  value={lastChlorinePpm}
                  onChange={(e) => setLastChlorinePpm(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] font-bold text-[#006c51] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8] font-hud"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">pH del Agua</label>
                <input
                  type="number"
                  step="0.1"
                  min="4.0"
                  max="10.0"
                  value={ph}
                  onChange={(e) => setPh(parseFloat(e.target.value) || 7.2)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Turbiedad (NTU)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50.0"
                  value={turbidityNtu}
                  onChange={(e) => setTurbidityNtu(parseFloat(e.target.value) || 0.5)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Responsable / JASS / EPS</label>
                <input
                  type="text"
                  placeholder="ej. JASS San Pedro / ATM"
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">Método de Cloración</label>
                <input
                  type="text"
                  placeholder="ej. Goteo Constante"
                  value={disinfectionMethod}
                  onChange={(e) => setDisinfectionMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold text-[#151d22]">Observaciones Técnicas</label>
              <textarea
                rows={2}
                placeholder="ej. Reservorio lavado el mes anterior. Válvula de salida en buen estado."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[12px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8] resize-none"
              />
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#edf5fc] mt-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[11px] font-bold uppercase hover:bg-[#e1e9f0] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00677d] to-[#00b4d8] text-white font-hud text-[11px] font-bold uppercase shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>{mode === 'edit' ? 'Guardar Cambios' : 'Registrar Sistema'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
