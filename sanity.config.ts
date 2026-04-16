"use client"

import { visionTool } from "@sanity/vision"
import { defineConfig } from "sanity"
import { presentationTool } from "sanity/presentation"
import type { StructureBuilder } from "sanity/structure"
import { structureTool } from "sanity/structure"

import { dataset, projectId } from "./sanity/env"
import { schemaTypes } from "./sanity/schemas"

const singletonTypes = new Set([
  "homepage",
  "servicesPage",
  "peoplePage",
  "careersPostPage",
  "companyInfo",
  "threeDAssets",
  "showcasePage"
])

const singletonActions = new Set(["publish", "discardChanges", "restore"])

function structure(S: StructureBuilder) {
  return S.list()
    .title("Content")
    .items([
      // --- Singletons (Pages) ---
      S.listItem()
        .title("Pages")
        .child(
          S.list()
            .title("Pages")
            .items([
              S.listItem()
                .title("Homepage")
                .id("homepage")
                .child(
                  S.document().schemaType("homepage").documentId("homepage")
                ),
              S.listItem()
                .title("Services Page")
                .id("servicesPage")
                .child(
                  S.document()
                    .schemaType("servicesPage")
                    .documentId("servicesPage")
                ),
              S.listItem()
                .title("People Page")
                .id("peoplePage")
                .child(
                  S.document().schemaType("peoplePage").documentId("peoplePage")
                ),
              S.listItem()
                .title("Careers Post Page")
                .id("careersPostPage")
                .child(
                  S.document()
                    .schemaType("careersPostPage")
                    .documentId("careersPostPage")
                ),
              S.listItem()
                .title("Company Info")
                .id("companyInfo")
                .child(
                  S.document()
                    .schemaType("companyInfo")
                    .documentId("companyInfo")
                ),
              S.listItem()
                .title("3D Assets")
                .id("threeDAssets")
                .child(
                  S.document()
                    .schemaType("threeDAssets")
                    .documentId("threeDAssets")
                ),
              S.listItem()
                .title("Showcase Page")
                .id("showcasePage")
                .child(
                  S.document()
                    .schemaType("showcasePage")
                    .documentId("showcasePage")
                )
            ])
        ),

      S.divider(),

      // --- Content ---
      S.listItem()
        .title("Content")
        .child(
          S.list()
            .title("Content")
            .items([
              S.documentTypeListItem("post").title("Blog Posts"),
              S.documentTypeListItem("postCategory").title("Post Categories"),
              S.documentTypeListItem("project").title("Projects"),
              S.documentTypeListItem("projectCategory").title(
                "Project Categories"
              ),
              S.documentTypeListItem("labProject").title("Lab Projects")
            ])
        ),

      // --- Company ---
      S.listItem()
        .title("Company")
        .child(
          S.list()
            .title("Company")
            .items([
              S.documentTypeListItem("client").title("Clients"),
              S.documentTypeListItem("person").title("People"),
              S.documentTypeListItem("department").title("Departments"),
              S.documentTypeListItem("award").title("Awards"),
              S.documentTypeListItem("testimonial").title("Testimonials"),
              S.documentTypeListItem("value").title("Values")
            ])
        ),

      // --- Careers ---
      S.listItem()
        .title("Careers")
        .child(
          S.list()
            .title("Careers")
            .items([
              S.documentTypeListItem("openPosition").title("Open Positions")
            ])
        )
    ])
}

export default defineConfig({
  name: "website-2k25",
  title: "Website 2K25",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    structureTool({ structure }),
    presentationTool({
      name: "preview",
      title: "Preview",
      previewUrl: {
        previewMode: {
          enable: "/api/draft-mode/enable"
        }
      }
    }),
    visionTool()
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType))
  },
  document: {
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input
  }
})
