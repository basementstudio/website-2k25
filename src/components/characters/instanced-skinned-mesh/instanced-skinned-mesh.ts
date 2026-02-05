import * as THREE from "three"

import { subscribable } from "@/lib/subscribable"

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
  private fps: number = 25

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
  }

  /** Set up the TSL material with all mesh texture references */
  public setupMaterial(): void {
    if (this.boneTexture === null && this.useAnimations) {
      this.computeBoneTexture()
    }
    if (this.shouldComputeMorphTargets) {
      this.computeMorphTexture()
    }

    const setupSkinning = (this.material as any)._setupSkinning
    if (typeof setupSkinning === "function") {
      setupSkinning({
        boneTexture: this.boneTexture,
        keyframeTexture: this.batchingKeyframeTexture,
        indirectTexture: (this as any)._indirectTexture,
        matricesTexture: (this as any)._matricesTexture,
        morphTexture: this.morphTexture,
        activeMorphsTexture: this.dataTextures.get("uActiveMorphs") ?? null,
        dataTextures: this.dataTextures,
        useAnimations: this.useAnimations,
        useMorphs: this.useMorphs
      })
    }

    this.programCompiled = true
    this.programCompiledSubscribable.runCallbacks()
  }

  private programCompiled = false

  private programCompiledSubscribable = subscribable()

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
      console.error(
        "RGBFormat is not supported anymore, use RGBAFormat instead."
      )
    } else if (arrayDefault.length === 4) {
      format =
        type === THREE.FloatType ? THREE.RGBAFormat : THREE.RGBAIntegerFormat
    }

    let data: Float32Array | Uint32Array | Int32Array | null = null
    if (type === THREE.FloatType) {
      data = new Float32Array(totalPixels * arrayDefault.length)
    } else if (type === THREE.IntType) {
      data = new Int32Array(totalPixels * arrayDefault.length)
    } else if (type === THREE.UnsignedIntType) {
      data = new Uint32Array(totalPixels * arrayDefault.length)
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

  private geometryData: Map<number, THREE.BufferGeometry> = new Map()
  private morphDicts: Map<number, Record<string, number>> = new Map()

  public addGeometry(
    geometry: THREE.BufferGeometry,
    reservedVertexRange?: number,
    reservedIndexRange?: number
  ): number {
    // create a vertexIndex attribute
    const arr = new Int32Array(geometry.attributes.position.count)
    for (let i = 0; i < arr.length; i++) {
      arr[i] = i
    }
    geometry.setAttribute("vertexIndex", new THREE.BufferAttribute(arr, 1))

    const name = geometry.name
    const id = super.addGeometry(
      geometry,
      reservedVertexRange,
      reservedIndexRange
    )
    this.geometries.set(name, id)
    this.geometryData.set(id, geometry)

    return id
  }

  private shouldComputeMorphTargets = false
  private useMorphs = false

  public addMorphGeometry(
    geometryNameOrId: string | number,
    morphDict: Record<string, number>
  ): void {
    const id =
      typeof geometryNameOrId === "string"
        ? this.geometries.get(geometryNameOrId)
        : geometryNameOrId

    if (typeof id !== "number") {
      throw new Error("Geometry not found")
    }

    const geometry = this.geometryData.get(id)

    if (!geometry) {
      throw new Error("Geometry not found")
    }

    this.morphDicts.set(id, morphDict)
    this.shouldComputeMorphTargets = true
    this.useMorphs = true
  }

  /** An object containing the offset for each morph target
   * {
   *   [geometryId]: {
   *     [morphTargetName]: offset
   *   }
   * }
   */
  private morphOffsetsDict: Map<number, Record<string, number>> = new Map()

  private morphTexture: THREE.DataTexture | null = null

  public computeMorphTexture(): void {
    // It needs to be 4 because RGB format is not supported anymore:
    // https://discourse.threejs.org/t/using-three-rgbaformat-instead-of-three-rgbformat/37048
    const componentSize = 4 //xyza

    // number of pixels needed to store all morph targets
    let offset = 0

    // Loop through all the geometries (and their morph dictionaries)
    for (const [geometryId, morphDict] of this.morphDicts) {
      const geometry = this.geometryData.get(geometryId)

      if (!geometry) {
        throw new Error("Geometry not found")
      }

      const morphTargets = geometry.morphAttributes.position

      // use morhDicts to get the offset of each morph target
      for (const [morphName, morphIndex] of Object.entries(morphDict)) {
        const morphTarget = morphTargets[morphIndex]
        // store the offset start for each morph target
        this.morphOffsetsDict.set(geometryId, {
          ...(this.morphOffsetsDict.get(geometryId) || {}),
          [morphName]: offset
        })
        // add the number of components to the offset
        offset += morphTarget.count
      }
    }
    let size = Math.sqrt(offset)
    size = Math.ceil(size)

    const morphData = new Float32Array(size * size * componentSize)
    morphData.fill(0)

    // Fill dataTexture with morph offsets
    for (const [geometryId, morphDict] of this.morphDicts) {
      const geometry = this.geometryData.get(geometryId)
      if (!geometry) {
        throw new Error("Geometry not found")
      }

      for (const [morphName, morphIndex] of Object.entries(morphDict)) {
        const morphTarget = geometry.morphAttributes.position[morphIndex]
        if (!morphTarget) {
          throw new Error("Morph target not found")
        }

        const geometryOffset = this.getMorphOffset(geometryId, morphName)
        if (typeof geometryOffset !== "number") {
          throw new Error("Morph offset not found")
        }

        for (
          let vertexIndex = 0;
          vertexIndex < morphTarget.count;
          vertexIndex++
        ) {
          const index =
            geometryOffset * componentSize + vertexIndex * componentSize

          morphData[index] = morphTarget.array[vertexIndex * 3]
          morphData[index + 1] = morphTarget.array[vertexIndex * 3 + 1]
          morphData[index + 2] = morphTarget.array[vertexIndex * 3 + 2]
          morphData[index + 3] = 0
        }
      }
    }

    this.morphTexture = new THREE.DataTexture(
      morphData,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    )

    this.morphTexture.needsUpdate = true
    this.shouldComputeMorphTargets = false

    this.addInstancedUniform("uActiveMorphs", -1, THREE.IntType)
  }

  private _setInstanceMorph = (
    instanceId: number,
    geometryId: number,
    morphName?: string
  ): void => {
    let geometryOffset =
      typeof morphName === "string"
        ? this.getMorphOffset(geometryId, morphName)
        : -1 // disabled
    if (typeof geometryOffset !== "number") {
      console.warn("Invalid morph name", morphName)
      geometryOffset = -1
    }

    this.setInstanceUniform(instanceId, "uActiveMorphs", geometryOffset)
  }

  public setInstanceMorph(
    instanceId: number,
    geometryId: number,
    morphName?: string
  ): void {
    if (this.programCompiled) {
      return this._setInstanceMorph(instanceId, geometryId, morphName)
    }

    this.programCompiledSubscribable.addCallback(() =>
      this._setInstanceMorph(instanceId, geometryId, morphName)
    )
  }

  private getMorphOffset(
    geometryId: number,
    morphName: string
  ): number | undefined {
    return this.morphOffsetsDict.get(geometryId)?.[morphName]
  }

  public getMorphIndex(
    geometryId: number,
    morphName: string
  ): number | undefined {
    return this.morphDicts.get(geometryId)?.[morphName]
  }

  public getGeometryId(name: string): number {
    return this.geometries.get(name) || 0
  }

  private useAnimations = false

  public addAnimation(
    skeleton: THREE.Skeleton,
    clip: THREE.AnimationClip
  ): number {
    this.useAnimations = true
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
    if (!this.useAnimations) return
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
        instance.time -
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
