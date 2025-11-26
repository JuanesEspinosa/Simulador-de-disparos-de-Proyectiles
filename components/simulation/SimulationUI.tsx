import { useSimulationStore } from '@/store/simulationStore';

interface SimulationUIProps {
    showCharts: boolean;
    setShowCharts: (show: boolean) => void;
    onGoToFlag: () => void;
    onClearAll: () => void;
    impactCount: number;
    currentImpactIndex: number;
    onNextImpact: () => void;
    onPrevImpact: () => void;
}

export default function SimulationUI({
    showCharts,
    setShowCharts,
    onGoToFlag,
    onClearAll,
    impactCount,
    currentImpactIndex,
    onNextImpact,
    onPrevImpact,
}: SimulationUIProps) {
    const {
        showProjectiles,
        showImpacts,
        showTrajectories,
        toggleShowProjectiles,
        toggleShowImpacts,
        toggleShowTrajectories
    } = useSimulationStore();

    const ToggleButton = ({
        active,
        onClick,
        icon,
        label
    }: {
        active: boolean;
        onClick: () => void;
        icon: string;
        label: string
    }) => (
        <button
            onClick={onClick}
            className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${active
                    ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                }`}
            title={label}
            aria-label={label}
        >
            <span className="text-xl">{icon}</span>
        </button>
    );

    return (
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-4 items-end">
            {/* View Toggles */}
            <div className="flex gap-2 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl">
                <ToggleButton
                    active={showProjectiles}
                    onClick={toggleShowProjectiles}
                    icon="🚀"
                    label="Toggle Projectiles"
                />
                <ToggleButton
                    active={showTrajectories}
                    onClick={toggleShowTrajectories}
                    icon="📈"
                    label="Toggle Trajectories"
                />
                <ToggleButton
                    active={showImpacts}
                    onClick={toggleShowImpacts}
                    icon="💥"
                    label="Toggle Impacts"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setShowCharts(!showCharts)}
                    className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 backdrop-blur-md border ${showCharts
                            ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20'
                            : 'bg-black/40 text-white/90 border-white/10 hover:bg-black/50'
                        }`}
                    aria-label={showCharts ? "Hide Charts" : "Show Charts"}
                >
                    <span>📊</span>
                    <span>Analysis</span>
                </button>

                <button
                    onClick={onGoToFlag}
                    className="px-4 py-3 rounded-xl font-medium bg-black/40 text-white/90 border border-white/10 hover:bg-black/50 backdrop-blur-md transition-all flex items-center gap-2"
                    aria-label="Reset Camera to Flag"
                >
                    <span>🚩</span>
                    <span>Camera</span>
                </button>

                <button
                    onClick={onClearAll}
                    className="px-4 py-3 rounded-xl font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 backdrop-blur-md transition-all flex items-center gap-2"
                    aria-label="Clear All Simulations"
                >
                    <span>🗑️</span>
                    <span>Clear</span>
                </button>
            </div>

            {/* Impact Navigation */}
            {impactCount > 0 && (
                <div className="bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl flex items-center gap-3 animate-fadeIn">
                    <button
                        onClick={onPrevImpact}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
                        disabled={currentImpactIndex <= 0}
                        aria-label="Previous Impact"
                    >
                        ⬅️
                    </button>
                    <span className="font-mono text-sm text-white/90">
                        Impact {currentImpactIndex + 1} / {impactCount}
                    </span>
                    <button
                        onClick={onNextImpact}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
                        disabled={currentImpactIndex >= impactCount - 1}
                        aria-label="Next Impact"
                    >
                        ➡️
                    </button>
                </div>
            )}
        </div>
    );
}
