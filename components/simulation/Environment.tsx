import * as THREE from 'three';
import { useEffect } from 'react';
import { VISUAL_CONSTANTS } from '@/app/config/constants';

interface EnvironmentProps {
    scene: THREE.Scene | null;
}

export default function Environment({ scene }: EnvironmentProps) {
    useEffect(() => {
        if (!scene) return;

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(
            VISUAL_CONSTANTS.DIMENSIONS.GROUND_SIZE,
            VISUAL_CONSTANTS.DIMENSIONS.GROUND_SIZE
        );
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: VISUAL_CONSTANTS.COLORS.GROUND,
            roughness: 0.8,
            metalness: 0.2,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Grid Helper
        const gridHelper = new THREE.GridHelper(
            VISUAL_CONSTANTS.DIMENSIONS.GRID_SIZE,
            VISUAL_CONSTANTS.DIMENSIONS.GRID_SIZE,
            VISUAL_CONSTANTS.COLORS.GRID_1,
            VISUAL_CONSTANTS.COLORS.GRID_2
        );
        gridHelper.position.y = 0.01;
        scene.add(gridHelper);

        // Clouds
        const createCloud = (x: number, y: number, z: number) => {
            const cloudGroup = new THREE.Group();
            const cloudMaterial = new THREE.MeshBasicMaterial({
                color: VISUAL_CONSTANTS.COLORS.CLOUD,
                transparent: true,
                opacity: 0.7,
            });

            for (let i = 0; i < 5; i++) {
                const cloudGeometry = new THREE.SphereGeometry(Math.random() * 1 + 0.5, 8, 8);
                const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
                cloudPart.position.set(
                    Math.random() * 2 - 1,
                    Math.random() * 0.5,
                    Math.random() * 2 - 1
                );
                cloudGroup.add(cloudPart);
            }

            cloudGroup.position.set(x, y, z);
            return cloudGroup;
        };

        const clouds = [
            createCloud(-15, 15, -20),
            createCloud(10, 18, -25),
            createCloud(20, 16, -15),
            createCloud(-20, 14, -30),
        ];
        clouds.forEach(cloud => scene.add(cloud));

        // Launch Point (Flag)
        const launchPoint = new THREE.Group();

        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: VISUAL_CONSTANTS.COLORS.POLE,
            metalness: 0.3,
            roughness: 0.7,
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 0.75;
        launchPoint.add(pole);

        // Flag
        const flagGeometry = new THREE.PlaneGeometry(0.6, 0.4);
        const flagMaterial = new THREE.MeshStandardMaterial({
            color: VISUAL_CONSTANTS.COLORS.FLAG,
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.8,
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0.3, 1.3, 0);
        launchPoint.add(flag);

        // Top Sphere
        const topGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const topMaterial = new THREE.MeshStandardMaterial({
            color: VISUAL_CONSTANTS.COLORS.FLAG_TOP,
            metalness: 0.9,
            roughness: 0.1,
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 1.52;
        launchPoint.add(top);

        // Platform
        const platformGeometry = new THREE.CircleGeometry(0.5, 32);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: VISUAL_CONSTANTS.COLORS.PLATFORM,
            metalness: 0.6,
            roughness: 0.4,
        });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.rotation.x = -Math.PI / 2;
        platform.position.y = 0.01;
        platform.receiveShadow = true;
        launchPoint.add(platform);

        launchPoint.position.set(0, 0, 0);
        launchPoint.castShadow = true;
        scene.add(launchPoint);

        // Cleanup
        return () => {
            scene.remove(ground);
            scene.remove(gridHelper);
            clouds.forEach(cloud => scene.remove(cloud));
            scene.remove(launchPoint);

            // Dispose geometries and materials
            groundGeometry.dispose();
            groundMaterial.dispose();
            // ... (add more disposal if strictly necessary, but React unmount usually handles scene cleanup via parent)
        };
    }, [scene]);

    return null;
}
