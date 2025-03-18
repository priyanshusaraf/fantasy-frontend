import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  Environment, 
  OrbitControls, 
  PerspectiveCamera, 
  useTexture,
  AccumulativeShadows,
  RandomizedLight,
  Preload,
  Loader,
  Float
} from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import RacketModel from './RacketModel';
import CourtModel from './CourtModel';
import TrophyModel from './TrophyModel';

gsap.registerPlugin(ScrollTrigger);

interface ThreeSceneProps {
  className?: string;
}

const Particles = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  
  // Create random particles
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 15;
    positions[i3 + 1] = (Math.random() - 0.5) * 15;
    positions[i3 + 2] = (Math.random() - 0.5) * 15;
  }
  
  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    
    // Rotate particles
    particlesRef.current.rotation.y = clock.elapsedTime * 0.05;
    
    // Scale based on viewport
    const isMobile = viewport.width < 5;
    particlesRef.current.scale.setScalar(isMobile ? 0.5 : 1);
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#4f46e5"
        sizeAttenuation
        transparent
        alphaMap={useTexture('/images/gradient-bg.jpg')}
      />
    </points>
  );
};

// SceneManager handles the scroll-based animations and state
const SceneManager = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const { camera, viewport } = useThree();
  
  useEffect(() => {
    // Set initial camera position
    camera.position.set(0, 2, 10);
    
    // Handle scroll events
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const maxScroll = documentHeight - windowHeight;
      
      const progress = scrollY / maxScroll;
      setScrollProgress(progress);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [camera]);
  
  // Adjust camera position based on viewport
  useEffect(() => {
    const isMobile = viewport.width < 5;
    gsap.to(camera.position, {
      z: isMobile ? 15 : 10,
      duration: 1,
      ease: 'power2.out'
    });
  }, [camera, viewport]);
  
  // Camera animation on scroll
  useFrame(() => {
    // Move camera up slightly as user scrolls
    camera.position.y = 2 + scrollProgress * 3;
    
    // Tilt camera slightly
    camera.rotation.x = -0.2 - scrollProgress * 0.1;
  });
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.5}
        color="#4f46e5"
      />
      <spotLight
        position={[0, 10, 0]}
        intensity={0.5}
        angle={0.3}
        penumbra={1}
        color="#ffffff"
      />
      
      {/* Background */}
      <color attach="background" args={['#010615']} />
      
      {/* Models */}
      <group>
        <Float rotationIntensity={0.2} floatIntensity={0.5} speed={2}>
          <RacketModel 
            scrollProgress={scrollProgress} 
            position={[3, 1, -2]} 
            rotation={[0, Math.PI * 0.2, 0]} 
            scale={1.2}
          />
        </Float>
        
        <Float rotationIntensity={0.1} floatIntensity={0.2} speed={1.5}>
          <CourtModel 
            scrollProgress={scrollProgress} 
            position={[0, -2, -5]} 
            rotation={[0, 0, 0]} 
            scale={0.5}
          />
        </Float>
        
        <Float rotationIntensity={0.3} floatIntensity={0.3} speed={2.5}>
          <TrophyModel 
            scrollProgress={scrollProgress} 
            position={[-3, 1, -1]} 
            rotation={[0, -Math.PI * 0.2, 0]} 
            scale={0.8}
          />
        </Float>
      </group>
      
      {/* Particles in background */}
      <Particles />
      
      {/* Environment and Preload */}
      <Environment preset="city" />
      <Preload all />
    </>
  );
};

export default function ThreeScene({ className }: ThreeSceneProps) {
  return (
    <div className={`${className || ''} w-full h-screen relative`}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <SceneManager />
        </Suspense>
      </Canvas>
      <Loader 
        containerStyles={{
          background: 'linear-gradient(to right, #4f46e5, #8452d8)',
        }}
        barStyles={{
          backgroundColor: 'white',
        }}
        dataInterpolation={(p) => `Loading 3D scene... ${Math.round(p)}%`}
        dataStyles={{
          color: 'white',
          fontSize: '1rem',
          fontFamily: 'monospace',
        }}
      />
    </div>
  );
} 