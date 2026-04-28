const fs = require('fs');

let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tNoiseMap = `// Helper: Easing function`;
const pNoiseMap = `// Helper: Procedural Noise Texture (for Asphalt/Bricks)
const createNoiseMap = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);
        for(let i=0; i<10000; i++){
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            ctx.fillRect(Math.random()*256, Math.random()*256, 2, 2);
        }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
};
const noiseTexture = createNoiseMap();

// Helper: Easing function`;

if (!content.includes('createNoiseMap')) {
    content = content.replace(tNoiseMap, pNoiseMap);
}

const tCachedMaterial = `const getCachedMaterial = `;
const pCachedMaterial = `
// We'll apply bumpMap or slightly adjust standard materials
const getCachedMaterial = `;

const tSharedMatProps = `      let matProps: any = {`;
const pSharedMatProps = `      let matProps: any = {
         bumpMap: noiseTexture,
         bumpScale: 0.05,
`;
if (!content.includes('bumpMap: noiseTexture')) {
    content = content.replace(tCachedMaterial, pCachedMaterial);
    content = content.replace(tSharedMatProps, pSharedMatProps);
}

fs.writeFileSync(path, content);
console.log("Patched procedural textures");
