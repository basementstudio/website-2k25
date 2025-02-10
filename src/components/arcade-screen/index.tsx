import { useVideoTexture } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Mesh } from "three"
import { Box3, Vector3, WebGLRenderTarget } from "three"

import { useAssets } from "@/components/assets-provider"
import { useCurrentScene } from "@/hooks/use-current-scene"

import { RenderTexture } from "./render-texture"
import { screenMaterial } from "./screen-material"

const ScreenUI = dynamic(
  () =>
    import("./screen-ui").then((mod) => ({
      default: mod.ScreenUI
    })),
  {
    loading: () => null,
    ssr: false
  }
)

export const ArcadeScreen = () => {
  const { scene } = useThree()
  const pathname = usePathname()
  const currentScene = useCurrentScene()
  const isLabRoute = pathname === "/lab"

  const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
  const [screenPosition, setScreenPosition] = useState<Vector3 | null>(null)
  const [screenScale, setScreenScale] = useState<Vector3 | null>(null)
  const [hasVisitedArcade, setHasVisitedArcade] = useState(false)
  const [isScreenUILoaded, setIsScreenUILoaded] = useState(false)

  const { arcade } = useAssets()
  const videoTexture = useVideoTexture(arcade.idleScreen, { loop: true })
  const renderTarget = useMemo(() => new WebGLRenderTarget(1024, 1024), [])

  useEffect(() => {
    const screen = scene.getObjectByName("SM_ArcadeLab_Screen")
    setArcadeScreen(screen as Mesh)

    if (screen) {
      const box = new Box3().setFromObject(screen)
      const size = box.getSize(new Vector3())
      const center = box.getCenter(new Vector3())
      setScreenPosition(center)
      setScreenScale(size)
    }
  }, [scene])

  useEffect(() => {
    if (!arcadeScreen) return

    videoTexture.flipY = false

    if (currentScene === "lab" && isLabRoute && isScreenUILoaded) {
      setHasVisitedArcade(true)
      screenMaterial.uniforms.map.value = renderTarget.texture
    } else if (!hasVisitedArcade || !isScreenUILoaded) {
      screenMaterial.uniforms.map.value = videoTexture
    }

    arcadeScreen.material = screenMaterial
  }, [
    arcadeScreen,
    renderTarget.texture,
    videoTexture,
    currentScene,
    hasVisitedArcade,
    isLabRoute,
    isScreenUILoaded
  ])

  useFrame((_, delta) => {
    if (screenMaterial.uniforms.uTime) {
      screenMaterial.uniforms.uTime.value += delta
    }
  })

  if (!arcadeScreen || !screenPosition || !screenScale) return null

  return (
    <RenderTexture
      isPlaying={currentScene === "lab"}
      fbo={renderTarget}
      useGlobalPointer={false}
      raycasterMesh={arcadeScreen}
    >
      {isLabRoute && (
        <ScreenUI
          screenScale={screenScale}
          onLoad={() => setIsScreenUILoaded(true)}
        />
      )}
    </RenderTexture>
  )
}
