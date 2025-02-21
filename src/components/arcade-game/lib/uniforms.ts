import { Material, ShaderMaterial } from "three";

export const setMaterialUniforms = (material: Material | ShaderMaterial, uniforms: Record<string, unknown>) => {

  if (material.isMaterial === true && (material as any).uniforms !== undefined) {
    Object.entries(uniforms).forEach(([key, value]) => {
      if ((material as any).uniforms[key] === undefined) {
        console.warn(`Uniform ${key} does not exist in material`, material.id)
        return
      } else {
        (material as any).uniforms[key].value = value
      }

    })
  } else {
    console.warn("Material is not a material")
  }
}
