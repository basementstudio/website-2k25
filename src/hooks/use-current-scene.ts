import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

export const useCurrentScene = () => {
  const currentScene = useNavigationStore((state) => state.currentScene)

  return currentScene?.name ?? ""
}
