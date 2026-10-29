import {
  CapsuleGeometry,
  CatmullRomCurve3,
  ConeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  type ShaderMaterial,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3
} from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"

export const createCatRig = (
  coat: ShaderMaterial,
  eyes: ShaderMaterial,
  ear: ShaderMaterial,
  claw: ShaderMaterial
) => {
  const object = new Group()
  object.name = "halloween-speaker-cat"
  const body = new Group()
  object.add(body)
  const torso = new LatheGeometry(
    [
      new Vector2(0, 0),
      new Vector2(0.065, 0.012),
      new Vector2(0.087, 0.065),
      new Vector2(0.078, 0.13),
      new Vector2(0.055, 0.24),
      new Vector2(0.04, 0.3),
      new Vector2(0, 0.32)
    ],
    24
  )
    .scale(1, 1, 0.85)
    .translate(0, 0, -0.025)
  body.add(new Mesh(torso, coat))
  for (const side of [-1, 1]) {
    const rearPaw = new Mesh(
      new SphereGeometry(1, 12, 8).scale(0.032, 0.013, 0.044),
      coat
    )
    rearPaw.name = "cat-rear-paw"
    rearPaw.position.set(side * 0.058, 0.013, -0.008)
    body.add(rearPaw)
  }
  const head = new Group()
  head.name = "cat-head"
  head.position.set(0, 0.33, 0.02)
  body.add(head)
  const headParts = [
    new SphereGeometry(1, 16, 10).scale(0.067, 0.062, 0.064),
    new SphereGeometry(1, 12, 8)
      .scale(0.038, 0.027, 0.028)
      .translate(0, -0.022, 0.05),
    new ConeGeometry(0.035, 0.085, 3)
      .rotateY(Math.PI / 2)
      .rotateZ(0.16)
      .translate(-0.045, 0.065, -0.005),
    new ConeGeometry(0.035, 0.085, 3)
      .rotateY(-Math.PI / 2)
      .rotateZ(-0.16)
      .translate(0.045, 0.065, -0.005)
  ]
  head.add(new Mesh(mergeGeometries(headParts), coat))
  headParts.forEach((part) => part.dispose())
  const eyelids: Group[] = []
  for (const side of [-1, 1]) {
    const eyelid = new Group()
    eyelid.name = "cat-eye"
    eyelid.position.set(side * 0.03, 0.005, 0.056)
    head.add(eyelid)
    eyelids.push(eyelid)
    const eye = new Mesh(
      new SphereGeometry(1, 12, 8).scale(0.019, 0.009, 0.006),
      eyes
    )
    eye.rotation.z = side * 0.16
    eyelid.add(eye)
    const pupil = new Mesh(
      new SphereGeometry(1, 8, 6).scale(0.003, 0.008, 0.003),
      coat
    )
    pupil.position.set(0, 0, 0.006)
    eyelid.add(pupil)
    const innerEar = new Mesh(new ConeGeometry(0.019, 0.045, 3), ear)
    innerEar.position.set(side * 0.044, 0.06, 0.012)
    head.add(innerEar)
  }
  body.add(
    new Mesh(
      new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(-0.025, 0.055, -0.08),
          new Vector3(-0.105, 0.03, -0.045),
          new Vector3(-0.11, 0.016, 0.055),
          new Vector3(-0.055, 0.014, 0.12),
          new Vector3(0.025, 0.013, 0.115)
        ]),
        28,
        0.011,
        8,
        false
      ),
      coat
    )
  )
  const arms = [-1, 1].map((side) => {
    const arm = new Group()
    arm.name = side < 0 ? "cat-paw-left" : "cat-paw-right"
    arm.position.set(side * 0.035, 0.23, 0.025)
    const armParts = [
      new CapsuleGeometry(0.015, 0.18, 5, 12).translate(0, -0.1, 0.01),
      new SphereGeometry(1, 12, 8)
        .scale(0.025, 0.035, 0.025)
        .translate(0, -0.015, 0)
    ]
    const leg = new Mesh(mergeGeometries(armParts), coat)
    armParts.forEach((part) => part.dispose())
    const paw = new Mesh(
      new SphereGeometry(1, 12, 8)
        .scale(0.024, 0.014, 0.037)
        .translate(0, -0.216, 0.032),
      coat
    )
    arm.add(leg, paw)
    const claws = new Group()
    claws.name = "cat-claws"
    for (const x of [-0.009, 0, 0.009]) {
      const nail = new Mesh(
        new ConeGeometry(0.002, 0.016, 5).rotateX(Math.PI / 2),
        claw
      )
      nail.position.set(x, -0.215, 0.07)
      claws.add(nail)
    }
    claws.visible = false
    arm.add(claws)
    body.add(arm)
    return { arm, claws, side }
  })
  object.traverse((child) => {
    if (child instanceof Mesh) child.raycast = () => {}
  })
  return {
    object,
    update: (
      yaw: number,
      pitch: number,
      blink: number,
      swipe: number,
      side: number
    ) => {
      head.rotation.set(pitch, yaw, 0)
      const reach = swipe > 0 ? Math.sin(swipe * Math.PI) : 0
      eyelids.forEach((eye) => {
        eye.scale.y = Math.max(0.025, 1 - Math.max(blink, reach * 0.3))
      })
      arms.forEach(({ arm, claws, side: armSide }) => {
        const active = side === armSide ? reach : 0
        arm.rotation.x = -1.15 * active
        arm.rotation.z =
          -armSide * Math.sin(swipe * Math.PI * 2) * active * 0.55
        claws.visible = active > 0.2
      })
    },
    dispose: () =>
      object.traverse((child) => {
        if (child instanceof Mesh) child.geometry.dispose()
      })
  }
}
