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

import s from "./sandbox.module.css"
import SandboxToolbar from "./toolbar"

export default function Sandbox() {
  const [activeTab, setActiveTab] = useState<"preview" | "console">("preview")

  return (
    <div className="mt-24 w-full">
      <SandpackProvider
        template="react-ts"
        options={{
          autoReload: true,
          autorun: true,
          classes: {
            "sp-tabs": s.tabs,
            "sp-tab-button": s.tabButton
          }
        }}
        theme={{
          colors: {
            surface1: "#000000",
            surface2: "#252525",
            surface3: "#191919",
            clickable: "#999999",
            base: "#808080",
            disabled: "#4D4D4D",
            hover: "#C5C5C5",
            accent: "#e6e6e6",
            error: "#ff4d00",
            errorSurface: "#000000"
          },
          syntax: {
            plain: "#ffffff",
            comment: {
              color: "#757575",
              fontStyle: "italic"
            },
            keyword: "#4dffb9",
            tag: "#4dffb9",
            punctuation: "#ffffff",
            definition: "#ff4d00",
            property: "#e6e6e6",
            static: "#ff4d00",
            string: "#00ff9b"
          },
          font: {
            body: "var(--font-geist-sans)",
            mono: "var(--font-geist-mono)"
          }
        }}
      >
        <SandpackLayout className="!grid !h-[640px] !grid-cols-2">
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

          <SandpackCodeEditor
            closableTabs={false}
            showLineNumbers
            showTabs
            initMode="user-visible"
            className="!h-full"
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}
