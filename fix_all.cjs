const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. ProceduralBuilding: apply variations in color and detail based on level and weather
const oldGetCachedMaterial = `const getCachedMaterial = (baseColor: string, hash: number, type: 'main' | 'accent' | 'roof', opacity: number, transparent: boolean, weather: string) => {`;
const newGetCachedMaterial = `const getCachedMaterial = (baseColor: string, hash: number, type: 'main' | 'accent' | 'roof', opacity: number, transparent: boolean, weather: string, level: number = 1) => {`;
content = content.replace(oldGetCachedMaterial, newGetCachedMaterial);

const oldKey = `const key = \`\${baseColor}-\${bucket}-\${type}-\${opacity}-\${transparent}-\${weather}\`;`;
const newKey = `const key = \`\${baseColor}-\${bucket}-\${type}-\${opacity}-\${transparent}-\${weather}-\${level}\`;`;
content = content.replace(oldKey, newKey);

const oldColorGen = `        if (type === 'accent') matColor = new THREE.Color(c).multiplyScalar(0.7);
        if (type === 'roof') {
            if (weather === 'snowy') {
                matColor = new THREE.Color('#f8fafc');
            } else {
                matColor = new THREE.Color(c).multiplyScalar(0.5).offsetHSL(0,0,-0.1);
            }
        }`;
const newColorGen = `        // Adjust base color by level
        if (level === 2) c.offsetHSL(0, 0.1, 0.1);
        else if (level >= 3) c.offsetHSL(0.05, 0.2, -0.1); // premium darker tint

        if (type === 'accent') matColor = new THREE.Color(c).multiplyScalar(0.7);
        if (type === 'roof') {
            if (weather === 'snowy') {
                matColor = new THREE.Color('#f8fafc');
            } else {
                matColor = new THREE.Color(c).multiplyScalar(0.5).offsetHSL(0,0,-0.1);
            }
        }
        
        // Add more detail / roughness changes based on weather
        const roughness = weather === 'rainy' ? 0.3 : 0.8;
`;
content = content.replace(oldColorGen, newColorGen);

const oldRoughness = `roughness: 0.8`;
const newRoughness = `roughness`; // Use the variable
content = content.replace(oldRoughness, newRoughness);

// ProceduralBuilding passing level to getCachedMaterial
const oldMainMat = `const mainMat = getCachedMaterial(baseColor, hash, 'main', opacity, transparent, weather);
  const accentMat = getCachedMaterial(baseColor, hash, 'accent', opacity, transparent, weather);
  const roofMat = getCachedMaterial(baseColor, hash, 'roof', opacity, transparent, weather);`;
const newMainMat = `const mainMat = getCachedMaterial(baseColor, hash, 'main', opacity, transparent, weather, level);
  const accentMat = getCachedMaterial(baseColor, hash, 'accent', opacity, transparent, weather, level);
  const roofMat = getCachedMaterial(baseColor, hash, 'roof', opacity, transparent, weather, level);`;
content = content.replace(oldMainMat, newMainMat);

// 2. DayNightSystem smooth transitions
const oldDayNightLogic = `            const isNight = dirLightRef.current.position.y < 0;
            dirLightRef.current.intensity = isNight ? 0 : Math.max(0, Math.sin(sunAngle) * 2);
            
            // Toggle emissive materials
            windowMaterial.emissiveIntensity = isNight ? 1.0 : 0.0;
            streetLampMaterial.emissiveIntensity = isNight ? 1.5 + Math.sin(time * 50) * Math.random() * 0.5 : 0.0;
        }
        
        if (ambientLightRef.current) {
            const isNight = Math.sin(sunAngle) < 0;
            ambientLightRef.current.intensity = isNight ? 0.2 : 0.5;
            ambientLightRef.current.color.setHex(isNight ? 0x1e1b4b : 0xcceeff);
        }`;
