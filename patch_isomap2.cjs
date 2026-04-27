const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tProcDef = `const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, level = 1, weather = 'sunny' }: BuildingMeshProps) => {
  const hash = getHash(x, y);`;
const pProcDef = `const CrackDecal = ({ position, rotation, scale }: { position: [number, number, number], rotation: [number, number, number], scale: number }) => (
   <mesh position={position} rotation={rotation} scale={[scale, scale, 1]}>
       <planeGeometry args={[1, 1]} />
       <meshBasicMaterial color="#111827" transparent opacity={0.8} depthWrite={false} side={THREE.DoubleSide} />
   </mesh>
);

const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, level = 1, weather = 'sunny', isDamaged = false }: BuildingMeshProps) => {
  const hash = getHash(x, y);
  const groupRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
      // Intro bounce animation
      if (progress < 1) {
          setProgress(p => Math.min(1, p + delta * 2.5));
      }
      if (groupRef.current && !isDamaged) {
          const ez = (x: number) => {
              const c1 = 1.70158;
              const c3 = c1 + 1;
              return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
          };
          groupRef.current.scale.y = progress < 1 ? Math.max(0.01, ez(progress)) : 1;
      }
  });`;
content = content.replace(tProcDef, pProcDef);

const tGroupStart = `<group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>`;
const pGroupStart = `<group ref={groupRef} rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {isDamaged && (
          <group>
             <CrackDecal position={[0, 0.5, 0.45]} rotation={[0, 0, Math.PI/4]} scale={0.4} />
             <CrackDecal position={[0.45, 0.3, 0]} rotation={[0, Math.PI/2, Math.PI/3]} scale={0.5} />
             {/* Built-in simple smoke that rises slightly */}
             <SmokeStack position={[0.1, 0.5, 0.1]} />
          </group>
      )}`;
content = content.replace(tGroupStart, pGroupStart);

fs.writeFileSync(path, content);
console.log("Patched IsoMap ProceduralBuilding animations");
