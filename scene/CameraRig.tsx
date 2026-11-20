import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MapControls } from '@react-three/drei';
import * as THREE from 'three';
import { GRID_SIZE } from '../constants';

const EDGE_MARGIN_PX = 16;
const PAN_SPEED = 8;
const UP_AXIS = new THREE.Vector3(0, 1, 0);

interface CameraRigProps {
  rotateTrigger: { dir: -1 | 1; seq: number } | null;
  gridSize?: number;
  controlsEnabled?: boolean;
}

export const CameraRig: React.FC<CameraRigProps> = ({
  rotateTrigger,
  gridSize = GRID_SIZE,
  controlsEnabled = true,
}) => {
  const controlsRef = useRef<React.ComponentRef<typeof MapControls>>(null);
  const { camera, gl } = useThree();
  const pendingYawRef = useRef(0);
  const pointerPosRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const offsetVec = useRef(new THREE.Vector3()).current;
  const forwardVec = useRef(new THREE.Vector3()).current;
  const rightVec = useRef(new THREE.Vector3()).current;

  const panLimit = Math.max(9, gridSize * 0.65);
  const minZoom = Math.max(12, 20 - (gridSize - 15) * 0.45);

  useEffect(() => {
    if (!rotateTrigger) return;
    pendingYawRef.current += rotateTrigger.dir * (Math.PI / 2);
  }, [rotateTrigger]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key === 'q' || e.key === 'Q') {
        pendingYawRef.current -= Math.PI / 2;
      } else if (e.key === 'e' || e.key === 'E') {
        pendingYawRef.current += Math.PI / 2;
      }
    };

    const el = gl.domElement;
    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointerPosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    const onPointerLeave = () => {
      pointerPosRef.current.active = false;
    };

    window.addEventListener('keydown', onKeyDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    let dirty = false;

    if (Math.abs(pendingYawRef.current) > 0.0005) {
      const step = pendingYawRef.current * Math.min(1, delta * 10);
      const actualStep =
        Math.abs(pendingYawRef.current) < 0.004 ? pendingYawRef.current : step;
      pendingYawRef.current -= actualStep;
      offsetVec.copy(camera.position).sub(controls.target);
      offsetVec.applyAxisAngle(UP_AXIS, actualStep);
      camera.position.copy(controls.target).add(offsetVec);
      dirty = true;
    }

    const ptr = pointerPosRef.current;
    if (ptr.active && typeof document !== 'undefined' && !document.hidden) {
      const w = gl.domElement.clientWidth;
      const h = gl.domElement.clientHeight;
      let moveX = 0;
      let moveY = 0;

      if (ptr.x < EDGE_MARGIN_PX) moveX = -1;
      else if (ptr.x > w - EDGE_MARGIN_PX) moveX = 1;
      if (ptr.y < EDGE_MARGIN_PX) moveY = -1;
      else if (ptr.y > h - EDGE_MARGIN_PX) moveY = 1;

      if (moveX !== 0 || moveY !== 0) {
        camera.getWorldDirection(forwardVec);
        forwardVec.y = 0;
        if (forwardVec.lengthSq() > 0) forwardVec.normalize();
        rightVec.crossVectors(forwardVec, UP_AXIS).normalize();

        const dt = Math.min(0.05, delta) * PAN_SPEED;
        offsetVec
          .set(0, 0, 0)
          .addScaledVector(rightVec, moveX * dt)
          .addScaledVector(forwardVec, -moveY * dt);

        const nextX = THREE.MathUtils.clamp(
          controls.target.x + offsetVec.x,
          -panLimit,
          panLimit,
        );
        const nextZ = THREE.MathUtils.clamp(
          controls.target.z + offsetVec.z,
          -panLimit,
          panLimit,
        );
        const appliedX = nextX - controls.target.x;
        const appliedZ = nextZ - controls.target.z;
        controls.target.x += appliedX;
        controls.target.z += appliedZ;
        camera.position.x += appliedX;
        camera.position.z += appliedZ;
        dirty = true;
      }
    }

    if (dirty) {
      controls.update();
    }
  });

  return (
    <MapControls
      ref={controlsRef}
      enabled={controlsEnabled}
      enableRotate
      enableZoom
      minZoom={minZoom}
      maxZoom={120}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={0.1}
      target={[0, -0.5, 0]}
    />
  );
};
