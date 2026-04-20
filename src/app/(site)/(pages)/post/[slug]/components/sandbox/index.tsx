"use client"

import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider
} from "@codesandbox/sandpack-react"
import { useState } from "react"

import { cn } from "@/utils/cn"

import { getSandbox } from "./list"
import s from "./sandbox.module.css"
import {
  CustomTemplateName,
  DefaultTemplateName,
  defaultTemplates,
  getTemplateConfig
} from "./templates"
import { BASEMENT_THEME } from "./theme"
import { SandboxToolbar } from "./toolbar"

interface SandboxComponentProps {
  keyName: string
}

export const Sandbox = ({ keyName }: SandboxComponentProps) => {
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview")

  const sandbox = getSandbox(keyName)
  if (!sandbox) return null

  const isDefaultTemplate = defaultTemplates.includes(
    sandbox?.template as DefaultTemplateName
  )

  const templateConfig = isDefaultTemplate
    ? undefined
    : getTemplateConfig(sandbox?.template as CustomTemplateName)

  return (
    <div className="custom-block w-full">
      <SandpackProvider
        template={
          isDefaultTemplate
            ? (sandbox?.template as DefaultTemplateName)
            : (templateConfig?.extends as DefaultTemplateName)
        }
        customSetup={!isDefaultTemplate ? templateConfig : undefined}
        options={{
          autoReload: true,
          autorun: true,
          classes: {
            "sp-tab-container": s.tabContainer,
            "cm-scroller": s.scroller
          },
          visibleFiles: templateConfig?.editableFiles || undefined,
          activeFile: templateConfig?.activeFile || undefined
        }}
        files={{
          ...templateConfig?.files,
          ...sandbox?.files
        }}
        theme={BASEMENT_THEME}
      >
        <SandpackLayout className="!grid !h-[640px] w-full grid-rows-2 lg:!grid-cols-2 lg:grid-rows-1">
          <div className="grid h-full grid-rows-[42px_1fr] bg-brand-k">
            <SandboxToolbar activeTab={activeTab} setActiveTab={setActiveTab} />

            <div className="relative h-full flex-1 overflow-x-hidden">
              <SandpackPreview
                className={cn(
                  "!absolute !inset-0",
                  activeTab === "console" && "!hidden"
                )}
                showOpenInCodeSandbox={false}
                showRefreshButton={false}
                showRestartButton={false}
              />

              <SandpackConsole
                className={cn(
                  "!absolute !inset-0",
                  activeTab === "preview" && "!hidden"
                )}
              />
            </div>
          </div>

          <div className="relative h-full overflow-auto">
            <SandpackCodeEditor
              closableTabs={false}
              showLineNumbers
              showTabs
              initMode="user-visible"
              className="!h-full"
            />
          </div>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}
