'use client';

import { useSimulationStore } from '@/store/simulationStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState, useMemo } from 'react';
import { useLanguage } from './LanguageProvider';

interface ChartsPanelProps {
  onClose: () => void;
}

export default function ChartsPanel({ onClose }: ChartsPanelProps) {
  const { trajectories, projectiles } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'trajectory' | 'height' | 'velocity'>('trajectory');
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tableShotId, setTableShotId] = useState<string | null>(null);
  const { t } = useLanguage();

  // Prepare data for charts and analytics
  const processedData = useMemo(() => {
    return Object.entries(trajectories).map(([id, points]) => {
      const projectile = projectiles.find((p) => p.id === id);
      const color = projectile ? `#${Math.floor(Math.random() * 16777215).toString(16)}` : '#ff0000';

      // Calculate analytics
      const maxHeight = Math.max(...points.map(p => p.y));
      const maxRange = Math.max(...points.map(p => p.x));
      const flightTime = points.length > 0 ? points[points.length - 1].time : 0;

      // Calculate velocities for table
      const pointsWithVelocity = points.map((p, i, arr) => {
        let vx = 0;
        let vy = 0;
        if (i > 0) {
          const prev = arr[i - 1];
          const dt = p.time - prev.time;
          if (dt > 0) {
            vx = (p.x - prev.x) / dt;
            vy = (p.y - prev.y) / dt;
          }
        } else if (arr.length > 1) {
          // Estimate initial velocity from first two points
          const next = arr[1];
          const dt = next.time - p.time;
          if (dt > 0) {
            vx = (next.x - p.x) / dt;
            vy = (next.y - p.y) / dt;
          }
        }
        return { ...p, vx, vy };
      });

      return {
        id,
        points: pointsWithVelocity,
        color,
        name: `${t('charts.shot')} ${id.substr(-4)}`,
        windEnabled: projectile?.windEnabled,
        stats: {
          maxHeight,
          maxRange,
          flightTime
        }
      };
    });
  }, [trajectories, projectiles, t]);

  // Set initial table shot if not set
  if (tableShotId === null && processedData.length > 0) {
    setTableShotId(processedData[0].id);
  }

  const selectedShotData = processedData.find(d => d.id === tableShotId);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl text-xs z-50">
          <p className="text-white/60 mb-1">{`${t('charts.time')}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-mono">
              {`${entry.name}: ${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleLineClick = (data: any) => {
    if (data && data.id) {
      setSelectedShotId(prev => prev === data.id ? null : data.id);
      setTableShotId(data.id);
    }
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 shadow-2xl transition-all duration-300 ease-in-out z-20 flex flex-col ${isExpanded ? 'h-[85vh]' : 'h-[400px]'
        }`}
    >
      {/* Header & Controls */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40 shrink-0">
        <div className="flex gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('trajectory')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'trajectory' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            {t('charts.trajectory')}
          </button>
          <button
            onClick={() => setActiveTab('height')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'height' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            {t('charts.height')}
          </button>
          <button
            onClick={() => setActiveTab('velocity')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'velocity' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            {t('charts.velocity')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title={isExpanded ? t('charts.collapse') : t('charts.expand')}
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title={t('charts.close')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Charts Section */}
        <div className="h-[300px] w-full shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'trajectory' ? (
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" dataKey="x" name="Distancia" unit="m" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="Altura" unit="m" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {processedData.map((series) => (
                  <Line
                    key={series.id}
                    data={series.points}
                    type="monotone"
                    dataKey="y"
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={selectedShotId === series.id ? 4 : 2}
                    strokeOpacity={selectedShotId && selectedShotId !== series.id ? 0.1 : 1}
                    dot={false}
                    activeDot={{ r: 6, onClick: () => handleLineClick(series) }}
                    cursor="pointer"
                    onClick={() => handleLineClick(series)}
                  />
                ))}
              </LineChart>
            ) : activeTab === 'height' ? (
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" dataKey="time" name="Tiempo" unit="s" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} allowDuplicatedCategory={false} />
                <YAxis type="number" dataKey="y" name="Altura" unit="m" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {processedData.map((series) => (
                  <Line
                    key={series.id}
                    data={series.points}
                    type="monotone"
                    dataKey="y"
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={selectedShotId === series.id ? 4 : 2}
                    strokeOpacity={selectedShotId && selectedShotId !== series.id ? 0.1 : 1}
                    dot={false}
                    activeDot={{ r: 6, onClick: () => handleLineClick(series) }}
                    cursor="pointer"
                    onClick={() => handleLineClick(series)}
                  />
                ))}
              </LineChart>
            ) : (
              <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis type="number" dataKey="time" name="Tiempo" unit="s" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} allowDuplicatedCategory={false} />
                <YAxis type="number" name="Velocidad" unit="m/s" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                {processedData.map((series) => (
                  <Line
                    key={series.id}
                    data={series.points}
                    type="monotone"
                    dataKey="vx" // Showing Vx for now
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={selectedShotId === series.id ? 4 : 2}
                    strokeOpacity={selectedShotId && selectedShotId !== series.id ? 0.1 : 1}
                    dot={false}
                    activeDot={{ r: 6, onClick: () => handleLineClick(series) }}
                    cursor="pointer"
                    onClick={() => handleLineClick(series)}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {processedData.map((data) => (
            <div
              key={data.id}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedShotId === data.id
                  ? 'bg-white/10 border-white/30 ring-1 ring-white/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                } ${selectedShotId && selectedShotId !== data.id ? 'opacity-40' : 'opacity-100'}`}
              onClick={() => {
                setSelectedShotId(prev => prev === data.id ? null : data.id);
                setTableShotId(data.id);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white" style={{ color: data.color }}>{data.name}</h3>
                {selectedShotId === data.id && <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white">{t('charts.selected')}</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-white/50">{t('charts.flightTime')}</p>
                  <p className="text-lg font-mono text-white">{data.stats.flightTime.toFixed(3)}s</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">{t('charts.maxRange')}</p>
                  <p className="text-lg font-mono text-white">{data.stats.maxRange.toFixed(2)}m</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">{t('charts.maxHeight')}</p>
                  <p className="text-lg font-mono text-white">{data.stats.maxHeight.toFixed(2)}m</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <h3 className="font-bold text-white">{t('charts.dataTable')}</h3>
            <select
              value={tableShotId || ''}
              onChange={(e) => setTableShotId(e.target.value)}
              className="bg-black/50 border border-white/20 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {processedData.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto max-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white/50 uppercase bg-black/20 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-4 py-3">{t('charts.time')} (s)</th>
                  <th className="px-4 py-3">Vx (m/s)</th>
                  <th className="px-4 py-3">Vy (m/s)</th>
                  <th className="px-4 py-3">{t('charts.posX')} (m)</th>
                  <th className="px-4 py-3">{t('charts.posY')} (m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {selectedShotData?.points.map((point, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-2 font-mono text-white/70">{point.time.toFixed(3)}</td>
                    <td className="px-4 py-2 font-mono text-white/70">{point.vx.toFixed(2)}</td>
                    <td className="px-4 py-2 font-mono text-white/70">{point.vy.toFixed(2)}</td>
                    <td className="px-4 py-2 font-mono text-white/70">{point.x.toFixed(2)}</td>
                    <td className="px-4 py-2 font-mono text-white/70">{point.y.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!selectedShotData || selectedShotData.points.length === 0) && (
              <div className="p-8 text-center text-white/30">
                {t('charts.noData')}
              </div>
            )}
          </div>
          <div className="px-4 py-2 bg-black/20 text-xs text-white/40 border-t border-white/10 flex justify-between">
            <span>{t('charts.showing')} {selectedShotData?.points.length || 0} {t('charts.dataPoints')}</span>
            <span>{t('charts.interval')}: Variable</span>
          </div>
        </div>

        {/* Formulas Section */}
        {selectedShotData && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <h3 className="font-bold text-white mb-2">{t('charts.formulas')}</h3>
            <p className="text-xs text-white/50 mb-4">{t('charts.formulasDesc')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/30 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-3">
                  {selectedShotData.windEnabled ? t('charts.windMotion') : t('charts.standardMotion')}
                </h4>
                <div className="space-y-3 font-mono text-xs text-white/80">
                  {selectedShotData.windEnabled ? (
                    <>
                      {/* Linear Drag + Wind Equations */}
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>F_drag = -b * (v - V_wind)</span>
                        <span className="text-white/40">Drag Force (Linear)</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>vx(t) = Vw + (v0x - Vw) * e^(-bt/m)</span>
                        <span className="text-white/40">Velocity X</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>vy(t) = (mg/b + v0y) * e^(-bt/m) - mg/b</span>
                        <span className="text-white/40">Velocity Y</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>x(t) = Vw*t + (m/b)*(v0x - Vw)*(1 - e^(-bt/m))</span>
                        <span className="text-white/40">Position X</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>y(t) = (m/b)*(mg/b + v0y)*(1 - e^(-bt/m)) - (mg/b)*t</span>
                        <span className="text-white/40">Position Y</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Linear Drag (No Wind) Equations */}
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>F_drag = -b * v</span>
                        <span className="text-white/40">Drag Force (Linear)</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>vx(t) = v0x * e^(-bt/m)</span>
                        <span className="text-white/40">Velocity X</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>vy(t) = (mg/b + v0y) * e^(-bt/m) - mg/b</span>
                        <span className="text-white/40">Velocity Y</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>x(t) = (m*v0x/b) * (1 - e^(-bt/m))</span>
                        <span className="text-white/40">Position X</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-1">
                        <span>y(t) = (m/b)*(mg/b + v0y)*(1 - e^(-bt/m)) - (mg/b)*t</span>
                        <span className="text-white/40">Position Y</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-400 mb-3">Variables</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/70 font-mono">
                  <div>v0: Initial Velocity</div>
                  <div>θ: Launch Angle</div>
                  <div>g: Gravity (Variable)</div>
                  <div>t: Time</div>
                  <div>m: Mass</div>
                  <div>b: Damping Coeff (0.5)</div>
                  {selectedShotData.windEnabled && (
                    <>
                      <div>Vw: Wind Velocity</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
