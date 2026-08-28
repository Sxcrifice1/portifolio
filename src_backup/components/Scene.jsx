import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Environment, Sparkles } from '@react-three/drei';

function AbstractShape() {
  const meshRef = useRef();
  const innerRef = useRef();
  
  // Rotação suave do objeto principal
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x -= delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
    if (innerRef.current) {
      innerRef.current.rotation.x += delta * 0.5;
      innerRef.current.rotation.y -= delta * 0.4;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} scale={1.5}>
        <icosahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial 
          color="#60a5fa" 
          emissive="#3b82f6"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
          wireframe={true}
        />
      </mesh>
      
      {/* Esfera central normal, sem shader complexo para evitar crash na GPU */}
      <mesh ref={innerRef} scale={0.8}>
        <icosahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial 
          color="#8b5cf6" 
          emissive="#6d28d9"
          emissiveIntensity={0.8}
          clearcoat={1} 
          clearcoatRoughness={0.1} 
          metalness={0.9} 
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
      <color attach="background" args={['#030014']} />
      
      {/* Iluminação */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#8b5cf6" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#06b6d4" />
      <pointLight position={[0, 0, 0]} intensity={1} color="#ffffff" />
      
      {/* Fundo Estrelado e Partículas (Quantidade reduzida para performance) */}
      <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={50} scale={12} size={2} speed={0.4} color="#8b5cf6" />
      
      {/* Objeto Principal */}
      <AbstractShape />
      
      {/* Controles para o usuário interagir */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate={true}
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2 + 0.2}
        minPolarAngle={Math.PI / 2 - 0.2}
      />
    </Canvas>
  );
}
