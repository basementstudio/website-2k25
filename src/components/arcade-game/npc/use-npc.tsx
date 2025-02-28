import React from "react"
import { create } from "zustand"

export type NpcType = "motorcycle"

export interface NpcBase {
  id: string
  type: NpcType
}

export interface NpcTypeMotorcycle extends NpcBase {
  type: "motorcycle"
  startingPosition: [number, number, number]
  speed: number
  isAfraidToDie: false
}

export interface NpcConfig {
  motorcycle: React.ComponentType<NpcTypeMotorcycle>
}

export type NpcEntity = NpcTypeMotorcycle

export interface NpcStore {
  npcs: NpcEntity[]
  addNpc: (npc: NpcEntity) => void
  removeNpc: (id: string) => void
}

export const useNpc = create<NpcStore>((set) => ({
  npcs: [],
  addNpc: (npc) => set((state) => ({ npcs: [...state.npcs, npc] })),
  removeNpc: (id) =>
    set((state) => ({
      npcs: state.npcs.filter((npc) => npc.id !== id)
    }))
}))
