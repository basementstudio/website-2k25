import { Vector2, Vector3 } from "three"
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
  focusedElement: string | null
  setFocusedElement: (elementId: string | null) => void
  updateFormField: (
    field: keyof ContactStore["formData"],
    value: string
  ) => void
  clearFormData: () => void
  worker: Worker | null
  setWorker: (worker: Worker | null) => void
  screenPosition: Vector2 | null
  screenDimensions: Vector2 | null
  screenTransform: {
    scale: number
    distance: number
    matrix: number[]
    cameraMatrix: number[]
  } | null
  updateScreenData: (
    position: Vector2,
    dimensions: Vector2,
    transform: {
      scale: number
      distance: number
      matrix: number[]
      cameraMatrix: number[]
    }
  ) => void
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
  focusedElement: null,
  setFocusedElement: (elementId) =>
    set((state) => {
      if (state.worker) {
        state.worker.postMessage({
          type: "update-focus",
          focusedElement: elementId
        })
      }
      return { focusedElement: elementId }
    }),
  clearFormData: () =>
    set((state) => {
      const emptyFormData = {
        name: "",
        company: "",
        email: "",
        budget: "",
        message: ""
      }

      if (state.worker) {
        state.worker.postMessage({
          type: "update-form",
          formData: emptyFormData
        })
      }

      return { formData: emptyFormData }
    }),
  updateFormField: (field, value) =>
    set((state) => {
      const newFormData = {
        ...state.formData,
        [field]: value.toUpperCase()
      }

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
  setWorker: (worker) => {
    if (worker) {
      worker.addEventListener("message", (e) => {
        if (e.data.type === "update-screen-data") {
          set({
            screenPosition: e.data.position,
            screenDimensions: e.data.dimensions,
            screenTransform: {
              scale: e.data.scale,
              distance: e.data.distance,
              matrix: e.data.matrix,
              cameraMatrix: e.data.cameraMatrix
            }
          })
        }
      })
    }
    set({ worker })
  },
  screenPosition: null,
  screenDimensions: null,
  screenTransform: null,
  updateScreenData: (position, dimensions, transform) =>
    set({
      screenPosition: position,
      screenDimensions: dimensions,
      screenTransform: transform
    })
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
