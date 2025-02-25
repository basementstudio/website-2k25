#pragma glslify: valueRemap = require('../utils/value-remap.glsl')

float basicLight(vec3 normal, vec3 lightDir, float intensity) {
  float lightFactor = dot(lightDir, normalize(normal));
  lightFactor = valueRemap(lightFactor, 0.2, 1.0, 0.1, 1.0);
  lightFactor = clamp(lightFactor, 0.0, 1.0);
  lightFactor = pow(lightFactor, 2.0);
  lightFactor *= intensity;
  lightFactor += 1.0;

  return lightFactor;
}

#pragma glslify: export(basicLight)
