import { create } from "zustand"

import { QueryType } from "@/components/arcade-screen/query"

interface ArcadeStore {
  data: QueryType | null
  setData: (data: QueryType) => void
}

export const useArcadeStore = create<ArcadeStore>((set) => ({
  data: null,
  setData: (data) => set({ data })
}))
