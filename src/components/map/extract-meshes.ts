import { Mesh, Object3D } from "three"

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
  const rain = office.getObjectByName("SM_Rain") as Mesh
  useMesh.setState({ weather: { loboMarino, rain } })

  // --- Arcade --- //

  let arcadeButtons: Mesh[] = []
  for (let i = 1; i <= 14; i++) {
    const b = office?.getObjectByName(`02_BT_${i}`) as Mesh
    const buttonPos = { x: b.position.x, y: b.position.y, z: b.position.z }
    b.userData.originalPosition = buttonPos
    if (b) arcadeButtons.push(b)
  }
  useMesh.setState({
    arcade: {
      buttons: arcadeButtons,
      sticks: [
        office?.getObjectByName("02_JYTK_L") as Mesh,
        office?.getObjectByName("02_JYTK_R") as Mesh
      ]
    }
  })

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
