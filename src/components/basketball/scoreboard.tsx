import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"

export default function Scoreboard({ className }: { className?: string }) {
  const { playerName, score } = useMinigameStore()

  const scores = [
    {
      name: "TIG",
      score: 69
    },
    {
      name: "TBI",
      score: 42
    },
    {
      name: "MAT",
      score: 32
    },
    {
      name: "PAT",
      score: 15
    }
  ]
  return (
    <div
      className={cn(
        "flex select-none flex-col font-semibold text-brand-w2",
        className
      )}
    >
      <p className="pb-1 text-xs">High Scores:</p>
      <div className="flex justify-between border-b border-brand-w2/20 py-1">
        <p className="uppercase text-brand-g1">
          {playerName ? playerName : "-"}
        </p>
        <p>{score === 0 ? "- pts" : `${Math.floor(score)} pts`}</p>
      </div>
      {scores.slice(0, 32).map((score, index) => (
        <div
          className="flex justify-between border-b border-brand-w2/20 py-1"
          key={index}
        >
          <p className="uppercase text-brand-g1">{score.name}</p>
          <p>{score.score} pts</p>
        </div>
      ))}
    </div>
  )
}
