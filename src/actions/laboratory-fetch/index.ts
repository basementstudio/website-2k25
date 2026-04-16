"use server"

import { fetchLabProjects } from "./sanity"

export type { LabProject } from "./sanity"

export const fetchLaboratory = async () => {
  const projects = await fetchLabProjects()

  return projects.map((project) => ({
    title: project.title,
    url: project.url,
    description: project.description,
    cover: project.cover?.asset ? { url: project.cover.asset.url } : null
  }))
}
