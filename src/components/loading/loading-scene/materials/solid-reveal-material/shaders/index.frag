precision highp float;

in vec2 vUv;
in vec3 vNormal;
in vec3 vWorldPosition;

out vec4 fragColor;

uniform float uTime;
uniform float uReveal;
uniform float uScreenReveal;

#pragma glslify: cnoise3 = require(glsl-noise/classic/3d)
#pragma glslify: cnoise4 = require(glsl-noise/classic/4d)

float isEdge(vec3 p, float voxelSize) {
  float edgeLimit = 0.94;
  float zEdge = float(abs(p.z) * voxelSize * 2.0 > edgeLimit);
  float yEdge = float(abs(p.y) * voxelSize * 2.0 > edgeLimit);
  float xEdge = float(abs(p.x) * voxelSize * 2.0 > edgeLimit);

  float totalEdge = xEdge + yEdge + zEdge;
  return totalEdge >= 1.0
    ? 1.0
    : 0.0;
}

struct VoxelData {
  float edgeFactor;
  float fillFactor;
  vec3 center;
  float size;
  float noiseBig;
  float noiseSmall;
};

VoxelData getVoxel(
  vec3 pWorld,
  float voxelSize,
  float noiseBigScale,
  float noiseSmallScale
) {
  vec3 voxelCenter = round(pWorld * voxelSize) / voxelSize;
  float noiseBig = cnoise4(vec4(voxelCenter * noiseBigScale, uTime * 0.05));
  float noiseSmall = cnoise3(voxelCenter * noiseSmallScale);
  float edgeFactor = isEdge(voxelCenter - pWorld, voxelSize);
  float fillFactor = 1.0 - edgeFactor;

  return VoxelData(
    edgeFactor,
    fillFactor,
    voxelCenter,
    voxelSize,
    noiseBig,
    noiseSmall
  );
}

float valueRemap(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main() {
  VoxelData voxel = getVoxel(vWorldPosition + vec3(0.0, 0.11, 0.1), 9.2, 0.2, 10.0);

  float edgeFactor = (1. - voxel.edgeFactor);

  float colorBump = voxel.noiseBig * 1.5;
  colorBump = clamp(colorBump, -1., 1.);
  // add small offset
  colorBump -= voxel.noiseSmall * 0.1;
  // shift over time
  colorBump += uTime * 0.2;
  // make it loop repetitions
  colorBump = fract(colorBump * 1.);
  // remap so that it leaves a trail
  colorBump = valueRemap(colorBump, 0.0, 0.1, 1.0, 0.0);
  colorBump = clamp(colorBump, 0.0, 1.0);
  colorBump *= edgeFactor;
  colorBump *= uReveal;

  if(voxel.noiseSmall * 0.5 + 0.5 < uScreenReveal) {
    discard;
    return;
  }

  fragColor = vec4(vec3(colorBump), 1.0);
  return;


  float loadingColor = colorBump * voxel.fillFactor * 3.0 * (1. - voxel.edgeFactor);

  vec3 normal = normalize(vNormal);
  vec3 color = normal * 0.5 + 0.5;
  fragColor = vec4(vec3(loadingColor), 1.0);

  // vec2 checkerUv = vec2(
  //   fract(vUv.x * 100.0),
  //   fract(vUv.y * 100.0)
  // );

  // float checker = step(0.5, mod(checkerUv.x + checkerUv.y, 1.0));

  // fragColor = vec4(vec3(checkerUv, 0.0), 1.0);
}
