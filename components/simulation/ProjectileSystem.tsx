import { useEffect } from 'react';
import * as THREE from 'three';
import { useProjectileLogic } from '@/hooks/useProjectileLogic';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ProjectileSystemProps {
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    onRegisterClearFunctions: (funcs: { clearImpacts: () => void; clearTrajectories: () => void }) => void;
    onRegisterImpacts: (getImpacts: () => THREE.Object3D[]) => void;
}

export default function ProjectileSystem({
    scene,
    camera,
    controls,
    onRegisterClearFunctions,
    onRegisterImpacts
}: ProjectileSystemProps) {
    const { activeProjectiles, impactMarkers, clearImpactMarkers, clearTrajectoryLines } = useProjectileLogic(scene);

    // Register cleanup functions to parent
    useEffect(() => {
        onRegisterClearFunctions({
            clearImpacts: clearImpactMarkers,
            clearTrajectories: clearTrajectoryLines
        });
    }, [clearImpactMarkers, clearTrajectoryLines, onRegisterClearFunctions]);

    // Register access to impacts
    useEffect(() => {
        onRegisterImpacts(() => impactMarkers);
    }, [impactMarkers, onRegisterImpacts]);

    // Camera Follow Logic
    useEffect(() => {
        if (!camera || !controls) return;

        let animationFrame: number;
        const updateCamera = () => {
            if (activeProjectiles.length > 0) {
                const latest = activeProjectiles[activeProjectiles.length - 1];
                const targetPos = latest.mesh.position;
                const cameraOffset = new THREE.Vector3(0, 4, 10);
                const desiredPos = targetPos.clone().add(cameraOffset);

                camera.position.lerp(desiredPos, 0.08);
                camera.lookAt(targetPos);
                controls.target.lerp(targetPos, 0.08);
            }
            controls.update();
            animationFrame = requestAnimationFrame(updateCamera);
        };

        updateCamera();
        return () => cancelAnimationFrame(animationFrame);
    }, [activeProjectiles, camera, controls]);

    return null;
}
