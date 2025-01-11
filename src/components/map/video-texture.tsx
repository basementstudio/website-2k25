import { useVideoTexture } from "@react-three/drei"
import { useEffect } from "react"
import { Mesh, MeshStandardMaterial } from "three"

export const VideoTexture = ({ mesh, url }: { mesh: Mesh; url: string }) => {
  const texture = useVideoTexture(url, {
    loop: true
  })

  useEffect(() => {
    const currentMaterial = mesh.material as MeshStandardMaterial

    currentMaterial.map = texture
    currentMaterial.emissiveMap = texture

    // TODO: add global material to meshes with video textures

    // const newMaterials = Array.isArray(currentMaterial)
    //   ? currentMaterial.map((material) =>
    //       createGlobalShaderMaterial(material as MeshStandardMaterial, false)
    //     )
    //   : createGlobalShaderMaterial(
    //       currentMaterial as MeshStandardMaterial,
    //       false
    //     )

    // mesh.material = newMaterials

    // mesh.userData.hasGlobalMaterial = true
  }, [mesh, texture])

  return null
}
