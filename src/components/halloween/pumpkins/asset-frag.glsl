uniform sampler2D uMap;
uniform vec3 uTint;
uniform float uHover;
uniform float uOpacity;
uniform float fadeFactor;
uniform float uLightFlicker;
uniform float uLightning;
#ifdef USE_PUMPKIN_EMISSIVE_MAP
uniform sampler2D uEmissiveMap;
uniform vec3 uEmissive;
uniform float uEmissivePulse;
#endif
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vAssetColor;

void main() {
  vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 skin = texture2D(uMap, vUv).rgb * uTint * vAssetColor;
  vec3 light = normalize(vec3(0.4, 0.8, 0.6));
  float diffuse = 0.42 + 0.55 * max(dot(n, light), 0.0);
  vec3 color = skin * diffuse * (0.3 + 0.7 * uLightFlicker);
  float spec = pow(
    max(dot(n, normalize(normalize(vViewDir) + light)), 0.0),
    24.0
  );
  color += vec3(0.07, 0.04, 0.01) * spec * uLightFlicker;
  color += skin * vec3(0.5, 0.65, 0.9) * uLightning;
  color += skin * vec3(0.2, 0.055, 0.005) * uHover;
  #ifdef USE_PUMPKIN_EMISSIVE_MAP
  // Preserve the GLB's emissive mask, tint and exported strength. The
  // candle inside keeps glowing when the office loses electrical power.
  color += texture2D(uEmissiveMap, vUv).rgb * uEmissive * uEmissivePulse * (1.0 + uHover * 0.5);
  #endif
  gl_FragColor = vec4(color * (1.0 - fadeFactor), uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
