const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `    return (
        <instancedMesh ref={meshRef} args={[isRain ? cylinderGeo : sphereGeo, undefined, count]} raycast={() => null}>
            <meshBasicMaterial color={isRain ? "#60a5fa" : "#ffffff"} opacity={0.6} transparent />
        </instancedMesh>
    );`;

const replacement1 = `    const splashRef = useRef<THREE.InstancedMesh>(null);
    const splashes = useRef(new Float32Array(splashCount * 4)); // x, z, scale, lifetime
    useEffect(() => {
        if (splashCount === 0) return;
        for (let i = 0; i < splashCount; i++) {
            splashes.current[i*4] = getRandomRange(-GRID_SIZE, GRID_SIZE);
            splashes.current[i*4+1] = getRandomRange(-GRID_SIZE, GRID_SIZE);
            splashes.current[i*4+2] = getRandomRange(0, 0.2); // initial scale
            splashes.current[i*4+3] = getRandomRange(0, 1); // lifetime
        }
    }, [splashCount]);

    useFrame((state) => {
        if (!meshRef.current || count === 0) return;
        for (let i = 0; i < count; i++) {
            let x = particles.current[i*4];
            let y = particles.current[i*4+1];
            let z = particles.current[i*4+2];
            const speed = particles.current[i*4+3];
            
            y -= speed;
            if (isSnow) x += Math.sin(y + i) * 0.01;
            
            if (y < -0.5) {
                y = 15;
                x = getRandomRange(-GRID_SIZE, GRID_SIZE);
                z = getRandomRange(-GRID_SIZE, GRID_SIZE);
            }
            
            particles.current[i*4] = x;
            particles.current[i*4+1] = y;
            particles.current[i*4+2] = z;
            
            dummy.position.set(x, y, z);
            if (isRain) {
                dummy.scale.set(0.02, 0.3, 0.02);
            } else {
                dummy.scale.set(0.05, 0.05, 0.05);
            }
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;

        if (isRain && splashRef.current) {
            for (let i = 0; i < splashCount; i++) {
                let x = splashes.current[i*4];
                let z = splashes.current[i*4+1];
                let scale = splashes.current[i*4+2];
                let life = splashes.current[i*4+3];

                scale += 0.01;
                life -= 0.02;

                if (life <= 0) {
                    x = getRandomRange(-GRID_SIZE, GRID_SIZE);
                    z = getRandomRange(-GRID_SIZE, GRID_SIZE);
                    scale = 0;
                    life = 1;
                }

                splashes.current[i*4] = x;
                splashes.current[i*4+1] = z;
                splashes.current[i*4+2] = scale;
                splashes.current[i*4+3] = life;

                dummy.position.set(x, -0.28, z); // slight above ground
                dummy.scale.set(scale, scale, scale);
                dummy.rotation.set(-Math.PI/2, 0, 0); // Flat on ground
                dummy.updateMatrix();
                splashRef.current.setMatrixAt(i, dummy.matrix);
                
                // Color fading is tricky with plain instancedMesh without custom shaders, but scale works well to fake it
            }
            splashRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    if (count === 0) return null;

    return (
        <group>
            <instancedMesh ref={meshRef} args={[isRain ? cylinderGeo : sphereGeo, undefined, count]} raycast={() => null}>
                <meshBasicMaterial color={isRain ? "#60a5fa" : "#ffffff"} opacity={0.6} transparent />
            </instancedMesh>
            {isRain && (
               <instancedMesh ref={splashRef} args={[new THREE.RingGeometry(0.5, 0.6, 8), undefined, splashCount]} raycast={() => null}>
                  <meshBasicMaterial color="#93c5fd" opacity={0.4} transparent side={THREE.DoubleSide} />
               </instancedMesh>
            )}
        </group>
    );`;

content = content.replace(target1, replacement1);

const target2 = `    const count = isRain ? 2000 : (isSnow ? 1000 : 0);
    
    const meshRef = useRef<THREE.InstancedMesh>(null);`;

const replacement2 = `    const count = isRain ? 2000 : (isSnow ? 1000 : 0);
    const splashCount = isRain ? 300 : 0;
    
    const meshRef = useRef<THREE.InstancedMesh>(null);`;

content = content.replace(target2, replacement2);

// Need to remove the old useFrame entirely from WeatherParticles
content = content.replace(/    useFrame\(\(\) => \{[\s\S]*?        meshRef\.current\.instanceMatrix\.needsUpdate = true;\n    \}\);\n\n    if \(count === 0\) return null;/, "    if (count === 0) return null;");

fs.writeFileSync(path, content);
console.log("Added rain splashes");
