const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tSharedGeo = `// Shared Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);`;
const pSharedGeo = `// Shared Geometries
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const planeGeo = new THREE.PlaneGeometry(1, 1);`;

if (!content.includes('const planeGeo')) {
    content = content.replace(tSharedGeo, pSharedGeo);
}
fs.writeFileSync(path, content);
console.log("Patched planeGeo");
