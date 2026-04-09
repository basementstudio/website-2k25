import { draftMode } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  ;(await draftMode()).disable()
  return NextResponse.json({ status: "Draft mode disabled" })
}
