import { useThree, createPortal, useFrame } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import { Color, Mesh } from "three"
import { WebGLRenderTarget, Scene, OrthographicCamera, Vector2, Vector3, Box3, MeshBasicMaterial } from "three"

export const ArcadeScreen = () => {
    const { scene } = useThree()
    const arcadeScreen = scene.getObjectByName("SM_ArcadeLab_Screen")
    
    // Calculate screen dimensions
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
        const aspect = screenDimensions.x / screenDimensions.y
        return new OrthographicCamera(-1, 1, 1/aspect, -1/aspect, 0.1, 1000)
    }, [screenDimensions])

   const virtualScene = useMemo(() => {
        const scene = new Scene()
        scene.background = new Color('orange')
        return scene
    }, [])

    useEffect(() => {
        if (!arcadeScreen) return
        (arcadeScreen as Mesh).material = new MeshBasicMaterial({ map: renderTarget.texture })
    }, [arcadeScreen, renderTarget.texture])

    useFrame((state) => {
        const { gl } = state
        gl.setRenderTarget(renderTarget)
        gl.render(virtualScene, virtualCamera)
        gl.setRenderTarget(null)
    })

    return createPortal(
         <mesh position={[0, 0, -2]}>
            <boxGeometry args={[1, 1/screenDimensions.x * screenDimensions.y, 1]} />
            <meshBasicMaterial color="red" />
        </mesh>,
        virtualScene
    )
}