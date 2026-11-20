import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingType } from '../../types';
import { boxGeo, getBasicMat, getStdMat, gridToWorld, sphereGeo } from '../shared';
import { ProceduralBuilding } from './ProceduralBuilding';

export const DustCloud: React.FC<{
  x: number;
  y: number;
  gridSize?: number;
  type?: BuildingType;
  level?: number;
  color?: string;
}> = ({ x, y, gridSize, type, level, color }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const debrisRef = useRef<THREE.InstancedMesh>(null);
  const count = 15;
  const debrisCount = 10;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef(new Float32Array(count * 5));
  const startPos = useRef(new Float32Array(count * 3));
  const debrisParticles = useRef(new Float32Array(debrisCount * 6));
  const debrisStartPos = useRef(new Float32Array(debrisCount * 3));
  const [progress, setProgress] = useState(0);

  const [wx, _wy, wz] = gridToWorld(x, y, gridSize);

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      startPos.current[i * 3] = (Math.random() - 0.5) * 0.5;
      startPos.current[i * 3 + 1] = Math.random() * 0.2;
      startPos.current[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      particles.current[i * 5] = (Math.random() - 0.5) * 0.05;
      particles.current[i * 5 + 1] = Math.random() * 0.05 + 0.02;
      particles.current[i * 5 + 2] = (Math.random() - 0.5) * 0.05;
      particles.current[i * 5 + 3] = Math.random() * 0.4 + 0.2;
      particles.current[i * 5 + 4] = 1.0;
    }
    for (let i = 0; i < debrisCount; i++) {
      debrisStartPos.current[i * 3] = (Math.random() - 0.5) * 0.5;
      debrisStartPos.current[i * 3 + 1] = Math.random() * 0.4 + 0.2;
      debrisStartPos.current[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      debrisParticles.current[i * 6] = (Math.random() - 0.5) * 0.08;
      debrisParticles.current[i * 6 + 1] = Math.random() * 0.1 + 0.05;
      debrisParticles.current[i * 6 + 2] = (Math.random() - 0.5) * 0.08;
      debrisParticles.current[i * 6 + 3] = Math.random() * 0.1 + 0.05;
      debrisParticles.current[i * 6 + 4] = 1.0;
      debrisParticles.current[i * 6 + 5] = Math.random() * Math.PI;
    }
  }, [count, debrisCount]);

  useFrame((_state, delta) => {
    setProgress((p) => Math.min(1, p + delta * 2));
    if (meshRef.current) {
      for (let i = 0; i < count; i++) {
        let life = particles.current[i * 5 + 4];
        if (life <= 0) {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          meshRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        startPos.current[i * 3] += particles.current[i * 5];
        startPos.current[i * 3 + 1] += particles.current[i * 5 + 1];
        startPos.current[i * 3 + 2] += particles.current[i * 5 + 2];

        life -= 0.02;
        particles.current[i * 5 + 4] = life;

        dummy.position.set(
          wx + startPos.current[i * 3],
          startPos.current[i * 3 + 1],
          wz + startPos.current[i * 3 + 2],
        );
        dummy.scale.setScalar(particles.current[i * 5 + 3] * life);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (debrisRef.current) {
      for (let i = 0; i < debrisCount; i++) {
        let life = debrisParticles.current[i * 6 + 4];
        if (life <= 0) {
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          debrisRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }

        debrisStartPos.current[i * 3] += debrisParticles.current[i * 6];
        debrisStartPos.current[i * 3 + 1] += debrisParticles.current[i * 6 + 1];
        debrisStartPos.current[i * 3 + 2] += debrisParticles.current[i * 6 + 2];
        debrisParticles.current[i * 6 + 1] -= 0.01;

        life -= 0.02;
        debrisParticles.current[i * 6 + 4] = life;
        debrisParticles.current[i * 6 + 5] += 0.1;

        dummy.position.set(
          wx + debrisStartPos.current[i * 3],
          Math.max(-0.25, debrisStartPos.current[i * 3 + 1]),
          wz + debrisStartPos.current[i * 3 + 2],
        );
        dummy.rotation.set(
          debrisParticles.current[i * 6 + 5],
          debrisParticles.current[i * 6 + 5],
          0,
        );
        dummy.scale.setScalar(
          debrisParticles.current[i * 6 + 3] * (life > 0.5 ? 1 : life * 2),
        );
        dummy.updateMatrix();
        debrisRef.current.setMatrixAt(i, dummy.matrix);
      }
      debrisRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[sphereGeo, getBasicMat('#a1a1aa', { transparent: true, opacity: 0.6 }), count]}
        raycast={() => null}
      />
      <instancedMesh
        ref={debrisRef}
        args={[boxGeo, getStdMat(color || '#71717a'), debrisCount]}
        raycast={() => null}
      />
      {type && type !== BuildingType.None && progress < 1 && (
        <group
          position={[wx, -0.3 - progress * (level || 1) * 0.5, wz]}
          scale={[1 + progress * 0.5, 1 - progress, 1 + progress * 0.5]}
        >
          <ProceduralBuilding
            type={type}
            baseColor={color || '#fff'}
            x={x}
            y={y}
            level={level || 1}
            isDamaged
          />
        </group>
      )}
    </group>
  );
};
