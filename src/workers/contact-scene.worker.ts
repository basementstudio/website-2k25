import * as THREE from "three"
import { AnimationUtils } from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/Addons.js"

import { easeInOutCubic } from "@/utils/animations"

declare function requestAnimationFrame(callback: (time: number) => void): number

interface WorkerMessage {
  canvas?: OffscreenCanvas
  width: number
  height: number
  type?: "resize" | "load-model" | "animate-out"
  modelUrl?: string
  mousePos?: { x: number; y: number }
}

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let model: THREE.Group | null = null
let mixer: THREE.AnimationMixer | null = null
let currentAnimation: THREE.AnimationAction | null = null
let isExiting = false
let modelMaxDim = 0
let currentMousePos = { x: 0, y: 0 }
let targetMousePos = { x: 0, y: 0 }

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.5/"
)
const loader = new GLTFLoader()
loader.setDRACOLoader(dracoLoader)

async function loadModel(url: string) {
  try {
    const gltf = await loader.loadAsync(url)
    if (gltf.animations && gltf.animations.length > 0) {
      // console.log(
      //   gltf.animations.map((anim) => ({
      //     name: anim.name,
      //     duration: anim.duration,
      //     tracks: anim.tracks.length
      //   }))
      // )

      mixer = new THREE.AnimationMixer(gltf.scene)

      // both idle anims - one for each arm
      const baseAnim = gltf.animations[0]
      const secondAnim = gltf.animations[1]

      if (baseAnim && secondAnim) {
        console.log("Found animations:", baseAnim.name, secondAnim.name)

        const idleclip1 = AnimationUtils.subclip(
          baseAnim,
          "idle1",
          0,
          baseAnim.duration * 30,
          30
        )
        const idleClip2 = AnimationUtils.subclip(
          secondAnim,
          "idle2",
          0,
          secondAnim.duration * 30,
          30
        )

        const action1 = mixer.clipAction(idleclip1)
        const action2 = mixer.clipAction(idleClip2)

        action1.setLoop(THREE.LoopRepeat, Infinity)
        action2.setLoop(THREE.LoopRepeat, Infinity)

        // action1.setEffectiveWeight(1)
        // action2.setEffectiveWeight(1)

        action1.play()
        action2.play()

        currentAnimation = action1
      }
    } else {
      console.log("no animations found")
    }

    if (model) {
      scene.remove(model)
    }
    model = gltf.scene
    scene.add(gltf.scene)

    // model bounds
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    modelMaxDim = Math.max(size.x, size.y, size.z)

    camera.position.set(0, 0.1, 0.25)
    // camera.lookAt(center)

    model.position.y = -modelMaxDim * 2
    isExiting = false

    return true
  } catch (error) {
    console.error("Error loading model:", error)
    return false
  }
}

function init(canvas: OffscreenCanvas, width: number, height: number) {
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.z = 2

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  })
  renderer.setSize(width, height, false)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(5, 5, 5)

  const pointLight = new THREE.PointLight(0xff9000, 1, 10)
  pointLight.position.set(2, 2, 2)

  const spotLight = new THREE.SpotLight(0x0000ff, 1)
  spotLight.position.set(-5, 5, 0)
  spotLight.angle = Math.PI / 6
  spotLight.penumbra = 0.5

  scene.add(ambientLight, directionalLight, pointLight, spotLight)
}

let time = 0
let lastTime = 0
function animate(timestamp: number) {
  if (!renderer) return

  const deltaTime = (timestamp - lastTime) * 0.001
  lastTime = timestamp

  time += 0.01

  if (mixer) {
    mixer.update(deltaTime)
  }

  if (model) {
    const targetY = isExiting ? -modelMaxDim * 2 : 0
    const currentY = model.position.y
    const delta = (targetY - currentY) * easeInOutCubic(time * 0.3)
    model.position.y += delta

    if (isExiting) {
      if (Math.abs(currentY - targetY) < 0.01) {
        self.postMessage({ type: "animation-complete" })
      }
    }
  }

  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, canvas, width, height, modelUrl, mousePos } = e.data

  // if (mousePos) {
  //   targetMousePos = {
  //     x: (mousePos.x / width) * 2 - 1,
  //     y: -(mousePos.y / height) * 2 + 1
  //   }
  // }

  if (canvas && !renderer) {
    init(canvas, width, height)
    animate(0)
  } else if (type === "resize" && renderer) {
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  } else if (type === "load-model" && modelUrl) {
    await loadModel(modelUrl)
  } else if (type === "animate-out") {
    isExiting = true
    time = 0
  }
}
