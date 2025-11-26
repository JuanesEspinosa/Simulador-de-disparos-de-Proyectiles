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
  ReferenceLine,
} from 'recharts';
import { useState } from 'react';

interface ChartsPanelProps {
  onClose: () => void;
}

export default function ChartsPanel({ onClose }: ChartsPanelProps) {
  const { trajectories, projectiles } = useSimulationStore();
  const [activeTab, setActiveTab] = useState<'trajectory' | 'height' | 'velocity'>('trajectory');

  // Preparar datos para las gráficas
  const data = Object.entries(trajectories).map(([id, points]) => {
    const projectile = projectiles.find((p) => p.id === id);
    const color = projectile ? `#${Math.floor(Math.random() * 16777215).toString(16)}` : '#ff0000'; // Color aleatorio si no se encuentra
    return {
      id,
      points,
      color,
      name: `Projectile ${id.substr(-4)}`,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-white/60 mb-1">{`Time: ${label}`}</p>
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

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[350px] bg-black/60 backdrop-blur-xl border-t border-white/10 shadow-2xl transition-all animate-slideUp z-20 flex flex-col">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/20">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('trajectory')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'trajectory' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Trajectory (X vs Y)
          </button>
          <button
            onClick={() => setActiveTab('height')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'height' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Height vs Time
          </button>
          <button
            onClick={() => setActiveTab('velocity')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'velocity' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Velocity vs Time
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Chart Content */}
      <div className="flex-1 p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'trajectory' ? (
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" dataKey="x" name="Distance" unit="m" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} />
              <YAxis type="number" dataKey="y" name="Height" unit="m" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {data.map((series) => (
                <Line
                  key={series.id}
                  data={series.points}
                  type="monotone"
                  dataKey="y"
                  name={series.name}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          ) : activeTab === 'height' ? (
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" dataKey="time" name="Time" unit="s" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} allowDuplicatedCategory={false} />
              <YAxis type="number" dataKey="y" name="Height" unit="m" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {data.map((series) => (
                <Line
                  key={series.id}
                  data={series.points}
                  type="monotone"
                  dataKey="y"
                  name={series.name}
                  stroke={series.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          ) : (
            <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" dataKey="time" name="Time" unit="s" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} allowDuplicatedCategory={false} />
              <YAxis type="number" name="Velocity" unit="m/s" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {data.map((series) => {
                // Calculate velocity for each point (approximation)
                const velocityData = series.points.map((p, i, arr) => {
                  if (i === 0) return { ...p, velocity: 0 };
                  const prev = arr[i - 1];
                  const dist = Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2 + (p.z - prev.z) ** 2);
                  const dt = p.time - prev.time;
                  return { ...p, velocity: dt > 0 ? dist / dt : 0 };
                });

                return (
                  <Line
                    key={series.id}
                    data={velocityData}
                    type="monotone"
                    dataKey="velocity"
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
