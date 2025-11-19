'use client';

import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useSimulationStore } from '@/store/simulationStore';

interface ProjectileProps {
  id: string;
  initialPosition: [number, number, number];
  initialVelocity: [number, number, number];
  mass: number;
  windEnabled: boolean;
  windForce: number;
}

export default function Projectile({
  id,
  initialPosition,
  initialVelocity,
  mass,
  windEnabled,
  windForce,
}: ProjectileProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const [trajectory, setTrajectory] = useState<Array<{ x: number; y: number; z: number; time: number }>>([]);
  const startTime = useRef<number | null>(null);
  const { addTrajectoryPoint } = useSimulationStore();

  useEffect(() => {
    if (rigidBodyRef.current) {
      // Aplicar velocidad inicial
      rigidBodyRef.current.setLinvel(
        { x: initialVelocity[0], y: initialVelocity[1], z: initialVelocity[2] },
        true
      );
      startTime.current = Date.now();
    }
  }, [initialVelocity]);

  useFrame(() => {
    if (!rigidBodyRef.current || startTime.current === null) return;

    const position = rigidBodyRef.current.translation();
    const currentTime = (Date.now() - startTime.current) / 1000; // tiempo en segundos

    // Aplicar fuerza del viento si está habilitado
    if (windEnabled) {
      const windImpulse = { x: windForce, y: 0, z: 0 };
      rigidBodyRef.current.applyImpulse(windImpulse, true);
    }

    // Registrar punto de trayectoria
    const point = {
      x: position.x,
      y: position.y,
      z: position.z,
      time: currentTime,
    };

    setTrajectory((prev) => {
      const newTrajectory = [...prev, point];
      // Actualizar en el store cada 0.1 segundos aproximadamente
      if (newTrajectory.length % 6 === 0) {
        addTrajectoryPoint(id, point);
      }
      return newTrajectory;
    });

    // Aplicar resistencia del aire (proporcional a la velocidad al cuadrado)
    const velocity = rigidBodyRef.current.linvel();
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
    const airDensity = 1.225; // kg/m³
    const dragCoefficient = 0.47; // para una esfera
    const crossSectionalArea = Math.PI * 0.05 ** 2; // área de la esfera (radio 0.05m)
    
    if (speed > 0.01) {
      const dragForce = 0.5 * airDensity * dragCoefficient * crossSectionalArea * speed * speed;
      const dragImpulse = {
        x: -(velocity.x / speed) * dragForce * 0.016, // 0.016 es aproximadamente el deltaTime
        y: -(velocity.y / speed) * dragForce * 0.016,
        z: -(velocity.z / speed) * dragForce * 0.016,
      };
      rigidBodyRef.current.applyImpulse(dragImpulse, true);
    }

    // Detener si el proyectil está muy bajo
    if (position.y < -1) {
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition}
      mass={mass}
      colliders="ball"
      restitution={0.3}
      friction={0.1}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ff6b6b" metalness={0.8} roughness={0.2} />
      </mesh>
    </RigidBody>
  );
}

