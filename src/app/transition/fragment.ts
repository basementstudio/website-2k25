export const planeFragmentShader = `
varying vec2 vUv;

uniform sampler2D textureA;
uniform sampler2D textureB;
uniform float uProgress;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
    vec2 uv = vUv;
    
    // Create a pixelated grid
    float aspectRatio = 16.0/9.0; // Adjust based on your needs
    float numCols = 16.0 * aspectRatio;
    vec2 grid = floor(vec2(uv.x * numCols, uv.y * 16.0));
    
    // Generate random value for each cell
    float randomValue = random(grid);
    float threshold = step(randomValue, uProgress);
    
    vec4 colorA = texture2D(textureA, uv);
    vec4 colorB = texture2D(textureB, uv);
    
    vec4 color = mix(colorA, colorB, threshold);
    gl_FragColor = color;
    
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;