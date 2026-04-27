const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacementState = `demolishedTiles?: {x: number, y: number, id: number, type?: BuildingType, level?: number, color?: string}[];`;
content = content.replace(/demolishedTiles\?\: \{x\: number, y\: number, id\: number\}\[\];/, replacementState);

const dustCloudOld = `const DustCloud = ({ x, y }: { x: number, y: number }) => {
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
};`;

const dustCloudNew = `const DustCloud = ({ x, y, type, level, color }: { x: number, y: number, type?: BuildingType, level?: number, color?: string }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const debrisRef = useRef<THREE.InstancedMesh>(null);
    const count = 15;
    const debrisCount = 10;
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useRef(new Float32Array(count * 5)); // vx, vy, vz, scale, life
    const startPos = useRef(new Float32Array(count * 3));
    
    const debrisParticles = useRef(new Float32Array(debrisCount * 6)); // vx, vy, vz, scale, life, rY
    const debrisStartPos = useRef(new Float32Array(debrisCount * 3));
    const [progress, setProgress] = useState(0);

    const [wx, _, wz] = gridToWorld(x, y);

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
        for(let i=0; i<debrisCount; i++) {
           debrisStartPos.current[i*3] = (Math.random() - 0.5) * 0.5;
           debrisStartPos.current[i*3+1] = Math.random() * 0.4 + 0.2; // shoot up
           debrisStartPos.current[i*3+2] = (Math.random() - 0.5) * 0.5;

           debrisParticles.current[i*6] = (Math.random() - 0.5) * 0.08; // vx
           debrisParticles.current[i*6+1] = Math.random() * 0.1 + 0.05; // vy
           debrisParticles.current[i*6+2] = (Math.random() - 0.5) * 0.08; // vz
           debrisParticles.current[i*6+3] = Math.random() * 0.1 + 0.05; // scale
           debrisParticles.current[i*6+4] = 1.0; // life
           debrisParticles.current[i*6+5] = Math.random() * Math.PI; // rY
        }
    }, [count, debrisCount]);

    useFrame((state, delta) => {
       setProgress(p => Math.min(1, p + delta * 2));
       if (meshRef.current) {
           for(let i=0; i<count; i++) {
               let life = particles.current[i*5+4];
               if (life <= 0) {
                    dummy.scale.set(0, 0, 0);
                    dummy.updateMatrix();
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                    continue;
               }
               
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
       }

       if (debrisRef.current) {
           for(let i=0; i<debrisCount; i++) {
               let life = debrisParticles.current[i*6+4];
               if (life <= 0) {
                    dummy.scale.set(0, 0, 0);
                    dummy.updateMatrix();
                    debrisRef.current.setMatrixAt(i, dummy.matrix);
                    continue;
               }
               
               debrisStartPos.current[i*3] += debrisParticles.current[i*6];
               debrisStartPos.current[i*3+1] += debrisParticles.current[i*6+1]; // vy
               debrisStartPos.current[i*3+2] += debrisParticles.current[i*6+2]; // vz
               debrisParticles.current[i*6+1] -= 0.01; // gravity

               life -= 0.02;
               debrisParticles.current[i*6+4] = life;
               debrisParticles.current[i*6+5] += 0.1; // spin

               dummy.position.set(wx + debrisStartPos.current[i*3], Math.max(-0.25, debrisStartPos.current[i*3+1]), wz + debrisStartPos.current[i*3+2]);
               dummy.rotation.set(debrisParticles.current[i*6+5], debrisParticles.current[i*6+5], 0);
               dummy.scale.setScalar(debrisParticles.current[i*6+3] * (life > 0.5 ? 1 : life*2));
               dummy.updateMatrix();
               debrisRef.current.setMatrixAt(i, dummy.matrix);
           }
           debrisRef.current.instanceMatrix.needsUpdate = true;
       }
    });

    return (
       <group>
           <instancedMesh ref={meshRef} args={[sphereGeo, undefined, count]} raycast={() => null}>
              <meshBasicMaterial color="#a1a1aa" transparent opacity={0.6} />
           </instancedMesh>
           <instancedMesh ref={debrisRef} args={[boxGeo, undefined, debrisCount]} raycast={() => null}>
              <meshStandardMaterial color={color || '#71717a'} />
           </instancedMesh>
           {/* Collapsing building */}
           {type && type !== BuildingType.None && progress < 1 && (
               <group position={[wx, -0.3 - progress * (level || 1) * 0.5, wz]} scale={[1 + progress*0.5, 1 - progress, 1 + progress*0.5]}>
                   <ProceduralBuilding type={type} baseColor={color || '#fff'} x={x} y={y} level={level || 1} />
               </group>
           )}
       </group>
    );
};`;

content = content.replace(dustCloudOld, dustCloudNew);

const isoMapPropPassOld = `<DustCloud key={dt.id} x={dt.x} y={dt.y} />`;
const isoMapPropPassNew = `<DustCloud key={dt.id} x={dt.x} y={dt.y} type={dt.type} level={dt.level} color={dt.color} />`;
content = content.replace(isoMapPropPassOld, isoMapPropPassNew);

fs.writeFileSync(path, content);
console.log("IsoMap.tsx demolition patched");
