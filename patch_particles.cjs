const fs = require('fs');

let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tParticles = `// --- Particles System ---`;
const pParticles = `// --- Build/Destroy Particles System ---
const BuildParticles = ({ active, color, position }: { active: boolean, color: string, position: [number, number, number] }) => {
    const particles = useMemo(() => Array.from({length: 15}).map(() => ({
        id: Math.random(),
        x: (Math.random() - 0.5) * 0.8,
        y: Math.random() * 0.4,
        z: (Math.random() - 0.5) * 0.8,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2,
        vz: (Math.random() - 0.5) * 2,
        life: 1.0,
    })), [active]); // recreate on active change
    
    const groupRef = useRef<THREE.Group>(null);
    
    useFrame((state, delta) => {
        if (!active || !groupRef.current) return;
        particles.forEach((p, i) => {
            if (p.life <= 0) return;
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.z += p.vz * delta;
            p.life -= delta * 1.5;
            p.vy -= delta * 4; // gravity
            
            const child = groupRef.current.children[i] as THREE.Mesh;
            if (child) {
                child.position.set(p.x, p.y, p.z);
                child.scale.setScalar(Math.max(0, p.life) * 0.1);
                child.rotation.x += delta * 2;
                child.rotation.y += delta * 2;
            }
        });
    });

    if (!active) return null;

    return (
        <group position={position} ref={groupRef}>
            {particles.map(p => (
                <mesh key={p.id} material={new THREE.MeshStandardMaterial({color: color, transparent: true, opacity: 0.8})}>
                    <boxGeometry args={[1, 1, 1]} />
                </mesh>
            ))}
        </group>
    );
};

// --- Particles System ---`;

if (!content.includes('BuildParticles')) {
    content = content.replace(tParticles, pParticles);
}

const tBuildingRef = `groupRef.current.scale.y = progress < 1 ? Math.max(0.01, ez(progress)) : 1;`;
const pBuildingRef = `groupRef.current.scale.y = progress < 1 ? Math.max(0.01, ez(progress)) : 1;
          // Add a little spring bounce
          if (progress > 0.8 && progress < 1) {
              groupRef.current.scale.y = 1 + Math.sin((progress - 0.8) * Math.PI * 5) * 0.15;
          }`;
content = content.replace(`          if (progress > 0.9 && progress < 1) {
              groupRef.current.scale.y = 1 + Math.sin((progress - 0.9) * Math.PI * 10) * 0.1;
          }`, ``);
if (!content.includes('progress > 0.8')) {
    content = content.replace(tBuildingRef, pBuildingRef);
}

const tBuildingRender = `<FloatingIncome type={type} />`;
const pBuildingRender = `<FloatingIncome type={type} />
         {progress < 1 && <BuildParticles active={true} position={[0, 0, 0]} color="#e2e8f0" />}`;
if (!content.includes('BuildParticles active')) {
    content = content.replace(tBuildingRender, pBuildingRender);
}

fs.writeFileSync(path, content);
console.log("Patched Build Particles");
