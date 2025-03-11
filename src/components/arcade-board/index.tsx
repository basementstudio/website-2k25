import { useEffect, useRef } from "react"

import { useMesh } from "@/hooks/use-mesh"
import { useArcadeStore } from "@/store/arcade-store"

import { Button } from "./button"
import { checkSequence } from "./check-sequence"
import { CoffeeSteam } from "./coffee-steam"
import { Stick } from "./stick"

export const ArcadeBoard = () => {
  const { arcade } = useMesh()
  const { buttons, sticks } = arcade
  const sequence = useRef<number[]>([])
  const setIsInGame = useArcadeStore((state) => state.setIsInGame)

  useEffect(() => {
    const handleButtonPress = (event: CustomEvent) => {
      let buttonName = event.detail.buttonName

      if (buttonName === "02_BT_7" || buttonName === "02_BT_13")
        buttonName = "A"
      if (buttonName === "02_BT_4" || buttonName === "02_BT_10")
        buttonName = "B"

      sequence.current.push(buttonName)
      checkSequence({ sequence: sequence.current, setIsInGame })
    }

    window.addEventListener("buttonPressed", handleButtonPress as EventListener)

    return () => {
      window.removeEventListener(
        "buttonPressed",
        handleButtonPress as EventListener
      )
    }
  }, [])

  return (
    <>
      {buttons?.map((button) => <Button key={button.name} button={button} />)}
      {sticks?.map((stick) => (
        <Stick key={stick.name} stick={stick} sequence={sequence} />
      ))}
      <CoffeeSteam />
    </>
  )
}
