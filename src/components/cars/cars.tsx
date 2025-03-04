// @ts-nocheck

import { useEffect, useRef } from "react"
import type { Group } from "three"

import { useMesh } from "@/hooks/use-mesh"

import { useAssets } from "../assets-provider"
import { useCarAnimation } from "./use-car-animation"

const Cars = () => {
  const { carMeshes } = useMesh()
  const { car, frontWheel, backWheel } = carMeshes
  const groupRef = useRef<Group>(null)

  const { car: carV5 } = useAssets()
  const { textures } = carV5

  useCarAnimation({
    car: car,
    frontWheel,
    backWheel,
    textures: {
      dodgeO: textures.dodgeOTexture,
      dodgeB: textures.dodgeBTexture,
      delorean: textures.deloreanTexture,
      nissan: textures.nissanTexture,
      simpsons: textures.simpsonsTexture,
      knightRider: textures.knightRiderTexture,
      mistery: textures.misteryTexture
    }
  })

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
        <group
          raycast={() => null}
          scale={0.8}
          position-x={-9}
          position-z={7.7}
          ref={groupRef}
        />
      )}
    </>
  )
}

export default Cars
