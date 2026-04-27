const fs = require('fs');
let path = 'App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `setDemolishedTiles(prev => [...prev, {x, y, id}]);`;
const replacement1 = `setDemolishedTiles(prev => [...prev, {x, y, id, type: currentTile.buildingType, level: currentTile.level, color: BUILDINGS[currentTile.buildingType].color}]);`;
content = content.replace(target1, replacement1);
content = content.replace(target1, replacement1); // Replace both occurrences in App.tsx (demolish and auto-demolish)

const targetState = `const [demolishedTiles, setDemolishedTiles] = useState<{x: number, y: number, id: number}[]>([]);`;
const replacementState = `const [demolishedTiles, setDemolishedTiles] = useState<{x: number, y: number, id: number, type?: BuildingType, level?: number, color?: string}[]>([]);`;
content = content.replace(targetState, replacementState);

fs.writeFileSync(path, content);
console.log("App.tsx demolition patched");
