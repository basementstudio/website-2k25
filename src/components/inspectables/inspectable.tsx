"use client"

import { MeshDiscardMaterial } from "@react-three/drei"
import { useThree } from "@react-three/fiber"
import { track } from "@vercel/analytics"
import { animate, MotionValue } from "motion"
import type { AnimationPlaybackControls } from "motion/react"
import posthog from "posthog-js"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import {
  Box3,
  DoubleSide,
  type Group,
  Matrix3,
  Matrix4,
  Mesh,
  type PerspectiveCamera,
  Quaternion,
  Raycaster,
  type ShaderMaterial,
  SkinnedMesh,
  Vector3
} from "three"
import { WiggleRig } from "wiggle/rig"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { ANIMATION_CONFIG, SMOOTH_FACTOR } from "@/constants/inspectables"
import {
  FUJIFILM_PHOTO_COLS,
  FUJIFILM_PHOTO_ROWS,
  useFujifilmPhotos
} from "@/hooks/use-fujifilm-photos"
import { useMesh } from "@/hooks/use-mesh"
import { useCursor } from "@/hooks/use-mouse"
import { useFrameCallback } from "@/hooks/use-pausable-time"
import { useScrollTo } from "@/hooks/use-scroll-to"
import { useSelectStore } from "@/hooks/use-select-store"

import { useAssets } from "../assets-provider"
import type { ICameraConfig } from "../navigation-handler/navigation.interface"
import { useInspectable } from "./context"
import { InspectableDragger } from "./inspectable-dragger"

interface InspectableProps {
  id: string
}

// Midpoint of Nico's "10 o 15" ask for the Fujifilm hover-to-change-photo
// zones — see the SM_FujifilmLeft/SM_FujifilmRight handling below.
const FUJIFILM_HOVER_OPACITY = 0.13

