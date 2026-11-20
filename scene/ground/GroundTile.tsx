import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { computeServiceCoverage } from '../../sim/services';
import { BuildingType, DataOverlayMode, Grid, TerrainType } from '../../types';
import { Tree } from '../buildings/BuildingParts';
import {
  boxGeo,
  coneGeo,
  getBasicMat,
  getHash,
  getStdMat,
  gridToWorld,
  groundTileGeo,
  heatmapOverlayMat,
  planeGeo,
  tmpColor,
} from '../shared';
import { RoadMarkings } from './RoadMarkings';

export const HeatmapOverlay: React.FC<{
  grid: Grid;
  mode: DataOverlayMode;
  disconnectedTiles: Set<string>;
}> = ({ grid, mode, disconnectedTiles }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current || mode === 'none') return;
    const gridSize = grid.length;

    const serviceCoverage =
      mode === 'services'
        ? computeServiceCoverage(grid, disconnectedTiles).tileCoverage
        : null;

    let idx = 0;
    const colors = new Float32Array(gridSize * gridSize * 3);

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = grid[y][x];
        const [wx, _wy, wz] = gridToWorld(x, y, gridSize);

        dummy.position.set(wx, -0.24, wz);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(0.96, 0.96, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);

        if (mode === 'population') {
          if (tile.buildingType === BuildingType.Residential) {
            const intensity = (tile.level || 1) / 3;
            tmpColor.setStyle(`hsl(208, 42%, ${66 - intensity * 26}%)`);
          } else {
            tmpColor.setStyle('#f1f0ec');
          }
        } else if (mode === 'income') {
          if (
            tile.buildingType === BuildingType.Commercial ||
            tile.buildingType === BuildingType.Industrial
          ) {
            const intensity = (tile.level || 1) / 3;
            tmpColor.setStyle(`hsl(136, 32%, ${60 - intensity * 24}%)`);
          } else {
            tmpColor.setStyle('#f1f0ec');
          }
        } else if (mode === 'happiness') {
          let minDst = 999;
          for (let py = 0; py < gridSize; py++) {
            for (let px = 0; px < gridSize; px++) {
              const pTile = grid[py][px];
              if (
                pTile.buildingType === BuildingType.Park ||
                pTile.buildingType === BuildingType.ParkFountain ||
                pTile.buildingType === BuildingType.ParkPlayground
              ) {
                const dst = Math.abs(px - x) + Math.abs(py - y);
                if (dst < minDst) minDst = dst;
              }
            }
          }
          if (minDst <= 5) {
            const intensity = 1 - minDst / 5;
            tmpColor.setStyle(`hsl(15, 65%, ${78 - intensity * 28}%)`);
          } else {
            tmpColor.setStyle('#f1f0ec');
          }
        } else if (mode === 'services' && serviceCoverage) {
          const score = serviceCoverage[y]?.[x] ?? 0;
          if (score > 0) {
            tmpColor.setStyle(`hsl(190, 48%, ${72 - score * 30}%)`);
          } else {
            tmpColor.setStyle('#f1f0ec');
          }
        } else {
          tmpColor.setStyle('#f1f0ec');
        }

        colors[idx * 3] = tmpColor.r;
        colors[idx * 3 + 1] = tmpColor.g;
        colors[idx * 3 + 2] = tmpColor.b;
        idx++;
      }
    }
    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [grid, mode, disconnectedTiles, dummy]);

  if (mode === 'none') return null;

  const gridSize = grid.length;
  return (
    <instancedMesh
      key={gridSize}
      ref={meshRef}
      args={[planeGeo, heatmapOverlayMat, gridSize * gridSize]}
      raycast={() => null}
    />
  );
};

interface GroundTileProps {
  type: BuildingType;
  terrain?: TerrainType;
  x: number;
  y: number;
  grid: Grid;
  weather: string;
  showEdges?: boolean;
  onHover: (x: number, y: number) => void;
  onLeave: () => void;
  onClick: (x: number, y: number) => void;
}

const FOREST_SPOTS: [number, number][] = [
  [-0.22, -0.18],
  [0.2, 0.16],
  [-0.14, 0.24],
];

