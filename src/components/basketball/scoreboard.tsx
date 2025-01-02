import { useMinigameStore } from "@/store/minigame-store"

export default function Scoreboard() {
  const { playerName, score } = useMinigameStore()

  const scores = [
    {
      name: "Tigresex 91",
      score: 69000
    },
    {
      name: "Neo",
      score: 42991
    },
    {
      name: "totias",
      score: 32203
    },
    {
      name: "el joni",
      score: 15596
    }
  ]
  return (
    <div className="flex min-w-[276px] flex-col text-brand-w2">
      <div className="flex justify-between border-b border-brand-w2">
        <p className="capitalize">{playerName ? playerName : "You"}</p>
        <p>{Math.floor(score)} pts</p>
      </div>
      {scores.map((score, index) => (
        <div
          className="flex justify-between border-b border-brand-w2"
          key={index}
        >
          <p className="capitalize">{score.name}</p>
          <p>{score.score} pts</p>
        </div>
      ))}
    </div>
  )
}
