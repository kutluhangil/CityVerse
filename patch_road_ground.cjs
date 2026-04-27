const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetGT = `  // Calculate proximity to constructed tiles
  let nearConstruction = false;
  if (type === BuildingType.None) {
      for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                  if (grid[ny][nx].buildingType !== BuildingType.None) {
                      nearConstruction = true;
                  }
              }
          }
      }
  }

  if (type === BuildingType.None) {
    const noise = getHash(x, y);
    if (weather === 'snowy') {
       color = nearConstruction ? '#e2e8f0' : '#f8fafc';
    } else {
       if (nearConstruction) {
          color = noise > 0.5 ? '#15803d' : '#166534'; // darker/flatter near buildings
       } else {
          color = noise > 0.7 ? '#059669' : noise > 0.3 ? '#10b981' : '#34d399';
       }
    }
    topY = nearConstruction ? -0.3 : -0.3 - noise * 0.12; // Flatter near construction, bumpier otherwise
  }`;

const replacementGT = `  let nearTypes = new Set<BuildingType>();
  if (type === BuildingType.None) {
      for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                  const bType = grid[ny][nx].buildingType;
                  if (bType !== BuildingType.None && bType !== BuildingType.Road) {
                      nearTypes.add(bType);
                  }
              }
          }
      }
  }

  if (type === BuildingType.None) {
      const noise = getHash(x, y);
      if (weather === 'snowy') {
         color = nearTypes.size > 0 ? '#e2e8f0' : '#f8fafc';
      } else {
         if (nearTypes.has(BuildingType.Industrial)) {
             color = noise > 0.5 ? '#71717a' : '#52525b'; // grayish dead ground
         } else if (nearTypes.has(BuildingType.Park) || nearTypes.has(BuildingType.ParkFountain) || nearTypes.has(BuildingType.ParkPlayground)) {
             color = noise > 0.5 ? '#4ade80' : '#22c55e'; // vibrant green
         } else if (nearTypes.size > 0) {
             color = noise > 0.5 ? '#15803d' : '#166534'; // generic construction near
         } else {
             color = noise > 0.7 ? '#059669' : noise > 0.3 ? '#10b981' : '#34d399';
         }
      }
      topY = nearTypes.size > 0 ? -0.3 : -0.3 - noise * 0.12;
  }`;

content = content.replace(targetGT, replacementGT);

const targetRM = `const RoadMarkings = React.memo(({ x, y, grid, yOffset }: { x: number; y: number; grid: Grid; yOffset: number }) => {
  const lineMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbbf24' }), []);
  const lineGeo = useMemo(() => new THREE.PlaneGeometry(0.1, 0.5), []);`;

const replacementRM = `const RoadMarkings = React.memo(({ x, y, grid, yOffset }: { x: number; y: number; grid: Grid; yOffset: number }) => {
  const lineMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbbf24' }), []);
  const lineGeo = useMemo(() => new THREE.PlaneGeometry(0.1, 0.5), []);
  const tireMarkMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#111827', transparent: true, opacity: 0.3 }), []);
  const crackMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#1f2937', transparent: true, opacity: 0.5 }), []);
  const hash = getHash(x, y);`;

content = content.replace(targetRM, replacementRM);

const targetRMBottom = `      {hasRight && <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
      
      {connections >= 3 && <group rotation={[Math.PI / 2, 0, 0]}><TrafficLight x={x} y={y} /></group>}
    </group>
  );`;

const replacementRMBottom = `      {hasRight && <mesh position={[0.25, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={lineGeo} material={lineMaterial} />}
      
      {connections >= 3 && (
         <group>
             <mesh position={[0,0,0.01]} material={tireMarkMaterial}>
                <ringGeometry args={[0.1, 0.3, 16, 1, 0, Math.PI * 2 * hash ]} />
             </mesh>
             <mesh position={[0,0,0.015]} material={tireMarkMaterial}>
                <ringGeometry args={[0.2, 0.25, 16, 1, Math.PI * hash, Math.PI * 1.5 ]} />
             </mesh>
         </group>
      )}
      {connections === 2 && hash > 0.6 && (
         <mesh position={[0, 0, 0.01]} material={crackMaterial} rotation={[0, 0, hash * Math.PI]}>
             <planeGeometry args={[0.6, 0.03]} />
         </mesh>
      )}
      {connections === 2 && hash < 0.2 && (
         <mesh position={[0, 0, 0.012]} material={crackMaterial} rotation={[0, 0, hash * -Math.PI]}>
             <planeGeometry args={[0.4, 0.02]} />
             <mesh position={[0.1, 0.1, 0]} rotation={[0, 0, Math.PI/4]}>
                <planeGeometry args={[0.2, 0.02]} />
             </mesh>
         </mesh>
      )}

      {connections >= 3 && <group rotation={[Math.PI / 2, 0, 0]}><TrafficLight x={x} y={y} /></group>}
    </group>
  );`;

content = content.replace(targetRMBottom, replacementRMBottom);

fs.writeFileSync(path, content);
console.log("Ground and road textures patched");
