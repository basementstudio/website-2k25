import { useMesh } from "@/hooks/use-mesh"

import { Button } from "./button"
import { Stick } from "./stick"
import CoffeeSteam from "./coffee-steam"

export const ArcadeBoard = () => {
  const { arcade } = useMesh()
  const { buttons, sticks } = arcade

  return (
    <group>
      {buttons?.map((button) => <Button key={button.name} button={button} />)}
      {sticks?.map((stick) => (
        <Stick
          key={stick.name}
          stick={stick}
          offsetX={stick.name === "02_JYTK_L" ? -0.06 : 0.03}
        />
      ))}

      <CoffeeSteam />
    </group>
  )
}
