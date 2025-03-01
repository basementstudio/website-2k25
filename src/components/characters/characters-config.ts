interface Character {
  // texture face ID
  faceId: number
  faceMorph: FaceMorphTargets
  bodyMorph: BodyMorphTargets
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
  Man2 = "Man2",
  Man3 = "Man3",
  Woman1 = "Woman1",
  Woman2 = "Woman2"
}

export const characterConfigurations: Character[] = [
  {
    faceId: 0,
    faceMorph: FaceMorphTargets.Berna,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 0,
    faceMorph: FaceMorphTargets.Ani,
    bodyMorph: BodyMorphTargets.Woman1
  },
  {
    faceId: 1,
    faceMorph: FaceMorphTargets.Cesar,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 2,
    faceMorph: FaceMorphTargets.Chueco,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 3,
    faceMorph: FaceMorphTargets.Delfina,
    bodyMorph: BodyMorphTargets.Woman1
  },
  {
    faceId: 4,
    faceMorph: FaceMorphTargets.Tato,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 5,
    faceMorph: FaceMorphTargets.Tobi,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 6,
    faceMorph: FaceMorphTargets.Flauta,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 7,
    faceMorph: FaceMorphTargets.Franc,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 8,
    faceMorph: FaceMorphTargets.Franco,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 10,
    faceMorph: FaceMorphTargets.Alan,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 12,
    faceMorph: FaceMorphTargets.Kalil,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 14,
    faceMorph: FaceMorphTargets.Lis,
    bodyMorph: BodyMorphTargets.Woman1
  },
  {
    faceId: 15,
    faceMorph: FaceMorphTargets.Mago,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 16,
    faceMorph: FaceMorphTargets.Stanti,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 17,
    faceMorph: FaceMorphTargets.Matata,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 18,
    faceMorph: FaceMorphTargets.Nacho,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 19,
    faceMorph: FaceMorphTargets.Nat,
    bodyMorph: BodyMorphTargets.Woman1
  },
  {
    faceId: 19,
    faceMorph: FaceMorphTargets.Kalu,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 20,
    faceMorph: FaceMorphTargets.Naza,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 21,
    faceMorph: FaceMorphTargets.Nico,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 22,
    faceMorph: FaceMorphTargets.Fede,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 23,
    faceMorph: FaceMorphTargets.YoungNico,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 24,
    faceMorph: FaceMorphTargets.Tomas,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 25,
    faceMorph: FaceMorphTargets.Facu,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 26,
    faceMorph: FaceMorphTargets.Maca,
    bodyMorph: BodyMorphTargets.Woman1
  },
  {
    faceId: 27,
    faceMorph: FaceMorphTargets.MatiG,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 28,
    faceMorph: FaceMorphTargets.Vitto,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 29,
    faceMorph: FaceMorphTargets.Jose,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 30,
    faceMorph: FaceMorphTargets.Val,
    bodyMorph: BodyMorphTargets.Woman1
  },
  {
    faceId: 29,
    faceMorph: FaceMorphTargets.JJ,
    bodyMorph: BodyMorphTargets.Man2
  },
  {
    faceId: 31,
    faceMorph: FaceMorphTargets.Stef,
    bodyMorph: BodyMorphTargets.Woman1
  }
]