export const Inspectable = memo(function InspectableInner({
  id
}: InspectableProps) {
  const setCursor = useCursor()

  const [meshData, setMeshData] = useState<{
    mesh: Mesh
    position: Vector3
  } | null>(null)

  const mesh = meshData?.mesh
  const position = meshData?.position

  const { inspectables } = useAssets()

  const { xOffset, yOffset, xRotationOffset, sizeTarget, scenes } =
    useMemo(() => {
      return inspectables.find((i) => i.mesh === id)!
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

  useSelectStore(
    useMesh,
    (state) => state.inspectables.find((m) => m.name === id),
    (mesh, prevMesh) => mesh?.uuid === prevMesh?.uuid,
    (mesh) => {
      if (mesh) {
        setMeshData({ mesh, position: mesh.userData.position })
      }
    }
  )

  const isActive = useNavigationStore((state) =>
    scenes.some((scene) => scene === state.currentScene?.name)
  )

  const scrollTo = useScrollTo()

  const { selected } = useInspectable()
  const { setSelected } = useInspectable()
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const perpendicularMoved = useRef(new Vector3())

  const camConfigRef = useRef<ICameraConfig | undefined>(undefined)

  useSelectStore(
    useNavigationStore,
    (state) => state.currentScene?.cameraConfig,
    (camConfig, prevCamConfig) => camConfig === prevCamConfig,
    (camConfig) => {
      camConfigRef.current = camConfig
    }
  )

  const size = useRef({ x: 0, y: 0, z: 0 })

  const isSelected = useRef(false)

  const ref = useRef<Group>(null)

  const targetPosition = useRef({
    x: new MotionValue(0),
    y: new MotionValue(0),
    z: new MotionValue(0)
  })
  const targetScale = useRef(new MotionValue(1))

  const inspectingFactor = useRef(new MotionValue(0))
  const inspectingFactorTL = useRef<AnimationPlaybackControls | null>(null)

  const hasPlaced = useRef(false)

  const [firstRender, setFirstRender] = useState(true)

  const [offsetedBoundingBox, setOffsetedBoundingBox] = useState<
    [number, number, number]
  >([0, 0, 0])

  useEffect(() => {
    if (!position) return
    targetPosition.current.x.set(position.x)
    targetPosition.current.y.set(position.y)
    targetPosition.current.z.set(position.z)
  }, [position])

  const handleAnimation = (withAnimation: boolean) => {
    const camConfig = camConfigRef.current
    if (!camConfig || !position) return

    hasPlaced.current = true

    // Get Camera Direction
    const { target: t, position: p } = camConfig
    const direction = new Vector3(t[0] - p[0], t[1] - p[1], t[2] - p[2])
    direction.normalize()

    // calculate X offset based on camera aspect ratio
    const viewportWidth = Math.min(camera.aspect, 1920 / window.innerHeight)
    const offset = viewportWidth * xOffset
    const perpendicular = new Vector3(-direction.z, 0, direction.x).normalize()
    perpendicularMoved.current.copy(perpendicular.multiplyScalar(offset))

    const target = targetPosition.current

    const config = withAnimation ? ANIMATION_CONFIG : { duration: 0 }

    if (selected === id) {
      const desiredScale =
        sizeTarget / Math.max(size.current.x, size.current.y, size.current.z)

      const desiredDirection = new Vector3(
        camConfig?.position[0] + direction.x + perpendicularMoved.current.x,
        camConfig?.position[1] + direction.y + yOffset,
        camConfig?.position[2] + direction.z + perpendicularMoved.current.z
      )

      animate(target.x, desiredDirection.x, config)
      animate(target.y, desiredDirection.y, config)
      animate(target.z, desiredDirection.z, config)
      animate(targetScale.current, desiredScale, config)

      inspectingFactorTL.current?.stop()
      inspectingFactorTL.current = animate(inspectingFactor.current, 1, config)
      inspectingFactorTL.current.play()
      isSelected.current = true
    } else {
      animate(target.x, position.x, config)
      animate(target.y, position.y, config)
      animate(target.z, position.z, config)
      animate(targetScale.current, 1, config)

      inspectingFactorTL.current?.stop()
      inspectingFactorTL.current = animate(inspectingFactor.current, 0, config)
      inspectingFactorTL.current.play()
      isSelected.current = false
    }
  }

  useEffect(() => {
    if (firstRender) {
      setFirstRender(false)
      return
    }

    if (!position) return

    if (mesh && !size.current.x) {
      mesh.rotation.set(0, 0, 0)
      const boundingBox = new Box3().setFromObject(mesh, true)
      mesh.rotation.set(
        mesh.userData.rotation.x,
        mesh.userData.rotation.y,
        mesh.userData.rotation.z
      )

      const s = new Vector3()
      boundingBox.getSize(s)
      mesh.position.set(0, 0, 0)
      const center = new Vector3()
      boundingBox.getCenter(center)
      setOffsetedBoundingBox([
        center.x - position.x,
        center.y - position.y,
        center.z - position.z
      ])

      if (isNaN(s.x) || isNaN(s.y) || isNaN(s.z)) {
        // TODO: we should be measuring an outer group to avoid the bounding box beeing nan the first time
        setTimeout(() => setFirstRender(true), 100)
      } else {
        size.current.x = s.x
        size.current.y = s.y
        size.current.z = s.z
      }
    }

    handleAnimation(hasPlaced.current)

    const handleResize = () => setTimeout(() => handleAnimation(false), 0)

    window.addEventListener("resize", handleResize, { passive: true })

    return () => window.removeEventListener("resize", handleResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, firstRender, mesh, position, id])

  const vRef = useMemo(() => {
    return {
      targetQuaternion: new Quaternion(),
      lookAtMatrix: new Matrix4(),
      upVector: new Vector3(0, 1, 0)
    }
  }, [])

  // Wiggle bones (https://wiggle.three.tools/) — generic, not tied to a
  // specific mesh name: any inspectable whose mesh turns out to be a
  // SkinnedMesh gets its skeleton driven by a WiggleRig. Which bones
  // actually move is decided in Blender via the `wiggleVelocity` /
  // `wiggleStiffness`+`wiggleDamping` custom properties on each bone (same
  // "custom property → userData" convention as the Lightmap property) — a
  // rig with no tagged bones is a harmless no-op.
  const wiggleRigRef = useRef<WiggleRig | null>(null)

  useEffect(() => {
    if (mesh instanceof SkinnedMesh && mesh.skeleton) {
      const rig = new WiggleRig(mesh.skeleton)
      wiggleRigRef.current = rig
      return () => {
        rig.dispose()
        wiggleRigRef.current = null
      }
    }
  }, [mesh])

  // SM_Fujifilm's screen packs 6 photos into one texture (2 cols × 3 rows) —
  // cycling through them is just shifting which cell mapMatrix samples, no
  // shader change needed (fragment.glsl already applies mapMatrix to map's
  // UV for any USE_MAP mesh). Bespoke to this one mesh, not generalized.
  // The mesh's own UV island is already scaled down to fit exactly one cell
  // (Nico: "esta escalado para que entre una foto") — so the matrix here
  // only translates between cells, it must NOT rescale on top of that.
  const fujifilmPhotoIndex = useFujifilmPhotos((state) => state.index)

  useEffect(() => {
    if (!mesh || mesh.name !== "SM_Fujifilm") return
    const screen = mesh.getObjectByName("SM_FujifilmScreen") as Mesh | null
    const material = screen?.material as ShaderMaterial | undefined
    if (!material?.uniforms?.mapMatrix) return

    const col = fujifilmPhotoIndex % FUJIFILM_PHOTO_COLS
    const row = Math.floor(fujifilmPhotoIndex / FUJIFILM_PHOTO_COLS)
    ;(material.uniforms.mapMatrix.value as Matrix3).setUvTransform(
      col / FUJIFILM_PHOTO_COLS,
      row / FUJIFILM_PHOTO_ROWS,
      1,
      1,
      0,
      0,
      0
    )
  }, [mesh, fujifilmPhotoIndex])

  // SM_FujifilmLeft/SM_FujifilmRight (added directly in Blender, covering
  // the left/right half of the photo) are plain untextured planes with no
  // glTF material at all — three.js gives them a default opaque material,
  // so transparent/depthWrite/base opacity all need to be forced here
  // rather than relying on anything authored upstream. Opacity fades in on
  // hover (0 → FUJIFILM_HOVER_OPACITY) as a "you can click here" hint.
  const [fujifilmLeftPlane, setFujifilmLeftPlane] = useState<Mesh | null>(null)
  const [fujifilmRightPlane, setFujifilmRightPlane] = useState<Mesh | null>(
    null
  )
  const fujifilmLeftOpacity = useRef(new MotionValue(0))
  const fujifilmRightOpacity = useRef(new MotionValue(0))

  useEffect(() => {
    if (!mesh || mesh.name !== "SM_Fujifilm") return

    for (const name of ["SM_FujifilmLeft", "SM_FujifilmRight"] as const) {
      const plane = mesh.getObjectByName(name) as Mesh | null
      const material = plane?.material as ShaderMaterial | undefined
      if (!plane || !material) continue

      material.transparent = true
      material.depthWrite = false
      // These nodes' rotation (baked in Blender) points their front face
      // away from the camera, and the global shader forces FrontSide unless
      // a mesh is listed in doubleSideElements — neither plane is, so the
      // raycaster (which only hits FrontSide by default) would silently miss
      // every cast regardless of pointer position without this.
      material.side = DoubleSide
      if (material.uniforms.opacity) material.uniforms.opacity.value = 0
      // map/index.tsx's initial scene traverse sets `raycast = () => null`
      // on EVERY mesh except SM_ArcadeLab_Screen (a perf guard against
      // raycasting thousands of static office meshes) — that's why manual
      // raycasting against these two planes always returned zero hits no
      // matter how precisely aimed. Restore the real implementation just
      // for these two, the same way that one mesh is exempted.
      plane.raycast = Mesh.prototype.raycast

      if (name === "SM_FujifilmLeft") setFujifilmLeftPlane(plane)
      else setFujifilmRightPlane(plane)
    }
  }, [mesh])

  const setFujifilmHover = (
    opacityRef: typeof fujifilmLeftOpacity,
    hovered: boolean
  ) => {
    animate(opacityRef.current, hovered ? FUJIFILM_HOVER_OPACITY : 0, {
      duration: 0.2
    })
  }

  // R3F's synthetic pointer events never reached SM_FujifilmLeft/Right —
  // map/index.tsx's initial scene traverse sets `raycast = () => null` on
  // every mesh except SM_ArcadeLab_Screen (a perf guard against raycasting
  // thousands of static office meshes), which silently no-ops R3F's own
  // hit-testing for these two as well. The discovery effect above restores
  // a real raycast just for these two planes, and this raycasts them by
  // hand every frame instead of relying on R3F's synthetic pointer events.
  const fujifilmRaycaster = useMemo(() => new Raycaster(), [])
  const fujifilmHoveredSide = useRef<"left" | "right" | null>(null)
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    if (!mesh || mesh.name !== "SM_Fujifilm") return

    const handleClick = () => {
      if (fujifilmHoveredSide.current === "left") {
        useFujifilmPhotos.getState().prev()
      } else if (fujifilmHoveredSide.current === "right") {
        useFujifilmPhotos.getState().next()
      }
    }

    gl.domElement.addEventListener("click", handleClick)
    return () => gl.domElement.removeEventListener("click", handleClick)
  }, [mesh, gl])

  useFrameCallback((state, delta) => {
    wiggleRigRef.current?.update(delta)

    const leftMaterial = fujifilmLeftPlane?.material as
      | ShaderMaterial
      | undefined
    if (leftMaterial?.uniforms?.opacity) {
      leftMaterial.uniforms.opacity.value = fujifilmLeftOpacity.current.get()
    }
    const rightMaterial = fujifilmRightPlane?.material as
      | ShaderMaterial
      | undefined
    if (rightMaterial?.uniforms?.opacity) {
      rightMaterial.uniforms.opacity.value = fujifilmRightOpacity.current.get()
    }

    if (
      mesh?.name === "SM_Fujifilm" &&
      selected === id &&
      fujifilmLeftPlane &&
      fujifilmRightPlane
    ) {
      fujifilmRaycaster.setFromCamera(state.pointer, state.camera)
      const hits = fujifilmRaycaster.intersectObjects(
        [fujifilmLeftPlane, fujifilmRightPlane],
        false
      )
      const hovered = hits[0]?.object

      const side =
        hovered === fujifilmLeftPlane
          ? "left"
          : hovered === fujifilmRightPlane
            ? "right"
            : null

      if (side !== fujifilmHoveredSide.current) {
        if (fujifilmHoveredSide.current === "left") {
          setFujifilmHover(fujifilmLeftOpacity, false)
        } else if (fujifilmHoveredSide.current === "right") {
          setFujifilmHover(fujifilmRightOpacity, false)
        }
        if (side === "left") setFujifilmHover(fujifilmLeftOpacity, true)
        else if (side === "right") setFujifilmHover(fujifilmRightOpacity, true)
        fujifilmHoveredSide.current = side
        setCursor(side ? "pointer" : "grab")
      }
    } else if (fujifilmHoveredSide.current) {
      fujifilmHoveredSide.current = null
    }

    const camConfig = camConfigRef.current
    if (!ref.current || !camConfig) return
    const { targetQuaternion, lookAtMatrix, upVector } = vRef

    if (selected === id) {
      const cameraPosition = new Vector3(...camConfig.position)
      cameraPosition.add(perpendicularMoved.current)
      cameraPosition.y += yOffset
      lookAtMatrix.lookAt(cameraPosition, ref.current.position, upVector)

      targetQuaternion.setFromRotationMatrix(lookAtMatrix)
      const q = new Quaternion()
      q.setFromAxisAngle(vRef.upVector, -Math.PI / 2 + xRotationOffset)
      targetQuaternion.multiply(q)

      const direction = new Vector3()
      direction.setFromMatrixColumn(lookAtMatrix, 2).negate()
    } else {
      targetQuaternion.identity()
    }

    const t = targetPosition.current

    ref.current.position.set(t.x.get(), t.y.get(), t.z.get())

    const s = targetScale.current
    ref.current.scale.set(s.get(), s.get(), s.get())

    ref.current?.quaternion.slerp(targetQuaternion, SMOOTH_FACTOR)

    const inspectingFactorValue = inspectingFactor.current.get()

    mesh?.traverse((child) => {
      if (child instanceof Mesh) {
        // Warn instead of crashing the frame loop if a mesh's material
        // hasn't gone through the global shader swap (createGlobalShaderMaterial)
        // for some reason — same defensive pattern as bakes.tsx's
        // getShaderMaterialWithUniform.
        if (!child.material?.uniforms?.inspectingFactor) {
          console.warn(
            `[inspectable:${id}] child "${child.name}" material missing uniforms.inspectingFactor`
          )
          return
        }
        child.material.uniforms.inspectingFactor.value = inspectingFactorValue
      }
    })
  })

  const handleSelection = () => {
    if (isActive) {
      scrollTo({
        offset: 0,
        behavior: "smooth",
        callback: () => {
          setSelected(id)
          const inspectable = inspectables.find((item) => item.mesh === id)
          track(`inspecting_${inspectable?._title.replace(/\s+/g, "_")}`)
          posthog.capture(
            `inspecting_${inspectable?._title.replace(/\s+/g, "_")}`
          )
        }
      })
    }
  }

  if (!mesh) return null

  return (
    <group
      ref={ref}
      onClick={(e) => {
        if ((selected && selected !== id) || !isActive) {
          e.stopPropagation()
          return
        }
        setCursor("grab")
        handleSelection()
      }}
      onPointerEnter={() => {
        if ((selected && selected !== id) || !isActive) return
        if (!selected) setCursor("zoom-in")
        else if (selected === id) setCursor("grab")
      }}
      onPointerLeave={() => {
        if ((selected && selected !== id) || !isActive) return
        if (!selected) setCursor("default")
      }}
    >
      <InspectableDragger
        key={id}
        enabled={selected === id}
        global={true}
        cursor={selected === id}
        snap={true}
        speed={2}
        domElement={document.querySelector("#canvas canvas") as HTMLElement}
      >
        <primitive object={mesh} raycast={() => null} />
        <mesh
          position={[...offsetedBoundingBox]}
          rotation={[mesh.rotation.x, mesh.rotation.y, mesh.rotation.z]}
        >
          <boxGeometry
            args={[size.current.x, size.current.y, size.current.z]}
          />
          <MeshDiscardMaterial />
        </mesh>
      </InspectableDragger>
    </group>
  )
})
