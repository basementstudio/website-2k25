"use client"

import {
  BriefcaseIcon,
  BrowsersIcon,
  CubeIcon,
  FadersIcon,
  FilesIcon,
  FileTextIcon,
  HeartIcon,
  HouseIcon,
  LightningIcon,
  RocketIcon,
  SquaresFourIcon,
  StackIcon,
  StarIcon,
  TagIcon,
  UserIcon,
  UsersIcon
} from "@phosphor-icons/react/dist/ssr"
import { visionTool } from "@sanity/vision"
import { defineConfig } from "sanity"
import { presentationTool } from "sanity/presentation"
import type { StructureBuilder } from "sanity/structure"
import { structureTool } from "sanity/structure"
import { media } from "sanity-plugin-media"
import { muxInput } from "sanity-plugin-mux-input"

import { dataset, projectId } from "./sanity/env"
import { resolve } from "./sanity/presentation/resolve"
import { schemaTypes } from "./sanity/schemas"
import { createConfirmPublishAction } from "./sanity/studio/confirm-publish-action"

const isProd = process.env.NODE_ENV === "production"

const singletonTypes = new Set([
  "homepage",
  "servicesPage",
  "peoplePage",
  "companyInfo",
  "threeDAssets",
  "showcasePage",
  "inspectablesConfig",
  "scenesConfig",
  "physicsConfig"
])

const singletonActions = new Set(["publish", "discardChanges", "restore"])

function structure(S: StructureBuilder) {
  return S.list()
    .title("Content")
    .items([
      // --- Singletons (Pages) ---
      S.listItem()
        .title("Pages")
        .icon(BrowsersIcon)
        .child(
          S.list()
            .title("Pages")
            .items([
              S.listItem()
                .title("Homepage")
                .id("homepage")
                .icon(HouseIcon)
                .child(
                  S.document().schemaType("homepage").documentId("homepage")
                ),
              S.listItem()
                .title("Services Page")
                .id("servicesPage")
                .icon(RocketIcon)
                .child(
                  S.document()
                    .schemaType("servicesPage")
                    .documentId("servicesPage")
                ),
              S.listItem()
                .title("People Page")
                .id("peoplePage")
                .icon(UsersIcon)
                .child(
                  S.document().schemaType("peoplePage").documentId("peoplePage")
                ),
              S.listItem()
                .title("Company Info")
                .id("companyInfo")
                .icon(BriefcaseIcon)
                .child(
                  S.document()
                    .schemaType("companyInfo")
                    .documentId("companyInfo")
                ),
              S.listItem()
                .title("3D Assets (DEPRECATED)")
                .id("threeDAssets")
                .icon(CubeIcon)
                .child(
                  S.document()
                    .schemaType("threeDAssets")
                    .documentId("threeDAssets")
                ),
              S.listItem()
                .title("Showcase Page")
                .id("showcasePage")
                .icon(StackIcon)
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
        .icon(FilesIcon)
        .child(
          S.list()
            .title("Content")
            .items([
              S.documentTypeListItem("post")
                .title("Blog Posts")
                .icon(FileTextIcon),
              S.documentTypeListItem("postCategory")
                .title("Post Categories")
                .icon(TagIcon),
              S.documentTypeListItem("project")
                .title("Projects")
                .icon(StackIcon),
              S.documentTypeListItem("projectCategory")
                .title("Project Categories")
                .icon(TagIcon),
              S.documentTypeListItem("labProject")
                .title("Lab Projects")
                .icon(LightningIcon)
            ])
        ),

      // --- Company ---
      S.listItem()
        .title("Company")
        .icon(UsersIcon)
        .child(
          S.list()
            .title("Company")
            .items([
              S.documentTypeListItem("client")
                .title("Clients")
                .icon(BriefcaseIcon),
              S.documentTypeListItem("person").title("People").icon(UserIcon),
              S.documentTypeListItem("department")
                .title("Departments")
                .icon(SquaresFourIcon),
              S.documentTypeListItem("award").title("Awards").icon(StarIcon),
              S.documentTypeListItem("testimonial")
                .title("Testimonials")
                .icon(HeartIcon),
              S.documentTypeListItem("value").title("Values").icon(TagIcon)
            ])
        ),

      // --- Careers ---
      S.listItem()
        .title("Careers")
        .icon(RocketIcon)
        .child(
          S.list()
            .title("Careers")
            .items([
              S.documentTypeListItem("openPosition")
                .title("Open Positions")
                .icon(BriefcaseIcon)
            ])
        ),

      S.divider(),

      // --- 3D Config ---
      // Binary files live in public/3d/; only editable content is here.
      S.listItem()
        .title("3D Config")
        .icon(CubeIcon)
        .child(
          S.list()
            .title("3D Config")
            .items([
              S.listItem()
                .title("Inspectables")
                .id("inspectablesConfig")
                .icon(FadersIcon)
                .child(
                  S.document()
                    .schemaType("inspectablesConfig")
                    .documentId("inspectablesConfig")
                ),
              S.listItem()
                .title("Scenes")
                .id("scenesConfig")
                .icon(CubeIcon)
                .child(
                  S.document()
                    .schemaType("scenesConfig")
                    .documentId("scenesConfig")
                ),
              S.listItem()
                .title("Physics")
                .id("physicsConfig")
                .icon(LightningIcon)
                .child(
                  S.document()
                    .schemaType("physicsConfig")
                    .documentId("physicsConfig")
                )
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
  releases: { enabled: false },
  scheduledDrafts: { enabled: false },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      name: "preview",
      title: "Preview",
      resolve,
      previewUrl: {
        previewMode: {
          enable: "/api/draft-mode/enable",
          disable: "/api/draft-mode/disable"
        }
      }
    }),
    muxInput(),
    media(),
    visionTool()
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType))
  },
  document: {
    actions: (input, context) => {
      const filtered = singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input

      // Production only: gate publishing behind a confirm dialog so changes
      // can't go live by accident. Dev/preview publish stays frictionless.
      if (!isProd) return filtered

      return filtered.map((action) =>
        action.action === "publish"
          ? createConfirmPublishAction(action)
          : action
      )
    }
  }
})
