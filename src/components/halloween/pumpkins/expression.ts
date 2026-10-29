import { MathUtils, type Mesh } from "three"

export const createPumpkinExpression = (mesh: Mesh) => {
  const dictionary = mesh.morphTargetDictionary
  const weights = mesh.morphTargetInfluences
  if (!dictionary || !weights) return null
  const smile = dictionary.Sonrisa
  const mouth = dictionary.Risa_Boca
  const eyes = dictionary.Risa_Ojos
  const indices = [smile, mouth, eyes].filter(
    (index): index is number => index !== undefined
  )
  if (indices.length === 0) return null
  // Blender exported the preview with every expression enabled. Start in
  // the neutral pose, on this cloned mesh only, before measuring its size.
  indices.forEach((index) => {
    weights[index] = 0
  })
  let amount = 0
  let phase = 0
  return {
    update: (hover: number, delta: number, reducedMotion: boolean) => {
      amount = reducedMotion
        ? hover
        : MathUtils.damp(amount, hover, hover > amount ? 5 : 3.5, delta)
      if (amount > 0.01) phase += delta
      else phase = 0
      // Only the authored face flexes. A small jaw cycle suggests a
      // chuckle without wobbling or rotating the whole pumpkin.
      const chuckle = reducedMotion ? 0 : (1 - Math.cos(phase * 5.5)) * 0.5
      if (smile !== undefined) weights[smile] = amount * 0.85
      if (mouth !== undefined) weights[mouth] = amount * (0.25 + chuckle * 0.38)
      if (eyes !== undefined) weights[eyes] = amount * (0.5 + chuckle * 0.18)
    }
  }
}
