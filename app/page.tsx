'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Usando versión simple con Three.js directo (más estable)
const USE_SIMPLE = true;

const SimulationScene = dynamic(() => import('@/components/SimulationScene'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-white text-xl">Cargando simulación...</div>
    </div>
  ),
});

const SimpleSimulation = dynamic(() => import('@/components/SimpleSimulation'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-white text-xl">Cargando simulación...</div>
    </div>
  ),
});

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white text-xl">Inicializando...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full">
      {USE_SIMPLE ? <SimpleSimulation /> : <SimulationScene />}
    </main>
  );
}

