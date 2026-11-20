import { BuildingType, Grid } from '../types';

export const SERVICE_BUILDING_TYPES = new Set<BuildingType>([
  BuildingType.PowerPlant,
  BuildingType.FireStation,
  BuildingType.PoliceStation,
  BuildingType.School,
  BuildingType.Hospital,
]);

const ROAD_DEPENDENT_TYPES = new Set<BuildingType>([
  BuildingType.Residential,
  BuildingType.Commercial,
  BuildingType.Industrial,
  BuildingType.ParkPlayground,
  BuildingType.ParkFountain,
  ...SERVICE_BUILDING_TYPES,
]);

export interface ConnectivityResult {
  mainRoads: Set<string>;
  disconnectedTiles: Set<string>;
}

export const computeRoadConnectivity = (grid: Grid): ConnectivityResult => {
  const height = grid.length;
  const width = height > 0 ? grid[0].length : 0;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  const visited = new Set<string>();
  let mainRoads = new Set<string>();
  let bestCenterDist = Infinity;

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].buildingType !== BuildingType.Road) continue;
      const startKey = `${x},${y}`;
      if (visited.has(startKey)) continue;

      const component = new Set<string>([startKey]);
      const queue: [number, number][] = [[x, y]];
      visited.add(startKey);
      let minDist = Math.abs(x - centerX) + Math.abs(y - centerY);

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        for (const [dx, dy] of dirs) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
          if (grid[ny][nx].buildingType !== BuildingType.Road) continue;
          const nKey = `${nx},${ny}`;
          if (visited.has(nKey)) continue;
          visited.add(nKey);
          component.add(nKey);
          queue.push([nx, ny]);
          const dist = Math.abs(nx - centerX) + Math.abs(ny - centerY);
          if (dist < minDist) minDist = dist;
        }
      }

      if (
        component.size > mainRoads.size ||
        (component.size === mainRoads.size && minDist < bestCenterDist)
      ) {
        mainRoads = component;
        bestCenterDist = minDist;
      }
    }
  }

  const disconnectedTiles = new Set<string>();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bType = grid[y][x].buildingType;
      if (!ROAD_DEPENDENT_TYPES.has(bType)) continue;

      let connected = false;
      for (let dy = -1; dy <= 1 && !connected; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (mainRoads.has(`${x + dx},${y + dy}`)) {
            connected = true;
            break;
          }
        }
      }

      if (!connected) {
        disconnectedTiles.add(`${x},${y}`);
      }
    }
  }

  return { mainRoads, disconnectedTiles };
};
