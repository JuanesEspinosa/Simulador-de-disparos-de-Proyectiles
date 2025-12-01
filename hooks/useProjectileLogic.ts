import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/simulationStore';
import { PHYSICS_CONSTANTS } from '@/app/config/constants';

interface ProjectileData {
    mesh: THREE.Group;
    velocity: THREE.Vector3;
    id: string;
    startTime: number;
    mass: number;
    gravity: number;
    damping: number;
    windEnabled: boolean;
    windForce: number;
    windDirection: number;
    lastTrajectoryUpdate: number;
    trajectoryPoints: THREE.Vector3[];
    trajectoryLine: THREE.Line;
}

export function useProjectileLogic(scene: THREE.Scene | null) {
    const {
        projectiles,
        removeProjectile,
        addTrajectoryPoint,
        showProjectiles,
        showImpacts,
        showTrajectories
    } = useSimulationStore();

    const projectilesRef = useRef<ProjectileData[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    // Refs for cleanup
    const impactMarkersRef = useRef<THREE.Object3D[]>([]);
    const trajectoryLinesRef = useRef<THREE.Line[]>([]);

    // Visibility Effects
    useEffect(() => {
        projectilesRef.current.forEach(p => {
            p.mesh.visible = showProjectiles;
        });
    }, [showProjectiles]);

    useEffect(() => {
        impactMarkersRef.current.forEach(m => {
            m.visible = showImpacts;
        });
    }, [showImpacts]);

    useEffect(() => {
        trajectoryLinesRef.current.forEach(l => {
            l.visible = showTrajectories;
        });
    }, [showTrajectories]);

    // Clean up projectiles that were removed from the store
    useEffect(() => {
        if (!scene) return;

        const currentIds = projectiles.map(p => p.id);
        const trackedIds = projectilesRef.current.map(p => p.id);

        // Find projectiles that were removed
        const removedIds = trackedIds.filter(id => !currentIds.includes(id));

        removedIds.forEach(removedId => {
            // Find and remove from projectilesRef
            const index = projectilesRef.current.findIndex(p => p.id === removedId);
            if (index !== -1) {
                const proj = projectilesRef.current[index];

                // Remove mesh from scene
                if (proj.mesh) {
                    scene.remove(proj.mesh);
                    proj.mesh.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.geometry?.dispose();
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => m.dispose());
                            } else {
                                child.material?.dispose();
                            }
                        }
                    });
                }

                // Remove from array
                projectilesRef.current.splice(index, 1);
            }

            // Find and remove trajectory line
            const trajIndex = trajectoryLinesRef.current.findIndex(t => t.userData.projectileId === removedId);
            if (trajIndex !== -1) {
                const line = trajectoryLinesRef.current[trajIndex];
                scene.remove(line);
                line.geometry?.dispose();
                (line.material as THREE.Material)?.dispose();
                trajectoryLinesRef.current.splice(trajIndex, 1);
            }

            // Find and remove impact marker
            const impactIndex = impactMarkersRef.current.findIndex(i => i.userData.projectileId === removedId);
            if (impactIndex !== -1) {
                const impact = impactMarkersRef.current[impactIndex];
                scene.remove(impact);
                impact.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        child.geometry?.dispose();
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material?.dispose();
                        }
                    }
                });
                impactMarkersRef.current.splice(impactIndex, 1);
            }
        });
    }, [projectiles, scene]);

    // Initialize new projectiles
    useEffect(() => {
        if (!scene) return;

        const existingIds = projectilesRef.current.map((p) => p.id);
        const newProjectiles = projectiles.filter((proj) => !existingIds.includes(proj.id) && proj.status === 'flying');

        if (newProjectiles.length === 0) return;

        newProjectiles.forEach((proj) => {
            // Create Rocket Group
            const rocketGroup = new THREE.Group();
            rocketGroup.visible = showProjectiles;

            // ... Rocket Geometry Construction ...
            // Body - Align along Z axis
            const bodyGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
            const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 });
            const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.rotation.x = Math.PI / 2; // Rotate to point along Z
            rocketGroup.add(body);

            // Nose - Align along Z axis
            const noseGeometry = new THREE.ConeGeometry(0.06, 0.18, 8);
            const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.1 });
            const nose = new THREE.Mesh(noseGeometry, noseMaterial);
            nose.rotation.x = Math.PI / 2; // Rotate to point along Z
            nose.position.z = 0.265; // Move forward along Z
            rocketGroup.add(nose);

            // Fins
            const finGeometry = new THREE.BoxGeometry(0.02, 0.16, 0.08);
            const finMaterial = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.5, roughness: 0.5 });
            // Fin positions adjusted for Z-axis orientation
            const fin1 = new THREE.Mesh(finGeometry, finMaterial); fin1.position.set(0, 0.095, -0.14); fin1.rotation.y = Math.PI / 2; rocketGroup.add(fin1);
            const fin2 = new THREE.Mesh(finGeometry, finMaterial); fin2.position.set(0, -0.095, -0.14); fin2.rotation.y = Math.PI / 2; rocketGroup.add(fin2);
            const fin3 = new THREE.Mesh(finGeometry.clone(), finMaterial); fin3.position.set(0.095, 0, -0.14); fin3.rotation.z = Math.PI / 2; fin3.rotation.y = Math.PI / 2; rocketGroup.add(fin3);
            const fin4 = new THREE.Mesh(finGeometry.clone(), finMaterial); fin4.position.set(-0.095, 0, -0.14); fin4.rotation.z = Math.PI / 2; fin4.rotation.y = Math.PI / 2; rocketGroup.add(fin4);

            // Flame
            const flameGeometry = new THREE.ConeGeometry(0.04, 0.12, 6);
            const flameMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b00, transparent: true, opacity: 0.8 });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.rotation.x = -Math.PI / 2; // Point backwards (-Z)
            flame.position.z = -0.235;
            rocketGroup.add(flame);

            // Positioning
            rocketGroup.position.set(...proj.initialPosition);
            rocketGroup.castShadow = true;

            // Initial rotation based on velocity vector
            const velocityVector = new THREE.Vector3(...proj.initialVelocity);
            rocketGroup.lookAt(rocketGroup.position.clone().add(velocityVector));

            scene.add(rocketGroup);

            const launchPoint = new THREE.Vector3(...proj.initialPosition);
            const trajectoryPoints: THREE.Vector3[] = [launchPoint.clone()];
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2, transparent: true, opacity: 0.8 });
            const trajectoryLine = new THREE.Line(lineGeometry, lineMaterial);
            trajectoryLine.visible = showTrajectories;
            trajectoryLine.userData.projectileId = proj.id;
            scene.add(trajectoryLine);

            projectilesRef.current.push({
                mesh: rocketGroup,
                velocity: new THREE.Vector3(...proj.initialVelocity),
                id: proj.id,
                startTime: Date.now(),
                mass: proj.mass,
                gravity: proj.gravity,
                damping: proj.damping,
                windEnabled: proj.windEnabled,
                windForce: proj.windForce,
                windDirection: proj.windDirection,
                lastTrajectoryUpdate: performance.now(),
                trajectoryPoints,
                trajectoryLine,
            });
        });
    }, [projectiles, scene, showProjectiles, showTrajectories]);

    // Physics Loop
    useEffect(() => {
        if (!scene) return;

        let lastTime = performance.now();

        const animate = (currentTime: number) => {
            animationFrameRef.current = requestAnimationFrame(animate);
            const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;

            projectilesRef.current = projectilesRef.current.filter((proj) => {
                // Physics calculations
                // Use variable gravity from projectile data (captured at launch)
                // If gravity was not captured (old projectiles), use default 9.81
                const g = proj.gravity || 9.81;
                const damping = proj.damping ?? 0.5; // b coefficient

                // Linear Drag Model: F_drag = -b * v
                // With Wind: F_drag = -b * (v - V_wind)

                let windVelocity = new THREE.Vector3(0, 0, 0);

                if (proj.windEnabled) {
                    // Wind Force slider now represents Wind Velocity magnitude in m/s
                    const windRad = (proj.windDirection * Math.PI) / 180;
                    const windSpeed = proj.windForce; // Treated as velocity magnitude
                    windVelocity.set(
                        Math.cos(windRad) * windSpeed,
                        0,
                        Math.sin(windRad) * windSpeed
                    );
                }

                // Relative Velocity: v_rel = v - V_wind
                const relativeVelocity = proj.velocity.clone().sub(windVelocity);

                // Drag Force: F_d = -b * v_rel
                // Acceleration due to drag: a_d = F_d / m = -(b/m) * v_rel
                const dragAcceleration = relativeVelocity.clone().multiplyScalar(-damping / proj.mass);

                // Total Acceleration: a = g + a_d
                // g is (0, -g, 0)
                const totalAcceleration = dragAcceleration.clone();
                totalAcceleration.y -= g;

                // Update Velocity: v = v + a * dt
                proj.velocity.add(totalAcceleration.clone().multiplyScalar(deltaTime));

                // Update Position: p = p + v * dt
                const movement = proj.velocity.clone().multiplyScalar(deltaTime);
                proj.mesh.position.add(movement);

                const speed = proj.velocity.length();

                // Update rotation to face velocity direction
                if (speed > 0.1) {
                    const lookTarget = proj.mesh.position.clone().add(proj.velocity);
                    proj.mesh.lookAt(lookTarget);
                }

                // Trajectory Update
                proj.trajectoryPoints.push(proj.mesh.position.clone());
                if (proj.trajectoryLine && proj.trajectoryPoints.length > 1) {
                    proj.trajectoryLine.geometry.dispose();
                    proj.trajectoryLine.geometry = new THREE.BufferGeometry().setFromPoints(proj.trajectoryPoints);
                }

                if (currentTime - proj.lastTrajectoryUpdate > 100) {
                    addTrajectoryPoint(proj.id, {
                        x: proj.mesh.position.x,
                        y: proj.mesh.position.y,
                        z: proj.mesh.position.z,
                        time: (Date.now() - proj.startTime) / 1000,
                    });
                    proj.lastTrajectoryUpdate = currentTime;
                }

                // Collision / Ground Hit
                const distFromOrigin = Math.sqrt(proj.mesh.position.x ** 2 + proj.mesh.position.z ** 2);
                const isLaunching = distFromOrigin < 1.0 && proj.mesh.position.y < 2.0 && proj.velocity.y > 0;

                if (!isLaunching && (proj.mesh.position.y < 0.15 || (speed < 0.1 && proj.mesh.position.y < 0.5))) {
                    handleImpact(proj, scene);
                    return false; // Remove from active list
                }

                return true;
            });
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [scene, addTrajectoryPoint]);

    const handleImpact = (proj: ProjectileData, scene: THREE.Scene) => {
        const impactPos = proj.mesh.position.clone();
        impactPos.y = 0.02;

        // Marker
        const markerGeometry = new THREE.CircleGeometry(0.3, 32);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.rotation.x = -Math.PI / 2;
        marker.position.copy(impactPos);
        marker.visible = useSimulationStore.getState().showImpacts;
        marker.userData.projectileId = proj.id;
        scene.add(marker);
        impactMarkersRef.current.push(marker);

        // Text Sprite
        const alcance = Math.sqrt(impactPos.x ** 2 + impactPos.z ** 2);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
            canvas.width = 256; canvas.height = 128;
            context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = 'Bold 48px Arial'; context.fillStyle = '#000000';
            context.textAlign = 'center'; context.textBaseline = 'middle';
            context.fillText(`${alcance.toFixed(3)}m`, canvas.width / 2, canvas.height / 2);
            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
            sprite.position.set(impactPos.x, 0.8, impactPos.z);
            sprite.scale.set(2, 1, 1);
            sprite.visible = useSimulationStore.getState().showImpacts;
            sprite.userData.projectileId = proj.id;
            scene.add(sprite);
            impactMarkersRef.current.push(sprite);
        }

        if (proj.trajectoryLine) trajectoryLinesRef.current.push(proj.trajectoryLine);

        // Explosion Particles
        createExplosion(impactPos, scene);

        // Cleanup Projectile Mesh
        scene.remove(proj.mesh);
        proj.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
                else child.material.dispose();
            }
        });

        // Update status to landed so controls know it's done
        useSimulationStore.getState().updateProjectileStatus(proj.id, 'landed');
    };

    const createExplosion = (position: THREE.Vector3, scene: THREE.Scene) => {
        const particleCount = 20;
        const particles: THREE.Mesh[] = [];

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 4, 4);
            const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5) });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);

            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 0.5 + 0.3;
            particle.userData.velocity = new THREE.Vector3(Math.cos(angle) * speed, Math.random() * 0.8 + 0.5, Math.sin(angle) * speed);

            scene.add(particle);
            particles.push(particle);
        }

        let life = 60;
        const animateParticles = () => {
            life--;
            particles.forEach(p => {
                p.position.add(p.userData.velocity.clone().multiplyScalar(0.05));
                p.userData.velocity.y -= 0.02;
                p.scale.multiplyScalar(0.95);
                (p.material as THREE.MeshBasicMaterial).opacity = life / 60;
                (p.material as THREE.MeshBasicMaterial).transparent = true;
            });

            if (life > 0) requestAnimationFrame(animateParticles);
            else particles.forEach(p => { scene.remove(p); p.geometry.dispose(); (p.material as THREE.Material).dispose(); });
        };
        animateParticles();
    };

    const clearImpactMarkers = useCallback(() => {
        if (!scene) return;
        impactMarkersRef.current.forEach(m => { scene.remove(m); if ('geometry' in m) (m as any).geometry.dispose(); if ('material' in m) (m as any).material.dispose(); });
        impactMarkersRef.current = [];
    }, [scene]);

    const clearTrajectoryLines = useCallback(() => {
        if (!scene) return;
        trajectoryLinesRef.current.forEach(l => { scene.remove(l); l.geometry.dispose(); (l.material as THREE.Material).dispose(); });
        trajectoryLinesRef.current = [];
    }, [scene]);

    return {
        activeProjectiles: projectilesRef.current,
        impactMarkers: impactMarkersRef.current,
        clearImpactMarkers,
        clearTrajectoryLines,
    };
}
