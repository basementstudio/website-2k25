import { create } from "zustand"

interface ContactStore {
  isContactOpen: boolean
  setIsContactOpen: (isContactOpen: boolean) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  setIsContactOpen: (isContactOpen) => set({ isContactOpen })
}))

if (typeof window !== "undefined") {
  let prevPathname = window.location.pathname
  const observer = new MutationObserver(() => {
    const currentPathname = window.location.pathname
    if (currentPathname !== prevPathname) {
      prevPathname = currentPathname
      useContactStore.getState().setIsContactOpen(false)
    }
  })

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true
  })
}
