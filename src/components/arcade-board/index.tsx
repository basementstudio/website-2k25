import { useMesh } from "@/hooks/use-mesh"

import { Button } from "./button"
import CoffeeSteam from "./coffee-steam"
import { Stick } from "./stick"

export const ArcadeBoard = () => {
  const { arcade } = useMesh()
  const { buttons, sticks } = arcade

  return (
    <group>
      {buttons?.map((button) => <Button key={button.name} button={button} />)}
      {sticks?.map((stick) => <Stick key={stick.name} stick={stick} />)}

      <CoffeeSteam />
    </group>
  )
}
