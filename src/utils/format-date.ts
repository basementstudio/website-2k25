export const formatDate = (date: string, includeTime = false) =>
  new Date(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",

    hour: includeTime ? "numeric" : undefined,
    minute: includeTime ? "numeric" : undefined
  })

// need to return a string like this {hour} am/pm · {month} {day}, {year}
export const formatTestimonialDate = (date: string) => {
  const formattedDate = new Date(date)
  const hour = formattedDate.getHours()
  const minute = formattedDate.getMinutes()

  const hourSuffix = hour < 12 ? "AM" : "PM"
  const month = formattedDate.toLocaleDateString("en-US", { month: "long" })
  const day = formattedDate.toLocaleDateString("en-US", { day: "numeric" })
  const year = formattedDate.toLocaleDateString("en-US", { year: "numeric" })

  return `${hour % 12}:${minute} ${hourSuffix} · ${month} ${day}, ${year}`
}
