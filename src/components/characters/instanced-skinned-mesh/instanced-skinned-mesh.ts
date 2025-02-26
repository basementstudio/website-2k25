/* eslint-disable react/no-is-mounted */
import * as THREE from "three"

THREE.ShaderChunk.skinning_pars_vertex =
  THREE.ShaderChunk.skinning_pars_vertex +
  /* glsl */ `
      #ifdef USE_BATCHED_SKINNING

          attribute vec4 skinIndex;
          attribute vec4 skinWeight;

          uniform highp usampler2D batchingKeyframeTexture;
          uniform highp sampler2D boneTexture;

          float getBatchedKeyframe( const in float batchId ) {

              int size = textureSize( batchingKeyframeTexture, 0 ).x;
              int j = int ( batchId );
              int x = j % size;
              int y = j / size;
              return float( texelFetch( batchingKeyframeTexture, ivec2( x, y ), 0 ).r );

          }

          mat4 getBatchedBoneMatrix( const in float i ) {

              float batchId = getIndirectIndex( gl_DrawID );
              float batchKeyframe = getBatchedKeyframe( batchId );

              int size = textureSize( boneTexture, 0 ).x;
              int j = int( batchKeyframe + i ) * 4;
              int x = j % size;
              int y = j / size;
              vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
              vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
              vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
              vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );

              return mat4( v1, v2, v3, v4 );

          }

      #endif
  `

THREE.ShaderChunk.skinning_vertex =
  THREE.ShaderChunk.skinning_vertex +
  /* glsl */ `
      #ifdef USE_BATCHED_SKINNING

          vec4 skinVertex = vec4( transformed, 1.0 );

          mat4 boneSkinMatrix = mat4( 0.0 );
          mat4 boneMatX = getBatchedBoneMatrix( skinIndex.x );
          mat4 boneMatY = getBatchedBoneMatrix( skinIndex.y );
          mat4 boneMatZ = getBatchedBoneMatrix( skinIndex.z );
          mat4 boneMatW = getBatchedBoneMatrix( skinIndex.w );

          mat4 weightedBoneMatX = skinWeight.x * boneMatX;
          mat4 weightedBoneMatY = skinWeight.y * boneMatY;
          mat4 weightedBoneMatZ = skinWeight.z * boneMatZ;
          mat4 weightedBoneMatW = skinWeight.w * boneMatW;

          boneSkinMatrix += weightedBoneMatX;
          boneSkinMatrix += weightedBoneMatY;
          boneSkinMatrix += weightedBoneMatZ;
          boneSkinMatrix += weightedBoneMatW;

          vec3 objectNormal = normal;

          // apply the skeleton animation to the normal
          vNormal = vec4(boneSkinMatrix * vec4(objectNormal, 0.0)).xyz;

          // get the mat transformation of the current instance
          mat3 bm = mat3( batchingMatrix );

          // apply the mat transformation to the normal
          vNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
          vNormal = normalize(bm * vNormal);

          vec4 skinned = vec4( 0.0 );
          skinned += weightedBoneMatX * skinVertex;
          skinned += weightedBoneMatY * skinVertex;
          skinned += weightedBoneMatZ * skinVertex;
          skinned += weightedBoneMatW * skinVertex;

          transformed = skinned.xyz;

      #endif
  `

const _offsetMatrix = new THREE.Matrix4()

interface InstanceParams {
  timeSpeed: number
  /** What frame each instance is on */
  time: number
  /** What animation each instance is playing */
  animationId: number
}

interface InstanceData extends InstanceParams {
  /** Instance id, position index */
  id: number
  /** Is active */
  active: boolean
}

export interface InstancedUniformParams {
  name: string
  defaultValue: number | number[]
  type: THREE.TextureDataType
}

interface InstancedBatchedSkinnedMeshParams {
  maxInstanceCount: number
  maxVertexCount: number
  maxIndexCount: number
  material: THREE.Material
  instancedUniforms?: InstancedUniformParams[]
}

export class InstancedBatchedSkinnedMesh extends THREE.BatchedMesh {
  /** All the skeletons in the mesh, one for each animation */
  private skeletons: THREE.Skeleton[] = []
  /** All the clips in the mesh, one for each animation */
  public clips: THREE.AnimationClip[] = []
  /** Where in the bone texture each animation starts */
  private offsets: number[] = []
  /** Frames per second, will be used to transform animations into a texture */
  private fps: number = 30

  private instanceData: InstanceData[] = []

  boneTexture: THREE.DataTexture | null = null
  batchingKeyframeTexture: THREE.DataTexture

