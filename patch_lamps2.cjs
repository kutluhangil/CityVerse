const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

// The lamps setup
// Replace lampsRef
const replaceLampsRef = `  const lampsRef = useRef<THREE.InstancedMesh>(null);
  const lampCount = roadTiles.length * 2; // Two lamps per road tile`;

const replacementLampsRef = `  const lampPolesRef = useRef<THREE.InstancedMesh>(null);
  const lampBulbsRef = useRef<THREE.InstancedMesh>(null);
  const lampCount = roadTiles.length * 2;`;

content = content.replace(replaceLampsRef, replacementLampsRef);

// Replace setup function
const targetSetup = `    // Set up street lamps
    if (lampsRef.current) {
        let lampIdx = 0;
        roadTiles.forEach(tile => {
            const [wx, _, wz] = gridToWorld(tile.x, tile.y);
            // Lamp 1
            dummy.position.set(wx - 0.4, -0.3 + 0.3, wz - 0.4);
            dummy.scale.set(0.05, 0.6, 0.05);
            dummy.updateMatrix();
            lampsRef.current!.setMatrixAt(lampIdx++, dummy.matrix);
            
            // Lamp 2
            dummy.position.set(wx + 0.4, -0.3 + 0.3, wz + 0.4);
            dummy.scale.set(0.05, 0.6, 0.05);
            dummy.updateMatrix();
            lampsRef.current!.setMatrixAt(lampIdx++, dummy.matrix);
        });
        lampsRef.current.instanceMatrix.needsUpdate = true;
    }`;

const replaceSetup = `    // Set up street lamps
    if (lampPolesRef.current && lampBulbsRef.current) {
        let lampIdx = 0;
        const colors = new Float32Array(lampCount * 3);
        roadTiles.forEach((tile, i) => {
            const [wx, _, wz] = gridToWorld(tile.x, tile.y);
            
            // Lamp 1
            dummy.position.set(wx - 0.4, -0.3 + 0.25, wz - 0.4);
            dummy.scale.set(0.02, 0.5, 0.02);
            dummy.updateMatrix();
            lampPolesRef.current!.setMatrixAt(lampIdx, dummy.matrix);
            dummy.position.set(wx - 0.37, -0.3 + 0.5, wz - 0.37);
            dummy.scale.set(0.06, 0.06, 0.06);
            dummy.updateMatrix();
            lampBulbsRef.current!.setMatrixAt(lampIdx, dummy.matrix);
            colors[lampIdx*3] = 1; colors[lampIdx*3+1] = 0.9; colors[lampIdx*3+2] = 0.5;
            lampIdx++;
            
            // Lamp 2
            dummy.position.set(wx + 0.4, -0.3 + 0.25, wz + 0.4);
            dummy.scale.set(0.02, 0.5, 0.02);
            dummy.updateMatrix();
            lampPolesRef.current!.setMatrixAt(lampIdx, dummy.matrix);
            dummy.position.set(wx + 0.37, -0.3 + 0.5, wz + 0.37);
            dummy.scale.set(0.06, 0.06, 0.06);
            dummy.updateMatrix();
            lampBulbsRef.current!.setMatrixAt(lampIdx, dummy.matrix);
            colors[lampIdx*3] = 1; colors[lampIdx*3+1] = 0.9; colors[lampIdx*3+2] = 0.5;
            lampIdx++;
        });
        lampPolesRef.current.instanceMatrix.needsUpdate = true;
        lampBulbsRef.current.instanceMatrix.needsUpdate = true;
        lampBulbsRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    }`;

content = content.replace(targetSetup, replaceSetup);


const targetRender = `        {lampCount > 0 && (
           <instancedMesh ref={lampsRef} args={[cylinderGeo, undefined, lampCount]}>
               <primitive object={streetLampMaterial} attach="material" />
           </instancedMesh>
        )}`;

const replaceRender = `        {lampCount > 0 && (
           <group>
               <instancedMesh ref={lampPolesRef} args={[cylinderGeo, undefined, lampCount]} castShadow>
                   <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.2} />
               </instancedMesh>
               <instancedMesh ref={lampBulbsRef} args={[sphereGeo, undefined, lampCount]}>
                   <primitive object={streetLampMaterial} attach="material" />
               </instancedMesh>
           </group>
        )}`;
content = content.replace(targetRender, replaceRender);

fs.writeFileSync(path, content);
console.log("Patched Lamps Structure");
