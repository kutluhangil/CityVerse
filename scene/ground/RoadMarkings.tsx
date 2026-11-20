import React, { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingType, Grid } from '../../types';
import {
  boxGeo,
  getHash,
  getStdMat,
  roadCenterGeo,
  roadCrack1Geo,
  roadCrack2Geo,
  roadCrack3Geo,
  roadCrackMat,
  roadLineGeo,
  roadLineMat,
  roadPatch1Geo,
  roadPatch2Geo,
  roadPatchMat,
  roadTireMat,
  roadWearMat,
} from '../shared';

export const TrafficLight: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const matX = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#22c55e',
        emissive: '#22c55e',
        emissiveIntensity: 0.8,
      }),
    [],
  );
  const matY = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#ef4444',
        emissiveIntensity: 0.8,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      matX.dispose();
      matY.dispose();
    };
  }, [matX, matY]);

  useFrame((state) => {
    const time = state.clock.elapsedTime / 4 + x + y;
    const cycle = time % 2;
    if (cycle < 0.8) {
      matX.color.setHex(0x22c55e);
      matX.emissive.setHex(0x22c55e);
      matY.color.setHex(0xef4444);
      matY.emissive.setHex(0xef4444);
    } else if (cycle < 1.0) {
      matX.color.setHex(0xeab308);
      matX.emissive.setHex(0xeab308);
      matY.color.setHex(0xef4444);
      matY.emissive.setHex(0xef4444);
    } else if (cycle < 1.8) {
      matX.color.setHex(0xef4444);
      matX.emissive.setHex(0xef4444);
      matY.color.setHex(0x22c55e);
      matY.emissive.setHex(0x22c55e);
    } else {
      matX.color.setHex(0xef4444);
      matX.emissive.setHex(0xef4444);
      matY.color.setHex(0xeab308);
      matY.emissive.setHex(0xeab308);
    }
  });

  return (
    <group position={[0, 0.4, 0]}>
      <mesh
        position={[0, 0, 0]}
        scale={[0.08, 0.2, 0.08]}
        geometry={boxGeo}
        material={getStdMat('#374151')}
        castShadow
      />
      <mesh
        position={[0.045, 0.05, 0]}
        scale={[0.02, 0.04, 0.02]}
        geometry={boxGeo}
        material={matX}
      />
      <mesh
        position={[-0.045, 0.05, 0]}
        scale={[0.02, 0.04, 0.02]}
        geometry={boxGeo}
        material={matX}
      />
      <mesh
        position={[0, 0.05, 0.045]}
        scale={[0.02, 0.04, 0.02]}
        geometry={boxGeo}
        material={matY}
      />
      <mesh
        position={[0, 0.05, -0.045]}
        scale={[0.02, 0.04, 0.02]}
        geometry={boxGeo}
        material={matY}
      />
    </group>
  );
};

export const RoadMarkings = React.memo(
  ({
    x,
    y,
    grid,
    yOffset,
  }: {
    x: number;
    y: number;
    grid: Grid;
    yOffset: number;
  }) => {
    const hash = getHash(x, y);

    const size = grid.length;
    const hasUp = y > 0 && grid[y - 1][x].buildingType === BuildingType.Road;
    const hasDown =
      y < size - 1 && grid[y + 1][x].buildingType === BuildingType.Road;
    const hasLeft = x > 0 && grid[y][x - 1].buildingType === BuildingType.Road;
    const hasRight =
      x < size - 1 && grid[y][x + 1].buildingType === BuildingType.Road;

    const connections = [hasUp, hasDown, hasLeft, hasRight].filter(Boolean).length;

    if (connections === 0) {
      return (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, yOffset, 0]}
          geometry={roadLineGeo}
          material={roadLineMat}
        />
      );
    }

    return (
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]}>
        {(hasUp || hasDown) && (hasLeft || hasRight) && (
          <mesh
            position={[0, 0, 0.005]}
            geometry={roadCenterGeo}
            material={roadLineMat}
          />
        )}

        {hasUp && (
          <mesh position={[0, 0.25, 0]} geometry={roadLineGeo} material={roadLineMat} />
        )}
        {hasDown && (
          <mesh position={[0, -0.25, 0]} geometry={roadLineGeo} material={roadLineMat} />
        )}
        {hasLeft && (
          <mesh
            position={[-0.25, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            geometry={roadLineGeo}
            material={roadLineMat}
          />
        )}
        {hasRight && (
          <mesh
            position={[0.25, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            geometry={roadLineGeo}
            material={roadLineMat}
          />
        )}

        {connections >= 3 && (
          <group>
            <mesh position={[0, 0, 0.01]} material={roadTireMat}>
              <ringGeometry args={[0.1, 0.35, 16, 1, 0, Math.PI * 2 * hash]} />
            </mesh>
            <mesh position={[0, 0, 0.015]} material={roadTireMat}>
              <ringGeometry
                args={[0.2, 0.3, 16, 1, Math.PI * hash, Math.PI * (1.5 + hash * 0.5)]}
              />
            </mesh>
            <mesh position={[0, 0, 0.012]} material={roadTireMat}>
              <ringGeometry args={[0.05, 0.4, 16, 1, Math.PI * (1 - hash), Math.PI * 1.5]} />
            </mesh>
            {hash > 0.4 && (
              <mesh
                position={[(hash - 0.5) * 0.2, (1 - hash - 0.5) * 0.2, 0.005]}
                rotation={[0, 0, hash * Math.PI]}
                geometry={roadPatch1Geo}
                material={roadWearMat}
              />
            )}
          </group>
        )}

        {connections === 2 && hash > 0.6 && (
          <mesh
            position={[0, 0, 0.01]}
            geometry={roadCrack1Geo}
            material={roadCrackMat}
            rotation={[0, 0, hash * Math.PI]}
          />
        )}

        {connections >= 2 && hash < 0.3 && (
          <group position={[0, 0, 0.012]} rotation={[0, 0, hash * -Math.PI]}>
            <mesh geometry={roadCrack2Geo} material={roadCrackMat} />
            <mesh
              position={[0.1, 0.1, 0]}
              rotation={[0, 0, Math.PI / 4]}
              geometry={roadCrack3Geo}
              material={roadCrackMat}
            />
          </group>
        )}

        {connections === 2 && hash > 0.7 && (
          <mesh
            position={[0, 0, 0.005]}
            rotation={[0, 0, hash * Math.PI * 2]}
            geometry={roadPatch2Geo}
            material={roadPatchMat}
          />
        )}

        {connections >= 3 && (
          <group rotation={[Math.PI / 2, 0, 0]}>
            <TrafficLight x={x} y={y} />
          </group>
        )}
      </group>
    );
  },
);
