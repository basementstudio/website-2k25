import { create } from "zustand"

interface ContactStore {
  isContactOpen: boolean
  setIsContactOpen: (isContactOpen: boolean) => void
  formData: {
    name: string
    company: string
    email: string
    budget: string
    message: string
  }
  updateFormField: (
    field: keyof ContactStore["formData"],
    value: string
  ) => void
  worker: Worker | null
  setWorker: (worker: Worker | null) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  setIsContactOpen: (isContactOpen) => set({ isContactOpen }),
  formData: {
    name: "",
    company: "",
    email: "",
    budget: "",
    message: ""
  },
  updateFormField: (field, value) =>
    set((state) => {
      const newFormData = {
        ...state.formData,
        [field]: value.toUpperCase()
      }

      console.log("[ContactStore] Updating field:", field, "with value:", value)
      console.log("[ContactStore] Worker exists:", !!state.worker)

      // Send form updates to the worker
      if (state.worker) {
        state.worker.postMessage({
          type: "update-form",
          formData: newFormData
        })
      }

      return { formData: newFormData }
    }),
  worker: null,
  setWorker: (worker) => set({ worker })
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
