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
  "val-hair",
  "stef-hair",
  "mago-hair",
  "maca-hair"
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
  "val-hair" = 14,
  "stef-hair" = 15,
  "mago-hair" = 16,
  "maca-hair" = 17
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
  Mago = "Mago-v3",
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
  Franco = "Franco-v3",
  Kalu = "Kalu-v3",
  YoungNico = "YoungNico",
  Stef = "Stef-v3",
  Val = "Val-v2",
  Kalil = "Kalil",
  Nico = "Nico-v3",
  Vitto = "Vitto-v3",
  Lis = "Lis-v2",
  MatiG = "MatiG-v3",
  Flauta = "Flauta-v2",
  JJ = "JJ-v2",
  Ani = "Ani",
  Maca = "Maca-v3",
  Blink = "000Blink"
}

export enum BodyMorphTargets {
  Man = "men",
  Woman = "woman"
}

export const characterConfigurations: Character[] = [
  {
    faceId: 0,
    faceMorph: FaceMorphTargets.Jose
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
    faceMorph: FaceMorphTargets.Lis
  },
  {
    faceId: 7,
    faceMorph: FaceMorphTargets.Kalu,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["kalu-hair"]
  },
  {
    faceId: 8,
    faceMorph: FaceMorphTargets.Nico
  },
  {
    faceId: 9,
    faceMorph: FaceMorphTargets.Val,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["val-hair"]
  },
  {
    faceId: 10,
    faceMorph: FaceMorphTargets.Franco
  },
  {
    faceId: 11,
    faceMorph: FaceMorphTargets.MatiG
  },
  {
    faceId: 12,
    faceMorph: FaceMorphTargets.Vitto
  },
  {
    faceId: 13,
    faceMorph: FaceMorphTargets.Stef,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["stef-hair"]
  },
  {
    faceId: 14,
    faceMorph: FaceMorphTargets.Mago,
    hairGeometry: CharacterMeshes["mago-hair"]
  },
  {
    faceId: 15,
    faceMorph: FaceMorphTargets.Maca,
    bodyMorph: BodyMorphTargets.Woman,
    hairGeometry: CharacterMeshes["maca-hair"]
  }
]

export const CHARACTERS_MAX = characterConfigurations.length
export const FACES_GRID_COLS = Math.ceil(Math.sqrt(CHARACTERS_MAX))
