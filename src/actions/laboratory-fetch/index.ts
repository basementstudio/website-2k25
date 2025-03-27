"use server"

import { basehub } from "basehub"
import { fragmentOn } from "basehub"

import { IMAGE_FRAGMENT } from "@/service/basehub/fragments"

const query = fragmentOn("Query", {
  pages: {
    laboratory: {
      projectList: {
        items: {
          _title: true,
          url: true,
          description: true,
          cover: IMAGE_FRAGMENT
        }
      }
    }
  }
})

export const fetchLaboratory = async () => {
  const res = await basehub().query(query)

  return res.pages.laboratory
}

export type QueryType = fragmentOn.infer<typeof query>
