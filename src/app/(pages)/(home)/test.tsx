"use client"

import useFPSMonitor from "@/hooks/use-average-fps"

const Test = () => {
  const { currentFPS, averageFPS } = useFPSMonitor()

  return (
    <div className="fixed bottom-0 right-0 z-50">
      Test {currentFPS} {averageFPS}
    </div>
  )
}

export default Test
