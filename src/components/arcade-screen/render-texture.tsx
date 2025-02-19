import { createPortal, RootState, useFrame, useThree } from "@react-three/fiber"
import { DomEvent } from "@react-three/fiber/dist/declarations/src/core/events"
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"
import * as THREE from "three"

interface R3FObject {
  __r3f: {
    parent: R3FObject | THREE.Object3D
  }
}

export interface PaintCanvasProps {
  /** Whether the render target is active */
  isPlaying?: boolean
  /** The width of the render target */
  width?: number
  /** The height of the render target */
  height?: number
  /** Attach the texture to a THREE.Object3D */
  attach?: string | null
  /** Callback called when a new mapTexture is used */
  onMapTexture?: (texture: THREE.Texture) => void
  /** Callback called when a new depthTexture is used */
  onDepthTexture?: (texture: THREE.DepthTexture) => void
  /** Use a custom render target */
  fbo?: THREE.WebGLRenderTarget
  /** A scene to use as a container */
  containerScene?: THREE.Scene
  /** Use global mouse coordinate to calculate raycast */
  useGlobalPointer?: boolean
  /** Priority of the render frame */
  renderPriority?: number
  /* mesh to use for raycasting */
  raycasterMesh?: THREE.Mesh
}

export const renderTextureContext = createContext<{
  isInsideRenderTexture: boolean
  width: number
  height: number
  aspect: number
  isPlaying: boolean
}>({
  isInsideRenderTexture: false,
  width: 2048,
  height: 2048,
  aspect: 1,
  isPlaying: true
})

export const RenderTexture = ({
  isPlaying: _playing = true,
  width = 2048,
  height = 2048,
  attach,
  fbo: _fbo,
  onMapTexture,
  onDepthTexture,
  containerScene,
  children,
  useGlobalPointer,
  renderPriority,
  raycasterMesh
}: PropsWithChildren<PaintCanvasProps>) => {
  // once the canvas is loaded, force render

  const fbo = useMemo(() => {
    const fbo =
      _fbo ||
      new THREE.WebGLRenderTarget(width, height, {
        samples: 16,
        stencilBuffer: true,
        depthTexture: new THREE.DepthTexture(
          width,
          height,
          THREE.UnsignedInt248Type
        ),
        format: THREE.RGBFormat,
        type: THREE.HalfFloatType,
        anisotropy: 16
      })
    return fbo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_fbo])

  useEffect(() => {
    if (onMapTexture) {
      onMapTexture(fbo.texture)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fbo.texture])

  useEffect(() => {
    if (onDepthTexture && fbo.depthTexture) {
      onDepthTexture(fbo.depthTexture)
    }
  }, [fbo.depthTexture, onDepthTexture])

  const portalScene = useMemo(() => {
    return containerScene || new THREE.Scene()
  }, [containerScene])

  const isPlayingRef = useRef(_playing)
  const [isPlaying, setIsPlaying] = useState(_playing)

  const viewportSize = useThree((state) => state.size)
  const viewportSizeRef = useRef(viewportSize)
  viewportSizeRef.current = viewportSize

  useEffect(() => {
    fbo.setSize(width, height)
    const abortController = new AbortController()
    const signal = abortController.signal

    setIsPlaying(true)
    isPlayingRef.current = true
    if (_playing) return
    setTimeout(() => {
      if (signal.aborted) return
      setIsPlaying(false)
      isPlayingRef.current = false
    }, 100)

    return () => {
      abortController.abort()
    }
  }, [fbo, _playing, width, height, setIsPlaying])

  /** UV compute function relative to the viewport */
  const viewportUvCompute = useCallback(
    (event: DomEvent, state: RootState) => {
      if (!isPlayingRef.current) return
      if (!viewportSizeRef.current) return
      const { width, height, left, top } = viewportSizeRef.current
      const x = event.clientX - left
      const y = event.clientY - top
      state.pointer.set((x / width) * 2 - 1, -(y / height) * 2 + 1)
      state.raycaster.setFromCamera(state.pointer, state.camera)
    },
    [viewportSizeRef, isPlayingRef]
  )

  /** UV compute relative to the parent mesh UV */
  const uvCompute = useCallback(
    (event: DomEvent, state: RootState, previous?: RootState) => {
      if (!isPlayingRef.current || !previous) return false

      let parent =
        raycasterMesh || (fbo.texture as unknown as R3FObject)?.__r3f.parent
      while (parent && !(parent instanceof THREE.Object3D)) {
        parent = (parent as R3FObject).__r3f.parent
      }
      if (!parent) return false
      // First we call the previous state-onion-layers compute, this is what makes it possible to nest portals
      if (!previous.raycaster.camera) {
        previous.events.compute?.(
          event,
          previous,
          previous.previousRoot?.getState()
        )
      }
      // We run a quick check against the parent, if it isn't hit there's no need to raycast at all
      const [intersection] = previous.raycaster.intersectObject(parent)

      if (!intersection) return false
      // We take that hits uv coords, set up this layers raycaster, et voilà, we have raycasting on arbitrary surfaces
      const uv = intersection.uv
      if (!uv) return false
      state.raycaster.setFromCamera(
        state.pointer.set(uv.x * 2 - 1, uv.y * 2 - 1),
        state.camera
      )
    },
    [fbo.texture, raycasterMesh]
  )

  return (
    <>
      <renderTextureContext.Provider
        value={{
          isInsideRenderTexture: true,
          width,
          height,
          aspect: width / height,
          isPlaying
        }}
      >
        {createPortal(
          <SceneContainer fbo={fbo} renderPriority={renderPriority}>
            {children}
            {/* Without an element that receives pointer events state.pointer will always be 0/0 */}
            <group onPointerOver={() => null} />
          </SceneContainer>,
          portalScene as THREE.Scene,
          {
            events: {
              compute: useGlobalPointer ? viewportUvCompute : uvCompute,
              priority: 0
            }
          }
        )}
      </renderTextureContext.Provider>
      <primitive object={fbo.texture} attach={attach} />
    </>
  )
}

export const useRenderTexture = () => {
  return useContext(renderTextureContext)
}

export type TextureRenderCallback = (params: {
  elapsedTime: number
  state: RootState
  delta: number
  frame?: XRFrame
}) => void

export const useTextureFrame = (
  callback: TextureRenderCallback,
  priority?: number
) => {
  const { isPlaying } = useRenderTexture()

  const elapsedTimeRef = useRef(0)
  useFrame((state, delta, frame) => {
    if (!isPlaying) return
    elapsedTimeRef.current += delta
    callback({
      elapsedTime: elapsedTimeRef.current,
      state,
      delta,
      frame
    })
  }, priority)
}

interface SceneContainerProps {
  fbo: THREE.WebGLRenderTarget
  renderPriority?: number
}

const SceneContainer = ({
  fbo,
  renderPriority,
  children
}: PropsWithChildren<SceneContainerProps>) => {
  useTextureFrame(({ state }) => {
    state.gl.setRenderTarget(fbo)
    state.gl.render(state.scene, state.camera)
    state.gl.setRenderTarget(null)
  }, renderPriority)

  return <>{children}</>
}
