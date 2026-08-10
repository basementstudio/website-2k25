"use client"

import { TransformControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { type FC, useCallback, useEffect, useMemo, useRef } from "react"
import {
  Box3,
  type BufferGeometry,
  EdgesGeometry,
  type Intersection,
  type LineSegments,
  Mesh,
  Object3D,
  Raycaster,
  Vector2,
  Vector3
} from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import { isTypingTarget } from "./editor-keys"
import { useEditorStore } from "./editor-store"

// brand-o
const OUTLINE_COLOR = "#FF4D00"

// Pointer travel (px) above which a click is treated as a drag and ignored.
// Orbiting the camera ends in a click event, which would otherwise re-pick
// whatever happened to be under the cursor when you let go.
const DRAG_THRESHOLD = 4

/** How many gizmo moves Cmd/Ctrl+Z can walk back. */
const UNDO_LIMIT = 50

/** One completed gizmo drag: where the object sat before it. */
interface MoveRecord {
  object: Object3D
  position: Vector3
}

/**
 * drei types `TransformControlsProps` as
 * `ThreeElement<TransformControlsImpl> & ThreeElements["group"]`, and those two
 * disagree about `args` — the intersection is `never`, so the required prop can
 * never be satisfied. Runtime is unaffected (drei constructs the controls itself
 * and ignores `args`), so narrow the surface to the props we actually pass.
 */
const Gizmo = TransformControls as unknown as FC<{
  object: Object3D
  mode: "translate" | "rotate" | "scale"
  onMouseDown?: () => void
  onMouseUp?: () => void
  onObjectChange?: () => void
}>

/**
 * World-space centre of a selection's visible geometry.
 *
 * The gizmo can't just attach to the picked object: these GLBs are exported with
 * transforms applied, so nearly every mesh has `position` at its parent's origin
 * and the geometry carries the real placement. Attaching there piles every
 * object's gizmo up in the same spot. Box3.setFromObject walks the subtree in
 * world space (and refreshes matrices itself), which puts the handle on the thing
 * you actually clicked.
 */
const selectionCenter = (object: Object3D, box: Box3, target: Vector3) => {
  box.setFromObject(object)
  if (box.isEmpty()) return object.getWorldPosition(target)
  return box.getCenter(target)
}

/** An ancestor with visible=false hides the whole subtree, so walk up rather
 *  than trusting the hit object's own flag. */
const isVisible = (object: Object3D) => {
  let node: Object3D | null = object
  while (node) {
    if (!node.visible) return false
    node = node.parent
  }
  return true
}

/**
 * Batched / instanced / skinned meshes are excluded from picking. Two reasons,
 * both of which showed up as "the outline is in the wrong place":
 *
 * - Their on-screen transform isn't `matrixWorld`. Characters and pets are one
 *   `InstancedBatchedSkinnedMesh` (extends THREE.BatchedMesh) holding many
 *   instances, each with its own matrix, and skinning deforms vertices on the
 *   GPU. An outline built from the object's geometry + matrixWorld would sit at
 *   the packed/rest transform, nowhere near what you clicked.
 * - `Mesh.prototype.raycast` is wrong for them. BatchedMesh overrides `raycast`
 *   to test per instance; calling the base implementation raycasts the packed
 *   batch geometry and returns hits that don't correspond to anything visible —
 *   which is what made clicks land on the wrong object.
 *
 * Skipping them means a click passes through to the static geometry behind,
 * which is both accurate and what a scene editor actually wants to select.
 */
const isPickable = (object: Object3D): object is Mesh => {
  if (!(object instanceof Mesh)) return false
  const mesh = object as Mesh & {
    isBatchedMesh?: boolean
    isInstancedMesh?: boolean
    isSkinnedMesh?: boolean
  }
  if (mesh.isBatchedMesh || mesh.isInstancedMesh || mesh.isSkinnedMesh)
    return false
  // Geometry-less helper meshes exist in the scene — CustomCamera renders two
  // (<mesh ref={planeRef} /> with no geometry child) as camera-movement planes.
  // R3F gives them an empty BufferGeometry, and EdgesGeometry throws on one
  // ("cannot read properties of undefined (reading 'count')"). They aren't scene
  // content, so they shouldn't be selectable in the first place.
  return !!mesh.geometry?.attributes?.position
}

/**
 * Resolve a raw hit to the thing a person means by "that object".
 *
 * Multi-part props in these GLBs are modelled as a mesh with mesh children, not
 * as a Group — measured from the shipped files:
 *
 *   officeItems: SM_Nextjs → [SM_NextjsBelt, SM_NextjsMetallic, SM_NextJSText]
 *                SM_Patas  → [SM_ScreenPatas, SM_ScreenPatas_Glass]
 *   office:      SM_KitCat → [SM_CatTail, SM_EyeL, SM_EyeR, hands…]
 *
 * Selecting the bare hit meant dragging a belt out of the Next.js machine. So
 * climb while the parent is also a Mesh, which lands on the outermost part of
 * the prop. It stops immediately for the 95 flat meshes in office.glb (their
 * parent is the GLTF root, a Group), and can never escalate to the whole GLB for
 * the same reason. Both files are only one level deep, so this is exact for them.
 */
const resolveSelection = (hit: Object3D): Object3D => {
  let node = hit
  while (node.parent instanceof Mesh) node = node.parent
  return node
}

/**
 * The translate gizmo lives in the same scene and is built from real meshes
 * (arrow cones, drag planes), so without this a click near it would pick an
 * arrow instead of geometry. three tags every part, so walk up and reject.
 */
const isGizmoPart = (object: Object3D) => {
  let node:
    | (Object3D & {
        isTransformControlsRoot?: boolean
        isTransformControlsGizmo?: boolean
        isTransformControlsPlane?: boolean
      })
    | null = object
  while (node) {
    if (
      node.isTransformControlsRoot ||
      node.isTransformControlsGizmo ||
      node.isTransformControlsPlane
    )
      return true
    node = node.parent
  }
  return false
}

/**
 * Edit-mode click-to-select: raycasts on click and draws an orange edge outline
 * around the picked mesh.
 *
 * Two non-obvious constraints, both load-bearing:
 *
 * 1. MUST be mounted inside <Renderer sceneChildren>. Renderer portals those
 *    children into its own `mainScene` and draws it with the navigation store's
 *    `mainCamera`. The default R3F scene/camera are not what's on screen, so
 *    raycasting against them hits nothing. Being inside the portal is what makes
 *    `useThree().scene` resolve to `mainScene`.
 *
 * 2. Can't use `raycaster.intersectObjects`. The map assigns
 *    `mesh.raycast = () => null` to every office mesh for performance
 *    (components/map/index.tsx) — on the site only routing elements and
 *    inspectable hit boxes need to be pickable. So call three's real
 *    `Mesh.prototype.raycast` per mesh, which ignores the instance override
 *    without mutating objects the site shares.
 */
export const EditorPicker = () => {
  const isEditor = useEditorStore((state) => state.isEditor)
  const mode = useEditorStore((state) => state.mode)
  const picked = useEditorStore((state) => state.pickedObject)
  const setPickedObject = useEditorStore((state) => state.setPickedObject)
  const recordMove = useEditorStore((state) => state.recordMove)

  const active = isEditor && mode === "edit"

  const scene = useThree((state) => state.scene)
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const camera = useNavigationStore((state) => state.mainCamera)

  const raycaster = useMemo(() => new Raycaster(), [])
  const outlineRefs = useRef<(LineSegments | null)[]>([])
  // Set when a gizmo drag starts, consumed by the click that ends it — otherwise
  // releasing the gizmo would re-pick whatever sits under the cursor.
  const suppressClick = useRef(false)

  // Undo history for gizmo moves. Refs, not state: this component stays mounted
  // for the life of the canvas (it only returns null when nothing is picked), so
  // history survives deselecting and edit/live toggles — you can move something,
  // click elsewhere, and still walk it back.
  const undoStack = useRef<MoveRecord[]>([])
  const dragStart = useRef<MoveRecord | null>(null)

  // The gizmo drives this invisible proxy, parked at the selection's centre;
  // its movement is forwarded to the real object as a delta. See selectionCenter.
  // Constructed imperatively rather than via a ref on JSX: the gizmo needs it on
  // the very first render after a selection, and a ref filling in later wouldn't
  // re-render to re-attach.
  const proxy = useMemo(() => new Object3D(), [])
  const lastProxyPos = useRef(new Vector3())
  const isDragging = useRef(false)

  // Scratch — the frame loop and drag handler run often enough to care.
  const scratch = useMemo(
    () => ({
      box: new Box3(),
      center: new Vector3(),
      from: new Vector3(),
      to: new Vector3()
    }),
    []
  )

  /** Park the proxy on the selection's centre and reset the delta baseline. */
  const syncProxy = useCallback(() => {
    if (!picked) return
    const center = selectionCenter(picked, scratch.box, scratch.center)
    proxy.position.copy(center)
    proxy.updateMatrixWorld()
    lastProxyPos.current.copy(center)
  }, [picked, proxy, scratch])

  // Centre the gizmo the moment the selection changes, so it never flashes at
  // the origin for a frame before the frame loop catches up.
  useEffect(() => {
    isDragging.current = false
    syncProxy()
  }, [syncProxy])

  useEffect(() => {
    if (!active || !camera) return

    const el = gl.domElement

    let downX = 0
    let downY = 0
    const handlePointerDown = (event: PointerEvent) => {
      downX = event.clientX
      downY = event.clientY
    }

    const handleClick = (event: MouseEvent) => {
      // Ignore the click that ends a gizmo interaction, drag or tap.
      if (suppressClick.current) {
        suppressClick.current = false
        return
      }

      // Ignore the click that ends an orbit/pan drag.
      if (
        Math.hypot(event.clientX - downX, event.clientY - downY) >
        DRAG_THRESHOLD
      )
        return

      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      // The camera is animated by CameraController; its matrixWorld is only
      // refreshed during render. Sync it here so the ray matches where the
      // camera is now rather than where it was last frame.
      camera.updateMatrixWorld()

      raycaster.setFromCamera(
        new Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        ),
        camera
      )

      // See (2) above. `isPickable` also excludes the outline itself:
      // LineSegments extends Line, not Mesh.
      const intersects: Intersection[] = []
      scene.traverse((object) => {
        if (!isPickable(object) || !isVisible(object) || isGizmoPart(object))
          return
        Mesh.prototype.raycast.call(object, raycaster, intersects)
      })
      intersects.sort((a, b) => a.distance - b.distance)

      // Clicking empty space clears the selection. A hit resolves up to the
      // whole prop so dragging can't pull a model apart.
      const hit = intersects[0]?.object
      setPickedObject(hit ? resolveSelection(hit) : null)
      // frameloop is "demand" — ask for a frame so the outline actually draws.
      invalidate()
    }

    const handleUndo = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() !== "z") return
      // Shift+Cmd+Z is redo by convention — don't treat it as another undo.
      if (event.shiftKey) return
      if (isTypingTarget(event.target)) return

      const last = undoStack.current.pop()
      if (!last) return

      event.preventDefault()
      last.object.position.copy(last.position)
      last.object.updateMatrixWorld()
      // Keep the pending-save set in step with what's on screen. Walking a move
      // back leaves an entry equal to the pre-drag position rather than
      // removing it, which is the honest thing to write: the object may have
      // had a saved override before this session, and dropping the entry would
      // silently re-apply that instead of what you're looking at.
      recordMove(last.object)
      invalidate()
    }

    el.addEventListener("pointerdown", handlePointerDown)
    el.addEventListener("click", handleClick)
    // On window, not the canvas: the canvas isn't focusable for key events, and
    // undo should work right after a drag without clicking anything first.
    window.addEventListener("keydown", handleUndo)
    return () => {
      el.removeEventListener("pointerdown", handlePointerDown)
      el.removeEventListener("click", handleClick)
      window.removeEventListener("keydown", handleUndo)
    }
  }, [
    active,
    camera,
    gl,
    invalidate,
    raycaster,
    recordMove,
    scene,
    setPickedObject
  ])

  // One outline per mesh in the selection. A selected prop is a mesh with mesh
  // children (see resolveSelection), so outlining only the root would leave its
  // parts unhighlighted. Each child carries its own transform, so each gets its
  // own lineSegments synced to its own matrixWorld rather than one merged
  // geometry. isPickable also keeps out geometry-less and batched/skinned meshes,
  // which EdgesGeometry can't handle.
  const outlineParts = useMemo(() => {
    if (!picked) return []
    const parts: { mesh: Mesh; edges: EdgesGeometry }[] = []
    picked.traverse((object) => {
      if (!isPickable(object) || isGizmoPart(object)) return
      parts.push({
        mesh: object,
        edges: new EdgesGeometry(object.geometry as BufferGeometry)
      })
    })
    return parts
  }, [picked])

  // Built per selection — release the previous set.
  useEffect(
    () => () => outlineParts.forEach((part) => part.edges.dispose()),
    [outlineParts]
  )

  // Track the picked mesh's world transform every frame. A one-shot copy on
  // mount goes stale the moment the object (or an ancestor) animates — cars,
  // the lamp, the blog door, an inspectable being pulled toward the camera —
  // which read as the outline ignoring the object's position/rotation.
  // Priority 0 runs before Renderer's own callback at priority 1, so the matrix
  // is current for the frame that's about to be drawn.
  useFrame(() => {
    // Keep the handle on the selection's centre as it moves — and re-centre
    // after an undo. Skipped mid-drag, when the gizmo owns the proxy.
    if (picked && !isDragging.current) syncProxy()

    if (outlineParts.length === 0) return
    outlineParts.forEach((part, index) => {
      const outline = outlineRefs.current[index]
      if (!outline) return
      // Force ancestors current too; matrixWorld is otherwise only refreshed by
      // the renderer's scene.updateMatrixWorld() at priority 1.
      part.mesh.updateWorldMatrix(true, false)
      outline.matrixWorld.copy(part.mesh.matrixWorld)
    })
  }, 0)

  if (!active || !picked) return null

  return (
    <>
      {outlineParts.map((part, index) => (
        <lineSegments
          key={part.mesh.uuid}
          ref={(el) => {
            outlineRefs.current[index] = el
          }}
          geometry={part.edges}
          raycast={() => null}
          renderOrder={999}
          // matrixWorld is assigned directly in the frame callback above, so keep
          // three from recomputing it from position/quaternion/scale or parent.
          matrixAutoUpdate={false}
          matrixWorldAutoUpdate={false}
        >
          <lineBasicMaterial
            color={OUTLINE_COLOR}
            // Draw through geometry so a selection behind a wall stays readable.
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      ))}

      {/* Invisible handle the gizmo actually drags, parked on the selection's
          bounding-box centre. Not a Mesh, so isPickable ignores it. */}
      <primitive object={proxy} />

      {/* Translate gizmo, attached to the proxy rather than the selection so the
          handle sits on the geometry instead of the baked origin. drei disables
          the default controls (our orbit cam, which is makeDefault) for the
          duration of a drag via three's "dragging-changed" event, so the two
          never fight, and it invalidates on change, which matters under
          frameloop="demand". The outline tracks the real object for free — its
          matrix is synced from each part's matrixWorld every frame. */}
      <Gizmo
        object={proxy}
        mode="translate"
        onMouseDown={() => {
          suppressClick.current = true
          isDragging.current = true
          // Snapshot before the drag; committed on mouseUp only if it moved.
          dragStart.current = {
            object: picked,
            position: picked.position.clone()
          }
        }}
        onObjectChange={() => {
          // The proxy lives in world space (its parent is the scene), but
          // `picked.position` is in its own parent's space. Convert both ends of
          // the move and take the difference, so any rotation or scale on the
          // GLTF root is accounted for.
          const parent = picked.parent
          if (parent) {
            parent.updateWorldMatrix(true, false)
            const from = parent.worldToLocal(
              scratch.from.copy(lastProxyPos.current)
            )
            const to = parent.worldToLocal(scratch.to.copy(proxy.position))
            picked.position.add(to.sub(from))
          } else {
            picked.position.add(
              scratch.to.copy(proxy.position).sub(lastProxyPos.current)
            )
          }

          lastProxyPos.current.copy(proxy.position)
        }}
        onMouseUp={() => {
          isDragging.current = false
          const start = dragStart.current
          dragStart.current = null
          if (!start) return
          // A tap on an arrow that didn't move anything shouldn't cost an undo
          // — or mark the scene dirty.
          if (start.object.position.equals(start.position)) return

          recordMove(start.object)
          undoStack.current.push(start)
          if (undoStack.current.length > UNDO_LIMIT) undoStack.current.shift()
        }}
      />
    </>
  )
}
