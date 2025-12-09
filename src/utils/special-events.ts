const toMonthDay = (mmdd: string): [number, number] => {
  const [monthStr, dayStr] = mmdd.split("-")
  return [parseInt(monthStr, 10) - 1, parseInt(dayStr, 10)]
}

const getArgentinaDate = (): Date => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })

  const now = new Date()
  const parts = formatter.formatToParts(now)

  const year = parseInt(
    parts.find((part) => part.type === "year")?.value || "0",
    10
  )
  const month =
    parseInt(parts.find((part) => part.type === "month")?.value || "0", 10) - 1
  const day = parseInt(
    parts.find((part) => part.type === "day")?.value || "0",
    10
  )

  return new Date(year, month, day)
}

const isBetweenYearlyDates = (startMMDD: string, endMMDD: string): boolean => {
  const target = getArgentinaDate()

  const [startM, startD] = toMonthDay(startMMDD)
  const [endM, endD] = toMonthDay(endMMDD)
  const y = 2000

  const startDt = new Date(y, startM, startD)
  const endDt = new Date(y, endM, endD)
  const targetDt = new Date(y, target.getMonth(), target.getDate())

  return startDt <= endDt
    ? targetDt >= startDt && targetDt <= endDt
    : targetDt >= startDt || targetDt <= endDt
}

export const IsChristmasSeason = (): boolean =>
  isBetweenYearlyDates("12-07", "01-06")
