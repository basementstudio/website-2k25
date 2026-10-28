uniform float uTime;
uniform float uSeed;

#include <common>
#include <skinning_pars_vertex>

varying vec3 vLocal;
varying vec3 vWorldPosition;
varying vec3 vViewDir;

void main() {
  vec3 p = position;
  // 0 at the top of the head, 1 at the hem: how loose the robe is there.
  float loose = pow(clamp(1.0 - p.y, 0.0, 1.0), 1.5);
  float angle = atan(p.z, p.x);
  float t = uTime + uSeed * 10.0;

  // Folds belong to the sheet. The spring-driven skeleton moves them as
  // one surface rather than sending unrelated waves through the body.
  float folds = sin(angle * 9.0 + p.y * 1.6);
  float fineFold = sin(angle * 15.0 - p.y * 2.5);
  float radial =
    (folds * 0.045 + fineFold * 0.012) * (1.0 - smoothstep(0.55, 0.96, p.y));
  p.xz += vec2(cos(angle), sin(angle)) * radial;

  // A small breeze at the hem; the head and body have no idle distortion.
  float hem = 1.0 - smoothstep(0.0, 0.32, p.y);
  float tatters = pow(0.5 + 0.5 * cos(angle * 7.0), 2.0);
  p.y -= tatters * hem * 0.065;
  p.y += sin(angle * 5.0 - t * 1.2) * 0.008 * hem;
  // The tail lags behind the sway of the head.
  p.z -= loose * 0.1;

  vec3 transformed = p;
  #include <skinbase_vertex>
  #include <skinning_vertex>
  vec4 world = modelMatrix * vec4(transformed, 1.0);
  // Features and weave stay attached to the fabric as it bends.
  vLocal = position;
  vWorldPosition = world.xyz;
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
