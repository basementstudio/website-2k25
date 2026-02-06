import type { DataTexture, Matrix3, Texture } from "three"
import { NodeMaterial } from "three/webgpu"
import {
  Fn,
  float,
  int,
  vec2,
  vec3,
  vec4,
  ivec2,
  uniform,
  texture as tslTexture,
  textureLoad,
  textureSize,
  uv,
  instanceIndex,
  attribute,
  varying,
  mat4,
  normalize,
  clamp,
  pow,
  dot,
  length,
  step,
  select,
  max,
  positionLocal
} from "three/tsl"

interface MapConfig {
  map: Texture
  mapTransform: Matrix3
}

export interface SkinningConfig {
  boneTexture: DataTexture | null
  keyframeTexture: DataTexture
  indirectTexture: DataTexture
  matricesTexture: DataTexture
  morphTexture: DataTexture | null
  activeMorphsTexture: DataTexture | null
  dataTextures: Map<string, DataTexture>
  useAnimations: boolean
  useMorphs: boolean
}

export const createCharacterMaterial = (mapConfigs?: MapConfig[]) => {
  const material = new NodeMaterial()

  const uFadeFactor = uniform(0)

  // Map texture uniforms (set at creation time)
  // Pass uv() as uvNode so the TextureNode constructor sets updateMatrix=false,
  // preventing the automatic matrix transform (we apply it manually in the shader)
  const mapCount = mapConfigs?.length ?? 0
  const uMapTextures = mapConfigs?.map((c) => tslTexture(c.map, uv())) ?? []
  const uMapTransforms =
    mapConfigs?.map((c) => uniform(c.mapTransform)) ?? []

  // --- Varyings (assigned in positionNode, read in colorNode) ---
  const vNormal = varying(vec3(0, 0, 0), "v_normal")
  const vWorldPosition = varying(vec3(0, 0, 0), "v_worldPosition")
  const vMapIndex = varying(float(0), "v_mapIndex")
  const vMapOffset = varying(vec2(0, 0), "v_mapOffset")
  const vLightColor = varying(vec4(0, 0, 0, 0), "v_lightColor")
  const vLightDirection = varying(vec4(0, 0, 0, 0), "v_lightDirection")
  const vPointLightPosition = varying(
    vec4(0, 0, 0, 0),
    "v_pointLightPosition"
  )
  const vPointLightColor = varying(vec4(0, 0, 0, 0), "v_pointLightColor")

  // --- Fragment shader helper ---
  const valueRemapFn = /* @__PURE__ */ Fn(
    ([value, inMin, inMax, outMin, outMax]: [any, any, any, any, any]) => {
      return float(outMin).add(
        float(value)
          .sub(inMin)
          .mul(float(outMax).sub(outMin))
          .div(float(inMax).sub(inMin))
      )
    }
  )

  // --- Fragment shader (colorNode) ---
  const result = Fn(() => {
    const vUv = uv()
    const normal = normalize(vNormal)

    // Multi-map sampling
    const mapSample = vec4(0, 0, 0, 1).toVar()

    if (mapCount > 0) {
      const samples = uMapTextures.map((tex, i) => {
        const mapUv = uMapTransforms[i]
          .mul(vec3(vUv.x, vUv.y, float(1.0)))
          .xy.add(vMapOffset)
        return tex.sample(mapUv)
      })

      if (samples.length === 1) {
        mapSample.assign(samples[0])
      } else if (samples.length === 2) {
        mapSample.assign(
          select(vMapIndex.lessThan(0.5), samples[0], samples[1])
        )
      } else if (samples.length === 3) {
        mapSample.assign(
          select(
            vMapIndex.lessThan(0.5),
            samples[0],
            select(vMapIndex.lessThan(1.5), samples[1], samples[2])
          )
        )
      } else if (samples.length >= 4) {
        mapSample.assign(
          select(
            vMapIndex.lessThan(0.5),
            samples[0],
            select(
              vMapIndex.lessThan(1.5),
              samples[1],
              select(vMapIndex.lessThan(2.5), samples[2], samples[3])
            )
          )
        )
      }
    }

    // Gamma correction (sRGB to linear)
    const color = pow(mapSample.rgb, vec3(2.2, 2.2, 2.2)).toVar()
    const alpha = mapSample.a

    const baseColor = vec3(color.x, color.y, color.z)

    // Directional light
    const lightIntensity = valueRemapFn(
      dot(vLightDirection.xyz, normal),
      float(-0.5),
      float(1.0),
      float(0.0),
      float(1.0)
    ).toVar()
    lightIntensity.assign(clamp(lightIntensity, 0.0, 1.0))
    lightIntensity.mulAssign(2.0)
    lightIntensity.addAssign(0.1) // ambient

    color.mulAssign(lightIntensity)
    color.mulAssign(vLightColor.rgb.mul(vLightColor.a))

    // Point light
    const lightRadius = vPointLightPosition.w
    const relativeLight = vPointLightPosition.xyz.sub(vWorldPosition)
    const lightDir = normalize(relativeLight)
    const lightDecay = clamp(
      float(1.0).sub(length(relativeLight).div(lightRadius)),
      0.0,
      1.0
    ).toVar()
    lightDecay.assign(pow(lightDecay, float(2.0)))
    const lightFactor = clamp(dot(lightDir, normal), 0.0, 1.0).mul(lightDecay)

    const pointLightColor = vPointLightColor.rgb
      .mul(vPointLightColor.a)
      .mul(lightFactor)
      .mul(baseColor)
    color.addAssign(pointLightColor)

    // Alpha test
    alpha.lessThan(0.8).discard()

    // Fade
    color.mulAssign(float(1.0).sub(uFadeFactor))

    return vec4(color, float(1.0))
  })()

  material.colorNode = result.rgb
  material.opacityNode = result.a

  // --- Skinning setup function (called after mesh textures are ready) ---
  const setupSkinning = (config: SkinningConfig) => {
    const {
      boneTexture,
      keyframeTexture,
      indirectTexture,
      matricesTexture,
      morphTexture,
      activeMorphsTexture,
      dataTextures,
      useAnimations,
      useMorphs
    } = config

    // Helper: calculate 2D coord from 1D index for a given texture
    const calcCoord = (tex: DataTexture, id: any) => {
      const size = int(textureSize(textureLoad(tex), int(0)).x)
      const x = int(id).mod(size)
      const y = int(id).div(size)
      return ivec2(x, y)
    }

    // Helper: get indirect batch index
    const getIndirectIndex = (id: any) => {
      return textureLoad(indirectTexture, calcCoord(indirectTexture, id)).x
    }

    // Helper: get batching matrix for an instance
    const getBatchingMatrixFn = /* @__PURE__ */ Fn(([batchId]: [any]) => {
      const size = int(textureSize(textureLoad(matricesTexture), int(0)).x)
      const j = int(batchId).mul(4)
      const x = j.mod(size)
      const y = j.div(size)
      const v1 = textureLoad(matricesTexture, ivec2(x, y))
      const v2 = textureLoad(matricesTexture, ivec2(x.add(1), y))
      const v3 = textureLoad(matricesTexture, ivec2(x.add(2), y))
      const v4 = textureLoad(matricesTexture, ivec2(x.add(3), y))
      return mat4(v1, v2, v3, v4)
    })

    const positionFn = Fn(() => {
      // Get batch index via indirect lookup.
      // WebGPU doesn't support drawIndex (WGSLNodeBuilder.getDrawIndex() returns null),
      // so we use instanceIndex which is what Three.js's BatchNode also uses for WebGPU.
      // On WebGL2 fallback with WEBGL_multi_draw, drawIndex (gl_DrawID) would be needed,
      // but the WebGL2 fallback's BatchNode also handles this switch automatically.
      const batchId = getIndirectIndex(instanceIndex)

      // --- Read per-instance data textures ---
      const mapIndexTex = dataTextures.get("uMapIndex")
      if (mapIndexTex) {
        vMapIndex.assign(
          float(textureLoad(mapIndexTex, calcCoord(mapIndexTex, batchId)).x)
        )
      }

      const mapOffsetTex = dataTextures.get("uMapOffset")
      if (mapOffsetTex) {
        vMapOffset.assign(
          textureLoad(mapOffsetTex, calcCoord(mapOffsetTex, batchId)).xy
        )
      }

      const lightDirTex = dataTextures.get("uLightDirection")
      if (lightDirTex) {
        vLightDirection.assign(
          textureLoad(lightDirTex, calcCoord(lightDirTex, batchId))
        )
      }

      const lightColorTex = dataTextures.get("uLightColor")
      if (lightColorTex) {
        vLightColor.assign(
          textureLoad(lightColorTex, calcCoord(lightColorTex, batchId))
        )
      }

      const ptLightPosTex = dataTextures.get("uPointLightPosition")
      if (ptLightPosTex) {
        vPointLightPosition.assign(
          textureLoad(ptLightPosTex, calcCoord(ptLightPosTex, batchId))
        )
      }

      const ptLightColorTex = dataTextures.get("uPointLightColor")
      if (ptLightColorTex) {
        vPointLightColor.assign(
          textureLoad(ptLightColorTex, calcCoord(ptLightColorTex, batchId))
        )
      }

      // --- Position computation ---
      // Read raw position/normal from geometry attributes (bypasses BatchNode)
      const pos = attribute("position", "vec3").toVar()
      const normal = attribute("normal", "vec3").toVar()

      // Apply morph targets
      if (useMorphs && morphTexture && activeMorphsTexture) {
        const vertexIdx = attribute("vertexIndex", "int")
        const morphOffsetRaw = textureLoad(
          activeMorphsTexture,
          calcCoord(activeMorphsTexture, batchId)
        ).x
        // morphOffset is -1 when disabled, >= 0 when active
        const isActive = float(step(float(0), float(morphOffsetRaw)))
        // Clamp to 0 minimum to avoid invalid texture coords
        const safeMorphOffset = max(int(morphOffsetRaw), int(0))
        const morphCoord = calcCoord(
          morphTexture,
          float(safeMorphOffset).add(float(vertexIdx))
        )
        const morphDelta = textureLoad(morphTexture, morphCoord).xyz
        pos.addAssign(morphDelta.mul(isActive))
      }

      // Apply bone skinning
      if (useAnimations && boneTexture) {
        const skinIndex = attribute("skinIndex", "vec4")
        const skinWeight = attribute("skinWeight", "vec4")

        // Get keyframe offset for this batch instance
        const keyframe = float(
          textureLoad(
            keyframeTexture,
            calcCoord(keyframeTexture, batchId)
          ).x
        )

        // Read bone matrix: 4 consecutive texels per bone
        const boneTexSize = int(
          textureSize(textureLoad(boneTexture), int(0)).x
        )
        const getBoneMatrix = (boneIdx: any) => {
          const j = int(keyframe.add(boneIdx)).mul(4)
          const x = j.mod(boneTexSize)
          const y = j.div(boneTexSize)
          const v1 = textureLoad(boneTexture, ivec2(x, y))
          const v2 = textureLoad(boneTexture, ivec2(x.add(1), y))
          const v3 = textureLoad(boneTexture, ivec2(x.add(2), y))
          const v4 = textureLoad(boneTexture, ivec2(x.add(3), y))
          return mat4(v1, v2, v3, v4)
        }

        const boneMat0 = getBoneMatrix(skinIndex.x)
        const boneMat1 = getBoneMatrix(skinIndex.y)
        const boneMat2 = getBoneMatrix(skinIndex.z)
        const boneMat3 = getBoneMatrix(skinIndex.w)

        // Weighted blend of bone matrices
        const boneSkinMatrix = boneMat0
          .mul(skinWeight.x)
          .add(boneMat1.mul(skinWeight.y))
          .add(boneMat2.mul(skinWeight.z))
          .add(boneMat3.mul(skinWeight.w))

        // Skin position
        const skinned = boneSkinMatrix.mul(vec4(pos, 1.0))
        pos.assign(skinned.xyz)

        // Skin normal (w=0 ignores translation)
        normal.assign(boneSkinMatrix.mul(vec4(normal, 0.0)).xyz)
      }

      // Apply batching matrix (per-instance world transform)
      const batchingMat = getBatchingMatrixFn(batchId)
      const batchedPos = batchingMat.mul(vec4(pos, 1.0)).xyz
      const batchedNormal = normalize(
        batchingMat.mul(vec4(normal, 0.0)).xyz
      )

      // Write varyings for fragment shader
      vNormal.assign(batchedNormal)
      vWorldPosition.assign(batchedPos)

      return batchedPos
    })()

    material.positionNode = positionFn

    // Override setupPosition to skip BatchNode and other standard pipeline steps.
    // Our positionNode handles everything: indirect lookup, morphs, skinning, and
    // batching matrix application. Without this override, BatchNode would also run
    // and potentially interfere with our custom position computation.
    material.setupPosition = function () {
      positionLocal.assign(
        (this as NodeMaterial & { positionNode: any }).positionNode
      )
      return positionLocal
    }

    material.needsUpdate = true
  }

  // Attach setupSkinning to material for consumer access
  ;(material as any)._setupSkinning = setupSkinning

  // Compatibility layer for consumer uniform access
  ;(material as any).uniforms = {
    fadeFactor: uFadeFactor,
    mapConfigs: { value: mapConfigs ?? [] },
    uMapSampler: { value: null }
  }

  return {
    material,
    setupSkinning,
    uniforms: {
      fadeFactor: uFadeFactor
    }
  }
}
