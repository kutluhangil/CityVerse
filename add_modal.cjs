const fs = require('fs');
const path = 'App.tsx';
let content = fs.readFileSync(path, 'utf8');

const modalCode = `      {/* Inspector Modal */}
      {inspectedTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm shadow-2xl" onClick={() => setInspectedTile(null)}>
          <div className="bg-gray-900 border border-gray-600 rounded-xl p-6 w-full max-w-sm text-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Building Inspector</h2>
              <button onClick={() => setInspectedTile(null)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            {(() => {
               const tile = grid[inspectedTile.y][inspectedTile.x];
               const bConfig = BUILDINGS[tile.buildingType];
               const currentLevel = tile.level || 1;
               const maxLevel = 3;
               const upgradeCost = 100 * currentLevel;
               
               const levelNames = ['Standard', 'Enhanced', 'Premium'];
               const currentName = levelNames[currentLevel - 1];
               const nextName = currentLevel < maxLevel ? levelNames[currentLevel] : 'Max';

               const handleUpgrade = () => {
                  if (currentLevel >= maxLevel) return;
                  if (stats.money >= upgradeCost) {
                      const newGrid = grid.map(row => [...row]);
                      newGrid[inspectedTile.y][inspectedTile.x] = { ...tile, level: currentLevel + 1 };
                      setGrid(newGrid);
                      setStats(prev => ({ ...prev, money: prev.money - upgradeCost }));
                      addNewsItem({id: Date.now().toString(), text: \`Citizen: "Wow, the new \${bConfig.name} upgrade to \${nextName} looks amazing!"\`, type: 'positive'});
                      setInspectedTile(null); // Close modal
                  } else {
                      addNewsItem({id: Date.now().toString(), text: "Insufficient funds to upgrade building.", type: 'negative'});
                  }
               };

               return (
                 <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-400 uppercase tracking-widest">Type</span>
                        <span className="text-lg font-mono font-bold" style={{color: bConfig.color}}>{bConfig.name}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-400 uppercase tracking-widest">Level</span>
                        <div className="flex gap-2">
                           {[1, 2, 3].map(l => (
                             <div key={l} className={\`w-1/3 h-2 rounded \${l <= currentLevel ? 'bg-purple-500' : 'bg-gray-700'}\`}/>
                           ))}
                        </div>
                        <span className="text-sm mt-1">{currentName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-gray-800 rounded p-3 text-sm">
                        <div className="flex flex-col">
                           <span className="text-gray-400">Income</span>
                           <span className={bConfig.incomeGen > 0 ? "text-green-400 font-bold" : ""}>{bConfig.incomeGen * currentLevel > 0 ? '+' : ''}{bConfig.incomeGen * currentLevel} / day</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-gray-400">Population</span>
                           <span className={bConfig.popGen > 0 ? "text-blue-400 font-bold" : ""}>{bConfig.popGen * currentLevel > 0 ? '+' : ''}{bConfig.popGen * currentLevel} / max</span>
                        </div>
                    </div>
                    {currentLevel < maxLevel ? (
                        <button
                          onClick={handleUpgrade}
                          disabled={stats.money < upgradeCost}
                          className={\`mt-4 w-full py-3 rounded font-bold uppercase tracking-widest text-sm transition-colors \${stats.money >= upgradeCost ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}\`}
                        >
                           Upgrade to {nextName} ($\{upgradeCost})
                        </button>
                    ) : (
                        <div className="mt-4 w-full py-3 rounded bg-gray-800 text-gray-400 font-bold uppercase tracking-widest text-sm text-center">
                           Max Level Reached
                        </div>
                    )}
                 </div>
               );
            })()}
          </div>
        </div>
      )}
      <UIOverlay`;

content = content.replace("<UIOverlay", modalCode);

fs.writeFileSync(path, content);
console.log("Added modal to App.tsx");
