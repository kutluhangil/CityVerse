const fs = require('fs');
const path = 'App.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = "const [maxCars, setMaxCars] = useState(6);";
const replacement1 = `const [maxCars, setMaxCars] = useState(6);
  const [inspectedTile, setInspectedTile] = useState<{x: number, y: number} | null>(null);`;
content = content.replace(target1, replacement1);

// Inside handleTileClick
const target2 = `    // Upgrade Logic
    if (tool === BuildingType.Upgrade) {
       if (currentTile.buildingType !== BuildingType.None && currentTile.buildingType !== BuildingType.Road) {
           const currentLevel = currentTile.level || 1;
           if (currentLevel >= 3) {
                addNewsItem({id: Date.now().toString() + Math.random(), text: "Building is already at max level.", type: 'neutral'});
                return;
           }
           const upgradeCost = 100 * currentLevel;
           if (currentStats.money >= upgradeCost) {
               const newGrid = currentGrid.map(row => [...row]);
               newGrid[y][x] = { ...currentTile, level: currentLevel + 1 };
               setGrid(newGrid);
               setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));
               addNewsItem({id: Date.now().toString() + Math.random(), text: \`Citizen: "Wow, the new \${BUILDINGS[currentTile.buildingType].name} upgrade looks amazing!"\`, type: 'positive'});
           } else {
               addNewsItem({id: Date.now().toString() + Math.random(), text: "Insufficient funds to upgrade building.", type: 'negative'});
           }
       }
       return;
    }`;
const replacement2 = `    if (tool === BuildingType.Inspect) {
      if (currentTile.buildingType !== BuildingType.None && currentTile.buildingType !== BuildingType.Road) {
        setInspectedTile({x, y});
      } else {
        setInspectedTile(null);
      }
      return;
    }`;
if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
} else {
    // If exact match fails, we will just use edit_file later.
    console.log("Could not find the target2 Upgrade branch");
}

fs.writeFileSync(path, content);
console.log("Updated App.tsx Inspect logic");
