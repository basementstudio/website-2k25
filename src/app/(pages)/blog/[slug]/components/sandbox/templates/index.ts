import {
  SANDBOX_TEMPLATES,
  SandboxTemplate,
  SandpackPredefinedTemplate
} from "@codesandbox/sandpack-react"

import { p5Template } from "./p5"

export const defaultTemplates = Object.keys(
  SANDBOX_TEMPLATES
) as SandpackPredefinedTemplate[]

export const customTemplates = ["p5"] as const

export type DefaultTemplateName = (typeof defaultTemplates)[number]
export type CustomTemplateName = (typeof customTemplates)[number]

export type TemplateName = DefaultTemplateName | CustomTemplateName

export interface TemplateConfig extends SandboxTemplate {
  name: TemplateName
  // if extends is set, the template will inherit the properties of the default template
  extends?: DefaultTemplateName

  editableFiles?: string[]
  activeFile?: string
}

/** Return a template config for a custom template, or undefined if it's a default template */
export function getTemplateConfig(
  template: CustomTemplateName
): Partial<TemplateConfig> {
  switch (template) {
    case "p5":
      return p5Template

    default:
      throw new Error(`Unknown template: ${template}`)
  }
}
