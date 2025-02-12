"use client"

import {
  UnstyledOpenInCodeSandboxButton,
  useSandpack,
  useSandpackConsole
} from "@codesandbox/sandpack-react"
import * as Tooltip from "@radix-ui/react-tooltip"
import type { Dispatch, SetStateAction } from "react"

import { cn } from "@/utils/cn"

export default function SandboxToolbar({
  activeTab,
  setActiveTab
}: {
  activeTab: string
  setActiveTab: Dispatch<SetStateAction<"preview" | "console">>
}) {
  const { dispatch } = useSandpack()
  const { reset } = useSandpackConsole({
    resetOnPreviewRestart: false,
    showSyntaxError: true
  })

  const handleRefresh = () => {
    dispatch({ type: "refresh" })
  }

  const handleClearConsole = () => {
    reset()
  }

  const actions = [
    {
      id: "refresh",
      label: "Refresh",
      icon: Icons.refresh,
      onClick: handleRefresh
    },
    {
      id: "clear-console",
      label: "Clear console",
      icon: Icons.clearConsole,
      onClick: handleClearConsole
    }
  ]

  return (
    <div className="flex h-full items-center justify-between border-b border-brand-w2/20 px-4">
      <div className="flex items-center gap-x-4">
        <button
          className={cn(
            "text-p text-brand-g1",
            activeTab === "preview" && "text-brand-w1"
          )}
          onClick={() => setActiveTab("preview")}
        >
          Preview
        </button>
        <button
          className={cn(
            "text-p text-brand-g1",
            activeTab === "console" && "text-brand-w1"
          )}
          onClick={() => setActiveTab("console")}
        >
          Console
        </button>
      </div>

      <Tooltip.Provider delayDuration={500} skipDelayDuration={500}>
        <div className="flex items-center gap-x-1.5">
          <Tooltip.Root key="open-in-code-sandbox">
            <Tooltip.Trigger asChild>
              <UnstyledOpenInCodeSandboxButton className="rounded-sm border border-brand-g2 p-1 text-p text-brand-g1 transition-colors duration-300 hover:bg-brand-g2/50">
                {Icons.openInCodeSandbox}
              </UnstyledOpenInCodeSandboxButton>
            </Tooltip.Trigger>

            <Tooltip.Content
              side="top"
              sideOffset={12}
              className="rounded-md border border-brand-g2 bg-brand-k px-2 py-1 text-p text-brand-g1"
            >
              <p>Open in CodeSandbox</p>
            </Tooltip.Content>
          </Tooltip.Root>

          {actions.map((action) => (
            <Tooltip.Root key={action.id}>
              <Tooltip.Trigger asChild>
                <button
                  key={action.id}
                  className="rounded-sm border border-brand-g2 p-1 text-p text-brand-g1 transition-colors duration-300 hover:bg-brand-g2/50"
                  onClick={action.onClick}
                >
                  {action.icon}
                </button>
              </Tooltip.Trigger>

              <Tooltip.Content
                side="top"
                sideOffset={12}
                className="rounded-md border border-brand-g2 bg-brand-k px-2 py-1 text-p text-brand-g1"
              >
                <p>{action.label}</p>
              </Tooltip.Content>
            </Tooltip.Root>
          ))}
        </div>
      </Tooltip.Provider>
    </div>
  )
}

const Icons = {
  openInCodeSandbox: (
    <svg className="size-4" fill="none" viewBox="0 0 17 16">
      <g clipPath="url(#clip0_4283_20378)">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M.5 5.251V4.25l.463-.192 7.25-3L8.5.938l.287.12 7.25 3 .463.19v1.003l-.463.192-7.25 3-.287.119-.287-.119-7.25-3zm0 3.207V6.835l.537.222L8.5 10.145l7.463-3.088.537-.222v1.623L8.787 11.65l-.287.119-.287-.119zm0 3.25v-1.623l.537.222L8.5 13.395l7.463-3.088.537-.222v1.623L8.787 14.9l-.287.119-.287-.119zm8-4.77L3.212 4.75 8.5 2.562l5.289 2.188z"
          clipRule="evenodd"
        ></path>
      </g>
      <defs>
        <clipPath id="clip0_4283_20378">
          <path fill="currentColor" d="M.5 0h16v16H.5z"></path>
        </clipPath>
      </defs>
    </svg>
  ),
  clearConsole: (
    <svg className="size-4" fill="none" viewBox="0 0 17 16">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="m12.97 13.53.53.53L14.56 13l-.53-.53L9.56 8l4.47-4.47.53-.53-1.06-1.06-.53.53L8.5 6.94 4.03 2.47l-.53-.53L2.44 3l.53.53L7.44 8l-4.47 4.47-.53.53 1.06 1.06.53-.53L8.5 9.06z"
        clipRule="evenodd"
      ></path>
    </svg>
  ),
  refresh: (
    <svg
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m17 1 4 4-4 4"></path>
      <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"></path>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
    </svg>
  )
}
