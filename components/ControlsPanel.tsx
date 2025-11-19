'use client';

import { useState } from 'react';
import { useSimulationStore } from '@/store/simulationStore';

export default function ControlsPanel() {
  const {
    velocity,
    angle,
    mass,
    windEnabled,
    windForce,
    projectiles,
    setVelocity,
    setAngle,
    setMass,
    setWindEnabled,
    setWindForce,
    fireProjectile,
  } = useSimulationStore();

  // Verificar si hay un proyectil activo
  const hasActiveProjectile = projectiles.length > 0;

  const handleFire = () => {
    // Convertir ángulo a radianes
    const angleRad = (angle * Math.PI) / 180;
    
    // Calcular velocidad inicial en componentes x, y, z
    const vx = velocity * Math.cos(angleRad);
    const vy = velocity * Math.sin(angleRad);
    const vz = 0;

    fireProjectile({
      initialPosition: [0, 0.02, 0], // Iniciar desde la base de la bandera (plataforma)
      initialVelocity: [vx, vy, vz],
      mass,
      windEnabled,
      windForce,
    });
  };

  return (
    <div className="absolute left-4 top-4 z-10 bg-gray-900/90 backdrop-blur-sm p-6 rounded-lg shadow-2xl border border-gray-700 min-w-[320px]">
      <h2 className="text-2xl font-bold mb-4 text-white">Controles de Lanzamiento</h2>
      
      <div className="space-y-4">
        {/* Velocidad Inicial */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Velocidad Inicial: {velocity.toFixed(1)} m/s
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="0.5"
            value={velocity}
            onChange={(e) => setVelocity(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Ángulo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ángulo: {angle.toFixed(1)}°
          </label>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
          />
        </div>

        {/* Masa */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Masa: {mass.toFixed(2)} kg
          </label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Viento */}
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">
              Fricción por Viento
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={windEnabled}
                onChange={(e) => setWindEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {windEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fuerza del Viento: {windForce.toFixed(2)} N
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={windForce}
                onChange={(e) => setWindForce(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>
          )}
        </div>

        {/* Botón de Disparo */}
        <button
          onClick={handleFire}
          disabled={hasActiveProjectile}
          className={`w-full mt-6 px-6 py-3 font-bold rounded-lg shadow-lg transition-all transform ${
            hasActiveProjectile
              ? 'bg-gray-500 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 active:scale-95'
          } text-white`}
        >
          {hasActiveProjectile ? '⏳ Esperando...' : '🚀 Disparar Proyectil'}
        </button>
        
        {hasActiveProjectile && (
          <p className="text-sm text-yellow-300 text-center mt-2">
            Espera a que el cohete actual aterrice
          </p>
        )}
      </div>
    </div>
  );
}

