const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update getCachedMaterial
const oldCacheParams = `const getCachedMaterial = (baseColor: string, hash: number, type: 'main' | 'accent' | 'roof', opacity: number, transparent: boolean) => {
    // Quantize hash to 5 buckets to limit permutations
    const bucket = Math.floor(hash * 5);
    const key = \`\${baseColor}-\${bucket}-\${type}-\${opacity}-\${transparent}\`;`;

const newCacheParams = `const getCachedMaterial = (baseColor: string, hash: number, type: 'main' | 'accent' | 'roof', opacity: number, transparent: boolean, weather: string) => {
    const bucket = Math.floor(hash * 5);
    const key = \`\${baseColor}-\${bucket}-\${type}-\${opacity}-\${transparent}-\${weather}\`;`;

content = content.replace(oldCacheParams, newCacheParams);

const oldColorLogic = `        let matColor = c;
        if (type === 'accent') matColor = new THREE.Color(c).multiplyScalar(0.7);
        if (type === 'roof') matColor = new THREE.Color(c).multiplyScalar(0.5).offsetHSL(0,0,-0.1);`;

const newColorLogic = `        let matColor = c;
        if (type === 'accent') matColor = new THREE.Color(c).multiplyScalar(0.7);
        if (type === 'roof') {
            if (weather === 'snowy') {
                matColor = new THREE.Color('#f8fafc');
            } else {
                matColor = new THREE.Color(c).multiplyScalar(0.5).offsetHSL(0,0,-0.1);
            }
        }`;

content = content.replace(oldColorLogic, newColorLogic);

// Add weather to interface BuildingMeshProps
const oldProps = `interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
  level?: number;
}`;

const newProps = `interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
  level?: number;
  weather?: string;
}`;

content = content.replace(oldProps, newProps);

// Update ProceduralBuilding signature and getCachedMaterials
const oldProceduralSig = `const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, level = 1 }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100); // 0-99
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  const mainMat = getCachedMaterial(baseColor, hash, 'main', opacity, transparent);
  const accentMat = getCachedMaterial(baseColor, hash, 'accent', opacity, transparent);
  const roofMat = getCachedMaterial(baseColor, hash, 'roof', opacity, transparent);`;

const newProceduralSig = `const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, level = 1, weather = 'sunny' }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const variant = Math.floor(hash * 100); // 0-99
  const rotation = Math.floor(hash * 4) * (Math.PI / 2);
  
  const mainMat = getCachedMaterial(baseColor, hash, 'main', opacity, transparent, weather);
  const accentMat = getCachedMaterial(baseColor, hash, 'accent', opacity, transparent, weather);
  const roofMat = getCachedMaterial(baseColor, hash, 'roof', opacity, transparent, weather);`;

content = content.replace(oldProceduralSig, newProceduralSig);

// Update GroundTileProps
const oldGTProps = `interface GroundTileProps {
    type: BuildingType;
    x: number;
    y: number;
    grid: Grid;
    onHover: (x: number, y: number) => void;
    onLeave: () => void;
    onClick: (x: number, y: number) => void;
}`;

const newGTProps = `interface GroundTileProps {
    type: BuildingType;
    x: number;
    y: number;
    grid: Grid;
    weather: string;
    onHover: (x: number, y: number) => void;
    onLeave: () => void;
    onClick: (x: number, y: number) => void;
}`;

content = content.replace(oldGTProps, newGTProps);

// Update GroundTile logic
const oldGTObj = `const GroundTile = React.memo(({ type, x, y, grid, onHover, onLeave, onClick }: GroundTileProps) => {
  const [wx, _, wz] = gridToWorld(x, y);
  
  let color = '#10b981';
  // Base level for tiles, slightly varying
  let topY = -0.3; 
  let thickness = 0.5;
  
  if (type === BuildingType.None) {
    const noise = getHash(x, y);
    color = noise > 0.7 ? '#059669' : noise > 0.3 ? '#10b981' : '#34d399';
  } else if (type === BuildingType.Road) {
    color = '#374151';`;

const newGTObj = `const GroundTile = React.memo(({ type, x, y, grid, weather, onHover, onLeave, onClick }: GroundTileProps) => {
  const [wx, _, wz] = gridToWorld(x, y);
  
  let color = '#10b981';
  // Base level for tiles, slightly varying
  let topY = -0.3; 
  let thickness = 0.5;
  
  if (type === BuildingType.None) {
    const noise = getHash(x, y);
    color = weather === 'snowy' ? '#f8fafc' : (noise > 0.7 ? '#059669' : noise > 0.3 ? '#10b981' : '#34d399');
  } else if (type === BuildingType.Road) {
    color = weather === 'snowy' ? '#9ca3af' : '#374151';`;

content = content.replace(oldGTObj, newGTObj);

// Update IsoMap passing weather
const oldIsoMap1 = `                <GroundTile 
                    type={tile.buildingType} 
                    x={x} y={y} 
                    grid={grid}`;

const newIsoMap1 = `                <GroundTile 
                    type={tile.buildingType} 
                    x={x} y={y} 
                    grid={grid}
                    weather={weather}`;

content = content.replace(oldIsoMap1, newIsoMap1);

const oldIsoMap2 = `                      <ProceduralBuilding 
                        type={tile.buildingType} 
                        baseColor={BUILDINGS[tile.buildingType].color} 
                        x={x} y={y} 
                        level={tile.level || 1}
                      />`;

const newIsoMap2 = `                      <ProceduralBuilding 
                        type={tile.buildingType} 
                        baseColor={BUILDINGS[tile.buildingType].color} 
                        x={x} y={y} 
                        level={tile.level || 1}
                        weather={weather}
                      />`;

content = content.replace(oldIsoMap2, newIsoMap2);

const oldPreview = `                  <ProceduralBuilding 
                    type={hoveredTool} 
                    baseColor={previewColor} 
                    x={hoveredTile.x} 
                    y={hoveredTile.y} 
                    transparent 
                    opacity={0.7} 
                    level={hoveredTool === BuildingType.Upgrade && grid[hoveredTile.y][hoveredTile.x]?.level ? Math.min(3, grid[hoveredTile.y][hoveredTile.x].level! + 1) : 1}
                  />`;

const newPreview = `                  <ProceduralBuilding 
                    type={hoveredTool} 
                    baseColor={previewColor} 
                    x={hoveredTile.x} 
                    y={hoveredTile.y} 
                    transparent 
                    opacity={0.7} 
                    level={hoveredTool === BuildingType.Upgrade && grid[hoveredTile.y][hoveredTile.x]?.level ? Math.min(3, grid[hoveredTile.y][hoveredTile.x].level! + 1) : 1}
                    weather={weather}
                  />`;

content = content.replace(oldPreview, newPreview);

fs.writeFileSync(path, content);
console.log("Updated snowy components");
