// 🦶🔫
interface Character {
  // texture face ID
  faceId: number
  faceMorph: FaceMorphTargets
  bodyMorph?: BodyMorphTargets
  hairGeometry?: CharacterMeshes
  lensGeomtry?: CharacterMeshes
}

export enum CharacterAnimationName {
  "Home.01" = "Home.01",
  "Home.02" = "Home.02",
  "Blog.01" = "Blog.01",
  "Blog.02" = "Blog.02",
  "People.01.a" = "People.01.a",
  "People.01.b" = "People.01.b",
  "People.02.a" = "People.02.a",
  "People.02.b" = "People.02.b",
  "Services.01" = "Services.01",
  "Services.02" = "Services.02"
}

export const SKINNED_MESH_KEYS = [
  "arms",
  "body",
  "Comic",
  "Cup",
  "delfi-hair",
  "facu-glass",
  "flauta-glass",
  "head",
  "jj-glass",
  "jj-hair",
  "kalu-hair",
  "nat-hair",
  "Phone",
  "val-glass",
  "val-hair"
] as const

export enum CharacterMeshes {
  "arms" = 0,
  "body" = 1,
  "Comic" = 2,
  "Cup" = 3,
  "delfi-hair" = 4,
  "facu-glass" = 5,
  "flauta-glass" = 6,
  "head" = 7,
  "jj-glass" = 8,
  "jj-hair" = 9,
  "kalu-hair" = 10,
  "nat-hair" = 11,
  "Phone" = 12,
  "val-glass" = 13,
  "val-hair" = 14
}

export enum CharacterTextureIds {
  none = -1,
  body = 0,
  head = 1,
  arms = 2,
  comic = 3
}

export enum FaceMorphTargets {
  Jose = "Jose-v2",
  Facu = "Facu-v2",
  Nacho = "Nacho",
  Mago = "Mago",
  Alan = "Alan",
  Delfina = "Delfina-v2",
  Naza = "Naza",
  Tato = "Tato",
  Tobi = "Tobi",
  Tomas = "Tomas",
  Nat = "Nat-v2",
  Matata = "Matata",
  Chueco = "Chueco",
  Stanti = "Stanti",
  Berna = "Berna",
  Cesar = "Cesar",
  Fede = "Fede",
  Franc = "Franc",
  Franco = "Franco",
  Kalu = "Kalu-v3",
  YoungNico = "YoungNico",
  Stef = "Stef",
  Val = "Val-v2",
  Kalil = "Kalil",
  Nico = "Nico-v3",
  Vitto = "Vitto",
  Lis = "Lis-v2",
  MatiG = "MatiG",
  Flauta = "Flauta-v2",
  JJ = "JJ-v2",
  Ani = "Ani",
  Maca = "Maca",
  Blink = "000Blink"
}

export enum BodyMorphTargets {
  Man = "man",
  Woman = "woman",
}

export const characterConfigurations: Character[] = [
  {
    faceId: 0,
    faceMorph: FaceMorphTargets.Jose,
    bodyMorph: BodyMorphTargets.Man
  },
  {
    faceId: 1,
    faceMorph: FaceMorphTargets.JJ,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["jj-hair"],
    lensGeomtry: CharacterMeshes["jj-glass"]
  },
  {
    faceId: 2,
    faceMorph: FaceMorphTargets.Flauta,
    bodyMorph: BodyMorphTargets.Man,
    lensGeomtry: CharacterMeshes["flauta-glass"]
  },
  {
    faceId: 3,
    faceMorph: FaceMorphTargets.Delfina,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["delfi-hair"]
  },
  {
    faceId: 4,
    faceMorph: FaceMorphTargets.Facu,
    bodyMorph: BodyMorphTargets.Man,
    lensGeomtry: CharacterMeshes["facu-glass"]
  },
  {
    faceId: 5,
    faceMorph: FaceMorphTargets.Nat,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["nat-hair"]
  },
  {
    faceId: 6,
    faceMorph: FaceMorphTargets.Lis,
    bodyMorph: BodyMorphTargets.Man,
  },
  {
    faceId: 7,
    faceMorph: FaceMorphTargets.Kalu,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["kalu-hair"]
  },
  {
    faceId: 8,
    faceMorph: FaceMorphTargets.Nico,
    bodyMorph: BodyMorphTargets.Man,
  },
  {
    faceId: 9,
    faceMorph: FaceMorphTargets.Val,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["val-hair"]
  }
]

export const CHARACTERS_MAX = characterConfigurations.length
export const FACES_GRID_COLS = Math.ceil(Math.sqrt(CHARACTERS_MAX))
