import * as THREE from "three"
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

declare function requestAnimationFrame(callback: (time: number) => void): number

interface WorkerMessage {
  canvas?: OffscreenCanvas
  width: number
  height: number
  type?: "resize" | "load-model"
  modelUrl?: string
}

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let model: THREE.Group | null = null
const loader = new GLTFLoader()

async function loadModel(url: string) {
  try {
    const gltf = await loader.loadAsync(url)
    if (model) {
      scene.remove(model)
    }
    model = gltf.scene
    scene.add(gltf.scene)

    // Optional: Auto-position camera based on model bounds
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    camera.position.z = maxDim * 2
    camera.lookAt(center)

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

  // testing cube
  const tempGroup = new THREE.Group()
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.7,
      metalness: 0.3
    })
  )
  tempGroup.add(cube)
  scene.add(tempGroup)
  model = tempGroup
}

let time = 0
function animate(timestamp: number) {
  if (!renderer) return
  time += 0.01

  if (model) {
    model.rotation.y = -Math.PI / 6 + Math.sin(time) * 0.1
    model.position.y = Math.sin(time * 0.5) * 0.05
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
  }
}
