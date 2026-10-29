uniform vec3 uOutdoorTint;
uniform sampler2D uSkyLut;
uniform float fadeFactor;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;

const float PI = 3.141592653589793;

void main() {
  vec3 ray = vWorldPosition - cameraPosition;
  vec3 rd = normalize(ray);
  vec3 skyDir = normalize(vec3(rd.x, max(rd.y, 0.015), rd.z));
  float elevation = asin(clamp(skyDir.y, -1.0, 1.0));
  vec2 skyUv = vec2(
    atan(skyDir.x, skyDir.z) / (2.0 * PI),
    0.5 + 0.5 * sqrt(elevation / (PI * 0.5))
  );
  vec3 atmosphere = texture2D(uSkyLut, skyUv).rgb;
  float below = 1.0 - smoothstep(-0.1, 0.0, rd.y);
  atmosphere *= 1.0 - 0.45 * below;

  // Quiet silhouettes share the actual sky's day/night and weather colors.
  // Broad atmospheric contrast replaces windows, masonry and hard detail.
  float sideLight =
    0.96 +
    max(dot(normalize(vWorldNormal), normalize(vec3(-0.4, 0.8, 0.5))), 0.0) *
      0.04;
  vec3 silhouette =
    atmosphere * 0.65 * sideLight + uOutdoorTint * vec3(0.006, 0.008, 0.012);
  float distanceHaze = smoothstep(12.0, 100.0, length(ray.xz));
  float groundHaze = 1.0 - smoothstep(0.0, 8.0, vWorldPosition.y);
  float haze = 0.25 + distanceHaze * 0.35 + groundHaze * 0.3;
  vec3 color = mix(silhouette, atmosphere, haze);
  gl_FragColor = vec4(color * (1.0 - fadeFactor), 1.0);
}
