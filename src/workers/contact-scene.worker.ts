import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

import { easeInOutCubic } from "@/utils/animations"

declare function requestAnimationFrame(callback: (time: number) => void): number

interface WorkerMessage {
  canvas?: OffscreenCanvas
  width: number
  height: number
  type?: "resize" | "load-model" | "animate-out"
  modelUrl?: string
}

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let model: THREE.Group | null = null
let isExiting = false
let modelMaxDim = 0
const loader = new GLTFLoader()

async function loadModel(url: string) {
  try {
    const gltf = await loader.loadAsync(url)
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

    camera.position.set(0, modelMaxDim * 0.5, modelMaxDim * 2)
    camera.lookAt(center)

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
function animate(timestamp: number) {
  if (!renderer) return
  time += 0.01

  if (model) {
    const targetY = isExiting ? -modelMaxDim * 2 : 0
    const currentY = model.position.y
    const delta = (targetY - currentY) * easeInOutCubic(time * 0.8)
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
  const { type, canvas, width, height, modelUrl } = e.data

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
    console.log("Starting exit animation")
    isExiting = true
    time = 0
  }
}
