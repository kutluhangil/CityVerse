import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingType } from '../../types';
import {
  boxGeo,
  BuildingMeshProps,
  coneGeo,
  cylinderGeo,
  getBasicMat,
  getCachedMaterial,
  getHash,
  getStdMat,
  sphereGeo,
  tileSubPlaneGeo,
  tmpColor,
} from '../shared';
import {
  CrackDecal,
  FountainWater,
  PaperBox,
  Scaffolding,
  SmokeStack,
  Tree,
  WindowBlock,
} from './BuildingParts';
import { ServiceBuildingMesh } from './ServiceBuildings';

export const ProceduralBuilding = React.memo(
  ({
    type,
    baseColor,
    x,
    y,
    opacity = 1,
    transparent = false,
    level = 1,
    weather = 'sunny',
    isDamaged = false,
    showEdges = true,
  }: BuildingMeshProps) => {
    const hash = getHash(x, y);
    const groupRef = useRef<THREE.Group>(null);
    const scaffoldingRef = useRef<THREE.Group>(null);
    const progressRef = useRef(transparent ? 1 : 0);

    useEffect(() => {
      if (!transparent) {
        progressRef.current = 0;
      }
    }, [level, transparent]);

    useFrame((_state, delta) => {
      if (progressRef.current < 1) {
        progressRef.current = Math.min(1, progressRef.current + delta * 2.2);
      }
      const p = progressRef.current;
      if (scaffoldingRef.current) {
        scaffoldingRef.current.visible = !transparent && p < 1;
      }
      if (groupRef.current && !isDamaged) {
        const ez = (t: number) => {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        };
        groupRef.current.scale.y = p < 1 ? Math.max(0.05, ez(p)) : 1;
      }
    });

    const variant = Math.floor(hash * 100);
    const rotation = Math.floor(hash * 4) * (Math.PI / 2);

    const mainMat = getCachedMaterial(baseColor, hash, 'main', opacity, transparent, weather, level, type);
    const accentMat = getCachedMaterial(baseColor, hash, 'accent', opacity, transparent, weather, level, type);
    const roofMat = getCachedMaterial(baseColor, hash, 'roof', opacity, transparent, weather, level, type);
    const clayMat = getStdMat(weather === 'snowy' ? '#faf9f5' : '#d97757', { flatShading: true, opacity, transparent });
    const darkTrimMat = getStdMat('#52514e', { flatShading: true, opacity, transparent });
    const commonProps = { castShadow: true, receiveShadow: true };
    const yOffset = -0.3;
    const seedBase = x * 17 + y * 31;

    const renderResidential = () => {
      if (level >= 3) {
        const height = 1.75 + hash * 0.45;
        return (
          <>
            <PaperBox material={mainMat} position={[0, height / 2, 0]} scale={[0.66, height, 0.66]} showEdges={showEdges} transparent={transparent} />
            <PaperBox material={accentMat} position={[0, height + 0.15, 0]} scale={[0.42, 0.3, 0.42]} showEdges={showEdges} transparent={transparent} />
            <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[0, height * 0.55, 0]} scale={[0.7, 0.06, 0.7]} />
            <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[0, height + 0.02, 0]} scale={[0.7, 0.05, 0.7]} />
            <mesh {...commonProps} material={getStdMat('#6f9172', { opacity, transparent })} geometry={boxGeo} position={[0, height + 0.31, 0]} scale={[0.3, 0.04, 0.3]} />
            {[0, 1, 2, 3].map((i) => (
              <React.Fragment key={i}>
                <WindowBlock position={[-0.14, 0.28 + i * 0.42, 0.34]} scale={[0.16, 0.2, 0.04]} seed={seedBase + i} />
                <WindowBlock position={[0.14, 0.28 + i * 0.42, 0.34]} scale={[0.16, 0.2, 0.04]} seed={seedBase + i + 5} />
              </React.Fragment>
            ))}
          </>
        );
      }

      if (level === 2) {
        return (
          <>
            <PaperBox material={mainMat} position={[-0.08, 0.55, 0]} scale={[0.58, 1.1, 0.72]} showEdges={showEdges} transparent={transparent} />
            <PaperBox material={accentMat} position={[0.24, 0.42, 0.08]} scale={[0.36, 0.84, 0.52]} showEdges={showEdges} transparent={transparent} />
            <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[-0.08, 1.12, 0]} scale={[0.62, 0.05, 0.76]} />
            {[0, 1].map((i) => (
              <React.Fragment key={i}>
                <WindowBlock position={[-0.08, 0.32 + i * 0.45, 0.37]} scale={[0.34, 0.18, 0.04]} seed={seedBase + i} />
                <WindowBlock position={[0.24, 0.28 + i * 0.36, 0.35]} scale={[0.18, 0.16, 0.04]} seed={seedBase + i + 3} />
              </React.Fragment>
            ))}
          </>
        );
      }

      if (variant < 50) {
        return (
          <>
            <PaperBox material={mainMat} position={[0, 0.28, 0]} scale={[0.68, 0.56, 0.58]} showEdges={showEdges} transparent={transparent} />
            <mesh {...commonProps} material={roofMat} geometry={coneGeo} position={[0, 0.73, 0]} scale={[0.58, 0.38, 0.58]} rotation={[0, Math.PI / 4, 0]} />
            {hash > 0.4 && (
              <mesh {...commonProps} material={darkTrimMat} geometry={boxGeo} position={[0.18, 0.6, 0]} scale={[0.09, 0.32, 0.09]} />
            )}
            <WindowBlock position={[0.16, 0.3, 0.3]} scale={[0.14, 0.16, 0.04]} seed={seedBase + 1} />
            <WindowBlock position={[-0.16, 0.3, 0.3]} scale={[0.14, 0.16, 0.04]} seed={seedBase + 2} />
            <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[0, 0.1, 0.31]} scale={[0.14, 0.2, 0.04]} />
          </>
        );
      }

      const height = 0.72 + (hash > 0.75 ? 0.22 : 0);
      return (
        <>
          <PaperBox material={mainMat} position={[0, height / 2, 0]} scale={[0.56, height, 0.62]} showEdges={showEdges} transparent={transparent} />
          <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0, height + 0.04, 0]} scale={[0.6, 0.08, 0.66]} />
          <WindowBlock position={[0, 0.28, 0.32]} scale={[0.28, 0.18, 0.04]} seed={seedBase + 1} />
          <WindowBlock position={[0, 0.56, 0.32]} scale={[0.28, 0.18, 0.04]} seed={seedBase + 2} />
        </>
      );
    };

    const renderCommercial = () => {
      if (level >= 3) {
        const height = 2.4 + hash * 1.1;
        return (
          <>
            <PaperBox material={mainMat} position={[0, height / 2, 0]} scale={[0.72, height, 0.72]} showEdges={showEdges} transparent={transparent} />
            <PaperBox material={accentMat} position={[0, height + 0.16, 0]} scale={[0.46, 0.32, 0.46]} showEdges={showEdges} transparent={transparent} />
            <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[0, height * 0.48, 0]} scale={[0.75, 0.05, 0.75]} />
            <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[0, height * 0.88, 0]} scale={[0.75, 0.05, 0.75]} />
            {hash > 0.45 && (
              <mesh {...commonProps} material={darkTrimMat} geometry={cylinderGeo} position={[0, height + 0.58, 0]} scale={[0.02, 0.7, 0.02]} />
            )}
            {Array.from({ length: Math.floor(height * 2.2) }).map((_, i) => (
              <WindowBlock key={i} position={[0, 0.25 + i * 0.42, 0]} scale={[0.74, 0.18, 0.74]} seed={seedBase + i} />
            ))}
          </>
        );
      }

      if (level === 2) {
        return (
          <>
            <PaperBox material={mainMat} position={[-0.12, 0.65, -0.1]} scale={[0.58, 1.3, 0.62]} showEdges={showEdges} transparent={transparent} />
            <PaperBox material={accentMat} position={[0.14, 0.42, 0.12]} scale={[0.58, 0.84, 0.58]} showEdges={showEdges} transparent={transparent} />
            <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[-0.12, 1.32, -0.1]} scale={[0.62, 0.05, 0.66]} />
            <WindowBlock position={[0.14, 0.32, 0.42]} scale={[0.46, 0.22, 0.04]} seed={seedBase + 1} />
            <WindowBlock position={[-0.12, 0.95, 0.22]} scale={[0.44, 0.22, 0.04]} seed={seedBase + 2} />
          </>
        );
      }

      return (
        <>
          <PaperBox material={mainMat} position={[0, 0.38, 0]} scale={[0.84, 0.76, 0.76]} showEdges={showEdges} transparent={transparent} />
          <WindowBlock position={[0, 0.3, 0.39]} scale={[0.68, 0.32, 0.04]} seed={seedBase + 1} />
          <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[0, 0.52, 0.46]} scale={[0.86, 0.09, 0.2]} rotation={[Math.PI / 6, 0, 0]} />
          <mesh {...commonProps} material={darkTrimMat} geometry={boxGeo} position={[0, 0.8, 0]} scale={[0.55, 0.08, 0.12]} />
        </>
      );
    };

    const renderIndustrial = () => {
      if (level >= 3) {
        return (
          <>
            <PaperBox material={mainMat} position={[-0.1, 0.58, 0]} scale={[0.66, 1.16, 0.84]} showEdges={showEdges} transparent={transparent} />
            <PaperBox material={accentMat} position={[0.28, 0.72, 0]} scale={[0.28, 1.44, 0.6]} showEdges={showEdges} transparent={transparent} />
            <mesh {...commonProps} material={clayMat} geometry={boxGeo} position={[-0.1, 1.18, 0]} scale={[0.7, 0.06, 0.88]} />
            <SmokeStack position={[0.28, 1.1, -0.24]} height={1.25} />
            <SmokeStack position={[0.28, 1.1, 0.24]} height={1.25} />
            <WindowBlock position={[-0.1, 0.45, 0.43]} scale={[0.42, 0.2, 0.04]} seed={seedBase + 1} />
            <WindowBlock position={[-0.1, 0.85, 0.43]} scale={[0.42, 0.2, 0.04]} seed={seedBase + 2} />
          </>
        );
      }

      if (level === 2) {
        return (
          <>
            <PaperBox material={mainMat} position={[-0.18, 0.48, 0]} scale={[0.54, 0.96, 0.84]} showEdges={showEdges} transparent={transparent} />
            <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.24, 0.52, -0.22]} scale={[0.18, 1.04, 0.18]} />
            <mesh {...commonProps} material={accentMat} geometry={cylinderGeo} position={[0.24, 0.52, 0.22]} scale={[0.18, 1.04, 0.18]} />
            <mesh {...commonProps} material={darkTrimMat} geometry={boxGeo} position={[0.24, 0.92, 0]} scale={[0.06, 0.06, 0.48]} />
            <SmokeStack position={[-0.22, 0.85, 0.25]} height={1.0} />
            <SmokeStack position={[-0.22, 0.85, -0.25]} height={0.9} />
            <WindowBlock position={[-0.18, 0.42, 0.43]} scale={[0.32, 0.2, 0.04]} seed={seedBase + 1} />
          </>
        );
      }

      return (
        <>
          <PaperBox material={mainMat} position={[0, 0.36, 0]} scale={[0.86, 0.72, 0.78]} showEdges={showEdges} transparent={transparent} />
          <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[-0.2, 0.78, 0]} scale={[0.38, 0.18, 0.78]} rotation={[0, 0, Math.PI / 4]} />
          <mesh {...commonProps} material={roofMat} geometry={boxGeo} position={[0.2, 0.78, 0]} scale={[0.38, 0.18, 0.78]} rotation={[0, 0, Math.PI / 4]} />
          <SmokeStack position={[0.28, 0.45, 0.26]} height={0.9} />
          <WindowBlock position={[0, 0.32, 0.4]} scale={[0.34, 0.18, 0.04]} seed={seedBase + 1} />
        </>
      );
    };

    const renderVariant = () => {
      switch (type) {
        case BuildingType.Residential:
          return renderResidential();
        case BuildingType.Commercial:
          return renderCommercial();
        case BuildingType.Industrial:
          return renderIndustrial();

        case BuildingType.Park: {
          const treeCount = 1 + Math.floor(hash * 3);
          const positions = [[-0.2, -0.2], [0.2, 0.2], [-0.2, 0.2], [0.2, -0.2]];
          return (
            <group position={[0, -yOffset - 0.29, 0]}>
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} geometry={tileSubPlaneGeo} material={getStdMat('#dce6d8')} />
              {Array.from({ length: treeCount }).map((_, i) => {
                const pos = positions[i % positions.length];
                const scale = 0.5 + getHash(x + i, y - i) * 0.45;
                const treeHex = '#' + tmpColor.set('#5f8564').offsetHSL(0, 0, getHash(x, y + i) * 0.12).getHexString();
                return (
                  <group key={i} position={[pos[0], 0, pos[1]]}>
                    <Tree x={x} y={y} i={i} scale={scale} treeColor={treeHex} weather={weather} />
                  </group>
                );
              })}
            </group>
          );
        }

        case BuildingType.ParkPlayground:
          return (
            <group position={[0, -yOffset - 0.29, 0]}>
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} geometry={tileSubPlaneGeo} material={getStdMat('#dce6d8')} />
              <group position={[-0.2, 0, -0.2]}>
                <mesh castShadow material={getStdMat('#b5573a')} geometry={cylinderGeo} position={[-0.1, 0.15, 0]} scale={[0.02, 0.3, 0.02]} rotation={[0, 0, -0.2]} />
                <mesh castShadow material={getStdMat('#b5573a')} geometry={cylinderGeo} position={[0.1, 0.15, 0]} scale={[0.02, 0.3, 0.02]} rotation={[0, 0, 0.2]} />
                <mesh castShadow material={getStdMat('#b5573a')} geometry={cylinderGeo} position={[0, 0.3, 0]} scale={[0.02, 0.3, 0.02]} rotation={[0, 0, Math.PI / 2]} />
                <mesh castShadow material={getStdMat('#d97757')} geometry={boxGeo} position={[0, 0.1, 0]} scale={[0.12, 0.02, 0.05]} />
              </group>
              <group position={[0.2, 0, 0.2]} rotation={[0, Math.PI / 4, 0]}>
                <mesh castShadow material={getStdMat('#eee5d3')} geometry={boxGeo} position={[0, 0.02, 0]} scale={[0.3, 0.05, 0.3]} />
                <mesh castShadow material={getStdMat('#d97757')} geometry={boxGeo} position={[0, 0.04, 0]} scale={[0.18, 0.02, 0.18]} />
              </group>
              <group position={[-0.3, 0, 0.3]}>
                <Tree x={x} y={y} i={0} scale={0.42} treeColor="#6f9172" isSphere weather={weather} />
              </group>
            </group>
          );

        case BuildingType.ParkFountain:
          return (
            <group position={[0, -yOffset - 0.29, 0]}>
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} geometry={tileSubPlaneGeo} material={getStdMat('#e2e0da')} />
              <mesh castShadow receiveShadow material={getStdMat('#d4d1c9')} geometry={cylinderGeo} position={[0, 0.05, 0]} scale={[0.5, 0.1, 0.5]} />
              <FountainWater />
              <mesh castShadow material={getStdMat('#faf9f5')} geometry={cylinderGeo} position={[0, 0.25, 0]} scale={[0.1, 0.4, 0.1]} />
              <mesh castShadow material={getStdMat('#d97757')} geometry={sphereGeo} position={[0, 0.5, 0]} scale={[0.14, 0.14, 0.14]} />
              {[0, 1, 2, 3].map((i) => (
                <mesh key={i} castShadow material={getStdMat('#52514e')} geometry={boxGeo} position={[Math.cos((i * Math.PI) / 2) * 0.35, 0.05, Math.sin((i * Math.PI) / 2) * 0.35]} scale={[0.15, 0.05, 0.05]} rotation={[0, (-i * Math.PI) / 2, 0]} />
              ))}
            </group>
          );

        case BuildingType.PowerPlant:
        case BuildingType.FireStation:
        case BuildingType.PoliceStation:
        case BuildingType.School:
        case BuildingType.Hospital:
          return (
            <ServiceBuildingMesh
              type={type}
              level={level}
              x={x}
              y={y}
              mainMat={mainMat}
              accentMat={accentMat}
              roofMat={roofMat}
              opacity={opacity}
              transparent={transparent}
              showEdges={showEdges}
            />
          );

        default:
          return null;
      }
    };

    return (
      <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
        <group ref={scaffoldingRef} visible={!transparent}>
          <Scaffolding height={0.55 + level * 0.28} />
        </group>
        <group ref={groupRef}>
          {isDamaged && (
            <group>
              <CrackDecal position={[0, 0.5, 0.45]} rotation={[0, 0, Math.PI / 4]} scale={0.4} />
              <CrackDecal position={[0.45, 0.3, 0]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={0.5} />
              <SmokeStack position={[0.1, 0.5, 0.1]} />
            </group>
          )}
          <mesh
            castShadow
            receiveShadow
            geometry={boxGeo}
            material={getStdMat('#cbc7bd', { roughness: 0.94, flatShading: true, opacity, transparent })}
            position={[0, 0.04, 0]}
            scale={[0.94, 0.08, 0.94]}
          />
          {level > 1 && (
            <group position={[0, 0.09, 0.45]}>
              <mesh
                scale={[0.55, 0.02, 0.04]}
                geometry={boxGeo}
                material={getBasicMat(level === 2 ? '#52514e' : '#d97757')}
              />
            </group>
          )}
          {renderVariant()}
        </group>
      </group>
    );
  },
);
