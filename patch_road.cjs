const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldRoadLogic = `  } else if (type === BuildingType.Road) {
    color = weather === 'snowy' ? '#9ca3af' : '#374151';`;

const newRoadLogic = `  } else if (type === BuildingType.Road) {
    const hasUp = y > 0 && grid[y - 1][x].buildingType === BuildingType.Road;
    const hasDown = y < GRID_SIZE - 1 && grid[y + 1][x].buildingType === BuildingType.Road;
    const hasLeft = x > 0 && grid[y][x - 1].buildingType === BuildingType.Road;
    const hasRight = x < GRID_SIZE - 1 && grid[y][x + 1].buildingType === BuildingType.Road;
    const connections = [hasUp, hasDown, hasLeft, hasRight].filter(Boolean).length;
    
    let baseColor = weather === 'snowy' ? '#9ca3af' : '#374151'; // normal road
    if (connections === 1) {
       baseColor = weather === 'snowy' ? '#d1d5db' : '#4b5563'; // dead end (lighter)
    } else if (connections >= 3) {
       baseColor = weather === 'snowy' ? '#6b7280' : '#1f2937'; // intersection (darker, more wear)
    }
    color = baseColor;`;

content = content.replace(oldRoadLogic, newRoadLogic);

fs.writeFileSync(path, content);
console.log("Updated road textures logic");
