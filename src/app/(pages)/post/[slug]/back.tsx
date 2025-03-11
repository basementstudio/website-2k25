"use client"

import Link from "next/link"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"

export const Back = () => {
  const handleBackClick = () => {
    const scenes = useNavigationStore.getState().scenes
    const blogScene = scenes?.find((scene) => scene.name === "blog")

    if (blogScene) {
      useNavigationStore.setState({ currentScene: blogScene })
    }
  }

  return (
    <Link
      href="/blog#list"
      className="col-span-1 col-start-1 text-brand-w1"
      onClick={handleBackClick}
    >
      ← <span className="underline">Blog</span>
    </Link>
  )
}
