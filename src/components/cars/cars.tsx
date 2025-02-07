import { useEffect, useRef } from "react"
import type { Group } from "three"

import { useMesh } from "@/hooks/use-mesh"

import { useCarAnimation } from "./use-car-animation"

const Cars = () => {
  const { carMeshes } = useMesh()
  const { car, frontWheel, backWheel } = carMeshes
  const groupRef = useRef<Group>(null)

  useCarAnimation({ car: car, frontWheel, backWheel })

  useEffect(() => {
    if (!car || !groupRef.current) return

    const group = groupRef.current
    const mirroredCar = car.clone()

    group.clear()
    group.add(car)
    group.add(mirroredCar)
    mirroredCar.scale.z = -3.4

    if (frontWheel) group.add(frontWheel)
    if (backWheel) group.add(backWheel)
  }, [car, frontWheel, backWheel])

  return (
    <>
      {car && (
        <group scale={0.8} position-x={-9} position-z={7.7} ref={groupRef} />
      )}
    </>
  )
}

export default Cars
