'use client';

import { useSimulationStore } from '@/store/simulationStore';
import { useLanguage } from './LanguageProvider';

const INITIAL_VALUES = {
  velocity: 20,
  angle: 45,
  mass: 1,
  gravity: 9.81,
  windForce: 0.5,
  windDirection: 180,
};

export default function ControlsPanel() {
  const {
    velocity,
    angle,
    mass,
    gravity,
    airResistanceEnabled,
    windEnabled,
    windForce,
    windDirection,
    projectiles,
    setVelocity,
    setAngle,
    setMass,
    setGravity,
    setAirResistanceEnabled,
    setWindEnabled,
    setWindForce,
    setWindDirection,
    fireProjectile,
  } = useSimulationStore();

  const { t, locale, setLocale } = useLanguage();

  const hasActiveProjectile = projectiles.some(p => p.status === 'flying');

  const handleFire = () => {
    const angleRad = (angle * Math.PI) / 180;
    const vx = velocity * Math.cos(angleRad);
    const vy = velocity * Math.sin(angleRad);
    const vz = 0;

    fireProjectile({
      initialPosition: [0, 0.02, 0],
      initialVelocity: [vx, vy, vz],
      mass,
      gravity,
      damping: airResistanceEnabled ? 0.5 : 0,
      windEnabled,
      windForce,
      windDirection: 180, // Force headwind
    });
  };

  const handleReset = () => {
    setVelocity(INITIAL_VALUES.velocity);
    setAngle(INITIAL_VALUES.angle);
    setMass(INITIAL_VALUES.mass);
    setGravity(INITIAL_VALUES.gravity);
    setWindForce(INITIAL_VALUES.windForce);
    setWindDirection(INITIAL_VALUES.windDirection);
  };

  return (
    <div className="absolute left-4 top-4 z-10 bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl w-[340px] max-h-[calc(100vh-2rem)] flex flex-col transition-all hover:bg-black/50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-2 shrink-0">
        <h2 className="text-xl font-light text-white/90 tracking-wide">
          {t('controls.title')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setLocale('es')}
            className={`text-xs px-2 py-1 rounded transition-colors ${locale === 'es' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
          >
            ES
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`text-xs px-2 py-1 rounded transition-colors ${locale === 'en' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="space-y-6 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-white/5 hover:scrollbar-thumb-white/30">
        {/* Velocidad Inicial */}
        <div className="group">
          <div className="flex justify-between items-center text-xs text-white/60 mb-2 uppercase tracking-wider">
            <span>{t('controls.velocity')} (m/s)</span>
            <input
              type="number"
              value={velocity}
              onChange={(e) => setVelocity(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 bg-black/50 border border-white/20 rounded text-blue-400 font-mono focus:outline-none focus:border-blue-500"
              step="0.5"
              min="5"
              max="50"
            />
          </div>
          <input
            type="range"
            min="5"
            max="50"
            step="0.5"
            value={velocity}
            onChange={(e) => setVelocity(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
            aria-label={t('controls.velocity')}
          />
        </div>

        {/* Ángulo */}
        <div className="group">
          <div className="flex justify-between items-center text-xs text-white/60 mb-2 uppercase tracking-wider">
            <span>{t('controls.angle') + ' (°)'}</span>
            <input
              type="number"
              value={angle}
              onChange={(e) => setAngle(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 bg-black/50 border border-white/20 rounded text-green-400 font-mono focus:outline-none focus:border-green-500"
              step="1"
              min="0"
              max="90"
            />
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={angle}
            onChange={(e) => setAngle(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
            aria-label={t('controls.angle')}
          />
        </div>

        {/* Masa */}
        <div className="group">
          <div className="flex justify-between items-center text-xs text-white/60 mb-2 uppercase tracking-wider">
            <span>{t('controls.mass') + ' (kg)'}</span>
            <input
              type="number"
              value={mass}
              onChange={(e) => setMass(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 bg-black/50 border border-white/20 rounded text-purple-400 font-mono focus:outline-none focus:border-purple-500"
              step="0.1"
              min="0.1"
              max="10"
            />
          </div>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={mass}
            onChange={(e) => setMass(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
            aria-label={t('controls.mass')}
          />
        </div>

        {/* Gravedad */}
        <div className="group">
          <div className="flex justify-between items-center text-xs text-white/60 mb-2 uppercase tracking-wider">
            <span>{t('controls.gravity') + ' (m/s²)'}</span>
            <input
              type="number"
              value={gravity}
              onChange={(e) => setGravity(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 bg-black/50 border border-white/20 rounded text-red-400 font-mono focus:outline-none focus:border-red-500"
              step="0.01"
              min="1.62"
              max="24.79"
            />
          </div>
          <input
            type="range"
            min="1.62"
            max="24.79"
            step="0.01"
            value={gravity}
            onChange={(e) => setGravity(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all"
            aria-label={t('controls.gravity')}
          />
        </div>

        {/* Air Resistance */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/60 uppercase tracking-wider">{t('controls.airResistance')}</span>
            <button
              onClick={() => setAirResistanceEnabled(!airResistanceEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative ${airResistanceEnabled ? 'bg-orange-600' : 'bg-white/10'
                }`}
              aria-label="Toggle Air Resistance"
            >
              <div
                className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${airResistanceEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
          <p className="text-xs text-white/40 mb-2">
            {airResistanceEnabled ? t('controls.withFriction') : t('controls.noFriction')}
          </p>
        </div>

        {/* Viento */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-white/60 uppercase tracking-wider">{t('controls.wind')}</span>
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
                <div className="flex justify-between items-center text-xs text-white/60 mb-3">
                  <span>{t('controls.windForce') + ' (m/s)'}</span>
                  <input
                    type="number"
                    value={windForce}
                    onChange={(e) => setWindForce(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 bg-black/50 border border-white/20 rounded text-yellow-400 font-mono text-right focus:outline-none focus:border-yellow-500"
                    step="0.5"
                    min="0"
                    max="20"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={windForce}
                  onChange={(e) => setWindForce(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
                  aria-label={t('controls.windForce')}
                />
              </div>

              {/* Dirección del Viento */}
              {/* Dirección del Viento (Fixed) */}
              <div>
                <div className="flex justify-between items-center text-xs text-white/60 mb-2">
                  <span>{t('controls.windDirection')}</span>
                  <span className="text-yellow-400 font-mono">180° (En contra)</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <span className="text-yellow-500 text-lg" style={{ transform: 'rotate(180deg)' }}>➜</span>
                  </div>
                  <div className="text-xs text-white/70">
                    <p>{t('controls.headwind')}</p>
                    <p className="opacity-50">{t('controls.headwindDesc')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-4 shrink-0">
        {/* Reset Button */}
        <button
          onClick={handleReset}
          className="w-full py-2 rounded-xl font-medium tracking-wide transition-all duration-300 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/10 hover:border-white/20"
        >
          {t('controls.reset').toUpperCase()}
        </button>

        {/* Fire Button */}
        <button
          onClick={handleFire}
          disabled={hasActiveProjectile}
          className={`w-full py-3 rounded-xl font-medium tracking-wide transition-all duration-300 ${hasActiveProjectile
            ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5'
            : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/10'
            }`}
          aria-label={hasActiveProjectile ? t('controls.firing') : t('controls.fire')}
        >
          {hasActiveProjectile ? t('controls.firing').toUpperCase() : t('controls.fire').toUpperCase()}
        </button>
      </div>
    </div>
  );
}
