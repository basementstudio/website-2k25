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
import type { ComponentType } from "react"
import { defineConfig } from "sanity"
import { presentationTool } from "sanity/presentation"
import type { StructureBuilder } from "sanity/structure"
import { structureTool } from "sanity/structure"
import { media } from "sanity-plugin-media"
import { muxInput } from "sanity-plugin-mux-input"

import { dataset, projectId } from "./sanity/env"
import { resolve } from "./sanity/presentation/resolve"
import { schemaTypes } from "./sanity/schemas"
import { CollectionPane } from "./sanity/studio/collection-pane"
import { createConfirmPublishAction } from "./sanity/studio/confirm-publish-action"
import { SceneEditorTool } from "./sanity/studio/scene-editor-tool"

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
  "physicsConfig",
  "mapAssetsConfig"
])

const singletonActions = new Set(["publish", "discardChanges", "restore"])

// A searchable, live, draft-badged list pane for a multi-document collection.
// Replaces S.documentTypeListItem with the custom CollectionPane while keeping
// "Create new" and normal document editing intents working.
function collectionPane(
  S: StructureBuilder,
  schemaType: string,
  title: string,
  icon: ComponentType
) {
  return S.listItem()
    .title(title)
    .icon(icon)
    .child(
      S.component()
        .id(`collection-${schemaType}`)
        .title(title)
        .component(CollectionPane)
        .options({ schemaType, icon })
        .canHandleIntent(
          (intentName, params) =>
            (intentName === "edit" || intentName === "create") &&
            params.type === schemaType
        )
        .menuItems([
          S.menuItem()
            .title("Create new")
            .icon(icon)
            .intent({ type: "create", params: { type: schemaType } })
        ])
        .child((childId: string) =>
          S.document()
            .schemaType(schemaType)
            .documentId(childId.replace(/^drafts\./, ""))
        )
    )
}

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
              collectionPane(S, "post", "Blog Posts", FileTextIcon),
              collectionPane(S, "postCategory", "Post Categories", TagIcon),
              collectionPane(S, "project", "Projects", StackIcon),
              collectionPane(
                S,
                "projectCategory",
                "Project Categories",
                TagIcon
              ),
              collectionPane(S, "labProject", "Lab Projects", LightningIcon)
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
              collectionPane(S, "client", "Clients", BriefcaseIcon),
              collectionPane(S, "person", "People", UserIcon),
              collectionPane(S, "department", "Departments", SquaresFourIcon),
              collectionPane(S, "award", "Awards", StarIcon),
              collectionPane(S, "testimonial", "Testimonials", HeartIcon),
              collectionPane(S, "value", "Values", TagIcon)
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
              collectionPane(S, "openPosition", "Open Positions", BriefcaseIcon)
            ])
        ),

      S.divider(),

      // --- 3D Config ---
      S.listItem()
        .title("3D Config")
        .icon(CubeIcon)
        .child(
          S.list()
            .title("3D Config")
            .items([
              S.listItem()
                .title("Map Assets")
                .id("mapAssetsConfig")
                .icon(CubeIcon)
                .child(
                  S.document()
                    .schemaType("mapAssetsConfig")
                    .documentId("mapAssetsConfig")
                ),
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
  // Composable form (not a bare array) so the tools contributed by the plugins
  // above — Structure, Preview, Media, Vision — are preserved rather than
  // replaced.
  tools: (prev) => [
    ...prev,
    {
      name: "editor",
      title: "Editor",
      icon: CubeIcon,
      component: SceneEditorTool
    }
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
