const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const overlayCode = `
const DustCloud = ({ x, y }: { x: number, y: number }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const count = 15;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useRef(new Float32Array(count * 5)); // vx, vy, vz, scale, life
    const startPos = useRef(new Float32Array(count * 3));

    useEffect(() => {
        for(let i=0; i<count; i++) {
           startPos.current[i*3] = (Math.random() - 0.5) * 0.5;
           startPos.current[i*3+1] = Math.random() * 0.2;
           startPos.current[i*3+2] = (Math.random() - 0.5) * 0.5;

           particles.current[i*5] = (Math.random() - 0.5) * 0.05; // vx
           particles.current[i*5+1] = Math.random() * 0.05 + 0.02; // vy
           particles.current[i*5+2] = (Math.random() - 0.5) * 0.05; // vz
           particles.current[i*5+3] = Math.random() * 0.4 + 0.2; // scale
           particles.current[i*5+4] = 1.0; // life
        }
    }, [count]);

    useFrame(() => {
       if (!meshRef.current) return;
       const [wx, _, wz] = gridToWorld(x, y);
       let anyAlive = false;
       for(let i=0; i<count; i++) {
           let life = particles.current[i*5+4];
           if (life <= 0) {
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
                continue;
           }
           anyAlive = true;
           
           startPos.current[i*3] += particles.current[i*5];
           startPos.current[i*3+1] += particles.current[i*5+1];
           startPos.current[i*3+2] += particles.current[i*5+2];

           life -= 0.02;

           particles.current[i*5+4] = life;

           dummy.position.set(wx + startPos.current[i*3], startPos.current[i*3+1], wz + startPos.current[i*3+2]);
           dummy.scale.setScalar(particles.current[i*5+3] * life);
           dummy.updateMatrix();
           meshRef.current.setMatrixAt(i, dummy.matrix);
       }
       meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
       <instancedMesh ref={meshRef} args={[sphereGeo, undefined, count]} raycast={() => null}>
          <meshBasicMaterial color="#a1a1aa" transparent opacity={0.6} />
       </instancedMesh>
    );
};
`;

content = content.replace("const HeatmapOverlay", overlayCode + "\nconst HeatmapOverlay");

// modify IsoMapProps
content = content.replace("maxCars?: number;", "maxCars?: number;\n  demolishedTiles?: {x: number, y: number, id: number}[];");
content = content.replace("weather = 'sunny', maxCars = 6", "weather = 'sunny', maxCars = 6, demolishedTiles = []");

// Add to IsoMap body
const target = `            <GridBorder />

            {/* Placement Preview */}`;
const replacement = `            <GridBorder />
            {demolishedTiles.map(dt => (
               <DustCloud key={dt.id} x={dt.x} y={dt.y} />
            ))}

            {/* Placement Preview */}`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content);
console.log("Added DustCloud animation");
