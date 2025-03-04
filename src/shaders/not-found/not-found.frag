uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2 resolution;

varying vec2 vUv;

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 shakeOffset(float time, float intensity) {
    vec2 shake = vec2(random(vec2(time * 0.3)) * 2.0 - 1.0, random(vec2(time * 0.2)) * 2.0 - 1.0);

    float shakeBurst = step(0.58, random(vec2(floor(time * 0.5))));
    return shake * intensity * shakeBurst;
}

void main() {
    float shakeIntensity = 0.0005;
    vec2 shake = shakeOffset(uTime, shakeIntensity);

    vec2 transformedUv = vUv + shake;
    transformedUv.x = 1.0 - transformedUv.x;
    transformedUv -= 0.5;
    float cosR = -1.0;
    float sinR = 0.0;
    vec2 rotatedUv = vec2(transformedUv.x * cosR - transformedUv.y * sinR, transformedUv.x * sinR + transformedUv.y * cosR);
    rotatedUv += 0.5;

    float aberrationAmount = 0.0001;
    aberrationAmount += random(vec2(floor(uTime * 0.2))) * 0.002;

    vec4 colorR = texture2D(tDiffuse, rotatedUv + vec2(aberrationAmount, 0.0));
    vec4 colorG = texture2D(tDiffuse, rotatedUv);
    vec4 colorB = texture2D(tDiffuse, rotatedUv - vec2(aberrationAmount, 0.0));

    vec4 color = vec4(colorR.r, colorG.g, colorB.b, colorG.a);

    float bleedAmount = 0.5;
    vec4 colorBleedUp = texture2D(tDiffuse, rotatedUv + vec2(0.0, 0.002));
    vec4 colorBleedDown = texture2D(tDiffuse, rotatedUv - vec2(0.0, 0.002));
    color += (colorBleedUp + colorBleedDown) * bleedAmount;

    float bloomGray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color = vec4(vec3(bloomGray), color.a);

    float scanlineCount = resolution.y * 0.45;
    float scanlineSpeed = -uTime * 15.0;
    float glitchOffset = random(vec2(uTime * 0.1)) * 0.02;
    float scanline = sin(vUv.y * scanlineCount + scanlineSpeed + glitchOffset);

    float distortion = sin(uTime * 2.0 + vUv.y * 10.0) * 0.001;
    color.rgb += color.rgb * scanline * (0.35 + distortion);

    float glitchLine = step(0.98, random(vec2(floor(vUv.y * 20.0), floor(uTime * 0.05))));
    color.rgb += glitchLine * .001;

    vec2 noiseUv = vUv + uTime * 5.0;
    float noise = random(noiseUv);
    float noisePulse = 0.15 + 0.05 * sin(uTime * 0.5);
    color.rgb += noise * noisePulse;

    float interference = sin(vUv.y * 10.0 + uTime * 10.0) * 0.02 *
        random(vec2(floor(uTime * 2.)));
    color.rgb += interference;

    float grayscale = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 tint = vec3(0.85, 0.95, 1.0);
    gl_FragColor = vec4(vec3(grayscale) * tint, color.a);
}