const newDayNightLogic = `            const sunY = Math.sin(sunAngle);
            const isNight = sunY < 0;
            
            // Smoothly lerp intensities based on sun height
            const dayBlend = Math.max(0, Math.min(1, (sunY + 0.2) / 0.4)); // 0 at dawn/dusk, 1 at midday
            dirLightRef.current.intensity = dayBlend * 2.5;
            
            const nightBlend = 1 - dayBlend;
            windowMaterial.emissiveIntensity = nightBlend;
            streetLampMaterial.emissiveIntensity = nightBlend * (1.5 + Math.sin(time * 50) * Math.random() * 0.5);
            
            if (ambientLightRef.current) {
                const targetIntensity = 0.2 * nightBlend + 0.5 * dayBlend;
                ambientLightRef.current.intensity = targetIntensity;
                // lerp colors
                const dayColor = new THREE.Color(0xcceeff);
                const nightColor = new THREE.Color(0x1e1b4b);
                ambientLightRef.current.color.lerpColors(nightColor, dayColor, dayBlend);
            }
        }`;
content = content.replace(oldDayNightLogic, newDayNightLogic);

// 3. Traffic System weather drift & braking
const oldTrafficSig = `const TrafficSystem = ({ grid, maxCars }: { grid: Grid, maxCars: number }) => {`;
const newTrafficSig = `const TrafficSystem = ({ grid, maxCars, weather }: { grid: Grid, maxCars: number, weather: string }) => {`;
content = content.replace(oldTrafficSig, newTrafficSig);

const oldTrafficYield = `      let canMove = true;
      if (isNextIntersection && progress > 0.6 && progress <= 1.0) {
        if (trafficState === 'Red' || (trafficState === 'Yellow' && progress < 0.8)) {
           canMove = false;
           carsState.current[idx+4] = Math.min(progress, 0.6);
        }
      }

      if (canMove && tarNode) {
        progress += speed;
      }`;
const newTrafficYield = `      let canMove = true;
      let currentSpeed = speed;
      
      // Braking for yellow
      if (isNextIntersection && progress > 0.4 && trafficState === 'Yellow') {
         currentSpeed *= 0.5; // slow down on yellow
      }
      
      if (isNextIntersection && progress > 0.6 && progress <= 1.0) {
        if (trafficState === 'Red' || (trafficState === 'Yellow' && progress < 0.8)) {
           canMove = false;
           carsState.current[idx+4] = Math.min(progress, 0.6);
        }
      }
      
      // Simple yielding to car in front
      for (let j = 0; j < carCount; j++) {
         if (i === j) continue;
         const jIdx = j * 6;
         const jTx = carsState.current[jIdx+2];
         const jTy = carsState.current[jIdx+3];
         const jP = carsState.current[jIdx+4];
         if (jTx === tarX && jTy === tarY && jP > progress && (jP - progress) < 0.3) {
             currentSpeed *= 0.2; // yield to car in front
             break;
         }
      }

      if (canMove && tarNode) {
        progress += currentSpeed;
      }`;
content = content.replace(oldTrafficYield, newTrafficYield);

const oldLaneSway = `      const laneSway = isNextIntersection ? 0 : Math.sin(time * 2 + i) * 0.05;
      const offsetAmt = 0.15 + laneSway;`;
const newLaneSway = `      const snowDrift = weather === 'snowy' ? Math.cos(time * 3 + i) * 0.08 : 0;
      const laneSway = isNextIntersection ? 0 : Math.sin(time * 2 + i) * 0.05 + snowDrift;
      const offsetAmt = 0.15 + laneSway;`;
content = content.replace(oldLaneSway, newLaneSway);

// Update TrafficSystem call in IsoMap
const oldTrafficCall = `<TrafficSystem grid={grid} maxCars={maxCars} />`;
const newTrafficCall = `<TrafficSystem grid={grid} maxCars={maxCars} weather={weather} />`;
content = content.replace(oldTrafficCall, newTrafficCall);

// 4. Fog effect and Visual border
// We can embed a Fog component in EnvironmentEffects
const oldWeatherParticles = `<WeatherParticles type={weather} />`;
const newWeatherParticles = `<WeatherParticles type={weather} />
            {/* Drifting fog effect */}
            {weather !== 'sunny' && <FogOverlay weather={weather} />}`;
