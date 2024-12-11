import { useThree, useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useState } from "react"
import { Mesh, MeshStandardMaterial } from "three"
import { WebGLRenderTarget, Vector2, Vector3, Box3 } from "three"
import { ScreenUI } from "./screen-ui"
import { createShaderMaterial } from "@/shaders/custom-shader-material"
import { RenderTexture } from "./render-texture"
import { usePathname } from "next/navigation"

export const ArcadeScreen = () => {
    const { scene } = useThree()
    const pathname = usePathname()
    const [arcadeScreen, setArcadeScreen] = useState<Mesh | null>(null)
    useEffect(() => {
        const screen = scene.getObjectByName("SM_ArcadeLab_Screen")
        setArcadeScreen(screen as Mesh)
    }, [scene])
   
    const screenDimensions = useMemo(() => {
        if (!arcadeScreen) return new Vector2(512, 512)
        
        const box = new Box3().setFromObject(arcadeScreen)
        const size = box.getSize(new Vector3())
        
        const baseResolution = 1024
        const width = baseResolution
        const height = baseResolution * (size.y / size.x)
        
        return new Vector2(width, height)
    }, [arcadeScreen])

    const renderTarget = useMemo(() => {
        return new WebGLRenderTarget(screenDimensions.x, screenDimensions.y)
    }, [screenDimensions])

    useEffect(() => {
        if (!arcadeScreen) return
        const newMaterial = new MeshStandardMaterial({ 
            map: renderTarget.texture,
            color: '#ff0000',
            emissive: '#ff0000',
            emissiveIntensity: 0.5
        })
        const shaderMaterial = createShaderMaterial(newMaterial, false)
        ;(arcadeScreen as Mesh).material = shaderMaterial
    }, [arcadeScreen, renderTarget.texture])

    useFrame((state) => {
        const { gl } = state
        gl.setRenderTarget(renderTarget)
        gl.setRenderTarget(null)
    })

    /*return createPortal(
        <ScreenUI />,
        virtualScene
    )*/
    if(!arcadeScreen) return null
    
    return (
        <RenderTexture
            isPlaying={pathname === "/arcade"}
            fbo={renderTarget}
            useGlobalPointer={false}
            raycasterMesh={arcadeScreen}
        >
            <ScreenUI />
        </RenderTexture>
    )
}