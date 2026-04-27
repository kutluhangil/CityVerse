const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tDNS1 = `const DayNightSystem = () => {`;
const pDNS1 = `const DayNightSystem = ({ weather }: { weather: string }) => {`;
content = content.replace(tDNS1, pDNS1);

const tDNS2 = `const dayColor = new THREE.Color(0xcceeff);
                const nightColor = new THREE.Color(0x1e1b4b);`;
const pDNS2 = `                let dayHex = 0xcceeff;
                if (weather === 'rainy') dayHex = 0x94a3b8; // Slate
                else if (weather === 'snowy') dayHex = 0xe0f2fe; // Very light blue
                
                const dayColor = new THREE.Color(dayHex);
                const nightColor = new THREE.Color(0x1e1b4b);`;
content = content.replace(tDNS2, pDNS2);

const tDNS3 = `dirLightRef.current.intensity = dayBlend * 2.5;`;
const pDNS3 = `            let maxIntensity = 2.5;
            if (weather === 'rainy') maxIntensity = 1.0;
            if (weather === 'snowy') maxIntensity = 1.5;
            dirLightRef.current.intensity = dayBlend * maxIntensity;`;
content = content.replace(tDNS3, pDNS3);

const tDNS4 = `<DayNightSystem />`;
const pDNS4 = `<DayNightSystem weather={weather} />`;
content = content.replace(tDNS4, pDNS4);

fs.writeFileSync(path, content);
console.log("Patched DayNightSystem");
