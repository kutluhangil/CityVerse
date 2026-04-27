const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tRainDrift = `            y -= speed;
            if (isSnow) x += Math.sin(y + i) * 0.01;
            
            if (y < -0.5) {`;
const pRainDrift = `            y -= speed;
            x += speed * 0.8; // Wind drift X
            z += speed * 0.24; // Wind drift Z
            if (isSnow) x += Math.sin(y + i) * 0.01;
            
            if (y < -0.5 || x > GRID_SIZE) {`;

content = content.replace(tRainDrift, pRainDrift);

// I'll make the tree sway more unified towards +X, +Z to act like wind.
const tTreeSway = `        // Wind direction loosely towards +X, +Z
        const swayX = Math.sin(time * speed + x + i) * swayAmount;
        const swayZ = Math.cos(time * speed * 0.8 + y + i) * swayAmount;
        groupRef.current.rotation.set(swayZ, getHash(i, x) * Math.PI, -swayX);`;
const pTreeSway = `        // Wind direction loosely towards +X, +Z (unified)
        const windBase = Math.sin(time * speed + x * 0.1 + y * 0.1) * swayAmount;
        const windPush = swayAmount * 2; // Constant wind pushing it
        const swayX = windPush + windBase; 
        const swayZ = (windPush + windBase) * 0.3; 
        groupRef.current.rotation.set(swayZ, getHash(i, x) * Math.PI, -swayX);`;

content = content.replace(tTreeSway, pTreeSway);

fs.writeFileSync(path, content);
console.log("Patched Wind Unity");
