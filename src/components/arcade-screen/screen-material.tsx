import { ShaderMaterial, Vector3 } from "three"

export const screenMaterial = new ShaderMaterial({
  uniforms: {
    map: { value: null },
    reflectionTexture: { value: null },
    smudgesTexture: { value: null },
    uTime: { value: 0 },
    uScanlineIntensity: { value: 0.1 },
    uScanlineFrequency: { value: 150.0 },
    uIsMonochrome: { value: true },
    uMonochromeColor: { value: new Vector3(1.0, 0.3, 0.0) },
    uColorNum: { value: 4.0 }
  },
  vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
  fragmentShader: `
          uniform sampler2D map;
          uniform sampler2D reflectionTexture;
          uniform sampler2D smudgesTexture;
          uniform float uTime;
          uniform float uScanlineIntensity;
          uniform float uScanlineFrequency;
          uniform bool uIsMonochrome;
          uniform vec3 uMonochromeColor;
          uniform float uColorNum;
          varying vec2 vUv;
          
          float random(vec2 c) {
            return fract(sin(dot(c.xy, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
          
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
          
            vec2 u = f * f * (3.0 - 2.0 * f);
          
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }
          
          void main() {
            vec2 curveUV = vUv * 2.0 - 1.0;
            vec2 offset = curveUV.yx * 0.2;
            curveUV += curveUV * offset * offset;
            
            // Add shake effect
            float shake = (noise(vec2(curveUV.y) * sin(uTime * 400.0) * 100.0) - 0.5) * 0.0025;
            curveUV.x += shake * 1.0;
            
            curveUV = curveUV * 0.5 + 0.5;
            
            vec3 color = vec3(0.0);
            
            // Calculate border
            vec2 borderSize = vec2(0.03, 0.04);
            vec2 borders = step(vec2(borderSize.x, borderSize.y), curveUV) * 
                          step(vec2(borderSize.x, borderSize.y), 1.0 - curveUV);
            float border = 1.0 - (borders.x * borders.y);
            
            vec2 gradientDist = min(curveUV, 1.0 - curveUV) / borderSize;
            float gradientFactor = min(gradientDist.x, gradientDist.y);
            float innerGradient = smoothstep(1.0, 2.0, gradientFactor);
            
            // Add bloom
            vec3 baseColor = vec3(0.2, 0.2, 0.2);
            vec3 mainContent = texture2D(map, curveUV).rgb;
            
           
            vec3 brightPass = max(mainContent - vec3(.1), 0.0); 
            vec3 coloredBloom = pow(brightPass, vec3(2.0)) * 5.0; 
            
            coloredBloom.r *= 1.2; // Boost red glow
            coloredBloom.g *= 1.1; // Boost green glow
            coloredBloom.b *= 1.3; // Boost blue glow
            
            mainContent = mainContent + coloredBloom;
            mainContent = mix(baseColor, mainContent, 0.8);
            
            // Add monochrome effect before scanlines
            if (uIsMonochrome) {
              float gray = dot(mainContent.rgb, vec3(0.4, 0.5, 0.1));
              gray = floor(gray * (uColorNum * 3.0) + 0.5) / (uColorNum * 3.0);
              vec3 adjustedColor = uMonochromeColor;
              adjustedColor.r *= 1.2;
              adjustedColor.g *= 0.9;
              mainContent.rgb = gray * adjustedColor * 3.5;
            }
            
            // Add scanlines
            float scanLine = sin(curveUV.y * uScanlineFrequency + uTime * 2.0) * uScanlineIntensity;
            mainContent *= 1.0 - scanLine;
            
            // Apply border and smudges
            color = mix(mainContent, vec3(0.0), border);
            vec3 smudges = texture2D(smudgesTexture, curveUV).rgb;
            color += smudges * 0.1;
            
            // Add reflection on top of everything
            vec3 reflection = texture2D(reflectionTexture, vec2(1.0 - curveUV.x, curveUV.y)).rgb;
            color += reflection * 0.4;
           
            
            gl_FragColor = vec4(color, 1.0);
          }
        `
})
