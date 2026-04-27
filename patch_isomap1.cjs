const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tProps = `interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
  level?: number;
  weather?: string;
}`;
const pProps = `interface BuildingMeshProps {
  type: BuildingType;
  baseColor: string;
  x: number;
  y: number;
  opacity?: number;
  transparent?: boolean;
  level?: number;
  weather?: string;
  isDamaged?: boolean;
}`;
content = content.replace(tProps, pProps);

const tDust = `<ProceduralBuilding type={type} baseColor={color || '#fff'} x={x} y={y} level={level || 1} />`;
const pDust = `<ProceduralBuilding type={type} baseColor={color || '#fff'} x={x} y={y} level={level || 1} isDamaged={true} />`;
content = content.replace(tDust, pDust);

fs.writeFileSync(path, content);
console.log("Patched IsoMap props");
