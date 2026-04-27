const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `            if (sunRef.current) {
                sunRef.current.position.copy(dirLightRef.current.position);
                sunRef.current.visible = !isNight;
            }
            if (moonRef.current) {
                moonRef.current.position.set(-dirLightRef.current.position.x, -dirLightRef.current.position.y, -dirLightRef.current.position.z);
                moonRef.current.visible = isNight;
            }
            
            const sunY = Math.sin(sunAngle);
            const isNight = sunY < 0;`;

const replacement = `            const sunY = Math.sin(sunAngle);
            const isNight = sunY < 0;
            
            if (sunRef.current) {
                sunRef.current.position.copy(dirLightRef.current.position);
                sunRef.current.visible = !isNight;
            }
            if (moonRef.current) {
                moonRef.current.position.set(-dirLightRef.current.position.x, -dirLightRef.current.position.y, -dirLightRef.current.position.z);
                moonRef.current.visible = isNight;
            }`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log("Fixed isNight scoping error");
