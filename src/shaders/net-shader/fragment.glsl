uniform sampler2D map;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec4 texColor = texture2D(map, vUv);

  vec3 baseColor = texColor.rgb * 3.0;
  float alpha = texColor.a;

  vec3 normal = normalize(vNormal);
  float rimLight = 1.0 - max(dot(normal, vec3(0.0, 0.0, 1.0)), 0.0);
  rimLight = pow(rimLight, 3.0) * 0.5;

  vec3 finalColor = baseColor + vec3(rimLight);

  gl_FragColor = vec4(finalColor, alpha);
}
