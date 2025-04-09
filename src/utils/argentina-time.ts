export const ArgentinaTime = () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  })

  const now = new Date()
  const parts = formatter.formatToParts(now)

  // Extract time components from formatted parts
  const hours = parseInt(
    parts.find((part) => part.type === "hour")?.value || "0",
    10
  )
  const minutes = parseInt(
    parts.find((part) => part.type === "minute")?.value || "0",
    10
  )
  const seconds = parseInt(
    parts.find((part) => part.type === "second")?.value || "0",
    10
  )

  return { hours, minutes, seconds }
}
