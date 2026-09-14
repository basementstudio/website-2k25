import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

// Lazy scene features need the current value on their first render. An effect
// subscription briefly returned "", which reset newly mounted arcade games.
export const useCurrentScene = () =>
  useNavigationStore((state) => state.currentScene?.name ?? "")
