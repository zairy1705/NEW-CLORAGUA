import React, { useState } from 'react';
import { WaterSystem } from '../../types';

interface SystemsViewProps {
  systems: WaterSystem[];
  activeSystem: WaterSystem;
  onSelectSystem: (system: WaterSystem) => void;
  onNavigateToDosage: (system: WaterSystem) => void;
  onAddNewSystem: () => void;
  onEditSystem: (system: WaterSystem) => void;
  onDeleteSystem: (id: string) => void;
}

export const SystemsView: React.FC<SystemsViewProps> = ({
  systems,
  activeSystem,
  onSelectSystem,
  onNavigateToDosage,
  onAddNewSystem,
  onEditSystem,
  onDeleteSystem,
}) => {
  const [filter, setFilter] = useState<'all' | 'optimal' | 'alert' | 'maintenance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [systemToDelete, setSystemToDelete] = useState<string | null>(null);

  const filteredSystems = systems.filter((sys) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'optimal'
        ? sys.operationalStatus === 'active'
        : filter === 'alert'
        ? sys.operationalStatus === 'alert'
        : sys.operationalStatus === 'maintenance';

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      sys.name.toLowerCase().includes(query) ||
      sys.district.toLowerCase().includes(query) ||
      sys.centerPoblado.toLowerCase().includes(query) ||
      (sys.responsible && sys.responsible.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  const totalCapacity = systems.reduce((acc, curr) => acc + curr.capacityLiters, 0);
  const totalWaterStored = systems.reduce((acc, curr) => acc + (curr.currentVolumeLiters || 0), 0);
  const alertCount = systems.filter((s) => s.operationalStatus === 'alert').length;
  const optimalCount = systems.filter((s) => s.operationalStatus === 'active').length;
  const maintenanceCount = systems.filter((s) => s.operationalStatus === 'maintenance').length;

  const confirmDelete = (id: string) => {
    onDeleteSystem(id);
    setSystemToDelete(null);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-4 pb-28 pt-2">
      {/* View Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-hud text-[11px] text-[#00677d] uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-[16px]">water</span>
            Infraestructura Hídrica y Red de Reservorios
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddNewSystem}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#00677d] to-[#00b4d8] hover:opacity-95 text-white font-hud text-[11px] font-bold uppercase shadow-sm transition-all cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[17px]">add_circle</span>
              <span>+ Registrar Nuevo Sistema</span>
            </button>
          </div>
        </div>

        <h2 className="font-extrabold text-[24px] text-[#151d22] tracking-tight leading-none mt-1">
          Red de Sistemas y Reservorios de Agua
        </h2>
        <p className="text-[13px] text-[#3d494d]">
          Supervisa, edita las dimensiones y agrega nuevos reservorios, tanques elevados, pozos y redes comunales.
        </p>
      </div>

      {/* Summary metric banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-[#bcc9ce]/30 shadow-sm flex flex-col justify-between">
          <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">Total Sistemas</span>
          <div className="font-hud text-[24px] font-extrabold text-[#151d22] mt-1">{systems.length}</div>
          <span className="text-[10px] text-[#00677d] font-semibold">
            {optimalCount} Óptimos • {alertCount} Alertas
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#bcc9ce]/30 shadow-sm flex flex-col justify-between">
          <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">Capacidad Total</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-hud text-[24px] font-extrabold text-[#00677d]">
              {Math.round(totalCapacity / 1000).toLocaleString('es-PE')}
            </span>
            <span className="text-[12px] font-hud text-[#00677d] font-bold">m³</span>
          </div>
          <span className="text-[10px] text-[#3d494d] font-semibold">
            {totalCapacity.toLocaleString('es-PE')} L de aforo
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#bcc9ce]/30 shadow-sm flex flex-col justify-between">
          <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">Agua Almacenada</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-hud text-[24px] font-extrabold text-[#151d22]">
              {Math.round(totalWaterStored / 1000).toLocaleString('es-PE')}
            </span>
            <span className="text-[12px] font-hud text-[#151d22] font-bold">m³</span>
          </div>
          <span className="text-[10px] text-[#006c51] font-semibold">
            {totalCapacity > 0 ? Math.round((totalWaterStored / totalCapacity) * 100) : 0}% nivel promedio
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-[#bcc9ce]/30 shadow-sm flex flex-col justify-between">
          <span className="font-hud text-[10px] text-[#3d494d] uppercase font-bold">Conformidad D.S. 031</span>
          <div className="font-hud text-[24px] font-extrabold text-[#006c51] mt-1">
            {systems.length > 0 ? Math.round((optimalCount / systems.length) * 100) : 100}%
          </div>
          <span className="text-[10px] text-[#006c51] font-semibold">
            {alertCount === 0 ? '100% Protegido' : `${alertCount} Requiere dosificar`}
          </span>
        </div>
      </div>

      {/* Filters and search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white rounded-2xl p-2.5 shadow-sm border border-[#bcc9ce]/30">
        <div className="flex items-center gap-2 px-2 flex-1">
          <span className="material-symbols-outlined text-[#3d494d] text-[18px]">search</span>
          <input
            type="text"
            placeholder="Buscar por nombre, centro poblado, distrito u operador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-[12px] text-[#151d22] placeholder-[#3d494d] focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#3d494d] hover:text-[#ba1a1a] p-1 text-[12px]"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">cancel</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-xl text-[11px] font-hud font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#00b4d8] text-white shadow-sm'
                : 'text-[#3d494d] hover:bg-[#edf5fc]'
            }`}
            type="button"
          >
            Todos ({systems.length})
          </button>
          <button
            onClick={() => setFilter('optimal')}
            className={`px-3 py-1 rounded-xl text-[11px] font-hud font-bold transition-all cursor-pointer ${
              filter === 'optimal'
                ? 'bg-[#006c51] text-white shadow-sm'
                : 'text-[#3d494d] hover:bg-[#edf5fc]'
            }`}
            type="button"
          >
            Óptimos ({optimalCount})
          </button>
          <button
            onClick={() => setFilter('alert')}
            className={`px-3 py-1 rounded-xl text-[11px] font-hud font-bold transition-all cursor-pointer ${
              filter === 'alert'
                ? 'bg-[#ba1a1a] text-white shadow-sm'
                : 'text-[#3d494d] hover:bg-[#edf5fc]'
            }`}
            type="button"
          >
            Alerta ({alertCount})
          </button>
          {maintenanceCount > 0 && (
            <button
              onClick={() => setFilter('maintenance')}
              className={`px-3 py-1 rounded-xl text-[11px] font-hud font-bold transition-all cursor-pointer ${
                filter === 'maintenance'
                  ? 'bg-[#607600] text-white shadow-sm'
                  : 'text-[#3d494d] hover:bg-[#edf5fc]'
              }`}
              type="button"
            >
              Mantenimiento ({maintenanceCount})
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredSystems.length === 0 && (
        <div className="bg-white rounded-3xl p-8 border border-dashed border-[#bcc9ce] text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#edf5fc] text-[#00677d] flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">search_off</span>
          </div>
          <div>
            <h4 className="font-extrabold text-[16px] text-[#151d22]">No se encontraron sistemas</h4>
            <p className="text-[12px] text-[#3d494d] mt-0.5">
              No hay reservorios que coincidan con los criterios de búsqueda o filtro.
            </p>
          </div>
          <button
            onClick={onAddNewSystem}
            className="mt-2 px-4 py-2 rounded-full bg-[#00677d] text-white font-hud text-[11px] font-bold uppercase shadow-sm hover:bg-[#004e5f] cursor-pointer flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>Registrar Nuevo Sistema</span>
          </button>
        </div>
      )}

      {/* List of systems cards */}
      <div className="flex flex-col gap-3.5">
        {filteredSystems.map((sys) => {
          const isActive = sys.id === activeSystem.id;
          const isAlert = sys.operationalStatus === 'alert';
          const isMaintenance = sys.operationalStatus === 'maintenance';
          const fillPercent =
            sys.capacityLiters > 0
              ? Math.min(100, Math.round(((sys.currentVolumeLiters || 0) / sys.capacityLiters) * 100))
              : 0;

          return (
            <div
              key={sys.id}
              className={`rounded-3xl p-5 transition-all bg-white shadow-sm border ${
                isActive
                  ? 'border-2 border-[#00b4d8] shadow-[0_4px_20px_rgba(0,180,216,0.15)] ring-1 ring-[#00b4d8]/30'
                  : 'border-[#bcc9ce]/30 hover:border-[#00b4d8]/60'
              }`}
            >
              {/* Card Header & Status */}
              <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      isAlert
                        ? 'bg-[#ffdad6] text-[#ba1a1a]'
                        : isMaintenance
                        ? 'bg-[#caf300]/40 text-[#334000]'
                        : 'bg-gradient-to-br from-[#00b4d8]/20 to-[#00677d]/20 text-[#00677d]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[26px]">
                      {isAlert ? 'warning' : isMaintenance ? 'build' : 'water_damage'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-[17px] text-[#151d22] leading-tight truncate">
                        {sys.name}
                      </h4>
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#00b4d8] text-white font-hud text-[9px] font-bold uppercase tracking-wider shadow-xs">
                          SELECCIONADO
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-[#edf5fc] text-[#00677d] font-hud text-[9px] font-bold uppercase">
                        {sys.tier || 'TIER II'}
                      </span>
                    </div>

                    <div className="text-[12px] text-[#3d494d] mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-[#151d22]">
                        📍 {sys.centerPoblado}, {sys.district}
                      </span>
                      <span>•</span>
                      <span>{sys.department || sys.province || 'Perú'}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#3d494d] flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                        🧱{' '}
                        {sys.tankType === 'cylindrical_vertical'
                          ? 'Cilíndrico Vertical'
                          : sys.tankType === 'rectangular_cistern'
                          ? 'Cisterna Rectangular'
                          : sys.tankType === 'cubic'
                          ? 'Cúbico'
                          : sys.tankType === 'cylindrical_horizontal'
                          ? 'Cilíndrico Horizontal'
                          : 'Volumen Directo'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                        💧 Fuente: {sys.waterSource || 'Manantial'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                        👤 {sys.responsible || 'JASS'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chlorine status badge */}
                <div className="flex flex-col items-end shrink-0 sm:self-start">
                  <span
                    className={`px-3.5 py-1.5 rounded-full font-hud text-[13px] font-extrabold uppercase shadow-xs ${
                      isAlert
                        ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]'
                        : isMaintenance
                        ? 'bg-[#caf300]/40 text-[#334000] border border-[#caf300]'
                        : 'bg-[#43fec7]/30 text-[#00513c] border border-[#43fec7]'
                    }`}
                  >
                    {sys.lastChlorinePpm.toFixed(2)} ppm Cl₂
                  </span>
                  <span className="text-[10px] font-medium text-[#3d494d] mt-1">
                    {isAlert
                      ? '⚠️ Alerta: Bajo Cloro'
                      : isMaintenance
                      ? '🟡 En Mantenimiento'
                      : '🟢 Rango Óptimo D.S. 031'}
                  </span>
                </div>
              </div>

              {/* Water Volume & Level Bar */}
              <div className="mt-3.5 p-3 rounded-2xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-hud font-bold text-[#00677d] uppercase text-[10px]">
                      Nivel de Almacenamiento:
                    </span>
                    <span className="font-bold text-[#151d22]">
                      {(sys.currentVolumeLiters || 0).toLocaleString('es-PE')} L
                    </span>
                    <span className="text-[#3d494d]">
                      de {sys.capacityLiters.toLocaleString('es-PE')} L de capacidad
                    </span>
                  </div>
                  <span className="font-hud font-bold text-[#00677d] text-[11px]">
                    {fillPercent}%
                  </span>
                </div>
                <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#bcc9ce]/30">
                  <div
                    className="h-full bg-gradient-to-r from-[#00b4d8] to-[#00677d] rounded-full transition-all duration-500"
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#3d494d] pt-0.5">
                  <span>Método: {sys.disinfectionMethod || 'Dosificación Asistida'}</span>
                  <span>
                    pH {sys.ph || 7.2} • Turbiedad {sys.turbidityNtu ?? 0.5} NTU
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-[#edf5fc] flex-wrap gap-2">
                <div className="text-[11px] text-[#3d494d] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">history</span>
                  <span>Actualizado: {sys.updatedAt || 'Hoy'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* EDIT BUTTON */}
                  <button
                    onClick={() => onEditSystem(sys)}
                    className="px-3 py-1.5 rounded-full bg-white border border-[#bcc9ce]/50 hover:bg-[#edf5fc] text-[#00677d] font-hud text-[11px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    type="button"
                    title="Editar dimensiones y datos técnicos de este sistema"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>Editar</span>
                  </button>

                  {/* SELECT BUTTON */}
                  {!isActive && (
                    <button
                      onClick={() => onSelectSystem(sys)}
                      className="px-3 py-1.5 rounded-full bg-[#edf5fc] hover:bg-[#b3ebff] text-[#00677d] font-hud text-[11px] font-bold uppercase transition-colors cursor-pointer"
                      type="button"
                    >
                      Seleccionar
                    </button>
                  )}

                  {/* DOSAGE WIZARD BUTTON */}
                  <button
                    onClick={() => {
                      onSelectSystem(sys);
                      onNavigateToDosage(sys);
                    }}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00b4d8] to-[#00677d] hover:opacity-95 text-white font-hud text-[11px] font-bold uppercase shadow-sm flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">science</span>
                    <span>Dosificar</span>
                  </button>

                  {/* DELETE BUTTON */}
                  {systems.length > 1 && (
                    <button
                      onClick={() => setSystemToDelete(sys.id)}
                      className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-full transition-colors cursor-pointer"
                      title="Eliminar sistema"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {systemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-[#bcc9ce]/40 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h4 className="font-extrabold text-[16px] text-[#151d22]">¿Eliminar Sistema?</h4>
            </div>
            <p className="text-[12px] text-[#3d494d]">
              ¿Estás seguro de que deseas eliminar este sistema de agua de la red de vigilancia? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#edf5fc]">
              <button
                onClick={() => setSystemToDelete(null)}
                className="px-4 py-1.5 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[11px] font-bold uppercase hover:bg-[#e1e9f0]"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmDelete(systemToDelete)}
                className="px-4 py-1.5 rounded-full bg-[#ba1a1a] text-white font-hud text-[11px] font-bold uppercase shadow-sm hover:bg-[#93000a]"
                type="button"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
