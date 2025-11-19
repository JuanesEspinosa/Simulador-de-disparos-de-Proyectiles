'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useSimulationStore } from '@/store/simulationStore';

export default function ChartsPanel() {
  const { projectiles, trajectories } = useSimulationStore();

  // Datos de trayectoria (x vs y) - agrupados por proyectil
  // Mostrar TODAS las trayectorias guardadas, no solo las activas
  const trajectoryDataByProjectile = useMemo(() => {
    const dataByProj: { [key: string]: Array<{ x: number; y: number; time: number }> } = {};
    
    // Iterar sobre todas las trayectorias guardadas
    Object.entries(trajectories).forEach(([projId, traj]) => {
      if (traj.length > 0) {
        dataByProj[projId] = traj.map((point) => ({
          x: point.x,
          y: point.y,
          time: point.time,
        }));
      }
    });

    return dataByProj;
  }, [trajectories]);

  // Datos de alcance máximo vs ángulo
  // Necesitamos guardar también la información de velocidad inicial para calcular el ángulo
  const rangeData = useMemo(() => {
    const rangeByAngle: { [key: number]: number } = {};

    // Calcular alcances de todas las trayectorias históricas
    Object.entries(trajectories).forEach(([projId, traj]) => {
      if (traj.length > 0) {
        // Encontrar el punto más lejano en x (alcance máximo)
        const maxRange = Math.max(...traj.map((p) => Math.abs(p.x)));
        
        // Calcular el ángulo desde los primeros puntos de la trayectoria
        if (traj.length >= 2) {
          const dx = traj[1].x - traj[0].x;
          const dy = traj[1].y - traj[0].y;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const roundedAngle = Math.round(angle);
          
          // Guardar el máximo alcance para cada ángulo
          if (!rangeByAngle[roundedAngle] || maxRange > rangeByAngle[roundedAngle]) {
            rangeByAngle[roundedAngle] = maxRange;
          }
        }
      }
    });

    return Object.entries(rangeByAngle)
      .map(([angle, range]) => ({
        angle: parseFloat(angle),
        alcance: range,
      }))
      .sort((a, b) => a.angle - b.angle);
  }, [trajectories]);

  // Encontrar ángulo óptimo
  const optimalAngle = useMemo(() => {
    if (rangeData.length === 0) return null;
    const maxRange = Math.max(...rangeData.map((d) => d.alcance));
    const optimal = rangeData.find((d) => d.alcance === maxRange);
    return optimal?.angle || null;
  }, [rangeData]);

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 bg-gray-900/95 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-gray-700 max-h-[50vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-white">Gráficas de Análisis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Trayectoria (X vs Y) */}
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-white">
            Trayectoria: Posición X vs Y
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                type="number"
                dataKey="x"
                name="X"
                unit="m"
                label={{ value: 'Posición X (m)', position: 'insideBottom', offset: -5, fill: '#fff' }}
                stroke="#888"
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Y"
                unit="m"
                label={{ value: 'Posición Y (m)', angle: -90, position: 'insideLeft', fill: '#fff' }}
                stroke="#888"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #444', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              {Object.entries(trajectoryDataByProjectile).map(([projId, data], index) => {
                const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94'];
                const color = colors[index % colors.length];
                return (
                  <Scatter
                    key={projId}
                    name={`Proyectil ${projId.slice(0, 8)}`}
                    data={data}
                    fill={color}
                    stroke={color}
                    strokeWidth={1}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de Alcance Máximo vs Ángulo */}
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-white">
            Alcance Máximo vs Ángulo
            {optimalAngle !== null && (
              <span className="ml-2 text-sm text-green-400">
                (Óptimo: {optimalAngle.toFixed(1)}°)
              </span>
            )}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={rangeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                type="number"
                dataKey="angle"
                name="Ángulo"
                unit="°"
                label={{ value: 'Ángulo (grados)', position: 'insideBottom', offset: -5, fill: '#fff' }}
                stroke="#888"
              />
              <YAxis
                type="number"
                dataKey="alcance"
                name="Alcance"
                unit="m"
                label={{ value: 'Alcance (m)', angle: -90, position: 'insideLeft', fill: '#fff' }}
                stroke="#888"
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #444', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Scatter
                dataKey="alcance"
                fill="#4ecdc4"
                stroke="#4ecdc4"
                strokeWidth={2}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {Object.keys(trajectoryDataByProjectile).length === 0 && rangeData.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          Dispara algunos proyectiles para ver las gráficas
        </div>
      )}
    </div>
  );
}

