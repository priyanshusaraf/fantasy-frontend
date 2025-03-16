import React, { useRef, useEffect } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface RacketModelProps {
  scrollProgress: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function RacketModel({
  scrollProgress,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: RacketModelProps) {
  const racketRef = useRef<THREE.Group>(null);
  const previousScrollY = useRef(0);
  const { viewport } = useThree();
  
  // Create a basic racket shape since we don't have an actual model
  useEffect(() => {
    if (!racketRef.current) return;
    
    // Initial animation
    gsap.from(racketRef.current.rotation, {
      y: -Math.PI * 2,
      duration: 2,
      ease: "power3.out",
    });
    
    gsap.from(racketRef.current.position, {
      y: -5,
      duration: 1.5,
      ease: "elastic.out(1, 0.3)",
    });
  }, []);
  
  useFrame(() => {
    if (!racketRef.current) return;
    
    // Dynamic rotation based on scroll
    racketRef.current.rotation.y = rotation[1] + scrollProgress * Math.PI * 2;
    
    // Floating animation
    racketRef.current.position.y = position[1] + Math.sin(Date.now() * 0.001) * 0.1;
    
    // Scale based on viewport for responsiveness
    const isMobile = viewport.width < 5;
    racketRef.current.scale.setScalar(scale * (isMobile ? 0.7 : 1));
  });

  return (
    <group ref={racketRef} position={[position[0], position[1], position[2]]}>
      {/* Racket Handle */}
      <mesh position={[0, -1.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 1.2, 16]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* Racket Neck */}
      <mesh position={[0, -0.8, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 0.5, 16]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* Racket Head */}
      <group position={[0, 0, 0]}>
        {/* Frame */}
        <mesh castShadow>
          <torusGeometry args={[0.7, 0.06, 16, 100]} />
          <meshStandardMaterial color="#4f46e5" roughness={0.2} metalness={0.8} />
        </mesh>
        
        {/* Strings - Horizontal */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`h-${i}`} position={[0, -0.55 + i * 0.1, 0]} castShadow>
            <boxGeometry args={[1.3, 0.01, 0.01]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
        ))}
        
        {/* Strings - Vertical */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`v-${i}`} position={[-0.55 + i * 0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <boxGeometry args={[1.3, 0.01, 0.01]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
        ))}
      </group>
    </group>
  );
} 