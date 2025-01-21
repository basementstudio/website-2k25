import { useMinigameStore } from "@/store/minigame-store"
import { cn } from "@/utils/cn"

export default function Scoreboard({ className }: { className?: string }) {
  const { playerName, score } = useMinigameStore()

  const scores = [
    {
      name: "TIG",
      score: 69000
    },
    {
      name: "TBI",
      score: 42991
    },
    {
      name: "MAT",
      score: 32203
    },
    {
      name: "PAT",
      score: 15596
    }
  ]
  return (
    <div className={cn("flex flex-col text-brand-w2", className)}>
      <div className="flex justify-between border-b border-brand-w2">
        <p className="uppercase">{playerName ? playerName : "-"}</p>
        <p>{score === 0 ? "-" : `${Math.floor(score)} pts`}</p>
      </div>
      {scores.map((score, index) => (
        <div
          className="flex justify-between border-b border-brand-w2"
          key={index}
        >
          <p className="uppercase">{score.name}</p>
          <p>{score.score} pts</p>
        </div>
      ))}
    </div>
  )
}
