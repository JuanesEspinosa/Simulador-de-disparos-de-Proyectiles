'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ControlsPanel from './ControlsPanel';
import ChartsPanel from './ChartsPanel';
import { useSimulationStore } from '@/store/simulationStore';

// Importar Canvas de forma dinámica
const Canvas = dynamic(() => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })), { ssr: false });
const Physics = dynamic(() => import('@react-three/rapier').then(mod => ({ default: mod.Physics })), { ssr: false });
const RigidBody = dynamic(() => import('@react-three/rapier').then(mod => ({ default: mod.RigidBody })), { ssr: false });
const OrbitControls = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.OrbitControls })), { ssr: false });
const PerspectiveCamera = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.PerspectiveCamera })), { ssr: false });
const Grid = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.Grid })), { ssr: false });
const Environment = dynamic(() => import('@react-three/drei').then(mod => ({ default: mod.Environment })), { ssr: false });
const Projectile = dynamic(() => import('./Projectile'), { ssr: false });

export default function SimulationScene() {
  const [showCharts, setShowCharts] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { projectiles, clearProjectiles } = useSimulationStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Canvas 3D */}
      <div className="absolute inset-0">
        <Canvas shadows gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]}>
              <PerspectiveCamera makeDefault position={[0, 5, 15]} />
              <ambientLight intensity={0.5} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <Grid
                args={[20, 20]}
                cellColor="#6f6f6f"
                sectionColor="#9d4b4b"
                cellThickness={0.5}
                sectionThickness={1}
                fadeDistance={25}
                fadeStrength={1}
              />
              <Environment preset="sunset" />
              
              {/* Suelo */}
              <RigidBody type="fixed" colliders="cuboid">
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, 0, 0]}
                  receiveShadow
                >
                  <planeGeometry args={[100, 100]} />
                  <meshStandardMaterial color="#2a2a2a" />
                </mesh>
              </RigidBody>

              {/* Renderizar todos los proyectiles */}
              {projectiles.map((proj) => (
                <Projectile
                  key={proj.id}
                  id={proj.id}
                  initialPosition={proj.initialPosition}
                  initialVelocity={proj.initialVelocity}
                  mass={proj.mass}
                  windEnabled={proj.windEnabled}
                  windForce={proj.windForce}
                />
              ))}

              <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={5}
                maxDistance={50}
              />
            </Physics>
          </Suspense>
        </Canvas>
      </div>

      {/* Panel de Controles */}
      <ControlsPanel />

      {/* Botón para mostrar/ocultar gráficas */}
      <button
        onClick={() => setShowCharts(!showCharts)}
        className="absolute top-4 right-4 z-10 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
      >
        {showCharts ? 'Ocultar Gráficas' : 'Mostrar Gráficas'}
      </button>

      {/* Botón para limpiar proyectiles */}
      <button
        onClick={clearProjectiles}
        className="absolute top-4 right-44 z-10 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors"
      >
        Limpiar
      </button>

      {/* Panel de Gráficas */}
      {showCharts && <ChartsPanel />}
    </div>
  );
}

