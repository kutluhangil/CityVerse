import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { TICK_RATE_MS } from '../../constants';
import { GLOBAL_TIME_STEP } from '../../sim/tick';
import {
  dayAmbientColor,
  headlightMaterial,
  nightAmbientColor,
  streetLampMaterial,
  windowMatA,
  windowMatB,
  windowMatC,
} from '../shared';

const bgDayColor = new THREE.Color('#f9f9f7');
const bgRainColor = new THREE.Color('#e4eaed');
const bgSnowColor = new THREE.Color('#eff2f5');
const bgDuskColor = new THREE.Color('#eedcd0');
const bgNightColor = new THREE.Color('#232220');
const activeBgColor = new THREE.Color('#f9f9f7');

interface DayNightSystemProps {
  weather: string;
  globalTime: number;
  gameSpeed: number;
  gameStarted: boolean;
  shadows?: boolean;
  shadowMapSize?: number;
}

export const DayNightSystem: React.FC<DayNightSystemProps> = ({
  weather,
  globalTime,
  gameSpeed,
  gameStarted,
  shadows = true,
  shadowMapSize = 1024,
}) => {
  const { scene } = useThree();
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const displayTimeRef = useRef(globalTime);

  useFrame((_, delta) => {
    if (gameStarted) {
      const rate = (GLOBAL_TIME_STEP / (TICK_RATE_MS / 1000)) * gameSpeed;
      displayTimeRef.current += delta * rate;
      const drift = globalTime - displayTimeRef.current;
      if (Math.abs(drift) > GLOBAL_TIME_STEP * 2) {
        displayTimeRef.current = globalTime;
      } else {
        displayTimeRef.current += drift * Math.min(1, delta * 2);
      }
    }

    const time = displayTimeRef.current;
    const sunAngle = time % (Math.PI * 2);
    const sunY = Math.sin(sunAngle);
    const dayBlend = Math.max(0, Math.min(1, (sunY + 0.2) / 0.4));
    const nightBlend = 1 - dayBlend;
    const duskWeight = Math.max(0, 1 - Math.abs(dayBlend - 0.5) * 2.4);

    const dayTarget =
      weather === 'rainy'
        ? bgRainColor
        : weather === 'snowy'
          ? bgSnowColor
          : bgDayColor;

    activeBgColor.lerpColors(bgNightColor, dayTarget, dayBlend);
    if (duskWeight > 0.05) {
      activeBgColor.lerp(bgDuskColor, duskWeight * 0.45);
    }

    if (scene.background instanceof THREE.Color) {
      scene.background.copy(activeBgColor);
    }
    if (fogRef.current) {
      fogRef.current.color.copy(activeBgColor);
    }

    if (dirLightRef.current) {
      dirLightRef.current.position.x = Math.cos(sunAngle) * 28;
      dirLightRef.current.position.y = Math.max(8, sunY * 26);
      dirLightRef.current.position.z = Math.sin(sunAngle) * 14 + 10;

      let maxIntensity = 1.65;
      if (weather === 'rainy') maxIntensity = 0.95;
      if (weather === 'snowy') maxIntensity = 1.1;
      dirLightRef.current.intensity = 0.25 + dayBlend * maxIntensity;

      windowMatA.emissiveIntensity =
        nightBlend > 0.15 ? nightBlend * 1.4 : 0;
      windowMatB.emissiveIntensity =
        nightBlend > 0.35
          ? nightBlend * (1.25 + Math.sin(time * 9) * 0.12)
          : 0;
      windowMatC.emissiveIntensity =
        nightBlend > 0.55
          ? nightBlend * (1.1 + Math.cos(time * 7) * 0.1)
          : 0;

      streetLampMaterial.emissiveIntensity =
        nightBlend > 0.15
          ? nightBlend * (2.1 + Math.sin(time * 12) * 0.15)
          : 0;
      streetLampMaterial.color.setHex(nightBlend > 0.45 ? 0xfce5b0 : 0x87867f);

      headlightMaterial.emissiveIntensity =
        nightBlend > 0.2 ? nightBlend * 1.6 : 0;
      headlightMaterial.opacity = 0.12 + nightBlend * 0.4;

      if (ambientLightRef.current) {
        ambientLightRef.current.intensity = 0.45 * nightBlend + 0.8 * dayBlend;
        let dayHex = 0xfaf6ee;
        if (weather === 'rainy') dayHex = 0xdbe3e8;
        else if (weather === 'snowy') dayHex = 0xeaf0f6;

        dayAmbientColor.setHex(dayHex);
        ambientLightRef.current.color.lerpColors(
          nightAmbientColor,
          dayAmbientColor,
          dayBlend,
        );
      }
    }
  });

  return (
    <group>
      <color attach="background" args={['#f9f9f7']} />
      <fog ref={fogRef} attach="fog" args={['#f9f9f7', 42, 115]} />
      <hemisphereLight args={['#fffdf8', '#ded7ca', 0.75]} />
      <ambientLight ref={ambientLightRef} intensity={0.8} color="#faf6ee" />
      <directionalLight
        ref={dirLightRef}
        castShadow={shadows}
        position={[18, 22, 14]}
        intensity={1.7}
        color="#fffaf0"
        shadow-bias={-0.0005}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
    </group>
  );
};