  constructor({
    maxInstanceCount,
    maxVertexCount,
    maxIndexCount,
    material,
    instancedUniforms
  }: InstancedBatchedSkinnedMeshParams) {
    super(maxInstanceCount, maxVertexCount, maxIndexCount, material)
    this.offsets = Array(maxInstanceCount).fill(0)
    this.instanceData = Array(maxInstanceCount)
      .fill({})
      .map((_, i) => ({
        id: i,
        timeSpeed: 1,
        time: 0,
        animationId: -1,
        active: true
      }))

    let size = Math.sqrt(maxInstanceCount)
    size = Math.ceil(size)

    this.batchingKeyframeTexture = new THREE.DataTexture(
      new Uint32Array(size * size),
      size,
      size,
      THREE.RedIntegerFormat,
      THREE.UnsignedIntType
    )
    this.batchingKeyframeTexture.needsUpdate = true

    const instanceMapData = new Uint32Array(size * size).fill(0)
    for (let i = 0; i < size * size; i++) {
      instanceMapData[i] = i % 2
    }

    if (instancedUniforms) {
      instancedUniforms.forEach(({ name, defaultValue, type }) => {
        this.addInstancedUniform(name, defaultValue, type)
      })
    }

    this.material.onBeforeCompile = (shader) => {
      if (this.boneTexture === null) this.computeBoneTexture()

      shader.defines ??= {}
      shader.defines.USE_BATCHED_SKINNING = ""
      shader.uniforms.batchingKeyframeTexture = {
        value: this.batchingKeyframeTexture
      }
      shader.uniforms.boneTexture = { value: this.boneTexture }

      this.dataTextures.forEach((texture, name) => {
        if (!shader.uniforms[name]) {
          shader.uniforms[name] = { value: texture }
        } else {
          shader.uniforms[name].value = texture
        }
      })
    }
  }

  private geometries: Map<string, number> = new Map()

  // texutres used to store instance data
  private dataTextures: Map<string, THREE.DataTexture> = new Map()

  public addInstancedUniform(
    name: string,
    defaultValue: number | number[],
    type: THREE.TextureDataType = THREE.FloatType
  ): THREE.DataTexture {
    const textureSize = Math.ceil(Math.sqrt(this.maxInstanceCount))

    const totalPixels = textureSize * textureSize

    let format: THREE.PixelFormat = THREE.RGBAFormat

    const arrayDefault = Array.isArray(defaultValue)
      ? defaultValue
      : [defaultValue]

    if (arrayDefault.length === 1) {
      format =
        type === THREE.FloatType ? THREE.RedFormat : THREE.RedIntegerFormat
    } else if (arrayDefault.length === 2) {
      format = type === THREE.FloatType ? THREE.RGFormat : THREE.RGIntegerFormat
    } else if (arrayDefault.length === 3) {
      format =
        type === THREE.FloatType ? THREE.RGBFormat : THREE.RGBIntegerFormat
    } else if (arrayDefault.length === 4) {
      format =
        type === THREE.FloatType ? THREE.RGBAFormat : THREE.RGBAIntegerFormat
    }

    let data: Float32Array | Uint32Array | Uint8Array | Int32Array | null = null
    if (type === THREE.FloatType) {
      data = new Float32Array(totalPixels * arrayDefault.length)
    } else if (type === THREE.IntType) {
      data = new Int32Array(totalPixels * arrayDefault.length)
      console.warn("Int types for samplers might not work in windows.")
    } else if (type === THREE.UnsignedIntType) {
      data = new Uint32Array(totalPixels * arrayDefault.length)
      console.warn("Uint types for samplers might not work in windows.")
    }

    if (!data) {
      throw new Error("Invalid type")
    }

    for (let i = 0; i < totalPixels; i++) {
      data.set(arrayDefault, i * arrayDefault.length)
    }
    const texture = new THREE.DataTexture(
      data,
      textureSize,
      textureSize,
      format,
      type
    )
    texture.needsUpdate = true
    this.dataTextures.set(name, texture)
    return texture
  }

  public addGeometry(
    geometry: THREE.BufferGeometry,
    reservedVertexRange?: number,
    reservedIndexRange?: number
  ): number {
    const name = geometry.name
    const id = super.addGeometry(
      geometry,
      reservedVertexRange,
      reservedIndexRange
    )
    this.geometries.set(name, id)
    return id
  }

  public getGeometryId(name: string): number {
    return this.geometries.get(name) || 0
  }

  public addAnimation(
    skeleton: THREE.Skeleton,
    clip: THREE.AnimationClip
  ): number {
    clip.optimize()

    this.skeletons.push(skeleton)
    this.clips.push(clip)

    return this.skeletons.length - 1
  }

