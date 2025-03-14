interface Character {
  // texture face ID
  faceId: number
  faceMorph: FaceMorphTargets
  bodyMorph?: BodyMorphTargets
}

export enum FaceMorphTargets {
  Jose = "Jose",
  Facu = "Facu",
  Nacho = "Nacho",
  Mago = "Mago",
  Alan = "Alan",
  Delfina = "Delfina",
  Naza = "Naza",
  Tato = "Tato",
  Tobi = "Tobi",
  Tomas = "Tomas",
  Nat = "Nat",
  Matata = "Matata",
  Chueco = "Chueco",
  Stanti = "Stanti",
  Berna = "Berna",
  Cesar = "Cesar",
  Fede = "Fede",
  Franc = "Franc",
  Franco = "Franco",
  Kalu = "Kalu",
  YoungNico = "YoungNico",
  Stef = "Stef",
  Val = "Val",
  Kalil = "Kalil",
  Nico = "Nico",
  Vitto = "Vitto",
  Lis = "Lis",
  MatiG = "MatiG",
  Flauta = "Flauta",
  JJ = "JJ",
  Ani = "Ani",
  Maca = "Maca",
  Blink = "000Blink"
}

export enum BodyMorphTargets {
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
    bodyMorph: BodyMorphTargets.Woman
  },
  {
    faceId: 2,
    faceMorph: FaceMorphTargets.Facu
  },
  {
    faceId: 3,
    faceMorph: FaceMorphTargets.Nat,
    bodyMorph: BodyMorphTargets.Woman
  }
]
