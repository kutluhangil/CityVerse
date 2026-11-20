import React, { useMemo } from 'react';
import { Float, Html } from '@react-three/drei';
import { BUILDINGS, FOREST_CLEAR_COST } from '../../constants';
import { isPlaceableBuilding, validatePlacement, validateUpgrade } from '../../sim/placement';
import { getRepairCost } from '../../sim/refund';
import { BuildingType, Grid, MilestoneTier } from '../../types';
import { ProceduralBuilding } from '../buildings/ProceduralBuilding';
import { getBasicMat, gridToWorld, planeGeo } from '../shared';

interface PlacementPreviewProps {
  hoveredTile: { x: number; y: number } | null;
  hoveredTool: BuildingType;
  grid: Grid;
  money: number;
  milestoneTier: MilestoneTier;
  weather: string;
  showEdges: boolean;
}

export const PlacementPreview: React.FC<PlacementPreviewProps> = ({
  hoveredTile,
  hoveredTool,
  grid,
  money,
  milestoneTier,
  weather,
  showEdges,
}) => {
  const status = useMemo(() => {
    if (!hoveredTile) return null;
    const { x, y } = hoveredTile;
    const tile = grid[y]?.[x];
    if (!tile) return null;

    if (hoveredTool === BuildingType.Upgrade) {
      if (tile.buildingType === BuildingType.None) return null;
      if (tile.isDamaged) {
        const repairCost = getRepairCost(tile);
        return {
          valid: money >= repairCost,
          label:
            money >= repairCost
              ? `Repair · -$${repairCost}`
              : `Need $${repairCost} to repair`,
          showGhost: false,
        };
      }
      const check = validateUpgrade(tile, money);
      if (check.ok) {
        return { valid: true, label: `Upgrade · -$${check.cost}`, showGhost: false };
      }
      const msg = 'reason' in check && check.reason ? check.reason : 'Cannot upgrade tile.';
      return { valid: false, label: msg, showGhost: false };
    }

    if (hoveredTool === BuildingType.Demolish) {
      if (tile.buildingType !== BuildingType.None) {
        const cost = BUILDINGS[BuildingType.Demolish].cost;
        return {
          valid: money >= cost,
          label: money >= cost ? `Demolish · -$${cost}` : `Need $${cost} to demolish`,
          showGhost: false,
        };
      }
      if (tile.terrain === 'forest') {
        return {
          valid: money >= FOREST_CLEAR_COST,
          label:
            money >= FOREST_CLEAR_COST
              ? `Clear Forest · -$${FOREST_CLEAR_COST}`
              : `Need $${FOREST_CLEAR_COST} to clear forest`,
          showGhost: false,
        };
      }
      return null;
    }

    if (!isPlaceableBuilding(hoveredTool)) return null;

    const check = validatePlacement(
      grid,
      x,
      y,
      hoveredTool,
      money,
      milestoneTier,
    );
    if (check.ok) {
      return {
        valid: true,
        label: `${BUILDINGS[hoveredTool].name} · -$${check.cost}`,
        showGhost: tile.buildingType === BuildingType.None,
      };
    }

    const msg = 'reason' in check && check.reason ? check.reason : 'Unavailable';
    return {
      valid: false,
      label: msg,
      showGhost: tile.buildingType === BuildingType.None,
    };
  }, [hoveredTile, hoveredTool, grid, money, milestoneTier]);

  const radius = BUILDINGS[hoveredTool]?.serviceRadius ?? 0;
  const gridSize = grid.length;
  const radiusTiles = useMemo(() => {
    if (!hoveredTile || radius <= 0) return [];
    const list: [number, number, number][] = [];
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > radius) continue;
        const nx = hoveredTile.x + dx;
        const ny = hoveredTile.y + dy;
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
          const [wx, _wy, wz] = gridToWorld(nx, ny, gridSize);
          list.push([wx, -0.255, wz]);
        }
      }
    }
    return list;
  }, [hoveredTile, radius, gridSize]);

  if (!hoveredTile) return null;
  const [px, _py, pz] = gridToWorld(hoveredTile.x, hoveredTile.y, gridSize);
  const validColor = status?.valid ? '#4d7c5a' : '#c44536';
  const radiusMat = getBasicMat(status?.valid === false ? '#c44536' : '#d97757', {
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
    doubleSide: true,
  });

  return (
    <group raycast={() => null}>
      {radiusTiles.map((pos, idx) => (
        <mesh
          key={idx}
          position={pos}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={planeGeo}
          material={radiusMat}
          scale={[0.94, 0.94, 1]}
        />
      ))}

      {status && (
        <>
          <mesh
            position={[px, -0.245, pz]}
            rotation={[-Math.PI / 2, 0, 0]}
            geometry={planeGeo}
            material={getBasicMat(validColor, {
              transparent: true,
              opacity: 0.36,
              depthWrite: false,
              doubleSide: true,
            })}
          />
          {status.showGhost && (
            <group position={[px, 0, pz]}>
              <Float
                speed={3}
                rotationIntensity={0}
                floatIntensity={0.08}
                floatingRange={[0, 0.08]}
              >
                <ProceduralBuilding
                  type={hoveredTool}
                  baseColor={status.valid ? BUILDINGS[hoveredTool].color : '#c44536'}
                  x={hoveredTile.x}
                  y={hoveredTile.y}
                  transparent
                  opacity={status.valid ? 0.72 : 0.52}
                  level={1}
                  weather={weather}
                  showEdges={showEdges}
                />
              </Float>
            </group>
          )}

          <Html position={[px, 1.35, pz]} center style={{ pointerEvents: 'none' }}>
            <div
              className="px-2 py-1 rounded border text-[10px] font-mono font-bold whitespace-nowrap shadow-sm"
              style={{
                backgroundColor: '#ffffff',
                color: status.valid ? '#141413' : '#c44536',
                borderColor: status.valid ? '#141413' : '#c44536',
                boxShadow: '2px 2px 0 #141413',
              }}
            >
              {status.label}
            </div>
          </Html>
        </>
      )}
    </group>
  );
};
