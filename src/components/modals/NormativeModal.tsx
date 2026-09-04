import React, { useState } from 'react';

interface NormativeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NormativeModal: React.FC<NormativeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ds031' | 'lmp' | 'sampling' | 'safety'>('ds031');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl p-5 max-w-2xl w-full shadow-2xl border border-[#bcc9ce]/40 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#edf5fc] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#00677d] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </div>
            <div>
              <h3 className="font-extrabold text-[16px] text-[#151d22]">
                Normativa y Documentos Técnicos MINSA/DIGESA
              </h3>
              <span className="text-[11px] text-[#3d494d]">
                D.S. N.° 031-2010-SA – Reglamento de la Calidad del Agua para Consumo Humano
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#edf5fc] text-[#3d494d] flex items-center justify-center hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#edf5fc] p-1 rounded-2xl">
          {[
            { id: 'ds031', label: 'D.S. 031-2010' },
            { id: 'lmp', label: 'Parámetros LMP' },
            { id: 'sampling', label: 'Toma de Muestra' },
            { id: 'safety', label: 'Seguridad y EPP' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-hud font-bold uppercase transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#00b4d8] text-white shadow-sm'
                  : 'text-[#3d494d] hover:bg-white/60'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'ds031' && (
          <div className="flex flex-col gap-3 text-[13px] text-[#3d494d]">
            <div className="p-3.5 rounded-2xl bg-[#edf5fc] border border-[#00b4d8]/30 flex flex-col gap-1">
              <span className="font-hud text-[11px] text-[#00677d] uppercase font-bold">
                Objetivo y Alcance del D.S. 031-2010-SA
              </span>
              <p className="leading-relaxed">
                Establece las disposiciones generales con relación a la calidad del agua para consumo humano en el territorio de la República del Perú, a fin de garantizar su inocuidad, prevenir los factores de riesgo sanitario y proteger la salud pública de la población.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl border border-[#bcc9ce]/30">
                <span className="font-bold text-[13px] text-[#151d22] block mb-1">
                  Artículo 40: Desinfección Obligatoria
                </span>
                <p className="text-[12px] text-[#3d494d] leading-normal">
                  Toda agua suministrada para consumo humano debe ser sometida a un proceso continuo de desinfección química que garantice la eliminación de organismos patógenos.
                </p>
              </div>

              <div className="p-3 rounded-2xl border border-[#bcc9ce]/30">
                <span className="font-bold text-[13px] text-[#151d22] block mb-1">
                  Artículo 66: Concentración Mínima
                </span>
                <p className="text-[12px] text-[#3d494d] leading-normal">
                  El agua de consumo humano en cualquier punto de la red de distribución debe contener una concentración de cloro residual libre no menor a <strong>0.5 mg/L</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#43fec7]/20 border border-[#43fec7] text-[#00513c] text-[12px]">
              <strong>Rol de DIGESA / DIRESA / GERESA:</strong> Autoridades sanitarias competentes para la vigilancia sistemática de la calidad del agua tanto en ámbitos urbanos (EPS/SEDAPAL) como rurales (JASS/Municipalidades).
            </div>
          </div>
        )}

        {activeTab === 'lmp' && (
          <div className="flex flex-col gap-3 text-[13px] text-[#3d494d]">
            <div className="overflow-x-auto rounded-2xl border border-[#bcc9ce]/40">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-[#edf5fc] font-hud text-[10px] text-[#00677d] uppercase font-bold border-b border-[#bcc9ce]/30">
                  <tr>
                    <th className="p-2.5">Parámetro</th>
                    <th className="p-2.5">Límite Normativo</th>
                    <th className="p-2.5">Rango Recomendado</th>
                    <th className="p-2.5">Impacto Sanitario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf5fc]">
                  <tr>
                    <td className="p-2.5 font-bold text-[#151d22]">Cloro Residual Libre</td>
                    <td className="p-2.5 font-semibold text-[#006c51]">≥ 0.50 mg/L</td>
                    <td className="p-2.5">0.50 – 2.00 mg/L</td>
                    <td className="p-2.5 text-[#3d494d]">Garantiza barrera germicida en red</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#151d22]">Turbiedad</td>
                    <td className="p-2.5 font-semibold text-[#006c51]">&lt; 5.0 NTU</td>
                    <td className="p-2.5">&lt; 1.0 NTU</td>
                    <td className="p-2.5 text-[#3d494d]">Partículas protegen microbios del cloro</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#151d22]">pH</td>
                    <td className="p-2.5 font-semibold text-[#006c51]">6.5 – 8.5</td>
                    <td className="p-2.5">6.8 – 7.6</td>
                    <td className="p-2.5 text-[#3d494d]">A pH &gt; 8.0 disminuye el ácido hipocloroso (HClO)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#151d22]">Coliformes Totales / E. coli</td>
                    <td className="p-2.5 font-semibold text-[#ba1a1a]">0 UFC / 100 mL</td>
                    <td className="p-2.5">Ausencia absoluta</td>
                    <td className="p-2.5 text-[#3d494d]">Inocuidad microbiológica obligatoria</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-[#151d22]">Tiempo Contacto (CT)</td>
                    <td className="p-2.5 font-semibold text-[#00677d]">≥ 30 minutos</td>
                    <td className="p-2.5">≥ 30 min a pH 7.0</td>
                    <td className="p-2.5 text-[#3d494d]">Tiempo necesario de inactivación bacteriana</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-2xl bg-[#fff8e1] border border-[#ffe082] text-[#5d4037] text-[11px]">
              ⚠️ <strong>Relación Cloro-pH:</strong> El cloro en agua forma Ácido Hipocloroso (HClO, desinfectante 80 veces más potente) e Ión Hipoclorito (ClO⁻). A pH 7.0 predomina HClO (78%). A pH 8.5 predomina ClO⁻ (91%), reduciendo drásticamente la capacidad germicida.
            </div>
          </div>
        )}

        {activeTab === 'sampling' && (
          <div className="flex flex-col gap-3 text-[13px] text-[#3d494d]">
            <span className="font-bold text-[#151d22]">
              Protocolo Oficial de Toma de Muestra en Campo (MINSA/DIGESA):
            </span>
            <ol className="space-y-2 list-decimal list-inside text-[12px] leading-relaxed">
              <li className="p-2.5 rounded-xl bg-[#edf5fc]">
                <strong>Puntos de Muestreo:</strong> Seleccionar grifos conectados directamente a la red de distribución (no conectados a tinacos o tanques domiciliarios).
              </li>
              <li className="p-2.5 rounded-xl bg-[#edf5fc]">
                <strong>Inspección del Grifo:</strong> No tomar muestras en grifos con fugas, mangueras acopladas, filtros o aireadores. Retirar filtros previos.
              </li>
              <li className="p-2.5 rounded-xl bg-[#edf5fc]">
                <strong>Purga Previa:</strong> Abrir el grifo a flujo moderado y dejar correr el agua entre <strong>1 y 2 minutos</strong> para evacuar el agua estancada en la tubería interna.
              </li>
              <li className="p-2.5 rounded-xl bg-[#edf5fc]">
                <strong>Lectura Inmediata:</strong> Realizar la determinación de cloro residual libre <strong>in situ</strong> de inmediato usando reactivo DPD (fotómetro o comparador de disco), antes de que el cloro se volatilice.
              </li>
            </ol>
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="flex flex-col gap-3 text-[13px] text-[#3d494d]">
            <div className="p-3.5 rounded-2xl bg-[#ffdad6]/50 border border-[#ba1a1a]/30 text-[#93000a] flex items-start gap-2">
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
              <div className="text-[12px]">
                <strong>Riesgo Químico:</strong> El cloro es un oxidante fuerte. En contacto con ácidos o altas temperaturas desprende cloro gas (tóxico y corrosivo). Nunca mezcle hipoclorito con desincrustantes o sustancias orgánicas.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[12px]">
              <div className="p-3 rounded-2xl border border-[#bcc9ce]/30">
                <span className="font-bold text-[#151d22] block mb-1">
                  Equipo de Protección Personal (EPP):
                </span>
                <ul className="list-disc list-inside space-y-1">
                  <li>Guantes de nitrilo o neopreno.</li>
                  <li>Gafas o visera de protección ocular con sello lateral.</li>
                  <li>Mascarilla con filtro para gases/vapores de cloro.</li>
                  <li>Mandil o pechera impermeable de PVC.</li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl border border-[#bcc9ce]/30">
                <span className="font-bold text-[#151d22] block mb-1">
                  Condiciones de Almacenamiento:
                </span>
                <ul className="list-disc list-inside space-y-1">
                  <li>Lugar techado, seco y con ventilación cruzada.</li>
                  <li>Lejos de luz solar directa y fuentes de calor.</li>
                  <li>Envases herméticamente cerrados sobre parihuelas.</li>
                  <li>Rotulación clara con pictogramas de seguridad.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[#edf5fc]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#00b4d8] hover:bg-[#00677d] text-white font-hud text-[11px] font-bold uppercase shadow-sm cursor-pointer"
            type="button"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
