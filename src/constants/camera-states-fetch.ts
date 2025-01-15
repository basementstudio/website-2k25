import { basehub } from "basehub"
import { fragmentOn } from "basehub"

const query = fragmentOn("Query", {
  threeDInteractions: {
    cameraStates: {
      cameraStates: {
        items: {
          _title: true,
          fov: true,
          posX: true,
          posY: true,
          posZ: true,
          targetX: true,
          targetY: true,
          targetZ: true,
          offsetMultiplier: true,
          scrollYMin: true
        }
      }
    }
  }
})

export const fetchCameraStates = async () => {
  const res = await basehub().query(query)

  return res.threeDInteractions.cameraStates.cameraStates
}

export type QueryType = fragmentOn.infer<typeof query>
