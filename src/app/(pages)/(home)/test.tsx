"use client"

import useAverageFPS from "@/hooks/use-average-fps"

const Test = () => {
  const { fpsHistory, currentFPS } = useAverageFPS()
  return (
    <div>
      Test {currentFPS}
      {fpsHistory.map((fps) => (
        <div key={fps}>{fps}</div>
      ))}
    </div>
  )
}

export default Test
