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
import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from './LanguageProvider';
import ForcesDiagram from './ForcesDiagram';

import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

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

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prepare data for charts and analytics
  const processedData = useMemo(() => {
    return Object.entries(trajectories).map(([id, points]) => {
      const projectile = projectiles.find((p) => p.id === id);
      // Use vivid colors (high saturation, medium-high lightness)
      const hue = Math.floor(Math.random() * 360);
      const color = projectile ? `hsl(${hue}, 100%, 60%)` : '#ff0000';

      // Calculate analytics
      let maxHeight = 0;
      let maxRange = 0;
      let flightTime = 0;

      if (points.length > 0) {
        maxHeight = Math.max(...points.map(p => p.y));
        maxRange = Math.max(...points.map(p => p.x));
        flightTime = points[points.length - 1].time;
      }

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

      // Calculate initial velocity and angle from initialVelocity
      let initialSpeed = 0;
      let launchAngle = 0;
      if (projectile?.initialVelocity) {
        const [vx, vy] = projectile.initialVelocity;
        initialSpeed = Math.sqrt(vx * vx + vy * vy);
        launchAngle = Math.atan2(vy, vx) * (180 / Math.PI);
      }

      return {
        id,
        points: pointsWithVelocity,
        color,
        name: `${t('charts.shot')} ${id.substr(-4)}`,
        windEnabled: projectile?.windEnabled,
        config: projectile,
        velocity: initialSpeed,
        angle: launchAngle,
        stats: {
          maxHeight: isFinite(maxHeight) ? maxHeight : 0,
          maxRange: isFinite(maxRange) ? maxRange : 0,
          flightTime: isFinite(flightTime) ? flightTime : 0
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
      const data = payload[0].payload;
      return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl text-xs z-50">
          <p className="text-white/60 mb-1">{`${t('charts.horizontalPosition')}: ${data.x.toFixed(2)}m`}</p>
          <p className="text-white/60 mb-1">{`${t('charts.verticalPosition')}: ${data.y.toFixed(2)}m`}</p>
          <p className="text-white/40 mb-1">{`${t('charts.time')}: ${data.time.toFixed(3)}s`}</p>
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
            aria-label={isExpanded ? t('charts.collapse') : t('charts.expand')}
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
            aria-label={t('charts.close')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Charts Section */}
        <div className="h-[300px] w-full shrink-0">
          {isMounted ? (
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
                      dot={selectedShotId === series.id ? { r: 3, fill: series.color, strokeWidth: 0 } : false}
                      activeDot={selectedShotId === series.id ? { r: 6, fill: series.color, stroke: '#fff', strokeWidth: 2 } : false}
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
                      dot={selectedShotId === series.id ? { r: 3, fill: series.color, strokeWidth: 0 } : false}
                      activeDot={selectedShotId === series.id ? { r: 6, fill: series.color, stroke: '#fff', strokeWidth: 2 } : false}
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
                      dot={selectedShotId === series.id ? { r: 3, fill: series.color, strokeWidth: 0 } : false}
                      activeDot={selectedShotId === series.id ? { r: 6, fill: series.color, stroke: '#fff', strokeWidth: 2 } : false}
                      cursor="pointer"
                      onClick={() => handleLineClick(series)}
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-white/30">
              {t('app.loading')}
            </div>
          )}
        </div>

        {/* Analytics Cards */}
        {processedData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
            {processedData.map((data) => (
              <div
                key={data.id}
                onClick={() => handleLineClick(data)}
                className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${selectedShotId === data.id
                  ? 'bg-white/10 border-white/30 shadow-lg shadow-white/5'
                  : 'bg-black/40 border-white/5 hover:bg-white/5 hover:border-white/10'
                  }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                      {data.name}
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">
                      {data.config?.mass}kg • {data.velocity.toFixed(1)}m/s • {data.angle.toFixed(1)}°
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      useSimulationStore.getState().removeProjectile(data.id);
                    }}
                    className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title={t('charts.delete')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/30 p-2 rounded-lg">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">{t('charts.flightTime')}</p>
                    <p className="text-sm font-mono text-white/90">{data.stats.flightTime.toFixed(3)}s</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">{t('charts.maxRange')}</p>
                    <p className="text-sm font-mono text-white/90">{data.stats.maxRange.toFixed(2)}m</p>
                  </div>
                  <div className="bg-black/30 p-2 rounded-lg">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">{t('charts.maxHeight')}</p>
                    <p className="text-sm font-mono text-white/90">{data.stats.maxHeight.toFixed(2)}m</p>
                  </div>
                </div>

                {/* Variables Grid (Only if selected) */}
                {selectedShotId === data.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{t('charts.variables')}</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono text-white/70">
                      <div>v0: <span className="text-white">{data.velocity.toFixed(2)} m/s</span></div>
                      <div>θ: <span className="text-white">{data.angle.toFixed(1)}°</span></div>
                      <div>g: <span className="text-white">{data.config?.gravity} m/s²</span></div>
                      <div>m: <span className="text-white">{data.config?.mass} kg</span></div>
                      <div>b: <span className="text-white">{data.config?.damping}</span></div>
                      {data.windEnabled && (
                        <div>Vw: <span className="text-white">{data.config?.windForce} m/s</span></div>
                      )}
                    </div>

                    {/* Formulas Grid */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{t('charts.formulas')}</p>
                      <div className="space-y-1 overflow-x-auto">

                        <>
                          <div className="text-lg text-white/80"><BlockMath math="F_{drag} = -b \cdot v" /></div>
                          <div className="text-lg text-white/80"><BlockMath math="v_x(t) = v_{0x} \cdot e^{-\frac{b}{m}t}" /></div>
                          <div className="text-lg text-white/80"><BlockMath math="x(t) = \frac{m \cdot v_{0x}}{b} \cdot (1 - e^{-\frac{b}{m}t})" /></div>
                          <div className="text-lg text-white/80"><BlockMath math="v_y(t) = (v_{0y} + \frac{mg}{b}) \cdot e^{-\frac{b}{m}t} - \frac{mg}{b}" /></div>
                          <div className="text-lg text-white/80"><BlockMath math="y(t) = \frac{m}{b}(v_{0y} + \frac{mg}{b})(1 - e^{-\frac{b}{m}t}) - \frac{mg}{b}t" /></div>
                        </>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Forces Diagram */}
        {selectedShotData && selectedShotData.config && (
          <ForcesDiagram
            points={selectedShotData.points}
            projectile={selectedShotData.config}
            color={selectedShotData.color}
            shots={processedData.map(d => ({ id: d.id, name: d.name }))}
            currentShotId={tableShotId || undefined}
            onShotSelect={setTableShotId}
          />
        )}

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
                <div className="space-y-6 font-mono text-white/90">
                  {selectedShotData.windEnabled ? (
                    <>
                      {/* Linear Drag + Wind Equations */}
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.dragForce')}</p>
                        <div className="text-base"><BlockMath math="F_{drag} = -b \cdot (v - W)" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.horizontalVelocity')}</p>
                        <div className="text-base"><BlockMath math="v_x(t) = W_x + (v_{0x} - W_x) \cdot e^{-\frac{b}{m}t}" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.horizontalPosition')}</p>
                        <div className="text-base"><BlockMath math="x(t) = W_x \cdot t + \frac{m}{b}(v_{0x} - W_x)(1 - e^{-\frac{b}{m}t})" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.verticalVelocity')}</p>
                        <div className="text-base"><BlockMath math="v_y(t) = (v_{0y} + \frac{mg}{b}) \cdot e^{-\frac{b}{m}t} - \frac{mg}{b}" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.verticalPosition')}</p>
                        <div className="text-base"><BlockMath math="y(t) = \frac{m}{b}(v_{0y} + \frac{mg}{b})(1 - e^{-\frac{b}{m}t}) - \frac{mg}{b}t" /></div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Linear Drag (No Wind) Equations */}
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.dragForce')}</p>
                        <div className="text-base"><BlockMath math="F_{drag} = -b \cdot v" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.weight')}</p>
                        <div className="text-base"><BlockMath math="P = m \cdot g" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.horizontalVelocity')}</p>
                        <div className="text-base"><BlockMath math="v_x(t) = v_{0x} \cdot e^{-\frac{b}{m}t}" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.horizontalPosition')}</p>
                        <div className="text-base"><BlockMath math="x(t) = \frac{m \cdot v_{0x}}{b} \cdot (1 - e^{-\frac{b}{m}t})" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.verticalVelocity')}</p>
                        <div className="text-base"><BlockMath math="v_y(t) = (v_{0y} + \frac{mg}{b}) \cdot e^{-\frac{b}{m}t} - \frac{mg}{b}" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.verticalPosition')}</p>
                        <div className="text-base"><BlockMath math="y(t) = \frac{m}{b}(v_{0y} + \frac{mg}{b})(1 - e^{-\frac{b}{m}t}) - \frac{mg}{b}t" /></div>
                      </div>
                      <div className="border-b border-white/5 pb-2">
                        <p className="text-xs text-blue-400 mb-1">{t('charts.terminalVelocity')}</p>
                        <div className="text-base"><BlockMath math="v_T = \frac{mg}{b}" /></div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-400 mb-3">{t('charts.variablesTitle')}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-white/70 font-mono">
                  <div><InlineMath math="v_0" />: {t('charts.initialVelocity')}</div>
                  <div><InlineMath math="\theta" />: {t('charts.launchAngle')}</div>
                  <div><InlineMath math="g" />: {t('charts.gravity')}</div>
                  <div><InlineMath math="t" />: {t('charts.time')}</div>
                  <div><InlineMath math="m" />: {t('charts.mass')}</div>
                  <div><InlineMath math="b" />: {t('charts.dampingCoeff')}</div>
                  {selectedShotData.windEnabled && (
                    <>
                      <div><InlineMath math="V_w" />: {t('charts.windVelocity')}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Copyright Footer */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 mt-6">
          <a
            href="https://github.com/JuanesEspinosa"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/50 hover:text-white/80 transition-colors flex items-center justify-center gap-2"
          >
            <span>© 2025 Desarrollado por Juanes Espinosa</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
