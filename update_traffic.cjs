const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldDecl = "const TrafficSystem = ({ grid }: { grid: Grid }) => {";
const newDecl = "const TrafficSystem = ({ grid, maxCars }: { grid: Grid, maxCars: number }) => {";
content = content.replace(oldDecl, newDecl);

const oldCarCount = "const carCount = Math.min(roadTiles.length, 30);";
const newCarCount = "const carCount = Math.min(roadTiles.length, maxCars);";
content = content.replace(oldCarCount, newCarCount);

const oldRefs = "const carsRef = useRef<THREE.InstancedMesh>(null);";
const newRefs = `const carsRef = useRef<THREE.InstancedMesh>(null);
  const cabinRef = useRef<THREE.InstancedMesh>(null);
  const w1Ref = useRef<THREE.InstancedMesh>(null);
  const w2Ref = useRef<THREE.InstancedMesh>(null);
  const w3Ref = useRef<THREE.InstancedMesh>(null);
  const w4Ref = useRef<THREE.InstancedMesh>(null);`;
content = content.replace(oldRefs, newRefs);

const oldSpeed = "carsState.current[i*6 + 5] = getRandomRange(0.01, 0.03); // speed";
const newSpeed = "carsState.current[i*6 + 5] = getRandomRange(0.005, 0.012); // smoother speed";
content = content.replace(oldSpeed, newSpeed);

const oldMatrix = `      dummy.scale.set(0.5, 0.15, 0.3); 
      
      dummy.updateMatrix();
      carsRef.current.setMatrixAt(i, dummy.matrix);
    }
    carsRef.current.instanceMatrix.needsUpdate = true;`;
const newMatrix = `      // we don't scale dummy here because geometries already have sizes
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      
      carsRef.current.setMatrixAt(i, dummy.matrix);
      cabinRef.current?.setMatrixAt(i, dummy.matrix);
      w1Ref.current?.setMatrixAt(i, dummy.matrix);
      w2Ref.current?.setMatrixAt(i, dummy.matrix);
      w3Ref.current?.setMatrixAt(i, dummy.matrix);
      w4Ref.current?.setMatrixAt(i, dummy.matrix);
    }
    carsRef.current.instanceMatrix.needsUpdate = true;
    if (cabinRef.current) cabinRef.current.instanceMatrix.needsUpdate = true;
    if (w1Ref.current) w1Ref.current.instanceMatrix.needsUpdate = true;
    if (w2Ref.current) w2Ref.current.instanceMatrix.needsUpdate = true;
    if (w3Ref.current) w3Ref.current.instanceMatrix.needsUpdate = true;
    if (w4Ref.current) w4Ref.current.instanceMatrix.needsUpdate = true;
`;
content = content.replace(oldMatrix, newMatrix);

const oldReturn = `<group>
        <instancedMesh ref={carsRef} args={[boxGeo, undefined, carCount]} castShadow>
          <meshStandardMaterial roughness={0.5} metalness={0.3} />
        </instancedMesh>
        {lampCount > 0 && (
           <instancedMesh ref={lampsRef} args={[cylinderGeo, undefined, lampCount]}>
               <primitive object={streetLampMaterial} attach="material" />
           </instancedMesh>
        )}
    </group>`;
const newReturn = `<group>
        <instancedMesh ref={carsRef} args={[carBodyGeo, undefined, carCount]} castShadow>
          <meshStandardMaterial roughness={0.5} metalness={0.3} />
        </instancedMesh>
        <instancedMesh ref={cabinRef} args={[carCabinGeo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#111827" roughness={0.1} metalness={0.8} />
        </instancedMesh>
        <instancedMesh ref={w1Ref} args={[wheel1Geo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#000000" roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={w2Ref} args={[wheel2Geo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#000000" roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={w3Ref} args={[wheel3Geo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#000000" roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={w4Ref} args={[wheel4Geo, undefined, carCount]} castShadow>
           <meshStandardMaterial color="#000000" roughness={0.9} />
        </instancedMesh>
        {lampCount > 0 && (
           <instancedMesh ref={lampsRef} args={[cylinderGeo, undefined, lampCount]}>
               <primitive object={streetLampMaterial} attach="material" />
           </instancedMesh>
        )}
    </group>`;
content = content.replace(oldReturn, newReturn);

fs.writeFileSync(path, content);
console.log("Updated TrafficSystem");
