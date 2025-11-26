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
    windDirection,
    projectiles,
    setVelocity,
    setAngle,
    setMass,
    setWindEnabled,
    setWindForce,
    setWindDirection,
    fireProjectile,
  } = useSimulationStore();

  const hasActiveProjectile = projectiles.length > 0;

  const handleFire = () => {
    const angleRad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(angleRad);
    const vy = velocity * Math.sin(angleRad);
    const vz = 0;

    fireProjectile({
      initialPosition: [0, 0.02, 0],
      initialVelocity: [vx, vy, vz],
      mass,
      windEnabled,
      windForce,
      windDirection,
    });
  };

  return (
    <div className="absolute left-4 top-4 z-10 bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl w-[340px] transition-all hover:bg-black/50">
      <h2 className="text-xl font-light mb-6 text-white/90 tracking-wide border-b border-white/10 pb-2">
        Control Panel
      </h2>

      <div className="space-y-6">
        {/* Velocidad Inicial */}
        <div className="group">
          <div className="flex justify-between text-xs text-white/60 mb-2 uppercase tracking-wider">
            <span>Initial Velocity</span>
            <span className="text-blue-400 font-mono">{velocity.toFixed(1)} m/s</span>
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="0.5"
            value={velocity}
            onChange={(e) => setVelocity(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
            aria-label="Initial Velocity"
          />
        </div>

        {/* Ángulo */}
        <div className="group">
          <div className="flex justify-between text-xs text-white/60 mb-2 uppercase tracking-wider">
            <span>Launch Angle</span>
            <span className="text-green-400 font-mono">{angle.toFixed(1)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
            aria-label="Launch Angle"
          />
        </div>

        {/* Masa */}
        <div className="group">
          <div className="flex justify-between text-xs text-white/60 mb-2 uppercase tracking-wider">
            <span>Projectile Mass</span>
            <span className="text-purple-400 font-mono">{mass.toFixed(2)} kg</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
            aria-label="Projectile Mass"
          />
        </div>

        {/* Viento */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/60 uppercase tracking-wider">Wind Simulation</span>
            <button
              onClick={() => setWindEnabled(!windEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative ${windEnabled ? 'bg-blue-600' : 'bg-white/10'
                }`}
              aria-label="Toggle Wind Simulation"
            >
              <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${windEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
            </button>
          </div>

          {windEnabled && (
            <div className="space-y-4 animate-fadeIn">
              {/* Fuerza del Viento */}
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-3">
                  <span>Force</span>
                  <span className="text-yellow-400 font-mono">{windForce.toFixed(2)} N</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={windForce}
                  onChange={(e) => setWindForce(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
                  aria-label="Wind Force"
                />
              </div>

              {/* Dirección del Viento */}
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-3">
                  <span>Direction</span>
                  <span className="text-yellow-400 font-mono">{windDirection}°</span>
                </div>
                <div className="relative flex items-center mb-6">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="15"
                    value={windDirection}
                    onChange={(e) => setWindDirection(parseFloat(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
                    aria-label="Wind Direction"
                  />
                  {/* Visual Indicator for Wind Direction */}
                  <div
                    className="absolute right-0 -top-8 w-6 h-6 border border-white/20 rounded-full flex items-center justify-center"
                    style={{ transform: `rotate(${-windDirection}deg)` }}
                  >
                    <span className="text-yellow-500 text-xs">➜</span>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-white/30 mt-1 px-1">
                  <span>E (+X)</span>
                  <span>N (-Z)</span>
                  <span>W (-X)</span>
                  <span>S (+Z)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón de Disparo */}
        <button
          onClick={handleFire}
          disabled={hasActiveProjectile}
          className={`w-full mt-2 py-3 rounded-xl font-medium tracking-wide transition-all duration-300 ${hasActiveProjectile
              ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
              : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10'
            }`}
          aria-label={hasActiveProjectile ? "Simulation in progress" : "Launch Projectile"}
        >
          {hasActiveProjectile ? 'SIMULATION IN PROGRESS' : 'LAUNCH PROJECTILE'}
        </button>
      </div>
    </div>
  );
}
