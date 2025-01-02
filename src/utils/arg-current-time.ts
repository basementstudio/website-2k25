export const argCurrentTime = () => {
  const now = new Date()

  const argCurrentTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  )

  return argCurrentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  })
}
