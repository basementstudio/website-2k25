varying vec2 vUv;
varying vec3 vWorldPosition;

uniform vec3 uColor;
uniform float uProgress;
uniform vec3 baseColor;
uniform sampler2D baseColorMap;
uniform float opacity;
uniform float noiseFactor;
uniform bool uReverse;


// noise based on https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83 patriciogonzalezvivo's work
float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float noise(vec3 p){
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);

    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = perm(b.xyxy);
    vec4 k2 = perm(k1.xyxy + b.zzww);

    vec4 c = k2 + a.zzzz;
    vec4 k3 = perm(c);
    vec4 k4 = perm(c + 1.0);

    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));

    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

    return o4.y * d.y + o4.x * (1.0 - d.y);
}

void main() {
    // Distance from center
    vec3 voxelCenter = round(vWorldPosition * 4.) / 4.;
    float randomOffset = noise(voxelCenter) * noiseFactor; 

    float dist = distance(voxelCenter, vec3(2.0, 0., -16.0));
    dist += randomOffset * 2.0;

    // Wave effect
    float wave = step(dist, uProgress * 20.0);
    float edge = step(dist, uProgress * 20.0 + 0.2) - wave;
    
    // Combine texture and base color
    vec3 color = baseColor * texture2D(baseColorMap, vUv).rgb;
    color = mix(color, uColor * wave + uColor * edge, wave + edge);

    // Reverse the opacity calculation and apply wave effect
    float opacityResult;
    if (uReverse) {
        opacityResult = wave;
        color = mix(color, vec3(1.0,1.0,1.0) * wave + vec3(1.0,1.0,1.0) * edge, wave + edge);
    } else {
        opacityResult = 1.0 - wave;
        color = mix(color, uColor, wave);
    }

    if (opacityResult <= 0.0) {
        discard;
    }

    gl_FragColor = vec4(color, opacityResult);
}