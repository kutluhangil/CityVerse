const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const foundationCode = `    <group rotation={[0, rotation, 0]} position={[0, yOffset, 0]}>
      {/* Subtle foundation model */}
      <mesh castShadow receiveShadow geometry={boxGeo} position={[0, 0.05, 0]} scale={[0.95, 0.1, 0.95]}>
        <meshStandardMaterial color="#52525b" roughness={0.9} flatShading />
      </mesh>
`;

content = content.replace(/<group rotation=\{\[0, rotation, 0\]\} position=\{\[0, yOffset, 0\]\}>/g, foundationCode);

fs.writeFileSync(path, content);
console.log("Updated foundations");
