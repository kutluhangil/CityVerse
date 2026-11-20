import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, SoftShadows } from '@react-three/drei';
import { Bloom, EffectComposer, N8AO } from '@react-three/postprocessing';
import { BUILDINGS } from '../constants';
import { computeRoadConnectivity } from '../sim/connectivity';
import {
  BuildingType,
  DataOverlayMode,
  FloatingTextEvent,
  GraphicsQuality,
  Grid,
  MilestoneTier,
} from '../types';
import { CameraRig } from '../scene/CameraRig';
import { DustCloud } from '../scene/buildings/DustCloud';
import { ProceduralBuilding } from '../scene/buildings/ProceduralBuilding';
import { GRAPHICS_PRESETS } from '../scene/graphics';
import { FloatingIncome } from '../scene/ground/FloatingIncome';
import {
  Cursor,
  DisconnectedBadge,
  GroundTile,
  HeatmapOverlay,
} from '../scene/ground/GroundTile';
import { IslandBase } from '../scene/ground/IslandBase';
import { PlacementPreview } from '../scene/ground/PlacementPreview';
import { DayNightSystem } from '../scene/lighting/DayNightSystem';
import { gridToWorld } from '../scene/shared';
import { PedestrianSystem } from '../scene/traffic/PedestrianSystem';
import { TrafficSystem } from '../scene/traffic/TrafficSystem';
import {
  BirdSystem,
  EnvironmentEffects,
} from '../scene/weather/WeatherEffects';

const PAINTABLE_TOOLS = new Set<BuildingType>([
  BuildingType.Road,
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.Park,
  BuildingType.ParkPlayground,
  BuildingType.ParkFountain,
  BuildingType.Demolish,
]);

interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number, isDrag?: boolean) => void;
  onStrokeStart?: () => void;
  hoveredTool: BuildingType;
  population: number;
  money: number;
  milestoneTier: MilestoneTier;
  weather?: string;
  maxCars?: number;
  demolishedTiles?: {
    x: number;
    y: number;
    id: number;
    type?: BuildingType;
    level?: number;
    color?: string;
  }[];
  gameSpeed?: number;
  globalTime?: number;
  dataMode: DataOverlayMode;
  gameStarted: boolean;
  graphicsQuality: GraphicsQuality;
  floatingEvents: FloatingTextEvent[];
  rotateTrigger: { dir: -1 | 1; seq: number } | null;
  photoMode: boolean;
}

