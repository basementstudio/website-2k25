precision highp float;

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

  vec3 noiseP = voxelCenter;
  float noiseBig = cnoise4(vec4(  noiseP * noiseBigScale, uTime * 0.05));
  float noiseSmall = cnoise3( noiseP * noiseSmallScale);
  // float edgeFactor = isEdge(voxelCenter - pWorld, voxelSize);
  float edgeFactor = 0.0;
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

  vec3 p = vWorldPosition + vec3(0.0, 0.11, 0.1);

  VoxelData voxel = getVoxel(p, 18.4, 0.2, 10.0);

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
  colorBump = pow(colorBump, 2.);
  // colorBump *= edgeFactor;
  colorBump *= uReveal > pow(voxel.noiseSmall * 0.5 + 0.5, 2.) ? 1.0 : 0.0;

  if(voxel.noiseSmall * 0.5 + 0.5 < uScreenReveal) {
    discard;
    return;
  }

  fragColor = vec4(vec3(colorBump), 1.0);
  return;


  float loadingColor = colorBump * voxel.fillFactor * 3.0 * (1. - voxel.edgeFactor);

  fragColor = vec4(vec3(loadingColor), 1.0);
}
