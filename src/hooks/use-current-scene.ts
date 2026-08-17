import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

export const useCurrentScene = () =>
  useNavigationStore((state) => state.currentScene?.name || "")
