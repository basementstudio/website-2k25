float valueRemap(float value, float min, float max) {
  return (value - min) / (max - min);
}

float valueRemap(
  float value,
  float min,
  float max,
  float newMin,
  float newMax
) {
  return (value - min) / (max - min) * (newMax - newMin) + newMin;
}

vec2 valueRemap(vec2 value, vec2 min, vec2 max, vec2 newMin, vec2 newMax) {
  return vec2(
    valueRemap(value.x, min.x, max.x, newMin.x, newMax.x),
    valueRemap(value.y, min.y, max.y, newMin.y, newMax.y)
  );
}

vec3 valueRemap(vec3 value, vec3 min, vec3 max, vec3 newMin, vec3 newMax) {
  return vec3(
    valueRemap(value.x, min.x, max.x, newMin.x, newMax.x),
    valueRemap(value.y, min.y, max.y, newMin.y, newMax.y),
    valueRemap(value.z, min.z, max.z, newMin.z, newMax.z)
  );
}

#pragma glslify: export(valueRemap)
