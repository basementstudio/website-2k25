"use client"

import { useDeviceOrientation } from "@/hooks/use-device-orientation"
import { cn } from "@/utils/cn"

export const GyroscopeToggle = () => {
  const { permission, isEnabled, requestPermission, setIsEnabled } =
    useDeviceOrientation()

  if (permission === "unsupported") return null

  const handleClick = async () => {
    if (permission === "granted") {
      setIsEnabled(!isEnabled)
    } else if (permission === "prompt") {
      await requestPermission()
    }
  }

  const isActive = permission === "granted" && isEnabled
  const isDenied = permission === "denied"

  return (
    <button
      onClick={handleClick}
      disabled={isDenied}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        isActive
          ? "border-brand-g1 bg-brand-g1/10 text-brand-g1"
          : "border-brand-w1/30 text-brand-w2 hover:border-brand-w1/50",
        isDenied && "cursor-not-allowed opacity-50"
      )}
      aria-label={
        isActive ? "Disable gyroscope camera" : "Enable gyroscope camera"
      }
    >
      <GyroscopeIcon className="h-4 w-4" />
      <span className="xs:inline hidden">
        {isDenied
          ? "Gyroscope Denied"
          : isActive
            ? "Gyroscope On"
            : "Enable Gyroscope"}
      </span>
      <span className="xs:hidden">
        {isDenied ? "Denied" : isActive ? "On" : "Gyro"}
      </span>
    </button>
  )
}

const GyroscopeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16.466 7.5C15.643 4.237 13.952 2 12 2 9.239 2 7 6.477 7 12s2.239 10 5 10c.342 0 .677-.069 1-.2" />
    <path d="m15.194 13.707 3.814 1.86-1.86 3.814" />
    <path d="M19 15.57c-1.804.885-4.274 1.43-7 1.43-5.523 0-10-2.239-10-5s4.477-5 10-5c4.838 0 8.873 1.718 9.8 4" />
  </svg>
)
