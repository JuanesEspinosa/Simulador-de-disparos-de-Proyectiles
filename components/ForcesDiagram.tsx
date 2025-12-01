import React, { useMemo, useState } from 'react';
import { useLanguage } from './LanguageProvider';

interface Point {
    x: number;
    y: number;
    vx: number;
    vy: number;
    time: number;
}

interface ProjectileConfig {
    mass: number;
    damping: number;
    gravity: number;
    windEnabled: boolean;
    windForce: number;
    windDirection: number;
}

interface ForcesDiagramProps {
    points: Point[];
    projectile: ProjectileConfig;
    color: string;
    shots?: { id: string; name: string }[];
    currentShotId?: string;
    onShotSelect?: (id: string) => void;
}

export default function ForcesDiagram({ points, projectile, color, shots, currentShotId, onShotSelect }: ForcesDiagramProps) {
    const { t } = useLanguage();
    const [timeIndex, setTimeIndex] = useState(0);

    // Ensure we have data
    if (!points || points.length === 0) return null;

    // Clamp index
    const safeIndex = Math.min(Math.max(0, timeIndex), points.length - 1);
    const currentPoint = points[safeIndex];

    // Physics Calculations
    const { mass, damping, gravity, windEnabled, windForce, windDirection } = projectile;

    // 1. Gravity Force (Weight)
    // P = m * g (Magnitude). Direction is always down (-Y in physics, +Y in SVG).
    // Vector: (0, -m*g)
    const weightVector = { x: 0, y: -mass * gravity };

    // 2. Drag Force
    // F_d = -b * v_rel
    // Wind velocity vector (Projected onto 2D X-Y plane)
    // The simulation uses a 3D wind (N/S/E/W). In the 2D Side View (X-Y),
    // we only see the X-component of the wind. Vertical wind (Y) is assumed 0.
    let windVx = 0;
    let windVy = 0;
    if (windEnabled) {
        const windRad = (windDirection * Math.PI) / 180;
        windVx = Math.cos(windRad) * windForce;
        // windVy = 0; // No vertical wind component in this simulation model
    }

    // Relative velocity
    const relVx = currentPoint.vx - windVx;
    const relVy = currentPoint.vy - windVy;

    // Drag vector
    // Note: If damping is 0, drag is 0.
    const dragVector = {
        x: -damping * relVx,
        y: -damping * relVy
    };

    // Visualization Parameters
    const width = 300; // Reduced size further (was 360)
    const height = 300; // Reduced size further (was 360)
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 8; // Scale factor for vectors (pixels per Newton) - Adjustable

    // Helper to draw arrow
    const drawArrow = (fx: number, fy: number, color: string, label: string, labelValue: string) => {
        // SVG Coordinate system: Y is down.
        // Physics: Y is up.
        // So a positive force Y (up) means negative SVG Y.
        // A negative force Y (down) means positive SVG Y.

        const endX = centerX + fx * scale;
        const endY = centerY - fy * scale; // Flip Y for SVG

        // Arrow head math
        const angle = Math.atan2(-fy, fx); // Angle in screen coords (Y flipped)
        const headLen = 10;

        // Calculate arrow head points
        // We need the angle of the line in SVG coords.
        // Line goes from (centerX, centerY) to (endX, endY).
        // dx = fx * scale
        // dy = -fy * scale
        const svgAngle = Math.atan2(-fy * scale, fx * scale);

        const arrowP1X = endX - headLen * Math.cos(svgAngle - Math.PI / 6);
        const arrowP1Y = endY - headLen * Math.sin(svgAngle - Math.PI / 6);
        const arrowP2X = endX - headLen * Math.cos(svgAngle + Math.PI / 6);
        const arrowP2Y = endY - headLen * Math.sin(svgAngle + Math.PI / 6);

        // Label position (slightly offset from tip)
        const labelX = endX + (fx > 0 ? 10 : -10);
        const labelY = endY + (fy > 0 ? -10 : 10);

        return (
            <g>
                {/* Main Line */}
                <line
                    x1={centerX}
                    y1={centerY}
                    x2={endX}
                    y2={endY}
                    stroke={color}
                    strokeWidth="3"
                />
                {/* Arrow Head */}
                <path
                    d={`M${endX},${endY} L${arrowP1X},${arrowP1Y} L${arrowP2X},${arrowP2Y} Z`}
                    fill={color}
                />
                {/* Label */}
                <text
                    x={labelX}
                    y={labelY}
                    fill={color}
                    fontSize="14"
                    fontWeight="bold"
                    textAnchor={fx > 0 ? "start" : "end"}
                    dominantBaseline={fy > 0 ? "auto" : "hanging"}
                >
                    {label}
                </text>
                <text
                    x={labelX}
                    y={labelY + 15}
                    fill={color}
                    fontSize="12"
                    fontFamily="monospace"
                    textAnchor={fx > 0 ? "start" : "end"}
                    dominantBaseline={fy > 0 ? "auto" : "hanging"}
                    opacity="0.8"
                >
                    {labelValue}
                </text>
            </g>
        );
    };

    // Calculate magnitudes for display
    const weightMag = Math.abs(weightVector.y).toFixed(2);
    const dragMag = Math.sqrt(dragVector.x ** 2 + dragVector.y ** 2).toFixed(2);
    const velocityMag = Math.sqrt(currentPoint.vx ** 2 + currentPoint.vy ** 2).toFixed(2);
    const velocityAngle = (Math.atan2(currentPoint.vy, currentPoint.vx) * 180 / Math.PI).toFixed(1);

    return (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6 mt-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                {t('charts.forcesDiagram')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visualization */}
                <div className="relative bg-black/30 rounded-lg border border-white/5 aspect-square flex items-center justify-center overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'linear-gradient(#ffffff05 1px, transparent 1px), linear-gradient(90deg, #ffffff05 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}></div>

                    {/* Axes */}
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="z-10">
                        {/* X Axis */}
                        <line x1="0" y1={centerY} x2={width} y2={centerY} stroke="#ffffff20" strokeWidth="1" />
                        <text x={width - 20} y={centerY + 20} fill="#ffffff50" fontSize="12">x</text>

                        {/* Y Axis */}
                        <line x1={centerX} y1="0" x2={centerX} y2={height} stroke="#ffffff20" strokeWidth="1" />
                        <text x={centerX + 10} y={20} fill="#ffffff50" fontSize="12">y</text>

                        {/* Velocity Vector (Blue) - Scaled down differently as it's velocity, not force */}
                        {/* We visualize velocity direction mainly. Let's scale it to be visible but not huge. */}
                        {drawArrow(currentPoint.vx * 0.5, currentPoint.vy * 0.5, '#3b82f6', 'v', `${velocityMag} m/s`)}

                        {/* Weight Vector (Red) */}
                        {drawArrow(weightVector.x, weightVector.y, '#ef4444', 'P', `${weightMag} N`)}

                        {/* Drag Vector (Orange) - Only if damping > 0 */}
                        {damping > 0 && (Math.abs(dragVector.x) > 0.01 || Math.abs(dragVector.y) > 0.01) &&
                            drawArrow(dragVector.x, dragVector.y, '#f97316', 'Fr', `${dragMag} N`)
                        }

                        {/* Wind Vector (Cyan) - Only if windEnabled */}
                        {windEnabled &&
                            drawArrow(windVx * 0.5, windVy * 0.5, '#06b6d4', 'Vw', `${windForce} m/s`)
                        }

                        {/* Mass Point */}
                        <circle cx={centerX} cy={centerY} r="6" fill={color} stroke="white" strokeWidth="2" />
                        <text x={centerX - 15} y={centerY - 15} fill="white" fontSize="14" fontStyle="italic">m</text>

                        {/* Angle Arc (if velocity is significant) */}
                        {velocityMag !== "0.00" && (
                            <path
                                d={`M ${centerX + 30} ${centerY} A 30 30 0 0 0 ${centerX + 30 * Math.cos(Math.atan2(-currentPoint.vy, currentPoint.vx))} ${centerY + 30 * Math.sin(Math.atan2(-currentPoint.vy, currentPoint.vx))}`}
                                fill="none"
                                stroke="#ffffff40"
                                strokeDasharray="4 4"
                            />
                        )}
                    </svg>
                </div>

                {/* Controls & Info */}
                <div className="space-y-6">
                    {/* Shot Selector */}
                    {shots && onShotSelect && (
                        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                            <label className="text-xs text-white/50 block mb-2">{t('charts.selectShot')}</label>
                            <select
                                value={currentShotId || ''}
                                onChange={(e) => onShotSelect(e.target.value)}
                                className="w-full bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                {shots.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Slider */}
                    <div>
                        <div className="flex justify-between text-sm text-white/70 mb-2">
                            <span>{t('charts.time')}: {currentPoint.time.toFixed(3)}s</span>
                            <span>{Math.round((safeIndex / (points.length - 1)) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={points.length - 1}
                            value={safeIndex}
                            onChange={(e) => setTimeIndex(parseInt(e.target.value))}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Data Display */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 p-3 rounded border border-white/5">
                            <div className="text-xs text-white/40 mb-1">{t('charts.position')}</div>
                            <div className="font-mono text-white">
                                X: {currentPoint.x.toFixed(2)}m<br />
                                Y: {currentPoint.y.toFixed(2)}m
                            </div>
                        </div>
                        <div className="bg-black/20 p-3 rounded border border-white/5">
                            <div className="text-xs text-white/40 mb-1">{t('charts.velocity')}</div>
                            <div className="font-mono text-white">
                                Vx: {currentPoint.vx.toFixed(2)}m/s<br />
                                Vy: {currentPoint.vy.toFixed(2)}m/s
                            </div>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded border border-red-500/20">
                            <div className="text-xs text-red-400 mb-1">{t('charts.weight')}</div>
                            <div className="font-mono text-white">
                                {weightMag} N
                                <div className="text-xs opacity-50 mt-1">↓ {t('charts.constant')}</div>
                            </div>
                        </div>
                        {damping > 0 ? (
                            <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20">
                                <div className="text-xs text-orange-400 mb-1">{t('charts.friction')}</div>
                                <div className="font-mono text-white">
                                    {dragMag} N
                                    <div className="text-xs opacity-50 mt-1">{t('charts.opposingV')}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/5 p-3 rounded border border-white/5 opacity-50">
                                <div className="text-xs text-white/40 mb-1">{t('charts.friction')}</div>
                                <div className="text-xs text-white/20">{t('charts.disabled')}</div>
                            </div>
                        )}
                        {windEnabled && (
                            <div className="bg-cyan-500/10 p-3 rounded border border-cyan-500/20 col-span-2 md:col-span-1">
                                <div className="text-xs text-cyan-400 mb-1">{t('charts.wind')}</div>
                                <div className="font-mono text-white">
                                    {windForce} m/s
                                    <div className="text-xs opacity-50 mt-1">{t('charts.direction')}: {windDirection}°</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-white/30 italic">
                        {t('charts.diagramDisclaimer')}
                    </div>
                </div>
            </div>
        </div>
    );
}
