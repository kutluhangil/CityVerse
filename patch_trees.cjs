const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tImport = `import { BuildingType, Grid, TileData } from '../types';`;
const pImport = `import { BuildingType, Grid, TileData } from '../types';\nimport { PointLight } from 'three';`;
if (!content.includes('PointLight')) {
   content = content.replace(tImport, pImport);
}

const treeComponent = `
const Tree = ({ x, y, i, scale = 1, treeColor, isSphere = false, weather = 'sunny' }: { x: number, y: number, i: number, scale?: number, treeColor: string|THREE.Color, isSphere?: boolean, weather?: string }) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!groupRef.current) return;
        const speed = weather === 'rainy' || weather === 'snowy' ? 2 : 1;
        const swayAmount = weather === 'rainy' || weather === 'snowy' ? 0.08 : 0.03;
        const time = state.clock.elapsedTime;
        // Wind direction loosely towards +X, +Z
        const swayX = Math.sin(time * speed + x + i) * swayAmount;
        const swayZ = Math.cos(time * speed * 0.8 + y + i) * swayAmount;
        groupRef.current.rotation.set(swayZ, getHash(i, x) * Math.PI, -swayX);
    });

    return (
        <group position={[0, 0, 0]} scale={scale}>
            <group ref={groupRef}>
                <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                {isSphere ? (
                    <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={sphereGeo} position={[0, 0.35, 0]} scale={[0.3, 0.3, 0.3]} />
                ) : (
                    <group>
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.4, 0.5, 0.4]} />
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={coneGeo} position={[0, 0.65, 0]} scale={[0.3, 0.4, 0.3]} />
                    </group>
                )}
            </group>
        </group>
    );
};
`;

if (!content.includes('const Tree =')) {
    content = content.replace('const ProceduralBuilding =', treeComponent + '\nconst ProceduralBuilding =');
}

const tPark1 = `<group key={i} position={[pos[0], 0, pos[1]]} scale={scale} rotation={[0, getHash(i,x)*Math.PI, 0]}>
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={coneGeo} position={[0, 0.4, 0]} scale={[0.4, 0.5, 0.4]} />
                        <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: treeColor, flatShading: true })} geometry={coneGeo} position={[0, 0.65, 0]} scale={[0.3, 0.4, 0.3]} />
                    </group>`;
const pPark1 = `<group key={i} position={[pos[0], 0, pos[1]]}>
                        <Tree x={x} y={y} i={i} scale={scale} treeColor={treeColor} weather={weather} />
                    </group>`;
content = content.replace(tPark1, pPark1);

const tPark2 = `<group position={[-0.3, 0, 0.3]} scale={0.4}>
                  <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#78350f' })} geometry={cylinderGeo} position={[0, 0.15, 0]} scale={[0.1, 0.3, 0.1]} />
                  <mesh castShadow receiveShadow material={new THREE.MeshStandardMaterial({ color: '#22c55e', flatShading: true })} geometry={sphereGeo} position={[0, 0.35, 0]} scale={[0.3, 0.3, 0.3]} />
                </group>`;
const pPark2 = `<group position={[-0.3, 0, 0.3]}>
                   <Tree x={x} y={y} i={0} scale={0.4} treeColor={'#22c55e'} isSphere={true} weather={weather} />
                </group>`;
content = content.replace(tPark2, pPark2);

fs.writeFileSync(path, content);
console.log("Patched Trees");
