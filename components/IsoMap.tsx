/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { MapControls, Environment, SoftShadows, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { Grid, BuildingType, TileData } from '../types';
import { GRID_SIZE, BUILDINGS } from '../constants';

// Fix for TypeScript not recognizing R3F elements in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}

// --- Constants & Helpers ---
const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
const gridToWorld = (x: number, y: number) => [x - WORLD_OFFSET, 0, y - WORLD_OFFSET] as [number, number, number];

// Deterministic random based on coordinates
const getHash = (x: number, y: number) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
const getRandomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Shared Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const coneGeo = new THREE.ConeGeometry(1, 1, 4);
const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

// --- 1. Advanced Procedural Buildings ---

const windowMaterial = new THREE.MeshStandardMaterial({ color: "#bfdbfe", emissive: "#bfdbfe", emissiveIntensity: 0.2, roughness: 0.1, metalness: 0.8 });
const streetLampMaterial = new THREE.MeshStandardMaterial({ color: "#fbbf24", emissive: "#fbbf24", emissiveIntensity: 0.0, roughness: 0.1 });

const WindowBlock = React.memo(({ position, scale }: { position: [number, number, number], scale: [number, number, number] }) => (
  <mesh geometry={boxGeo} position={position} scale={scale} material={windowMaterial} />
));

const SmokeStack = ({ position }: { position: [number, number, number] }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const cloud = child as THREE.Mesh;
        cloud.position.y += 0.01 + i * 0.005;
        cloud.scale.addScalar(0.005);
        
        const material = cloud.material as THREE.MeshStandardMaterial;
        if (material) {
          material.opacity -= 0.005;
          if (cloud.position.y > 1.5) {
            cloud.position.y = 0;
            cloud.scale.setScalar(0.1 + Math.random() * 0.1);
            material.opacity = 0.6;
          }
        }
      });
    }
  });

  return (
    <group position={position}>
      <mesh geometry={cylinderGeo} castShadow receiveShadow position={[0, 0.5, 0]} scale={[0.2, 1, 0.2]}>
        <meshStandardMaterial color="#4b5563" />
      </mesh>
      <group ref={ref} position={[0, 1, 0]}>
        {[0, 1, 2].map(i => (
          <mesh key={i} geometry={sphereGeo} position={[Math.random()*0.1, i*0.4, Math.random()*0.1]} scale={0.2}>
            <meshStandardMaterial color="#d1d5db" transparent opacity={0.6} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
};

interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
  level?: number;
}

// Material Cache to massively reduce draw calls and memory overhead
const materialCache: Record<string, THREE.MeshStandardMaterial> = {};

const getCachedMaterial = (baseColor: string, hash: number, type: 'main' | 'accent' | 'roof', opacity: number, transparent: boolean) => {
    // Quantize hash to 5 buckets to limit permutations
    const bucket = Math.floor(hash * 5);
    const key = `${baseColor}-${bucket}-${type}-${opacity}-${transparent}`;
    
    if (!materialCache[key]) {
        const c = new THREE.Color(baseColor);
        c.offsetHSL(bucket * 0.02 - 0.05, 0, bucket * 0.04 - 0.1);
        
        let matColor = c;
        if (type === 'accent') matColor = new THREE.Color(c).multiplyScalar(0.7);
        if (type === 'roof') matColor = new THREE.Color(c).multiplyScalar(0.5).offsetHSL(0,0,-0.1);
        
        materialCache[key] = new THREE.MeshStandardMaterial({
            color: matColor,
            flatShading: true,
            opacity,
            transparent,
            roughness: 0.8
        });
    }
    return materialCache[key];
};

const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, level = 1 }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100); // 0-99
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  const mainMat = getCachedMaterial(baseColor, hash, 'main', opacity, transparent);
  const accentMat = getCachedMaterial(baseColor, hash, 'accent', opacity, transparent);
  const roofMat = getCachedMaterial(baseColor, hash, 'roof', opacity, transparent);

  const commonProps = { castShadow: true, receiveShadow: true };

  // Buildings are built assuming y=0 is ground level within their group
  // Adjust vertical position to sit on top of ground tile (approx -0.3)
  const yOffset = -0.3;

  return (
    <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {(() => {
        switch (type) {
          case BuildingType.Residential:
            if (variant < 33) {
              // Cozy Cottage
              const hasChimney = hash > 0.5;
              const rndRoofMat = hash > 0.3 ? roofMat : new THREE.MeshStandardMaterial({color: '#713f12', flatShading: true, opacity, transparent});
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.3 * level, 0]} scale={[0.7, 0.6 * level, 0.6]} />
                  <mesh {...commonProps} material={rndRoofMat} geometry={coneGeo} position={[0, 0.75 * level, 0]} scale={[0.6, 0.4, 0.6]} rotation={[0, Math.PI/4, 0]} />
                  {hasChimney && <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#7f1d1d', opacity, transparent})} geometry={boxGeo} position={[0.2, 0.6 * level, 0]} scale={[0.1, 0.4, 0.1]} />}
                  {Array.from({length: level}).map((_, i) => (
                    <React.Fragment key={i}>
                       <WindowBlock position={[0.2, 0.3 * (i+1), 0.31]} scale={[0.15, 0.2, 0.05]} />
                       <WindowBlock position={[-0.2, 0.3 * (i+1), 0.31]} scale={[0.15, 0.2, 0.05]} />
                    </React.Fragment>
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.1, 0.32]} scale={[0.15, 0.2, 0.05]} />
                </>
              );
            } else if (variant < 66) {
              // Modern Boxy
              const secondaryColor = hash > 0.5 ? accentMat : new THREE.MeshStandardMaterial({color: '#374151', flatShading:true, opacity, transparent});
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.1, 0.35 * level, 0]} scale={[0.6, 0.7 * level, 0.8]} />
                  <mesh {...commonProps} material={secondaryColor} geometry={boxGeo} position={[0.25, 0.25 * level, 0.1]} scale={[0.4, 0.5 * level, 0.6]} />
                  {Array.from({length: level}).map((_, i) => (
                    <React.Fragment key={i}>
                       <WindowBlock position={[-0.1, 0.5 * (i+1), 0.41]} scale={[0.4, 0.2, 0.05]} />
                       {hash > 0.7 && <WindowBlock position={[0.25, 0.3 * (i+1), 0.41]} scale={[0.2, 0.2, 0.05]} />}
                    </React.Fragment>
                  ))}
                </>
              );
            } else {
              // Townhouse
              const stories = (1 + Math.floor(hash * 2.5)) * level; // scale stories by level
              const height = 0.5 + stories * 0.4;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, height/2, 0]} scale={[0.5, height, 0.6]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, height + 0.05, 0]} scale={[0.55, 0.1, 0.65]} />
                  {Array.from({length: stories}).map((_, i) => (
                    <React.Fragment key={i}>
                        <WindowBlock position={[0, 0.25 + i * 0.4, 0.31]} scale={[0.3, 0.2, 0.05]} />
                        {i > 0 && hash > 0.4 && (
                            <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.15 + i * 0.4, 0.35]} scale={[0.4, 0.05, 0.15]} />
                        )}
                        {/* More detailed balconies */}
                        {i > 0 && hash <= 0.4 && (
                             <group position={[0, 0.15 + i * 0.4, 0.35]}>
                                 <mesh {...commonProps} material={secondaryColor} geometry={boxGeo} scale={[0.3, 0.02, 0.1]} />
                                 <mesh {...commonProps} material={secondaryColor} geometry={boxGeo} position={[-0.14, 0.05, 0]} scale={[0.02, 0.1, 0.1]} />
                                 <mesh {...commonProps} material={secondaryColor} geometry={boxGeo} position={[0.14, 0.05, 0]} scale={[0.02, 0.1, 0.1]} />
                                 <mesh {...commonProps} material={secondaryColor} geometry={boxGeo} position={[0, 0.05, 0.04]} scale={[0.3, 0.1, 0.02]} />
                             </group>
                        )}
                    </React.Fragment>
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, 0.1, 0.32]} scale={[0.15, 0.2, 0.05]} />
                </>
              );
            }

          case BuildingType.Commercial:
            if (variant < 40) {
              // High-rise
              const height = (1.5 + hash * 2.5) * level;
              const hasAntenna = hash > 0.6;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, height/2, 0]} scale={[0.7, height, 0.7]} />
                  {Array.from({ length: Math.floor(height * 2.5) }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.4, 0]} scale={[0.72, 0.2, 0.72]} />
                  ))}
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, height + 0.1, 0]} scale={[0.5, 0.2, 0.5]} />
                  {hasAntenna && <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#9ca3af', opacity, transparent})} geometry={cylinderGeo} position={[0, height + 0.5, 0]} scale={[0.02, 0.8, 0.02]} />}
                </>
              );
            } else if (variant < 70) {
              // Shop
              const awningColor = hash > 0.6 ? '#ef4444' : (hash > 0.3 ? '#f59e0b' : '#3b82f6');
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4 * level, 0]} scale={[0.9, 0.8 * level, 0.8]} />
                  {Array.from({length: level}).map((_, i) => (
                     <WindowBlock key={i} position={[0, 0.3 + (i * 0.8), 0.41]} scale={[0.8, 0.4, 0.05]} />
                  ))}
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: awningColor, opacity, transparent })} geometry={boxGeo} position={[0, 0.55 * level, 0.5]} scale={[0.9, 0.1, 0.2]} rotation={[Math.PI/6, 0, 0]} />
                </>
              );
            } else {
              // Corner store
               return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.5 * level, -0.2]} scale={[0.5, 1 * level, 0.5]} />
                  <mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0.1, 0.3 * level, 0.1]} scale={[0.7, 0.6 * level, 0.7]} />
                  {Array.from({length: level}).map((_, i) => (
                      <WindowBlock key={i} position={[0.1, 0.3 + (i*0.6), 0.46]} scale={[0.6, 0.3, 0.05]} />
                  ))}
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: hash > 0.5 ? '#9ca3af' : '#fbbf24', opacity, transparent})} geometry={boxGeo} position={[0.2, 0.65 * level, 0.2]} scale={[0.2, 0.15, 0.2]} />
                </>
               )
            }

          case BuildingType.Industrial:
            if (variant < 50) {
              // Factory
              const stackCount = hash > 0.7 ? 2 : 1;
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[0, 0.4 * level, 0]} scale={[0.9, 0.8 * level, 0.8]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[-0.2, 0.9 * level, 0]} scale={[0.4, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.2, 0.9 * level, 0]} scale={[0.4, 0.2, 0.8]} rotation={[0,0,Math.PI/4]} />
                  <SmokeStack position={[0.3, 0.4 * level, 0.3]} />
                  {stackCount > 1 && <SmokeStack position={[0.3, 0.4 * level, -0.2]} />}
                  {Array.from({length: level}).map((_, i) => (
                      <WindowBlock key={i} position={[0, 0.3 + (i*0.6), 0.41]} scale={[0.3, 0.2, 0.05]} />
                  ))}
                </>
              );
            } else {
              // Warehouse
              return (
                <>
                  <mesh {...commonProps} material={mainMat} geometry={boxGeo} position={[-0.2, 0.3 * level, 0]} scale={[0.5, 0.6 * level, 0.9]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.4 * level, -0.2]} scale={[0.2, 0.8 * level, 0.2]} />
                  <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.25, 0.4 * level, 0.25]} scale={[0.2, 0.8 * level, 0.2]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: hash > 0.5 ? '#6b7280' : '#4b5563', opacity, transparent})} geometry={boxGeo} position={[0.25, 0.7 * level, 0]} scale={[0.05, 0.05, 0.5]} />
                  {hash > 0.3 && <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#eab308', opacity, transparent})} geometry={boxGeo} position={[-0.46, 0.15 * level, 0]} scale={[0.05, 0.2 * level, 0.3]} />}
                </>
              );
            }

          case BuildingType.Park:
            const treeCount = 1 + Math.floor(hash * 3);
            const positions = [[-0.2, -0.2], [0.2, 0.2], [-0.2, 0.2], [0.2, -0.2]];
            
            return (
              <group position={[0, -yOffset - 0.29, 0]}> {/* Adjust park base to sit exactly on top of ground tile */}
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.9, 0.9]} />
                    <meshStandardMaterial color="#86efac" />
                </mesh>
                
                {Array.from({length: treeCount}).map((_, i) => {
                    const pos = positions[i % positions.length];
                    const scale = 0.5 + getHash(x+i, y-i) * 0.5;
                    const treeColor = new THREE.Color("#166534").offsetHSL(0, 0, getHash(x,y+i)*0.2);
                    return (
                    <group key={i} position={[pos[0], 0, pos[1]]} scale={scale} rotation={[0, getHash(i,x)*Math.PI, 0]}>
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.4, 0.5, 0.4]} />
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={coneGeo} position={[0, 0.65, 0]} scale={[0.3, 0.4, 0.3]} />
                    </group>
                    )
                })}
              </group>
            );
          
          case BuildingType.ParkPlayground:
            return (
              <group position={[0, -yOffset - 0.29, 0]}>
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.9, 0.9]} />
                    <meshStandardMaterial color="#4ade80" />
                </mesh>
                
                {/* Swing Set */}
                <group position={[-0.2, 0, -0.2]}>
                  <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#ef4444'})} geometry={cylinderGeo} position={[-0.1, 0.15, 0]} scale={[0.02, 0.3, 0.02]} rotation={[0,0,-0.2]} />
                  <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#ef4444'})} geometry={cylinderGeo} position={[0.1, 0.15, 0]} scale={[0.02, 0.3, 0.02]} rotation={[0,0,0.2]} />
                  <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#ef4444'})} geometry={cylinderGeo} position={[0, 0.3, 0]} scale={[0.02, 0.3, 0.02]} rotation={[0,0,Math.PI/2]} />
                  <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#eab308'})} geometry={boxGeo} position={[0, 0.1, 0]} scale={[0.1, 0.02, 0.05]} />
                </group>

                {/* Sandbox */}
                <group position={[0.2, 0, 0.2]} rotation={[0, Math.PI/4, 0]}>
                   <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#fde047'})} geometry={boxGeo} position={[0, 0.02, 0]} scale={[0.3, 0.05, 0.3]} />
                   <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#f59e0b'})} geometry={boxGeo} position={[0, 0.04, 0]} scale={[0.2, 0.02, 0.2]} />
                </group>

                {/* Slight tree */}
                <group position={[-0.3, 0, 0.3]} scale={0.4}>
                  <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                  <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#22c55e', flatShading: true })} geometry={sphereGeo} position={[0, 0.35, 0]} scale={[0.3, 0.3, 0.3]} />
                </group>
              </group>
            );

          case BuildingType.ParkFountain:
            return (
              <group position={[0, -yOffset - 0.29, 0]}>
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[0.9, 0.9]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
                
                {/* Fountain Base */}
                <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({color: '#cbd5e1'})} geometry={cylinderGeo} position={[0, 0.05, 0]} scale={[0.5, 0.1, 0.5]} />
                <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#3b82f6', roughness: 0.1, transparent: true, opacity: 0.8})} geometry={cylinderGeo} position={[0, 0.08, 0]} scale={[0.45, 0.05, 0.45]} />
                
                {/* Center statue/pillar */}
                <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#e2e8f0'})} geometry={cylinderGeo} position={[0, 0.25, 0]} scale={[0.1, 0.4, 0.1]} />
                <mesh castShadow material={new THREE.MeshStandardMaterial({color: '#f8fafc'})} geometry={sphereGeo} position={[0, 0.5, 0]} scale={[0.15, 0.15, 0.15]} />
                
                {/* Water splash approximate */}
                <mesh material={new THREE.MeshStandardMaterial({color: '#60a5fa', transparent: true, opacity: 0.5})} geometry={coneGeo} position={[0, 0.3, 0]} scale={[0.3, 0.4, 0.3]} />
                
                {/* Benches */}
                {[0, 1, 2, 3].map((i) => (
                   <mesh key={i} castShadow material={new THREE.MeshStandardMaterial({color: '#78350f'})} geometry={boxGeo} position={[Math.cos(i*Math.PI/2)*0.35, 0.05, Math.sin(i*Math.PI/2)*0.35]} scale={[0.15, 0.05, 0.05]} rotation={[0, -i*Math.PI/2, 0]} />
                ))}
              </group>
            );
          case BuildingType.Road:
             return null;
          default:
            return null;
        }
      })()}
    </group>
  );
});

