const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const overlayCode = `const HeatmapOverlay = ({ grid, mode }: { grid: Grid, mode: string }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!meshRef.current || mode === 'none') return;

    let idx = 0;
    const colors = new Float32Array(GRID_SIZE * GRID_SIZE * 3);

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = grid[y][x];
        const [wx, _, wz] = gridToWorld(x, y);
        
        dummy.position.set(wx, -0.25, wz); // Just above ground
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(idx, dummy.matrix);

        let color = new THREE.Color('#000000');
        let intensity = 0;

        if (mode === 'population') {
          if (tile.buildingType === BuildingType.Residential) {
            intensity = (tile.level || 1) / 3;
            color = new THREE.Color(\`hsl(200, 100%, \${20 + intensity * 40}%)\`); // Blue heatmap
          } else {
            color = new THREE.Color('#000000'); // No population
          }
        } else if (mode === 'income') {
          if (tile.buildingType === BuildingType.Commercial || tile.buildingType === BuildingType.Industrial) {
            intensity = (tile.level || 1) / 3;
            color = new THREE.Color(\`hsl(120, 100%, \${20 + intensity * 40}%)\`); // Green heatmap
          } else {
             color = new THREE.Color('#000000');
          }
        } else if (mode === 'happiness') {
           // Calculate distance to nearest park
           let minDst = 999;
           for (let py = 0; py < GRID_SIZE; py++) {
               for (let px = 0; px < GRID_SIZE; px++) {
                  const pTile = grid[py][px];
                  if (pTile.buildingType === BuildingType.Park || pTile.buildingType === BuildingType.ParkFountain || pTile.buildingType === BuildingType.ParkPlayground) {
                      const dst = Math.abs(px - x) + Math.abs(py - y);
                      if (dst < minDst) minDst = dst;
                  }
               }
           }
           if (minDst <= 5) {
               intensity = 1 - (minDst / 5);
               color = new THREE.Color(\`hsl(320, 100%, \${30 + intensity * 40}%)\`); // Pink heatmap
           } else {
               color = new THREE.Color('#000000');
           }
        }

        colors[idx*3] = color.r; colors[idx*3+1] = color.g; colors[idx*3+2] = color.b;
        idx++;
      }
    }
    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [grid, mode]);

  if (mode === 'none') return null;

  return (
    <instancedMesh ref={meshRef} args={[new THREE.PlaneGeometry(1, 1), undefined, GRID_SIZE * GRID_SIZE]} raycast={() => null}>
        <meshBasicMaterial transparent opacity={0.6} depthTest={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
};
`;

content = content.replace("const DayNightSystem", overlayCode + "\nconst DayNightSystem");

// Add dataView mode UI
const newIsoMap = `  const [dataMode, setDataMode] = useState<string>('none');

  const handleHover = useCallback((x: number, y: number) => {`;
content = content.replace(`  const handleHover = useCallback((x: number, y: number) => {`, newIsoMap);

const oldOverlay = `            <TrafficSystem grid={grid} maxCars={maxCars} />

            {/* Placement Preview */}`;

const newOverlay = `            <TrafficSystem grid={grid} maxCars={maxCars} />
            <HeatmapOverlay grid={grid} mode={dataMode} />

            {/* Placement Preview */}`;

content = content.replace(oldOverlay, newOverlay);

const oldReturn = `        <SoftShadows size={10} samples={8} />
      </Canvas>
    </div>
  );
};`;

const newReturn = `        <SoftShadows size={10} samples={8} />
      </Canvas>

      {/* Heatmap UI */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto bg-gray-900/80 p-3 rounded-lg border border-gray-600/50 backdrop-blur-xl shadow-2xl">
         <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Data Overlays</span>
         <div className="flex gap-2">
            {['none', 'population', 'income', 'happiness'].map(mode => (
               <button
                  key={mode}
                  onClick={() => setDataMode(mode)}
                  className={\`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all \${dataMode === mode ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}\`}
               >
                  {mode}
               </button>
            ))}
         </div>
      </div>
    </div>
  );
};`;

content = content.replace(oldReturn, newReturn);

fs.writeFileSync(path, content);
console.log("Added heatmap overlay");
