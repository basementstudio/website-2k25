import { useThree, createPortal, useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import { Color, Mesh, MeshStandardMaterial } from "three"
import { WebGLRenderTarget, Scene, OrthographicCamera, Vector2, Vector3, Box3 } from "three"
import { ScreenUI } from "./screen-ui"
import { createShaderMaterial } from "@/shaders/custom-shader-material"

export const ArcadeScreen = () => {
    const { scene } = useThree()
    const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
    useEffect(() => {
        const screen = scene.getObjectByName("SM_ArcadeLab_Screen")
        setArcadeScreen(screen as Mesh)
    }, [scene])
   
    const screenDimensions = useMemo(() => {
        if (!arcadeScreen) return new Vector2(512, 512)
        
        const box = new Box3().setFromObject(arcadeScreen)
        const size = box.getSize(new Vector3())
        
        const width = Math.abs(size.x)
        const height = Math.abs(size.y)
        const aspect = width / height
        
        const baseResolution = 1024
        return new Vector2(baseResolution, baseResolution / aspect)
    }, [arcadeScreen])

    const renderTarget = useMemo(() => {
        return new WebGLRenderTarget(screenDimensions.x, screenDimensions.y)
    }, [screenDimensions])

   const virtualCamera = useMemo(() => {
    const aspect = screenDimensions.x / screenDimensions.y;
    const camera = new OrthographicCamera(-1, 1, 1/aspect, -1/aspect, 0.1, 1000);
    camera.position.z = 1; 
    return camera;
}, [screenDimensions]);

   const virtualScene = useMemo(() => {
        const scene = new Scene()
        scene.background = new Color('#FF4D00')
        return scene
    }, [])

    useEffect(() => {
        if (!arcadeScreen) return
        const newMaterial = new MeshStandardMaterial({ map: renderTarget.texture })
        const shaderMaterial = createShaderMaterial(newMaterial, false)
        ;(arcadeScreen as Mesh).material = shaderMaterial
    }, [arcadeScreen, renderTarget.texture])

    useFrame((state) => {
        const { gl } = state
        gl.setRenderTarget(renderTarget)
        gl.render(virtualScene, virtualCamera)
        gl.setRenderTarget(null)
    })

    return createPortal(
        <ScreenUI />,
        virtualScene
    )
}