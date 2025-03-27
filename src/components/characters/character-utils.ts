import { CHARACTERS_MAX } from "./characters-config"

const possibleFaces = Array.from({ length: CHARACTERS_MAX }, (_, i) => i)

// Get a face from possible faces and remove it from the array
const getRandomCharacterIndex = () => {
  // if no faces left, reset the array
  if (possibleFaces.length === 0) {
    possibleFaces.push(...Array.from({ length: CHARACTERS_MAX }, (_, i) => i))
  }

  const randomIndex = Math.floor(Math.random() * possibleFaces.length)
  return possibleFaces.splice(randomIndex, 1)[0]
}

export const getTextureCoord = (id: number, gridEdgeRepeat: number) => {
  let row = Math.floor(id / gridEdgeRepeat)
  let col = id % gridEdgeRepeat
  const uvOffset = [col / gridEdgeRepeat, row / gridEdgeRepeat] // uv offset
  return uvOffset
}

export const bodyGrid = 1
const numBody = bodyGrid * bodyGrid

export const getRandomBodyId = () => {
  return Math.floor(Math.random() * numBody)
}

export const generateCharacterIds = (num: number) =>
  Array.from({ length: num }, () => getRandomCharacterIndex())
