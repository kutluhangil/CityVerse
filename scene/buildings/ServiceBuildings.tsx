import React from 'react';
import * as THREE from 'three';
import { BuildingType } from '../../types';
import { boxGeo, cylinderGeo, getStdMat } from '../shared';
import { PaperBox, WindowBlock } from './BuildingParts';

interface ServiceBuildingMeshProps {
  type: BuildingType;
  level: number;
  x?: number;
  y?: number;
  mainMat: THREE.MeshStandardMaterial;
  accentMat: THREE.MeshStandardMaterial;
  roofMat: THREE.MeshStandardMaterial;
  opacity: number;
  transparent: boolean;
  showEdges?: boolean;
}

export const ServiceBuildingMesh: React.FC<ServiceBuildingMeshProps> = ({
  type,
  level,
  x = 0,
  y = 0,
  mainMat,
  accentMat,
  roofMat,
  opacity,
  transparent,
  showEdges = true,
}) => {
  const commonProps = { castShadow: true, receiveShadow: true };
  const seedBase = x * 7 + y * 13;

  switch (type) {
    case BuildingType.PowerPlant:
      return (
        <>
          <PaperBox
            material={mainMat}
            position={[-0.12, 0.3 * level, 0]}
            scale={[0.55, 0.6 * level, 0.75]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <mesh
            {...commonProps}
            material={accentMat}
            geometry={cylinderGeo}
            position={[0.25, 0.45 * level, 0.15]}
            scale={[0.18, 0.9 * level, 0.18]}
          />
          <mesh
            {...commonProps}
            material={getStdMat('#d97757', {
              emissive: '#d97757',
              emissiveIntensity: 0.9,
              opacity,
              transparent,
            })}
            geometry={boxGeo}
            position={[-0.12, 0.52 * level, 0.38]}
            scale={[0.45, 0.08, 0.04]}
          />
        </>
      );

    case BuildingType.FireStation:
      return (
        <>
          <PaperBox
            material={mainMat}
            position={[-0.08, 0.3 * level, 0]}
            scale={[0.7, 0.6 * level, 0.7]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <PaperBox
            material={roofMat}
            position={[0.28, 0.5 * level, -0.2]}
            scale={[0.22, 1.0 * level, 0.22]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <mesh
            {...commonProps}
            material={getStdMat('#f9f9f7', { opacity, transparent })}
            geometry={boxGeo}
            position={[-0.18, 0.16, 0.36]}
            scale={[0.18, 0.24, 0.04]}
          />
          <mesh
            {...commonProps}
            material={getStdMat('#f9f9f7', { opacity, transparent })}
            geometry={boxGeo}
            position={[0.05, 0.16, 0.36]}
            scale={[0.18, 0.24, 0.04]}
          />
        </>
      );

    case BuildingType.PoliceStation:
      return (
        <>
          <PaperBox
            material={mainMat}
            position={[0, 0.35 * level, 0]}
            scale={[0.8, 0.7 * level, 0.75]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <PaperBox
            material={accentMat}
            position={[0, 0.75 * level, 0]}
            scale={[0.5, 0.12, 0.5]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <WindowBlock
            position={[0, 0.4 * level, 0.39]}
            scale={[0.55, 0.18, 0.04]}
            seed={seedBase + 1}
          />
          <mesh
            material={getStdMat('#d97757', {
              emissive: '#d97757',
              emissiveIntensity: 1.4,
            })}
            geometry={boxGeo}
            position={[0, 0.85 * level, 0]}
            scale={[0.12, 0.08, 0.12]}
          />
        </>
      );

    case BuildingType.School:
      return (
        <>
          <PaperBox
            material={mainMat}
            position={[0, 0.28 * level, 0.1]}
            scale={[0.85, 0.56 * level, 0.45]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <PaperBox
            material={accentMat}
            position={[-0.2, 0.28 * level, -0.2]}
            scale={[0.45, 0.56 * level, 0.35]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <PaperBox
            material={roofMat}
            position={[0.2, 0.65 * level, 0.1]}
            scale={[0.2, 0.35 * level, 0.2]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <WindowBlock
            position={[0, 0.3 * level, 0.34]}
            scale={[0.6, 0.18, 0.04]}
            seed={seedBase + 2}
          />
        </>
      );

    case BuildingType.Hospital:
      return (
        <>
          <PaperBox
            material={getStdMat('#faf9f5', {
              flatShading: true,
              opacity,
              transparent,
              roughness: 0.92,
            })}
            position={[0, 0.4 * level, 0]}
            scale={[0.82, 0.8 * level, 0.65]}
            showEdges={showEdges}
            transparent={transparent}
          />
          <mesh
            {...commonProps}
            material={getStdMat('#d97757', { opacity, transparent })}
            geometry={boxGeo}
            position={[0, 0.25 * level, 0]}
            scale={[0.88, 0.12, 0.7]}
          />
          <mesh
            material={getStdMat('#c44536', {
              emissive: '#c44536',
              emissiveIntensity: 0.4,
            })}
            geometry={boxGeo}
            position={[0, 0.82 * level, 0]}
            scale={[0.32, 0.05, 0.1]}
          />
          <mesh
            material={getStdMat('#c44536', {
              emissive: '#c44536',
              emissiveIntensity: 0.4,
            })}
            geometry={boxGeo}
            position={[0, 0.82 * level, 0]}
            scale={[0.1, 0.05, 0.32]}
          />
          <WindowBlock
            position={[0, 0.55 * level, 0.34]}
            scale={[0.65, 0.16, 0.04]}
            seed={seedBase + 3}
          />
        </>
      );

    default:
      return null;
  }
};
