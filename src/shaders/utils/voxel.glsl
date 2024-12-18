#pragma glslify: noise = require('../utils/noise3.glsl')

float isEdge(vec3 p, float voxelSize) {
  float edgeLimit = 0.92;
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
  float noiseBig = noise(voxelCenter * noiseBigScale);
  float noiseSmall = noise(voxelCenter * noiseSmallScale);
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

#pragma glslify: export(getVoxel)
#pragma glslify: export(VoxelData)

