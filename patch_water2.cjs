const fs = require('fs');

let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tDefinition = `const ProceduralBuilding = React.memo(({`;
const pDefinition = `// --- Fountain Water ---
const FountainWater = () => {
    const waterRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (!waterRef.current) return;
        const geo = waterRef.current.geometry as THREE.CylinderGeometry;
        const pos = geo.attributes.position;
        const time = state.clock.elapsedTime * 2;
        // Super simple ripple effect on cylinder top vertices
        for (let i = 0; i < pos.count; i++) {
            const y = pos.getY(i);
            if (y > 0) { // Top vertices
                const x = pos.getX(i);
                const z = pos.getZ(i);
                const r = Math.sqrt(x*x + z*z);
                const newY = 0.5 + Math.sin(r * 20 - time) * 0.05;
                pos.setY(i, newY);
            }
        }
        pos.needsUpdate = true;
    });

    return (
        <mesh ref={waterRef} castShadow position={[0, 0.08, 0]} scale={[0.45, 0.05, 0.45]}>
             <cylinderGeometry args={[1, 1, 1, 16, 2]} />
             <meshPhysicalMaterial color="#60a5fa" transmission={0.9} opacity={1} transparent roughness={0.1} ior={1.33} metalness={0.1} />
        </mesh>
    );
};

const ProceduralBuilding = React.memo(({`;

if (!content.includes('const FountainWater')) {
    content = content.replace(tDefinition, pDefinition);
}

fs.writeFileSync(path, content);
console.log("Patched Fountain Water properly");
