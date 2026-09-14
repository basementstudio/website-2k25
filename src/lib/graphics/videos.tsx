import { useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import { Frustum, Matrix4, Mesh, VideoTexture } from "three"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useAnimationTime } from "@/components/shared/AnimationController"
import { useFrameCallback } from "@/hooks/use-pausable-time"

import { useSceneAssets } from "./scene-assets"

export function SceneVideos() {
  const scene = useThree((state) => state.scene)
  const ready = useSceneAssets((state) => state.ready)
  const { paused } = useAnimationTime()
  const meshes = useRef<{ mesh: Mesh; texture: VideoTexture }[]>([])
  const frustum = useMemo(() => new Frustum(), [])
  const matrix = useMemo(() => new Matrix4(), [])
  useEffect(() => {
    const list: { mesh: Mesh; texture: VideoTexture }[] = []
    scene.traverse((object) => {
      if (object instanceof Mesh && object.userData.sceneVideo)
        list.push({ mesh: object, texture: object.userData.sceneVideo })
    })
    meshes.current = list
    return () =>
      list.forEach(({ texture }) => texture.userData.setActive(false))
  }, [scene, ready])
  useEffect(() => {
    if (paused)
      meshes.current.forEach(({ texture }) => texture.userData.setActive(false))
  }, [paused])
  useFrameCallback(() => {
    const { mainCamera: camera, currentScene } = useNavigationStore.getState()
    if (!camera) return
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(matrix, camera.coordinateSystem)
    let ready = true
    for (const { mesh, texture } of meshes.current) {
      const visible =
        mesh.visible &&
        !mesh.userData.videoDisabled &&
        frustum.intersectsObject(mesh)
      texture.userData.setActive(visible)
      const video = texture.image as HTMLVideoElement
      if (visible && video.readyState < video.HAVE_CURRENT_DATA && !video.error)
        ready = false
    }
    if (ready)
      useSceneAssets
        .getState()
        .markReady(`videos:${currentScene?.name ?? "home"}`)
  }, -1)
  return null
}
