uniform float uTime;
uniform float uSeed;

varying vec3 vLocal;
varying vec3 vWorldPosition;
varying vec3 vViewDir;

void main() {
  vec3 p = position;
  // 0 at the top of the head, 1 at the hem: how loose the robe is there.
  float loose = pow(clamp(1.0 - p.y, 0.0, 1.0), 1.5);
  float angle = atan(p.z, p.x);
  float t = uTime + uSeed * 10.0;

  // Long folds hang from the head, opening and closing as gusts pass down
  // the sheet. Keep their phase coherent along the length of the fabric.
  float foldAngle = angle + sin(p.y * 3.0 - t * 1.2) * 0.12 * loose;
  float folds = sin(foldAngle * 9.0 + p.y * 1.6 - t * 0.65);
  float fineFold = sin(foldAngle * 15.0 - p.y * 2.5 + t * 0.9);
  float radial = (folds * 0.045 + fineFold * 0.012) * (1.0 - smoothstep(0.55, 0.96, p.y));
  p.xz += vec2(cos(angle), sin(angle)) * radial;

  // The head leads; the lower fabric follows with a delayed, broader wiggle.
  p.x += sin(t * 1.8 - p.y * 4.8) * (0.012 + loose * 0.15);
  p.x += sin(t * 3.1 - p.y * 8.0 + angle) * 0.025 * loose;
  p.z += sin(t * 1.5 - p.y * 5.5 + 0.8) * 0.085 * loose;

  // Rippling hem, torn into points that trail and flutter.
  float hem = 1.0 - smoothstep(0.0, 0.32, p.y);
  float tatters = pow(
    0.5 + 0.5 * cos(angle * 7.0 + sin(t * 1.3 + angle) * 0.35),
    2.0
  );
  p.y -= tatters * hem * 0.065;
  p.xz *= 1.0 + sin(angle * 4.0 - t * 2.2 + p.y * 5.0) * 0.13 * loose;
  p.y += sin(angle * 5.0 - t * 3.2) * 0.065 * loose;
  // The tail lags behind the sway of the head.
  p.z -= loose * 0.1;

  vec4 world = modelMatrix * vec4(p, 1.0);
  // Features and weave stay attached to the fabric as it bends.
  vLocal = position;
  vWorldPosition = world.xyz;
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
