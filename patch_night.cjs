const fs = require('fs');

let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tSky = `<Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} inclination={0.2} azimuth={0.25} />`;
const pSky = ``;

if (!content.includes('SkyRef')) {
    content = content.replace(tSky, pSky);
}

const tDayNight = `        <group>
            <ambientLight ref={ambientLightRef} intensity={0.5} color="#cceeff" />`;
const pDayNight = `        <group>
            <Sky ref={skyRef} distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} rayleigh={0.5} turbidity={0.1} />
            <ambientLight ref={ambientLightRef} intensity={0.5} color="#cceeff" />`;

const tRefs = `const moonRef = useRef<THREE.Mesh>(null);`;
const pRefs = `const moonRef = useRef<THREE.Mesh>(null);
    const skyRef = useRef<any>(null);`;

const tSkyLogic = `ambientLightRef.current.color.lerpColors(nightColor, dayColor, dayBlend);
            }`;
const pSkyLogic = `ambientLightRef.current.color.lerpColors(nightColor, dayColor, dayBlend);
            }
            if (skyRef.current) {
                // Update sky sun position to match our directional light
                skyRef.current.material.uniforms.sunPosition.value.copy(dirLightRef.current.position);
                
                // Adjust rayleigh (scattering) at dawn/dusk for orange/red colors
                // dayBlend is 0 at night, 1 at midday
                // we want high scattering when dayBlend is between 0.1 and 0.4
                let scattering = 0.5;
                if (dayBlend > 0 && dayBlend < 0.6) {
                    scattering = 2.0 - Math.abs(dayBlend - 0.3) * 5; // peaks at 2.0
                }
                skyRef.current.material.uniforms.rayleigh.value = Math.max(0.5, scattering);
            }`;

if (!content.includes('skyRef.current.material')) {
    content = content.replace(tDayNight, pDayNight);
    content = content.replace(tRefs, pRefs);
    content = content.replace(tSkyLogic, pSkyLogic);
}

fs.writeFileSync(path, content);
console.log("Patched Day/Night Sky");
