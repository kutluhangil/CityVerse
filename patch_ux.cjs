const fs = require('fs');

let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add Html import
const tImports = `import { MapControls, Environment, SoftShadows, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera, Sky } from '@react-three/drei';`;
const pImports = `import { MapControls, Environment, SoftShadows, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera, Sky, Html } from '@react-three/drei';`;
if (!content.includes('Html } from')) {
    content = content.replace(tImports, pImports);
}

// Add FloatingText rendering inside ProceduralBuilding
// We'll just add an optional floating animation that pops up when a building is created.
const tBuildingProps = `const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, level = 1, weather = 'sunny', isDamaged = false }: BuildingMeshProps) => {`;
const pBuildingProps = `
const FloatingIncome = ({ type }: { type: BuildingType }) => {
    const [pop, setPop] = useState(true);
    useEffect(() => {
        const timeout = setTimeout(() => setPop(false), 2000);
        return () => clearTimeout(timeout);
    }, []);
    
    if (!pop) return null;

    let text = "";
    let color = "";
    if (type === BuildingType.Residential) { text = "+2 👤"; color = "#4ade80"; }
    else if (type === BuildingType.Commercial) { text = "+$50 💰"; color = "#fef08a"; }
    else if (type === BuildingType.Industrial) { text = "+$100 🏭"; color = "#f97316"; }
    else if (type === BuildingType.Park || type === BuildingType.ParkFountain || type === BuildingType.ParkPlayground) { text = "+😊"; color = "#60a5fa"; }

    if (!text) return null;

    return (
        <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none', zIndex: 10 }}>
            <div className="animate-bounce font-bold drop-shadow-md whitespace-nowrap" style={{ color: color, fontSize: '1rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {text}
            </div>
        </Html>
    );
};

const ProceduralBuilding = React.memo(({ type, baseColor, x, y, opacity = 1, transparent = false, level = 1, weather = 'sunny', isDamaged = false }: BuildingMeshProps) => {`;

if (!content.includes('FloatingIncome')) {
    content = content.replace(tBuildingProps, pBuildingProps);
}

// Add it inside the <group> that scales
const tScaleGroup = `groupRef.current.scale.y = progress < 1 ? Math.max(0.01, ez(progress)) : 1;`;
const pScaleGroup = `groupRef.current.scale.y = progress < 1 ? Math.max(0.01, ez(progress)) : 1;
          // Add a little spring bounce
          if (progress > 0.9 && progress < 1) {
              groupRef.current.scale.y = 1 + Math.sin((progress - 0.9) * Math.PI * 10) * 0.1;
          }`;
if (!content.includes('Add a little spring bounce')) {
    content = content.replace(tScaleGroup, pScaleGroup);
}

const tBuildingGroup = `<group position={[wx, yOffset, wz]} ref={groupRef}>`;
const pBuildingGroup = `<group position={[wx, yOffset, wz]} ref={groupRef}>
         <FloatingIncome type={type} />`;
if (!content.includes('<FloatingIncome')) {
    content = content.replace(tBuildingGroup, pBuildingGroup);
}

fs.writeFileSync(path, content);
console.log("Patched UX (Floating Text & Bouncier Animations)");
