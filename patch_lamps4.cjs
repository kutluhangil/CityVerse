const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tLighting = `            streetLampMaterial.emissiveIntensity = nightBlend * (1.5 + Math.sin(time * 50) * Math.random() * 0.5);`;
const pLighting = `            streetLampMaterial.emissiveIntensity = nightBlend > 0.1 ? nightBlend * (1.5 + Math.sin(time * 15) * Math.random() * 0.2 + (Math.random() > 0.95 ? -0.5 : 0)) : 0;
            if (nightBlend > 0.5) streetLampMaterial.color.setHex(0xfef08a);
            else streetLampMaterial.color.setHex(0x9ca3af);`;

content = content.replace(tLighting, pLighting);
fs.writeFileSync(path, content);
console.log("Patched Lamps material");