export const GroundTile = React.memo(
  ({
    type,
    terrain = 'land',
    x,
    y,
    grid,
    weather,
    showEdges = true,
    onHover,
    onLeave,
    onClick,
  }: GroundTileProps) => {
    const gridSize = grid.length;
    const [wx, _wy, wz] = gridToWorld(x, y, gridSize);

    let color: string;
    let topY: number;
    const thickness = 0.5;

    const nearTypes = new Set<BuildingType>();
    if (type === BuildingType.None && terrain === 'land') {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const bType = grid[ny][nx].buildingType;
            if (bType !== BuildingType.None && bType !== BuildingType.Road) {
              nearTypes.add(bType);
            }
          }
        }
      }
    }

    const noise = getHash(x, y);
    if (type === BuildingType.None) {
      if (terrain === 'water') {
        color = weather === 'snowy' ? '#d8e4ec' : '#bfd4de';
        topY = -0.39;
      } else if (terrain === 'sand') {
        color = weather === 'snowy' ? '#e7eaee' : '#eee5d3';
        topY = -0.33;
      } else if (terrain === 'forest') {
        color = weather === 'snowy' ? '#e9eeec' : '#dce6d8';
        topY = -0.3;
      } else if (weather === 'snowy') {
        color = nearTypes.size > 0 ? '#eef1f4' : '#faf9f5';
        topY = nearTypes.size > 0 ? -0.3 : -0.3 - noise * 0.04;
      } else if (nearTypes.has(BuildingType.Industrial)) {
        color = noise > 0.5 ? '#dfddd6' : '#d6d4cd';
        topY = -0.3;
      } else if (
        nearTypes.has(BuildingType.Park) ||
        nearTypes.has(BuildingType.ParkFountain) ||
        nearTypes.has(BuildingType.ParkPlayground)
      ) {
        color = noise > 0.5 ? '#e5ece2' : '#dbe5d7';
        topY = -0.3;
      } else {
        color = noise > 0.5 ? '#f2f0ea' : '#eceae2';
        topY = nearTypes.size > 0 ? -0.3 : -0.3 - noise * 0.04;
      }
    } else if (type === BuildingType.Road) {
      const hasUp = y > 0 && grid[y - 1][x].buildingType === BuildingType.Road;
      const hasDown =
        y < gridSize - 1 && grid[y + 1][x].buildingType === BuildingType.Road;
      const hasLeft = x > 0 && grid[y][x - 1].buildingType === BuildingType.Road;
      const hasRight =
        x < gridSize - 1 && grid[y][x + 1].buildingType === BuildingType.Road;
      const connections = [hasUp, hasDown, hasLeft, hasRight].filter(Boolean).length;

      let baseColor = weather === 'snowy' ? '#a6a49d' : '#3d3c39';
      if (connections <= 1) {
        baseColor = weather === 'snowy' ? '#b8b6af' : '#4a4945';
      } else if (connections >= 3) {
        baseColor = weather === 'snowy' ? '#8f8d85' : '#2c2b29';
      }
      color = baseColor;
      topY = -0.29;
    } else {
      color = weather === 'snowy' ? '#f5f4f0' : '#e7e5de';
      topY = -0.28;
    }

    const centerY = topY - thickness / 2;
    const isForest = type === BuildingType.None && terrain === 'forest';
    const treeCount = isForest ? 2 + (noise > 0.45 ? 1 : 0) : 0;

    return (
      <mesh
        position={[wx, centerY, wz]}
        scale={showEdges && type !== BuildingType.Road && terrain !== 'water' ? [0.97, 1, 0.97] : [1, 1, 1]}
        geometry={groundTileGeo}
        material={getStdMat(color, {
          flatShading: true,
          roughness: terrain === 'water' ? 0.35 : 0.96,
        })}
        receiveShadow
        castShadow
        onPointerEnter={(e) => {
          e.stopPropagation();
          onHover(x, y);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onLeave();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.button === 0) onClick(x, y);
        }}
      >
        {type === BuildingType.Road && (
          <RoadMarkings x={x} y={y} grid={grid} yOffset={thickness / 2 + 0.001} />
        )}
        {isForest && (
          <group position={[0, thickness / 2, 0]} raycast={() => null}>
            {FOREST_SPOTS.slice(0, treeCount).map(([fx, fz], idx) => (
              <group key={idx} position={[fx, 0, fz]}>
                <Tree
                  x={x}
                  y={y}
                  i={idx}
                  scale={0.6 + getHash(x + idx, y) * 0.35}
                  treeColor={idx % 2 === 0 ? '#5f8564' : '#7b9e7e'}
                  isSphere={idx === 2}
                  weather={weather}
                />
              </group>
            ))}
          </group>
        )}
      </mesh>
    );
  },
);

export const Cursor: React.FC<{
  x: number;
  y: number;
  color: string;
  gridSize?: number;
}> = ({ x, y, color, gridSize }) => {
  const [wx, _wy, wz] = gridToWorld(x, y, gridSize);
  return (
    <mesh
      position={[wx, -0.25, wz]}
      rotation={[-Math.PI / 2, 0, 0]}
      geometry={planeGeo}
      material={getBasicMat(color, {
        transparent: true,
        opacity: 0.35,
        depthTest: false,
        doubleSide: true,
      })}
      raycast={() => null}
    >
      <Outlines thickness={0.05} color="#141413" />
    </mesh>
  );
};

export const DisconnectedBadge: React.FC<{
  x: number;
  y: number;
  gridSize?: number;
}> = ({ x, y, gridSize }) => {
  const ref = useRef<THREE.Group>(null);
  const [wx, _wy, wz] = gridToWorld(x, y, gridSize);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y =
      1.6 + Math.sin(state.clock.elapsedTime * 4 + x + y) * 0.08;
    ref.current.rotation.y = state.clock.elapsedTime * 2;
  });

  return (
    <group ref={ref} position={[wx, 1.6, wz]}>
      <mesh
        geometry={coneGeo}
        material={getBasicMat('#c44536')}
        scale={[0.12, 0.24, 0.12]}
        rotation={[Math.PI, 0, 0]}
      />
      <mesh
        geometry={boxGeo}
        material={getBasicMat('#faf9f5')}
        position={[0, 0.22, 0]}
        scale={[0.07, 0.07, 0.07]}
      />
    </group>
  );
};
