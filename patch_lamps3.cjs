const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tLighting = `            // Update street lamps intensity
            streetLampMaterial.emissiveIntensity = nightBlend * (1.5 + Math.sin(time * 50) * Math.random() * 0.5);`;
const pLighting = `            // Update street lamps intensity - more stable with occasional individual tick
            streetLampMaterial.emissiveIntensity = nightBlend > 0.1 ? nightBlend * (1.5 + Math.sin(time * 15) * Math.random() * 0.2 + (Math.random() > 0.95 ? -0.5 : 0)) : 0;
            if (nightBlend > 0.5) streetLampMaterial.color.setHex(0xfef08a);
            else streetLampMaterial.color.setHex(0x9ca3af);`;

content = content.replace(tLighting, pLighting);

// I should fix WeatherParticles splashes to be more visible and arcs.
const tSplash1 = `                scale += 0.01;
                life -= 0.02;`;
const pSplash1 = `                x += (getHash(i, i) - 0.5) * 0.05; // tiny horizontal random bounce
                let yVelocity = (life - 0.5) * 0.1; // goes up then down
                // scale += 0.01;
                life -= 0.04;`;

content = content.replace(tSplash1, pSplash1);

const tSplash2 = `                dummy.position.set(x, splashY, z);
                dummy.scale.set(scale, scale, scale);
                dummy.rotation.set(-Math.PI/2, 0, 0); // Flat on ground`;
const pSplash2 = `                dummy.position.set(x, splashY + (1 - life) * 0.1, z);
                dummy.scale.set(scale * 1.5, scale * 1.5, scale * 1.5);
                dummy.rotation.set(0, 0, 0); // Upright for droplet bounce`;
content = content.replace(tSplash2, pSplash2);

const tSplashRing = `               <instancedMesh ref={splashRef} args={[new THREE.RingGeometry(0.5, 0.6, 8), undefined, splashCount]} raycast={() => null}>
                  <meshBasicMaterial color="#93c5fd" opacity={0.4} transparent side={THREE.DoubleSide} />
               </instancedMesh>`;
const pSplashRing = `               <instancedMesh ref={splashRef} args={[sphereGeo, undefined, splashCount]} raycast={() => null}>
                  <meshBasicMaterial color="#bae6fd" opacity={0.6} transparent depthWrite={false} />
               </instancedMesh>`;
content = content.replace(tSplashRing, pSplashRing);

fs.writeFileSync(path, content);
console.log("Patched Lamps material and Splashes");
