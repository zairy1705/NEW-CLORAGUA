import React, { useState } from 'react';
import { SurveillanceRecord } from '../../types';
import { generateSurveillanceReportPdf } from '../../utils/pdfGenerator';

interface RecordsViewProps {
  records: SurveillanceRecord[];
  onOpenNormative: () => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({ records, onOpenNormative }) => {
  const [filter, setFilter] = useState<'all' | 'optimal' | 'danger'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfScope, setPdfScope] = useState<'filtered' | 'all'>('filtered');
  const [operatorName, setOperatorName] = useState('Ing. Carlos Mendoza (ATM / JASS)');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  const filteredRecords = records.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'optimal') return r.status === 'optimal';
    if (filter === 'danger') return r.status === 'danger' || r.status === 'warning';
    return true;
  });

  // Calculate trends for currently filtered records
  const totalCount = records.length;
  const optimalCount = records.filter((r) => r.status === 'optimal').length;
  const alertCount = records.filter((r) => r.status !== 'optimal').length;
  const complianceRate = totalCount > 0 ? (optimalCount / totalCount) * 100 : 100;

  const avgChlorine =
    totalCount > 0
      ? records.reduce((acc, r) => acc + (r.postChlorinePpm ?? r.targetChlorinePpm), 0) / totalCount
      : 0;

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Fecha',
      'Hora',
      'Sistema',
      'Centro Poblado',
      'Punto Muestreo',
      'Volumen (L)',
      'Producto',
      'Concentracion (%)',
      'Cloro Inicial (mg/L)',
      'Cloro Objetivo (mg/L)',
      'Dosis Aplicada',
      'Cloro Verificado (mg/L)',
      'Tiempo Contacto (min)',
      'pH',
      'Turbiedad (NTU)',
      'Temp (°C)',
      'Estado',
      'Responsable',
      'Observaciones',
    ];

    const rows = records.map((r) => [
      r.id,
      r.dateStr,
      r.timeStr,
      `"${r.systemName}"`,
      `"${r.centerPoblado}"`,
      `"${r.measurementPoint}"`,
      r.volumeLiters,
      `"${r.productName}"`,
      r.concentrationPercent,
      r.initialChlorinePpm,
      r.targetChlorinePpm,
      `"${r.calculatedDoseValue} ${r.calculatedDoseUnit}"`,
      r.postChlorinePpm,
      r.contactTimeMinutes,
      r.ph,
      r.turbidityNtu,
      r.temperatureC,
      r.status,
      `"${r.responsible}"`,
      `"${r.observations}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CLORAGUA_Bitacora_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        const recordsToExport = pdfScope === 'filtered' ? filteredRecords : records;
        generateSurveillanceReportPdf({
          records: recordsToExport,
          filterType: pdfScope === 'filtered' ? filter : 'all',
          operatorName: operatorName.trim() || 'Personal de Vigilancia Sanitaria',
        });
        setPdfSuccessMessage('¡Reporte PDF generado y descargado exitosamente!');
        setTimeout(() => {
          setPdfSuccessMessage(null);
          setIsPdfModalOpen(false);
        }, 1500);
      } catch (err) {
        console.error('Error al generar PDF:', err);
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 400);
  };

  const handleCopyRecord = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto gap-4 pb-28 pt-2">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-hud text-[11px] text-[#00677d] uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Libro de Registro Oficial DIGESA
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenNormative}
              className="px-3 py-1.5 rounded-full bg-white border border-[#bcc9ce]/40 text-[#00677d] font-hud text-[11px] font-bold uppercase hover:bg-[#edf5fc] cursor-pointer"
              type="button"
            >
              📖 D.S. 031-2010
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#edf5fc] text-[#00677d] border border-[#bcc9ce]/40 font-hud text-[11px] font-bold uppercase hover:bg-[#e1e9f0] cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px]">download</span>
              <span>CSV</span>
            </button>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#00677d] to-[#00b4d8] text-white font-hud text-[11px] font-bold uppercase shadow-sm hover:opacity-95 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
              <span>Generar Reporte PDF</span>
            </button>
          </div>
        </div>

        <h2 className="font-extrabold text-[24px] text-[#151d22] tracking-tight leading-none mt-1">
          Bitácora de Vigilancia Sanitaria
        </h2>
        <p className="text-[13px] text-[#3d494d]">
          Historial inmutable de dosificaciones, calibraciones y controles de cloro residual libre.
        </p>
      </div>

      {/* Measurement Trends Summary Card */}
      <div className="bg-gradient-to-br from-white via-[#f5faff] to-[#edf5fc] rounded-3xl p-4 shadow-sm border border-[#bcc9ce]/40 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00677d]/10 text-[#00677d] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">insights</span>
            </div>
            <div>
              <span className="font-hud text-[11px] text-[#00677d] uppercase font-bold tracking-wider block">
                Tendencias de Calidad y Cumplimiento Normativo
              </span>
              <span className="text-[11px] text-[#3d494d]">
                Basado en {totalCount} mediciones registradas in situ con DPD
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setPdfScope('all');
              setIsPdfModalOpen(true);
            }}
            className="hidden sm:flex items-center gap-1 text-[11px] text-[#00677d] font-hud font-bold hover:underline cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[14px]">print</span>
            <span>Imprimir Informe</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-white border border-[#bcc9ce]/30">
            <span className="text-[10px] font-hud text-[#3d494d] uppercase font-bold block">
              Cumplimiento D.S. 031
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`font-hud text-[20px] font-extrabold ${
                  complianceRate >= 80 ? 'text-[#006c51]' : 'text-[#ba1a1a]'
                }`}
              >
                {complianceRate.toFixed(0)}%
              </span>
              <span className="text-[10px] text-[#3d494d]">({optimalCount}/{totalCount})</span>
            </div>
            <div className="w-full bg-[#edf5fc] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full ${
                  complianceRate >= 80 ? 'bg-[#006c51]' : 'bg-[#ba1a1a]'
                }`}
                style={{ width: `${complianceRate}%` }}
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#bcc9ce]/30">
            <span className="text-[10px] font-hud text-[#3d494d] uppercase font-bold block">
              Cloro Promedio
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-hud text-[20px] font-extrabold text-[#00677d]">
                {avgChlorine.toFixed(2)}
              </span>
              <span className="text-[11px] font-hud text-[#00677d] font-bold">mg/L</span>
            </div>
            <span className="text-[10px] text-[#3d494d] block mt-1">
              Rango meta: 0.50 – 2.00
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#bcc9ce]/30">
            <span className="text-[10px] font-hud text-[#3d494d] uppercase font-bold block">
              Muestras Óptimas
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-hud text-[20px] font-extrabold text-[#006c51]">
                {optimalCount}
              </span>
              <span className="text-[11px] text-[#3d494d]">conforme</span>
            </div>
            <span className="text-[10px] text-[#006c51] font-bold block mt-1">
              Barrera germicida activa
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-[#bcc9ce]/30">
            <span className="text-[10px] font-hud text-[#3d494d] uppercase font-bold block">
              No Conformidades
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span
                className={`font-hud text-[20px] font-extrabold ${
                  alertCount > 0 ? 'text-[#ba1a1a]' : 'text-[#006c51]'
                }`}
              >
                {alertCount}
              </span>
              <span className="text-[11px] text-[#3d494d]">alertas</span>
            </div>
            <span className="text-[10px] text-[#3d494d] block mt-1">
              {alertCount === 0 ? 'Red 100% protegida' : 'Requieren dosificación'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-2 shadow-sm border border-[#bcc9ce]/30 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-hud font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-[#00b4d8] text-white'
                : 'text-[#3d494d] hover:bg-[#edf5fc]'
            }`}
            type="button"
          >
            Todos ({records.length})
          </button>
          <button
            onClick={() => setFilter('optimal')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-hud font-bold transition-all cursor-pointer ${
              filter === 'optimal'
                ? 'bg-[#006c51] text-white'
                : 'text-[#3d494d] hover:bg-[#edf5fc]'
            }`}
            type="button"
          >
            Óptimos ({records.filter((r) => r.status === 'optimal').length})
          </button>
          <button
            onClick={() => setFilter('danger')}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-hud font-bold transition-all cursor-pointer ${
              filter === 'danger'
                ? 'bg-[#ba1a1a] text-white'
                : 'text-[#3d494d] hover:bg-[#edf5fc]'
            }`}
            type="button"
          >
            Alertas ({records.filter((r) => r.status !== 'optimal').length})
          </button>
        </div>

        <span className="text-[11px] text-[#3d494d] font-hud font-bold">
          {filteredRecords.length} EVENTOS EN LISTA
        </span>
      </div>

      {/* Record cards list */}
      <div className="flex flex-col gap-3">
        {filteredRecords.map((r) => {
          const isOptimal = r.status === 'optimal';
          const isDanger = r.status === 'danger';
          const postCl = r.postChlorinePpm ?? r.targetChlorinePpm;

          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-[#bcc9ce]/30 flex flex-col gap-3 hover:border-[#00b4d8]/40 transition-all"
            >
              {/* Card top */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[15px] text-[#151d22]">
                      {r.systemName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#edf5fc] text-[#00677d] font-hud text-[10px] font-bold">
                      {r.dateStr} • {r.timeStr}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#3d494d] mt-0.5">
                    {r.centerPoblado} • {r.measurementPoint}
                  </div>
                </div>

                {/* Status pill */}
                <span
                  className={`px-3 py-1 rounded-full font-hud text-[11px] font-bold uppercase ${
                    isOptimal
                      ? 'bg-[#43fec7]/30 text-[#00513c]'
                      : isDanger
                      ? 'bg-[#ffdad6] text-[#93000a]'
                      : 'bg-[#caf300]/40 text-[#334000]'
                  }`}
                >
                  {isOptimal ? '🟢 Óptimo' : isDanger ? '🔴 Alerta Bajo' : '🟡 Sobredosis'}
                </span>
              </div>

              {/* Data metric grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] p-3 rounded-xl bg-[#edf5fc]/70">
                <div>
                  <span className="text-[#3d494d] font-hud text-[9px] uppercase font-bold block">
                    Cloro Verificado
                  </span>
                  <span
                    className={`font-hud text-[16px] font-extrabold ${
                      isOptimal ? 'text-[#006c51]' : 'text-[#ba1a1a]'
                    }`}
                  >
                    {postCl.toFixed(2)} ppm
                  </span>
                </div>

                <div>
                  <span className="text-[#3d494d] font-hud text-[9px] uppercase font-bold block">
                    Dosis Aplicada
                  </span>
                  <span className="font-hud text-[14px] font-bold text-[#00677d]">
                    {r.calculatedDoseValue} {r.calculatedDoseUnit}
                  </span>
                  <div className="text-[10px] text-[#3d494d] truncate">{r.productName}</div>
                </div>

                <div>
                  <span className="text-[#3d494d] font-hud text-[9px] uppercase font-bold block">
                    Volumen Tratado
                  </span>
                  <span className="font-hud text-[14px] font-bold text-[#151d22]">
                    {r.volumeLiters.toLocaleString('es-PE')} L
                  </span>
                  <div className="text-[10px] text-[#3d494d]">CT: {r.contactTimeMinutes} min</div>
                </div>

                <div>
                  <span className="text-[#3d494d] font-hud text-[9px] uppercase font-bold block">
                    Parámetros Fisicoquímicos
                  </span>
                  <span className="text-[12px] font-medium text-[#151d22]">
                    pH {r.ph || 7.2} • {r.turbidityNtu ?? 0.5} NTU • {r.temperatureC || 20}°C
                  </span>
                </div>
              </div>

              {/* Observations & Responsible */}
              <div className="flex items-center justify-between text-[11px] text-[#3d494d] pt-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-[15px] text-[#00677d] shrink-0">
                    badge
                  </span>
                  <span className="truncate">
                    <strong>Operador:</strong> {r.responsible}
                  </span>
                  {r.observations && (
                    <span className="text-[#3d494d] truncate hidden sm:inline">
                      — {r.observations}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      handleCopyRecord(
                        r.id,
                        `Registro de Cloración: ${r.systemName} (${r.dateStr}). Cloro Verificado: ${postCl} ppm. Dosis: ${r.calculatedDoseValue} ${r.calculatedDoseUnit}. Operador: ${r.responsible}`
                      )
                    }
                    className="p-1 text-[#00677d] hover:bg-[#edf5fc] rounded-lg transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedId === r.id ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedId === r.id ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <span className="font-hud text-[10px] text-[#006c51] font-bold">
                    +{r.xpEarned} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PDF Generation Configuration Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border border-[#bcc9ce]/40 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#edf5fc] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#00677d] text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-[16px] text-[#151d22]">
                    Generar Reporte Oficial PDF
                  </h3>
                  <span className="text-[11px] text-[#3d494d]">
                    Conforme a D.S. N.° 031-2010-SA (MINSA / DIGESA)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#edf5fc] text-[#3d494d] flex items-center justify-center hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-[13px]">
              {/* Scope selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-[#151d22]">
                  Selección de Registros a Incluir
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPdfScope('filtered')}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                      pdfScope === 'filtered'
                        ? 'border-[#00b4d8] bg-[#edf5fc] text-[#00677d]'
                        : 'border-[#bcc9ce]/40 text-[#3d494d] hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-[12px] flex items-center gap-1">
                      {pdfScope === 'filtered' && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                      Vista Filtrada
                    </span>
                    <span className="text-[10px] opacity-80">
                      {filteredRecords.length} eventos actuales ({filter})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPdfScope('all')}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col gap-0.5 cursor-pointer transition-all ${
                      pdfScope === 'all'
                        ? 'border-[#00b4d8] bg-[#edf5fc] text-[#00677d]'
                        : 'border-[#bcc9ce]/40 text-[#3d494d] hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-[12px] flex items-center gap-1">
                      {pdfScope === 'all' && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                      Historial Completo
                    </span>
                    <span className="text-[10px] opacity-80">
                      {records.length} eventos en total
                    </span>
                  </button>
                </div>
              </div>

              {/* Operator Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-bold text-[#151d22]">
                  Responsable Técnico / Auditor Firmante
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="ej. Ing. Carlos Mendoza (ATM / JASS)"
                  className="w-full px-3 py-2 rounded-xl bg-[#edf5fc] text-[13px] text-[#151d22] border border-[#bcc9ce]/40 focus:outline-none focus:border-[#00b4d8]"
                />
                <span className="text-[10px] text-[#3d494d]">
                  Se imprimirá en la sección de firmas y sello institucional.
                </span>
              </div>

              {/* Preview content summary */}
              <div className="p-3 rounded-2xl bg-[#edf5fc]/80 border border-[#bcc9ce]/30 flex flex-col gap-1 text-[11px] text-[#3d494d]">
                <div className="font-bold text-[#00677d] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">description</span>
                  Estructura del Documento Generado:
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Encabezado institucional MINSA / DIGESA con folio</li>
                  <li>Métricas KPI (Cumplimiento %, Cloro Promedio, Turbiedad, pH)</li>
                  <li>Diagnóstico de tendencias y evolución sanitaria</li>
                  <li>Tabla cronológica de mediciones con semáforo normativo</li>
                  <li>Espacio para sello y firmas de ATM / JASS</li>
                </ul>
              </div>

              {pdfSuccessMessage && (
                <div className="p-2.5 rounded-xl bg-[#43fec7]/30 text-[#00513c] text-[12px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  <span>{pdfSuccessMessage}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#edf5fc]">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                type="button"
                className="px-4 py-2 rounded-full bg-[#edf5fc] text-[#3d494d] font-hud text-[11px] font-bold uppercase hover:bg-[#e1e9f0]"
              >
                Cancelar
              </button>
              <button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                type="button"
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00677d] to-[#00b4d8] text-white font-hud text-[11px] font-bold uppercase shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">
                      progress_activity
                    </span>
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">file_download</span>
                    <span>Descargar PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
