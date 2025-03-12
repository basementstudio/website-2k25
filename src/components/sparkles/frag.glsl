varying vec3 vColor;
varying float vOpacity;
varying vec3 vWorldPosition;

void main() {
  vec3 worldPosition = vWorldPosition;
  float distanceToCenter = distance(worldPosition, vec3(1.0));
  gl_FragColor = vec4(vColor, vOpacity);

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
