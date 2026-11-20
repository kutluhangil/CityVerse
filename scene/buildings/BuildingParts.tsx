import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  boxEdgesGeo,
  boxGeo,
  coneGeo,
  cylinderGeo,
  getBasicMat,
  getHash,
  getStdMat,
  inkEdgeMat,
  planeGeo,
  sphereGeo,
  windowMatA,
  windowMatB,
  windowMatC,
  windowMatDark,
} from '../shared';

export const PaperBox: React.FC<{
  position?: [number, number, number];
  scale?: [number, number, number];
  rotation?: [number, number, number];
  material: THREE.Material;
  showEdges?: boolean;
  transparent?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
}> = ({
  position,
  scale,
  rotation,
  material,
  showEdges = true,
  transparent = false,
  castShadow = true,
  receiveShadow = true,
}) => (
  <group position={position} scale={scale} rotation={rotation}>
    <mesh
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      geometry={boxGeo}
      material={material}
    />
    {showEdges && !transparent && (
      <lineSegments geometry={boxEdgesGeo} material={inkEdgeMat} />
    )}
  </group>
);

const WINDOW_MATERIALS = [windowMatA, windowMatB, windowMatC, windowMatDark];

export const WindowBlock = React.memo(
  ({
    position,
    scale,
    seed = 0,
  }: {
    position: [number, number, number];
    scale: [number, number, number];
    seed?: number;
  }) => (
    <mesh
      geometry={boxGeo}
      position={position}
      scale={scale}
      material={WINDOW_MATERIALS[Math.abs(Math.floor(seed)) % WINDOW_MATERIALS.length]}
    />
  ),
);

export const Scaffolding: React.FC<{ height?: number }> = ({ height = 0.85 }) => {
  const poleMat = getStdMat('#b5573a', { roughness: 0.9 });
  const barMat = getStdMat('#87867f', { roughness: 0.9 });
  const corners: [number, number][] = [
    [-0.42, -0.42],
    [0.42, -0.42],
    [-0.42, 0.42],
    [0.42, 0.42],
  ];

  return (
    <group>
      {corners.map(([cx, cz], i) => (
        <mesh
          key={i}
          geometry={boxGeo}
          material={poleMat}
          position={[cx, height / 2, cz]}
          scale={[0.035, height, 0.035]}
        />
      ))}
      <mesh
        geometry={boxGeo}
        material={barMat}
        position={[0, height * 0.45, 0.42]}
        scale={[0.84, 0.025, 0.025]}
      />
      <mesh
        geometry={boxGeo}
        material={barMat}
        position={[0, height * 0.85, -0.42]}
        scale={[0.84, 0.025, 0.025]}
      />
    </group>
  );
};

export const SmokeStack: React.FC<{
  position: [number, number, number];
  height?: number;
}> = ({ position, height = 1 }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    ref.current.children.forEach((child, i) => {
      const cloud = child as THREE.Mesh;
      cloud.position.y += 0.01 + i * 0.004;
      cloud.scale.addScalar(0.004);

      const material = cloud.material as THREE.MeshStandardMaterial;
      if (material) {
        material.opacity -= 0.005;
        if (cloud.position.y > 1.35) {
          cloud.position.y = 0;
          cloud.scale.setScalar(0.1 + Math.random() * 0.08);
          material.opacity = 0.72;
        }
      }
    });
  });

  return (
    <group position={position}>
      <mesh
        geometry={cylinderGeo}
        material={getStdMat('#262523')}
        castShadow
        receiveShadow
        position={[0, 0.5 * height, 0]}
        scale={[0.16, height, 0.16]}
      />
      <group ref={ref} position={[0, height, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            geometry={sphereGeo}
            position={[Math.random() * 0.08, i * 0.35, Math.random() * 0.08]}
            scale={0.16}
          >
            <meshStandardMaterial
              color="#faf9f5"
              transparent
              opacity={0.72}
              flatShading
              roughness={0.95}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const CrackDecal: React.FC<{
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}> = ({ position, rotation, scale }) => (
  <mesh
    position={position}
    rotation={rotation}
    scale={[scale, scale, 1]}
    geometry={planeGeo}
    material={getBasicMat('#141413', {
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      doubleSide: true,
    })}
  />
);

export const Tree: React.FC<{
  x: number;
  y: number;
  i: number;
  scale?: number;
  treeColor: string | THREE.Color;
  isSphere?: boolean;
  weather?: string;
}> = ({
  x,
  y,
  i,
  scale = 1,
  treeColor,
  isSphere = false,
  weather = 'sunny',
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const treeHex =
    weather === 'snowy'
      ? '#f3f5f6'
      : typeof treeColor === 'string'
        ? treeColor
        : '#' + treeColor.getHexString();
  const trunkMat = getStdMat('#52514e');
  const foliageMat = getStdMat(treeHex, { flatShading: true, roughness: 0.95 });

  useFrame((state) => {
    if (!groupRef.current) return;
    const speed = weather === 'rainy' || weather === 'snowy' ? 2 : 1;
    const swayAmount = weather === 'rainy' || weather === 'snowy' ? 0.07 : 0.025;
    const time = state.clock.elapsedTime;
    const windBase = Math.sin(time * speed + x * 0.1 + y * 0.1) * swayAmount;
    const windPush = swayAmount * 1.6;
    const swayX = windPush + windBase;
    const swayZ = (windPush + windBase) * 0.3;
    groupRef.current.rotation.set(swayZ, getHash(i, x) * Math.PI, -swayX);
  });

  return (
    <group position={[0, 0, 0]} scale={scale}>
      <group ref={groupRef}>
        <mesh
          castShadow
          receiveShadow
          material={trunkMat}
          geometry={cylinderGeo}
          position={[0, 0.15, 0]}
          scale={[0.08, 0.3, 0.08]}
        />
        {isSphere ? (
          <mesh
            castShadow
            receiveShadow
            material={foliageMat}
            geometry={sphereGeo}
            position={[0, 0.35, 0]}
            scale={[0.28, 0.28, 0.28]}
          />
        ) : (
          <group>
            <mesh
              castShadow
              receiveShadow
              material={foliageMat}
              geometry={coneGeo}
              position={[0, 0.4, 0]}
              scale={[0.38, 0.48, 0.38]}
            />
            <mesh
              castShadow
              receiveShadow
              material={foliageMat}
              geometry={coneGeo}
              position={[0, 0.65, 0]}
              scale={[0.28, 0.38, 0.28]}
            />
          </group>
        )}
      </group>
    </group>
  );
};

export const FountainWater: React.FC = () => {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!waterRef.current) return;
    const geo = waterRef.current.geometry as THREE.CylinderGeometry;
    const pos = geo.attributes.position;
    const time = state.clock.elapsedTime * 2;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y > 0) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const r = Math.sqrt(x * x + z * z);
        const newY = 0.5 + Math.sin(r * 20 - time) * 0.05;
        pos.setY(i, newY);
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh
      ref={waterRef}
      castShadow
      position={[0, 0.08, 0]}
      scale={[0.45, 0.05, 0.45]}
    >
      <cylinderGeometry args={[1, 1, 1, 16, 2]} />
      <meshStandardMaterial
        color="#8ea4b2"
        roughness={0.35}
        metalness={0.1}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
};
