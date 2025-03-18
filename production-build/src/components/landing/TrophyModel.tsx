import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface TrophyModelProps {
  scrollProgress: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function TrophyModel({
  scrollProgress,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: TrophyModelProps) {
  const trophyRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  useEffect(() => {
    if (!trophyRef.current) return;
    
    // Initial animation
    gsap.from(trophyRef.current.rotation, {
      y: Math.PI * 4,
      duration: 2.5,
      ease: "elastic.out(1, 0.3)",
    });
    
    gsap.from(trophyRef.current.position, {
      y: -10,
      duration: 1.5,
      ease: "power2.out",
    });
    
    gsap.from(trophyRef.current.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 1.5,
      ease: "back.out(1.7)",
    });
  }, []);
  
  useFrame(() => {
    if (!trophyRef.current) return;
    
    // Dynamic rotation based on scroll
    trophyRef.current.rotation.y = rotation[1] + scrollProgress * Math.PI * 2;
    
    // Floating animation
    trophyRef.current.position.y = position[1] + Math.sin(Date.now() * 0.001) * 0.1;
    
    // Scale based on viewport for responsiveness
    const isMobile = viewport.width < 5;
    trophyRef.current.scale.setScalar(scale * (isMobile ? 0.6 : 1));
  });

  return (
    <group ref={trophyRef} position={position} rotation={rotation}>
      {/* Trophy Base */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.8, 0.2, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
      </mesh>
      
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 0.2, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.7} />
      </mesh>
      
      {/* Trophy Stem */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} />
        <meshStandardMaterial color="#8452d8" roughness={0.1} metalness={0.9} />
      </mesh>
      
      {/* Trophy Cup Bottom */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.4, 0.4, 32]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.1} metalness={0.9} />
      </mesh>
      
      {/* Trophy Cup Middle */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.4, 32]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.1} metalness={0.9} />
      </mesh>
      
      {/* Trophy Cup Top */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.4, 0.4, 32]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.1} metalness={0.9} />
      </mesh>
      
      {/* Trophy Handles */}
      <mesh position={[-0.6, 1.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.2, 0.05, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.1} metalness={0.9} />
      </mesh>
      
      <mesh position={[0.6, 1.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.2, 0.05, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.1} metalness={0.9} />
      </mesh>
      
      {/* Decorative Elements - Stars */}
      <group position={[0, 2.8, 0]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh 
            key={i} 
            position={[
              0.2 * Math.cos(i * Math.PI * 0.4), 
              0.1, 
              0.2 * Math.sin(i * Math.PI * 0.4)
            ]} 
            rotation={[Math.PI * 0.5, 0, i * Math.PI * 0.4]}
            scale={0.1}
            castShadow
          >
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color="#ffdd00" emissive="#ffaa00" emissiveIntensity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
} 