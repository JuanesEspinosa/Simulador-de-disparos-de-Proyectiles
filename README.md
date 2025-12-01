# Simulador de Lanzamiento de Proyectiles 🚀

Una aplicación web interactiva y educativa diseñada para simular y visualizar la física del movimiento de proyectiles en un entorno 3D. Este proyecto permite a los usuarios experimentar con variables físicas como la gravedad, la resistencia del aire y el viento, observando sus efectos en tiempo real tanto en la trayectoria visual como en gráficas analíticas.

## 📋 Descripción del Proyecto

El objetivo principal es proporcionar una herramienta visual para entender conceptos de cinemática y dinámica. El simulador ofrece:
- **Simulación 3D en Tiempo Real**: Visualización de proyectiles, trayectorias y marcadores de impacto.
- **Física Avanzada**: Implementación de modelos de resistencia del aire (arrastre lineal) y efectos de viento lateral/frontal.
- **Análisis de Datos**: Gráficas interactivas de posición, velocidad y altura vs tiempo.
- **Diagramas de Fuerzas**: Visualización vectorial de las fuerzas que actúan sobre el proyectil en cada instante.
- **Internacionalización**: Soporte completo para Inglés y Español.

## 🛠️ Tecnologías y Librerías Utilizadas

El proyecto está construido con un stack moderno centrado en el rendimiento y la experiencia de usuario:

### Core
- **[Next.js 16](https://nextjs.org/)**: Framework de React para producción (App Router).
- **[React 18](https://react.dev/)**: Librería para la construcción de interfaces de usuario.
- **[TypeScript](https://www.typescriptlang.org/)**: Superset de JavaScript con tipado estático para mayor robustez.

### Gráficos y 3D
- **[Three.js](https://threejs.org/)**: Motor de renderizado 3D.
- **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber)**: Reconciliador de React para Three.js.
- **[@react-three/drei](https://github.com/pmndrs/drei)**: Colección de helpers y abstracciones para R3F.
- **[@react-three/rapier](https://github.com/pmndrs/react-three-rapier)**: Integración del motor de física Rapier (usado para colisiones con el suelo y estructura base).

### Estilos y UI
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework de CSS utilitario para diseño rápido y responsivo.
- **[Lucide React](https://lucide.dev/)**: Iconos vectoriales ligeros.

### Estado y Lógica
- **[Zustand](https://github.com/pmndrs/zustand)**: Gestión de estado global ligero y escalable.
- **Custom Hooks**: Lógica encapsulada para física (`useProjectileLogic`) e internacionalización (`useLanguage`).

### Visualización de Datos y Matemáticas
- **[Recharts](https://recharts.org/)**: Librería de gráficas composables para React.
- **[KaTeX](https://katex.org/)** (via `react-katex`): Renderizado rápido de fórmulas matemáticas LaTeX.

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una arquitectura basada en componentes y hooks, separando la lógica de simulación de la capa de presentación.

### Estructura de Directorios
```
├── app/                  # Rutas y layouts de Next.js
├── components/           # Componentes de React
│   ├── simulation/       # Componentes específicos de la escena 3D (UI, Sistema de Proyectiles)
│   ├── ChartsPanel.tsx   # Panel de análisis de datos y fórmulas
│   ├── ControlsPanel.tsx # Panel de control de variables físicas
│   ├──  ForcesDiagram.tsx # Visualización vectorial de fuerzas
│   └── ...
├── hooks/                # Hooks personalizados (useProjectileLogic, useLanguage)
├── store/                # Estado global (simulationStore)
└── locales/              # Archivos de traducción (en.json, es.json)
```

### Componentes Principales

1.  **`SimulationScene`**: El contenedor principal que inicializa el Canvas de Three.js y configura el entorno físico (luces, suelo, cámara).
2.  **`ProjectileSystem`**: Un componente "sin cabeza" (headless) dentro del Canvas que gestiona el ciclo de vida de los proyectiles. Utiliza el hook `useProjectileLogic` para actualizar posiciones frame a frame.
3.  **`ControlsPanel`**: Interfaz flotante que permite al usuario modificar la velocidad inicial, ángulo, masa, gravedad, coeficiente de rozamiento y viento.
4.  **`ChartsPanel`**: Panel desplegable que consume los datos de la trayectoria (`trajectories` en el store) y los renderiza en gráficas de líneas. También muestra las fórmulas físicas relevantes renderizadas con KaTeX.
5.  **`SimulationUI`**: Capa de interfaz sobre el Canvas que maneja botones de acción rápida (cámara, limpiar, toggles de visualización).

### Flujo de Datos

1.  **Input del Usuario**: El usuario ajusta parámetros en `ControlsPanel`. Estos actualizan el `simulationStore`.
2.  **Disparo**: Al disparar, se añade un nuevo proyectil al array `projectiles` en el store con su configuración inicial.
3.  **Simulación (Physics Loop)**:
    -   El hook `useProjectileLogic` se ejecuta en cada frame (`useFrame` de R3F).
    -   Calcula la nueva posición basándose en la integración de Euler: `v = v + a*dt`, `p = p + v*dt`.
    -   Aplica fuerzas: Gravedad (`g`), Arrastre (`-b*v`), y Viento.
    -   Actualiza directamente las referencias de los objetos Three.js (`mesh.position`) para máximo rendimiento (evitando re-renders de React por frame).
4.  **Registro de Trayectoria**: Periódicamente, se guardan puntos de la posición en el store (`trajectories`) para ser consumidos por `ChartsPanel`.
5.  **Colisión**: Al detectar `y <= 0`, se detiene el proyectil, se marca como 'landed' y se genera un marcador de impacto.

## 🌍 Internacionalización

El proyecto utiliza un sistema de internacionalización ligero basado en JSON.
-   **Archivos**: `locales/en.json` y `locales/es.json`.
-   **Hook**: `useLanguage` provee la función `t(key)` que busca la cadena correspondiente según el idioma seleccionado en el estado global.

## 🚀 Instalación y Uso

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    ```
2.  **Instalar dependencias**:
    ```bash
    npm install
    ```
3.  **Correr en desarrollo**:
    ```bash
    npm run dev
    ```
4.  **Abrir en el navegador**:
    Visita `http://localhost:3000`.

---
© 2025 Desarrollado por Juanes Espinosa
