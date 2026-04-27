const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/streetLampMaterial\.emissiveIntensity = isNight \? 2\.0 : 0\.0;/g, 
  "streetLampMaterial.emissiveIntensity = isNight ? 1.5 + Math.sin(time * 50) * Math.random() * 0.5 : 0.0;");

fs.writeFileSync(path, content);
console.log("Updated street lamps");