// --- Car Geometries ---
const carBodyGeo = new THREE.BoxGeometry(0.5, 0.12, 0.28);
carBodyGeo.translate(0, 0.06, 0);

const carCabinGeo = new THREE.BoxGeometry(0.25, 0.12, 0.24);
carCabinGeo.translate(-0.05, 0.18, 0);

const wheelGeoBase = new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12);
wheelGeoBase.rotateX(Math.PI/2);
// 4 wheels geometries
const wheel1Geo = wheelGeoBase.clone(); wheel1Geo.translate(0.15, 0.06, 0.15);
const wheel2Geo = wheelGeoBase.clone(); wheel2Geo.translate(-0.15, 0.06, 0.15);
const wheel3Geo = wheelGeoBase.clone(); wheel3Geo.translate(0.15, 0.06, -0.15);
const wheel4Geo = wheelGeoBase.clone(); wheel4Geo.translate(-0.15, 0.06, -0.15);

// --- 2. Dynamic Systems (Traffic, Citizens, Environment) ---

const carColors = ['#ef4444', '#3b82f6', '#eab308', '#ffffff', '#1f2937', '#f97316'];

const TrafficSystem = ({ grid, maxCars }: { grid: Grid, maxCars: number }) => {
  const roadTilesMap = useMemo(() => {
    const map = new Map<string, {x: number, y: number, neighbors: number}>();
    grid.forEach(row => row.forEach(tile => {
      if (tile.buildingType === BuildingType.Road) {
        map.set(`${tile.x},${tile.y}`, {x: tile.x, y: tile.y, neighbors: 0});
      }
    }));
    map.forEach(v => {
      let c = 0;
      if (map.has(`${v.x+1},${v.y}`)) c++;
      if (map.has(`${v.x-1},${v.y}`)) c++;
      if (map.has(`${v.x},${v.y+1}`)) c++;
      if (map.has(`${v.x},${v.y-1}`)) c++;
      v.neighbors = c;
    });
    return map;
  }, [grid]);

  const roadTiles = useMemo(() => Array.from(roadTilesMap.values()), [roadTilesMap]);

  const carCount = Math.min(roadTiles.length, maxCars);
  const carsRef = useRef<THREE.InstancedMesh>(null);
  const cabinRef = useRef<THREE.InstancedMesh>(null);
  const w1Ref = useRef<THREE.InstancedMesh>(null);
  const w2Ref = useRef<THREE.InstancedMesh>(null);
  const w3Ref = useRef<THREE.InstancedMesh>(null);
  const w4Ref = useRef<THREE.InstancedMesh>(null);
  const carsState = useRef<Float32Array>(new Float32Array(0)); 
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => new Float32Array(0), []);

  const lampsRef = useRef<THREE.InstancedMesh>(null);
  const lampCount = roadTiles.length * 2; // Two lamps per road tile

  useEffect(() => {
    if (roadTiles.length < 2) return;
    carsState.current = new Float32Array(carCount * 6);
    const newColors = new Float32Array(carCount * 3);

    for (let i = 0; i < carCount; i++) {
      const startNode = roadTiles[Math.floor(Math.random() * roadTiles.length)];
      carsState.current[i*6 + 0] = startNode.x;
      carsState.current[i*6 + 1] = startNode.y;
      carsState.current[i*6 + 2] = startNode.x;
      carsState.current[i*6 + 3] = startNode.y;
      carsState.current[i*6 + 4] = 1; // force pick new target
      carsState.current[i*6 + 5] = getRandomRange(0.005, 0.012); // smoother speed

      const color = new THREE.Color(carColors[Math.floor(Math.random() * carColors.length)]);
      newColors[i*3] = color.r; newColors[i*3+1] = color.g; newColors[i*3+2] = color.b;
    }

    if (carsRef.current) {
        carsRef.current.instanceColor = new THREE.InstancedBufferAttribute(newColors, 3);
    }
    
    // Set up street lamps
    if (lampsRef.current) {
        let lampIdx = 0;
        roadTiles.forEach(tile => {
            const [wx, _, wz] = gridToWorld(tile.x, tile.y);
            // Lamp 1
            dummy.position.set(wx - 0.4, -0.3 + 0.3, wz - 0.4);
            dummy.scale.set(0.05, 0.6, 0.05);
            dummy.updateMatrix();
            lampsRef.current!.setMatrixAt(lampIdx++, dummy.matrix);
            
            // Lamp 2
            dummy.position.set(wx + 0.4, -0.3 + 0.3, wz + 0.4);
            dummy.scale.set(0.05, 0.6, 0.05);
            dummy.updateMatrix();
            lampsRef.current!.setMatrixAt(lampIdx++, dummy.matrix);
        });
        lampsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [roadTiles, carCount]);

  useFrame((state) => {
    if (!carsRef.current || roadTiles.length < 2 || carsState.current.length === 0) return;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < carCount; i++) {
      const idx = i * 6;
      let curX = carsState.current[idx];
      let curY = carsState.current[idx+1];
      let tarX = carsState.current[idx+2];
      let tarY = carsState.current[idx+3];
      let progress = carsState.current[idx+4];
      const speed = carsState.current[idx+5];

      const dx = tarX - curX;
      const dy = tarY - curY;
      const movingAxis = dx !== 0 ? 'X' : 'Y';
      
      const tarNode = roadTilesMap.get(`${tarX},${tarY}`);
      
      // Obstacle avoidance: if target road is gone, recalculate immediately
      if (!tarNode) {
          progress = 1; // force recalculation immediately
      }

      const isNextIntersection = tarNode && tarNode.neighbors >= 3;
      
      const trafficCycle = Math.floor(time / 4 + tarX + tarY) % 2 === 0 ? 'X' : 'Y'; 

      let canMove = true;
      if (isNextIntersection && movingAxis !== trafficCycle && progress > 0.6 && progress <= 1.0) {
        canMove = false;
        carsState.current[idx+4] = 0.6;
      }

      if (canMove && tarNode) {
        progress += speed;
      }

      if (progress >= 1) {
        const prevDx = tarX - curX !== 0 ? Math.sign(tarX - curX) : 0;
        const prevDy = tarY - curY !== 0 ? Math.sign(tarY - curY) : 0;

        curX = tarNode ? tarX : Math.round(curX);
        curY = tarNode ? tarY : Math.round(curY);
        progress = 0;
        
        const possibleNext = [
          roadTilesMap.get(`${curX+1},${curY}`),
          roadTilesMap.get(`${curX-1},${curY}`),
          roadTilesMap.get(`${curX},${curY+1}`),
          roadTilesMap.get(`${curX},${curY-1}`)
        ].filter(Boolean) as {x: number, y: number, neighbors: number}[];

        if (possibleNext.length > 0) {
            let valid = possibleNext.filter(n => Math.sign(n.x - curX) !== -prevDx || Math.sign(n.y - curY) !== -prevDy);
            if (valid.length === 0) valid = possibleNext;
            
            const better = valid.filter(n => n.neighbors > 1);
            const choices = better.length > 0 ? better : valid;

            const straight = choices.find(n => Math.sign(n.x - curX) === prevDx && Math.sign(n.y - curY) === prevDy);
            let next: {x:number, y:number};
            if (straight && Math.random() > 0.4) {
                next = straight;
            } else {
                next = choices[Math.floor(Math.random() * choices.length)];
            }
            
            tarX = next.x;
            tarY = next.y;
        } else {
            const rnd = roadTiles[Math.floor(Math.random() * roadTiles.length)];
            curX = rnd.x; curY = rnd.y; tarX = rnd.x; tarY = rnd.y;
        }
      }

      carsState.current[idx] = curX;
      carsState.current[idx+1] = curY;
      carsState.current[idx+2] = tarX;
      carsState.current[idx+3] = tarY;
      if (canMove) carsState.current[idx+4] = progress;

      // Interpolate position
      const gx = MathUtils.lerp(curX, tarX, progress);
      const gy = MathUtils.lerp(curY, tarY, progress);

      // Determine driving side offset
      const currentDx = tarX - curX;
      const currentDy = tarY - curY;
      const angle = Math.atan2(currentDy, currentDx);
      
      // Lane Changing Logic: Slight sine wave offset based on distance, time, and car ID
      const laneSway = isNextIntersection ? 0 : Math.sin(time * 2 + i) * 0.05;
      const offsetAmt = 0.15 + laneSway;
      
      // Normals: (-dy, dx)
      const len = Math.sqrt(currentDx*currentDx + currentDy*currentDy) || 1;
      const offX = (-currentDy/len) * offsetAmt;
      const offY = (currentDx/len) * offsetAmt;

      const [wx, _, wz] = gridToWorld(gx + offX, gy + offY);

      // Road surface is approx -0.3. Geometry bottom is at 0.
      dummy.position.set(wx, -0.3, wz);
      dummy.rotation.set(0, -angle, 0);
      // Car dimensions (Length(X), Height(Y), Width(Z) assuming 0 rotation aligns with X)
      // we don't scale dummy here because geometries already have sizes
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      
      carsRef.current.setMatrixAt(i, dummy.matrix);
      cabinRef.current?.setMatrixAt(i, dummy.matrix);
      w1Ref.current?.setMatrixAt(i, dummy.matrix);
      w2Ref.current?.setMatrixAt(i, dummy.matrix);
      w3Ref.current?.setMatrixAt(i, dummy.matrix);
      w4Ref.current?.setMatrixAt(i, dummy.matrix);
    }
    carsRef.current.instanceMatrix.needsUpdate = true;
    if (cabinRef.current) cabinRef.current.instanceMatrix.needsUpdate = true;
    if (w1Ref.current) w1Ref.current.instanceMatrix.needsUpdate = true;
    if (w2Ref.current) w2Ref.current.instanceMatrix.needsUpdate = true;
    if (w3Ref.current) w3Ref.current.instanceMatrix.needsUpdate = true;
    if (w4Ref.current) w4Ref.current.instanceMatrix.needsUpdate = true;

  });

  if (roadTiles.length < 2) return null;

  return (
    <group>
        <instancedMesh ref={carsRef} args={[carBodyGeo, undefined, carCount]} castShadow>
          <meshStandardMaterial roughness={0.5} metalness={0.3} />
        </instancedMesh>
        <instancedMesh ref={cabinRef} args={[carCabinGeo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#111827" roughness={0.1} metalness={0.8} />
        </instancedMesh>
        <instancedMesh ref={w1Ref} args={[wheel1Geo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#000000" roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={w2Ref} args={[wheel2Geo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#000000" roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={w3Ref} args={[wheel3Geo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#000000" roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={w4Ref} args={[wheel4Geo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#000000" roughness={0.9} />
        </instancedMesh>
        {lampCount > 0 && (
           <instancedMesh ref={lampsRef} args={[cylinderGeo, undefined, lampCount]}>
               <primitive object={streetLampMaterial} attach="material" />
           </instancedMesh>
        )}
    </group>
  );
};

// Clouds & Birds// Clouds & Birds
const Cloud = ({ position, scale, speed }: { position: [number, number, number], scale: number, speed: number }) => {
    const group = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (group.current) {
            group.current.position.x += speed * delta;
            if (group.current.position.x > GRID_SIZE * 1.5) group.current.position.x = -GRID_SIZE * 1.5;
        }
    });

    const bubbles = useMemo(() => Array.from({length: 5 + Math.random() * 5}).map(() => ({
        pos: [getRandomRange(-1,1), getRandomRange(-0.5, 0.5), getRandomRange(-1,1)] as [number, number, number],
        scale: getRandomRange(0.5, 1.2)
    })), []);

    return (
        <group ref={group} position={position} scale={scale}>
            {bubbles.map((b, i) => (
                <mesh key={i} geometry={sphereGeo} position={b.pos} scale={b.scale} castShadow>
                    <meshStandardMaterial color="white" flatShading opacity={0.9} transparent />
                </mesh>
            ))}
        </group>
    )
}

const Bird = ({ position, speed, offset }: { position: [number, number, number], speed: number, offset: number }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame((state) => {
        if(ref.current) {
            const time = state.clock.elapsedTime + offset;
            ref.current.position.x = position[0] + Math.sin(time * speed) * GRID_SIZE;
            ref.current.position.z = position[1] + Math.cos(time * speed) * GRID_SIZE/2;
            ref.current.rotation.y = -time * speed + Math.PI;
            ref.current.scale.y = 1 + Math.sin(time * 15) * 0.3;
        }
    });

    return (
        <group ref={ref} position={[position[0], position[2], position[1]]}>
            <mesh geometry={boxGeo} scale={[0.2, 0.05, 0.05]} position={[0.1,0,0]} rotation={[0, Math.PI/4, 0]}><meshBasicMaterial color="#333" /></mesh>
            <mesh geometry={boxGeo} scale={[0.2, 0.05, 0.05]} position={[-0.1,0,0]} rotation={[0, -Math.PI/4, 0]}><meshBasicMaterial color="#333" /></mesh>
        </group>
    )
}

const WeatherParticles = ({ type }: { type: string }) => {
    const isRain = type === 'rainy';
    const isSnow = type === 'snowy';
    const count = isRain ? 2000 : (isSnow ? 1000 : 0);
    
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useRef(new Float32Array(count * 4)); // x, y, z, speed
    
    useEffect(() => {
        if (count === 0) return;
        for (let i = 0; i < count; i++) {
            particles.current[i*4] = getRandomRange(-GRID_SIZE, GRID_SIZE);
            particles.current[i*4+1] = getRandomRange(0, 15);
            particles.current[i*4+2] = getRandomRange(-GRID_SIZE, GRID_SIZE);
            particles.current[i*4+3] = isRain ? getRandomRange(0.2, 0.4) : getRandomRange(0.02, 0.05);
        }
    }, [count, isRain, isSnow]);
    
    useFrame(() => {
        if (!meshRef.current || count === 0) return;
        for (let i = 0; i < count; i++) {
            let x = particles.current[i*4];
            let y = particles.current[i*4+1];
            let z = particles.current[i*4+2];
            const speed = particles.current[i*4+3];
            
            y -= speed;
            if (isSnow) x += Math.sin(y + i) * 0.01;
            
            if (y < -0.5) {
                y = 15;
                x = getRandomRange(-GRID_SIZE, GRID_SIZE);
                z = getRandomRange(-GRID_SIZE, GRID_SIZE);
            }
            
            particles.current[i*4] = x;
            particles.current[i*4+1] = y;
            particles.current[i*4+2] = z;
            
            dummy.position.set(x, y, z);
            if (isRain) {
                dummy.scale.set(0.02, 0.3, 0.02);
            } else {
                dummy.scale.set(0.05, 0.05, 0.05);
            }
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (count === 0) return null;

    return (
        <instancedMesh ref={meshRef} args={[isRain ? cylinderGeo : sphereGeo, undefined, count]} raycast={() => null}>
            <meshBasicMaterial color={isRain ? "#60a5fa" : "#ffffff"} opacity={0.6} transparent />
        </instancedMesh>
    );
};

const DayNightSystem = () => {
    const dirLightRef = useRef<THREE.DirectionalLight>(null);
    const ambientLightRef = useRef<THREE.AmbientLight>(null);
    const sunRef = useRef<THREE.Mesh>(null);
    const moonRef = useRef<THREE.Mesh>(null);
    
    useFrame((state) => {
        const time = state.clock.elapsedTime * 0.05; // Day cycle lasts around 125 seconds
        const sunAngle = time % (Math.PI * 2);
        
        if (dirLightRef.current) {
            dirLightRef.current.position.x = Math.cos(sunAngle) * 30;
            dirLightRef.current.position.y = Math.sin(sunAngle) * 30;
            dirLightRef.current.position.z = Math.sin(sunAngle) * 15;
            
            if (sunRef.current) {
                sunRef.current.position.copy(dirLightRef.current.position);
                sunRef.current.visible = !isNight;
            }
            if (moonRef.current) {
                moonRef.current.position.set(-dirLightRef.current.position.x, -dirLightRef.current.position.y, -dirLightRef.current.position.z);
                moonRef.current.visible = isNight;
            }
            
            const isNight = dirLightRef.current.position.y < 0;
            dirLightRef.current.intensity = isNight ? 0 : Math.max(0, Math.sin(sunAngle) * 2);
            
            // Toggle emissive materials
            windowMaterial.emissiveIntensity = isNight ? 1.0 : 0.0;
            streetLampMaterial.emissiveIntensity = isNight ? 2.0 : 0.0;
        }
        
        if (ambientLightRef.current) {
            const isNight = Math.sin(sunAngle) < 0;
            ambientLightRef.current.intensity = isNight ? 0.2 : 0.5;
            ambientLightRef.current.color.setHex(isNight ? 0x1e1b4b : 0xcceeff);
        }
    });

    return (
        <group>
            <ambientLight ref={ambientLightRef} intensity={0.5} color="#cceeff" />
            <directionalLight
                ref={dirLightRef}
                castShadow
                position={[15, 20, 10]}
                intensity={2}
                color="#fffbeb"
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-15} shadow-camera-right={15}
                shadow-camera-top={15} shadow-camera-bottom={-15}
            />
        </group>
    );
};

const EnvironmentEffects = ({ weather }: { weather: string }) => {
    return (
        <group raycast={() => null}>
             {/* Clouds */}
            <Cloud position={[-12, 8, 4]} scale={1.5} speed={0.3} />
            <Cloud position={[5, 9, -8]} scale={1.2} speed={0.5} />
            <Cloud position={[15, 7, 10]} scale={1.8} speed={0.2} />
            
            {/* Birds (Only spawn if not raining/snowing) */}
            {weather === 'sunny' && (
                <group position={[0, 0, 0]} scale={0.8}>
                    <Bird position={[0, 0, 10]} speed={0.6} offset={0} />
                    <Bird position={[0, 0, 10]} speed={0.6} offset={1.2} />
                    <Bird position={[0, 0, 10]} speed={0.6} offset={2.5} />
                </group>
            )}

            {/* Weather Particles */}
            <WeatherParticles type={weather} />

            {/* Water */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
                <planeGeometry args={[GRID_SIZE * 4, GRID_SIZE * 4]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.1} metalness={0.5} opacity={0.8} transparent />
            </mesh>
        </group>
    )
};


// --- 3. Main Map Component ---

const TrafficLight = ({ x, y }: { x: number, y: number }) => {
  const refX = useRef<THREE.MeshStandardMaterial>(null);
  const refY = useRef<THREE.MeshStandardMaterial>(null);
  
  useFrame((state) => {
    const isX = Math.floor(state.clock.elapsedTime / 4 + x + y) % 2 === 0;
    if (refX.current && refY.current) {
      refX.current.color.setHex(isX ? 0x22c55e : 0xef4444);
      refY.current.color.setHex(!isX ? 0x22c55e : 0xef4444);
    }
  });

  return (
    <group position={[0, 0.4, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[0.045, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.04, 0.02]} />
        <meshStandardMaterial ref={refX} color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.045, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.04, 0.02]} />
        <meshStandardMaterial ref={refX} color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.05, 0.045]}>
        <boxGeometry args={[0.02, 0.04, 0.02]} />
        <meshStandardMaterial ref={refY} color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.05, -0.045]}>
        <boxGeometry args={[0.02, 0.04, 0.02]} />
        <meshStandardMaterial ref={refY} color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

const RoadMarkings = React.memo(({ x, y, grid, yOffset }: { x: number; y: number; grid: Grid; yOffset: number }) => {
  const lineMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbbf24' }), []);
  const lineGeo = useMemo(() => new THREE.PlaneGeometry(0.1, 0.5), []);

  const hasUp = y > 0 && grid[y - 1][x].buildingType === BuildingType.Road;
  const hasDown = y < GRID_SIZE - 1 && grid[y + 1][x].buildingType === BuildingType.Road;
  const hasLeft = x > 0 && grid[y][x - 1].buildingType === BuildingType.Road;
  const hasRight = x < GRID_SIZE - 1 && grid[y][x + 1].buildingType === BuildingType.Road;

  const connections = [hasUp, hasDown, hasLeft, hasRight].filter(Boolean).length;
  
  // Isolated road piece: draw a default line
  if (connections === 0) {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]} geometry={lineGeo} material={lineMaterial} />
    );
  }

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, yOffset, 0]}>
      {/* Center point for junctions to fill the gap, lifted slightly to avoid z-fighting */}
      {(hasUp || hasDown) && (hasLeft || hasRight) && (
        <mesh position={[0, 0, 0.005]} material={lineMaterial}>
           <planeGeometry args={[0.12, 0.12]} />
        </mesh>
      )}

      {hasUp && <mesh position={[0, 0.25, 0]} geometry={lineGeo} material={lineMaterial} />}
      {hasDown && <mesh position={[0, -0.25, 0]} geometry={lineGeo} material={lineMaterial} />}
      {hasLeft && <mesh position={[-0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
      {hasRight && <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
      
      {connections >= 3 && <group rotation={[Math.PI / 2, 0, 0]}><TrafficLight x={x} y={y} /></group>}
    </group>
  );
});

interface GroundTileProps {
    type: BuildingType;
    x: number;
    y: number;
    grid: Grid;
    onHover: (x: number, y: number) => void;
    onLeave: () => void;
    onClick: (x: number, y: number) => void;
}

// Ground Tile: Handles pointer events and forms base terrain
const GroundTile = React.memo(({ type, x, y, grid, onHover, onLeave, onClick }: GroundTileProps) => {
  const [wx, _, wz] = gridToWorld(x, y);
  
  let color = '#10b981';
  // Base level for tiles, slightly varying
  let topY = -0.3; 
  let thickness = 0.5;
  
  if (type === BuildingType.None) {
    const noise = getHash(x, y);
    color = noise > 0.7 ? '#059669' : noise > 0.3 ? '#10b981' : '#34d399';
    topY = -0.3 - noise * 0.1; // Slight height variation for grass
  } else if (type === BuildingType.Road) {
    color = '#374151';
    topY = -0.29; // slightly higher
  } else {
    color = '#d1d5db'; // concrete base
    topY = -0.28;
  }

  const centerY = topY - thickness/2;

  return (
    <mesh 
        position={[wx, centerY, wz]} 
        receiveShadow castShadow
        onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
        onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
        onPointerDown={(e) => {
            e.stopPropagation();
            if (e.button === 0) onClick(x, y);
        }}
    >
      <boxGeometry args={[1, thickness, 1]} />
      <meshStandardMaterial color={color} flatShading roughness={1} />
      {type === BuildingType.Road && <RoadMarkings x={x} y={y} grid={grid} yOffset={thickness / 2 + 0.001} />}
    </mesh>
  );
});

// Selection/Hover Cursor
const Cursor = ({ x, y, color }: { x: number, y: number, color: string }) => {
  const [wx, _, wz] = gridToWorld(x, y);
  return (
    <mesh position={[wx, -0.25, wz]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} depthTest={false} />
      <Outlines thickness={0.05} color="white" />
    </mesh>
  );
};


interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number) => void;
  hoveredTool: BuildingType;
  population: number;
  weather?: string;
  maxCars?: number;
}

