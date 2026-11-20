import '@react-three/fiber';
import * as THREE from 'three';
import { GRID_SIZE } from '../constants';
import { BuildingType } from '../types';

export const WORLD_OFFSET = GRID_SIZE / 2 - 0.5;
export const gridToWorld = (
  x: number,
  y: number,
  gridSize = GRID_SIZE,
): [number, number, number] => {
  const offset = gridSize / 2 - 0.5;
  return [x - offset, 0, y - offset];
};

export const getHash = (x: number, y: number): number =>
  Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

export const getRandomRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

// Shared Geometries
export const boxGeo = new THREE.BoxGeometry(1, 1, 1);
export const boxEdgesGeo = new THREE.EdgesGeometry(boxGeo);
export const planeGeo = new THREE.PlaneGeometry(1, 1);
export const tileSubPlaneGeo = new THREE.PlaneGeometry(0.92, 0.92);
export const groundTileGeo = new THREE.BoxGeometry(1, 0.5, 1);
export const pedBoxGeo = new THREE.BoxGeometry(0.06, 0.15, 0.06);
export const birdBoxGeo = new THREE.BoxGeometry(0.2, 0.05, 0.1);
export const roadLineGeo = new THREE.PlaneGeometry(0.08, 0.45);
export const roadCenterGeo = new THREE.PlaneGeometry(0.1, 0.1);
export const roadPatch1Geo = new THREE.PlaneGeometry(0.3, 0.2);
export const roadPatch2Geo = new THREE.PlaneGeometry(0.35, 0.2);
export const roadCrack1Geo = new THREE.PlaneGeometry(0.6, 0.025);
export const roadCrack2Geo = new THREE.PlaneGeometry(0.4, 0.02);
export const roadCrack3Geo = new THREE.PlaneGeometry(0.2, 0.02);
export const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
export const coneGeo = new THREE.ConeGeometry(1, 1, 4);
export const sphereGeo = new THREE.SphereGeometry(1, 8, 8);

export const tmpColor = new THREE.Color();
export const nightAmbientColor = new THREE.Color('#2c2a27');
export const dayAmbientColor = new THREE.Color();

export const inkEdgeMat = new THREE.LineBasicMaterial({
  color: '#1f1e1c',
  transparent: true,
  opacity: 0.55,
});

const staticStdMatCache: Record<string, THREE.MeshStandardMaterial> = {};
export const getStdMat = (
  color: string,
  opts: {
    flatShading?: boolean;
    transparent?: boolean;
    opacity?: number;
    roughness?: number;
    metalness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    depthWrite?: boolean;
  } = {},
): THREE.MeshStandardMaterial => {
  const key = `${color}-${opts.flatShading ? 1 : 0}-${opts.transparent ? 1 : 0}-${opts.opacity ?? 1}-${opts.roughness ?? ''}-${opts.metalness ?? ''}-${opts.emissive ?? ''}-${opts.emissiveIntensity ?? ''}-${opts.depthWrite ?? true}`;
  if (!staticStdMatCache[key]) {
    staticStdMatCache[key] = new THREE.MeshStandardMaterial({
      color,
      opacity: opts.opacity ?? 1,
      depthWrite: opts.depthWrite ?? true,
      roughness: opts.roughness ?? 0.88,
      metalness: opts.metalness ?? 0.03,
      ...(opts.flatShading !== undefined ? { flatShading: opts.flatShading } : {}),
      ...(opts.transparent !== undefined ? { transparent: opts.transparent } : {}),
      ...(opts.emissive !== undefined ? { emissive: opts.emissive } : {}),
      ...(opts.emissiveIntensity !== undefined
        ? { emissiveIntensity: opts.emissiveIntensity }
        : {}),
    });
  }
  return staticStdMatCache[key];
};

const staticBasicMatCache: Record<string, THREE.MeshBasicMaterial> = {};
export const getBasicMat = (
  color: string,
  opts: {
    transparent?: boolean;
    opacity?: number;
    depthWrite?: boolean;
    depthTest?: boolean;
    doubleSide?: boolean;
  } = {},
): THREE.MeshBasicMaterial => {
  const key = `${color}-${opts.transparent ? 1 : 0}-${opts.opacity ?? 1}-${opts.depthWrite ?? true}-${opts.depthTest ?? true}-${opts.doubleSide ? 1 : 0}`;
  if (!staticBasicMatCache[key]) {
    staticBasicMatCache[key] = new THREE.MeshBasicMaterial({
      color,
      opacity: opts.opacity ?? 1,
      depthWrite: opts.depthWrite ?? true,
      depthTest: opts.depthTest ?? true,
      ...(opts.transparent !== undefined ? { transparent: opts.transparent } : {}),
      ...(opts.doubleSide ? { side: THREE.DoubleSide } : {}),
    });
  }
  return staticBasicMatCache[key];
};

