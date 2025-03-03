import { usePathname } from "next/navigation"
import { useAssets } from "../assets-provider"
import { useMemo } from "react"

export const OutdoorCars = () => {
  const pathname = usePathname()

  const visible = useMemo(() => {
    return pathname === "/services" || pathname === "/people"
  }, [pathname])

  console.log(visible)

  return <></>
}
