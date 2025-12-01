import { create } from 'zustand';

interface TrajectoryPoint {
  x: number;
  y: number;
  z: number;
  time: number;
}

interface Projectile {
  id: string;
  initialPosition: [number, number, number];
  initialVelocity: [number, number, number];
  mass: number;
  gravity: number;
  damping: number;
  windEnabled: boolean;
  windForce: number;
  windDirection: number;
  status: 'flying' | 'landed';
}

interface SimulationState {
  // Parámetros de control
  velocity: number;
  angle: number;
  mass: number;
  gravity: number;
  damping: number;
  airResistanceEnabled: boolean;
  windEnabled: boolean;
  windForce: number;
  windDirection: number;

  // Visibility flags
  showProjectiles: boolean;
  showImpacts: boolean;
  showTrajectories: boolean;

  // Proyectiles activos
  projectiles: Projectile[];

  // Trayectorias registradas
  trajectories: { [projectileId: string]: TrajectoryPoint[] };

  // Setters
  setVelocity: (velocity: number) => void;
  setAngle: (angle: number) => void;
  setMass: (mass: number) => void;
  setGravity: (gravity: number) => void;
  setDamping: (damping: number) => void;
  setAirResistanceEnabled: (enabled: boolean) => void;
  setWindEnabled: (enabled: boolean) => void;
  setWindForce: (force: number) => void;
  setWindDirection: (direction: number) => void;

  toggleShowProjectiles: () => void;
  toggleShowImpacts: () => void;
  toggleShowTrajectories: () => void;

  // Acciones
  fireProjectile: (projectile: Omit<Projectile, 'id' | 'status'>) => void;
  clearProjectiles: () => void;
  removeProjectile: (projectileId: string) => void;
  updateProjectileStatus: (projectileId: string, status: 'flying' | 'landed') => void;
  addTrajectoryPoint: (projectileId: string, point: TrajectoryPoint) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  // Valores iniciales
  velocity: 20,
  angle: 45,
  mass: 1,
  gravity: 9.81,
  damping: 0.5,
  airResistanceEnabled: true,
  windEnabled: false,
  windForce: 0.5,
  windDirection: 0, // 0 degrees = wind blowing towards +X

  // Visibility flags
  showProjectiles: true,
  showImpacts: true,
  showTrajectories: true,

  projectiles: [],
  trajectories: {},

  setVelocity: (velocity) => set({ velocity }),
  setAngle: (angle) => set({ angle }),
  setMass: (mass) => set({ mass }),
  setGravity: (gravity) => set({ gravity }),
  setDamping: (damping) => set({ damping }),
  setAirResistanceEnabled: (airResistanceEnabled) => set({ airResistanceEnabled }),
  setWindEnabled: (windEnabled) => set({ windEnabled }),
  setWindForce: (windForce) => set({ windForce }),
  setWindDirection: (windDirection) => set({ windDirection }),

  toggleShowProjectiles: () => set((state) => ({ showProjectiles: !state.showProjectiles })),
  toggleShowImpacts: () => set((state) => ({ showImpacts: !state.showImpacts })),
  toggleShowTrajectories: () => set((state) => ({ showTrajectories: !state.showTrajectories })),

  fireProjectile: (projectile) =>
    set((state) => {
      const id = `projectile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        projectiles: [...state.projectiles, { ...projectile, id, status: 'flying' }],
        trajectories: { ...state.trajectories, [id]: [] },
      };
    }),

  clearProjectiles: () =>
    set({
      projectiles: [],
      // NO limpiar las trayectorias para mantener el historial en las gráficas
    }),

  removeProjectile: (projectileId) =>
    set((state) => {
      const { [projectileId]: _, ...remainingTrajectories } = state.trajectories;
      return {
        projectiles: state.projectiles.filter((p) => p.id !== projectileId),
        trajectories: remainingTrajectories,
      };
    }),

  updateProjectileStatus: (projectileId, status) =>
    set((state) => ({
      projectiles: state.projectiles.map((p) =>
        p.id === projectileId ? { ...p, status } : p
      ),
    })),

  addTrajectoryPoint: (projectileId, point) =>
    set((state) => {
      const currentTrajectory = state.trajectories[projectileId] || [];
      return {
        trajectories: {
          ...state.trajectories,
          [projectileId]: [...currentTrajectory, point],
        },
      };
    }),
}));
