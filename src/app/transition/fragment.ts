export const planeFragmentShader = `
uniform vec2 winResolution;
uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform float uTransition;

vec4 fromLinear(vec4 linearRGB) {
    bvec3 cutoff = lessThan(linearRGB.rgb, vec3(0.0031308));
    vec3 higher = vec3(1.055)*pow(linearRGB.rgb, vec3(1.0/2.4)) - vec3(0.055);
    vec3 lower = linearRGB.rgb * vec3(12.92);

    return vec4(mix(higher, lower, cutoff), linearRGB.a);
}

void main() {
  vec2 uv = gl_FragCoord.xy / winResolution.xy;
  vec4 colorA = fromLinear(texture2D(uTextureA, uv));
  vec4 colorB = fromLinear(texture2D(uTextureB, uv));
  
  float transition = step(uv.x, uTransition);
  vec4 color = mix(colorA, colorB, transition);

  gl_FragColor = color;
}
`;