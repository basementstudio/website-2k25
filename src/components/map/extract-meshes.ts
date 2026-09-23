import {
  Box3,
  DetachedBindMode,
  Matrix4,
  Mesh,
  Object3D,
  SkinnedMesh,
  Vector3
} from "three"

import type { ArcadeButton, ArcadeStick } from "@/hooks/use-mesh"
import { useMesh } from "@/hooks/use-mesh"
import { findVertexColorRegionBounds } from "@/utils/vertex-color-region"

// Nico authors the exact desk position for a skinned inspectable as an
// empty (e.g. "PosCat" for SM_Octocat) instead of relying on a bind-pose
// Box3 center for placement — more precise, and sidesteps the same
// bind-pose unreliability noted below. Hand-mapped per mesh rather than
// derived from its name until there's a second skinned inspectable to
// confirm an actual naming convention.
const SKINNED_MESH_POSITION_MARKERS: Record<string, string> = {
  SM_Octocat: "PosCat"
}

interface ExtractMeshesProps {
  office: Object3D
  officeItems: Object3D
  godrays: Object3D
  outdoorCars: Object3D
  basketballNet: Object3D
  inspectables: { mesh: string }[]
}

export const extractMeshes = ({
  office,
  officeItems,
  godrays,
  outdoorCars,
  basketballNet,
  inspectables
}: ExtractMeshesProps) => {
  // officeItems is loaded purely as a mesh source (useGLTF) and never
  // itself mounted into the render tree, so nothing ever runs the normal
  // scene-graph updateMatrixWorld() pass over it. SM_Octocat's bones need
  // a correct, freshly-composed matrixWorld below (calculateInverses
  // reads it directly), so force one update here before anything reads
  // bone transforms.
  officeItems.updateMatrixWorld(true)

  // --- Inspectables --- //

  const i: Mesh[] = []
  inspectables.forEach(({ mesh: meshName }) => {
    const mesh = officeItems.getObjectByName(meshName) as Mesh | null
    if (mesh) {
      // Blender exports a skinned mesh's vertices in armature-relative
      // space, not centered on the mesh node's own local origin like a
      // regular mesh's usually are — the raw vertex data already encodes
      // roughly where the object should sit, assuming an otherwise-identity
      // transform. Inspectable treats the mesh's own origin as its
      // rotation/scale pivot when animating the wrapping <group> for
      // inspect — an off-center geometry visibly swings around a distant
      // pivot otherwise.
      //
      // Recenter using the geometry's OWN local-space bounds —
      // deliberately NOT Box3().setFromObject(mesh, true), which applies
      // mesh.matrixWorld and therefore bakes in the parent chain's
      // transform (SM_Octocat's parent, StickRig, carries a real rotation
      // for the wiggle rig). Since the raw vertex data already assumes
      // identity, rotating it again by StickRig's matrix swings the
      // computed center somewhere else entirely — this bit the geometry
      // translate below AND (transitively) the userData.position fallback,
      // both previously derived from that same world-space center.
      if (mesh instanceof SkinnedMesh) {
        const localCenter = new Box3()
          .setFromBufferAttribute(mesh.geometry.attributes.position)
          .getCenter(new Vector3())
        mesh.geometry.translate(-localCenter.x, -localCenter.y, -localCenter.z)

        // The shader now actually applies skinning (added for SM_Octocat's
        // wiggle bones — previously a no-op, so this never mattered before).
        // bindMatrix is a frozen snapshot of "geometry space" from whenever
        // GLTFLoader bound the skeleton; translating the geometry above
        // without updating it left the skin deforming against a reference
        // frame that no longer matched the actual vertex data — collapsing
        // the mesh into a flat, mostly-black mess. Re-bind with a bind
        // matrix that accounts for the same shift (still in the mesh's own
        // local space, hence local — not world — center here).
        const newBindMatrix = mesh.bindMatrix
          .clone()
          .multiply(
            new Matrix4().makeTranslation(
              localCenter.x,
              localCenter.y,
              localCenter.z
            )
          )
        mesh.bind(mesh.skeleton, newBindMatrix)

        // The skin(ned) result was rendering every leg/the tail rotated
        // roughly 180° off — verified by computing
        // boneMatrixWorld·boneInverse per joint live in the browser: for
        // the "hip" bone of each limb it's a real ~180° rotation, not
        // ~Identity. That means skeleton.boneInverses (baked into the glb
        // from Blender's exported inverseBindMatrices) don't match these
        // bones' actual authored rest rotation — a bind-pose/rest-pose
        // mismatch from the Blender→glTF export, not something introduced
        // here. calculateInverses() re-derives boneInverses from each
        // bone's CURRENT matrixWorld (confirmed correct — matches the raw
        // glb node rotations exactly), which is exactly what "treat this
        // pose as the bind pose" means and cancels the extra rotation.
        mesh.skeleton.calculateInverses()

        // SkinnedMesh defaults to AttachedBindMode, whose updateMatrixWorld
        // override unconditionally does
        // `bindMatrixInverse.copy(this.matrixWorld).invert()` every frame,
        // for every SkinnedMesh, regardless of what bind() above was called
        // with (three's SkinnedMesh.js) — correct when the mesh and its
        // skeleton move together as one rigid unit, but Inspectable
        // reparents this mesh away from where its bones actually live
        // (StickRig, still wherever officeItems left it), so that
        // auto-sync stomps our bind() call the instant the mesh gets
        // repositioned, blowing every vertex out to roughly
        // -meshWorldPos. DetachedBindMode re-derives bindMatrixInverse
        // from bindMatrix instead, which is what "skeleton doesn't share
        // the mesh's world space" actually requires.
        mesh.bindMode = DetachedBindMode

        // A bind-pose bounding box (what Box3().setFromObject and
        // three.js's own automatic frustum culling both use) doesn't
        // reflect a SkinnedMesh's actual wiggle-deformed shape, and gets
        // even less reliable once Inspectable moves/scales it right in
        // front of the camera for inspection — three.js can decide the
        // (stale, bind-pose-sized) bounding sphere no longer intersects the
        // frustum and skip drawing it entirely, even though it's plainly
        // on screen. (Confirmed against Nico's own working reference
        // implementation, wiggle/IMPLEMENTATION.md point 3.)
        mesh.frustumCulled = false

        // See SKINNED_MESH_POSITION_MARKERS above. mesh.position is
        // captured into userData.position right below, same as any other
        // inspectable.
        const posMarkerName = SKINNED_MESH_POSITION_MARKERS[meshName]
        const posMarker = posMarkerName
          ? officeItems.getObjectByName(posMarkerName)
          : null
        if (posMarker) {
          posMarker.getWorldPosition(mesh.position)
          // Nico: nudge off PosCat's raw marker position rather than
          // re-export for a small placement tweak on the shelf.
          if (meshName === "SM_Octocat") {
            mesh.position.y += 0.1
            mesh.position.x -= 0.1
          }
        } else {
          console.warn(
            `[extractMeshes] ${meshName}: no position marker${posMarkerName ? ` ("${posMarkerName}")` : ""} found — falling back to the geometry's own local-space center, which assumes an identity parent transform and won't be right if this mesh's parent chain rotates (see SM_Octocat above).`
          )
          mesh.position.copy(localCenter)
        }

        // PosCat only carries position — at rest (unselected) Inspectable
        // slerps toward an identity rotation, so SM_Octocat renders facing
        // whatever direction its raw bind pose happened to face (the
        // shelf's back wall). Nico: needs to be rotated to face the room.
        if (meshName === "SM_Octocat") mesh.rotation.y = Math.PI
      }

      const pos = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z }
      mesh.userData.position = pos
      const rot = { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z }
      mesh.userData.rotation = rot
      i.push(mesh)
    }
  })
  useMesh.setState({ inspectables: i })

  // --- Godrays --- //

  const g: Mesh[] = []
  godrays.traverse((child) => {
    if (child instanceof Mesh) g.push(child)
  })
  useMesh.setState({ godrays: g })

  // --- Weather --- //

  const loboMarino = officeItems.getObjectByName("SM_Lobo") as Mesh | null
  if (loboMarino) loboMarino.visible = false

  const rain = office.getObjectByName("SM_Rain") as Mesh
  useMesh.setState({ weather: { loboMarino, rain } })

  // --- Arcade --- //
  // The 14 buttons + 2 joysticks are now a single merged mesh (SM_Controls)
  // driven by morph targets. We derive each part's morph index (from the morph
  // dictionary) and world-space centroid (from the morph deltas) so the board
  // can place invisible interaction proxies and animate the right influence.

  const controls = office?.getObjectByName("SM_Controls") as Mesh | undefined
  const morphs = controls?.geometry?.morphAttributes?.position
  const dict = controls?.morphTargetDictionary

  if (controls && morphs && dict) {
    controls.updateWorldMatrix(true, false)
    const basePos = controls.geometry.attributes.position
    const EPS = 1e-6
    const tmp = new Vector3()

    // world-space centroid of the vertices moved by a given morph target
    const centroidForMorph = (morphIndex: number): [number, number, number] => {
      const delta = morphs[morphIndex]
      const c = new Vector3()
      let n = 0
      for (let v = 0; v < delta.count; v++) {
        if (
          Math.abs(delta.getX(v)) > EPS ||
          Math.abs(delta.getY(v)) > EPS ||
          Math.abs(delta.getZ(v)) > EPS
        ) {
          c.add(tmp.set(basePos.getX(v), basePos.getY(v), basePos.getZ(v)))
          n++
        }
      }
      if (n > 0) c.multiplyScalar(1 / n)
      c.applyMatrix4(controls.matrixWorld)
      return [c.x, c.y, c.z]
    }

    const buttons: ArcadeButton[] = []
    for (let i = 1; i <= 14; i++) {
      const name = `02_BT_${i}`
      const morphIndex = dict[name]
      if (morphIndex === undefined) continue
      buttons.push({ name, morphIndex, center: centroidForMorph(morphIndex) })
    }

    const sticks: ArcadeStick[] = []
    for (const name of ["02_JYTK_L", "02_JYTK_R"]) {
      const morphX = dict[`${name}_RotX`]
      const morphY = dict[`${name}_RotY`]
      if (morphX === undefined || morphY === undefined) continue
      // RotX moves the whole stick -> its centroid works for both axes
      sticks.push({ name, morphX, morphY, center: centroidForMorph(morphX) })
    }

    // start at rest
    controls.morphTargetInfluences?.fill(0)

    useMesh.setState({ arcade: { controls, buttons, sticks } })
  } else {
    // Old glb (loose buttons) or a controls mesh without morphs -> no interactions.
    console.warn(
      "[arcade] SM_Controls with morph targets not found — arcade board disabled"
    )
    useMesh.setState({
      arcade: { controls: null, buttons: null, sticks: null }
    })
  }

  // --- Blog --- //
  // Door + picaporte (lock handle) used to be two separate rotating meshes
  // (SM_00_010 / SM_00_012). They're now two shape keys on one merged mesh
  // (SM_00_010, Blender-named "Puerta" for the door swing and "Picaporte"
  // for the handle) — same mechanic as SM_Controls: drive
  // morphTargetInfluences by index instead of rotating two separate objects.

  const door = office?.getObjectByName("SM_00_010") as Mesh | undefined
  const doorDict = door?.morphTargetDictionary
  const doorMorphIndex = doorDict?.["Puerta"]
  const lockedDoorMorphIndex = doorDict?.["Picaporte"]
  const doorMorphsFound =
    !!door && doorMorphIndex !== undefined && lockedDoorMorphIndex !== undefined

  if (doorMorphsFound) {
    door.morphTargetInfluences?.fill(0)
  } else {
    // Old glb (rotating door) or a door mesh without shape keys -> door disabled.
    console.warn(
      "[blog] SM_00_010 door/picaporte shape keys not found — door disabled"
    )
  }

  // "PartID" vertex-color paint (Nico, via a custom Blender tool) — the
  // node carries the paint color for each named part as a plain [r,g,b]
  // custom property (extras -> userData), and the actual paint lives in the
  // COLOR_1 vertex attribute (glTF's COLOR_1 loads as "color_1" — COLOR_0
  // is a separate, unrelated SimpleBake channel and is always blank here).
  // BlogDoor/LockedDoor use these bounds to size/position their hitboxes
  // precisely instead of a hand-guessed offset, without needing to
  // raycast SM_00_010 directly — it's a merge-by-material mesh spanning
  // dozens of units, well beyond just this door, so raycasting it live
  // would risk occluding whatever else it happens to overlap.
  const doorHitboxBounds =
    door && Array.isArray(door.userData.Puerta)
      ? findVertexColorRegionBounds(
          door,
          "color_1",
          door.userData.Puerta as [number, number, number]
        )
      : null
  const picaporteHitboxBounds =
    door && Array.isArray(door.userData.Picaporte)
      ? findVertexColorRegionBounds(
          door,
          "color_1",
          door.userData.Picaporte as [number, number, number]
        )
      : null

  // Lamp
  const lamp = office?.getObjectByName("SM_LightMeshBlog") as Mesh
  const lampTargets: Mesh[] = []
  for (let i = 1; i <= 7; i++) {
    const target = office?.getObjectByName(`SM_06_0${i}`) as Mesh | null
    if (target) lampTargets.push(target)
  }

  useMesh.setState({
    blog: {
      door: doorMorphsFound ? (door as Mesh) : null,
      doorMorphIndex: doorMorphsFound ? (doorMorphIndex as number) : null,
      lockedDoorMorphIndex: doorMorphsFound
        ? (lockedDoorMorphIndex as number)
        : null,
      doorHitboxBounds,
      picaporteHitboxBounds,
      lamp,
      lampTargets
    }
  })

  // --- Cars --- //

  const cars: (Mesh | null)[] = []
  outdoorCars.children.forEach((child) => {
    if (child instanceof Mesh) cars.push(child)
  })
  useMesh.setState({ cars })

  // --- Services --- //
  // The clock's eyes + tail used to be 3 separate rotating meshes. They're
  // now one shape key ("Time") on a nested child mesh ("Kit-Cat", one level
  // under the SM_KitCat placement node) — same mechanic as the arcade
  // controls and the blog door.

  const clock = office.getObjectByName("SM_KitCat") as Mesh | undefined
  const clockBody = clock?.getObjectByName("Kit-Cat") as Mesh | undefined
  const clockMorphIndex = clockBody?.morphTargetDictionary?.["Time"]
  const clockMorphFound = !!clockBody && clockMorphIndex !== undefined

  if (clockMorphFound) {
    clockBody!.morphTargetInfluences?.fill(0)
  } else {
    // Old glb (separate hand/eye/tail children) or a clock body without the
    // "Time" shape key -> eyes/tail animation disabled, clock still renders.
    console.warn(
      '[services] Kit-Cat "Time" shape key not found — clock eyes/tail animation disabled'
    )
  }

  const pot = office.getObjectByName("SM_00a_01") as Mesh
  useMesh.setState({
    services: {
      clock: clock ?? null,
      clockBody: clockMorphFound ? (clockBody as Mesh) : null,
      clockMorphIndex: clockMorphFound ? (clockMorphIndex as number) : null,
      pot
    }
  })

  // --- Basketball --- //

  const hoop = office.getObjectByName("SM_BasketballHoop") as Mesh | null
  const hoopGlass = office.getObjectByName("SM_BasketballGlass") as Mesh | null
  const net = (basketballNet.children[0] as Mesh | undefined) ?? null

  if (hoop && hoopGlass && net) {
    hoop.visible = true
    hoop.userData.originalMaterial = hoop.material
    hoopGlass.visible = true
    hoopGlass.userData.originalMaterial = hoopGlass.material
    net.visible = true
    net.userData.originalMaterial = net.material
  } else {
    // Old/incomplete glb missing the basketball meshes -> feature disabled.
    console.warn(
      "[basketball] SM_BasketballHoop/SM_BasketballGlass/net not found — basketball disabled"
    )
  }

  useMesh.setState({ basketball: { hoop, hoopGlass, net } })
}
