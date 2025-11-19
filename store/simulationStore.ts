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
  windEnabled: boolean;
  windForce: number;
}

interface SimulationState {
  // Parámetros de control
  velocity: number;
  angle: number;
  mass: number;
  windEnabled: boolean;
  windForce: number;

  // Proyectiles activos
  projectiles: Projectile[];

  // Trayectorias registradas
  trajectories: { [projectileId: string]: TrajectoryPoint[] };

  // Setters
  setVelocity: (velocity: number) => void;
  setAngle: (angle: number) => void;
  setMass: (mass: number) => void;
  setWindEnabled: (enabled: boolean) => void;
  setWindForce: (force: number) => void;

  // Acciones
  fireProjectile: (projectile: Omit<Projectile, 'id'>) => void;
  clearProjectiles: () => void;
  removeProjectile: (projectileId: string) => void;
  addTrajectoryPoint: (projectileId: string, point: TrajectoryPoint) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  // Valores iniciales
  velocity: 20,
  angle: 45,
  mass: 1,
  windEnabled: false,
  windForce: 0.5,

  projectiles: [],
  trajectories: {},

  setVelocity: (velocity) => set({ velocity }),
  setAngle: (angle) => set({ angle }),
  setMass: (mass) => set({ mass }),
  setWindEnabled: (windEnabled) => set({ windEnabled }),
  setWindForce: (windForce) => set({ windForce }),

  fireProjectile: (projectile) =>
    set((state) => {
      const id = `projectile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        projectiles: [...state.projectiles, { ...projectile, id }],
        trajectories: { ...state.trajectories, [id]: [] },
      };
    }),

  clearProjectiles: () =>
    set({
      projectiles: [],
      // NO limpiar las trayectorias para mantener el historial en las gráficas
    }),

  removeProjectile: (projectileId) =>
    set((state) => ({
      projectiles: state.projectiles.filter((p) => p.id !== projectileId),
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

