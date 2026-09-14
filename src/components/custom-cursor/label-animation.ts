// Shared by cursor hover labels and the cat-clock panel.
export const cursorLabelAnimation = {
  initial: { opacity: 0, scale: 0 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 },
  transition: { duration: 0.2 }
} as const
