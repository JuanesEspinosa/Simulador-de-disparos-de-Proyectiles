'use client';

/**
 * Simulación usando Three.js directamente (sin React Three Fiber)
 * Refactorizado para ser modular y mantenible.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ControlsPanel from './ControlsPanel';
import ChartsPanel from './ChartsPanel';
import SceneSetup from './simulation/SceneSetup';
import Environment from './simulation/Environment';
import ProjectileSystem from './simulation/ProjectileSystem';
import SimulationUI from './simulation/SimulationUI';
import { useSimulationStore } from '@/store/simulationStore';

export default function SimpleSimulation() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [controls, setControls] = useState<OrbitControls | null>(null);

  // Subscribe to projectiles to trigger re-renders when they land/update
  const projectiles = useSimulationStore((state) => state.projectiles);

  const [showCharts, setShowCharts] = useState(false);
  const [currentImpactIndex, setCurrentImpactIndex] = useState<number>(-1);

  // Refs for cleanup functions provided by ProjectileSystem
  const clearFunctionsRef = useRef<{ clearImpacts: () => void; clearTrajectories: () => void } | null>(null);
  const getImpactsRef = useRef<(() => THREE.Object3D[]) | null>(null);

  const handleSceneReady = useCallback((
    newScene: THREE.Scene,
    newCamera: THREE.PerspectiveCamera,
    newRenderer: THREE.WebGLRenderer,
    newControls: OrbitControls
  ) => {
    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);
    setControls(newControls);
  }, []);

  // Main Render Loop
  useEffect(() => {
    if (!scene || !camera || !renderer || !controls) return;

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [scene, camera, renderer, controls]);

  const handleRegisterClearFunctions = useCallback((funcs: { clearImpacts: () => void; clearTrajectories: () => void }) => {
    clearFunctionsRef.current = funcs;
  }, []);

  const handleRegisterImpacts = useCallback((getImpacts: () => THREE.Object3D[]) => {
    getImpactsRef.current = getImpacts;
  }, []);

  const handleGoToFlag = () => {
    if (!camera || !controls) return;
    const flagPosition = new THREE.Vector3(0, 1, 0);
    const targetCameraPos = new THREE.Vector3(3, 3, 8);

    camera.position.copy(targetCameraPos);
    camera.lookAt(flagPosition);
    controls.target.copy(flagPosition);
    controls.update();
    setCurrentImpactIndex(-1);
  };

  const getImpactCount = () => {
    if (!getImpactsRef.current) return 0;
    const impacts = getImpactsRef.current();
    return impacts.filter(m => m instanceof THREE.Mesh && m.geometry instanceof THREE.CircleGeometry).length;
  };

  const goToImpact = (index: number) => {
    if (!camera || !controls || !getImpactsRef.current) return;

    const impacts = getImpactsRef.current().filter(m => m instanceof THREE.Mesh && m.geometry instanceof THREE.CircleGeometry);
    if (index < 0 || index >= impacts.length) return;

    const marker = impacts[index];
    const impactPosition = marker.position.clone();
    const cameraOffset = new THREE.Vector3(5, 8, 5);
    const targetCameraPos = impactPosition.clone().add(cameraOffset);

    camera.position.copy(targetCameraPos);
    camera.lookAt(impactPosition);
    controls.target.copy(impactPosition);
    controls.update();
  };

  const handleNextImpact = () => {
    const count = getImpactCount();
    if (count === 0) return;
    const nextIndex = currentImpactIndex < 0 ? 0 : (currentImpactIndex + 1) % count;
    setCurrentImpactIndex(nextIndex);
    goToImpact(nextIndex);
  };

  const handlePrevImpact = () => {
    const count = getImpactCount();
    if (count === 0) return;
    const prevIndex = currentImpactIndex < 0 ? count - 1 : (currentImpactIndex - 1 + count) % count;
    setCurrentImpactIndex(prevIndex);
    goToImpact(prevIndex);
  };

  const handleClearAll = () => {
    useSimulationStore.getState().clearProjectiles();
    useSimulationStore.setState({ trajectories: {} });
    if (clearFunctionsRef.current) {
      clearFunctionsRef.current.clearImpacts();
      clearFunctionsRef.current.clearTrajectories();
    }
    setCurrentImpactIndex(-1);
    handleGoToFlag(); // Reset camera to flag
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-sky-300 to-sky-100">
      <div ref={mountRef} className="absolute inset-0" />

      <SceneSetup mountRef={mountRef} onSceneReady={handleSceneReady} />

      {scene && (
        <>
          <Environment scene={scene} />
          <ProjectileSystem
            scene={scene}
            camera={camera}
            controls={controls}
            onRegisterClearFunctions={handleRegisterClearFunctions}
            onRegisterImpacts={handleRegisterImpacts}
          />
        </>
      )}

      <ControlsPanel />

      <SimulationUI
        showCharts={showCharts}
        setShowCharts={setShowCharts}
        onGoToFlag={handleGoToFlag}
        onClearAll={handleClearAll}
        impactCount={getImpactCount()}
        currentImpactIndex={currentImpactIndex}
        onNextImpact={handleNextImpact}
        onPrevImpact={handlePrevImpact}
      />

      {showCharts && <ChartsPanel onClose={() => setShowCharts(false)} />}
    </div>
  );
}
