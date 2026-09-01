"use client"

import { ArcadeNameInput } from "@/components/basketball/arcade-name-input"
import { LedLeaderboard } from "@/components/basketball/led-leaderboard"
import { Scoreboard } from "@/components/basketball/scoreboard"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useMedia } from "@/hooks/use-media"
import { useMinigameStore } from "@/store/minigame-store"

const Basketball = () => {
  const { playerName, hasPlayed, isGameActive } = useMinigameStore()

  const { handleNavigation } = useHandleNavigation()
  const isMobile = useMedia("(max-width: 1024px)")

  return (
    <>
      {!hasPlayed ? (
        isMobile ? (
          <MobileUI handleNavigation={handleNavigation} />
        ) : (
          <DesktopUI />
        )
      ) : null}

      {(hasPlayed && !playerName) || (hasPlayed && !isGameActive) ? (
        <div className="fixed top-0 grid min-h-screen w-full animate-fade-in place-items-center bg-brand-k/20">
          <div className="flex flex-col items-center gap-4">
            <ArcadeNameInput isMobile={isMobile} />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Basketball

const DesktopUI = () => (
  <div className="pointer-events-none fixed left-0 top-0 h-screen w-full animate-fade-in p-3.5">
    <div className="grid-layout mt-24 h-full">
      <LedLeaderboard className="col-span-2 col-start-10 ml-auto" />
    </div>
  </div>
)

interface MobileUIProps {
  handleNavigation: (route: string) => void
}

const MobileUI = ({ handleNavigation }: MobileUIProps) => (
  <div className="pointer-events-none fixed left-0 top-0 h-screen w-full animate-fade-in flex-col px-4 py-12">
    <div className="grid grid-cols-4 place-items-start gap-4">
      <button
        onClick={() => handleNavigation("/")}
        className="pointer-events-auto absolute left-0 pl-4 text-f-p-mobile text-brand-w1"
      >
        [Close]
      </button>

      <div className="col-span-1 col-start-4 w-full">
        <Scoreboard isMobile />
      </div>
    </div>
  </div>
)
