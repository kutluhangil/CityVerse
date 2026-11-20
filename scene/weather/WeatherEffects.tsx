import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GRID_SIZE } from '../../constants';
import { BuildingType, Grid } from '../../types';
import {
  birdBoxGeo,
  birdMat,
  boxGeo,
  cylinderGeo,
  getBasicMat,
  getHash,
  getRandomRange,
  getStdMat,
  sphereGeo,
} from '../shared';

const CLOUD_PRESETS: { pos: [number, number, number]; scale: number; speed: number }[] = [
  { pos: [-10, 10.5, -6], scale: 1.1, speed: 0.4 },
  { pos: [-2, 12, 4], scale: 1.35, speed: 0.28 },
  { pos: [6, 11, -9], scale: 0.95, speed: 0.35 },
  { pos: [11, 12.5, 6], scale: 1.2, speed: 0.25 },
];

export const Cloud: React.FC<{
  position: [number, number, number];
  scale: number;
  speed: number;
  weather: string;
  range?: number;
}> = ({ position, scale, speed, weather, range = GRID_SIZE }) => {
  const group = useRef<THREE.Group>(null);
  useFrame((_state, delta) => {
    if (group.current) {
      group.current.position.x += speed * delta;
      if (group.current.position.x > range * 1.5) {
        group.current.position.x = -range * 1.5;
      }
    }
  });

  const bubbles = useMemo(
    () =>
      Array.from({ length: 5 + Math.floor(Math.random() * 5) }).map(() => ({
        pos: [
          getRandomRange(-1, 1),
          getRandomRange(-0.5, 0.5),
          getRandomRange(-1, 1),
        ] as [number, number, number],
        scale: getRandomRange(0.5, 1.2),
      })),
    [],
  );

  const cloudMat = getStdMat(weather === 'sunny' ? '#ffffff' : '#dedcd6', {
    flatShading: true,
    transparent: true,
    opacity: weather === 'sunny' ? 0.8 : 0.65,
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {bubbles.map((b, i) => (
        <mesh
          key={i}
          geometry={sphereGeo}
          material={cloudMat}
          position={b.pos}
          scale={b.scale}
          castShadow
        />
      ))}
    </group>
  );
};

export const Bird: React.FC<{
  position: [number, number, number];
  speed: number;
  offset: number;
}> = ({ position, speed, offset }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime + offset;
      ref.current.position.x = position[0] + Math.sin(time * speed) * GRID_SIZE;
      ref.current.position.z =
        position[1] + (Math.cos(time * speed) * GRID_SIZE) / 2;
      ref.current.rotation.y = -time * speed + Math.PI;
      ref.current.scale.y = 1 + Math.sin(time * 15) * 0.3;
    }
  });

  const wingMat = getBasicMat('#262523');
  return (
    <group ref={ref} position={[position[0], position[2], position[1]]}>
      <mesh
        geometry={boxGeo}
        material={wingMat}
        scale={[0.2, 0.05, 0.05]}
        position={[0.1, 0, 0]}
        rotation={[0, Math.PI / 4, 0]}
      />
      <mesh
        geometry={boxGeo}
        material={wingMat}
        scale={[0.2, 0.05, 0.05]}
        position={[-0.1, 0, 0]}
        rotation={[0, -Math.PI / 4, 0]}
      />
    </group>
  );
};

