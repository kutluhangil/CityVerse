const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetRoad = `      {connections >= 3 && (
         <group>
             <mesh position={[0,0,0.01]} material={tireMarkMaterial}>
                <ringGeometry args={[0.1, 0.3, 16, 1, 0, Math.PI * 2 * hash ]} />
             </mesh>
             <mesh position={[0,0,0.015]} material={tireMarkMaterial}>
                <ringGeometry args={[0.2, 0.25, 16, 1, Math.PI * hash, Math.PI * 1.5 ]} />
             </mesh>
         </group>
      )}`;

const replacementRoad = `      {/* Enhanced intersection wear and tire marks */}
      {connections >= 3 && (
         <group>
             <mesh position={[0,0,0.01]} material={tireMarkMaterial}>
                <ringGeometry args={[0.1, 0.35, 16, 1, 0, Math.PI * 2 * hash ]} />
             </mesh>
             <mesh position={[0,0,0.015]} material={tireMarkMaterial}>
                <ringGeometry args={[0.2, 0.3, 16, 1, Math.PI * hash, Math.PI * (1.5 + hash*0.5) ]} />
             </mesh>
             <mesh position={[0,0,0.012]} material={tireMarkMaterial}>
                <ringGeometry args={[0.05, 0.4, 16, 1, Math.PI * (1-hash), Math.PI * 1.5 ]} />
             </mesh>
             {/* Wear patch */}
             {hash > 0.4 && (
                 <mesh position={[(hash-0.5)*0.2, (1-hash-0.5)*0.2, 0.005]} rotation={[0,0,hash*Math.PI]}>
                    <planeGeometry args={[0.3, 0.2]} />
                    <meshBasicMaterial color="#1f2937" transparent opacity={0.3} />
                 </mesh>
             )}
         </group>
      )}`;

content = content.replace(targetRoad, replacementRoad);

const targetCrack = `      {connections === 2 && hash < 0.2 && (
         <mesh position={[0, 0, 0.012]} material={crackMaterial} rotation={[0, 0, hash * -Math.PI]}>
             <planeGeometry args={[0.4, 0.02]} />
             <mesh position={[0.1, 0.1, 0]} rotation={[0, 0, Math.PI/4]}>
                <planeGeometry args={[0.2, 0.02]} />
             </mesh>
         </mesh>
      )}`;
      
const replaceCrack = `      {/* Additional Cracks and Patches for wear */}
      {connections >= 2 && hash < 0.3 && (
         <mesh position={[0, 0, 0.012]} material={crackMaterial} rotation={[0, 0, hash * -Math.PI]}>
             <planeGeometry args={[0.4, 0.02]} />
             <mesh position={[0.1, 0.1, 0]} rotation={[0, 0, Math.PI/4]}>
                <planeGeometry args={[0.2, 0.02]} />
             </mesh>
         </mesh>
      )}
      {connections === 2 && hash > 0.7 && (
         <mesh position={[0, 0, 0.005]} rotation={[0,0,hash*Math.PI*2]}>
            <planeGeometry args={[0.35, 0.2]} />
            <meshBasicMaterial color="#374151" transparent opacity={0.4} />
         </mesh>
      )}`;

content = content.replace(targetCrack, replaceCrack);
fs.writeFileSync(path, content);
console.log("Patched RoadMarkings");
