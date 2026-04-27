const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetWPSig1 = `const WeatherParticles = ({ type }: { type: string }) => {`;
const newWPSig1 = `const WeatherParticles = ({ type, grid }: { type: string, grid: Grid }) => {`;
content = content.replace(targetWPSig1, newWPSig1);

// Inside the useFrame block of WeatherParticles
const targetLoop = `                dummy.position.set(x, -0.28, z); // slight above ground
                dummy.scale.set(scale, scale, scale);`;

const newLoop = `                // Find grid coordinates for splash height
                const gx = Math.round(x + WORLD_OFFSET);
                const gy = Math.round(z + WORLD_OFFSET);
                let splashY = -0.28;
                if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE && grid) {
                    const tile = grid[gy][gx];
                    if (tile.buildingType !== BuildingType.None && tile.buildingType !== BuildingType.Road) {
                        // rough height based on type and level
                        const level = tile.level || 1;
                        if (tile.buildingType === BuildingType.Commercial) {
                            splashY = 0.5 * level;
                        } else if (tile.buildingType === BuildingType.Industrial) {
                            splashY = 0.3 + 0.3 * level;
                        } else if (tile.buildingType === BuildingType.Residential) {
                            splashY = 0.2 + 0.4 * level;
                        } else {
                            splashY = 0.1 * level;
                        }
                    }
                }
                dummy.position.set(x, splashY, z);
                dummy.scale.set(scale, scale, scale);`;
content = content.replace(targetLoop, newLoop);

const targetUsage1 = `<WeatherParticles type={weather} />`;
const newUsage1 = `<WeatherParticles type={weather} grid={grid} />`;
content = content.replace(targetUsage1, newUsage1);

// Look for GridBorder to pulse it.
const targetGridBorderOld = `const GridBorder = () => {
    const borderRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((state) => {
        if (borderRef.current) {
            borderRef.current.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    const borderSize = GRID_SIZE;`;

const newGridBorder = `const GridBorder = () => {
    const borderRef = useRef<THREE.Group>(null);
    const matRef1 = useRef<THREE.MeshStandardMaterial>(null);
    const matRef2 = useRef<THREE.MeshStandardMaterial>(null);
    
    useFrame((state) => {
        if (matRef1.current) {
            matRef1.current.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
            matRef1.current.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
        }
        if (matRef2.current) {
            matRef2.current.opacity = 0.1 + Math.cos(state.clock.elapsedTime * 3) * 0.1;
        }
        if (borderRef.current) {
            borderRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.005);
        }
    });

    const borderSize = GRID_SIZE;`;

const targetGridBorderReturn = `    return (
        <group position={[0, -0.35, 0]}>
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]}>
                <ringGeometry args={[borderSize / 2, borderSize / 2 + 0.3, 4]} />
                <meshStandardMaterial ref={borderRef} color="#6366f1" transparent opacity={0.5} emissive="#4f46e5" emissiveIntensity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI/2, 0, Math.PI/4]} position={[0, 0.01, 0]}>
                <ringGeometry args={[borderSize / 2 * Math.SQRT2 - 0.2, borderSize / 2 * Math.SQRT2 + 0.1, 4]} />
                <meshStandardMaterial color="#818cf8" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );`;

const newGridBorderReturn = `    return (
        <group ref={borderRef} position={[0, -0.35, 0]}>
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]}>
                <ringGeometry args={[borderSize / 2, borderSize / 2 + 0.3, 4]} />
                <meshStandardMaterial ref={matRef1} color="#6366f1" transparent opacity={0.5} emissive="#4f46e5" emissiveIntensity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI/2, 0, Math.PI/4]} position={[0, 0.01, 0]}>
                <ringGeometry args={[borderSize / 2 * Math.SQRT2 - 0.2, borderSize / 2 * Math.SQRT2 + 0.1, 4]} />
                <meshStandardMaterial ref={matRef2} color="#818cf8" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );`;

content = content.replace(targetGridBorderOld, newGridBorder);
content = content.replace(targetGridBorderReturn, newGridBorderReturn);

fs.writeFileSync(path, content);
console.log("Patched splashes and grid border pulses.");
