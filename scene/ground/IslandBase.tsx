import React, { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GRID_SIZE } from '../../constants';
import { boxGeo, getStdMat } from '../shared';

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uHalfIsland;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uFoam;
  varying vec3 vWorldPos;

  void main() {
    float edgeDist = max(abs(vWorldPos.x), abs(vWorldPos.z));
    float coast = max(0.0, edgeDist - uHalfIsland);

    float waveA = sin(vWorldPos.x * 1.15 + uTime * 1.1 + cos(vWorldPos.z * 0.7) * 0.8);
    float waveB = cos(vWorldPos.z * 0.95 - uTime * 0.85);
    float ripple = (waveA + waveB) * 0.5;

    float depthBlend = clamp(coast / 14.0, 0.0, 1.0);
    vec3 color = mix(uShallow, uDeep, depthBlend);

    float contour = smoothstep(0.84, 0.96, ripple);
    color = mix(color, uFoam, contour * 0.35);

    float shoreRing = 1.0 - smoothstep(0.0, 0.95, abs(coast - 0.35 - sin(uTime * 1.3 + vWorldPos.x) * 0.08));
    color = mix(color, uFoam, clamp(shoreRing, 0.0, 1.0) * 0.65);

    gl_FragColor = vec4(color, 0.94);
  }
`;

export const IslandBase: React.FC<{ weather: string; gridSize?: number }> = ({
  weather,
  gridSize = GRID_SIZE,
}) => {
  const deckMat = useMemo(
    () =>
      getStdMat(weather === 'snowy' ? '#f2f4f7' : '#eae6dc', {
        roughness: 0.95,
      }),
    [weather],
  );
  const rimMat = useMemo(
    () =>
      getStdMat(weather === 'snowy' ? '#dfe5eb' : '#ddd5c3', {
        roughness: 0.95,
      }),
    [weather],
  );
  const lipMat = useMemo(() => getStdMat('#2d2b28', { roughness: 1 }), []);

  const waterMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uHalfIsland: { value: (GRID_SIZE + 0.9) / 2 },
          uShallow: { value: new THREE.Color('#e2eaee') },
          uDeep: { value: new THREE.Color('#cfdbe2') },
          uFoam: { value: new THREE.Color('#faf9f5') },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      }),
    [],
  );

  useEffect(() => {
    waterMat.uniforms.uHalfIsland.value = (gridSize + 0.9) / 2;
  }, [gridSize, waterMat]);

  useEffect(() => {
    if (weather === 'snowy') {
      waterMat.uniforms.uShallow.value.set('#e5ecf0');
      waterMat.uniforms.uDeep.value.set('#d4dfe6');
    } else if (weather === 'rainy') {
      waterMat.uniforms.uShallow.value.set('#ced8df');
      waterMat.uniforms.uDeep.value.set('#b8c6d0');
    } else {
      waterMat.uniforms.uShallow.value.set('#e2eaee');
      waterMat.uniforms.uDeep.value.set('#cddae1');
    }
  }, [weather, waterMat]);

  useEffect(() => {
    return () => {
      waterMat.dispose();
    };
  }, [waterMat]);

  useFrame((_, delta) => {
    const speed = weather === 'rainy' ? 1.5 : 1.0;
    waterMat.uniforms.uTime.value += delta * speed;
  });

  return (
    <group raycast={() => null}>
      <mesh
        position={[0, -0.78, 0]}
        scale={[gridSize + 0.4, 0.56, gridSize + 0.4]}
        geometry={boxGeo}
        material={deckMat}
        receiveShadow
      />
      <mesh
        position={[0, -0.92, 0]}
        scale={[gridSize + 0.9, 0.36, gridSize + 0.9]}
        geometry={boxGeo}
        material={rimMat}
        receiveShadow
      />
      <mesh
        position={[0, -1.08, 0]}
        scale={[gridSize + 1.05, 0.08, gridSize + 1.05]}
        geometry={boxGeo}
        material={lipMat}
      />
      <mesh
        position={[0, -0.56, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={waterMat}
        receiveShadow
      >
        <planeGeometry args={[220, 220, 1, 1]} />
      </mesh>
    </group>
  );
};
