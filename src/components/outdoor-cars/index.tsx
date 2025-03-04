import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { useMesh } from "@/hooks/use-mesh"

export const OutdoorCars = () => {
  const pathname = usePathname()
  const { outdoorCarsMeshes } = useMesh()
  console.log(outdoorCarsMeshes)

  const visible = useMemo(() => {
    return pathname === "/services" || pathname === "/people"
  }, [pathname])

  if (!visible) return null

  return <group visible={visible}></group>
}
