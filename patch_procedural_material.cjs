const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `const getCachedMaterial = (baseColor: string, hash: number, type: 'main' | 'accent' | 'roof', opacity: number, transparent: boolean, weather: string, level: number = 1) => {`;
const replace1 = `const getCachedMaterial = (baseColor: string, hash: number, type: 'main' | 'accent' | 'roof', opacity: number, transparent: boolean, weather: string, level: number = 1, bType?: BuildingType) => {`;
content = content.replace(target1, replace1);

const target2 = `    const key = \`\${baseColor}-\${bucket}-\${type}-\${opacity}-\${transparent}-\${weather}-\${level}\`;`;
const replace2 = `    const key = \`\${baseColor}-\${bucket}-\${type}-\${opacity}-\${transparent}-\${weather}-\${level}-\${bType}\`;`;
content = content.replace(target2, replace2);

const target3 = `        // Adjust base color by level
        if (level === 2) c.offsetHSL(0, 0.1, 0.1);
        else if (level >= 3) c.offsetHSL(0.05, 0.2, -0.1); // premium darker tint`;

const replace3 = `        // Adjust base color by level and type
        if (bType === BuildingType.Commercial) {
            if (level === 2) c.offsetHSL(0, 0.2, 0.15); // brighter commercial
            else if (level >= 3) c.offsetHSL(0.1, 0.3, -0.05); // neon tint
        } else if (bType === BuildingType.Industrial) {
            if (level === 2) c.offsetHSL(0, -0.1, -0.1); // grungier
            else if (level >= 3) c.offsetHSL(0, -0.2, -0.2); // very dark
        } else {
            // Residential or generic
            if (level === 2) c.offsetHSL(0, 0.1, 0.1);
            else if (level >= 3) c.offsetHSL(0.05, 0.2, -0.1); // premium darker tint
        }`;
content = content.replace(target3, replace3);

const target4 = `        // Add more detail / roughness changes based on weather
        const roughness = weather === 'rainy' ? 0.3 : 0.8;`;

const replace4 = `        // Add more detail / roughness changes based on weather and level
        let roughness = weather === 'rainy' ? 0.3 : 0.8;
        if (bType === BuildingType.Commercial && level >= 3) roughness -= 0.2; // smoother premium commercial
        if (bType === BuildingType.Industrial) roughness += 0.1; // rougher industrial
        let metalness = 0.1;
        if (weather === 'rainy') metalness = 0.4;
        if (bType === BuildingType.Commercial && level >= 3) metalness += 0.3;`;
content = content.replace(target4, replace4);

const target5 = `        materialCache[key] = new THREE.MeshStandardMaterial({
            color: matColor,
            flatShading: true,
            opacity,
            transparent,
            roughness
        });`;

const replace5 = `        materialCache[key] = new THREE.MeshStandardMaterial({
            color: matColor,
            flatShading: true,
            opacity,
            transparent,
            roughness,
            metalness
        });`;
content = content.replace(target5, replace5);

const target6 = `  const mainMat = getCachedMaterial(baseColor, hash, 'main', opacity, transparent, weather, level);
  const accentMat = getCachedMaterial(baseColor, hash, 'accent', opacity, transparent, weather, level);
  const roofMat = getCachedMaterial(baseColor, hash, 'roof', opacity, transparent, weather, level);`;

const replace6 = `  const mainMat = getCachedMaterial(baseColor, hash, 'main', opacity, transparent, weather, level, type);
  const accentMat = getCachedMaterial(baseColor, hash, 'accent', opacity, transparent, weather, level, type);
  const roofMat = getCachedMaterial(baseColor, hash, 'roof', opacity, transparent, weather, level, type);`;
content = content.replace(target6, replace6);

fs.writeFileSync(path, content);
console.log("Material cache patched.");
