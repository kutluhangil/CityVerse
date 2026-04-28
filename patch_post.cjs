const fs = require('fs');
let path = 'components/IsoMap.tsx';
let content = fs.readFileSync(path, 'utf8');

const tImports = `import { MapControls, Environment, SoftShadows, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera } from '@react-three/drei';`;
const pImports = `import { MapControls, Environment, SoftShadows, Instance, Instances, Float, useTexture, Outlines, OrthographicCamera, Sky } from '@react-three/drei';
import { EffectComposer, Bloom, DepthOfField, N8AO } from '@react-three/postprocessing';`;

if (!content.includes('EffectComposer')) {
    content = content.replace(tImports, pImports);
}

const tEffects = `<SoftShadows size={10} samples={8} />
      </Canvas>`;
const pEffects = `<SoftShadows size={15} samples={10} focus={0.5} />
        
        <EffectComposer autoClear={false}>
          {/* Ambient Occlusion for better crevices/shadows */}
          <N8AO halfRes color="black" aoRadius={1.5} intensity={2} />
          {/* Bloom for glowing elements (windows, street lamps, traffic lights) */}
          <Bloom luminanceThreshold={0.5} mipmapBlur luminanceSmoothing={0.5} intensity={1.5} />
          {/* Tilt-Shift/Depth of Field effect for miniature feel */}
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
        </EffectComposer>
      </Canvas>`;
content = content.replace(tEffects, pEffects);

const tSky = `<Environment preset="city" />`;
const pSky = `<Environment preset="city" />
        <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} inclination={0.2} azimuth={0.25} />`;
content = content.replace(tSky, pSky);

fs.writeFileSync(path, content);
console.log("Patched PostProcessing");
