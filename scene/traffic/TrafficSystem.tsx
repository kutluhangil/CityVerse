import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { RAIN_TRAFFIC_SPEED_MULTIPLIER } from '../../sim/economy';
import { BuildingType, Grid } from '../../types';
import {
  cylinderGeo,
  getRandomRange,
  gridToWorld,
  headlightMaterial,
  sphereGeo,
  streetLampMaterial,
} from '../shared';

const carBodyGeo = new THREE.BoxGeometry(0.46, 0.12, 0.26);
carBodyGeo.translate(0, 0.06, 0);

const carCabinGeo = new THREE.BoxGeometry(0.24, 0.11, 0.22);
carCabinGeo.translate(-0.04, 0.175, 0);

const cargoGeo = new THREE.BoxGeometry(0.32, 0.16, 0.25);
cargoGeo.translate(-0.1, 0.16, 0);

const headlightGeo = new THREE.BoxGeometry(0.2, 0.03, 0.22);
headlightGeo.translate(0.32, 0.065, 0);

const wheelGeoBase = new THREE.CylinderGeometry(0.055, 0.055, 0.055, 10);
wheelGeoBase.rotateX(Math.PI / 2);
const wheel1Geo = wheelGeoBase.clone();
wheel1Geo.translate(0.14, 0.055, 0.14);
const wheel2Geo = wheelGeoBase.clone();
wheel2Geo.translate(-0.14, 0.055, 0.14);
const wheel3Geo = wheelGeoBase.clone();
wheel3Geo.translate(0.14, 0.055, -0.14);
const wheel4Geo = wheelGeoBase.clone();
wheel4Geo.translate(-0.14, 0.055, -0.14);

const carColors = [
  '#d97757',
  '#3d3c39',
  '#faf9f5',
  '#5a7a63',
  '#87867f',
  '#c89b54',
];

