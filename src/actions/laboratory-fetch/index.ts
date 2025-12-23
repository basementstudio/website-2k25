"use server"

import { basehub } from "basehub"

interface LaboratoryProject {
  _title: string
  url: string
  description: string
  cover: {
    url: string
    width: number
    height: number
    alt: string | null
  } | null
}

interface LaboratoryData {
  projectList: {
    items: LaboratoryProject[]
  }
}

const laboratoryQuery = {
  pages: {
    laboratory: {
      projectList: {
        items: {
          _title: true,
          url: true,
          description: true,
          cover: {
            url: true,
            width: true,
            height: true,
            alt: true
          }
        }
      }
    }
  }
}

export const fetchLaboratory = async (): Promise<LaboratoryData> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await basehub().query(laboratoryQuery as any)

    return (res as any).pages.laboratory
  } catch {
    // Return empty data if schema doesn't exist
    return {
      projectList: {
        items: []
      }
    }
  }
}

export type { LaboratoryProject, LaboratoryData }
