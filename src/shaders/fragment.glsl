varying vec2 vUv;
varying vec2 vUv2;
varying vec3 vWorldPosition;

uniform vec3 uColor;
uniform float uProgress;
uniform vec3 baseColor;
uniform sampler2D map;
uniform sampler2D lightMap;
uniform vec2 mapRepeat;
uniform float opacity;
uniform float noiseFactor;
uniform bool uReverse;

#pragma glslify: noise = require('./noise3.glsl')

vec3 gamma(vec3 color) {
    return pow(color, vec3(1.0 / 2.2)); // 2.2 is standard gamma correction value
}

// // ACES filmic tone mapping approximation
vec3 acesFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

// // Exposure tone mapping
vec3 exposureToneMap(vec3 color, float exposure) {
    return vec3(1.0) - exp(-color * exposure);
}

void main() {
    // Distance from center
    vec3 voxelCenter = round(vWorldPosition * 6.) / 6.;
    float randomOffset = noise(voxelCenter) * noiseFactor; 

    float dist = distance(voxelCenter, vec3(2.0, 0., -16.0));
    dist += randomOffset * 2.0;

    // Wave effect
    float wave = step(dist, uProgress * 20.0);
    float edge = step(dist, uProgress * 20.0 + 0.2) - wave;
    
    // Combine texture and base color
    vec4 mapSample = texture2D(map, vUv * mapRepeat);

    // TODO sample lightmap rounding the uv using info from the color map
    vec3 lightMapSample = texture2D(lightMap, vUv2).rgb;

    vec3 light = acesFilm(lightMapSample);

    vec3 irradiance = baseColor * mapSample.rgb + light;

    // Combine wave color
    irradiance = mix(irradiance, uColor * wave + uColor * edge, wave + edge);

    // Reverse the opacity calculation and apply wave effect
    float opacityResult;
    if (uReverse) {
        opacityResult = wave;
        irradiance = mix(irradiance, vec3(1.0,1.0,1.0) * wave + vec3(1.0,1.0,1.0) * edge, wave + edge);
    } else {
        opacityResult = 1.0 - wave;
        irradiance = mix(irradiance, uColor, wave);
    }

    if (opacityResult <= 0.0) {
        discard;
    }

    gl_FragColor = vec4(irradiance, opacityResult);
}
