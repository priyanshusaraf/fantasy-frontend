import React, { useRef, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';

interface CourtModelProps {
  scrollProgress: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

export default function CourtModel({
  scrollProgress,
  position = [0, -2, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: CourtModelProps) {
  const courtRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  
  const courtTexture = useTexture('/images/court-texture.jpg');
  courtTexture.wrapS = courtTexture.wrapT = THREE.RepeatWrapping;
  courtTexture.repeat.set(1, 1);

  useEffect(() => {
    if (!courtRef.current) return;
    
    // Initial animation
    gsap.from(courtRef.current.position, {
      y: -10,
      duration: 2,
      ease: "power3.out",
    });
    
    gsap.from(courtRef.current.rotation, {
      x: -Math.PI / 2,
      duration: 1.8,
      ease: "back.out(1.7)",
    });
  }, []);
  
  useFrame(() => {
    if (!courtRef.current) return;
    
    // Dynamic rotation based on scroll
    courtRef.current.rotation.y = rotation[1] + scrollProgress * Math.PI * 0.2;
    
    // Floating animation
    courtRef.current.position.y = position[1] + Math.sin(Date.now() * 0.0005) * 0.05;
    
    // Scale based on viewport for responsiveness
    const isMobile = viewport.width < 5;
    courtRef.current.scale.setScalar(scale * (isMobile ? 0.5 : 1));
  });

  return (
    <group ref={courtRef} position={position} rotation={rotation}>
      {/* Court Surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 6, 32, 32]} />
        <meshStandardMaterial 
          map={courtTexture} 
          color="#4389ce"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Court Lines */}
      <group position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Outer Boundary */}
        <mesh>
          <ringGeometry args={[5.9, 6, 32]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        {/* Center Line */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.1, 6, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        {/* Net Line */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[12, 0.1, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        
        {/* Service Boxes */}
        <mesh position={[-3, 1.5, 0.01]}>
          <boxGeometry args={[6, 3, 0.01]} />
          <meshStandardMaterial color="#ffffff" wireframe={true} />
        </mesh>
        
        <mesh position={[-3, -1.5, 0.01]}>
          <boxGeometry args={[6, 3, 0.01]} />
          <meshStandardMaterial color="#ffffff" wireframe={true} />
        </mesh>
        
        <mesh position={[3, 1.5, 0.01]}>
          <boxGeometry args={[6, 3, 0.01]} />
          <meshStandardMaterial color="#ffffff" wireframe={true} />
        </mesh>
        
        <mesh position={[3, -1.5, 0.01]}>
          <boxGeometry args={[6, 3, 0.01]} />
          <meshStandardMaterial color="#ffffff" wireframe={true} />
        </mesh>
      </group>
      
      {/* Net */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[6.1, 1, 0.05]} />
        <meshStandardMaterial
          color="#333333"
          transparent={true}
          opacity={0.9}
          wireframe={true}
        />
      </mesh>
      
      {/* Net Posts */}
      <mesh position={[-3.1, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
        <meshStandardMaterial color="#777777" />
      </mesh>
      
      <mesh position={[3.1, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
        <meshStandardMaterial color="#777777" />
      </mesh>
    </group>
  );
} 