const fs = require('fs');

let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tHighRise = `<mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, height + 0.1, 0]} scale={[0.5, 0.2, 0.5]} />
                  {hasAntenna && <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#9ca3af', opacity, transparent})} geometry={cylinderGeo} position={[0, height + 0.5, 0]} scale={[0.02, 0.8, 0.02]} />}`;
const pHighRise = `<mesh {...commonProps} material={accentMat} geometry={boxGeo} position={[0, height + 0.1, 0]} scale={[0.5, 0.2, 0.5]} />
                  {hasAntenna && <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#9ca3af', opacity, transparent})} geometry={cylinderGeo} position={[0, height + 0.5, 0]} scale={[0.02, 0.8, 0.02]} />}
                  {/* Billboard Sign */}
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#222222', opacity, transparent})} geometry={boxGeo} position={[0, height + 0.2, 0.2]} scale={[0.4, 0.2, 0.05]} />
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#3b82f6', emissive: '#3b82f6', emissiveIntensity: 2})} geometry={planeGeo} position={[0, height + 0.2, 0.23]} scale={[0.35, 0.15, 1]} />`;
if (!content.includes('Billboard Sign')) {
    content = content.replace(tHighRise, pHighRise);
}

const tShop = `<mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: awningColor, opacity, transparent })} geometry={boxGeo} position={[0, 0.55 * level, 0.5]} scale={[0.9, 0.1, 0.2]} rotation={[Math.PI/6, 0, 0]} />`;
const pShop = `<mesh {...commonProps} material={new THREE.MeshStandardMaterial({ color: awningColor, opacity, transparent })} geometry={boxGeo} position={[0, 0.55 * level, 0.5]} scale={[0.9, 0.1, 0.2]} rotation={[Math.PI/6, 0, 0]} />
                  {/* Shop Sign */}
                  <mesh {...commonProps} material={new THREE.MeshStandardMaterial({color: '#fcd34d', emissive: '#fcd34d', emissiveIntensity: 1})} geometry={boxGeo} position={[0, 0.8 * level + 0.1, 0]} scale={[0.6, 0.2, 0.1]} />`;
if (!content.includes('Shop Sign')) {
    content = content.replace(tShop, pShop);
}

fs.writeFileSync(path, content);
console.log("Patched Commercial Details");
