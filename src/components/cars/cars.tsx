import { useMesh } from "@/hooks/use-mesh"

import { useCarAnimation } from "./use-car-animation"

const Cars = () => {
  const { carMesh } = useMesh()
  console.log(carMesh)
  useCarAnimation({ car: carMesh })
  return (
    <>
      {carMesh && (
        <group
          scale={0.8}
          position-x={-8.8}
          position-z={7.7}
          ref={(group) => {
            if (group) {
              const mirroredCar = carMesh.clone()
              group.clear()
              group.add(carMesh)
              group.add(mirroredCar)
              mirroredCar.scale.z = -3.4
            }
          }}
        />
      )}
    </>
  )
}

export default Cars