const IsoMap: React.FC<IsoMapProps> = ({ grid, onTileClick, hoveredTool, population, weather = 'sunny', maxCars = 6 }) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number} | null>(null);

  const handleHover = useCallback((x: number, y: number) => {
    setHoveredTile({ x, y });
  }, []);

  const handleLeave = useCallback(() => {
    setHoveredTile(null);
  }, []);

  // Preview Logic
  const showPreview = hoveredTile && grid[hoveredTile.y][hoveredTile.x].buildingType === BuildingType.None && hoveredTool !== BuildingType.None;
  const previewColor = showPreview ? BUILDINGS[hoveredTool].color : 'white';
  const isBulldoze = hoveredTool === BuildingType.None;
  
  const previewPos = hoveredTile ? gridToWorld(hoveredTile.x, hoveredTile.y) : [0,0,0];

  return (
    <div className="absolute inset-0 bg-sky-900 touch-none">
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault zoom={45} position={[20, 20, 20]} near={-100} far={200} />
        
        <MapControls 
          enableRotate={true}
          enableZoom={true}
          minZoom={20}
          maxZoom={120}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0.1}
          target={[0,-0.5,0]}
        />

        <DayNightSystem />
        <Environment preset="city" />

        <EnvironmentEffects weather={weather} />

        <group>
          {grid.map((row, y) =>
            row.map((tile, x) => {
              // Calculate world position once per tile
              const [wx, _, wz] = gridToWorld(x, y);
              
              return (
              <React.Fragment key={`${x}-${y}`}>
                <GroundTile 
                    type={tile.buildingType} 
                    x={x} y={y} 
                    grid={grid}
                    onHover={handleHover}
                    onLeave={handleLeave}
                    onClick={onTileClick}
                />
                
                {/* Building visual - apply world position to group to align with ground tile */}
                <group position={[wx, 0, wz]} raycast={() => null}>
                    {tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road && (
                      <ProceduralBuilding 
                        type={tile.buildingType} 
                        baseColor={BUILDINGS[tile.buildingType].color} 
                        x={x} y={y} 
                        level={tile.level || 1}
                      />
                    )}
                </group>
              </React.Fragment>
            )})
          )}

          {/* Visual Elements - disable pointer events */}
          <group raycast={() => null}>
            <TrafficSystem grid={grid} maxCars={maxCars} />

            {/* Placement Preview */}
            {showPreview && hoveredTile && (
              <group position={[previewPos[0], 0, previewPos[2]]}>
                <Float speed={3} rotationIntensity={0} floatIntensity={0.1} floatingRange={[0, 0.1]}>
                  <ProceduralBuilding 
                    type={hoveredTool} 
                    baseColor={previewColor} 
                    x={hoveredTile.x} 
                    y={hoveredTile.y} 
                    transparent 
                    opacity={0.7} 
                    level={hoveredTool === BuildingType.Upgrade && grid[hoveredTile.y][hoveredTile.x]?.level ? Math.min(3, grid[hoveredTile.y][hoveredTile.x].level! + 1) : 1}
                  />
                </Float>
              </group>
            )}

            {/* Highlight */}
            {hoveredTile && (
              <Cursor 
                x={hoveredTile.x} 
                y={hoveredTile.y} 
                color={isBulldoze ? '#ef4444' : (showPreview ? '#ffffff' : '#000000')} 
              />
            )}
          </group>
        </group>
        
        <SoftShadows size={10} samples={8} />
      </Canvas>
    </div>
  );
};

export default IsoMap;