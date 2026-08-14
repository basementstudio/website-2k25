import type { Metadata } from "next"

import { PageJsonLd } from "@/lib/structured-data/page-json-ld"

export const metadata: Metadata = {
  title: "Doom",
  description:
    "Play Doom right in your browser — a playful easter egg from basement.studio.",
  alternates: {
    canonical: "https://basement.studio/doom"
  }
}

const Doom = () => <PageJsonLd />

export default Doom
