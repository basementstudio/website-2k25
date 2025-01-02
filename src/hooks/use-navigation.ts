import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { CameraStateKeys, useCameraStore } from "@/store/app-store"

const useNavigation = () => {
  const router = useRouter()
  const setCameraState = useCameraStore((state) => state.setCameraState)

  const handleNavigation = useCallback(
    (route: string, cameraState: CameraStateKeys) => {
      setCameraState(cameraState)
      router.push(route)
    },
    [router, setCameraState]
  )

  return handleNavigation
}

export default useNavigation
