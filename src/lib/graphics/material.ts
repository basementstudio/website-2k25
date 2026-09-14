import {
  DataTexture,
  IUniform,
  Matrix3,
  Matrix4,
  RGBAFormat,
  UnsignedByteType,
  Vector2,
  Vector3,
  Vector4
} from "three"
import {
  modelViewProjection,
  normalView,
  positionGeometry,
  positionView,
  positionWorld,
  reference,
  screenCoordinate,
  screenSize,
  texture,
  uv,
  varying,
  vec4
} from "three/tsl"
import { MeshBasicNodeMaterial, NodeMaterialParameters } from "three/webgpu"

export type MaterialControls = Record<string, IUniform>
const fallbackTexture = new DataTexture(
  new Uint8Array([255, 255, 255, 255]),
  1,
  1,
  RGBAFormat,
  UnsignedByteType
)
fallbackTexture.needsUpdate = true

/** Mutable controls remain compatible with camera/inspection animation code. */
export class SiteMaterial extends MeshBasicNodeMaterial {
  declare defines: Record<string, unknown>
  declare readonly id: number
  uniforms: MaterialControls
  constructor(
    uniforms: MaterialControls,
    parameters: NodeMaterialParameters & {
      defines?: Record<string, unknown>
    } = {}
  ) {
    const { defines, ...rest } = parameters
    super(rest)
    this.defines = defines ?? {}
    this.uniforms = uniforms
  }
}

export function createNodeMaterial({
  uniforms,
  fragmentNodeFactory,
  ...parameters
}: NodeMaterialParameters & {
  uniforms: MaterialControls
  fragmentNodeFactory: (uniforms: MaterialControls) => any
}) {
  const material = new SiteMaterial(uniforms, parameters)
  material.fragmentNode = fragmentNodeFactory(uniforms)
  return material
}

export function bindUniform(
  uniforms: MaterialControls,
  name: string,
  type: string
) {
  const constructors = {
    vec2: Vector2,
    vec3: Vector3,
    vec4: Vector4,
    mat3: Matrix3,
    mat4: Matrix4
  }
  const control =
    uniforms[name] ?? (uniforms[name] = { value: type === "bool" ? false : 0 })
  if (!Object.getOwnPropertyDescriptor(control, "value")?.get) {
    let current = control.value
    const normalize = (value: any) => {
      if (type === "texture") return value || fallbackTexture
      const Constructor = constructors[type as keyof typeof constructors]
      if (Constructor && (Array.isArray(value) || value == null)) {
        const object = new Constructor()
        if (value?.length) object.fromArray(value)
        return object
      }
      return value ?? 0
    }
    current = normalize(current)
    Object.defineProperty(control, "value", {
      enumerable: true,
      configurable: true,
      get: () => current,
      set: (value) => {
        current = normalize(value)
      }
    })
  }
  if (type === "texture") {
    // These shaders apply their own texture matrices. Supplying UV explicitly
    // disables TextureNode's automatic matrix transform (also for .sample()).
    const node = texture(control.value, uv())
    // TextureNode hashes bindings during compilation. Resolve the current
    // texture then, before compilation can merge unrelated placeholder maps.
    Object.defineProperty(node, "value", {
      get: () => control.value,
      set: (value) => {
        control.value = value
      }
    })
    return node
  }
  return reference("value", type, control)
}

export const fragmentBindings = {
  vUv: uv(),
  vPosition: positionGeometry,
  vWorldPosition: positionWorld,
  v_worldPosition: positionWorld,
  vMvPosition: positionView,
  vNormal: normalView,
  vViewDirection: positionView.negate().normalize(),
  vPos: varying(modelViewProjection),
  gl_FragCoord: vec4(
    screenCoordinate.x,
    screenSize.y.sub(screenCoordinate.y),
    0,
    1
  )
}
