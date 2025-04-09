"use client"

import useAverageFPS from "@/hooks/use-average-fps"

const Test = () => {
  const { currentFPS, averageFPS } = useAverageFPS()

  return (
    <div className="fixed bottom-0 right-0 z-50">
      Test {currentFPS} {averageFPS}
    </div>
  )
}

export default Test