export const TrafficSystem: React.FC<{
  grid: Grid;
  maxCars: number;
  weather: string;
}> = ({ grid, maxCars, weather }) => {
  const roadTilesMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; neighbors: number }>();
    grid.forEach((row) =>
      row.forEach((tile) => {
        if (tile.buildingType === BuildingType.Road) {
          map.set(`${tile.x},${tile.y}`, {
            x: tile.x,
            y: tile.y,
            neighbors: 0,
          });
        }
      }),
    );
    map.forEach((v) => {
      let c = 0;
      if (map.has(`${v.x + 1},${v.y}`)) c++;
      if (map.has(`${v.x - 1},${v.y}`)) c++;
      if (map.has(`${v.x},${v.y + 1}`)) c++;
      if (map.has(`${v.x},${v.y - 1}`)) c++;
      v.neighbors = c;
    });
    return map;
  }, [grid]);

  const roadTiles = useMemo(
    () => Array.from(roadTilesMap.values()),
    [roadTilesMap],
  );

  const carCount = Math.min(roadTiles.length, maxCars);
  const carsRef = useRef<THREE.InstancedMesh>(null);
  const cabinRef = useRef<THREE.InstancedMesh>(null);
  const cargoRef = useRef<THREE.InstancedMesh>(null);
  const headlightsRef = useRef<THREE.InstancedMesh>(null);
  const w1Ref = useRef<THREE.InstancedMesh>(null);
  const w2Ref = useRef<THREE.InstancedMesh>(null);
  const w3Ref = useRef<THREE.InstancedMesh>(null);
  const w4Ref = useRef<THREE.InstancedMesh>(null);
  const carsState = useRef<Float32Array>(new Float32Array(0));
  const vehicleTypes = useRef<Uint8Array>(new Uint8Array(0));
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const lampPolesRef = useRef<THREE.InstancedMesh>(null);
  const lampBulbsRef = useRef<THREE.InstancedMesh>(null);
  const lampCount = roadTiles.length * 2;

  useEffect(() => {
    if (roadTiles.length < 2) return;
    carsState.current = new Float32Array(carCount * 6);
    vehicleTypes.current = new Uint8Array(carCount);
    const newColors = new Float32Array(carCount * 3);

    for (let i = 0; i < carCount; i++) {
      const startNode =
        roadTiles[Math.floor(Math.random() * roadTiles.length)];
      const roll = Math.random();
      const vType = roll < 0.2 ? 1 : roll < 0.4 ? 2 : 0; // 0: sedan, 1: bus, 2: truck
      vehicleTypes.current[i] = vType;

      carsState.current[i * 6 + 0] = startNode.x;
      carsState.current[i * 6 + 1] = startNode.y;
      carsState.current[i * 6 + 2] = startNode.x;
      carsState.current[i * 6 + 3] = startNode.y;
      carsState.current[i * 6 + 4] = 1;
      carsState.current[i * 6 + 5] =
        vType === 0 ? getRandomRange(0.006, 0.012) : getRandomRange(0.0045, 0.0085);

      const hex =
        vType === 1
          ? '#d97757'
          : vType === 2
            ? '#eae6dc'
            : carColors[Math.floor(Math.random() * carColors.length)];
      const color = new THREE.Color(hex);
      newColors[i * 3] = color.r;
      newColors[i * 3 + 1] = color.g;
      newColors[i * 3 + 2] = color.b;
    }

    if (carsRef.current) {
      carsRef.current.instanceColor = new THREE.InstancedBufferAttribute(
        newColors,
        3,
      );
    }

    if (lampPolesRef.current && lampBulbsRef.current) {
      let lampIdx = 0;
      const bulbColors = new Float32Array(lampCount * 3);
      roadTiles.forEach((tile) => {
        const [wx, _wy, wz] = gridToWorld(tile.x, tile.y, grid.length);

        dummy.position.set(wx - 0.4, -0.3 + 0.25, wz - 0.4);
        dummy.scale.set(0.02, 0.5, 0.02);
        dummy.updateMatrix();
        lampPolesRef.current!.setMatrixAt(lampIdx, dummy.matrix);
        dummy.position.set(wx - 0.37, -0.3 + 0.5, wz - 0.37);
        dummy.scale.set(0.06, 0.06, 0.06);
        dummy.updateMatrix();
        lampBulbsRef.current!.setMatrixAt(lampIdx, dummy.matrix);
        bulbColors[lampIdx * 3] = 1;
        bulbColors[lampIdx * 3 + 1] = 0.9;
        bulbColors[lampIdx * 3 + 2] = 0.65;
        lampIdx++;

        dummy.position.set(wx + 0.4, -0.3 + 0.25, wz + 0.4);
        dummy.scale.set(0.02, 0.5, 0.02);
        dummy.updateMatrix();
        lampPolesRef.current!.setMatrixAt(lampIdx, dummy.matrix);
        dummy.position.set(wx + 0.37, -0.3 + 0.5, wz + 0.37);
        dummy.scale.set(0.06, 0.06, 0.06);
        dummy.updateMatrix();
        lampBulbsRef.current!.setMatrixAt(lampIdx, dummy.matrix);
        bulbColors[lampIdx * 3] = 1;
        bulbColors[lampIdx * 3 + 1] = 0.9;
        bulbColors[lampIdx * 3 + 2] = 0.65;
        lampIdx++;
      });
      lampPolesRef.current.instanceMatrix.needsUpdate = true;
      lampBulbsRef.current.instanceMatrix.needsUpdate = true;
      lampBulbsRef.current.instanceColor = new THREE.InstancedBufferAttribute(
        bulbColors,
        3,
      );
    }
  }, [roadTiles, carCount, dummy, lampCount, grid.length]);

  useFrame((state) => {
    if (
      !carsRef.current ||
      roadTiles.length < 2 ||
      carsState.current.length === 0
    ) {
      return;
    }
    const time = state.clock.elapsedTime;

    for (let i = 0; i < carCount; i++) {
      const idx = i * 6;
      let curX = carsState.current[idx];
      let curY = carsState.current[idx + 1];
      let tarX = carsState.current[idx + 2];
      let tarY = carsState.current[idx + 3];
      let progress = carsState.current[idx + 4];
      const speed = carsState.current[idx + 5];

      const dx = tarX - curX;
      const movingAxis = dx !== 0 ? 'X' : 'Y';
      const tarNode = roadTilesMap.get(`${tarX},${tarY}`);
      if (!tarNode) progress = 1;

      const isNextIntersection = tarNode && tarNode.neighbors >= 3;
      const trafficCycleTime = (time / 4 + tarX + tarY) % 2;
      let trafficState = 'Red';
      if (movingAxis === 'X') {
        if (trafficCycleTime < 0.8) trafficState = 'Green';
        else if (trafficCycleTime < 1.0) trafficState = 'Yellow';
      } else {
        if (trafficCycleTime >= 1.0 && trafficCycleTime < 1.8)
          trafficState = 'Green';
        else if (trafficCycleTime >= 1.8) trafficState = 'Yellow';
      }

      let canMove = true;
      let currentSpeed =
        speed * (weather === 'rainy' ? RAIN_TRAFFIC_SPEED_MULTIPLIER : 1);

      if (isNextIntersection && progress > 0.4 && trafficState === 'Yellow') {
        currentSpeed *= 0.5;
      }

      if (isNextIntersection && progress > 0.6 && progress <= 1.0) {
        if (
          trafficState === 'Red' ||
          (trafficState === 'Yellow' && progress < 0.8)
        ) {
          canMove = false;
          carsState.current[idx + 4] = Math.min(progress, 0.6);
        }
      }

      for (let j = 0; j < carCount; j++) {
        if (i === j) continue;
        const jIdx = j * 6;
        if (
          carsState.current[jIdx + 2] === tarX &&
          carsState.current[jIdx + 3] === tarY &&
          carsState.current[jIdx + 4] > progress &&
          carsState.current[jIdx + 4] - progress < 0.3
        ) {
          currentSpeed *= 0.2;
          break;
        }
      }

      if (canMove && tarNode) progress += currentSpeed;

      if (progress >= 1) {
        const prevDx = tarX - curX !== 0 ? Math.sign(tarX - curX) : 0;
        const prevDy = tarY - curY !== 0 ? Math.sign(tarY - curY) : 0;

        curX = tarNode ? tarX : Math.round(curX);
        curY = tarNode ? tarY : Math.round(curY);
        progress = 0;

        const possibleNext = [
          roadTilesMap.get(`${curX + 1},${curY}`),
          roadTilesMap.get(`${curX - 1},${curY}`),
          roadTilesMap.get(`${curX},${curY + 1}`),
          roadTilesMap.get(`${curX},${curY - 1}`),
        ].filter(Boolean) as { x: number; y: number; neighbors: number }[];

        if (possibleNext.length > 0) {
          let valid = possibleNext.filter(
            (n) =>
              Math.sign(n.x - curX) !== -prevDx ||
              Math.sign(n.y - curY) !== -prevDy,
          );
          if (valid.length === 0) valid = possibleNext;
          const better = valid.filter((n) => n.neighbors > 1);
          const choices = better.length > 0 ? better : valid;
          const straight = choices.find(
            (n) =>
              Math.sign(n.x - curX) === prevDx &&
              Math.sign(n.y - curY) === prevDy,
          );
          const next =
            straight && Math.random() > 0.4
              ? straight
              : choices[Math.floor(Math.random() * choices.length)];
          tarX = next.x;
          tarY = next.y;
        } else {
          const rnd = roadTiles[Math.floor(Math.random() * roadTiles.length)];
          curX = rnd.x;
          curY = rnd.y;
          tarX = rnd.x;
          tarY = rnd.y;
        }
      }

      carsState.current[idx] = curX;
      carsState.current[idx + 1] = curY;
      carsState.current[idx + 2] = tarX;
      carsState.current[idx + 3] = tarY;
      if (canMove) carsState.current[idx + 4] = progress;

      const gx = MathUtils.lerp(curX, tarX, progress);
      const gy = MathUtils.lerp(curY, tarY, progress);
      const currentDx = tarX - curX;
      const currentDy = tarY - curY;
      const angle = Math.atan2(currentDy, currentDx);

      const snowDrift =
        weather === 'snowy' ? Math.cos(time * 3 + i) * 0.08 : 0;
      const laneSway = isNextIntersection
        ? 0
        : Math.sin(time * 2 + i) * 0.04 + snowDrift;
      const offsetAmt = 0.15 + laneSway;
      const len =
        Math.sqrt(currentDx * currentDx + currentDy * currentDy) || 1;
      const offX = (-currentDy / len) * offsetAmt;
      const offY = (currentDx / len) * offsetAmt;
      const [wx, _wy, wz] = gridToWorld(gx + offX, gy + offY, grid.length);

      const vType = vehicleTypes.current[i] ?? 0;

      dummy.position.set(wx, -0.3, wz);
      dummy.rotation.set(0, -angle, 0);
      dummy.scale.set(
        vType === 1 ? 1.32 : vType === 2 ? 1.15 : 1,
        vType === 1 ? 1.55 : 1,
        1,
      );
      dummy.updateMatrix();
      carsRef.current.setMatrixAt(i, dummy.matrix);

      dummy.scale.set(
        vType === 1 ? 1.25 : vType === 2 ? 0.72 : 1,
        vType === 1 ? 1.45 : vType === 2 ? 1.2 : 1,
        1,
      );
      dummy.updateMatrix();
      cabinRef.current?.setMatrixAt(i, dummy.matrix);

      if (vType === 2) {
        dummy.scale.set(1.05, 1.2, 1.04);
      } else {
        dummy.scale.set(0, 0, 0);
      }
      dummy.updateMatrix();
      cargoRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      headlightsRef.current?.setMatrixAt(i, dummy.matrix);
      w1Ref.current?.setMatrixAt(i, dummy.matrix);
      w2Ref.current?.setMatrixAt(i, dummy.matrix);
      w3Ref.current?.setMatrixAt(i, dummy.matrix);
      w4Ref.current?.setMatrixAt(i, dummy.matrix);
    }

    carsRef.current.instanceMatrix.needsUpdate = true;
    if (cabinRef.current) cabinRef.current.instanceMatrix.needsUpdate = true;
    if (cargoRef.current) cargoRef.current.instanceMatrix.needsUpdate = true;
    if (headlightsRef.current) headlightsRef.current.instanceMatrix.needsUpdate = true;
    if (w1Ref.current) w1Ref.current.instanceMatrix.needsUpdate = true;
    if (w2Ref.current) w2Ref.current.instanceMatrix.needsUpdate = true;
    if (w3Ref.current) w3Ref.current.instanceMatrix.needsUpdate = true;
    if (w4Ref.current) w4Ref.current.instanceMatrix.needsUpdate = true;
  });

  if (roadTiles.length < 2) return null;

  return (
    <group>
      <instancedMesh ref={carsRef} args={[carBodyGeo, undefined, carCount]} castShadow>
        <meshStandardMaterial roughness={0.85} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={cabinRef} args={[carCabinGeo, undefined, carCount]} castShadow>
        <meshStandardMaterial color="#262523" roughness={0.5} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={cargoRef} args={[cargoGeo, undefined, carCount]} castShadow>
        <meshStandardMaterial color="#faf9f5" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={headlightsRef} args={[headlightGeo, undefined, carCount]}>
        <primitive object={headlightMaterial} attach="material" />
      </instancedMesh>
      <instancedMesh ref={w1Ref} args={[wheel1Geo, undefined, carCount]} castShadow>
        <meshStandardMaterial color="#141413" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={w2Ref} args={[wheel2Geo, undefined, carCount]} castShadow>
        <meshStandardMaterial color="#141413" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={w3Ref} args={[wheel3Geo, undefined, carCount]} castShadow>
        <meshStandardMaterial color="#141413" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={w4Ref} args={[wheel4Geo, undefined, carCount]} castShadow>
        <meshStandardMaterial color="#141413" roughness={0.9} />
      </instancedMesh>
      {lampCount > 0 && (
        <group>
          <instancedMesh ref={lampPolesRef} args={[cylinderGeo, undefined, lampCount]} castShadow>
            <meshStandardMaterial color="#52514e" roughness={0.9} metalness={0.1} />
          </instancedMesh>
          <instancedMesh ref={lampBulbsRef} args={[sphereGeo, undefined, lampCount]}>
            <primitive object={streetLampMaterial} attach="material" />
          </instancedMesh>
        </group>
      )}
    </group>
  );
};
