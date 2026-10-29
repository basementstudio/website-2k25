uniform vec3 uColor;
uniform float uEmission;
uniform float uLightFlicker;
uniform float uLightning;
uniform float fadeFactor;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vec3 n = normalize(vNormal);
  float key = 0.45 + 0.55 * max(dot(n, normalize(vec3(-0.4, 0.8, 0.6))), 0.0);
  float rim = pow(1.0 - abs(dot(n, normalize(vViewDir))), 2.2);
  vec3 color = uColor * (key * (0.3 + 0.7 * uLightFlicker) + uEmission);
  color += vec3(0.045, 0.032, 0.06) * rim * (0.4 + 0.6 * uLightFlicker);
  color += uColor * uLightning * 0.5;
  gl_FragColor = vec4(color * (1.0 - fadeFactor), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