const IsoMap: React.FC<IsoMapProps> = ({
  grid,
  onTileClick,
  onStrokeStart,
  hoveredTool,
  population,
  money,
  milestoneTier,
  weather = 'sunny',
  maxCars = 6,
  demolishedTiles = [],
  gameSpeed = 1,
  globalTime = 0,
  dataMode,
  gameStarted,
  graphicsQuality,
  floatingEvents,
  rotateTrigger,
  photoMode,
}) => {
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isPainting, setIsPainting] = useState(false);
  const isPaintingRef = useRef(false);
  const paintedTilesRef = useRef(new Set<string>());
  const preset = GRAPHICS_PRESETS[graphicsQuality];
  const gridSize = grid.length;

  const stopPainting = useCallback(() => {
    if (!isPaintingRef.current) return;
    isPaintingRef.current = false;
    setIsPainting(false);
    paintedTilesRef.current.clear();
  }, []);

  useEffect(() => {
    window.addEventListener('pointerup', stopPainting);
    window.addEventListener('pointercancel', stopPainting);
    return () => {
      window.removeEventListener('pointerup', stopPainting);
      window.removeEventListener('pointercancel', stopPainting);
    };
  }, [stopPainting]);

  const connectivity = useMemo(() => computeRoadConnectivity(grid), [grid]);
  const disconnectedCoords = useMemo(
    () =>
      Array.from(connectivity.disconnectedTiles).map((key) => {
        const [dx, dy] = key.split(',').map(Number);
        return { key, x: dx, y: dy };
      }),
    [connectivity],
  );

  const handleTilePointerDown = useCallback(
    (x: number, y: number) => {
      if (dataMode === 'none' && !photoMode && PAINTABLE_TOOLS.has(hoveredTool)) {
        onStrokeStart?.();
        paintedTilesRef.current = new Set([`${x},${y}`]);
        isPaintingRef.current = true;
        setIsPainting(true);
      }
      onTileClick(x, y, false);
    },
    [dataMode, photoMode, hoveredTool, onStrokeStart, onTileClick],
  );

  const handleHover = useCallback(
    (x: number, y: number) => {
      setHoveredTile({ x, y });
      if (
        isPaintingRef.current &&
        dataMode === 'none' &&
        !photoMode &&
        PAINTABLE_TOOLS.has(hoveredTool)
      ) {
        const key = `${x},${y}`;
        if (!paintedTilesRef.current.has(key)) {
          paintedTilesRef.current.add(key);
          onTileClick(x, y, true);
        }
      }
    },
    [dataMode, photoMode, hoveredTool, onTileClick],
  );

  const handleLeave = useCallback(() => {
    setHoveredTile(null);
  }, []);

  const showOverlayTools = !photoMode && dataMode === 'none';

  return (
    <div className="absolute inset-0 bg-bg touch-none">
      <Canvas
        shadows={preset.shadows}
        dpr={preset.dpr}
        gl={{ antialias: true }}
      >
        <OrthographicCamera
          makeDefault
          zoom={45}
          position={[20, 20, 20]}
          near={-100}
          far={240}
        />

        <CameraRig
          rotateTrigger={rotateTrigger}
          gridSize={gridSize}
          controlsEnabled={!isPainting}
        />

        <DayNightSystem
          weather={weather}
          globalTime={globalTime}
          gameSpeed={gameSpeed}
          gameStarted={gameStarted}
          shadows={preset.shadows}
          shadowMapSize={preset.shadowMapSize}
        />
        <EnvironmentEffects
          weather={weather}
          grid={grid}
          particleScale={preset.particleScale}
        />
        <IslandBase weather={weather} gridSize={gridSize} />

        <group>
          {grid.map((row, y) =>
            row.map((tile, x) => {
              const [wx, _wy, wz] = gridToWorld(x, y, gridSize);
              return (
                <React.Fragment key={`${x}-${y}`}>
                  <GroundTile
                    type={tile.buildingType}
                    terrain={tile.terrain}
                    x={x}
                    y={y}
                    grid={grid}
                    weather={weather}
                    showEdges={preset.edges}
                    onHover={handleHover}
                    onLeave={handleLeave}
                    onClick={handleTilePointerDown}
                  />
                  <group position={[wx, 0, wz]} raycast={() => null}>
                    {tile.buildingType !== BuildingType.None &&
                      tile.buildingType !== BuildingType.Road && (
                        <ProceduralBuilding
                          type={tile.buildingType}
                          baseColor={BUILDINGS[tile.buildingType].color}
                          x={x}
                          y={y}
                          level={tile.level || 1}
                          weather={weather}
                          isDamaged={tile.isDamaged}
                          showEdges={preset.edges}
                        />
                      )}
                  </group>
                </React.Fragment>
              );
            }),
          )}

          <group raycast={() => null}>
            <TrafficSystem grid={grid} maxCars={maxCars} weather={weather} />
            <PedestrianSystem
              grid={grid}
              maxPeds={Math.min(100, Math.max(10, population / 2))}
            />
            <BirdSystem />
            <HeatmapOverlay
              grid={grid}
              mode={dataMode}
              disconnectedTiles={connectivity.disconnectedTiles}
            />
            {disconnectedCoords.map((d) => (
              <DisconnectedBadge
                key={d.key}
                x={d.x}
                y={d.y}
                gridSize={gridSize}
              />
            ))}
            <FloatingIncome events={floatingEvents} gridSize={gridSize} />
            {demolishedTiles.map((dt) => (
              <DustCloud
                key={dt.id}
                x={dt.x}
                y={dt.y}
                gridSize={gridSize}
                type={dt.type}
                level={dt.level}
                color={dt.color}
              />
            ))}

            {showOverlayTools && hoveredTile && (
              <>
                <PlacementPreview
                  hoveredTile={hoveredTile}
                  hoveredTool={hoveredTool}
                  grid={grid}
                  money={money}
                  milestoneTier={milestoneTier}
                  weather={weather}
                  showEdges={preset.edges}
                />
                <Cursor
                  x={hoveredTile.x}
                  y={hoveredTile.y}
                  gridSize={gridSize}
                  color={
                    hoveredTool === BuildingType.Demolish ? '#c44536' : '#141413'
                  }
                />
              </>
            )}
          </group>
        </group>

        {preset.softShadows && <SoftShadows size={15} samples={10} focus={0.5} />}

        {(preset.ao || preset.bloom) && (
          <EffectComposer autoClear={false}>
            {preset.ao && (
              <N8AO halfRes color="#141413" aoRadius={1.3} intensity={1.5} />
            )}
            {preset.bloom && (
              <Bloom
                luminanceThreshold={1.2}
                mipmapBlur
                luminanceSmoothing={0.05}
                intensity={0.65}
              />
            )}
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
};

export default IsoMap;