  /** Sets the animation for a given instance */
  public setInstanceAnimation(
    instanceId: number,
    animation: number | string
  ): void {
    const animationId =
      typeof animation === "string"
        ? this.clips.findIndex((clip) => clip.name === animation)
        : animation
    this.instanceData[instanceId].animationId = animationId
  }

  /** Creates a texture that will store each bone data for each animation (one row per animation frame) */
  public computeBoneTexture(): void {
    let offset = 0
    // Compute the offset of each animation
    for (let i = 0; i < this.skeletons.length; i++) {
      const skeleton = this.skeletons[i]
      const clip = this.clips[i]

      // Get the number of frames in the animation
      const steps = Math.ceil(clip.duration * this.fps)

      // Set the offset of the animation
      this.offsets[i] = offset
      offset += skeleton.bones.length * steps
    }

    // Calculate the size of the bone texture
    let size = Math.sqrt(offset * 4)
    size = Math.ceil(size / 4) * 4
    size = Math.max(size, 4)

    // Create the bone texture
    const boneMatrices = new Float32Array(size * size * 4)
    this.boneTexture = new THREE.DataTexture(
      boneMatrices,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )
    this.boneTexture.needsUpdate = true

    // Fill the bone texture with the bone matrices
    for (let i = 0; i < this.skeletons.length; i++) {
      const skeleton = this.skeletons[i]
      const clip = this.clips[i]

      const steps = Math.ceil(clip.duration * this.fps)
      const offset = this.offsets[i]

      let root = skeleton.bones[0]
      while (root.parent !== null && root.parent instanceof THREE.Bone) {
        root = root.parent
      }

      // Create an animation mixer to play the animation and store result in a texture
      const mixer = new THREE.AnimationMixer(root)

      const action = mixer.clipAction(clip)
      action.play()

      for (let j = 0; j < steps; j++) {
        mixer.update(1 / this.fps)
        root.updateMatrixWorld(true)

        for (let k = 0; k < skeleton.bones.length; k++) {
          const matrix = skeleton.bones[k].matrixWorld
          _offsetMatrix.multiplyMatrices(matrix, skeleton.boneInverses[k])
          // store data in boneMatrices
          _offsetMatrix.toArray(
            boneMatrices,
            (offset + (j * skeleton.bones.length + k)) * 16
          )
        }
      }
    }
  }

  public deleteInstance(instanceId: number): this {
    super.deleteInstance(instanceId)
    this.instanceData[instanceId].active = false
    return this
  }

  public addInstance(geometryId: number): number {
    const instanceId = super.addInstance(geometryId)
    this.instanceData[instanceId].active = true
    return instanceId
  }

  public createInstance(geometryId: number, data: InstanceParams): number {
    const instanceId = this.addInstance(geometryId)
    this.instanceData[instanceId] = {
      ...data,
      id: instanceId,
      active: true
    }
    return instanceId
  }

  public setInstanceUniform(
    instanceId: number,
    name: string,
    value: number | number[]
  ) {
    const texture = this.dataTextures.get(name)
    if (!texture) {
      console.warn("Setting data on non-existent uniform", name)
      return
    }

    const arrayValue = Array.isArray(value) ? value : [value]
    const numComponents = arrayValue.length
    texture.image.data.set(arrayValue, instanceId * numComponents)
    texture.needsUpdate = true
  }

  /** Set instance data */
  public setInstanceData(
    instanceId: number,
    data: Partial<InstanceParams>
  ): void {
    if (data.time !== undefined) this.instanceData[instanceId].time = data.time
    if (data.timeSpeed !== undefined)
      this.instanceData[instanceId].timeSpeed = data.timeSpeed
    if (data.animationId !== undefined)
      this.instanceData[instanceId].animationId = data.animationId
  }

  /** Tick animations */
  public update(delta: number): void {
    for (let i = 0; i < this.instanceData.length; i++) {
      const instance = this.instanceData[i]
      if (!instance.active) continue
      const animationId = instance.animationId
      if (animationId === -1) continue

      const skeleton = this.skeletons[animationId]
      const clip = this.clips[animationId]

      const steps = Math.ceil(clip.duration * this.fps)

      // Get the start index of the animation for this instance
      const offset = this.offsets[animationId]

      // Update time for animation
      instance.time += delta * instance.timeSpeed
      instance.time = THREE.MathUtils.clamp(
        instance.time - // eslint-disable-next-line prettier/prettier
        Math.floor(instance.time / clip.duration) * clip.duration,
        0,
        clip.duration
      )

      // Get frame based on time and fps
      const frame = Math.floor(instance.time * this.fps) % steps

      // Sample the animation data
      this.batchingKeyframeTexture.image.data[i] =
        offset + frame * skeleton.bones.length
    }
    this.batchingKeyframeTexture.needsUpdate = true
  }
}