const makeWindowMat = (color = '#7a8086') =>
  new THREE.MeshStandardMaterial({
    color,
    emissive: '#fce5b0',
    emissiveIntensity: 0,
    roughness: 0.35,
    metalness: 0.25,
  });

export const windowMatA = makeWindowMat('#7d848b');
export const windowMatB = makeWindowMat('#70767d');
export const windowMatC = makeWindowMat('#8a9096');
export const windowMatDark = new THREE.MeshStandardMaterial({
  color: '#5a5955',
  roughness: 0.7,
  metalness: 0.1,
});
export const windowMaterial = windowMatA;

export const streetLampMaterial = new THREE.MeshStandardMaterial({
  color: '#fce5b0',
  emissive: '#fce5b0',
  emissiveIntensity: 0.0,
  roughness: 0.2,
});

export const headlightMaterial = new THREE.MeshStandardMaterial({
  color: '#fff8dc',
  emissive: '#fde68a',
  emissiveIntensity: 0,
  transparent: true,
  opacity: 0.25,
  roughness: 0.2,
});

export const pedBaseMat = getStdMat('#ffffff', { roughness: 0.9 });
export const birdMat = getBasicMat('#262523');
export const roadLineMat = getStdMat('#faf9f5', { roughness: 0.9 });
export const roadTireMat = getBasicMat('#1f1e1c', {
  transparent: true,
  opacity: 0.18,
});
export const roadCrackMat = getBasicMat('#292826', {
  transparent: true,
  opacity: 0.35,
});
export const roadWearMat = getBasicMat('#52514e', {
  transparent: true,
  opacity: 0.22,
});
export const roadPatchMat = getBasicMat('#62605b', {
  transparent: true,
  opacity: 0.28,
});
export const heatmapOverlayMat = getBasicMat('#ffffff', {
  transparent: true,
  opacity: 0.52,
  depthTest: false,
  doubleSide: true,
});

export interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
  level?: number;
  weather?: string;
  isDamaged?: boolean;
  showEdges?: boolean;
}

const materialCache: Record<string, THREE.MeshStandardMaterial> = {};

export const getCachedMaterial = (
  baseColor: string,
  hash: number,
  type: 'main' | 'accent' | 'roof',
  opacity: number,
  transparent: boolean,
  weather: string,
  level = 1,
  bType?: BuildingType,
): THREE.MeshStandardMaterial => {
  const bucket = Math.floor(hash * 5);
  const key = `${baseColor}-${bucket}-${type}-${opacity}-${transparent}-${weather}-${level}-${bType}`;

  if (!materialCache[key]) {
    const c = new THREE.Color(baseColor);
    c.offsetHSL(0, 0, bucket * 0.02 - 0.04);

    let matColor = c;
    if (bType === BuildingType.Commercial && level >= 2) {
      c.offsetHSL(0, 0, -level * 0.03);
    } else if (bType === BuildingType.Industrial && level >= 2) {
      c.offsetHSL(0, 0, -level * 0.025);
    }

    if (type === 'accent') {
      matColor = new THREE.Color(c).multiplyScalar(0.84);
    }
    if (type === 'roof') {
      if (weather === 'snowy') {
        matColor = new THREE.Color('#faf9f5');
      } else if (bType === BuildingType.Residential) {
        matColor = new THREE.Color('#d97757');
      } else {
        matColor = new THREE.Color(c).multiplyScalar(0.76);
      }
    }

    const roughness = weather === 'rainy' ? 0.58 : 0.92;
    const metalness = weather === 'rainy' ? 0.08 : 0.02;

    materialCache[key] = new THREE.MeshStandardMaterial({
      color: matColor,
      flatShading: true,
      opacity,
      transparent,
      roughness,
      metalness,
    });
  }
  return materialCache[key];
};