export const BirdSystem: React.FC = () => {
  const birds = useMemo(
    () =>
      Array.from({ length: 20 }).map(() => ({
        id: Math.random(),
        x: (Math.random() - 0.5) * 40,
        y: 8 + Math.random() * 4,
        z: (Math.random() - 0.5) * 40,
        speed: 2 + Math.random() * 2,
        angle: Math.random() * Math.PI * 2,
        wingPhase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    birds.forEach((bird, i) => {
      bird.x += Math.cos(bird.angle) * bird.speed * delta;
      bird.z += Math.sin(bird.angle) * bird.speed * delta;

      if (bird.x > 30) bird.x = -30;
      if (bird.x < -30) bird.x = 30;
      if (bird.z > 30) bird.z = -30;
      if (bird.z < -30) bird.z = 30;

      bird.angle += (Math.random() - 0.5) * delta * 0.5;

      const child = groupRef.current!.children[i];
      if (child) {
        child.position.set(
          bird.x,
          bird.y + Math.sin(state.clock.elapsedTime + i) * 0.5,
          bird.z,
        );
        child.rotation.y = -bird.angle;
        child.scale.x =
          1 + Math.sin(state.clock.elapsedTime * 15 + bird.wingPhase) * 0.5;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {birds.map((b) => (
        <mesh key={b.id} geometry={birdBoxGeo} material={birdMat} />
      ))}
    </group>
  );
};

export const FogOverlay: React.FC<{ weather: string; range?: number }> = ({
  weather,
  range = GRID_SIZE,
}) => {
  const fogRef = useRef<THREE.InstancedMesh>(null);
  const count = weather === 'snowy' ? 8 : weather === 'rainy' ? 10 : 0;
  const particles = useRef(new Float32Array(count * 4));
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    particles.current = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      particles.current[i * 4] = getRandomRange(-range, range);
      particles.current[i * 4 + 1] = getRandomRange(1, 3);
      particles.current[i * 4 + 2] = getRandomRange(-range, range);
      particles.current[i * 4 + 3] = getRandomRange(0.01, 0.025);
    }
  }, [count, range]);

  useFrame((state) => {
    if (!fogRef.current || count === 0) return;
    for (let i = 0; i < count; i++) {
      let x = particles.current[i * 4];
      let y = particles.current[i * 4 + 1];
      let z = particles.current[i * 4 + 2];
      const speed = particles.current[i * 4 + 3];
      const isStrongWind = weather === 'snowy' || weather === 'rainy';
      const driftSpeed = isStrongWind ? speed * 2 : speed;

      x += driftSpeed;
      z += driftSpeed * 0.3;
      x += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.01;

      if (x > range + 5 || z > range + 5) {
        x = getRandomRange(-range - 5, -range);
        y = getRandomRange(1, 3);
        z = getRandomRange(-range, range);
      }

      particles.current[i * 4] = x;
      particles.current[i * 4 + 1] = y;
      particles.current[i * 4 + 2] = z;
      dummy.position.set(x, y, z);
      dummy.scale.set(
        weather === 'snowy' ? 4 : 10,
        weather === 'snowy' ? 1.5 : 4,
        weather === 'snowy' ? 4 : 10,
      );
      dummy.rotation.set(0, state.clock.elapsedTime * 0.1, 0);
      dummy.updateMatrix();
      fogRef.current.setMatrixAt(i, dummy.matrix);
    }
    fogRef.current.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  const fogMat = getStdMat(weather === 'snowy' ? '#eef2f5' : '#e4e7ea', {
    transparent: true,
    opacity: weather === 'snowy' ? 0.06 : 0.1,
    depthWrite: false,
    roughness: 1,
  });

  return (
    <instancedMesh
      ref={fogRef}
      args={[sphereGeo, fogMat, count]}
      raycast={() => null}
    />
  );
};

export const WeatherParticles: React.FC<{
  type: string;
  grid: Grid;
  particleScale?: number;
}> = ({ type, grid, particleScale = 1 }) => {
  const gridSize = grid.length;
  const worldOffset = gridSize / 2 - 0.5;
  const isRain = type === 'rainy';
  const isSnow = type === 'snowy';
  const count = isRain
    ? Math.max(0, Math.round(900 * particleScale))
    : isSnow
      ? Math.max(0, Math.round(600 * particleScale))
      : 0;
  const splashCount = isRain ? Math.max(0, Math.round(180 * particleScale)) : 0;

  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef(new Float32Array(count * 4));

  useEffect(() => {
    particles.current = new Float32Array(count * 4);
    if (count === 0) return;
    for (let i = 0; i < count; i++) {
      particles.current[i * 4] = getRandomRange(-gridSize, gridSize);
      particles.current[i * 4 + 1] = getRandomRange(0, 15);
      particles.current[i * 4 + 2] = getRandomRange(-gridSize, gridSize);
      particles.current[i * 4 + 3] = isRain
        ? getRandomRange(0.2, 0.4)
        : getRandomRange(0.02, 0.05);
    }
  }, [count, isRain, isSnow, gridSize]);

  const splashRef = useRef<THREE.InstancedMesh>(null);
  const splashes = useRef(new Float32Array(splashCount * 3));
  useEffect(() => {
    splashes.current = new Float32Array(splashCount * 3);
    if (splashCount === 0) return;
    for (let i = 0; i < splashCount; i++) {
      splashes.current[i * 3] = getRandomRange(-gridSize, gridSize);
      splashes.current[i * 3 + 1] = getRandomRange(-gridSize, gridSize);
      splashes.current[i * 3 + 2] = getRandomRange(0, 1);
    }
  }, [splashCount, gridSize]);

  useFrame(() => {
    if (!meshRef.current || count === 0) return;
    for (let i = 0; i < count; i++) {
      let x = particles.current[i * 4];
      let y = particles.current[i * 4 + 1];
      let z = particles.current[i * 4 + 2];
      const speed = particles.current[i * 4 + 3];

      y -= speed;
      x += speed * 0.8;
      z += speed * 0.24;
      if (isSnow) x += Math.sin(y + i) * 0.01;

      if (y < -0.5 || x > gridSize) {
        y = 15;
        x = getRandomRange(-gridSize, gridSize);
        z = getRandomRange(-gridSize, gridSize);
      }

      particles.current[i * 4] = x;
      particles.current[i * 4 + 1] = y;
      particles.current[i * 4 + 2] = z;

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      if (isRain) {
        dummy.scale.set(0.02, 0.3, 0.02);
      } else {
        dummy.scale.set(0.05, 0.05, 0.05);
      }
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (isRain && splashRef.current) {
      for (let i = 0; i < splashCount; i++) {
        let x = splashes.current[i * 3];
        let z = splashes.current[i * 3 + 1];
        let life = splashes.current[i * 3 + 2];

        x += (getHash(i, i) - 0.5) * 0.05;
        life -= 0.04;

        if (life <= 0) {
          x = getRandomRange(-gridSize, gridSize);
          z = getRandomRange(-gridSize, gridSize);
          life = 1;
        }

        splashes.current[i * 3] = x;
        splashes.current[i * 3 + 1] = z;
        splashes.current[i * 3 + 2] = life;

        const scale = Math.sin(life * Math.PI) * 0.14;
        const gx = Math.round(x + worldOffset);
        const gy = Math.round(z + worldOffset);
        let splashY = -0.28;
        if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize && grid) {
          const tile = grid[gy][gx];
          if (
            tile.buildingType !== BuildingType.None &&
            tile.buildingType !== BuildingType.Road
          ) {
            const level = tile.level || 1;
            if (tile.buildingType === BuildingType.Commercial) {
              splashY = 0.5 * level;
            } else if (tile.buildingType === BuildingType.Industrial) {
              splashY = 0.3 + 0.3 * level;
            } else if (tile.buildingType === BuildingType.Residential) {
              splashY = 0.2 + 0.4 * level;
            } else {
              splashY = 0.1 * level;
            }
          }
        }
        dummy.position.set(x, splashY + (1 - life) * 0.1, z);
        dummy.scale.set(scale * 1.5, scale * 1.5, scale * 1.5);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        splashRef.current.setMatrixAt(i, dummy.matrix);
      }
      splashRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (count === 0) return null;

  const dropMat = getBasicMat(isRain ? '#6d8a9c' : '#faf9f5', {
    transparent: true,
    opacity: 0.55,
  });
  const splashMat = getBasicMat('#cbd8e0', {
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[isRain ? cylinderGeo : sphereGeo, dropMat, count]}
        raycast={() => null}
      />
      {isRain && (
        <instancedMesh
          ref={splashRef}
          args={[sphereGeo, splashMat, splashCount]}
          raycast={() => null}
        />
      )}
    </group>
  );
};

export const EnvironmentEffects: React.FC<{
  weather: string;
  grid: Grid;
  particleScale?: number;
}> = ({ weather, grid, particleScale = 1 }) => {
  return (
    <group raycast={() => null}>
      {CLOUD_PRESETS.map((c, idx) => (
        <Cloud
          key={idx}
          position={c.pos}
          scale={c.scale}
          speed={c.speed}
          weather={weather}
          range={grid.length}
        />
      ))}

      {weather === 'sunny' && (
        <group position={[0, 0, 0]} scale={0.8}>
          <Bird position={[0, 0, 10]} speed={0.6} offset={0} />
          <Bird position={[0, 0, 10]} speed={0.6} offset={1.2} />
          <Bird position={[0, 0, 10]} speed={0.6} offset={2.5} />
        </group>
      )}

      <WeatherParticles type={weather} grid={grid} particleScale={particleScale} />
      <FogOverlay weather={weather} range={grid.length} />
    </group>
  );
};
