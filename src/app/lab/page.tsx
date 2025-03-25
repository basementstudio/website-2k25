import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Lab",
  description:
    "basement lab is carving out a vanguard position by combining intensive technology with formal design expertise."
}

const Laboratory = async () => {
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || ""

  const isMobile =
    /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i.test(userAgent)

  if (isMobile) {
    redirect("https://basement.studio/lab")
  }

  return null
}

export default Laboratory
