'use client';

/**
 * Simulación usando Three.js directamente (sin React Three Fiber)
 * Más estable y sin problemas de compatibilidad
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ControlsPanel from './ControlsPanel';
import ChartsPanel from './ChartsPanel';
import { useSimulationStore } from '@/store/simulationStore';

interface ProjectileData {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  id: string;
  startTime: number;
  mass: number;
  windEnabled: boolean;
  windForce: number;
  lastTrajectoryUpdate: number;
  trajectoryPoints: THREE.Vector3[]; // Puntos de la trayectoria
  trajectoryLine: THREE.Line | null; // Línea de trayectoria
}

export default function SimpleSimulation() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const { projectiles, clearProjectiles, removeProjectile, addTrajectoryPoint } = useSimulationStore();
  const projectilesRef = useRef<ProjectileData[]>([]);
  const impactMarkersRef = useRef<THREE.Mesh[]>([]); // Guardar marcadores de impacto
  const trajectoryLinesRef = useRef<THREE.Line[]>([]); // Guardar líneas de trayectoria
  const [currentImpactIndex, setCurrentImpactIndex] = useState<number>(-1); // Índice del impacto actual (-1 = ninguno)

  useEffect(() => {
    if (!mountRef.current) return;

    // Crear escena
    const scene = new THREE.Scene();
    // Cielo azul como fondo
    scene.background = new THREE.Color(0x87ceeb);
    // Agregar niebla para efecto de profundidad
    scene.fog = new THREE.Fog(0x87ceeb, 20, 100);
    sceneRef.current = scene;

    // Crear cámara
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Crear renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controles de cámara (cargar dinámicamente para evitar problemas con SSR)
    import('three/examples/jsm/controls/OrbitControls.js').then((module) => {
      const OrbitControls = module.OrbitControls;
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 2;
      controls.maxDistance = 100; // Mayor distancia para ver más campo
      controls.maxPolarAngle = Math.PI / 2; // No permitir que la cámara vaya bajo el suelo
      controls.enablePan = true; // Permitir desplazamiento lateral
      controls.panSpeed = 1.5;
      controls.target.set(0, 0, 0);
      controls.update();
      controlsRef.current = controls;
      
      // Actualizar controles en el loop de animación
      const originalAnimate = animationFrameRef.current;
      if (originalAnimate) {
        // Los controles se actualizarán en el loop de animación
      }
    }).catch((err) => {
      console.warn('No se pudieron cargar los controles de órbita:', err);
    });

    // Luces - Sol brillante
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffdd, 1.2);
    directionalLight.position.set(10, 15, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);

    // Suelo - Pasto verde
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3a8f3a,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper más grande y detallado
    const gridHelper = new THREE.GridHelper(150, 150, 0x2d6b2d, 0x4a9f4a);
    gridHelper.position.y = 0.01; // Elevar un poco para que se vea sobre el suelo
    scene.add(gridHelper);

    // Agregar algunas nubes en el cielo
    const createCloud = (x: number, y: number, z: number) => {
      const cloudGroup = new THREE.Group();
      const cloudMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.7 
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

    // Agregar varias nubes
    scene.add(createCloud(-15, 15, -20));
    scene.add(createCloud(10, 18, -25));
    scene.add(createCloud(20, 16, -15));
    scene.add(createCloud(-20, 14, -30));

    // Bandera en el punto de lanzamiento
    const launchPoint = new THREE.Group();
    
    // Asta de la bandera (palo)
    const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x8b4513, // marrón
      metalness: 0.3,
      roughness: 0.7,
    });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 0.75;
    launchPoint.add(pole);
    
    // Bandera (tela roja)
    const flagGeometry = new THREE.PlaneGeometry(0.6, 0.4);
    const flagMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000, // rojo
      side: THREE.DoubleSide,
      metalness: 0.1,
      roughness: 0.8,
    });
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(0.3, 1.3, 0);
    launchPoint.add(flag);
    
    // Esfera en la punta del asta
    const topGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const topMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffd700, // dorado
      metalness: 0.9,
      roughness: 0.1,
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 1.52;
    launchPoint.add(top);
    
    // Plataforma de lanzamiento (círculo en el suelo)
    const platformGeometry = new THREE.CircleGeometry(0.5, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x666666,
      metalness: 0.6,
      roughness: 0.4,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.rotation.x = -Math.PI / 2;
    platform.position.y = 0.01;
    platform.receiveShadow = true;
    launchPoint.add(platform);
    
    // Posicionar en el punto de lanzamiento
    launchPoint.position.set(0, 0, 0);
    launchPoint.castShadow = true;
    scene.add(launchPoint);

    // Función de animación
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Limitar deltaTime
      lastTime = currentTime;

      const gravity = -9.81;
      const airDensity = 1.225;
      const dragCoefficient = 0.47;
      const crossSectionalArea = Math.PI * 0.1 ** 2;

      // Actualizar proyectiles
      projectilesRef.current = projectilesRef.current.filter((proj) => {
        const elapsed = (Date.now() - proj.startTime) / 1000;

        // Aplicar gravedad
        proj.velocity.y += gravity * deltaTime;

        // Aplicar viento si está habilitado
        if (proj.windEnabled) {
          proj.velocity.x += (proj.windForce / proj.mass) * deltaTime;
        }

        // Aplicar resistencia del aire
        const speed = proj.velocity.length();
        if (speed > 0.01) {
          const dragForce = 0.5 * airDensity * dragCoefficient * crossSectionalArea * speed * speed;
          const dragAcceleration = dragForce / proj.mass;
          const dragVector = proj.velocity.clone().normalize().multiplyScalar(-dragAcceleration * deltaTime);
          proj.velocity.add(dragVector);
        }

        // Actualizar posición
        const movement = proj.velocity.clone().multiplyScalar(deltaTime);
        proj.mesh.position.add(movement);

        // Actualizar rotación del cohete para que apunte en la dirección del movimiento
        const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
        proj.mesh.rotation.z = angle;

        // Registrar trayectoria y actualizar línea
        proj.trajectoryPoints.push(proj.mesh.position.clone());
        
        // Actualizar la línea de trayectoria en tiempo real
        if (proj.trajectoryLine && proj.trajectoryPoints.length > 1) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(proj.trajectoryPoints);
          proj.trajectoryLine.geometry.dispose();
          proj.trajectoryLine.geometry = lineGeometry;
        }
        
        // Registrar trayectoria cada 0.1 segundos para las gráficas
        if (currentTime - proj.lastTrajectoryUpdate > 100) {
          addTrajectoryPoint(proj.id, {
            x: proj.mesh.position.x,
            y: proj.mesh.position.y,
            z: proj.mesh.position.z,
            time: elapsed,
          });
          proj.lastTrajectoryUpdate = currentTime;
        }

        // Eliminar si está muy abajo o se detuvo
        if (proj.mesh.position.y < 0.15 || (speed < 0.1 && proj.mesh.position.y < 0.5)) {
          const impactPos = proj.mesh.position.clone();
          impactPos.y = 0.02; // Justo sobre el suelo
          
          // Crear marcador de impacto (círculo en el suelo) - PERSISTENTE
          const markerGeometry = new THREE.CircleGeometry(0.3, 32);
          const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.rotation.x = -Math.PI / 2;
          marker.position.copy(impactPos);
          scene.add(marker);
          
          // Calcular el alcance (distancia desde el origen)
          const alcance = Math.sqrt(impactPos.x ** 2 + impactPos.z ** 2);
          
          // Crear texto con el alcance usando un canvas
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.width = 256;
            canvas.height = 128;
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.font = 'Bold 48px Arial';
            context.fillStyle = '#000000';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(`${alcance.toFixed(1)}m`, canvas.width / 2, canvas.height / 2);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(impactPos.x, 0.8, impactPos.z);
            sprite.scale.set(2, 1, 1);
            scene.add(sprite);
            
            // Guardar referencia del sprite junto con el marcador
            impactMarkersRef.current.push(sprite);
          }
          
          // Guardar referencia del marcador para poder limpiarlo después
          impactMarkersRef.current.push(marker);
          
          // Hacer la línea de trayectoria persistente
          if (proj.trajectoryLine) {
            trajectoryLinesRef.current.push(proj.trajectoryLine);
          }
          
          // Crear explosión con partículas
          const particleCount = 20;
          const particles: THREE.Mesh[] = [];
          
          for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 4, 4);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
              color: new THREE.Color().setHSL(Math.random() * 0.1, 1, 0.5) // Naranja/amarillo
            });
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            particle.position.copy(impactPos);
            
            // Velocidad aleatoria para cada partícula
            const angle = Math.random() * Math.PI * 2;
            const speedParticle = Math.random() * 0.5 + 0.3;
            particle.userData.velocity = new THREE.Vector3(
              Math.cos(angle) * speedParticle,
              Math.random() * 0.8 + 0.5,
              Math.sin(angle) * speedParticle
            );
            
            scene.add(particle);
            particles.push(particle);
          }
          
          // Animar partículas de explosión
          let particleLife = 60; // frames
          const animateParticles = () => {
            particleLife--;
            particles.forEach((particle, index) => {
              if (particle.userData.velocity) {
                particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.05));
                particle.userData.velocity.y -= 0.02; // Gravedad
                
                // Reducir tamaño y opacidad
                particle.scale.multiplyScalar(0.95);
                (particle.material as THREE.MeshBasicMaterial).opacity = particleLife / 60;
                (particle.material as THREE.MeshBasicMaterial).transparent = true;
              }
            });
            
            if (particleLife > 0) {
              requestAnimationFrame(animateParticles);
            } else {
              // Limpiar partículas
              particles.forEach(particle => {
                scene.remove(particle);
                particle.geometry.dispose();
                (particle.material as THREE.Material).dispose();
              });
            }
          };
          animateParticles();
          
          // Limpiar el proyectil de la escena
          scene.remove(proj.mesh);
          proj.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          
          // Eliminar del store para desbloquear el botón
          removeProjectile(proj.id);
          
          return false;
        }

        return true;
      });

      // Seguir al proyectil más reciente con la cámara (desde un lado)
      if (projectilesRef.current.length > 0) {
        // Obtener el proyectil más reciente (último en la lista)
        const latestProjectile = projectilesRef.current[projectilesRef.current.length - 1];
        const targetPos = latestProjectile.mesh.position;
        
        // Posición de la cámara: desde un lado (vista lateral) y un poco arriba
        const cameraOffset = new THREE.Vector3(0, 4, 10); // A un lado, arriba y alejado
        const desiredCameraPos = targetPos.clone().add(cameraOffset);
        
        // Suavizar el movimiento de la cámara (lerp) - más suave
        camera.position.lerp(desiredCameraPos, 0.08);
        camera.lookAt(targetPos);
        
        // Actualizar el target de los controles suavemente
        if (controlsRef.current) {
          controlsRef.current.target.lerp(targetPos, 0.08);
        }
      } else if (impactMarkersRef.current.length === 0 && trajectoryLinesRef.current.length === 0) {
        // Si no hay proyectiles, impactos ni trayectorias, enfocar la bandera
        const flagPosition = new THREE.Vector3(0, 1, 0);
        const defaultCameraPos = new THREE.Vector3(3, 3, 8);
        
        camera.position.lerp(defaultCameraPos, 0.05);
        camera.lookAt(flagPosition);
        
        if (controlsRef.current) {
          controlsRef.current.target.lerp(flagPosition, 0.05);
        }
      }

      // Actualizar controles
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Manejar resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (controls) {
        controls.dispose();
      }
      if (mountRef.current && renderer.domElement && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      // Limpiar proyectiles
      projectilesRef.current.forEach((proj) => {
        scene.remove(proj.mesh);
        // Limpiar geometrías y materiales del grupo
        proj.mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
      projectilesRef.current = [];
    };
  }, []);

  // Agregar nuevos proyectiles - SOLO cuando se disparan nuevos
  useEffect(() => {
    if (!sceneRef.current) return;

    // Filtrar solo los proyectiles NUEVOS que no existen en la escena
    const existingIds = projectilesRef.current.map((p) => p.id);
    const newProjectiles = projectiles.filter(
      (proj) => !existingIds.includes(proj.id)
    );

    // Solo agregar si hay proyectiles nuevos
    if (newProjectiles.length === 0) return;

    newProjectiles.forEach((proj) => {

      // Crear cohete usando un grupo de geometrías
      const rocketGroup = new THREE.Group();
      
      // Cuerpo del cohete (cilindro)
      const bodyGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
      const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.8,
        roughness: 0.2,
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.rotation.z = Math.PI / 2; // Rotar para que apunte horizontalmente
      rocketGroup.add(body);
      
      // Punta del cohete (cono)
      const noseGeometry = new THREE.ConeGeometry(0.06, 0.18, 8);
      const noseMaterial = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        metalness: 0.9,
        roughness: 0.1,
      });
      const nose = new THREE.Mesh(noseGeometry, noseMaterial);
      nose.rotation.z = -Math.PI / 2;
      nose.position.x = 0.265;
      rocketGroup.add(nose);
      
      // Aletas del cohete
      const finGeometry = new THREE.BoxGeometry(0.02, 0.16, 0.08);
      const finMaterial = new THREE.MeshStandardMaterial({
        color: 0x1f2937,
        metalness: 0.5,
        roughness: 0.5,
      });
      
      // Aletas superior e inferior
      const fin1 = new THREE.Mesh(finGeometry, finMaterial);
      fin1.position.set(-0.14, 0.095, 0);
      rocketGroup.add(fin1);
      
      const fin2 = new THREE.Mesh(finGeometry, finMaterial);
      fin2.position.set(-0.14, -0.095, 0);
      rocketGroup.add(fin2);
      
      // Aleta izquierda y derecha
      const fin3 = new THREE.Mesh(finGeometry.clone(), finMaterial);
      fin3.position.set(-0.14, 0, 0.095);
      fin3.rotation.x = Math.PI / 2;
      rocketGroup.add(fin3);
      
      const fin4 = new THREE.Mesh(finGeometry.clone(), finMaterial);
      fin4.position.set(-0.14, 0, -0.095);
      fin4.rotation.x = Math.PI / 2;
      rocketGroup.add(fin4);
      
      // Llamas del cohete (opcional, para efecto visual)
      const flameGeometry = new THREE.ConeGeometry(0.04, 0.12, 6);
      const flameMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6b00,
        transparent: true,
        opacity: 0.8,
      });
      const flame = new THREE.Mesh(flameGeometry, flameMaterial);
      flame.rotation.z = Math.PI / 2;
      flame.position.x = -0.235;
      rocketGroup.add(flame);
      
      // Posicionar el cohete
      rocketGroup.position.set(...proj.initialPosition);
      rocketGroup.castShadow = true;
      
      // Calcular la rotación inicial basada en la velocidad
      const angle = Math.atan2(proj.initialVelocity[1], proj.initialVelocity[0]);
      rocketGroup.rotation.z = angle;
      
      sceneRef.current!.add(rocketGroup);

      // Crear vector de velocidad
      const velocity = new THREE.Vector3(...proj.initialVelocity);

      // Crear línea de trayectoria - iniciar desde la posición de lanzamiento del cohete
      const launchPoint = new THREE.Vector3(...proj.initialPosition); // Misma posición inicial del cohete
      const trajectoryPoints: THREE.Vector3[] = [launchPoint.clone()];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(trajectoryPoints);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0xff00ff, // Color magenta/rosa
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      const trajectoryLine = new THREE.Line(lineGeometry, lineMaterial);
      sceneRef.current!.add(trajectoryLine);

      projectilesRef.current.push({
        mesh: rocketGroup,
        velocity,
        id: proj.id,
        startTime: Date.now(),
        mass: proj.mass,
        windEnabled: proj.windEnabled,
        windForce: proj.windForce,
        lastTrajectoryUpdate: performance.now(),
        trajectoryPoints,
        trajectoryLine,
      });
    });
  }, [projectiles, addTrajectoryPoint]);

  // Función para limpiar los marcadores de impacto
  const clearImpactMarkers = () => {
    if (!sceneRef.current) return;
    
    impactMarkersRef.current.forEach((marker) => {
      sceneRef.current!.remove(marker);
      marker.geometry.dispose();
      (marker.material as THREE.Material).dispose();
    });
    impactMarkersRef.current = [];
    setCurrentImpactIndex(-1); // Resetear índice cuando se limpian los impactos
  };

  // Función para limpiar las líneas de trayectoria
  const clearTrajectoryLines = () => {
    if (!sceneRef.current) return;
    
    trajectoryLinesRef.current.forEach((line) => {
      sceneRef.current!.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });
    trajectoryLinesRef.current = [];
  };

  // Función para limpiar todo incluyendo trayectorias del store
  const clearAll = () => {
    clearProjectiles();
    clearImpactMarkers();
    clearTrajectoryLines();
    // Limpiar también las trayectorias del store
    useSimulationStore.setState({ trajectories: {} });
  };

  // Función para ir a la bandera/inicio
  const goToFlag = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const flagPosition = new THREE.Vector3(0, 1, 0);
    const targetCameraPos = new THREE.Vector3(3, 3, 8);
    
    // Mover cámara suavemente a la bandera
    cameraRef.current.position.copy(targetCameraPos);
    cameraRef.current.lookAt(flagPosition);
    controlsRef.current.target.copy(flagPosition);
    controlsRef.current.update();
    setCurrentImpactIndex(-1); // Resetear índice de impacto
  };

  // Función para obtener el número de impactos (solo círculos, no sprites)
  const getImpactCount = () => {
    return impactMarkersRef.current.filter(
      (marker) => marker.geometry instanceof THREE.CircleGeometry
    ).length;
  };

  // Función para navegar al siguiente impacto
  const goToNextImpact = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const impactCount = getImpactCount();
    if (impactCount === 0) return;
    
    // Calcular siguiente índice (circular)
    const nextIndex = currentImpactIndex < 0 
      ? 0 
      : (currentImpactIndex + 1) % impactCount;
    
    setCurrentImpactIndex(nextIndex);
    goToImpact(nextIndex);
  };

  // Función para navegar al impacto anterior
  const goToPreviousImpact = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const impactCount = getImpactCount();
    if (impactCount === 0) return;
    
    // Calcular índice anterior (circular)
    const prevIndex = currentImpactIndex < 0
      ? impactCount - 1
      : (currentImpactIndex - 1 + impactCount) % impactCount;
    
    setCurrentImpactIndex(prevIndex);
    goToImpact(prevIndex);
  };

  // Función para mover la cámara a un impacto específico
  const goToImpact = (index: number) => {
    if (!cameraRef.current || !controlsRef.current || index < 0) return;
    
    // Filtrar solo los marcadores de círculo (no los sprites de texto)
    // Los marcadores de círculo tienen CircleGeometry
    const circleMarkers = impactMarkersRef.current.filter(
      (marker) => marker.geometry instanceof THREE.CircleGeometry
    );
    
    if (index >= circleMarkers.length) return;
    
    const marker = circleMarkers[index];
    const impactPosition = marker.position.clone();
    
    // Posición de la cámara: vista desde arriba y un poco alejada
    const cameraOffset = new THREE.Vector3(5, 8, 5);
    const targetCameraPos = impactPosition.clone().add(cameraOffset);
    
    // Mover cámara al impacto
    cameraRef.current.position.copy(targetCameraPos);
    cameraRef.current.lookAt(impactPosition);
    controlsRef.current.target.copy(impactPosition);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-sky-300 to-sky-100">
      <div ref={mountRef} className="absolute inset-0" />
      
      <ControlsPanel />
      
      {/* Botones de control */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 flex-wrap max-w-2xl justify-end">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors font-medium"
        >
          {showCharts ? 'Ocultar Gráficas' : 'Mostrar Gráficas'}
        </button>

        <button
          onClick={goToFlag}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-lg transition-colors font-medium"
        >
          🏁 Ir a Inicio
        </button>

        {/* Navegación entre impactos */}
        {getImpactCount() > 0 && (
          <div className="flex gap-2 items-center bg-gray-800/90 backdrop-blur-sm px-3 py-2 rounded-lg">
            <button
              onClick={goToPreviousImpact}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow-lg transition-colors font-bold text-lg"
              title="Impacto anterior"
            >
              ←
            </button>
            <span className="px-3 py-1 text-white text-sm font-medium">
              {currentImpactIndex >= 0 
                ? `${currentImpactIndex + 1} / ${getImpactCount()}`
                : `Impactos: ${getImpactCount()}`}
            </span>
            <button
              onClick={goToNextImpact}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow-lg transition-colors font-bold text-lg"
              title="Siguiente impacto"
            >
              →
            </button>
          </div>
        )}

        <button
          onClick={clearProjectiles}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-lg transition-colors font-medium"
        >
          🚀 Cohetes
        </button>

        <button
          onClick={clearImpactMarkers}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg shadow-lg transition-colors font-medium"
        >
          🎯 Impactos
        </button>

        <button
          onClick={clearTrajectoryLines}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors font-medium"
        >
          📈 Trayectorias
        </button>

        <button
          onClick={clearAll}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg shadow-lg transition-colors font-medium"
        >
          🧹 Limpiar Todo
        </button>
      </div>

      {showCharts && <ChartsPanel />}
    </div>
  );
}

