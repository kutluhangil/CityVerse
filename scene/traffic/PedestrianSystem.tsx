import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingType, Grid } from '../../types';
import { gridToWorld, pedBaseMat, pedBoxGeo, tmpColor } from '../shared';

const PED_PALETTE = [
  '#141413',
  '#52514e',
  '#d97757',
  '#4d7c5a',
  '#b5573a',
  '#6e7f8d',
];

const getSidewalkOffset = (
  isRoad: boolean,
  sidewalkSign: number,
  axisSeed: number,
): [number, number] => {
  if (!isRoad) {
    return [(Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7];
  }
  const curb = 0.4 * sidewalkSign;
  const along = (Math.random() - 0.5) * 0.75;
  return axisSeed % 2 === 0 ? [along, curb] : [curb, along];
};

export const PedestrianSystem: React.FC<{ grid: Grid; maxPeds: number }> = ({
  grid,
  maxPeds,
}) => {
  const { walkableList, walkableSet } = useMemo(() => {
    const list: { x: number; y: number; isRoad: boolean }[] = [];
    const set = new Set<string>();
    grid.forEach((row, y) =>
      row.forEach((tile, x) => {
        const isRoad = tile.buildingType === BuildingType.Road;
        if (
          isRoad ||
          tile.buildingType === BuildingType.Park ||
          tile.buildingType === BuildingType.ParkPlayground ||
          tile.buildingType === BuildingType.ParkFountain
        ) {
          list.push({ x, y, isRoad });
          set.add(`${x},${y}`);
        }
      }),
    );
    return { walkableList: list, walkableSet: set };
  }, [grid]);

  const peds = useMemo(() => {
    if (walkableList.length === 0) return [];
    const size = grid.length;
    return Array.from({ length: maxPeds }).map((_, idx) => {
      const start = walkableList[Math.floor(Math.random() * walkableList.length)];
      const [wx, _wy, wz] = gridToWorld(start.x, start.y, size);
      const sidewalkSign = idx % 2 === 0 ? 1 : -1;
      const [ox, oz] = getSidewalkOffset(start.isRoad, sidewalkSign, idx);
      return {
        id: Math.random(),
        gx: start.x,
        gy: start.y,
        sidewalkSign,
        axisSeed: idx,
        x: wx + ox,
        z: wz + oz,
        targetX: wx + ox,
        targetZ: wz + oz,
        speed: 0.25 + Math.random() * 0.25,
        color: PED_PALETTE[Math.floor(Math.random() * PED_PALETTE.length)],
      };
    });
  }, [walkableList, maxPeds, grid.length]);

  const instancesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!instancesRef.current || peds.length === 0) return;
    peds.forEach((ped, i) => {
      instancesRef.current!.setColorAt(i, tmpColor.set(ped.color));
    });
    if (instancesRef.current.instanceColor) {
      instancesRef.current.instanceColor.needsUpdate = true;
    }
  }, [peds]);

  useFrame((state, delta) => {
    if (!instancesRef.current || peds.length === 0) return;
    peds.forEach((ped, i) => {
      const dx = ped.targetX - ped.x;
      const dz = ped.targetZ - ped.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 0.05) {
        const candidates = [
          { x: ped.gx + 1, y: ped.gy },
          { x: ped.gx - 1, y: ped.gy },
          { x: ped.gx, y: ped.gy + 1 },
          { x: ped.gx, y: ped.gy - 1 },
        ].filter((n) => walkableSet.has(`${n.x},${n.y}`));
        const nextTile =
          candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : { x: ped.gx, y: ped.gy };
        const movedAlongX = nextTile.x !== ped.gx;
        const movedAlongZ = nextTile.y !== ped.gy;
        ped.gx = nextTile.x;
        ped.gy = nextTile.y;
        const isRoad =
          grid[nextTile.y]?.[nextTile.x]?.buildingType === BuildingType.Road;
        if (movedAlongX) ped.axisSeed = 0;
        else if (movedAlongZ) ped.axisSeed = 1;

        const [nwx, _nwy, nwz] = gridToWorld(
          nextTile.x,
          nextTile.y,
          grid.length,
        );
        const [ox, oz] = getSidewalkOffset(
          isRoad,
          ped.sidewalkSign,
          ped.axisSeed,
        );
        ped.targetX = nwx + ox;
        ped.targetZ = nwz + oz;
      } else {
        ped.x += (dx / dist) * ped.speed * delta;
        ped.z += (dz / dist) * ped.speed * delta;
      }

      dummy.position.set(
        ped.x,
        -0.2 + Math.abs(Math.sin(state.clock.elapsedTime * 10 + i)) * 0.04,
        ped.z,
      );
      dummy.rotation.y = Math.atan2(dx, dz);
      dummy.updateMatrix();
      instancesRef.current!.setMatrixAt(i, dummy.matrix);
    });
    instancesRef.current.instanceMatrix.needsUpdate = true;
  });

  if (peds.length === 0) return null;
  return (
    <instancedMesh
      ref={instancesRef}
      args={[pedBoxGeo, pedBaseMat, peds.length]}
      castShadow
      raycast={() => null}
    />
  );
};
