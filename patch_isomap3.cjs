const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `            } else {
              // Townhouse
              const stories = (1 + Math.floor(hash * 2.5)) * level; // scale stories by level`;
              
const replace1 = `            } else {
              // Townhouse
              const stories = (1 + Math.floor(hash * 2.5)) * level; // scale stories by level
              const secondaryColor = new THREE.MeshStandardMaterial({color: '#374151', flatShading:true, opacity, transparent});`;
              
content = content.replace(target1, replace1);

const tWindow = `const WindowBlock = ({ position, scale }: { position: [number, number, number], scale: [number, number, number] }) => (
  <mesh castShadow receiveShadow geometry={boxGeo} position={position} scale={scale}>
    <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
  </mesh>
);`;

// Add some variation to windows (some dark, some glowing)
const pWindow = `const WindowBlock = ({ position, scale, active = true }: { position: [number, number, number], scale: [number, number, number], active?: boolean }) => {
  const windowColor = active ? "#fef08a" : "#1f2937";
  const emissiveInt = active ? 0.8 : 0;
  return (
    <mesh castShadow receiveShadow geometry={boxGeo} position={position} scale={scale}>
      <meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={emissiveInt} roughness={0.2} metalness={0.8} />
      {/* Simple window frame */}
      <mesh geometry={boxGeo} scale={[1.05, 1.05, 0.5]} position={[0,0,0]}>
         <meshBasicMaterial color="#374151" wireframe={true} />
      </mesh>
    </mesh>
  );
};`;
content = content.replace(tWindow, pWindow);

// Improve overall Commercial to have random inactive windows
const tComBlock = `                  {Array.from({ length: Math.floor(height * 2.5) }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.4, 0]} scale={[0.72, 0.2, 0.72]} />
                  ))}`;
const pComBlock = `                  {Array.from({ length: Math.floor(height * 2.5) }).map((_, i) => (
                    <WindowBlock key={i} position={[0, 0.2 + i * 0.4, 0]} scale={[0.72, 0.2, 0.72]} active={hash > 0.3 || i % 3 === 0} />
                  ))}`;
content = content.replace(tComBlock, pComBlock);

fs.writeFileSync(path, content);
console.log("Patched window details and fixed SecondaryColor");
