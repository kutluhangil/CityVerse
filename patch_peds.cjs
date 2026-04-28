const fs = require('fs');

let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tBirds = `const EnvironmentEffects = ({ weather, grid }: { weather: string, grid: Grid }) => {`;

const pBirds = `// --- Pedestrians & Birds ---
const PedestrianSystem = ({ grid, maxPeds }: { grid: Grid, maxPeds: number }) => {
    const peds = useMemo(() => {
        let roads = [];
        grid.forEach((row, y) => row.forEach((tile, x) => {
            if (tile.buildingType === BuildingType.Road || tile.buildingType === BuildingType.Park || tile.buildingType === BuildingType.ParkPlayground) {
                roads.push({x, y});
            }
        }));
        if (roads.length === 0) return [];

        return Array.from({length: maxPeds}).map(() => {
            const r = roads[Math.floor(Math.random() * roads.length)];
            const [wx, _, wz] = gridToWorld(r.x, r.y);
            return {
                id: Math.random(),
                x: wx + (Math.random() - 0.5) * 0.6,
                z: wz + (Math.random() - 0.5) * 0.6,
                targetX: wx + (Math.random() - 0.5) * 0.8,
                targetZ: wz + (Math.random() - 0.5) * 0.8,
                speed: 0.2 + Math.random() * 0.3,
                color: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)]
            };
        });
    }, [grid, maxPeds]);

    const instancesRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state, delta) => {
        if (!instancesRef.current) return;
        peds.forEach((ped, i) => {
            const dx = ped.targetX - ped.x;
            const dz = ped.targetZ - ped.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < 0.05) {
                // Pick new target nearby
                ped.targetX = ped.x + (Math.random() - 0.5) * 1.5;
                ped.targetZ = ped.z + (Math.random() - 0.5) * 1.5;
            } else {
                ped.x += (dx / dist) * ped.speed * delta;
                ped.z += (dz / dist) * ped.speed * delta;
            }
            
            dummy.position.set(ped.x, -0.2, ped.z);
            // Bobbing animation
            dummy.position.y = -0.2 + Math.abs(Math.sin(state.clock.elapsedTime * 10 + i)) * 0.05;
            // Face direction
            dummy.rotation.y = Math.atan2(dx, dz);
            dummy.updateMatrix();
            instancesRef.current.setMatrixAt(i, dummy.matrix);
            
            // Set color once
            if (state.clock.elapsedTime < 0.5) {
                instancesRef.current.setColorAt(i, new THREE.Color(ped.color));
                instancesRef.current.instanceColor.needsUpdate = true;
            }
        });
        instancesRef.current.instanceMatrix.needsUpdate = true;
    });

    if (peds.length === 0) return null;
    return (
        <instancedMesh ref={instancesRef} args={[new THREE.BoxGeometry(0.06, 0.15, 0.06), new THREE.MeshStandardMaterial(), peds.length]} castShadow raycast={() => null}>
        </instancedMesh>
    );
};

const BirdSystem = () => {
    const birds = useMemo(() => Array.from({length: 20}).map(() => ({
        id: Math.random(),
        x: (Math.random() - 0.5) * 40,
        y: 8 + Math.random() * 4,
        z: (Math.random() - 0.5) * 40,
        speed: 2 + Math.random() * 2,
        angle: Math.random() * Math.PI * 2,
        wingPhase: Math.random() * Math.PI * 2,
    })), []);

    const groupRef = useRef<THREE.Group>(null);
    useFrame((state, delta) => {
        if (!groupRef.current) return;
        birds.forEach((bird, i) => {
            bird.x += Math.cos(bird.angle) * bird.speed * delta;
            bird.z += Math.sin(bird.angle) * bird.speed * delta;
            
            // wrap around
            if (bird.x > 30) bird.x = -30;
            if (bird.x < -30) bird.x = 30;
            if (bird.z > 30) bird.z = -30;
            if (bird.z < -30) bird.z = 30;

            bird.angle += (Math.random() - 0.5) * delta * 0.5;

            const child = groupRef.current.children[i];
            if (child) {
                child.position.set(bird.x, bird.y + Math.sin(state.clock.elapsedTime + i)*0.5, bird.z);
                child.rotation.y = -bird.angle;
                
                // Wing flap animation (scaling the box)
                child.scale.x = 1 + Math.sin(state.clock.elapsedTime * 15 + bird.wingPhase) * 0.5;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {birds.map(b => (
                <mesh key={b.id} material={new THREE.MeshBasicMaterial({color: 'black'})}>
                    <boxGeometry args={[0.2, 0.05, 0.1]} />
                </mesh>
            ))}
        </group>
    );
};

const EnvironmentEffects = ({ weather, grid }: { weather: string, grid: Grid }) => {`;

if (!content.includes('PedestrianSystem')) {
    content = content.replace(tBirds, pBirds);
}

const tRender = `<TrafficSystem grid={grid} maxCars={maxCars} weather={weather} />`;
const pRender = `<TrafficSystem grid={grid} maxCars={maxCars} weather={weather} />
           <PedestrianSystem grid={grid} maxPeds={Math.min(100, Math.max(10, population / 2))} />
           <BirdSystem />`;
if (!content.includes('<PedestrianSystem')) {
    content = content.replace(tRender, pRender);
}

fs.writeFileSync(path, content);
console.log("Patched Peds & Birds logic");
