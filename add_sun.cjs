const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = "const ambientLightRef = useRef<THREE.AmbientLight>(null);";
const replacement1 = `const ambientLightRef = useRef<THREE.AmbientLight>(null);
    const sunRef = useRef<THREE.Mesh>(null);
    const moonRef = useRef<THREE.Mesh>(null);`;
content = content.replace(target1, replacement1);

const target2 = "dirLightRef.current.position.z = Math.sin(sunAngle) * 15;";
const replacement2 = `dirLightRef.current.position.z = Math.sin(sunAngle) * 15;
            
            if (sunRef.current) {
                sunRef.current.position.copy(dirLightRef.current.position);
                sunRef.current.visible = !isNight;
            }
            if (moonRef.current) {
                moonRef.current.position.set(-dirLightRef.current.position.x, -dirLightRef.current.position.y, -dirLightRef.current.position.z);
                moonRef.current.visible = isNight;
            }`;
content = content.replace(target2, replacement2);

const target3 = "<ambientLight ref={ambientLightRef} intensity={0.5} />";
const replacement3 = `<ambientLight ref={ambientLightRef} intensity={0.5} />
        <mesh ref={sunRef}>
            <sphereGeometry args={[2, 16, 16]} />
            <meshBasicMaterial color="#fcd34d" />
        </mesh>
        <mesh ref={moonRef}>
            <sphereGeometry args={[1.5, 16, 16]} />
            <meshBasicMaterial color="#e5e7eb" />
        </mesh>`;
content = content.replace(target3, replacement3);

fs.writeFileSync(path, content);
console.log("Updated lighting");
