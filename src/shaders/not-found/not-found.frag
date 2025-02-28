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

    float scanlineCount = resolution.y * 0.45;
    float scanlineSpeed = -uTime * 15.0;
    float glitchOffset = random(vec2(uTime * 0.1)) * 0.02;
    float scanline = sin(vUv.y * scanlineCount + scanlineSpeed + glitchOffset);

    float distortion = sin(uTime * 2.0 + vUv.y * 10.0) * 0.001;
    color.rgb += color.rgb * scanline * (0.35 + distortion);

    float glitchLine = step(0.98, random(vec2(floor(vUv.y * 20.0), floor(uTime * .05))));
    color.rgb += glitchLine * 0.01;

    // noise
    vec2 noiseUv = vUv + uTime * 5.0;
    float noise = random(noiseUv);
    color.rgb += noise * 0.15;

    float grayscale = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(vec3(grayscale), color.a);
}