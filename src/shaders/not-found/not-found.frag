uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 resolution;

varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // transform the uv
    vec2 transformedUv = vUv;
    transformedUv.x = 1.0 - transformedUv.x;
    transformedUv -= 0.5;
    float cosR = -1.0;
    float sinR = 0.0;
    vec2 rotatedUv = vec2(transformedUv.x * cosR - transformedUv.y * sinR, transformedUv.x * sinR + transformedUv.y * cosR);
    rotatedUv += 0.5;

    vec4 color = texture2D(tDiffuse, rotatedUv);
    float bloomGray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color = vec4(vec3(bloomGray), color.a);

    // scanlines
    float count = resolution.y * 0.45;
    float scanline = sin(vUv.y * count + uTime);
    vec3 scanlines = vec3(scanline);
    color.rgb += color.rgb * scanlines * 0.35; 

    // noise
    vec2 noiseUv = vUv + uTime * 0.1;
    float noise = random(noiseUv + uTime);
    color.rgb += noise * 0.1;

    float grayscale = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(vec3(grayscale), color.a);
}