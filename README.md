# Simulador de Lanzamiento de Proyectil 🚀

Una aplicación web interactiva construida con Next.js 16 y Three.js para simular el lanzamiento de cohetes con física realista.

## Características

- 🚀 **Cohetes 3D**: Modelos detallados con cuerpo, punta, aletas y efectos de llamas
- 📐 **Física Realista**: Gravedad, resistencia del aire y efectos del viento implementados manualmente
- 🌬️ **Resistencia del Aire y Viento**: Opción de activar/desactivar fricción por viento
- 📊 **Gráficas Interactivas**: Visualiza trayectorias y alcance máximo usando Recharts
- 🎮 **Controles Ajustables**: Modifica velocidad inicial, ángulo, masa y fuerza del viento
- 🎨 **Interfaz Moderna**: UI elegante con Tailwind CSS
- 🔄 **Rotación Dinámica**: Los cohetes rotan según su dirección de movimiento

## Tecnologías

- **Next.js 16**: Framework React con App Router
- **Three.js**: Renderizado 3D directo (sin React Three Fiber para mayor estabilidad)
- **Recharts**: Librería de gráficas para React
- **Zustand**: Gestión de estado
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos utilitarios
- **OrbitControls**: Controles de cámara para navegación 3D

## Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

## Uso

1. Ajusta los parámetros en el panel de controles:
   - **Velocidad Inicial**: Rango de 5 a 50 m/s
   - **Ángulo**: De 0° a 90°
   - **Masa**: De 0.1 a 10 kg
   - **Viento**: Activa/desactiva y ajusta la fuerza

2. Haz clic en "Disparar Proyectil" para lanzar

3. Observa la trayectoria en tiempo real en la escena 3D

4. Abre el panel de gráficas para ver:
   - Trayectoria (Posición X vs Y)
   - Alcance Máximo vs Ángulo (con ángulo óptimo)

## Estructura del Proyecto

```
├── app/
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página principal
│   └── globals.css         # Estilos globales
├── components/
│   ├── SimulationScene.tsx # Escena 3D principal
│   ├── Projectile.tsx      # Componente del proyectil
│   ├── ControlsPanel.tsx   # Panel de controles
│   └── ChartsPanel.tsx     # Panel de gráficas
└── store/
    └── simulationStore.ts  # Estado global (Zustand)
```

## Características Físicas

- **Gravedad**: 9.81 m/s²
- **Resistencia del Aire**: Calculada usando la ecuación de arrastre
- **Viento**: Fuerza horizontal ajustable
- **Colisiones**: Detección de colisión con el suelo

## Solución de Problemas

### Si React Three Fiber no funciona

Si tienes problemas con React Three Fiber (errores de carga, ReactCurrentOwner, etc.), puedes usar la versión alternativa más simple:

1. Abre `app/page.tsx`
2. Cambia `const USE_SIMPLE = false;` a `const USE_SIMPLE = true;`
3. Esto usará `SimpleSimulation.tsx` que usa Three.js directamente sin React Three Fiber

### Alternativas Recomendadas

Si sigues teniendo problemas, aquí hay alternativas que puedes considerar:

1. **Three.js Directo** (ya implementado en `SimpleSimulation.tsx`)
   - Más simple, sin dependencias de React Three Fiber
   - Control total sobre la escena
   - Menos problemas de compatibilidad

2. **Matter.js** (para física 2D)
   - Más ligero que Rapier
   - Fácil de usar
   - Bueno para simulaciones 2D

3. **Cannon.js** (alternativa a Rapier)
   - Más estable que Rapier en algunos casos
   - Buena documentación
   - Comunidad activa

4. **Canvas 2D API**
   - La opción más simple
   - Sin dependencias 3D
   - Perfecto para visualizaciones 2D simples

## Licencia

MIT

