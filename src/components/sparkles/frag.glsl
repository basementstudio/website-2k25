varying vec3 vColor;
varying float vOpacity;
varying vec3 vWorldPosition;
uniform float fadeFactor;

void main() {
  vec3 worldPosition = vWorldPosition;
  float distanceToCenter = distance(worldPosition, vec3(1.0));
  gl_FragColor = vec4(vColor, vOpacity * (1.0 - fadeFactor));

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
