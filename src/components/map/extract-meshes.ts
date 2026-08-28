import { Mesh, Object3D, Vector3 } from "three"

import type { ArcadeButton, ArcadeStick } from "@/hooks/use-mesh"
import { useMesh } from "@/hooks/use-mesh"

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
  // --- Inspectables --- //

  const i: Mesh[] = []
  inspectables.forEach(({ mesh: meshName }) => {
    const mesh = officeItems.getObjectByName(meshName) as Mesh | null
    if (mesh) {
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

  const loboMarino = officeItems.getObjectByName("SM_Lobo") as Mesh
  loboMarino.visible = false

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
    useMesh.setState({ arcade: { controls: null, buttons: null, sticks: null } })
  }

  // --- Blog --- //

  // Locked door
  const ld = office?.getObjectByName("SM_00_012") as Mesh
  const ldRotation = { x: ld.rotation.x, y: ld.rotation.y, z: ld.rotation.z }
  ld.userData.originalRotation = ldRotation

  // Door
  const d = office?.getObjectByName("SM_00_010") as Mesh
  const dRotation = { x: d.rotation.x, y: d.rotation.y, z: d.rotation.z }
  d.userData.originalRotation = dRotation

  // Lamp
  const lamp = office?.getObjectByName("SM_LightMeshBlog") as Mesh
  const lampTargets: Mesh[] = []
  for (let i = 1; i <= 7; i++) {
    const target = office?.getObjectByName(`SM_06_0${i}`) as Mesh | null
    if (target) lampTargets.push(target)
  }

  useMesh.setState({ blog: { lockedDoor: ld, door: d, lamp, lampTargets } })

  // --- Cars --- //

  const cars: (Mesh | null)[] = []
  outdoorCars.children.forEach((child) => {
    if (child instanceof Mesh) cars.push(child)
  })
  useMesh.setState({ cars })

  // --- Services --- //

  const clock = office.getObjectByName("SM_KitCat") as Mesh
  const pot = office.getObjectByName("SM_00a_01") as Mesh
  useMesh.setState({ services: { clock, pot } })

  // --- Basketball --- //

  const hoop = office.getObjectByName("SM_BasketballHoop") as Mesh
  const hoopGlass = office.getObjectByName("SM_BasketballGlass") as Mesh

  hoop.visible = true
  hoop.userData.originalMaterial = hoop.material
  hoopGlass.visible = true
  hoopGlass.userData.originalMaterial = hoopGlass.material

  const net = basketballNet.children[0] as Mesh
  net.visible = true
  net.userData.originalMaterial = net.material

  useMesh.setState({
    basketball: {
      hoop: hoop as Mesh,
      hoopGlass: hoopGlass as Mesh,
      net: net as Mesh
    }
  })
}
