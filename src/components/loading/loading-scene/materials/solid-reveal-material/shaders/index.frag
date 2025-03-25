precision highp float;

in vec3 vWorldPosition;
in float vDepth;

out vec4 fragColor;

uniform float uTime;
uniform float uReveal;
uniform float uScreenReveal;
uniform vec2 uScreenSize;
uniform sampler2D uFlowTexture;
uniform vec3 cameraPosition;

uniform mat4 viewMatrix; 
uniform mat4 projectionMatrix;

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

vec2 worldToUv(vec3 p) {
  vec4 clipPos = projectionMatrix * viewMatrix * vec4(p, 1.0);
  vec3 ndcPos = clipPos.xyz / clipPos.w;
  vec2 screenUv = (ndcPos.xy + 1.0) * 0.5;
  return screenUv;
}

void main() {

  vec3 p = vWorldPosition + vec3(0.0, 0.11, 0.1);

  VoxelData voxel = getVoxel(p, 12.4, 2., 20.0);

  if(voxel.noiseSmall * 0.5 + 0.5 < uScreenReveal) {
    discard;
    return;
  }

  //debug flow
  // fragColor = vec4(vec3(0.0, 0.0, 0.0), 1.0);
  
  
  // vec2 screenUv = ( gl_FragCoord.xy * 2.0 - uScreenSize ) / uScreenSize;
  // screenUv *= vec2(0.5, 0.5);
  // screenUv += vec2(0.5);

  vec2 screenUv = worldToUv(voxel.center);

  vec4 flowColor = texture(uFlowTexture, screenUv);


  float distanceToCamera = distance(cameraPosition, voxel.center);

  float flowCenter = flowColor.r;
  float flowRadius = flowColor.g;

  float flowSdf = abs(distanceToCamera - flowCenter);
  flowSdf = abs(flowSdf - flowRadius);
  flowSdf = 1. - flowSdf;
  flowSdf -= voxel.noiseSmall;
  flowSdf += pow(voxel.noiseBig, 2.) * 0.2;
  flowSdf = valueRemap(flowSdf, 0.5, 1., 0., 1.);
  flowSdf = clamp(flowSdf, 0.0, 1.0);
  flowSdf = pow(flowSdf, 4.);

  fragColor.rgb = vec3(flowSdf);
  fragColor.a = 1.0;
  return;

}
