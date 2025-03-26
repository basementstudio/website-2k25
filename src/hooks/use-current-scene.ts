import { useState } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

import { useSelectStore } from "./use-select-store"

export const useCurrentScene = () => {
  const [currentSceneName, setCurrentSceneName] = useState("")

  useSelectStore(
    useNavigationStore,
    (state) => state.currentScene?.name || "",
    (state, prevState) => state !== prevState,
    (state) => setCurrentSceneName(state)
  )

  return currentSceneName
}
