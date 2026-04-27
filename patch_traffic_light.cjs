const fs = require('fs');
const path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldTrafficLightUseFrame = `  useFrame((state) => {
    const isX = Math.floor(state.clock.elapsedTime / 4 + x + y) % 2 === 0;
    if (refX.current && refY.current) {
      refX.current.color.setHex(isX ? 0x22c55e : 0xef4444);
      refY.current.color.setHex(!isX ? 0x22c55e : 0xef4444);
    }
  });`;

const newTrafficLightUseFrame = `  useFrame((state) => {
    const time = state.clock.elapsedTime / 4 + x + y;
    const cycle = time % 2;
    if (refX.current && refY.current) {
      if (cycle < 0.8) {
         refX.current.color.setHex(0x22c55e); refX.current.emissive?.setHex(0x22c55e);
         refY.current.color.setHex(0xef4444); refY.current.emissive?.setHex(0xef4444);
      } else if (cycle < 1.0) {
         refX.current.color.setHex(0xeab308); refX.current.emissive?.setHex(0xeab308);
         refY.current.color.setHex(0xef4444); refY.current.emissive?.setHex(0xef4444);
      } else if (cycle < 1.8) {
         refX.current.color.setHex(0xef4444); refX.current.emissive?.setHex(0xef4444);
         refY.current.color.setHex(0x22c55e); refY.current.emissive?.setHex(0x22c55e);
      } else {
         refX.current.color.setHex(0xef4444); refX.current.emissive?.setHex(0xef4444);
         refY.current.color.setHex(0xeab308); refY.current.emissive?.setHex(0xeab308);
      }
    }
  });`;

content = content.replace(oldTrafficLightUseFrame, newTrafficLightUseFrame);

const oldTrafficCycle = `      const trafficCycle = Math.floor(time / 4 + tarX + tarY) % 2 === 0 ? 'X' : 'Y'; 

      let canMove = true;
      if (isNextIntersection && movingAxis !== trafficCycle && progress > 0.6 && progress <= 1.0) {
        canMove = false;
        carsState.current[idx+4] = 0.6;
      }`;

const newTrafficCycle = `      const trafficCycleTime = (time / 4 + tarX + tarY) % 2;
      let trafficState = 'Red';
      if (movingAxis === 'X') {
         if (trafficCycleTime < 0.8) trafficState = 'Green';
         else if (trafficCycleTime < 1.0) trafficState = 'Yellow';
      } else {
         if (trafficCycleTime >= 1.0 && trafficCycleTime < 1.8) trafficState = 'Green';
         else if (trafficCycleTime >= 1.8) trafficState = 'Yellow';
      }

      let canMove = true;
      if (isNextIntersection && progress > 0.6 && progress <= 1.0) {
        if (trafficState === 'Red' || (trafficState === 'Yellow' && progress < 0.8)) {
           canMove = false;
           carsState.current[idx+4] = Math.min(progress, 0.6);
        }
      }`;

content = content.replace(oldTrafficCycle, newTrafficCycle);

fs.writeFileSync(path, content);
console.log("Updated traffic light logic");
