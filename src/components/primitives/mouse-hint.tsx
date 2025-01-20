import { useMousePosition } from "@/hooks/use-mouse-position"

export const MouseHint = () => {
  const mousePosition = useMousePosition()
  return <div>MouseHint</div>
}
