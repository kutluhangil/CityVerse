const fs = require('fs');

let appPath = 'App.tsx';
let appContent = fs.readFileSync(appPath, 'utf8');

if (!appContent.includes('gameSpeed, setGameSpeed')) {
    appContent = appContent.replace(
        `const [inspectedTile, setInspectedTile] = useState<{x: number, y: number} | null>(null);`,
        `const [inspectedTile, setInspectedTile] = useState<{x: number, y: number} | null>(null);\n  const [gameSpeed, setGameSpeed] = useState(1);`
    );
    appContent = appContent.replace(
        `}, TICK_RATE_MS);`,
        `}, TICK_RATE_MS / gameSpeed);`
    );
    // add gameSpeed to dependency array
    appContent = appContent.replace(
        `[fetchNews, gameStarted]);`,
        `[fetchNews, gameStarted, gameSpeed]);`
    );
    appContent = appContent.replace(
        `setMaxCars={setMaxCars}`,
        `setMaxCars={setMaxCars}\n          gameSpeed={gameSpeed}\n          setGameSpeed={setGameSpeed}`
    );
    fs.writeFileSync(appPath, appContent);
}

let uiPath = 'components/UIOverlay.tsx';
let uiContent = fs.readFileSync(uiPath, 'utf8');

if (!uiContent.includes('gameSpeed')) {
    uiContent = uiContent.replace(
        `aiEnabled: boolean;`,
        `aiEnabled: boolean;\n  gameSpeed: number;\n  setGameSpeed: (speed: number) => void;`
    );
    uiContent = uiContent.replace(
        `const UIOverlay = ({ stats, selectedTool, onSelectTool, currentGoal, newsFeed, onClaimReward, isGeneratingGoal, aiEnabled, maxCars, setMaxCars }: UIOverlayProps) => {`,
        `const UIOverlay = ({ stats, selectedTool, onSelectTool, currentGoal, newsFeed, onClaimReward, isGeneratingGoal, aiEnabled, maxCars, setMaxCars, gameSpeed, setGameSpeed }: UIOverlayProps) => {`
    );
    uiContent = uiContent.replace(
        `<span className="text-lg md:text-xl font-bold text-white font-mono leading-none mt-1">{stats.day}</span>
          </div>`,
        `<span className="text-lg md:text-xl font-bold text-white font-mono leading-none mt-1">{stats.day}</span>
          </div>
          <div className="flex flex-row items-center gap-1">
             {[1, 2, 3].map(speed => (
                 <button key={speed} onClick={() => setGameSpeed(speed)} className={\`px-2 py-1 text-xs rounded font-bold \${gameSpeed === speed ? 'bg-blue-500 text-white' : 'bg-slate-700 text-gray-400'}\`}>
                     {speed}x
                 </button>
             ))}
          </div>`
    );
    fs.writeFileSync(uiPath, uiContent);
}

let mapPath = 'components/IsoMap.tsx';
let mapContent = fs.readFileSync(mapPath, 'utf8');

if (mapContent.includes('<Cloud')) {
    mapContent = mapContent.replace(/<Cloud[\s\S]*?\/>/g, '');
}
if (mapContent.includes('<FogOverlay')) {
    mapContent = mapContent.replace(/\{weather !== 'sunny' && <FogOverlay weather=\{weather\} \/>\}/g, '');
}
if (mapContent.includes('<WeatherParticles')) {
    mapContent = mapContent.replace(/<WeatherParticles type=\{weather\} grid=\{grid\} \/>/g, '');
}
fs.writeFileSync(mapPath, mapContent);
console.log("Patched speed and removed weather effects");
