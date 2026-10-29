uniform float fadeFactor;
uniform float uLightFlicker;
uniform float uLightning;
varying vec3 vColor;
varying vec3 vNormal;
varying float vHeight;
varying float vLit;

void main() {
  float room =
    0.45 +
    0.25 * max(dot(normalize(vNormal), normalize(vec3(0.4, 1.0, 0.6))), 0.0);
  // The wick lights its own wax even when the office loses power.
  vec3 color = vColor * room * (0.35 + 0.65 * uLightFlicker);
  color += vColor * vec3(0.7, 0.3, 0.06) * pow(max(vHeight, 0.0), 3.0) * vLit;
  color += vColor * vec3(0.5, 0.6, 0.8) * uLightning * 0.35;
  gl_FragColor = vec4(color * (1.0 - fadeFactor), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
