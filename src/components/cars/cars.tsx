import { useMesh } from "@/hooks/use-mesh"

import { useCarAnimation } from "./use-car-animation"

const Cars = () => {
  const { carMeshes } = useMesh()
  const { car, frontWheel, backWheel } = carMeshes
  useCarAnimation({ car: car, frontWheel, backWheel })

  return (
    <>
      {car && (
        <group
          scale={0.8}
          position-x={-9}
          position-z={7.7}
          ref={(group) => {
            if (group) {
              const mirroredCar = car.clone()
              group.clear()
              group.add(car)
              group.add(mirroredCar)
              mirroredCar.scale.z = -3.4

              if (frontWheel) group.add(frontWheel)
              if (backWheel) group.add(backWheel)
            }
          }}
        />
      )}
    </>
  )
}

export default Cars
