"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import type { Model3DSceneData, Model3DShape } from "@/types/pipeline";
import * as THREE from "three";

interface Model3DViewerProps {
  sceneData: Model3DSceneData;
}

function ShapeComponent({ shape }: { shape: Model3DShape }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(shape.color), [shape.color]);

  const geometry = useMemo(() => {
    switch (shape.type) {
      case "cylinder":
        return new THREE.CylinderGeometry(
          shape.size[0] / 2,
          shape.size[0] / 2,
          shape.size[1],
          32
        );
      case "sphere":
        return new THREE.SphereGeometry(shape.size[0] / 2, 32, 32);
      case "plane":
        return new THREE.PlaneGeometry(shape.size[0], shape.size[1]);
      case "cone":
        return new THREE.ConeGeometry(
          shape.size[0] / 2,
          shape.size[1],
          32
        );
      case "torus":
        return new THREE.TorusGeometry(
          shape.size[0],
          shape.size[1] || shape.size[0] * 0.3,
          16,
          32
        );
      case "box":
      default:
        return new THREE.BoxGeometry(shape.size[0], shape.size[1], shape.size[2]);
    }
  }, [shape.type, shape.size]);

  const isTransparent = shape.opacity !== undefined && shape.opacity < 1;
  const metalness = shape.metalness ?? (shape.color === "#888888" || shape.color === "#666666" ? 0.8 : 0.1);
  const roughness = shape.roughness ?? 0.6;
  const opacity = shape.opacity ?? 1.0;

  return (
    <mesh
      ref={meshRef}
      position={shape.position}
      rotation={shape.rotation || [0, 0, 0]}
      geometry={geometry}
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={isTransparent}
        opacity={opacity}
        side={isTransparent ? THREE.DoubleSide : THREE.FrontSide}
      />
    </mesh>
  );
}

function AutoRotate({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

export default function Model3DViewer({ sceneData }: Model3DViewerProps) {
  // Calculate bounding box to auto-position camera
  const cameraPosition = useMemo<[number, number, number]>(() => {
    if (!sceneData.shapes.length) return [3, 2.5, 3];
    let maxExtent = 0;
    for (const shape of sceneData.shapes) {
      const extent = Math.max(
        Math.abs(shape.position[0]) + shape.size[0],
        Math.abs(shape.position[1]) + shape.size[1],
        Math.abs(shape.position[2]) + (shape.size[2] || shape.size[0])
      );
      if (extent > maxExtent) maxExtent = extent;
    }
    const dist = Math.max(maxExtent * 1.8, 3);
    return [dist * 0.8, dist * 0.6, dist * 0.8];
  }, [sceneData.shapes]);

  return (
    <div className="relative w-full h-[350px] rounded-xl overflow-hidden bg-gradient-to-b from-warm-100 to-warm-200 border border-white/5">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={cameraPosition} fov={45} />
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={1.5}
        />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        <pointLight position={[0, 4, 0]} intensity={0.5} color="#c9ac78" />

        {/* Environment */}
        <Environment preset="studio" />

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#1a1a2e" opacity={0.5} transparent />
        </mesh>

        {/* Model shapes */}
        <AutoRotate>
          {sceneData.shapes.map((shape, i) => (
            <ShapeComponent key={i} shape={shape} />
          ))}
        </AutoRotate>
      </Canvas>

      {/* Dimensions badge */}
      {sceneData.dimensions && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-gray-400 font-mono">
          {sceneData.dimensions.width}×{sceneData.dimensions.height}×{sceneData.dimensions.depth} cm
        </div>
      )}
    </div>
  );
}