content = content.replace(oldWeatherParticles, newWeatherParticles);

const oldFogLayer = `const WeatherParticles = ({ type }: { type: string }) => {`;
const newFogLayer = `const FogOverlay = ({ weather }: { weather: string }) => {
    const fogRef = useRef<THREE.InstancedMesh>(null);
    const count = weather === 'snowy' ? 30 : (weather === 'rainy' ? 10 : 0);
    const particles = useRef(new Float32Array(count * 4)); // x, y, z, speed
    const dummy = useMemo(() => new THREE.Object3D(), []);

    useEffect(() => {
        for (let i = 0; i < count; i++) {
            particles.current[i*4] = getRandomRange(-GRID_SIZE, GRID_SIZE);
            particles.current[i*4+1] = getRandomRange(1, 4);
            particles.current[i*4+2] = getRandomRange(-GRID_SIZE, GRID_SIZE);
            particles.current[i*4+3] = getRandomRange(0.01, 0.03); // drifting speed
        }
    }, [count]);

    useFrame((state) => {
        if (!fogRef.current || count === 0) return;
        for (let i = 0; i < count; i++) {
            let x = particles.current[i*4];
            let y = particles.current[i*4+1];
            let z = particles.current[i*4+2];
            const speed = particles.current[i*4+3];

            x += speed; // drift right
            x += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.01; // sway

            if (x > GRID_SIZE + 5) {
                x = -GRID_SIZE - 5;
                y = getRandomRange(1, 4);
                z = getRandomRange(-GRID_SIZE, GRID_SIZE);
            }

            particles.current[i*4] = x;
            dummy.position.set(x, y, z);
            dummy.scale.set(10, 4, 10);
            dummy.rotation.set(0, state.clock.elapsedTime * 0.1, 0);
            dummy.updateMatrix();
            fogRef.current.setMatrixAt(i, dummy.matrix);
        }
        fogRef.current.instanceMatrix.needsUpdate = true;
    });

    if (count === 0) return null;

    return (
        <instancedMesh ref={fogRef} args={[sphereGeo, undefined, count]} raycast={() => null}>
            <meshStandardMaterial color={weather === 'snowy' ? "#ffffff" : "#cbd5e1"} transparent opacity={weather === 'snowy' ? 0.2 : 0.1} depthWrite={false} roughness={1} />
        </instancedMesh>
    );
};

const WeatherParticles = ({ type }: { type: string }) => {`;
content = content.replace(oldFogLayer, newFogLayer);

// Visual Grid Border
const oldGridBorder = `            <HeatmapOverlay grid={grid} mode={dataMode} />

            {/* Placement Preview */}`;
const newGridBorder = `            <HeatmapOverlay grid={grid} mode={dataMode} />
            <GridBorder />

            {/* Placement Preview */}`;
content = content.replace(oldGridBorder, newGridBorder);

const borderComponent = `

const GridBorder = () => {
    const borderRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((state) => {
        if (borderRef.current) {
            borderRef.current.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    const borderSize = GRID_SIZE;
    return (
        <group position={[0, -0.35, 0]}>
            <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0, 0]}>
                <ringGeometry args={[borderSize / 2, borderSize / 2 + 0.3, 4]} />
                <meshStandardMaterial ref={borderRef} color="#6366f1" transparent opacity={0.5} emissive="#4f46e5" emissiveIntensity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI/2, 0, Math.PI/4]} position={[0, 0.01, 0]}>
                <ringGeometry args={[borderSize / 2 * Math.SQRT2 - 0.2, borderSize / 2 * Math.SQRT2 + 0.1, 4]} />
                <meshStandardMaterial color="#818cf8" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};
`;

content = content.replace(`const TrafficLight = ({ x, y }: { x: number, y: number }) => {`, borderComponent + `\nconst TrafficLight = ({ x, y }: { x: number, y: number }) => {`);

fs.writeFileSync(path, content);
console.log("Applied all bug fixes and enhancements");
