uniform sampler2D uClothMap;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTime;
uniform float uSeed;
uniform float uLightFlicker;
uniform float uLightning;
uniform float uTouchMotion;

varying vec3 vLocal;
varying vec2 vClothUv;
varying vec3 vWorldPosition;
varying vec3 vViewDir;
varying vec3 vViewNormal;
varying float vContact;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
      mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x),
      f.y
    ),
    mix(
      mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
      mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x),
      f.y
    ),
    f.z
  );
}

void main() {
  float clothAlpha = texture2D(uClothMap, vClothUv).a;
  if (uOpacity * clothAlpha < 0.01) discard;
  // Smooth cloth normals soften the facets, while some geometric normal
  // keeps the moving folds legible. Work in view space for both normals.
  vec3 geometric = normalize(
    mat3(viewMatrix) * cross(dFdx(vWorldPosition), dFdy(vWorldPosition))
  );
  vec3 smoothNormal = normalize(vViewNormal);
  if (dot(geometric, smoothNormal) < 0.0) geometric = -geometric;
  float softNormal = mix(0.94, 0.72, vContact * uTouchMotion);
  vec3 n = normalize(mix(geometric, smoothNormal, softNormal));
  vec3 viewDir = normalize(mat3(viewMatrix) * vViewDir);
  if (dot(n, viewDir) < 0.0) n = -n;
  float fresnel = pow(1.0 - abs(dot(n, viewDir)), 1.15);

  // Light passes through the body; grazing angles catch a broad lavender
  // rim. Keep the weave quiet so translucency carries the material.
  float weave = noise(vLocal * 95.0 + uSeed * 13.0);
  vec3 lightDir = normalize(mat3(viewMatrix) * vec3(-0.5, 0.85, 0.65));
  // Wrapped light fills the folds, like a broad softbox through fabric.
  float light = clamp((dot(n, lightDir) + 0.45) / 1.45, 0.0, 1.0);
  float transmission = max(dot(-n, lightDir), 0.0);
  vec3 color = uColor * (0.78 + light * 0.24 + transmission * 0.12);
  color += mix(uColor, vec3(1.05, 0.88, 1.3), 0.4) * fresnel * 0.32;
  color *= 0.985 + weave * 0.03;
  float faceCloth = smoothstep(0.65, 0.9, vLocal.y);
  float alpha = 0.22 + fresnel * 0.22 + faceCloth * 0.14;
  alpha *= mix(0.3, 1.0, smoothstep(0.0, 0.18, vLocal.y));

  color += uColor * vContact * 0.05;
  if (!gl_FrontFacing) {
    color *= 0.72;
    alpha *= 0.32;
  }

  // They're the one light left when the power goes out, and lightning
  // shines straight through them.
  color *= 1.0 + (1.0 - uLightFlicker) * 0.8;
  color += uColor * uLightning * 0.3;

  gl_FragColor = vec4(color, alpha * uOpacity * clothAlpha);
}
